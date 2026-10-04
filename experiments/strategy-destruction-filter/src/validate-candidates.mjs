#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { validateCandidateSet } from "./candidate-spec.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CANDIDATES_PATH = path.join(ROOT, "candidates", "seed-strategies.json");

const candidates = JSON.parse(await fs.readFile(CANDIDATES_PATH, "utf8"));
const result = validateCandidateSet(candidates);

if (!result.ok) {
  console.error(JSON.stringify({ ok: false, errors: result.errors }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  candidates: candidates.length,
  file: CANDIDATES_PATH
}, null, 2));
