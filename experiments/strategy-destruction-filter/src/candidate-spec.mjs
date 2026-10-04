const DIRECTION_SET = new Set(["long", "short"]);
const RULE_PARAMETER_KEYS = {
  breakout: ["lookback", "volumeZ", "rsiMinLong", "rsiMaxShort"],
  rsi_reversion: ["rsiLow", "rsiHigh", "maxTrendStrength"],
  ma_reclaim: ["fast", "slow", "rsiFloorLong", "rsiCeilShort"],
  funding_reversion: ["minPositiveFunding", "maxNegativeFunding", "rsiLow", "rsiHigh"],
  funding_reversion_trend: ["minPositiveFunding", "maxNegativeFunding", "rsiLow", "rsiHigh", "trend"],
  funding_reversion_trend_timeframe: ["minPositiveFunding", "maxNegativeFunding", "rsiLow", "rsiHigh", "trend", "timeframe"],
  funding_oi_reversion: ["minPositiveFunding", "maxNegativeFunding", "minOpenInterestChangePct", "rsiLow", "rsiHigh"],
  volume_velocity_fade: ["returnLookback", "minMovePct", "volumeZ", "rsiLow", "rsiHigh"]
};
const OPTIONAL_FILTER_PARAMETER_KEYS = ["symbol", "timeframe", "trend", "volatility"];

const CATEGORICAL_PARAMETER_VALUES = {
  trend: new Set(["up", "down", "range"]),
  volatility: new Set(["low-vol", "mid-vol", "high-vol"]),
  timeframe: new Set(["1h", "4h"])
};

export function validateCandidateSet(candidates) {
  const errors = [];
  if (!Array.isArray(candidates)) {
    return { ok: false, errors: ["candidate file must be a JSON array"] };
  }

  const ids = new Set();
  candidates.forEach((candidate, index) => {
    for (const error of validateCandidateSpec(candidate)) errors.push(`candidate[${index}] ${error}`);
    if (typeof candidate?.id === "string") {
      if (ids.has(candidate.id)) errors.push(`candidate[${index}] duplicate id: ${candidate.id}`);
      ids.add(candidate.id);
    }
  });

  return { ok: errors.length === 0, errors };
}

export function validateCandidateSpec(candidate) {
  const errors = [];
  requireString(candidate, "id", errors);
  requireString(candidate, "idea", errors);
  requireString(candidate, "family", errors);
  requireString(candidate, "rule", errors);
  if (typeof candidate?.id === "string" && !/^[a-z0-9]+(?:-[a-z0-9]+)*-v\d+$/.test(candidate.id)) {
    errors.push("id must be kebab-case and end in -vN");
  }
  if (typeof candidate?.rule === "string" && !RULE_PARAMETER_KEYS[candidate.rule]) {
    errors.push(`unsupported rule: ${candidate.rule}`);
  }

  if (!Array.isArray(candidate?.directions) || candidate.directions.length === 0) {
    errors.push("directions must be a non-empty array");
  } else {
    for (const direction of candidate.directions) {
      if (!DIRECTION_SET.has(direction)) errors.push(`unsupported direction: ${direction}`);
    }
  }

  validateParameters(candidate, errors);
  validateThesis(candidate?.thesis, errors);
  validateDataRequirements(candidate?.dataRequirements, errors);
  validateValidation(candidate?.validation, errors);
  return errors;
}

export { RULE_PARAMETER_KEYS };

function validateParameters(candidate, errors) {
  const parameters = candidate?.parameters;
  if (!parameters || typeof parameters !== "object" || Array.isArray(parameters)) {
    errors.push("parameters must be an object");
    return;
  }
  const requiredKeys = RULE_PARAMETER_KEYS[candidate.rule] || [];
  const allowedKeys = [...requiredKeys, ...OPTIONAL_FILTER_PARAMETER_KEYS];
  for (const key of requiredKeys) {
    const values = parameters[key];
    if (!Array.isArray(values) || values.length === 0) {
      errors.push(`parameters.${key} must be a non-empty array`);
      continue;
    }
    validateParameterValues(key, values, errors);
  }
  for (const key of OPTIONAL_FILTER_PARAMETER_KEYS) {
    if (!(key in parameters)) continue;
    const values = parameters[key];
    if (!Array.isArray(values) || values.length === 0) {
      errors.push(`parameters.${key} must be a non-empty array`);
      continue;
    }
    validateParameterValues(key, values, errors);
  }
  for (const key of Object.keys(parameters)) {
    if (!allowedKeys.includes(key)) errors.push(`parameters.${key} is not used by rule ${candidate.rule}`);
  }
}

function validateParameterValues(key, values, errors) {
  const allowedValues = CATEGORICAL_PARAMETER_VALUES[key];
  if (allowedValues) {
    if (!values.every((value) => allowedValues.has(value))) {
      errors.push(`parameters.${key} must contain only: ${[...allowedValues].join(", ")}`);
    }
  } else if (key === "symbol") {
    if (!values.every((value) => typeof value === "string" && /^[A-Z0-9]+$/.test(value))) {
      errors.push("parameters.symbol must contain uppercase asset symbols");
    }
  } else if (!values.every(Number.isFinite)) {
    errors.push(`parameters.${key} must contain only finite numbers`);
  }
}

function validateThesis(thesis, errors) {
  if (!thesis || typeof thesis !== "object" || Array.isArray(thesis)) {
    errors.push("thesis must be an object");
    return;
  }
  requireNestedString(thesis, "mechanism", "thesis", errors);
  requireNestedString(thesis, "expectedBehavior", "thesis", errors);
  requireNestedString(thesis, "falsifiableClaim", "thesis", errors);
  if (!["seconds", "minutes", "hours", "days"].includes(thesis.edgeSpeed)) {
    errors.push("thesis.edgeSpeed must be one of seconds, minutes, hours, days");
  }
}

function validateDataRequirements(dataRequirements, errors) {
  if (!dataRequirements || typeof dataRequirements !== "object" || Array.isArray(dataRequirements)) {
    errors.push("dataRequirements must be an object");
    return;
  }
  if (!Array.isArray(dataRequirements.markets) || dataRequirements.markets.length === 0) {
    errors.push("dataRequirements.markets must be a non-empty array");
  }
  if (!Array.isArray(dataRequirements.requiredFeatures) || dataRequirements.requiredFeatures.length === 0) {
    errors.push("dataRequirements.requiredFeatures must be a non-empty array");
  }
  if (!Number.isFinite(dataRequirements.minLookbackDays) || dataRequirements.minLookbackDays <= 0) {
    errors.push("dataRequirements.minLookbackDays must be a positive number");
  }
}

function validateValidation(validation, errors) {
  if (!validation || typeof validation !== "object" || Array.isArray(validation)) {
    errors.push("validation must be an object");
    return;
  }
  requireNestedString(validation, "baseline", "validation", errors);
  if (!Array.isArray(validation.gates) || validation.gates.length === 0) errors.push("validation.gates must be a non-empty array");
  if (!Array.isArray(validation.killCriteria) || validation.killCriteria.length === 0) {
    errors.push("validation.killCriteria must be a non-empty array");
  }
}

function requireString(object, key, errors) {
  if (typeof object?.[key] !== "string" || object[key].trim() === "") errors.push(`${key} must be a non-empty string`);
}

function requireNestedString(object, key, label, errors) {
  if (typeof object?.[key] !== "string" || object[key].trim() === "") errors.push(`${label}.${key} must be a non-empty string`);
}
