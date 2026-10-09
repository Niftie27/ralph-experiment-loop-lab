# Crypto Updates Service Health

Generated: 2026-10-09T08:12:51.164Z
Window: 24 hours ago

## Decision

- Notify Tomas: yes
- BTC collector gaps=1

## Services

- crypto-updates-market-watcher.service: active/running, restarts=0, memory=94.4 MB, pid=3590354
- bybit-execution-reactor.service: active/running, restarts=1, memory=38.0 MB, pid=1627849
- ralph-collector.service: active/running, restarts=0, memory=112.6 MB, pid=3562490
- ralph-collector-ethusdt.service: active/running, restarts=0, memory=67.3 MB, pid=3582586
- ralph-collector-solusdt.service: active/running, restarts=0, memory=39.7 MB, pid=3582587
- ralph-collector-hypeusdt.service: active/running, restarts=0, memory=44.1 MB, pid=3587010
- ralph-collector-dashboard.service: active/running, restarts=0, memory=9.8 MB, pid=3562491

## Orderflow Contexts

- BTC: available, age=1647ms, price=82650, gaps=1, backfilled=113, book=synced, delay_ms=143, bars=663, events=150
- ETH: available, age=1223ms, price=2503.2, gaps=0, backfilled=0, book=synced, delay_ms=138, bars=144, events=150
- SOL: available, age=54ms, price=110.5, gaps=0, backfilled=0, book=synced, delay_ms=136, bars=144, events=150
- HYPE: available, age=487ms, price=86, gaps=0, backfilled=0, book=synced, delay_ms=138, bars=104, events=125

## OOM / Restart Evidence

- none

## Duplicate Alert Clusters

- none

Boundary: read-only health check; no live trading, orders, keys, accounts, thresholds, alert wording, sizing, TP/SL, execution behavior, scheduler mutation, or public posting changed.

