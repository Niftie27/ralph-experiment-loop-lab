# Registered 2026-10-17T06:36:06Z

1. Sample: every VELOCITY alert in the v1 alert-feedback log with event_time >= 2026-10-14T00:00Z and < 2026-11-15T00:00Z, exported with tools/alert-eval/export_velocity_alerts.py. The log defines the sample; Telegram delivery is not a criterion.
2. Void if the v1 watcher sha256 prefix changes from 75787e84 during the window.
3. Prices: Binance USD-M archive, manifest-verified; dataset built with tools/alert-eval/velocity_excursions.py.
4. Side: fade if plan_tradable == y, else follow.
5. Entry at p0. Exit at first passage of TP or SL, else timeout at 30 min (drift_1800).
6. Geometries: TP 30 / SL 50 bps and TP 100 / SL 50 bps.
7. Costs: 5 bps entry, 2 bps TP exit, 5 bps SL or timeout exit.
8. Clusters: alerts less than 30 min apart form one cluster.
9. Success per geometry: mean net bps > 0 AND permutation p < 0.025 (random side per cluster, 1000 draws).
10. One evaluation after 2026-11-15T00:00Z. No interim looks, no rule changes.
11. Data note: OpenClaw gateway was down 2026-10-15 23:08-23:10 UTC and 2026-10-16 11:39-12:20 UTC.
