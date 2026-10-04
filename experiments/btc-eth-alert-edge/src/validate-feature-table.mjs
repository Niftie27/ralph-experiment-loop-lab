#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { validateFeatureTable } from "./feature-table-spec.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const FEATURE_TABLE_PATH = path.join(ROOT, "results", "agent-swarm-feature-table.json");

const table = JSON.parse(await fs.readFile(FEATURE_TABLE_PATH, "utf8"));
const result = validateFeatureTable(table);

if (!result.ok) {
  console.error(JSON.stringify({ ok: false, errors: result.errors }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  rows: table.rowCount,
  cleanRows: table.cleanRows,
  taintedRows: table.taintedRows,
  file: FEATURE_TABLE_PATH
}, null, 2));
