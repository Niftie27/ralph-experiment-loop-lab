# Trading tools research backlog (Tomas, 2026-10-29)

Status of every item: OPEN, not started. Main line stays F1; these are scheduled, not parallel work.
Hard rule: nothing enters or replaces anything in the pipeline until it is tested and compared with our own data (garbage in, garbage out). Verify before assertion.

## B1 Quantower subscription and connector
- Tomas considers buying a Quantower subscription. His assumption (unverified): the paid version has better or faster data.
- Before buying: dig up to three passes: is Quantower the right tool, read its documentation, find connectors (MCP, A2A, API, other), judge its datasets; then test and compare with our Binance data (better or not?).
- Claude's hypothesis, UNTESTED, must not be asserted: Quantower is a platform and data quality comes from the connection/feed, so the subscription buys features (footprint, TPO, DOM), not better data. Test idea: Quantower connected to Binance vs our collectors, row by row; free vs paid if possible; the same for Coinbase BTC.
- Leads from Tomas's Google screenshots (not read yet): unofficial GitHub "quantower-mcp" (Travis-Clement-Dev; read-only localhost HTTP bridge: symbol, OHLCV, drawings, multi-timeframe history, screenshots); official Quantower API (api.quantower.com, C#); quantower.com/connections says an AMP connection unlocks premium features via a special AMP Quantower app.

## B2 How trader Igor (ChartChampions) reads the market (Tomas's model)
- Live streams; FinancialJuice news feed; platform per Tomas: Quantower.
- Uses market profiles (TPO), bar charts for open and close, footprint when zoomed into a candle with highlights for significant longs or shorts, real-time order flow on NQ/ES, and BTC charts; sees volume, delta and absorption on the chart and interprets them well because his data is good. This is what Tomas wants RALPH to understand and reach.
- BTC data: Coinbase (per Igor, TradingView sometimes shows wrong data), also Binance and Hyperliquid. NQ, ES and other markets: venue unknown. RALPH focuses on BTC.
- Seen by Claude in the screenshots (2026-10-29): ENQZ26 via AMP/CQG (CME NQ), CME BTC front month (BTCV6.CME), a "BTC/USD Perpetual" footprint with bid x ask cells and delta, CVD, volume, OI rows, TradingView windows (NQ1!, GOOGL 1M, watchlist).

## B3 ChartChampions videos -> speech-to-text -> Obsidian wiki
- Idea: transcribe ChartChampions videos and feed Obsidian to build a wiki; they are professionals and their way of operating may help the bot's decisions.
- Checks first: YouTube and ChartChampions terms before downloading audio; whether usable captions exist.

## B4 TradingView write access for Claude
- Idea: a TradingView connector / hook / MCP so Claude can write into Tomas's TradingView.
- Not researched: no official public write API is known to Claude (not verified); unofficial automation may breach terms and risk the account.

## B5 CoinGecko / CoinMarketCap test ("some day")
- Test against Binance + Vision row by row (same symbols and windows, never the holdout windows of the six). Until then not added; nothing from them enters any input.

## B6 ZEC / XMR scope
- Add ZECUSDT, XMRUSDT and cross charts (ZECBTC, XMRBTC, ...). Decided: ledger, availability check first, decision at the F1a reassess (by 2026-11-05).
