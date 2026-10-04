# E2E Latency Baseline

Generated: 2026-10-04T20:36:57.386Z

Status: research-only, read-only measurement. No live trading, private keys, tx signing, bundle submission, paid infra, scheduler change, alert wording change, risk/sizing/TP/SL change, or execution path.

## Decision

- Verdict: no_positive_after_v0_costs_in_tiny_baseline
- Rationale: This tiny baseline found no post-cost-positive route after conservative v0 proxy costs. It is not a final kill, but it blocks promotion.
- No live change: true

## Scope

- Chain: avalanche (43114)
- Pair: WAVAX/USDC
- Providers: avalanche_official_http, avalanche_publicnode_http
- Venues: uniswap_v3_500/v3, traderjoe_lb_v22/lb
- Notionals: $100, $300, $1000
- Delay buckets: 500ms, 1000ms
- Cost model: v0_proxy

## Factor Context

- BTC gate: BTC_TRANSITION
- BTC reason: BTCUSDT 30m change 0.002241, highDist 0, lowDist 0.002385
- ETH/major state: ETH_MIXED
- Factor class: none

## Totals

- Samples: 72
- Quote errors: 0
- Post-cost positives: 0
- Latency survived: 0

## Route Groups

- avalanche_official_http|uniswap_v3_500|traderjoe_lb_v22|100: samples=6, success=1, p50=400.5ms, p95=514.5ms, medianBlockLag=4996ms, bestNet=-0.34949212, postCost=0, survived=0, killReasons={"not_positive_after_v0_proxy_costs":2,"positive_did_not_survive_delay_or_never_positive":4}
- avalanche_official_http|traderjoe_lb_v22|uniswap_v3_500|100: samples=6, success=1, p50=385ms, p95=408.75ms, medianBlockLag=4320ms, bestNet=-0.28647029, postCost=0, survived=0, killReasons={"not_positive_after_v0_proxy_costs":2,"positive_did_not_survive_delay_or_never_positive":4}
- avalanche_official_http|uniswap_v3_500|traderjoe_lb_v22|300: samples=6, success=1, p50=378ms, p95=399ms, medianBlockLag=4461.5ms, bestNet=-1.06752312, postCost=0, survived=0, killReasons={"not_positive_after_v0_proxy_costs":2,"positive_did_not_survive_delay_or_never_positive":4}
- avalanche_official_http|traderjoe_lb_v22|uniswap_v3_500|300: samples=6, success=1, p50=386ms, p95=396.75ms, medianBlockLag=3948.5ms, bestNet=-0.72190429, postCost=0, survived=0, killReasons={"not_positive_after_v0_proxy_costs":2,"positive_did_not_survive_delay_or_never_positive":4}
- avalanche_official_http|uniswap_v3_500|traderjoe_lb_v22|1000: samples=6, success=1, p50=387ms, p95=397.25ms, medianBlockLag=5127.5ms, bestNet=-2.93432229, postCost=0, survived=0, killReasons={"not_positive_after_v0_proxy_costs":2,"positive_did_not_survive_delay_or_never_positive":4}
- avalanche_official_http|traderjoe_lb_v22|uniswap_v3_500|1000: samples=6, success=1, p50=391ms, p95=409.5ms, medianBlockLag=3804ms, bestNet=-2.35901876, postCost=0, survived=0, killReasons={"not_positive_after_v0_proxy_costs":2,"positive_did_not_survive_delay_or_never_positive":4}
- avalanche_publicnode_http|uniswap_v3_500|traderjoe_lb_v22|100: samples=6, success=1, p50=397.5ms, p95=440.75ms, medianBlockLag=2619ms, bestNet=-0.35314029, postCost=0, survived=0, killReasons={"not_positive_after_v0_proxy_costs":2,"positive_did_not_survive_delay_or_never_positive":4}
- avalanche_publicnode_http|traderjoe_lb_v22|uniswap_v3_500|100: samples=6, success=1, p50=390.5ms, p95=414.75ms, medianBlockLag=2306ms, bestNet=-0.38683229, postCost=0, survived=0, killReasons={"not_positive_after_v0_proxy_costs":2,"positive_did_not_survive_delay_or_never_positive":4}
- avalanche_publicnode_http|uniswap_v3_500|traderjoe_lb_v22|300: samples=6, success=1, p50=392ms, p95=684ms, medianBlockLag=2216.5ms, bestNet=-0.92249429, postCost=0, survived=0, killReasons={"not_positive_after_v0_proxy_costs":2,"positive_did_not_survive_delay_or_never_positive":4}
- avalanche_publicnode_http|traderjoe_lb_v22|uniswap_v3_500|300: samples=6, success=1, p50=388ms, p95=424.75ms, medianBlockLag=3786.5ms, bestNet=-1.02179629, postCost=0, survived=0, killReasons={"not_positive_after_v0_proxy_costs":2,"positive_did_not_survive_delay_or_never_positive":4}
- avalanche_publicnode_http|uniswap_v3_500|traderjoe_lb_v22|1000: samples=6, success=1, p50=388ms, p95=409.25ms, medianBlockLag=2783.5ms, bestNet=-2.93432229, postCost=0, survived=0, killReasons={"not_positive_after_v0_proxy_costs":2,"positive_did_not_survive_delay_or_never_positive":4}
- avalanche_publicnode_http|traderjoe_lb_v22|uniswap_v3_500|1000: samples=6, success=1, p50=390.5ms, p95=404.75ms, medianBlockLag=3128.5ms, bestNet=-3.26590827, postCost=0, survived=0, killReasons={"not_positive_after_v0_proxy_costs":2,"positive_did_not_survive_delay_or_never_positive":4}

## Interpretation

- This is a tiny access-path baseline, not a strategy result.
- Gross quote mismatches are discovery/debug signals only.
- Any extension still needs longer sampling, provider disagreement checks, exact quoter/pool sanity, and the historical/live timing join before an execution-research label.
