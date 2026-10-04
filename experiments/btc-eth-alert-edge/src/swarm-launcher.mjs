import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const DEFAULT_MANIFEST = path.join(ROOT, "swarm-manifest.json");
const DEFAULT_FORBIDDEN = [
  "place_live_orders",
  "modify_live_alert_runtime",
  "read_exchange_account_or_wallet_credentials",
  "use_paid_apis",
];

const pct = (n) => Number.isFinite(n) ? `${(n * 100).toFixed(1)}%` : "n/a";
const round = (n, d = 4) => Number.isFinite(n) ? Number(n.toFixed(d)) : null;

function parseArgs(argv) {
  const out = { mode: "dry-run", manifestPath: DEFAULT_MANIFEST };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") out.mode = "dry-run";
    else if (arg === "--mode") out.mode = argv[++i];
    else if (arg.startsWith("--mode=")) out.mode = arg.slice("--mode=".length);
    else if (arg === "--manifest") out.manifestPath = path.resolve(argv[++i]);
    else if (arg.startsWith("--manifest=")) out.manifestPath = path.resolve(arg.slice("--manifest=".length));
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!["dry-run", "local", "openclaw"].includes(out.mode)) {
    throw new Error(`Unsupported mode "${out.mode}". Use dry-run, local, or openclaw.`);
  }
  return out;
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

function relPath(file) {
  return path.relative(ROOT, file).replaceAll(path.sep, "/");
}

function resolveManifestPath(manifest, value, runId) {
  return path.join(ROOT, value.replaceAll("{run_id}", runId));
}

function enabledJobs(manifest) {
  return manifest.jobs.filter((job) => job.enabled !== false);
}

function validateManifest(manifest) {
  const errors = [];
  if (manifest.manifest_version !== 1) errors.push("manifest_version must be 1");
  if (!manifest.status?.includes("research-only")) errors.push("status must be research-only");
  if (!Array.isArray(manifest.jobs) || manifest.jobs.length === 0) errors.push("jobs must be a non-empty array");
  const ids = new Set();
  for (const [index, job] of (manifest.jobs ?? []).entries()) {
    const prefix = `jobs[${index}]`;
    for (const field of ["job_id", "agent_id", "description", "scope", "artifact_path"]) {
      if (!job[field] || typeof job[field] !== "string") errors.push(`${prefix}.${field} is required`);
    }
    if (ids.has(job.job_id)) errors.push(`${prefix}.job_id is duplicated: ${job.job_id}`);
    ids.add(job.job_id);
    if (!Array.isArray(job.inputs) || job.inputs.length === 0) errors.push(`${prefix}.inputs must be non-empty`);
    if (!Array.isArray(job.forbidden_actions)) errors.push(`${prefix}.forbidden_actions must be an array`);
    if (!job.output_schema || typeof job.output_schema !== "object") errors.push(`${prefix}.output_schema is required`);
    if (job.enabled !== false && !job.artifact_path.includes("{run_id}")) {
      errors.push(`${prefix}.artifact_path must include {run_id}`);
    }
  }
  return errors;
}

async function assertInputsExist(manifest, runId) {
  const missing = [];
  const inputPaths = new Set([
    ...(manifest.inputs ?? []),
    ...enabledJobs(manifest).flatMap((job) => job.inputs ?? []),
  ]);
  for (const input of inputPaths) {
    if (input.includes("*")) continue;
    const file = resolveManifestPath(manifest, input, runId);
    try {
      await fs.access(file);
    } catch {
      missing.push(input);
    }
  }
  if (missing.length) throw new Error(`Missing manifest input(s): ${missing.join(", ")}`);
}

async function loadBundle() {
  const featureTable = await readJson(path.join(ROOT, "results", "agent-swarm-feature-table.json"));
  const scoreboard = await readJson(path.join(ROOT, "results", "agent-scoreboard.json"));
  const slices = await readJson(path.join(ROOT, "results", "agent-scoreboard-slices.json"));
  return {
    featureTable,
    scoreboard,
    slices,
    rows: featureTable.featureRows ?? [],
  };
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] ?? "unknown";
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function labelRates(rows) {
  const counts = countBy(rows, "label");
  return {
    total: rows.length,
    counts,
    follow_rate: rows.length ? round((counts.follow ?? 0) / rows.length) : null,
    fade_rate: rows.length ? round((counts.fade ?? 0) / rows.length) : null,
    noisy_rate: rows.length ? round((counts.noisy ?? 0) / rows.length) : null,
  };
}

function topAgent(scoreboard) {
  return scoreboard.scoreboard?.[0] ?? null;
}

function baseArtifact(job, manifest, runId) {
  return {
    job_id: job.job_id,
    agent_id: job.agent_id,
    generated: new Date().toISOString(),
    run_id: runId,
    status: manifest.status,
    source_files_used: job.inputs.filter((input) => !input.includes("*")),
    forbidden_actions: [...new Set([...(manifest.global_forbidden_actions ?? DEFAULT_FORBIDDEN), ...job.forbidden_actions])],
  };
}

function postAlertDatasetAudit(job, manifest, runId, bundle) {
  const { scoreboard, rows } = bundle;
  const qualityFlagCounts = scoreboard.qualityFlagCounts ?? {};
  return {
    ...baseArtifact(job, manifest, runId),
    sample_counts: {
      finalized_rows: scoreboard.rowCount ?? rows.length,
      clean_rows: scoreboard.cleanRows ?? rows.filter((row) => row.dataQuality === "clean").length,
      tainted_rows: scoreboard.taintedRows ?? rows.filter((row) => row.dataQuality !== "clean").length,
      labels: scoreboard.labelCounts ?? countBy(rows, "label"),
      assets: countBy(rows, "asset"),
      trigger_kinds: countBy(rows, "triggerKind"),
    },
    quality_flags: qualityFlagCounts,
    top_findings: [
      `${scoreboard.rowCount ?? rows.length} finalized alert rows are available for research scoring.`,
      `${scoreboard.cleanRows ?? 0} rows are clean; ${scoreboard.taintedRows ?? 0} rows are tainted by strict quality flags.`,
      `Labels are split as ${Object.entries(scoreboard.labelCounts ?? {}).map(([k, v]) => `${k} ${v}`).join(", ")}.`,
    ],
    blocked: [
      "Clean sample is far below a promotion threshold.",
      "Book-quality flags dominate the current dataset.",
      "No out-of-sample live-gate validation exists in this launcher.",
    ],
    promotable: false,
  };
}

function relativeContextReview(job, manifest, runId, bundle) {
  const { rows, scoreboard } = bundle;
  const byAlignment = Object.entries(countBy(rows, "relativeAlignment")).map(([alignment, count]) => {
    const subset = rows.filter((row) => row.relativeAlignment === alignment);
    return { alignment, count, labels: labelRates(subset) };
  });
  const byBeta = Object.entries(countBy(rows, "betaBucket")).map(([bucket, count]) => {
    const subset = rows.filter((row) => row.betaBucket === bucket);
    return { bucket, count, labels: labelRates(subset) };
  });
  return {
    ...baseArtifact(job, manifest, runId),
    sample_counts: {
      rows: rows.length,
      relative_alignment_counts: scoreboard.relativeAlignmentCounts ?? countBy(rows, "relativeAlignment"),
      beta_bucket_counts: countBy(rows, "betaBucket"),
    },
    alignment_counts: {
      by_alignment: byAlignment,
      by_beta_bucket: byBeta,
    },
    top_findings: [
      `Relative alignment is mixed/contradictory across ${rows.length} rows, not a clean gate.`,
      `Confirmed relative context appears in ${(scoreboard.relativeAlignmentCounts ?? {}).confirmed ?? 0} rows.`,
      "Current relative reads are useful for hypotheses and slice routing, not promotion.",
    ],
    blocked: [
      "No relative-context slice has enough clean, forward-confirmed evidence.",
      "Relative matrix is scored against the same small finalized alert set.",
    ],
    promotable: false,
  };
}

function orderflowBookQualityAudit(job, manifest, runId, bundle) {
  const { rows, scoreboard } = bundle;
  const withCvd = rows.filter((row) => Number.isFinite(row.cvdPctOfVolume)).length;
  const freshBook = rows.filter((row) => row.bookFresh === true).length;
  const staleBook = rows.filter((row) => row.bookFresh !== true).length;
  const negativeAge = rows.filter((row) => Number.isFinite(row.bookAgeMs) && row.bookAgeMs < 0).length;
  return {
    ...baseArtifact(job, manifest, runId),
    sample_counts: {
      rows: rows.length,
      with_cvd: withCvd,
      fresh_book: freshBook,
      stale_or_missing_book: staleBook,
      negative_book_age: negativeAge,
    },
    orderflow_quality: {
      cvd_coverage: rows.length ? round(withCvd / rows.length) : null,
      fresh_book_coverage: rows.length ? round(freshBook / rows.length) : null,
      quality_flag_counts: scoreboard.qualityFlagCounts ?? {},
      top_book_agent: (scoreboard.scoreboard ?? []).find((agent) => agent.agentId === "book_pressure_scout") ?? null,
      top_cvd_agent: (scoreboard.scoreboard ?? []).find((agent) => agent.agentId === "cvd_confirmation_scout") ?? null,
    },
    top_findings: [
      `${freshBook}/${rows.length} rows have fresh book evidence under the current feature flags.`,
      `${negativeAge} rows have negative book age and must stay blocked until the clock/freshness issue is explained.`,
      "Orderflow scouts are measurable, but current accuracy is not promotable.",
    ],
    blocked: [
      "Book freshness is too sparse.",
      "Known negative-age and score-above-max quality flags remain in the historical row set.",
      "Changing orderflow scoring would touch alert behavior and is outside this task.",
    ],
    promotable: false,
  };
}

function sliceWatchlistReview(job, manifest, runId, bundle) {
  const slices = bundle.slices.slices ?? [];
  const watchlist = slices
    .map((slice) => {
      const top = slice.topAgents?.[0] ?? {};
      return {
        dimension: slice.dimension,
        value: slice.value,
        row_count: slice.rowCount,
        label_counts: slice.labelCounts,
        top_agent: top.agentId ?? null,
        top_accuracy: top.accuracy ?? null,
        top_evaluated: top.evaluated ?? null,
        read: top.accuracy >= 0.58 ? "research-watch" : "learning-or-weak",
      };
    })
    .sort((a, b) => (b.top_accuracy ?? -1) - (a.top_accuracy ?? -1) || b.row_count - a.row_count)
    .slice(0, 10);
  return {
    ...baseArtifact(job, manifest, runId),
    sample_counts: {
      scored_rows: bundle.slices.rowCount,
      min_slice_rows: bundle.slices.minSliceRows,
      slice_count: slices.length,
    },
    watchlist,
    top_findings: [
      `${slices.length} grouped slices meet the minimum row filter.`,
      "Some slices are useful watchlist leads, but all are small-sample and research-only.",
      "The watchlist should guide targeted data collection, not alert routing.",
    ],
    blocked: [
      "Slice evidence is same-dataset and low-sample.",
      "No slice has passed risk-governor promotion conditions.",
    ],
    promotable: false,
  };
}

function riskGovernorReview(job, manifest, runId, bundle) {
  const top = topAgent(bundle.scoreboard);
  const cleanRows = bundle.scoreboard.cleanRows ?? 0;
  const blockers = [
    cleanRows < 30 ? `clean_rows ${cleanRows} < 30 minimum` : null,
    !top || top.evaluated < 20 ? "top agent has fewer than 20 evaluated rows" : null,
    !top || (top.accuracy ?? 0) < 0.58 ? `top agent accuracy ${pct(top?.accuracy)} < 58.0% watch threshold` : null,
    Object.keys(bundle.scoreboard.qualityFlagCounts ?? {}).length ? "quality flags remain present in the research dataset" : null,
    "no out-of-sample promotion test has been run",
    "executor remains explicitly closed",
  ].filter(Boolean);
  return {
    ...baseArtifact(job, manifest, runId),
    promotion_decision: "blocked",
    risk_blockers: blockers,
    top_findings: [
      `Best current scout is ${top?.agentId ?? "none"} at ${pct(top?.accuracy)} accuracy on ${top?.evaluated ?? 0} evaluated rows.`,
      `Only ${cleanRows} clean rows are available.`,
      "Research artifacts can be regenerated locally, but no live gate is approved.",
    ],
    blocked: blockers,
    promotable: false,
  };
}

function synthesisReport(job, manifest, runId, bundle, artifacts) {
  const top = topAgent(bundle.scoreboard);
  const blockers = [...new Set(artifacts.flatMap((artifact) => artifact.blocked ?? artifact.risk_blockers ?? []))];
  return {
    ...baseArtifact(job, manifest, runId),
    run_summary: {
      launcher_mode: "local",
      jobs_completed: artifacts.length + 1,
      finalized_rows: bundle.scoreboard.rowCount,
      clean_rows: bundle.scoreboard.cleanRows,
      tainted_rows: bundle.scoreboard.taintedRows,
      slice_count: bundle.slices.slices?.length ?? 0,
      best_agent: top ? {
        agent_id: top.agentId,
        accuracy: top.accuracy,
        evaluated: top.evaluated,
        coverage: top.coverage,
      } : null,
      promotion_decision: "blocked",
    },
    top_findings: [
      "The launcher now runs explicit file-backed research jobs from a manifest.",
      `${bundle.scoreboard.rowCount} finalized rows and ${bundle.slices.slices?.length ?? 0} slices were fanned into local artifacts.`,
      "The risk governor blocks all promotion; this is not a live swarm deployment.",
    ],
    blocked: blockers,
    promotable: false,
  };
}

const LOCAL_JOB_HANDLERS = {
  post_alert_dataset_audit: postAlertDatasetAudit,
  relative_context_review: relativeContextReview,
  orderflow_book_quality_audit: orderflowBookQualityAudit,
  slice_watchlist_review: sliceWatchlistReview,
  risk_governor_review: riskGovernorReview,
  synthesis_report: synthesisReport,
};

async function runLocal(manifest, runId) {
  const bundle = await loadBundle();
  const artifacts = [];
  for (const job of enabledJobs(manifest)) {
    const handler = LOCAL_JOB_HANDLERS[job.job_id];
    if (!handler) throw new Error(`No local handler for job ${job.job_id}`);
    const artifact = job.job_id === "synthesis_report"
      ? handler(job, manifest, runId, bundle, artifacts)
      : handler(job, manifest, runId, bundle);
    const artifactPath = resolveManifestPath(manifest, job.artifact_path, runId);
    await writeJson(artifactPath, artifact);
    artifacts.push(artifact);
  }
  await writeRunSummary(manifest, runId, artifacts, bundle);
  return artifacts;
}

async function runOpenClawPlan(manifest, runId) {
  const dir = resolveManifestPath(manifest, manifest.run_output_dir, runId);
  const promptDir = path.join(dir, "openclaw-prompts");
  await fs.mkdir(promptDir, { recursive: true });
  const promptFiles = [];
  for (const job of enabledJobs(manifest)) {
    const prompt = [
      `# RALPH Swarm Research Job: ${job.job_id}`,
      "",
      `Agent: ${job.agent_id}`,
      `Status: ${manifest.status}`,
      "",
      "## Scope",
      job.scope,
      "",
      "## Inputs",
      ...job.inputs.map((input) => `- ${input.replaceAll("{run_id}", runId)}`),
      "",
      "## Forbidden Actions",
      ...[...(manifest.global_forbidden_actions ?? []), ...job.forbidden_actions].map((action) => `- ${action}`),
      "",
      "## Required Output Schema",
      "```json",
      JSON.stringify(job.output_schema, null, 2),
      "```",
      "",
      `Write the JSON artifact to: ${job.artifact_path.replaceAll("{run_id}", runId)}`,
      "",
      "Research-only. Do not touch live watcher, alert, execution, key, account, or wallet behavior.",
    ].join("\n");
    const file = path.join(promptDir, `${job.job_id}.md`);
    await fs.writeFile(file, `${prompt}\n`);
    promptFiles.push(relPath(file));
  }
  await writeJson(path.join(dir, "openclaw-plan.json"), {
    run_id: runId,
    status: manifest.status,
    mode: "openclaw",
    note: "Prepared prompts only; no child sessions were launched by this script.",
    prompt_files: promptFiles,
  });
  return promptFiles;
}

async function writeRunSummary(manifest, runId, artifacts, bundle) {
  const dir = resolveManifestPath(manifest, manifest.run_output_dir, runId);
  const top = topAgent(bundle.scoreboard);
  const blockers = [...new Set(artifacts.flatMap((artifact) => artifact.blocked ?? artifact.risk_blockers ?? []))];
  const json = {
    run_id: runId,
    generated: new Date().toISOString(),
    status: manifest.status,
    mode: "local",
    manifest: "swarm-manifest.json",
    jobs_completed: artifacts.map((artifact) => artifact.job_id),
    artifacts: artifacts.map((artifact) => {
      const job = manifest.jobs.find((candidate) => candidate.job_id === artifact.job_id);
      return {
        job_id: artifact.job_id,
        path: job?.artifact_path.replaceAll("{run_id}", runId),
        promotable: artifact.promotable,
      };
    }),
    dataset: {
      finalized_rows: bundle.scoreboard.rowCount,
      clean_rows: bundle.scoreboard.cleanRows,
      tainted_rows: bundle.scoreboard.taintedRows,
      label_counts: bundle.scoreboard.labelCounts,
      quality_flag_counts: bundle.scoreboard.qualityFlagCounts,
      slice_count: bundle.slices.slices?.length ?? 0,
    },
    best_agent: top ? {
      agent_id: top.agentId,
      accuracy: top.accuracy,
      evaluated: top.evaluated,
      coverage: top.coverage,
    } : null,
    promotion_decision: "blocked",
    risk_blockers: blockers,
  };
  await writeJson(path.join(dir, "run-summary.json"), json);

  const md = `# RALPH Local Swarm Run

Run: ${runId}

Status: research-only, no live execution. This run did not touch watcher services, alert wording, thresholds, risk, sizing, accounts, wallets, keys, paid APIs, or execution.

## Dataset

- Finalized rows: ${bundle.scoreboard.rowCount}
- Clean rows: ${bundle.scoreboard.cleanRows}
- Tainted rows: ${bundle.scoreboard.taintedRows}
- Labels: ${Object.entries(bundle.scoreboard.labelCounts ?? {}).map(([k, v]) => `${k} ${v}`).join(", ")}
- Quality flags: ${Object.entries(bundle.scoreboard.qualityFlagCounts ?? {}).map(([k, v]) => `${k} ${v}`).join(", ") || "none"}
- Grouped slices: ${bundle.slices.slices?.length ?? 0}

## Jobs

${artifacts.map((artifact) => `- ${artifact.job_id}: ${artifact.promotable ? "promotable" : "blocked/research-only"}`).join("\n")}

## Strongest Findings

- Best current scout: ${top?.agentId ?? "none"} at ${pct(top?.accuracy)} on ${top?.evaluated ?? 0} evaluated rows.
- Only ${bundle.scoreboard.cleanRows} clean rows are available, so the risk governor blocks promotion.
- Slice watchlist leads are useful for targeted research, not live gates.

## Blockers

${blockers.map((blocker) => `- ${blocker}`).join("\n")}

## Outputs

- \`results/swarm-runs/${runId}/run-summary.json\`
- \`results/swarm-runs/${runId}/run-summary.md\`
- \`results/swarm-runs/${runId}/artifacts/*.json\`
`;
  await fs.writeFile(path.join(dir, "run-summary.md"), md);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifest = await readJson(args.manifestPath);
  const errors = validateManifest(manifest);
  if (errors.length) throw new Error(`Invalid manifest:\n- ${errors.join("\n- ")}`);
  const runId = new Date().toISOString().replaceAll(":", "").replace(/\.\d{3}Z$/, "Z");
  await assertInputsExist(manifest, runId);

  const plan = {
    ok: true,
    mode: args.mode,
    status: manifest.status,
    manifest: relPath(args.manifestPath),
    run_id: runId,
    run_output_dir: manifest.run_output_dir.replaceAll("{run_id}", runId),
    enabled_jobs: enabledJobs(manifest).map((job) => ({
      job_id: job.job_id,
      agent_id: job.agent_id,
      artifact_path: job.artifact_path.replaceAll("{run_id}", runId),
    })),
  };

  if (args.mode === "dry-run") {
    console.log(JSON.stringify({ ...plan, launched: false }, null, 2));
    return;
  }

  if (args.mode === "openclaw") {
    const promptFiles = await runOpenClawPlan(manifest, runId);
    console.log(JSON.stringify({ ...plan, launched: false, prompt_files: promptFiles }, null, 2));
    return;
  }

  const artifacts = await runLocal(manifest, runId);
  console.log(JSON.stringify({
    ...plan,
    launched: true,
    jobs_completed: artifacts.map((artifact) => artifact.job_id),
    promotable: artifacts.some((artifact) => artifact.promotable),
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
