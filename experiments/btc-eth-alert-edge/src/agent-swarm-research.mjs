import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const WORKSPACE = path.resolve(ROOT, "../../..");
const CONFIG_PATH = path.join(ROOT, "config.default.json");
const CANDLE_DIR = path.join(ROOT, "data", "candles");
const RESULTS_DIR = path.join(ROOT, "results");
const FEEDBACK_PATH = path.join(WORKSPACE, "crypto-updates", "runtime", "alert-feedback.jsonl");
const FEATURE_JSON_PATH = path.join(RESULTS_DIR, "agent-swarm-feature-table.json");
const FEATURE_CSV_PATH = path.join(RESULTS_DIR, "agent-swarm-feature-table.csv");
const SCOREBOARD_JSON_PATH = path.join(RESULTS_DIR, "agent-scoreboard.json");
const SCOREBOARD_MD_PATH = path.join(RESULTS_DIR, "agent-scoreboard.md");
const SCOREBOARD_SLICES_JSON_PATH = path.join(RESULTS_DIR, "agent-scoreboard-slices.json");
const SCOREBOARD_SLICES_MD_PATH = path.join(RESULTS_DIR, "agent-scoreboard-slices.md");

const WINDOWS = [1, 4, 12, 24];
const LABEL_THRESHOLD_PCT = 0.15;
const FRESHNESS_LIMIT_SEC = {
  "1h": 90 * 60,
  "4h": 5 * 60 * 60,
};

const round = (n, d = 4) => Number.isFinite(n) ? Number(n.toFixed(d)) : null;
const pct = (n) => Number.isFinite(n) ? `${(n * 100).toFixed(1)}%` : "n/a";
const iso = (seconds) => Number.isFinite(seconds) ? new Date(seconds * 1000).toISOString() : null;
const dirSign = (direction) => direction === "UP" || direction === "long" ? 1 : -1;

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function readJsonl(file) {
  const raw = await fs.readFile(file, "utf8");
  return raw
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${file}:${index + 1}: ${error.message}`);
      }
    });
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

function candleFile(symbol, timeframe) {
  return path.join(CANDLE_DIR, `binance-spot-${symbol.binanceSpotSymbol}-${timeframe}.json`);
}

async function loadMarket(config) {
  const market = new Map();
  for (const timeframe of config.timeframes) {
    const tf = timeframe.id;
    for (const symbol of config.symbols) {
      const candles = await readJson(candleFile(symbol, tf));
      market.set(`${symbol.symbol}:${tf}`, candles);
    }
  }
  return market;
}

function assetFromAlert(alert) {
  const label = alert.assetLabel?.toUpperCase();
  if (label) return label;
  const raw = alert.assetSymbol?.toUpperCase() ?? "";
  return raw.replace(/USDT$/, "");
}

function findIndexAtOrBefore(candles, seconds) {
  let lo = 0;
  let hi = candles.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (candles[mid].time <= seconds) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

function ret(candles, i, bars) {
  if (i - bars < 0) return null;
  const start = candles[i - bars].close;
  const end = candles[i].close;
  return start > 0 ? (end / start - 1) * 100 : null;
}

function candleContext(candles, i) {
  if (i < 0) return null;
  const c = candles[i];
  const out = {
    candleTime: c.time,
    candleIso: iso(c.time),
    close: c.close,
  };
  for (const bars of WINDOWS) out[`return_${bars}b_pct`] = round(ret(candles, i, bars), 4);
  return out;
}

function relativeContext(symbols, market, asset, timeframe, alertSeconds) {
  const rows = [];
  for (const symbol of symbols) {
    const candles = market.get(`${symbol.symbol}:${timeframe}`);
    if (!candles?.length) continue;
    const i = findIndexAtOrBefore(candles, alertSeconds);
    if (i < 0) continue;
    rows.push({ symbol: symbol.symbol, candles, i, candle: candles[i] });
  }
  const target = rows.find((row) => row.symbol === asset);
  if (!target) return null;

  const latestAgeSec = alertSeconds - target.candle.time;
  const fresh = latestAgeSec >= 0 && latestAgeSec <= (FRESHNESS_LIMIT_SEC[timeframe] ?? Infinity);
  const features = {
    timeframe,
    candleTime: target.candle.time,
    candleIso: iso(target.candle.time),
    candleAgeSec: latestAgeSec,
    fresh,
  };

  for (const bars of WINDOWS) {
    const assetReturn = ret(target.candles, target.i, bars);
    const ranked = rows
      .map((row) => ({ symbol: row.symbol, returnPct: ret(row.candles, row.i, bars) }))
      .filter((row) => Number.isFinite(row.returnPct))
      .sort((a, b) => b.returnPct - a.returnPct);
    const rankIndex = ranked.findIndex((row) => row.symbol === asset);
    const peers = ranked.filter((row) => row.symbol !== asset);
    const peerAvg = peers.length ? peers.reduce((sum, row) => sum + row.returnPct, 0) / peers.length : null;
    const btc = ranked.find((row) => row.symbol === "BTC");
    const eth = ranked.find((row) => row.symbol === "ETH");

    features[`usdt_return_${bars}b_pct`] = round(assetReturn, 4);
    features[`relative_rank_${bars}b`] = rankIndex >= 0 ? rankIndex + 1 : null;
    features[`relative_universe_size_${bars}b`] = ranked.length;
    features[`avg_relative_return_${bars}b_pct`] = Number.isFinite(assetReturn) && Number.isFinite(peerAvg) ? round(assetReturn - peerAvg, 4) : null;
    features[`vs_btc_return_${bars}b_pct`] = btc && Number.isFinite(assetReturn) ? round(assetReturn - btc.returnPct, 4) : null;
    features[`vs_eth_return_${bars}b_pct`] = eth && Number.isFinite(assetReturn) ? round(assetReturn - eth.returnPct, 4) : null;
  }

  return features;
}

function relativeAlignment(relative, direction) {
  if (!relative) return "unavailable";
  const sign = dirSign(direction);
  const votes = [1, 4, 12]
    .map((bars) => relative[`avg_relative_return_${bars}b_pct`])
    .filter(Number.isFinite)
    .map((value) => Math.sign(value * sign))
    .filter((value) => value !== 0);
  if (!votes.length) return "unavailable";
  const score = votes.reduce((a, b) => a + b, 0);
  if (score >= 2) return "confirmed";
  if (score <= -2) return "contradicted";
  return "mixed";
}

function betaBucket(relative) {
  if (!relative) return "unavailable";
  const usdt = relative.usdt_return_4b_pct;
  const avg = relative.avg_relative_return_4b_pct;
  if (!Number.isFinite(usdt) || !Number.isFinite(avg)) return "unavailable";
  if (Math.abs(avg) < 0.35 && Math.abs(usdt) >= 1) return "market-beta";
  if (avg >= 0.75) return "idiosyncratic-strength";
  if (avg <= -0.75) return "idiosyncratic-weakness";
  return "cross-pair-divergence";
}

function labelReview(review) {
  const checkpoint = review.checkpoints?.find((c) => c.label === "1h")
    ?? review.checkpoints?.find((c) => c.label === "30m")
    ?? review.checkpoints?.at(-1);
  const directionalMovePct = checkpoint?.directionalMovePct;
  if (!Number.isFinite(directionalMovePct)) return "unavailable";
  if (directionalMovePct >= LABEL_THRESHOLD_PCT) return "follow";
  if (directionalMovePct <= -LABEL_THRESHOLD_PCT) return "fade";
  return "noisy";
}

function joinFeedback(records) {
  const alerts = new Map();
  const reviews = new Map();
  for (const record of records) {
    if (record.type === "alert_sent" && record.alert?.id) alerts.set(record.alert.id, record.alert);
    if (record.type === "review_finalized" && record.review?.id) {
      reviews.set(record.review.id, { review: record.review, classification: record.classification ?? null });
    }
  }

  const joined = [];
  for (const [id, alert] of alerts.entries()) {
    const reviewed = reviews.get(id);
    if (!reviewed) continue;
    joined.push({
      id,
      alert,
      review: reviewed.review,
      classification: reviewed.classification,
      label: labelReview(reviewed.review)
    });
  }
  return joined.sort((a, b) => a.alert.eventTime - b.alert.eventTime);
}

function qualityFlags(alert) {
  const features = alert.evidence?.features ?? {};
  const flags = [];
  if (features.bookAgeMs !== null && features.bookAgeMs < 0) flags.push("negative_book_age");
  if (alert.evidence?.score > alert.evidence?.maxScore) flags.push("score_above_max");
  if (features.bookFresh !== true) flags.push("book_not_fresh");
  if (alert.assetLabel === "HYPE") flags.push("hype_event_only");
  return flags;
}

function buildFeatureRow(item, config, market) {
  const asset = assetFromAlert(item.alert);
  const alertSeconds = Math.floor(item.alert.eventTime / 1000);
  const evidence = item.alert.evidence ?? {};
  const ef = evidence.features ?? {};
  const candle1h = candleContext(market.get(`${asset}:1h`) ?? [], findIndexAtOrBefore(market.get(`${asset}:1h`) ?? [], alertSeconds));
  const candle4h = candleContext(market.get(`${asset}:4h`) ?? [], findIndexAtOrBefore(market.get(`${asset}:4h`) ?? [], alertSeconds));
  const relative1h = relativeContext(config.symbols, market, asset, "1h", alertSeconds);
  const relative4h = relativeContext(config.symbols, market, asset, "4h", alertSeconds);
  const primaryRelative = relative1h?.fresh ? relative1h : relative4h;
  const alignment = relativeAlignment(primaryRelative, item.alert.direction);
  const flags = qualityFlags(item.alert);

  return {
    id: item.id,
    alertIso: new Date(item.alert.eventTime).toISOString(),
    asset,
    assetSymbol: item.alert.assetSymbol,
    direction: item.alert.direction,
    triggerKind: item.alert.triggerKind,
    triggerLabel: item.alert.triggerLabel,
    triggerMovePct: round(item.alert.triggerMovePct, 4),
    price: item.alert.price,
    source: item.alert.source,
    label: item.label,
    reviewVerdict: item.classification?.verdict ?? null,
    oneHourDirectionalMovePct: round(item.review.checkpoints?.find((c) => c.label === "1h")?.directionalMovePct, 4),
    maxFavorablePct: round(item.review.maxFavorablePct, 4),
    maxAdversePct: round(item.review.maxAdversePct, 4),
    evidenceScore: evidence.score ?? null,
    evidenceMaxScore: evidence.maxScore ?? null,
    evidencePass: evidence.pass ?? null,
    cvdPctOfVolume: round(ef.cvdPctOfVolume, 4),
    bookFresh: ef.bookFresh ?? null,
    bookAgeMs: ef.bookAgeMs ?? null,
    bookImbalance: round(ef.bookImbalance, 4),
    spreadPct: round(ef.spreadPct, 6),
    top5DepthNotional: round(ef.top5DepthNotional, 2),
    depthChangePct: round(ef.depthChangePct, 4),
    volumeVelocityRatio: round(ef.volumeVelocityRatio ?? item.alert.volumeVelocityRatio, 4),
    volumeRecentNotional: round(ef.volumeRecentNotional ?? item.alert.volumeRecentNotional, 2),
    relativePrimaryTimeframe: primaryRelative?.timeframe ?? null,
    relativeAlignment: alignment,
    betaBucket: betaBucket(primaryRelative),
    qualityFlags: flags,
    dataQuality: flags.length ? "tainted" : "clean",
    candle1h,
    candle4h,
    relative1h,
    relative4h,
  };
}

function prediction(value, reason) {
  if (!value) return { prediction: "abstain", reason };
  return { prediction: value, reason };
}

const agents = [
  {
    id: "trigger_follow_scout",
    family: "market-scout",
    description: "Assumes alerts continue in their trigger direction.",
    predict: () => prediction("follow", "raw trigger continuation"),
  },
  {
    id: "trigger_fade_scout",
    family: "strategy-agent",
    description: "Assumes sharp alerts are exhaustion/fade events.",
    predict: () => prediction("fade", "sharp move mean reversion"),
  },
  {
    id: "cvd_confirmation_scout",
    family: "orderflow-scout",
    description: "Follows alerts when signed CVD supports the alert direction; fades when it opposes.",
    predict: (row) => {
      if (!Number.isFinite(row.cvdPctOfVolume)) return prediction(null, "missing CVD");
      const signed = row.cvdPctOfVolume * dirSign(row.direction);
      if (signed >= 20) return prediction("follow", "CVD aligned");
      if (signed <= -20) return prediction("fade", "CVD opposed");
      return prediction("noisy", "CVD weak");
    },
  },
  {
    id: "book_pressure_scout",
    family: "liquidity-scout",
    description: "Uses fresh public order-book imbalance and liquidity thinning.",
    predict: (row) => {
      if (row.bookFresh !== true || !Number.isFinite(row.bookImbalance)) return prediction(null, "missing fresh book");
      const signedImbalance = row.bookImbalance * dirSign(row.direction);
      if (signedImbalance >= 20 && (row.depthChangePct ?? 0) > -35) return prediction("follow", "book pressure aligned");
      if (signedImbalance <= -20 || (row.depthChangePct ?? 0) < -45) return prediction("fade", "book pressure hostile or thin");
      return prediction("noisy", "book pressure weak");
    },
  },
  {
    id: "relative_strength_scout",
    family: "relative-matrix-scout",
    description: "Follows alerts only when relative matrix confirms the direction.",
    predict: (row) => {
      if (row.relativeAlignment === "confirmed") return prediction("follow", "relative matrix confirmed");
      if (row.relativeAlignment === "contradicted") return prediction("fade", "relative matrix contradicted");
      if (row.relativeAlignment === "mixed") return prediction("noisy", "relative matrix mixed");
      return prediction(null, "relative matrix unavailable");
    },
  },
  {
    id: "velocity_continuation_scout",
    family: "trigger-specialist",
    description: "Follows velocity alerts with a meaningful volume impulse.",
    predict: (row) => {
      if (row.triggerKind !== "VELOCITY") return prediction(null, "not a velocity alert");
      if ((row.volumeVelocityRatio ?? 0) >= 2 || Math.abs(row.triggerMovePct ?? 0) >= 1) return prediction("follow", "velocity impulse");
      return prediction("noisy", "weak velocity impulse");
    },
  },
  {
    id: "wick_exhaustion_scout",
    family: "trigger-specialist",
    description: "Fades wick alerts unless orderflow and book both confirm.",
    predict: (row) => {
      if (row.triggerKind !== "WICK") return prediction(null, "not a wick alert");
      const signedCvd = Number.isFinite(row.cvdPctOfVolume) ? row.cvdPctOfVolume * dirSign(row.direction) : null;
      const signedBook = row.bookFresh && Number.isFinite(row.bookImbalance) ? row.bookImbalance * dirSign(row.direction) : null;
      if ((signedCvd ?? 0) >= 35 && (signedBook ?? 0) >= 20) return prediction("follow", "wick confirmed by flow and book");
      return prediction("fade", "wick exhaustion default");
    },
  },
  {
    id: "risk_quality_critic",
    family: "review-agent",
    description: "Abstains on tainted rows and otherwise only accepts multi-source confirmation.",
    predict: (row) => {
      if (row.dataQuality !== "clean") return prediction(null, `quality flags: ${row.qualityFlags.join(",")}`);
      const positives = [
        row.evidenceScore >= 4,
        row.relativeAlignment === "confirmed",
        row.bookFresh === true && Number.isFinite(row.bookImbalance),
      ].filter(Boolean).length;
      if (positives >= 2) return prediction("follow", "multi-source confirmation");
      return prediction("noisy", "insufficient clean confirmation");
    },
  },
  {
    id: "multi_source_follow_scout",
    family: "ensemble-agent",
    description: "Requires at least two follow signals across evidence score, CVD, book, and relative context.",
    predict: (row) => {
      const signedCvd = Number.isFinite(row.cvdPctOfVolume) ? row.cvdPctOfVolume * dirSign(row.direction) : null;
      const signedBook = row.bookFresh && Number.isFinite(row.bookImbalance) ? row.bookImbalance * dirSign(row.direction) : null;
      const followVotes = [
        row.evidenceScore >= 4,
        (signedCvd ?? 0) >= 20,
        (signedBook ?? 0) >= 20,
        row.relativeAlignment === "confirmed",
      ].filter(Boolean).length;
      const fadeVotes = [
        (signedCvd ?? 0) <= -20,
        (signedBook ?? 0) <= -20,
        row.relativeAlignment === "contradicted",
        row.betaBucket === "market-beta" && row.triggerKind === "WICK",
      ].filter(Boolean).length;
      if (followVotes >= 2 && followVotes > fadeVotes) return prediction("follow", `${followVotes} follow votes`);
      if (fadeVotes >= 2 && fadeVotes > followVotes) return prediction("fade", `${fadeVotes} fade votes`);
      return prediction("noisy", "ensemble split");
    },
  },
  {
    id: "clean_book_relative_scout",
    family: "ensemble-agent",
    description: "Only evaluates clean rows with fresh book and relative context.",
    predict: (row) => {
      if (row.dataQuality !== "clean") return prediction(null, "tainted row");
      if (row.bookFresh !== true || row.relativeAlignment === "unavailable") return prediction(null, "missing clean book/relative context");
      const signedBook = Number.isFinite(row.bookImbalance) ? row.bookImbalance * dirSign(row.direction) : null;
      if ((signedBook ?? 0) >= 20 && row.relativeAlignment === "confirmed") return prediction("follow", "clean book and relative confirmed");
      if ((signedBook ?? 0) <= -20 || row.relativeAlignment === "contradicted") return prediction("fade", "clean book or relative contradicted");
      return prediction("noisy", "clean but mixed");
    },
  },
  {
    id: "relative_contrarian_scout",
    family: "review-agent",
    description: "Tests whether current relative-strength reads are better inverted than trusted directly.",
    predict: (row) => {
      if (row.relativeAlignment === "confirmed") return prediction("fade", "relative confirmation inverted");
      if (row.relativeAlignment === "contradicted") return prediction("follow", "relative contradiction inverted");
      if (row.relativeAlignment === "mixed") return prediction("noisy", "relative mixed");
      return prediction(null, "relative matrix unavailable");
    },
  },
];

function scoreAgent(agent, rows) {
  const stats = {
    agentId: agent.id,
    family: agent.family,
    description: agent.description,
    evaluated: 0,
    abstained: 0,
    correct: 0,
    wrong: 0,
    byLabel: {},
    byPrediction: {},
    examples: [],
  };

  for (const row of rows) {
    if (!["follow", "fade", "noisy"].includes(row.label)) continue;
    const result = agent.predict(row);
    if (!result || result.prediction === "abstain") {
      stats.abstained += 1;
      continue;
    }
    stats.evaluated += 1;
    stats.byLabel[row.label] = (stats.byLabel[row.label] ?? 0) + 1;
    stats.byPrediction[result.prediction] = (stats.byPrediction[result.prediction] ?? 0) + 1;
    const correct = result.prediction === row.label;
    if (correct) stats.correct += 1;
    else stats.wrong += 1;
    if (stats.examples.length < 6) {
      stats.examples.push({
        id: row.id,
        alertIso: row.alertIso,
        asset: row.asset,
        trigger: `${row.triggerKind} ${row.triggerLabel}`,
        prediction: result.prediction,
        label: row.label,
        correct,
        reason: result.reason,
      });
    }
  }

  stats.accuracy = stats.evaluated ? round(stats.correct / stats.evaluated, 4) : null;
  stats.coverage = rows.length ? round(stats.evaluated / rows.length, 4) : null;
  return stats;
}

function csvValue(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return `"${value.join(";").replaceAll('"', '""')}"`;
  if (typeof value === "object") return `"${JSON.stringify(value).replaceAll('"', '""')}"`;
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeCsvRows(rows) {
  const columns = [
    "id", "alertIso", "asset", "direction", "triggerKind", "triggerLabel", "triggerMovePct",
    "label", "reviewVerdict", "oneHourDirectionalMovePct", "evidenceScore", "cvdPctOfVolume",
    "bookFresh", "bookAgeMs", "bookImbalance", "spreadPct", "top5DepthNotional", "depthChangePct",
    "volumeVelocityRatio", "relativePrimaryTimeframe", "relativeAlignment", "betaBucket",
    "dataQuality", "qualityFlags"
  ];
  return [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvValue(row[column])).join(",")),
  ].join("\n");
}

function markdownTable(rows) {
  if (!rows.length) return "_No rows._";
  const lines = [
    "| Agent | Family | Coverage | Accuracy | Correct | Wrong | Abstain | Read |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |",
  ];
  for (const row of rows) {
    const read = row.accuracy === null
      ? "no evaluable rows"
      : row.accuracy >= 0.58 && row.evaluated >= 20
        ? "watch"
        : row.accuracy <= 0.42 && row.evaluated >= 20
          ? "inverted/weak"
          : "learning";
    lines.push(`| ${row.agentId} | ${row.family} | ${pct(row.coverage)} | ${pct(row.accuracy)} | ${row.correct} | ${row.wrong} | ${row.abstained} | ${read} |`);
  }
  return lines.join("\n");
}

function agentPredictions(row) {
  return Object.fromEntries(agents.map((agent) => {
    const result = agent.predict(row);
    return [agent.id, result?.prediction ?? "abstain"];
  }));
}

function scoreboardForRows(rows) {
  const minEvaluated = Math.min(5, Math.max(1, Math.ceil(rows.length * 0.15)));
  const rankScore = (row) => row.evaluated >= minEvaluated ? (row.accuracy ?? -1) : -1;
  return agents
    .map((agent) => scoreAgent(agent, rows))
    .sort((a, b) => rankScore(b) - rankScore(a) || b.evaluated - a.evaluated || (b.accuracy ?? -1) - (a.accuracy ?? -1));
}

function groupedScoreboards(rows) {
  const dimensions = [
    ["asset", (row) => row.asset],
    ["triggerKind", (row) => row.triggerKind],
    ["trigger", (row) => `${row.triggerKind}:${row.triggerLabel}`],
    ["direction", (row) => row.direction],
    ["dataQuality", (row) => row.dataQuality],
    ["relativeAlignment", (row) => row.relativeAlignment],
    ["betaBucket", (row) => row.betaBucket],
  ];
  const out = [];
  for (const [dimension, keyFn] of dimensions) {
    const buckets = new Map();
    for (const row of rows) {
      const key = keyFn(row) ?? "unknown";
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(row);
    }
    for (const [value, bucketRows] of buckets.entries()) {
      if (bucketRows.length < 5) continue;
      out.push({
        dimension,
        value,
        rowCount: bucketRows.length,
        labelCounts: bucketRows.reduce((acc, row) => {
          acc[row.label] = (acc[row.label] ?? 0) + 1;
          return acc;
        }, {}),
        topAgents: scoreboardForRows(bucketRows).slice(0, 5),
      });
    }
  }
  return out.sort((a, b) => b.rowCount - a.rowCount || a.dimension.localeCompare(b.dimension) || String(a.value).localeCompare(String(b.value)));
}

function sliceMarkdown(slices) {
  if (!slices.length) return "_No slices with enough rows._";
  return slices.slice(0, 24).map((slice) => {
    const labels = Object.entries(slice.labelCounts).map(([k, v]) => `${k} ${v}`).join(", ");
    return `### ${slice.dimension}: ${slice.value}\n\nRows: ${slice.rowCount}. Labels: ${labels}.\n\n${markdownTable(slice.topAgents)}`;
  }).join("\n\n");
}

async function main() {
  const config = await readJson(CONFIG_PATH);
  const market = await loadMarket(config);
  const joined = joinFeedback(await readJsonl(FEEDBACK_PATH));
  const rows = joined
    .map((item) => buildFeatureRow(item, config, market))
    .filter((row) => ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "LINK", "AVAX"].includes(row.asset));
  for (const row of rows) row.agentPredictions = agentPredictions(row);
  const cleanRows = rows.filter((row) => row.dataQuality === "clean");
  const scoreboard = scoreboardForRows(rows);
  const slices = groupedScoreboards(rows);

  const summary = {
    generated: new Date().toISOString(),
    status: "research-only-no-live-execution",
    label: {
      source: "finalized review 1h directionalMovePct",
      follow: `>= ${LABEL_THRESHOLD_PCT}% in alert direction`,
      fade: `<= -${LABEL_THRESHOLD_PCT}% in alert direction`,
      noisy: "between thresholds",
    },
    rowCount: rows.length,
    cleanRows: cleanRows.length,
    taintedRows: rows.length - cleanRows.length,
    labelCounts: rows.reduce((acc, row) => {
      acc[row.label] = (acc[row.label] ?? 0) + 1;
      return acc;
    }, {}),
    qualityFlagCounts: rows.flatMap((row) => row.qualityFlags).reduce((acc, flag) => {
      acc[flag] = (acc[flag] ?? 0) + 1;
      return acc;
    }, {}),
    relativeAlignmentCounts: rows.reduce((acc, row) => {
      acc[row.relativeAlignment] = (acc[row.relativeAlignment] ?? 0) + 1;
      return acc;
    }, {}),
    scoreboard,
    slices,
  };

  await writeJson(FEATURE_JSON_PATH, { ...summary, featureRows: rows });
  await fs.writeFile(FEATURE_CSV_PATH, `${writeCsvRows(rows)}\n`);
  await writeJson(SCOREBOARD_JSON_PATH, summary);
  await writeJson(SCOREBOARD_SLICES_JSON_PATH, {
    generated: summary.generated,
    status: summary.status,
    rowCount: summary.rowCount,
    minSliceRows: 5,
    slices,
  });

  const topRows = scoreboard.slice(0, 8);
  const md = `# RALPH Agent Swarm Research\n\nGenerated: ${summary.generated}\n\nStatus: research-only, no live execution. This file scores specialist research agents against finalized alert outcomes; it does not alter alerts, thresholds, risk, sizing, keys, accounts, wallets, or execution.\n\n## Dataset\n\n- Joined finalized alert rows: ${summary.rowCount}\n- Clean rows: ${summary.cleanRows}\n- Tainted rows: ${summary.taintedRows}\n- Label rule: follow if 1h directional move is >= ${LABEL_THRESHOLD_PCT}%, fade if <= -${LABEL_THRESHOLD_PCT}%, otherwise noisy.\n- Label counts: ${Object.entries(summary.labelCounts).map(([k, v]) => `${k} ${v}`).join(", ")}\n- Relative alignment: ${Object.entries(summary.relativeAlignmentCounts).map(([k, v]) => `${k} ${v}`).join(", ")}\n- Quality flags: ${Object.entries(summary.qualityFlagCounts).map(([k, v]) => `${k} ${v}`).join(", ") || "none"}\n- Grouped scoreboard slices: ${summary.slices.length}\n\n## Agent Scoreboard\n\n${markdownTable(topRows)}\n\n## Interpretation\n\nThe swarm is intentionally measurable: scouts make simple predictions, ensemble agents test combinations, the critic abstains on tainted data, and grouped scoreboards show where agents work or fail. Treat high scores as candidates for deeper validation, not live gates.\n\n## Outputs\n\n- \`results/agent-swarm-feature-table.json\`\n- \`results/agent-swarm-feature-table.csv\`\n- \`results/agent-scoreboard.json\`\n- \`results/agent-scoreboard-slices.json\`\n- \`results/agent-scoreboard-slices.md\`\n`;

  await fs.writeFile(SCOREBOARD_MD_PATH, md);
  await fs.writeFile(SCOREBOARD_SLICES_MD_PATH, `# RALPH Agent Scoreboard Slices\n\nGenerated: ${summary.generated}\n\nStatus: research-only, no live execution.\n\nGrouped scoreboards expose where scouts work or fail by asset, trigger, direction, quality state, relative alignment, and beta bucket. Slices below require at least five rows.\n\n${sliceMarkdown(slices)}\n`);
  console.log(JSON.stringify({
    ok: true,
    rows: summary.rowCount,
    cleanRows: summary.cleanRows,
    scoreboardMarkdown: SCOREBOARD_MD_PATH,
    scoreboardSlicesMarkdown: SCOREBOARD_SLICES_MD_PATH,
    featureJson: FEATURE_JSON_PATH,
    featureCsv: FEATURE_CSV_PATH,
    topAgents: scoreboard.slice(0, 5).map((row) => ({
      agentId: row.agentId,
      evaluated: row.evaluated,
      accuracy: row.accuracy,
      coverage: row.coverage,
    })),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
