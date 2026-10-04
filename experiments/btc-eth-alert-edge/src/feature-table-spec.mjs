const LABELS = new Set(["follow", "fade", "noisy", "unavailable"]);
const DIRECTIONS = new Set(["UP", "DOWN"]);
const DATA_QUALITY = new Set(["clean", "tainted"]);
const RELATIVE_ALIGNMENT = new Set(["confirmed", "contradicted", "mixed", "unavailable"]);
const BETA_BUCKETS = new Set(["market-beta", "idiosyncratic-strength", "idiosyncratic-weakness", "cross-pair-divergence", "unavailable"]);
const TRIGGER_KINDS = new Set(["VELOCITY", "WICK"]);
const REQUIRED_ROW_FIELDS = [
  "id",
  "alertIso",
  "asset",
  "direction",
  "triggerKind",
  "triggerLabel",
  "triggerMovePct",
  "label",
  "oneHourDirectionalMovePct",
  "relativeAlignment",
  "betaBucket",
  "qualityFlags",
  "dataQuality",
  "candle1h",
  "candle4h",
  "relative1h",
  "relative4h"
];

export function validateFeatureTable(table) {
  const errors = [];
  if (!table || typeof table !== "object" || Array.isArray(table)) {
    return { ok: false, errors: ["feature table must be an object"] };
  }

  if (table.status !== "research-only-no-live-execution") errors.push("status must be research-only-no-live-execution");
  if (!table.label || typeof table.label !== "object") errors.push("label contract must be present");
  if (!Array.isArray(table.featureRows)) errors.push("featureRows must be an array");
  if (!Number.isInteger(table.rowCount) || table.rowCount < 0) errors.push("rowCount must be a non-negative integer");
  if (Array.isArray(table.featureRows) && table.rowCount !== table.featureRows.length) {
    errors.push("rowCount must equal featureRows.length");
  }

  const rows = Array.isArray(table.featureRows) ? table.featureRows : [];
  rows.forEach((row, index) => {
    for (const field of REQUIRED_ROW_FIELDS) {
      if (!(field in row)) errors.push(`featureRows[${index}].${field} missing`);
    }
    validateRow(row, index, errors);
  });

  const cleanRows = rows.filter((row) => row.dataQuality === "clean").length;
  const taintedRows = rows.filter((row) => row.dataQuality === "tainted").length;
  if (table.cleanRows !== cleanRows) errors.push(`cleanRows mismatch: expected ${cleanRows}, got ${table.cleanRows}`);
  if (table.taintedRows !== taintedRows) errors.push(`taintedRows mismatch: expected ${taintedRows}, got ${table.taintedRows}`);
  if (rows.some((row) => row.label !== "unavailable") && !hasEveryLabelCount(table, rows)) {
    errors.push("labelCounts must match feature row labels");
  }
  if (!hasEveryQualityFlagCount(table, rows)) errors.push("qualityFlagCounts must match feature row quality flags");

  return { ok: errors.length === 0, errors };
}

export function validateFeatureRow(row) {
  const errors = [];
  validateRow(row, 0, errors);
  return errors.map((error) => error.replace(/^featureRows\[0\]\./, ""));
}

function validateRow(row, index, errors) {
  const path = `featureRows[${index}]`;
  requireString(row.id, `${path}.id`, errors);
  requireIso(row.alertIso, `${path}.alertIso`, errors);
  requireString(row.asset, `${path}.asset`, errors);
  if (!DIRECTIONS.has(row.direction)) errors.push(`${path}.direction must be UP or DOWN`);
  if (!TRIGGER_KINDS.has(row.triggerKind)) errors.push(`${path}.triggerKind must be VELOCITY or WICK`);
  requireString(row.triggerLabel, `${path}.triggerLabel`, errors);
  requireFiniteOrNull(row.triggerMovePct, `${path}.triggerMovePct`, errors, { allowNull: false });
  if (!LABELS.has(row.label)) errors.push(`${path}.label has unsupported value`);
  requireFiniteOrNull(row.oneHourDirectionalMovePct, `${path}.oneHourDirectionalMovePct`, errors, { allowNull: true });
  if (!RELATIVE_ALIGNMENT.has(row.relativeAlignment)) errors.push(`${path}.relativeAlignment has unsupported value`);
  if (!BETA_BUCKETS.has(row.betaBucket)) errors.push(`${path}.betaBucket has unsupported value`);
  if (!Array.isArray(row.qualityFlags)) errors.push(`${path}.qualityFlags must be an array`);
  if (!DATA_QUALITY.has(row.dataQuality)) errors.push(`${path}.dataQuality must be clean or tainted`);
  if (row.dataQuality === "clean" && row.qualityFlags?.length) errors.push(`${path}.clean row cannot have quality flags`);
  if (row.dataQuality === "tainted" && row.qualityFlags?.length === 0) errors.push(`${path}.tainted row must have quality flags`);
  validateCandle(row.candle1h, `${path}.candle1h`, errors);
  validateCandle(row.candle4h, `${path}.candle4h`, errors);
  validateRelative(row.relative1h, `${path}.relative1h`, errors);
  validateRelative(row.relative4h, `${path}.relative4h`, errors);
}

function validateCandle(candle, path, errors) {
  if (!candle || typeof candle !== "object" || Array.isArray(candle)) {
    errors.push(`${path} must be an object`);
    return;
  }
  requireFiniteOrNull(candle.candleTime, `${path}.candleTime`, errors, { allowNull: false });
  requireIso(candle.candleIso, `${path}.candleIso`, errors);
  requireFiniteOrNull(candle.close, `${path}.close`, errors, { allowNull: false });
  for (const bars of [1, 4, 12, 24]) {
    requireFiniteOrNull(candle[`return_${bars}b_pct`], `${path}.return_${bars}b_pct`, errors, { allowNull: true });
  }
}

function validateRelative(relative, path, errors) {
  if (!relative || typeof relative !== "object" || Array.isArray(relative)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (!["1h", "4h"].includes(relative.timeframe)) errors.push(`${path}.timeframe must be 1h or 4h`);
  requireFiniteOrNull(relative.candleAgeSec, `${path}.candleAgeSec`, errors, { allowNull: false });
  if (typeof relative.fresh !== "boolean") errors.push(`${path}.fresh must be boolean`);
  for (const bars of [1, 4, 12, 24]) {
    requireFiniteOrNull(relative[`usdt_return_${bars}b_pct`], `${path}.usdt_return_${bars}b_pct`, errors, { allowNull: true });
    requireFiniteOrNull(relative[`avg_relative_return_${bars}b_pct`], `${path}.avg_relative_return_${bars}b_pct`, errors, { allowNull: true });
  }
}

function hasEveryLabelCount(table, rows) {
  const expected = countBy(rows, (row) => row.label);
  return sameCounts(expected, table.labelCounts || {});
}

function hasEveryQualityFlagCount(table, rows) {
  const expected = countBy(rows.flatMap((row) => row.qualityFlags || []), (flag) => flag);
  return sameCounts(expected, table.qualityFlagCounts || {});
}

function countBy(rows, keyFn) {
  return rows.reduce((acc, row) => {
    const key = keyFn(row);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function sameCounts(left, right) {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) if ((left[key] ?? 0) !== (right[key] ?? 0)) return false;
  return true;
}

function requireString(value, path, errors) {
  if (typeof value !== "string" || value.trim() === "") errors.push(`${path} must be a non-empty string`);
}

function requireIso(value, path, errors) {
  requireString(value, path, errors);
  if (typeof value === "string" && Number.isNaN(Date.parse(value))) errors.push(`${path} must parse as ISO time`);
}

function requireFiniteOrNull(value, path, errors, { allowNull }) {
  if (value === null && allowNull) return;
  if (!Number.isFinite(value)) errors.push(`${path} must be a finite number${allowNull ? " or null" : ""}`);
}
