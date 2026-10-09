# v1 Reconnects - 2026-10-09

Date: 2026-10-09
Scope: read-only v1 watcher audit. No v1 edits, no watcher restart, no trading, no keys, no deletions.

## Summary

The v1 watcher keeps `history`, `volumeHistory`, `flowHistory`, and `bookHistory` in process memory across websocket reconnects. They are module-level `Map`s and are pruned by timestamp only; `MAX_HISTORY_MS = 20 * 60_000`.

The two reconnects near the missed BTC event were:

| venue | closed UTC | connected UTC | gap |
| --- | --- | --- | ---: |
| Binance spot websocket | 2026-10-08T16:59:44.330Z | 2026-10-08T16:59:51.101Z | 6.771 s |
| Binance spot websocket | 2026-10-08T17:03:09.271Z | 2026-10-08T17:03:16.831Z | 7.560 s |

There was also a later Binance reconnect in the wider 16:50-17:10 UTC window:

| venue | closed UTC | connected UTC | gap |
| --- | --- | --- | ---: |
| Binance spot websocket | 2026-10-08T17:08:59.273Z | 2026-10-08T17:09:05.783Z | 6.510 s |

The missed 2026-10-08 17:00:25 UTC BTC alert was not caused by the 16:59 reconnect. The cascade came about 34 seconds after the websocket had reconnected, and the diagnostic measured Binance spot at only `-0.177%` in 5 seconds versus the v1 BTC `WICK` threshold of `0.30%`. The futures move was larger, but v1 BTC alerting was using the spot stream.

## Last 7 Days Reconnect Count

Source: `/home/coder/.openclaw/workspace/crypto-updates/runtime/realtime-market-watcher.log`

Counting `websocket closed; reconnecting in 5s` log lines from 2026-10-03 through 2026-10-09 UTC:

| UTC date | Binance reconnects | Hyperliquid reconnects | idle forced closes |
| --- | ---: | ---: | ---: |
| 2026-10-03 | 0 | 0 | 0 |
| 2026-10-04 | 2 | 0 | 0 |
| 2026-10-05 | 4 | 0 | 0 |
| 2026-10-06 | 0 | 0 | 0 |
| 2026-10-07 | 25 | 0 | 0 |
| 2026-10-08 | 21 | 0 | 1 |
| 2026-10-09 | 2 | 2 | 0 |

Command output:

```text
daily reconnect counts UTC
2026-10-04 { binance: 2, hyperliquid: 0, idleForces: 0 }
2026-10-05 { binance: 4, hyperliquid: 0, idleForces: 0 }
2026-10-07 { binance: 25, hyperliquid: 0, idleForces: 0 }
2026-10-08 { binance: 21, hyperliquid: 0, idleForces: 1 }
2026-10-09 { binance: 2, hyperliquid: 2, idleForces: 0 }

gaps Oct 8 16:50-17:10 UTC
{
  venue: 'binance',
  closed: '2026-10-08T16:59:44.330Z',
  connected: '2026-10-08T16:59:51.101Z',
  gap_s: '6.771'
}
{
  venue: 'binance',
  closed: '2026-10-08T17:03:09.271Z',
  connected: '2026-10-08T17:03:16.831Z',
  gap_s: '7.560'
}
{
  venue: 'binance',
  closed: '2026-10-08T17:08:59.273Z',
  connected: '2026-10-08T17:09:05.783Z',
  gap_s: '6.510'
}
```

## Close Code Or Reason

The current logs do not include websocket close code or close reason.

Relevant code path:

```text
ws.addEventListener("close", () => {
  if (idleTimer) clearInterval(idleTimer);
  console.error(`[${nowIso()}] binance websocket closed; reconnecting in 5s`);
  setTimeout(connectBinance, 5_000);
});
```

The same pattern is used for Hyperliquid. Because the close event argument is ignored, the available log can only prove close time and reconnect time, not the remote close code/reason. One close on 2026-10-08 was preceded by an idle guard:

```text
[2026-10-08T21:33:03.694Z] binance websocket idle 79411ms; forcing reconnect
[2026-10-08T21:35:03.730Z] binance websocket closed; reconnecting in 5s
[2026-10-08T21:35:11.282Z] connected
```

## Backfill And Lost Trades During Gaps

The v1 watcher does not backfill missed websocket trades after reconnect.

Relevant code path:

```text
function connectBinance() {
  console.log(`[${nowIso()}] connecting ${BINANCE_WS}`);
  const ws = new WebSocket(BINANCE_WS);
  ...
  ws.addEventListener("message", async (event) => {
    ...
    await handleTrade(symbol, price, eventTime, notional, typeof trade.m === "boolean" ? trade.m : null);
  });
  ...
  ws.addEventListener("close", () => {
    ...
    setTimeout(connectBinance, 5_000);
  });
}
```

There is no REST backfill, no `fromId`, no replay cursor, and no local raw-trade catch-up path in the reconnect branch. Therefore, for v1 alert detection, any Binance spot `@trade` and depth messages that occurred while the websocket was disconnected are not processed later. The in-memory history survives, but the missing interval is a hole inside that history.

Impact for the two requested gaps:

| gap | v1 history reset? | v1 backfilled missed trades? | v1 alert implication |
| --- | --- | --- | --- |
| 2026-10-08T16:59:44.330Z to 16:59:51.101Z | no | no | trades/depth during the 6.771 s disconnect were not evaluated |
| 2026-10-08T17:03:09.271Z to 17:03:16.831Z | no | no | trades/depth during the 7.560 s disconnect were not evaluated |

That does not explain the 17:00:25 UTC missed alert: the watcher had been reconnected for about 34 seconds by then, and the spot move did not cross the configured BTC WICK threshold.

