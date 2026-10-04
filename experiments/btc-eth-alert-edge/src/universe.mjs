import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RESULTS_DIR = path.join(ROOT, "results");
const SNAPSHOT = path.join(RESULTS_DIR, "universe-snapshot.json");
const SUMMARY = path.join(RESULTS_DIR, "universe-summary.md");

const WATCHLIST = new Set(["BTC", "ETH", "SOL", "HYPE"]);
const MIN_VOLUME_USD = 25_000_000;
const EXCLUDED_ASSETS = new Set(["USDT", "USDC", "FDUSD", "TUSD", "USDP", "DAI", "EUR", "TRY", "BRL", "USD1"]);

const nowIso = () => new Date().toISOString();
const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const round = (value, digits = 2) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Accept": "application/json",
      "User-Agent": "OpenClaw-RALPH-universe/0.1",
      ...(options.headers ?? {})
    }
  });
  if (!res.ok) throw new Error(`${url} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function binanceSpotRows() {
  const [info, tickers] = await Promise.all([
    fetchJson("https://api.binance.com/api/v3/exchangeInfo"),
    fetchJson("https://api.binance.com/api/v3/ticker/24hr")
  ]);
  const tradable = new Map(
    info.symbols
      .filter((s) => s.status === "TRADING" && s.quoteAsset === "USDT")
      .map((s) => [s.symbol, s])
  );
  return tickers
    .filter((t) => tradable.has(t.symbol))
    .map((t) => ({
      asset: tradable.get(t.symbol).baseAsset,
      market: t.symbol,
      venue: "binance_spot",
      volumeUsd: num(t.quoteVolume),
      changePct24h: num(t.priceChangePercent),
      lastPrice: num(t.lastPrice)
    }));
}

async function binanceFuturesRows() {
  const [info, tickers] = await Promise.all([
    fetchJson("https://fapi.binance.com/fapi/v1/exchangeInfo"),
    fetchJson("https://fapi.binance.com/fapi/v1/ticker/24hr")
  ]);
  const tradable = new Map(
    info.symbols
      .filter((s) => s.status === "TRADING" && s.quoteAsset === "USDT" && s.contractType === "PERPETUAL")
      .map((s) => [s.symbol, s])
  );
  return tickers
    .filter((t) => tradable.has(t.symbol))
    .map((t) => ({
      asset: tradable.get(t.symbol).baseAsset,
      market: t.symbol,
      venue: "binance_usdt_perp",
      volumeUsd: num(t.quoteVolume),
      changePct24h: num(t.priceChangePercent),
      lastPrice: num(t.lastPrice)
    }));
}

async function hyperliquidRows() {
  const data = await fetchJson("https://api.hyperliquid.xyz/info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "metaAndAssetCtxs" })
  });
  const universe = data?.[0]?.universe ?? [];
  const ctxs = data?.[1] ?? [];
  return universe.map((asset, i) => {
    const ctx = ctxs[i] ?? {};
    return {
      asset: asset.name,
      market: `${asset.name}-PERP`,
      venue: "hyperliquid_perp",
      volumeUsd: num(ctx.dayNtlVlm),
      openInterest: num(ctx.openInterest),
      funding: num(ctx.funding),
      lastPrice: num(ctx.markPx ?? ctx.midPx)
    };
  });
}

async function coingeckoTrendingAssets() {
  try {
    const data = await fetchJson("https://api.coingecko.com/api/v3/search/trending");
    return new Set((data.coins ?? []).map((x) => String(x.item?.symbol ?? "").toUpperCase()).filter(Boolean));
  } catch (error) {
    return { error: error.message, symbols: new Set() };
  }
}

function aggregate(rows, trending) {
  const byAsset = new Map();
  for (const row of rows) {
    if (!row.asset || row.asset.includes("_")) continue;
    if (EXCLUDED_ASSETS.has(row.asset)) continue;
    if (!/^[A-Z0-9]+$/.test(row.asset)) continue;
    if (!byAsset.has(row.asset)) {
      byAsset.set(row.asset, {
        asset: row.asset,
        venues: [],
        markets: [],
        maxVolumeUsd: 0,
        totalVenueVolumeUsd: 0,
        maxAbsChangePct24h: 0,
        bestChangePct24h: 0,
        openInterest: 0,
        funding: null,
        watchlist: WATCHLIST.has(row.asset),
        trending: trending instanceof Set ? trending.has(row.asset.toUpperCase()) : false
      });
    }
    const agg = byAsset.get(row.asset);
    agg.venues.push(row.venue);
    agg.markets.push(row.market);
    agg.maxVolumeUsd = Math.max(agg.maxVolumeUsd, row.volumeUsd);
    agg.totalVenueVolumeUsd += row.volumeUsd;
    if (Math.abs(row.changePct24h ?? 0) > agg.maxAbsChangePct24h) {
      agg.maxAbsChangePct24h = Math.abs(row.changePct24h);
      agg.bestChangePct24h = row.changePct24h;
    }
    agg.openInterest = Math.max(agg.openInterest, row.openInterest ?? 0);
    if (row.funding !== undefined && row.funding !== null) agg.funding = row.funding;
  }

  return [...byAsset.values()].map((asset) => {
    const venueCount = new Set(asset.venues).size;
    const liquid = asset.maxVolumeUsd >= MIN_VOLUME_USD || asset.watchlist;
    const multiVenue = venueCount >= 2;
    const eligibleForDeepStats = liquid && (asset.watchlist || multiVenue);
    const movementScore = Math.min(asset.maxAbsChangePct24h / 10, 2);
    const liquidityScore = Math.min(Math.log10(Math.max(asset.maxVolumeUsd, 1)) - 6, 3);
    const score =
      (liquid ? 2 : 0) +
      venueCount * 0.5 +
      movementScore +
      liquidityScore +
      (asset.trending ? 1 : 0) +
      (asset.watchlist ? 1 : 0);
    return {
      ...asset,
      venues: [...new Set(asset.venues)].sort(),
      markets: [...new Set(asset.markets)].sort(),
      maxVolumeUsd: round(asset.maxVolumeUsd, 0),
      totalVenueVolumeUsd: round(asset.totalVenueVolumeUsd, 0),
      maxAbsChangePct24h: round(asset.maxAbsChangePct24h, 2),
      bestChangePct24h: round(asset.bestChangePct24h, 2),
      openInterest: round(asset.openInterest, 2),
      funding: asset.funding === null ? null : round(asset.funding, 8),
      universeScore: round(score, 3),
      eligibleForDeepStats,
      watchOnlyReason: eligibleForDeepStats ? null : "single-venue-or-below-liquidity"
    };
  }).sort((a, b) => b.universeScore - a.universeScore);
}

async function main() {
  const errors = [];
  const rows = [];
  for (const loader of [binanceSpotRows, binanceFuturesRows, hyperliquidRows]) {
    try {
      rows.push(...await loader());
    } catch (error) {
      errors.push(error.message);
    }
  }
  const trendingResult = await coingeckoTrendingAssets();
  const trending = trendingResult instanceof Set ? trendingResult : trendingResult.symbols;
  if (!(trendingResult instanceof Set)) errors.push(`coingecko trending failed: ${trendingResult.error}`);

  const ranked = aggregate(rows, trending);
  const selected = ranked
    .filter((x) => x.eligibleForDeepStats)
    .slice(0, 40);
  const watchlist = ranked.filter((x) => WATCHLIST.has(x.asset));

  const snapshot = {
    generated: nowIso(),
    status: "research-only-no-live-execution",
    rules: {
      minVolumeUsd: MIN_VOLUME_USD,
      selectedLimit: 40,
      selection: "deep stats require watchlist or multi-venue liquidity; single-venue movers are watch-only"
    },
    sources: [
      "Binance spot exchangeInfo + 24hr ticker",
      "Binance USD-M futures exchangeInfo + 24hr ticker",
      "Hyperliquid metaAndAssetCtxs",
      "CoinGecko trending search"
    ],
    errors,
    selected,
    watchlist,
    watchOnlyMovers: ranked
      .filter((x) => !x.eligibleForDeepStats && x.maxVolumeUsd >= MIN_VOLUME_USD)
      .sort((a, b) => b.maxAbsChangePct24h - a.maxAbsChangePct24h)
      .slice(0, 25),
    topMovers: ranked
      .filter((x) => x.maxVolumeUsd >= MIN_VOLUME_USD)
      .sort((a, b) => b.maxAbsChangePct24h - a.maxAbsChangePct24h)
      .slice(0, 25)
  };

  await fs.mkdir(RESULTS_DIR, { recursive: true });
  await fs.writeFile(SNAPSHOT, `${JSON.stringify(snapshot, null, 2)}\n`);

  const rowsMd = selected.slice(0, 20).map((x) =>
    `| ${x.asset} | ${x.universeScore} | ${x.maxVolumeUsd} | ${x.bestChangePct24h}% | ${x.venues.join(", ")} | ${x.watchlist ? "yes" : ""} | ${x.trending ? "yes" : ""} |`
  ).join("\n");
  const watchMd = watchlist.map((x) =>
    `- ${x.asset}: venues ${x.venues.join(", ") || "n/a"}, max volume ${x.maxVolumeUsd}, 24h move ${x.bestChangePct24h}%, score ${x.universeScore}`
  ).join("\n");
  const watchOnlyMd = snapshot.watchOnlyMovers.slice(0, 10).map((x) =>
    `- ${x.asset}: ${x.bestChangePct24h}% 24h, max volume ${x.maxVolumeUsd}, venues ${x.venues.join(", ")}`
  ).join("\n");

  await fs.writeFile(SUMMARY, `# Dynamic Crypto Universe Snapshot\n\nGenerated: ${snapshot.generated}\n\nStatus: research-only, no live execution.\n\n## Watchlist Coverage\n\n${watchMd}\n\n## Top Selected Universe\n\n| Asset | Score | Max Venue Volume USD | 24h Move | Venues | Watch | Trending |\n| --- | ---: | ---: | ---: | --- | --- | --- |\n${rowsMd}\n\n## Watch-Only Movers\n\n${watchOnlyMd || "- None"}\n\n## Errors\n\n${errors.length ? errors.map((e) => `- ${e}`).join("\n") : "- None"}\n`);

  console.log(`Wrote ${SNAPSHOT}`);
  console.log(`Wrote ${SUMMARY}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
