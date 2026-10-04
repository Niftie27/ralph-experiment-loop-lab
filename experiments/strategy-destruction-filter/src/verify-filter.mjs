#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { validateCandidateSet } from "./candidate-spec.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CONFIG_PATH = path.join(ROOT, "config.default.json");
const REPORT_JSON = path.join(ROOT, "results", "filter-report.json");
const REPORT_MD = path.join(ROOT, "results", "filter-report.md");
const FEATURE_STUDY_JSON = path.join(ROOT, "results", "feature-study.json");
const FEATURE_STUDY_MD = path.join(ROOT, "results", "feature-study.md");
const VELOCITY_REPLAY_JSON = path.join(ROOT, "results", "velocity-replay-adapter-feasibility.json");
const VELOCITY_REPLAY_MD = path.join(ROOT, "results", "velocity-replay-adapter-feasibility.md");
const BINANCE_AGGTRADES_REPLAY_JSON = path.join(ROOT, "results", "binance-aggtrades-velocity-replay.json");
const BINANCE_AGGTRADES_REPLAY_MD = path.join(ROOT, "results", "binance-aggtrades-velocity-replay.md");
const AGGTRADES_EVENT_STUDY_JSON = path.join(ROOT, "results", "aggtrades-velocity-event-study.json");
const AGGTRADES_EVENT_STUDY_MD = path.join(ROOT, "results", "aggtrades-velocity-event-study.md");
const WICK_EVENT_STUDY_JSON = path.join(ROOT, "results", "wick-alert-feedback-event-study.json");
const WICK_EVENT_STUDY_MD = path.join(ROOT, "results", "wick-alert-feedback-event-study.md");
const SHADOW_PNL_LEDGER_JSON = path.join(ROOT, "results", "shadow-pnl-ledger.json");
const SHADOW_PNL_LEDGER_MD = path.join(ROOT, "results", "shadow-pnl-ledger.md");
const PLANNED_LEVEL_PROXY_JSON = path.join(ROOT, "results", "planned-level-proxy-replay.json");
const PLANNED_LEVEL_PROXY_MD = path.join(ROOT, "results", "planned-level-proxy-replay.md");
const PLANNED_LEVEL_PROXY_BASELINE_JSON = path.join(ROOT, "results", "planned-level-proxy-baseline-check.json");
const PLANNED_LEVEL_PROXY_BASELINE_MD = path.join(ROOT, "results", "planned-level-proxy-baseline-check.md");
const USDM_ORDERFLOW_BATCH_JSON = path.join(ROOT, "results", "usdm-orderflow-demo-sim-batch.json");
const USDM_ORDERFLOW_BATCH_MD = path.join(ROOT, "results", "usdm-orderflow-demo-sim-batch.md");
const USDM_ORDERFLOW_MANIFEST_JSON = path.join(ROOT, "results", "usdm-orderflow-balanced-manifest.json");
const USDM_ORDERFLOW_MANIFEST_MD = path.join(ROOT, "results", "usdm-orderflow-balanced-manifest.md");
const USDM_FULL_PATH_JSON = path.join(ROOT, "results", "usdm-orderflow-targeted-full-path-mfe-mae-rescore.json");
const USDM_FULL_PATH_MD = path.join(ROOT, "results", "usdm-orderflow-targeted-full-path-mfe-mae-rescore.md");
const STRATEGY_SPAM_JSON = path.join(ROOT, "results", "strategy-spam-funnel-btc-first-pass.json");
const STRATEGY_SPAM_MD = path.join(ROOT, "results", "strategy-spam-funnel-btc-first-pass.md");
const STRATEGY_SPAM_STRESS_JSON = path.join(ROOT, "results", "strategy-spam-survivor-stress.json");
const STRATEGY_SPAM_STRESS_MD = path.join(ROOT, "results", "strategy-spam-survivor-stress.md");
const DATA_ACCESS_JSON = path.join(ROOT, "results", "market-data-access.json");
const FILTER_DRIFT_JSON = path.join(ROOT, "results", "filter-drift-report.json");
const FILTER_DRIFT_MD = path.join(ROOT, "results", "filter-drift-report.md");
const ATAS_ACCESS_JSON = path.join(ROOT, "..", "..", "outputs", "atas-access-audit.json");
const ATAS_ACCESS_MD = path.join(ROOT, "..", "..", "outputs", "atas-access-audit.md");
const BACKTEST_READINESS_JSON = path.join(ROOT, "..", "..", "outputs", "backtest-readiness-audit.json");
const BACKTEST_READINESS_MD = path.join(ROOT, "..", "..", "outputs", "backtest-readiness-audit.md");
const ADVERSARIAL_IMPROVEMENT_JSON = path.join(ROOT, "..", "..", "outputs", "ralph-adversarial-improvement-report.json");
const ADVERSARIAL_IMPROVEMENT_MD = path.join(ROOT, "..", "..", "outputs", "ralph-adversarial-improvement-report.md");
const ATAS_ORDERFLOW_SCHEMA = path.join(ROOT, "schemas", "atas-orderflow-event.schema.json");
const SURVIVORS_JSON = path.join(ROOT, "results", "survivors.json");
const REJECTED_JSONL = path.join(ROOT, "results", "rejected-ideas.jsonl");

const config = JSON.parse(await fs.readFile(CONFIG_PATH, "utf8"));
const candidates = JSON.parse(await fs.readFile(path.join(ROOT, "candidates", "seed-strategies.json"), "utf8"));
const report = JSON.parse(await fs.readFile(REPORT_JSON, "utf8"));
const markdown = await fs.readFile(REPORT_MD, "utf8");
const featureStudy = JSON.parse(await fs.readFile(FEATURE_STUDY_JSON, "utf8"));
const featureStudyMarkdown = await fs.readFile(FEATURE_STUDY_MD, "utf8");
const velocityReplay = JSON.parse(await fs.readFile(VELOCITY_REPLAY_JSON, "utf8"));
const velocityReplayMarkdown = await fs.readFile(VELOCITY_REPLAY_MD, "utf8");
const binanceAggTradesReplay = JSON.parse(await fs.readFile(BINANCE_AGGTRADES_REPLAY_JSON, "utf8"));
const binanceAggTradesReplayMarkdown = await fs.readFile(BINANCE_AGGTRADES_REPLAY_MD, "utf8");
const aggTradesEventStudy = JSON.parse(await fs.readFile(AGGTRADES_EVENT_STUDY_JSON, "utf8"));
const aggTradesEventStudyMarkdown = await fs.readFile(AGGTRADES_EVENT_STUDY_MD, "utf8");
const wickEventStudy = JSON.parse(await fs.readFile(WICK_EVENT_STUDY_JSON, "utf8"));
const wickEventStudyMarkdown = await fs.readFile(WICK_EVENT_STUDY_MD, "utf8");
const shadowPnlLedger = JSON.parse(await fs.readFile(SHADOW_PNL_LEDGER_JSON, "utf8"));
const shadowPnlLedgerMarkdown = await fs.readFile(SHADOW_PNL_LEDGER_MD, "utf8");
const plannedLevelProxy = JSON.parse(await fs.readFile(PLANNED_LEVEL_PROXY_JSON, "utf8"));
const plannedLevelProxyMarkdown = await fs.readFile(PLANNED_LEVEL_PROXY_MD, "utf8");
const plannedLevelProxyBaseline = JSON.parse(await fs.readFile(PLANNED_LEVEL_PROXY_BASELINE_JSON, "utf8"));
const plannedLevelProxyBaselineMarkdown = await fs.readFile(PLANNED_LEVEL_PROXY_BASELINE_MD, "utf8");
const usdmOrderflowBatch = JSON.parse(await fs.readFile(USDM_ORDERFLOW_BATCH_JSON, "utf8"));
const usdmOrderflowBatchMarkdown = await fs.readFile(USDM_ORDERFLOW_BATCH_MD, "utf8");
const usdmOrderflowManifest = JSON.parse(await fs.readFile(USDM_ORDERFLOW_MANIFEST_JSON, "utf8"));
const usdmOrderflowManifestMarkdown = await fs.readFile(USDM_ORDERFLOW_MANIFEST_MD, "utf8");
const usdmFullPath = JSON.parse(await fs.readFile(USDM_FULL_PATH_JSON, "utf8"));
const usdmFullPathMarkdown = await fs.readFile(USDM_FULL_PATH_MD, "utf8");
const strategySpam = JSON.parse(await fs.readFile(STRATEGY_SPAM_JSON, "utf8"));
const strategySpamMarkdown = await fs.readFile(STRATEGY_SPAM_MD, "utf8");
const strategySpamStress = JSON.parse(await fs.readFile(STRATEGY_SPAM_STRESS_JSON, "utf8"));
const strategySpamStressMarkdown = await fs.readFile(STRATEGY_SPAM_STRESS_MD, "utf8");
const dataAccess = JSON.parse(await fs.readFile(DATA_ACCESS_JSON, "utf8"));
const filterDrift = JSON.parse(await fs.readFile(FILTER_DRIFT_JSON, "utf8"));
const filterDriftMarkdown = await fs.readFile(FILTER_DRIFT_MD, "utf8");
const atasAccess = JSON.parse(await fs.readFile(ATAS_ACCESS_JSON, "utf8"));
const atasAccessMarkdown = await fs.readFile(ATAS_ACCESS_MD, "utf8");
const backtestReadiness = JSON.parse(await fs.readFile(BACKTEST_READINESS_JSON, "utf8"));
const backtestReadinessMarkdown = await fs.readFile(BACKTEST_READINESS_MD, "utf8");
const adversarialImprovement = JSON.parse(await fs.readFile(ADVERSARIAL_IMPROVEMENT_JSON, "utf8"));
const adversarialImprovementMarkdown = await fs.readFile(ADVERSARIAL_IMPROVEMENT_MD, "utf8");
const atasOrderflowSchema = JSON.parse(await fs.readFile(ATAS_ORDERFLOW_SCHEMA, "utf8"));
const survivors = JSON.parse(await fs.readFile(SURVIVORS_JSON, "utf8"));
const rejectedLines = (await fs.readFile(REJECTED_JSONL, "utf8")).trim().split("\n").filter(Boolean);
const rejectedRows = rejectedLines.map((line, index) => parseRejectedRow(line, index));
const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));

assert(report.status === "research-only-no-live-execution", "report must remain research-only");
const candidateValidation = validateCandidateSet(candidates);
assert(candidateValidation.ok, `candidate spec validation failed: ${candidateValidation.errors.join("; ")}`);
assert(config.status === report.status, "config/report status mismatch");
assert(Array.isArray(report.sources) && report.sources.length > 0, "missing source records");
assert(report.evaluation?.split?.method === "purged_embargo_entry_time", "missing purged/embargo split config");
assert(report.evaluation?.baseline?.method === "time_matched_alternating_direction", "missing baseline config");
assert(report.multipleTesting?.label === "approximate_multiple_testing_deflated_sharpe", "missing labeled deflated-Sharpe calibration");
assert(config.gates.minOutOfSampleExpectancyR > 0, "out-of-sample expectancy gate must remain positive");
assert(Array.isArray(report.verdicts) && report.verdicts.length > 0, "missing verdicts");
assert(report.totals.variants === report.verdicts.length, "variant total mismatch");
assert(report.totals.survivors === survivors.length, "survivor total mismatch");
assert(Number.isInteger(report.totals.survivorShapes), "missing survivor shape total");
assert(Array.isArray(report.survivorShapes), "missing survivor shape diagnostics");
assert(report.totals.survivorShapes === report.survivorShapes.length, "survivor shape total mismatch");
assert(report.totals.survivorShapes <= report.totals.survivors, "survivor shape count cannot exceed raw survivors");
assert(report.gateGroupDiagnostics && typeof report.gateGroupDiagnostics === "object", "missing gate group diagnostics");
assert(report.antiOverfitControls && typeof report.antiOverfitControls === "object", "missing anti-overfit controls");
assert(report.antiOverfitControls.split?.method === "purged_embargo_entry_time", "anti-overfit controls missing purged/embargo split");
assert(report.antiOverfitControls.baseline?.method === "time_matched_alternating_direction", "anti-overfit controls missing time-matched baseline");
assert(report.antiOverfitControls.walkForward?.method === "equal_trade_count_chronological_folds", "anti-overfit controls missing walk-forward method");
assert(Number.isInteger(report.antiOverfitControls.purgedBoundary?.candidateTrades), "anti-overfit controls missing candidate boundary count");
assert(report.antiOverfitControls.purgedBoundary.candidateTrades === report.antiOverfitControls.purgedBoundary.baselineTrades, "anti-overfit controls candidate/baseline boundary mismatch");
for (const key of ["headline_pass", "deflated_sharpe_pass", "oos_pass", "baseline_pass", "walk_forward_pass"]) {
  const group = report.gateGroupDiagnostics[key];
  assert(group, `missing gate group ${key}`);
  assert(group.totalCount === report.totals.variants, `${key} denominator mismatch`);
  assert(group.passCount === group.rejectedPassCount + group.survivorPassCount, `${key} pass count mismatch`);
  assert(Number.isFinite(group.passRate), `${key} missing pass rate`);
}
assert(Array.isArray(report.gateGroupDiagnostics.psr_diagnostic_band?.bands), "missing PSR diagnostic bands");
assert(report.gateGroupDiagnostics.psr_diagnostic_band.bands.some((band) => band.id === "gte_0_95"), "missing PSR >=0.95 band");
assert(report.gateGroupDiagnostics.effective_shape_pass?.effectiveSurvivorShapes === report.totals.survivorShapes, "effective shape diagnostic mismatch");
assert(markdown.includes("## Survivor Shape Diagnostics"), "markdown missing survivor shape diagnostics");
assert(markdown.includes("## Gate Group Diagnostics"), "markdown missing gate group diagnostics");
assert(markdown.includes("## Anti-Overfit / Split Hygiene"), "markdown missing anti-overfit split hygiene section");
assert(markdown.includes("Chronological split: purged_embargo_entry_time"), "markdown missing chronological split method");
assert(markdown.includes("Purged/embargo boundary:"), "markdown missing purged/embargo boundary summary");
assert(markdown.includes("Walk-forward diagnostic: equal_trade_count_chronological_folds"), "markdown missing walk-forward split diagnostic");
assert(report.totals.rejected === rejectedLines.length, "rejected jsonl count mismatch");
assert(rejectedRows.length === report.totals.rejected, "parsed rejected jsonl count mismatch");
assert(markdown.startsWith("# Strategy Destruction Filter Report"), "markdown title mismatch");
assert(markdown.includes("Status: research-only-no-live-execution."), "markdown missing research-only status");
assert(markdown.includes("## Gates"), "markdown missing gates");
assert(markdown.includes("## Evaluation"), "markdown missing evaluation section");
assert(filterDrift.status === "research-only-drift-report", "filter drift report must remain research-only");
assert(filterDrift.current?.generatedAt === report.generatedAt, "filter drift current report timestamp mismatch");
assert(filterDrift.totals?.current?.survivorShapes === report.totals.survivorShapes, "filter drift survivor shape total mismatch");
assert(filterDrift.decision?.noThresholdChange === true, "filter drift report must preserve no-threshold-change decision");
assert(filterDrift.decision?.promotionChanged === false, "filter drift report must not promote a strategy");
assert(filterDriftMarkdown.startsWith("# Strategy Filter Drift Report"), "filter drift markdown title mismatch");
assert(filterDriftMarkdown.includes("No threshold change: yes"), "filter drift markdown missing no-threshold-change statement");
assert(atasOrderflowSchema.title === "RALPH ATAS Orderflow Event", "ATAS orderflow schema title mismatch");
assert(atasOrderflowSchema.properties?.btcGate?.properties?.regime?.enum?.includes("BTC_RISK_TRANSITION") === false, "ATAS schema should use canonical BTC_TRANSITION enum");
assert(atasOrderflowSchema.properties?.btcGate?.properties?.regime?.enum?.includes("BTC_TRANSITION"), "ATAS schema missing canonical BTC_TRANSITION enum");
assert(atasOrderflowSchema.properties?.validation?.properties?.noLiveChange?.const === true, "ATAS schema must require noLiveChange true");
assert(atasAccess.status === "research-only-access-audit", "ATAS access audit must remain research-only");
assert([
  "no_local_atas_access_detected",
  "dev_runtime_partial_no_atas_install",
  "local_install_detected",
  "manual_csv_active__automatic_access_unproven",
].includes(atasAccess.accessVerdict?.status), "ATAS access audit verdict invalid");
if (atasAccess.accessVerdict?.status === "manual_csv_active__automatic_access_unproven") {
  assert(atasAccess.accessVerdict.canUseManualCsvNow === true, "manual ATAS CSV route must be explicitly usable");
  assert(atasAccess.accessVerdict.canPullDirectlyNow === false, "manual ATAS CSV route must not imply direct automatic access");
  assert(atasAccess.manualCsvEvidence?.primarySchema === "Time;Bids;;;;Ask;Delta", "manual ATAS CSV route missing Bid/Ask Tape schema");
}
assert(atasAccess.proposedExportPath?.eventSchema === "experiments/strategy-destruction-filter/schemas/atas-orderflow-event.schema.json", "ATAS access audit schema route mismatch");
assert(atasAccess.boundary.includes("no ATAS install"), "ATAS access audit boundary missing install statement");
assert(atasAccessMarkdown.startsWith("# ATAS Access Audit"), "ATAS access markdown title mismatch");
assert(backtestReadiness.status === "research-only-backtest-readiness-audit", "backtest readiness audit must remain research-only");
assert(backtestReadiness.checks?.some((item) => item.id === "purged-embargo-split" && item.pass === true), "backtest readiness audit must verify purged/embargo split accounting");
assert(backtestReadinessMarkdown.startsWith("# Backtest Readiness Audit"), "backtest readiness markdown title mismatch");
assert(adversarialImprovement.status === "research-only-adversarial-improvement-loop", "adversarial improvement report must remain research-only");
assert(adversarialImprovement.boundaries?.liveTrading === false, "adversarial improvement report must forbid live trading");
assert(adversarialImprovement.telegramGate?.notifyTomas === false || typeof adversarialImprovement.telegramGate?.reason === "string", "adversarial improvement report missing Telegram gate reason");
assert(adversarialImprovementMarkdown.startsWith("# RALPH Adversarial Improvement Report"), "adversarial improvement markdown title mismatch");
assert(featureStudy.status === "research-only-no-live-execution", "feature study must remain research-only");
assert(featureStudy.purpose === "feature-quality-diagnostics-before-new-strategy-candidates", "feature study purpose mismatch");
assert(featureStudyMarkdown.startsWith("# Feature Study Report"), "feature study markdown title mismatch");
assert(velocityReplay.status === "research-only-no-live-execution", "velocity replay report must remain research-only");
assert(velocityReplay.feasibility?.oneMinuteCandles?.canReconstructVolumeVelocityRatio === false, "1m replay must not overclaim exact volume velocity reconstruction");
assert(velocityReplay.feasibility?.binancePublicAggTrades?.status === "proposed_no_key_adapter", "missing no-key aggTrades adapter decision");
assert(velocityReplay.decision?.noLiveChange === true, "velocity replay report must preserve no-live-change boundary");
assert(velocityReplayMarkdown.startsWith("# Velocity Replay Adapter Feasibility"), "velocity replay markdown title mismatch");
assert(binanceAggTradesReplay.status === "research-only-no-live-execution", "Binance aggTrades replay must remain research-only");
assert(binanceAggTradesReplay.replayMethod?.auth === "none", "Binance aggTrades replay must stay no-key");
assert(binanceAggTradesReplay.totals?.replayOk > 0, "Binance aggTrades replay has no usable public replay checks");
assert(binanceAggTradesReplay.decision?.noLiveChange === true, "Binance aggTrades replay must preserve no-live-change boundary");
assert(binanceAggTradesReplayMarkdown.startsWith("# Binance AggTrades Velocity Replay"), "Binance aggTrades replay markdown title mismatch");
assert(aggTradesEventStudy.status === "research-only-no-live-execution", "aggTrades event study must remain research-only");
assert(aggTradesEventStudy.purpose === "low-sample-event-study-gate-before-any-new-volume-velocity-strategy-candidate", "aggTrades event study purpose mismatch");
assert(aggTradesEventStudy.gates?.minSampleForCandidate >= 10, "aggTrades event study sample gate too loose");
assert(aggTradesEventStudy.gates?.minDominantShare >= 0.75, "aggTrades event study dominant-share gate too loose");
assert(aggTradesEventStudy.decision?.candidateAdded === false, "aggTrades event study must not add candidates");
assert(aggTradesEventStudy.decision?.noLiveChange === true, "aggTrades event study must preserve no-live-change boundary");
assert(["candidate_ready", "watch_low_sample", "killed_or_no_bucket"].includes(aggTradesEventStudy.decision?.verdict), "aggTrades event study has invalid decision");
assert(aggTradesEventStudyMarkdown.startsWith("# AggTrades Velocity Event Study"), "aggTrades event study markdown title mismatch");
assert(aggTradesEventStudyMarkdown.includes("No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, risk, sizing, TP/SL, or execution changed."), "aggTrades event study markdown missing boundary statement");
assert(wickEventStudy.status === "research-only-no-live-execution", "WICK event study must remain research-only");
assert(wickEventStudy.purpose === "low-sample-wick-feedback-gate-before-any-wick-fade-strategy-candidate", "WICK event study purpose mismatch");
assert(wickEventStudy.gates?.minSampleForCandidate >= 10, "WICK event study sample gate too loose");
assert(wickEventStudy.gates?.minDominantShare >= 0.75, "WICK event study dominant-share gate too loose");
assert(wickEventStudy.decision?.candidateAdded === false, "WICK event study must not add candidates");
assert(wickEventStudy.decision?.noLiveChange === true, "WICK event study must preserve no-live-change boundary");
assert(["candidate_ready", "watch_or_kill_low_sample", "killed_or_no_bucket"].includes(wickEventStudy.decision?.verdict), "WICK event study has invalid decision");
assert(wickEventStudyMarkdown.startsWith("# WICK Alert Feedback Event Study"), "WICK event study markdown title mismatch");
assert(wickEventStudyMarkdown.includes("No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, risk, sizing, TP/SL, or execution changed."), "WICK event study markdown missing boundary statement");
assert(shadowPnlLedger.status === "research-only-no-live-execution", "shadow PnL ledger must remain research-only");
assert(shadowPnlLedger.purpose === "shadow-pnl-ledger-for-tradable-alert-plans-before-paper-or-live-promotion", "shadow PnL ledger purpose mismatch");
assert(shadowPnlLedger.decision?.candidateAdded === false, "shadow PnL ledger must not add candidates");
assert(shadowPnlLedger.decision?.noLiveChange === true, "shadow PnL ledger must preserve no-live-change boundary");
assert(shadowPnlLedgerMarkdown.startsWith("# Shadow PnL Ledger"), "shadow PnL ledger markdown title mismatch");
assert(shadowPnlLedgerMarkdown.includes("No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, risk, sizing, TP/SL, or execution changed."), "shadow PnL ledger markdown missing boundary statement");
assert(plannedLevelProxy.status === "research-only-no-live-execution", "planned-level proxy replay must remain research-only");
assert(plannedLevelProxy.source?.trades?.auth === "none", "planned-level proxy replay must stay no-key");
assert(plannedLevelProxy.gates?.requiresBtcGate === true, "planned-level proxy replay must require BTC gate");
assert(plannedLevelProxy.gates?.minFrozenEventsBeforeCandidate >= 20, "planned-level frozen-event gate too loose");
assert(plannedLevelProxy.gates?.minFetchedTradeWindowsBeforeRule >= 10, "planned-level fetched-window gate too loose");
assert(plannedLevelProxy.decision?.noLiveChange === true, "planned-level proxy replay must preserve no-live-change boundary");
assert(["schema_ready_trade_windows_low_sample", "proxy_replay_rows_ready_for_baseline_test"].includes(plannedLevelProxy.decision?.verdict), "planned-level proxy replay has invalid decision");
assert(Array.isArray(plannedLevelProxy.rows) && plannedLevelProxy.rows.length > 0, "planned-level proxy replay missing rows");
for (const row of plannedLevelProxy.rows) {
  assert(row.btcGateEntry?.regime, `${row.eventId} missing BTC gate`);
  assert(["BTC_RISK_ON", "BTC_RISK_OFF", "BTC_TRANSITION", "BTC_STALE"].includes(row.btcGateEntry.regime), `${row.eventId} invalid BTC gate`);
  assert(row.tradeWindow?.status, `${row.eventId} missing trade-window status`);
}
assert(plannedLevelProxyMarkdown.startsWith("# Planned-Level Proxy Replay"), "planned-level proxy markdown title mismatch");
assert(plannedLevelProxyMarkdown.includes("does not change live alerts, thresholds, sizing, execution, or strategy status"), "planned-level proxy markdown missing boundary statement");
assert(plannedLevelProxyBaseline.status === "research-only-no-live-execution", "planned-level proxy baseline must remain research-only");
assert(plannedLevelProxyBaseline.source?.auth === "none", "planned-level proxy baseline must stay no-key");
assert(plannedLevelProxyBaseline.gates?.requiresBtcGate === true, "planned-level proxy baseline must require BTC gate");
assert(plannedLevelProxyBaseline.gates?.requiresBaselineLiftBeforePromotion === true, "planned-level proxy baseline must require baseline lift before promotion");
assert(plannedLevelProxyBaseline.decision?.candidateAdded === false, "planned-level proxy baseline must not add candidates");
assert(plannedLevelProxyBaseline.decision?.noLiveChange === true, "planned-level proxy baseline must preserve no-live-change boundary");
assert(["watch_low_sample", "proxy_labels_baseline_promising_but_not_promoted", "proxy_labels_mixed_no_promotion"].includes(plannedLevelProxyBaseline.decision?.verdict), "planned-level proxy baseline has invalid decision");
assert(plannedLevelProxyBaselineMarkdown.startsWith("# Planned-Level Proxy Baseline Check"), "planned-level proxy baseline markdown title mismatch");
assert(plannedLevelProxyBaselineMarkdown.includes("No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, risk, sizing, TP/SL, execution, public posting, or strategy promotion changed."), "planned-level proxy baseline markdown missing boundary statement");
assert(usdmOrderflowBatch.status === "research-only-no-live-execution", "USD-M orderflow batch must remain research-only");
assert(usdmOrderflowBatch.source?.auth === "none", "USD-M orderflow batch must stay no-key");
assert(usdmOrderflowBatch.source?.archiveProvider === "binance-usdm-public-daily-archives", "USD-M orderflow batch provider mismatch");
assert(usdmOrderflowBatch.totals?.rowsWithTrades > 0, "USD-M orderflow batch missing futures trade rows");
assert(usdmOrderflowBatch.totals?.rowsWithBookDepth > 0, "USD-M orderflow batch missing bookDepth rows");
assert(usdmOrderflowBatch.decision?.candidateAdded === false, "USD-M orderflow batch must not add candidates");
assert(usdmOrderflowBatch.decision?.absorptionCandidateAdded === false, "USD-M orderflow batch must not add an absorption candidate");
assert(usdmOrderflowBatch.decision?.watcherGateChangeProposed === false, "USD-M orderflow batch must not propose watcher changes");
assert(usdmOrderflowBatch.decision?.demoSimLogicChangeProposed === false, "USD-M orderflow batch must not propose demo-sim logic changes");
assert(usdmOrderflowBatch.decision?.noLiveChange === true, "USD-M orderflow batch must preserve no-live-change boundary");
assert([
  "balanced_usdm_archive_absorption_watch_only_no_promotion",
  "absorption_context_only_no_candidate",
  "usdm_archive_features_broader_sample_ready_no_promotion",
  "usdm_archive_features_sample_ready_no_promotion",
  "usdm_archive_features_sample_empty"
].includes(usdmOrderflowBatch.decision?.verdict), "USD-M orderflow batch verdict invalid");
assert(usdmOrderflowBatch.parameters?.maxWindows >= 60, "USD-M orderflow batch should run a balanced 60+ row frozen manifest by default");
assert(usdmOrderflowBatch.parameters?.sampleMode === "balanced", "USD-M orderflow batch must use balanced sampling by default");
assert(usdmOrderflowBatch.source?.manifest === "results/usdm-orderflow-balanced-manifest.json", "USD-M orderflow batch missing frozen manifest route");
assert(usdmOrderflowBatch.decision?.killCondition?.absorptionCandidate === false, "USD-M orderflow kill condition must block absorption candidate promotion");
assert(typeof usdmOrderflowBatch.decision?.killCondition?.outsideComparableAbsorption?.meanLiftR !== "undefined", "USD-M orderflow batch missing outside-cluster absorption kill statistic");
assert(Array.isArray(usdmOrderflowBatch.comparisons?.slices), "USD-M orderflow batch missing feature outcome slices");
assert(usdmOrderflowBatch.comparisons.slices.some((slice) => slice.label === "absorptionProxy=true"), "USD-M orderflow batch missing absorption proxy comparison");
assert(Array.isArray(usdmOrderflowBatch.comparisons?.comparableFeatureSummary), "USD-M orderflow batch missing comparable feature summaries");
assert(usdmOrderflowBatch.comparisons.comparableFeatureSummary.some((row) => row.feature === "absorptionProxy" && row.scope === "outsideOriginalCluster"), "USD-M orderflow batch missing outside-cluster absorption comparison");
assert(usdmOrderflowBatchMarkdown.startsWith("# USD-M Orderflow DEMO-SIM Batch"), "USD-M orderflow batch markdown title mismatch");
assert(usdmOrderflowBatchMarkdown.includes("## Feature Outcome Comparison"), "USD-M orderflow batch markdown missing feature outcome comparison");
assert(usdmOrderflowBatchMarkdown.includes("## Comparable Setup/Regime Buckets"), "USD-M orderflow batch markdown missing comparable bucket comparison");
assert(usdmOrderflowBatchMarkdown.includes("No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, paper/demo alert logic, risk, sizing, TP/SL, execution, public posting, or strategy promotion changed."), "USD-M orderflow batch markdown missing boundary statement");
assert(usdmOrderflowManifest.status === "frozen-balanced-demo-sim-manifest", "USD-M orderflow manifest status mismatch");
assert(usdmOrderflowManifest.selectedRows >= 60 && usdmOrderflowManifest.selectedRows <= 120, "USD-M orderflow manifest must stay in 60-120 row range");
for (const key of ["dates", "weeks", "symbols", "setups", "directions", "timeframes", "btcGates", "outcomes"]) {
  assert(Array.isArray(usdmOrderflowManifest.summary?.[key]) && usdmOrderflowManifest.summary[key].length > 0, `USD-M orderflow manifest missing ${key} distribution`);
}
assert(usdmOrderflowManifest.summary.outsideOriginalClusterRows > usdmOrderflowManifest.summary.originalClusterRows, "USD-M orderflow manifest must mainly test outside the original cluster");
assert(usdmOrderflowManifestMarkdown.startsWith("# USD-M Orderflow Balanced Manifest"), "USD-M orderflow manifest markdown title mismatch");
assert(usdmFullPath.status === "research-only-no-live-execution", "USD-M full-path rescore must remain research-only");
assert(usdmFullPath.sources?.targetedBatch === "results/usdm-orderflow-targeted-comparable-demo-sim-batch.json", "USD-M full-path rescore must use targeted USD-M batch");
assert(usdmFullPath.sources?.replay === "../btc-eth-alert-edge/results/historical-demo-sim-replay.json", "USD-M full-path rescore must use historical DEMO-SIM replay");
assert(usdmFullPath.totals?.rowsWithFullPath >= 60, "USD-M full-path rescore needs broad full-path coverage");
assert(usdmFullPath.decision?.candidateAdded === false, "USD-M full-path rescore must not add candidates");
assert(usdmFullPath.decision?.absorptionCandidateAdded === false, "USD-M full-path rescore must not add an absorption candidate");
assert(usdmFullPath.decision?.watcherGateChangeProposed === false, "USD-M full-path rescore must not propose watcher changes");
assert(usdmFullPath.decision?.demoSimLogicChangeProposed === false, "USD-M full-path rescore must not propose demo-sim logic changes");
assert(usdmFullPath.decision?.noLiveChange === true, "USD-M full-path rescore must preserve no-live-change boundary");
assert([
  "full_path_absorption_research_feature_watch_only_no_promotion",
  "full_path_absorption_context_only_no_candidate",
  "full_path_absorption_inconclusive_low_comparable_rows"
].includes(usdmFullPath.decision?.verdict), "USD-M full-path rescore verdict invalid");
assert(Array.isArray(usdmFullPath.comparisons?.comparableSummary), "USD-M full-path rescore missing comparable summary");
assert(usdmFullPath.comparisons.comparableSummary.some((row) => row.feature === "absorptionProxy" && row.scope === "outsideOriginalCluster"), "USD-M full-path rescore missing outside-cluster absorption summary");
assert(usdmFullPath.totals.rowsMissingFullPath <= 4, "USD-M full-path rescore has unexpected missing full-path rows");
assert(usdmFullPathMarkdown.startsWith("# USD-M Absorption Full-Path MFE/MAE Rescore"), "USD-M full-path markdown title mismatch");
assert(usdmFullPathMarkdown.includes("## Comparable Full-Path Buckets"), "USD-M full-path markdown missing comparable bucket section");
assert(usdmFullPathMarkdown.includes("No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, paper/demo alert logic, risk, sizing, TP/SL, execution, public posting, or strategy promotion changed."), "USD-M full-path markdown missing boundary statement");
assert(strategySpam.status === "research-only-strategy-spam-funnel-no-promotion", "strategy spam funnel must remain research-only");
assert(strategySpam.decision?.candidateImport === false, "strategy spam funnel must not import candidates");
assert(strategySpam.decision?.strategyPromotion === false, "strategy spam funnel must not promote a strategy");
assert(strategySpam.decision?.liveOrPaperBehaviorChange === false, "strategy spam funnel must not change live/paper behavior");
assert(strategySpam.totals?.variants >= 50, "strategy spam funnel should test at least 50 variants");
assert(strategySpam.totals.survivors === strategySpam.survivors.length, "strategy spam survivor total mismatch");
assert(strategySpam.totals.rejected + strategySpam.totals.survivors === strategySpam.totals.variants, "strategy spam verdict total mismatch");
assert(strategySpam.batchManifest?.activeModeIds?.includes("btc_basic_spam"), "strategy spam missing BTC batch mode");
assert(strategySpam.batchManifest?.activeModeIds?.includes("alt_btc_gated_continuation_fade"), "strategy spam missing BTC-gated alt batch mode");
assert(["manual_full", "recurring"].includes(strategySpam.runProfile?.profile), "strategy spam run profile invalid");
assert(strategySpam.runProfile?.recurringMaxVariants <= 300, "strategy spam recurring profile variant budget too high");
assert(strategySpam.btcGate?.requiredForAltSignals === true, "strategy spam alt rows must require BTC gate");
assert(strategySpam.btcGate?.allowedRegimes?.long?.includes("BTC_RISK_ON"), "strategy spam missing BTC_RISK_ON long gate");
assert(strategySpam.btcGate?.allowedRegimes?.short?.includes("BTC_RISK_OFF"), "strategy spam missing BTC_RISK_OFF short gate");
assert(Object.values(strategySpam.btcGate?.diagnostics || {}).every((row) => row.blockedSignals > 0), "strategy spam BTC gate must block some alt signals");
assert(Number.isInteger(strategySpam.totals?.effectiveMetricShapes), "strategy spam missing effective metric shape total");
assert(Number.isInteger(strategySpam.totals?.duplicateMetricShapes), "strategy spam missing duplicate metric shape total");
assert(strategySpam.effectiveShapeDiagnostics?.method === "exact_rounded_metric_signature_excluding_variant_id_and_params", "strategy spam effective shape method mismatch");
assert(strategySpamMarkdown.includes("## BTC Gate"), "strategy spam markdown missing BTC gate section");
assert(strategySpamMarkdown.includes("## Effective Shape Dedupe"), "strategy spam markdown missing dedupe section");
assert(strategySpamMarkdown.includes("No live trading, orders, keys, paid APIs"), "strategy spam markdown missing boundary statement");
assert(strategySpamStress.status === "research-only-strategy-spam-survivor-stress" || strategySpamStress.status === "research-only-no-spam-survivor-to-stress", "strategy spam survivor stress status invalid");
assert(strategySpamStress.decision?.candidateImport === false, "strategy spam survivor stress must not import candidates");
assert(strategySpamStress.decision?.strategyPromotion === false, "strategy spam survivor stress must not promote a strategy");
assert(strategySpamStress.decision?.liveOrPaperBehaviorChange === false, "strategy spam survivor stress must not change live/paper behavior");
assert(strategySpamStress.decision?.schedulerOrCronChange === false, "strategy spam survivor stress must not change scheduler/cron");
if (strategySpamStress.status === "research-only-strategy-spam-survivor-stress") {
  assert(strategySpamStress.survivor?.variantId === strategySpam.survivors?.[0]?.variantId, "strategy spam stress survivor mismatch");
  assert(Array.isArray(strategySpamStress.cases) && strategySpamStress.cases.length >= 5, "strategy spam stress missing case rows");
  assert(strategySpamStress.cases.some((item) => item.id === "strict_btc_gate"), "strategy spam stress missing strict BTC gate case");
  assert(strategySpamStress.cases.some((item) => item.id === "extra_20bps_round_trip"), "strategy spam stress missing extra cost case");
  assert(strategySpamStress.cases.some((item) => item.id === "transfer_ETH_4h"), "strategy spam stress missing ETH transfer case");
  assert(strategySpamStress.stress?.removeBestWeek?.remainder, "strategy spam stress missing remove-best-week check");
  assert(strategySpamStress.boundary?.schedulerOrCronChange === false, "strategy spam stress boundary must forbid scheduler changes");
  assert(strategySpamStressMarkdown.includes("## Remove-Best Stresses"), "strategy spam stress markdown missing remove-best section");
}
assert(Array.isArray(featureStudy.studies) && featureStudy.studies.length === report.sources.length, "feature study/source count mismatch");
assert(featureStudy.studies.some((study) => study.symbol === "HYPE" && study.rowsWithFunding > 0), "feature study missing HYPE funding rows");
assert(featureStudy.studies.some((study) => study.symbol === "HYPE" && study.rowsWithOpenInterestChange > 0), "feature study missing HYPE open-interest rows");
assert(dataAccess.status === "research-only-no-live-execution", "data access audit must remain research-only");
assert(dataAccess.summary?.accessible >= 5, "data access audit has too few accessible rails");
assert(dataAccess.checks?.some((check) => check.id === "bybit-HYPEUSDT-open-interest" && check.status === "accessible"), "missing verified HYPE open-interest rail");
assert(dataAccess.checks?.some((check) => check.id === "hyperliquid-HYPE-funding" && check.status === "accessible"), "missing verified Hyperliquid HYPE funding rail");
assert(report.sources.some((source) => source.symbol === "HYPE" && source.features?.funding?.candlesWithFunding > 0), "HYPE funding features not attached");
assert(report.sources.some((source) => source.symbol === "HYPE" && source.features?.openInterest?.candlesWithOpenInterestChange > 0), "HYPE open-interest features not attached");

for (const source of report.sources) {
  assert(source.lookbackDays >= 1825, `${source.symbol} ${source.timeframe} historical lookback is too shallow`);
  assert(source.candles >= 1000, `${source.symbol} ${source.timeframe} has too few candles`);
  assert(source.firstCandleTime && source.lastCandleTime, `${source.symbol} ${source.timeframe} missing candle coverage`);
  assert(source.source, `${source.symbol} ${source.timeframe} missing source label`);
  assert(source.provider && source.market && source.exchangeSymbol, `${source.symbol} ${source.timeframe} missing market identity`);
}

for (const item of report.verdicts) {
  assert(item.candidateId && item.variantId && item.family, "verdict missing identity");
  assert(item.stats?.sample >= 0, `${item.variantId} missing sample`);
  assert(item.stats?.deflatedSharpeCalibration?.label === "approximate_multiple_testing_deflated_sharpe", `${item.variantId} missing deflated-Sharpe calibration label`);
  assert(item.splitStats?.inSample?.sample >= 0, `${item.variantId} missing in-sample stats`);
  assert(item.splitStats?.outOfSample?.sample >= 0, `${item.variantId} missing out-of-sample stats`);
  assert(item.splitStats.inSample.sample + item.splitStats.outOfSample.sample === item.stats.sample, `${item.variantId} split sample mismatch`);
  assert(item.splitMetadata?.method === "purged_embargo_entry_time", `${item.variantId} missing purged/embargo split metadata`);
  assert(Number.isInteger(item.splitMetadata.purgedBoundaryTrades) && item.splitMetadata.purgedBoundaryTrades >= 0, `${item.variantId} missing purged boundary count`);
  assert(item.splitMetadata.purgedBoundaryBaselineTrades === item.splitMetadata.purgedBoundaryTrades, `${item.variantId} purged candidate/baseline count mismatch`);
  assert(item.splitMetadata.inSampleTrades + item.splitMetadata.outOfSampleTrades === item.stats.sample, `${item.variantId} split metadata candidate sample mismatch`);
  assert(item.splitMetadata.baselineInSampleTrades + item.splitMetadata.baselineOutOfSampleTrades === item.baseline?.stats?.sample, `${item.variantId} split metadata baseline sample mismatch`);
  assert(Array.isArray(item.splitMetadata.splitIndexByRun), `${item.variantId} missing per-run split metadata`);
  for (const splitRun of item.splitMetadata.splitIndexByRun) {
    assert(Number.isInteger(splitRun.purgeBars) && splitRun.purgeBars >= 0, `${item.variantId} invalid purgeBars`);
    assert(Number.isInteger(splitRun.embargoBars) && splitRun.embargoBars >= 0, `${item.variantId} invalid embargoBars`);
    assert(splitRun.purgedBoundaryBaselineTrades === splitRun.purgedBoundaryTrades, `${item.variantId} per-run purged baseline mismatch`);
    assert(splitRun.inSampleTrades === splitRun.baselineInSampleTrades, `${item.variantId} per-run in-sample baseline mismatch`);
    assert(splitRun.outOfSampleTrades === splitRun.baselineOutOfSampleTrades, `${item.variantId} per-run out-of-sample baseline mismatch`);
  }
  assert(item.baseline?.stats?.sample === item.stats.sample, `${item.variantId} baseline sample mismatch`);
  assert(item.baseline?.comparison?.method === "time_matched_alternating_direction", `${item.variantId} missing baseline comparison`);
  assert(item.walkForward?.method === "equal_trade_count_chronological_folds", `${item.variantId} missing walk-forward diagnostic`);
  assert(Array.isArray(item.walkForward.folds), `${item.variantId} walk-forward folds must be array`);
  assert(item.walkForward.folds.length === item.walkForward.foldCount, `${item.variantId} walk-forward fold count mismatch`);
  assert(["rejected", "survived_research_gate"].includes(item.verdict?.status), `${item.variantId} invalid status`);
  assert(Array.isArray(item.verdict.failures), `${item.variantId} failures must be array`);
  assert(Array.isArray(item.worstSlices), `${item.variantId} missing worst slices`);
  if (item.verdict.status === "survived_research_gate") {
    const validWalkForwardFolds = item.walkForward.folds.filter((fold) => fold.sample > 0);
    const requiredPositiveFolds = Math.ceil(validWalkForwardFolds.length * 0.6);
    const outOfSampleFoldCount = validWalkForwardFolds.length - Math.floor(validWalkForwardFolds.length * 0.7);
    assert(item.stats.sample >= config.gates.minSample, `${item.variantId} survived below sample gate`);
    assert(item.stats.deflatedSharpe >= config.gates.minDeflatedSharpe, `${item.variantId} survived below deflated Sharpe gate`);
    assert(item.stats.profitFactor >= config.gates.minProfitFactor, `${item.variantId} survived below profit factor gate`);
    assert(item.stats.expectancyR >= config.gates.minExpectancyR, `${item.variantId} survived below expectancy gate`);
    assert(item.splitStats.outOfSample.sample >= config.gates.minOutOfSampleSample, `${item.variantId} survived below out-of-sample sample gate`);
    assert(item.splitStats.outOfSample.expectancyR >= config.gates.minOutOfSampleExpectancyR, `${item.variantId} survived below out-of-sample expectancy gate`);
    assert(item.splitStats.outOfSample.expectancyR > 0, `${item.variantId} survived with non-positive out-of-sample expectancy`);
    assert(item.baseline.comparison.expectancyLiftR >= config.gates.minBaselineExpectancyLiftR, `${item.variantId} survived below baseline lift gate`);
    assert(item.baseline.comparison.outOfSampleExpectancyLiftR >= config.gates.minBaselineExpectancyLiftR, `${item.variantId} survived below out-of-sample baseline lift gate`);
    assert(validWalkForwardFolds.length >= 5, `${item.variantId} survived without enough walk-forward folds`);
    assert(item.walkForward.positiveFolds >= requiredPositiveFolds, `${item.variantId} survived without majority-positive walk-forward folds`);
    assert(item.walkForward.positiveBaselineLiftFolds >= requiredPositiveFolds, `${item.variantId} survived without majority-positive baseline-lift folds`);
    assert(item.walkForward.positiveOutOfSampleFolds >= outOfSampleFoldCount, `${item.variantId} survived without all diagnostic out-of-sample folds clearing the OOS gate`);
    assert(Number.isFinite(item.walkForward.minFoldExpectancyR), `${item.variantId} survived without finite walk-forward worst fold`);
  }
}

for (const row of rejectedRows) {
  const candidate = candidateById.get(row.candidateId);
  assert(candidate, `${row.variantId} references unknown candidate ${row.candidateId}`);
  assert(row.idea === candidate.idea, `${row.variantId} rejected ledger idea mismatch`);
  assertSemanticObjectEqual(row.thesis, candidate.thesis, `${row.variantId} thesis`);
  assertSemanticObjectEqual(row.dataRequirements, candidate.dataRequirements, `${row.variantId} dataRequirements`);
  assertSemanticObjectEqual(row.validation, candidate.validation, `${row.variantId} validation`);
  assert(typeof row.thesis?.mechanism === "string" && row.thesis.mechanism.trim(), `${row.variantId} missing thesis.mechanism`);
  assert(typeof row.thesis?.edgeSpeed === "string" && row.thesis.edgeSpeed.trim(), `${row.variantId} missing thesis.edgeSpeed`);
  assert(typeof row.thesis?.expectedBehavior === "string" && row.thesis.expectedBehavior.trim(), `${row.variantId} missing thesis.expectedBehavior`);
  assert(typeof row.thesis?.falsifiableClaim === "string" && row.thesis.falsifiableClaim.trim(), `${row.variantId} missing thesis.falsifiableClaim`);
  assert(Array.isArray(row.dataRequirements?.markets) && row.dataRequirements.markets.length > 0, `${row.variantId} missing dataRequirements.markets`);
  assert(Array.isArray(row.dataRequirements?.requiredFeatures) && row.dataRequirements.requiredFeatures.length > 0, `${row.variantId} missing dataRequirements.requiredFeatures`);
  assert(Number.isFinite(row.dataRequirements?.minLookbackDays), `${row.variantId} missing dataRequirements.minLookbackDays`);
  assert(typeof row.validation?.baseline === "string" && row.validation.baseline.trim(), `${row.variantId} missing validation.baseline`);
  assert(Array.isArray(row.validation?.gates) && row.validation.gates.length > 0, `${row.variantId} missing validation.gates`);
  assert(Array.isArray(row.validation?.killCriteria) && row.validation.killCriteria.length > 0, `${row.variantId} missing validation.killCriteria`);
}

for (const study of featureStudy.studies) {
  assert(study.symbol && study.timeframe, "feature study missing market identity");
  assert(study.rows > 0, `${study.symbol} ${study.timeframe} feature study has no rows`);
  assert(Array.isArray(study.forwardBuckets), `${study.symbol} ${study.timeframe} missing feature buckets`);
  assert(study.forwardBuckets.some((bucket) => bucket.feature === "rsi14" && bucket.sample > 0), `${study.symbol} ${study.timeframe} missing RSI baseline buckets`);
  if (study.symbol === "HYPE") {
    assert(study.forwardBuckets.some((bucket) => bucket.feature === "fundingRate" && bucket.sample > 0), `${study.symbol} ${study.timeframe} missing funding buckets`);
    assert(study.forwardBuckets.some((bucket) => bucket.feature === "openInterestChangePct" && bucket.sample > 0), `${study.symbol} ${study.timeframe} missing OI buckets`);
  }
}

console.log(JSON.stringify({
  ok: true,
  status: report.status,
  variants: report.totals.variants,
  survivors: report.totals.survivors,
  rejected: report.totals.rejected,
  featureStudies: featureStudy.studies.length,
  velocityReplayVerdict: velocityReplay.decision.verdict,
  binanceAggTradesReplayVerdict: binanceAggTradesReplay.decision.verdict,
  aggTradesEventStudyVerdict: aggTradesEventStudy.decision.verdict,
  wickEventStudyVerdict: wickEventStudy.decision.verdict,
  shadowPnlLedgerVerdict: shadowPnlLedger.decision.verdict,
  usdmOrderflowBatchVerdict: usdmOrderflowBatch.decision.verdict,
  accessibleDataRails: dataAccess.summary.accessible,
  atasAccessVerdict: atasAccess.accessVerdict.status,
  backtestReadinessVerdict: backtestReadiness.summary.verdict,
  adversarialImprovementVerdict: adversarialImprovement.summary.verdict
}, null, 2));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseRejectedRow(line, index) {
  try {
    return JSON.parse(line);
  } catch (error) {
    throw new Error(`rejected jsonl row ${index + 1} is invalid JSON: ${error.message}`);
  }
}

function assertSemanticObjectEqual(actual, expected, label) {
  assert(actual && typeof actual === "object" && !Array.isArray(actual), `${label} missing semantic object`);
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${label} does not match source candidate`);
}
