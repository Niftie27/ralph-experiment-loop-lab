import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { test } from "node:test";
import { fetchBinanceSpotCandles } from "../src/binance-data.mjs";

const HOUR = 3_600_000;
const NOW = Date.UTC(2026, 9, 18, 8);

function mockMarket(t, intervalMs, count, closeAtNow = false) {
  t.mock.method(Date, "now", () => NOW);
  t.mock.method(fs, "readFile", async () => {
    throw Object.assign(new Error("No cached archive"), { code: "ENOENT" });
  });
  const rows = Array.from({ length: count }, (_, i) => {
    const open = NOW - (count - 1 - i) * intervalMs;
    return [open, "10", "12", "9", "11", "100", open + intervalMs - 1];
  });
  if (closeAtNow) rows.at(-1)[6] = NOW;
  const requests = [];
  t.mock.method(globalThis, "fetch", async (input) => {
    const url = new URL(input);
    if (url.hostname === "data.binance.vision") return { status: 404 };
    assert.equal(url.origin + url.pathname, "https://api.binance.com/api/v3/klines");
    assert.equal(url.searchParams.get("limit"), "1000");
    const start = Number(url.searchParams.get("startTime"));
    requests.push(start);
    return { ok: true, json: async () => rows.filter((row) => row[0] >= start).slice(0, 1000) };
  });
  return { rows, requests };
}

test("1h paginates 1080 rows through the last closed hour", async (t) => {
  const { rows, requests } = mockMarket(t, HOUR, 1080);
  const { candles } = await fetchBinanceSpotCandles("BTCUSDT", "1h", 60);
  assert.equal(requests.length, 2);
  assert.equal(requests[1], rows[999][0] + 1);
  assert.equal(candles.length, 1079);
  assert.equal(candles.at(-1).time * 1000, NOW - HOUR);
  assert.ok(candles.every((c) => c.time * 1000 + HOUR - 1 < NOW));
});

for (const closeAtNow of [false, true]) {
  test(`4h excludes closeTime ${closeAtNow ? "equal to" : "after"} now`, async (t) => {
    const { requests } = mockMarket(t, 4 * HOUR, 270, closeAtNow);
    const { candles } = await fetchBinanceSpotCandles("BTCUSDT", "4h", 60);
    assert.equal(requests.length, 1);
    assert.equal(candles.length, 269);
    assert.equal(candles.at(-1).time * 1000, NOW - 4 * HOUR);
    assert.ok(candles.every((c) => c.time * 1000 + 4 * HOUR - 1 < NOW));
  });
}

test("full page containing newest candle needs no extra request", async (t) => {
  const { requests } = mockMarket(t, HOUR, 1000);
  const { candles } = await fetchBinanceSpotCandles("BTCUSDT", "1h", 60);
  assert.equal(requests.length, 1);
  assert.equal(candles.length, 999);
});

test("REST pagination is capped at 20 requests", async (t) => {
  const { requests } = mockMarket(t, 60_000, 21_000);
  const { candles } = await fetchBinanceSpotCandles("BTCUSDT", "1m", 60);
  assert.equal(requests.length, 20);
  assert.equal(candles.length, 20_000);
});
