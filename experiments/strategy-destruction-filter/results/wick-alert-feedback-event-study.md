# WICK Alert Feedback Event Study

Generated: 2026-10-04T08:04:53.830Z

Status: research-only event study over local alert feedback. No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, risk, sizing, TP/SL, or execution changed.

## Decision

- Verdict: watch_or_kill_low_sample
- Candidate added: false
- Rationale: Current WICK evidence is low-sample; tradable fade rows are 41, with 17 supporting fade and 23 against fade.
- Next: Keep WICK evidence separate from VELOCITY; do not add a strict wick-fade candidate until sample and fade-support gates clear.

## Gates

- Minimum sample for candidate: 10
- Minimum dominant verdict share: 0.75
- Minimum tradable fade support share: 0.6

## Totals

- Included WICK reviews: 128
- Excluded WICK reviews: 4
- Buckets: 39
- Tradable fade rows: 41
- Candidate-ready buckets: 0

## Buckets

- ETH|5s|UP|tradable_fade|5/5: N=4, verdicts={"follow-useful":2,"fade-useful":2}, fadeSupport=0.5, 30mAvg=-0.1219%, 1hAvg=0.3709%, gate=watch_or_kill_low_sample (low_sample, weak_dominant_verdict_share, tradable_fade_not_supported_by_reviews)
- BTC|5s|UP|tradable_fade|0/5: N=4, verdicts={"fade-useful":1,"follow-useful":3}, fadeSupport=0.25, 30mAvg=0.195%, 1hAvg=0.4168%, gate=watch_or_kill_low_sample (low_sample, tradable_fade_not_supported_by_reviews)
- BTC|5s|UP|tradable_fade|4/5: N=4, verdicts={"follow-useful":2,"fade-useful":1,"noisy":1}, fadeSupport=0.25, 30mAvg=0.2918%, 1hAvg=0.6628%, gate=watch_or_kill_low_sample (low_sample, weak_dominant_verdict_share, tradable_fade_not_supported_by_reviews)
- ETH|5s|UP|tradable_fade|0/5: N=4, verdicts={"fade-useful":1,"follow-useful":3}, fadeSupport=0.25, 30mAvg=0.1465%, 1hAvg=-0.1222%, gate=watch_or_kill_low_sample (low_sample, tradable_fade_not_supported_by_reviews)
- BTC|5s|DOWN|tradable_fade|0/5: N=3, verdicts={"fade-useful":3}, fadeSupport=1, 30mAvg=-0.606%, 1hAvg=-0.5038%, gate=watch_or_kill_low_sample (low_sample)
- BTC|5s|DOWN|tradable_fade|4/5: N=3, verdicts={"fade-useful":2,"follow-useful":1}, fadeSupport=0.6667, 30mAvg=0.0209%, 1hAvg=0.0645%, gate=watch_or_kill_low_sample (low_sample, weak_dominant_verdict_share)
- ETH|5s|DOWN|tradable_fade|0/5: N=3, verdicts={"follow-useful":1,"fade-useful":2}, fadeSupport=0.6667, 30mAvg=-0.0254%, 1hAvg=-0.3328%, gate=watch_or_kill_low_sample (low_sample, weak_dominant_verdict_share)
- ETH|5s|UP|tradable_fade|4/5: N=3, verdicts={"follow-useful":1,"fade-useful":2}, fadeSupport=0.6667, 30mAvg=1.6925%, 1hAvg=2.083%, gate=watch_or_kill_low_sample (low_sample, weak_dominant_verdict_share)
- BTC|5s|UP|tradable_fade|5/5: N=3, verdicts={"follow-useful":3}, fadeSupport=0, 30mAvg=0.7459%, 1hAvg=0.638%, gate=watch_or_kill_low_sample (low_sample, tradable_fade_not_supported_by_reviews)
- BTC|5s|DOWN|tradable_fade|5/5: N=2, verdicts={"follow-useful":1,"fade-useful":1}, fadeSupport=0.5, 30mAvg=0.1503%, 1hAvg=0.2514%, gate=watch_or_kill_low_sample (low_sample, weak_dominant_verdict_share, tradable_fade_not_supported_by_reviews)
- ETH|5s|DOWN|tradable_fade|2/5: N=2, verdicts={"follow-useful":1,"fade-useful":1}, fadeSupport=0.5, 30mAvg=0.2672%, 1hAvg=0.0653%, gate=watch_or_kill_low_sample (low_sample, weak_dominant_verdict_share, tradable_fade_not_supported_by_reviews)
- ETH|5s|UP|tradable_fade|2/5: N=2, verdicts={"follow-useful":2}, fadeSupport=0, 30mAvg=0.1655%, 1hAvg=0.2061%, gate=watch_or_kill_low_sample (low_sample, tradable_fade_not_supported_by_reviews)
- ETH|5s|DOWN|tradable_fade|4/5: N=1, verdicts={"fade-useful":1}, fadeSupport=1, 30mAvg=-0.3434%, 1hAvg=-0.0316%, gate=watch_or_kill_low_sample (low_sample)
- BTC|5s|DOWN|tradable_fade|2/5: N=1, verdicts={"follow-useful":1}, fadeSupport=0, 30mAvg=0.1923%, 1hAvg=0.4496%, gate=watch_or_kill_low_sample (low_sample, tradable_fade_not_supported_by_reviews)
- BTC|5s|UP|tradable_fade|2/5: N=1, verdicts={"follow-useful":1}, fadeSupport=0, 30mAvg=0.3002%, 1hAvg=0.5037%, gate=watch_or_kill_low_sample (low_sample, tradable_fade_not_supported_by_reviews)
- ETH|5s|DOWN|tradable_fade|5/5: N=1, verdicts={"follow-useful":1}, fadeSupport=0, 30mAvg=0.2078%, 1hAvg=0.3997%, gate=watch_or_kill_low_sample (low_sample, tradable_fade_not_supported_by_reviews)

## Row IDs

- ETH|5s|UP|tradable_fade|5/5: ETH-UP-1787346706532-vqpevd, ETH-UP-1787624274735-z556ho, ETH-UP-1787822740840-bnajym, ETH-UP-1787925619971-9ah49p
- BTC|5s|UP|tradable_fade|0/5: BTC-UP-1787302155796-0f4tun, BTC-UP-1787319553744-1a3fqv, BTC-UP-1787666721714-hrrnwt, BTC-UP-1787926826253-b6jl5x
- BTC|5s|UP|tradable_fade|4/5: BTC-UP-1787172640292-pi9ade, BTC-UP-1787268306831-c05klf, BTC-UP-1787296518640-6wsdr3, BTC-UP-1790961896820-69qk6t
- ETH|5s|UP|tradable_fade|0/5: ETH-UP-1787155387758-6hajyk, ETH-UP-1787351639543-l44acr, ETH-UP-1787666721710-dvfqs5, ETH-UP-1787927717713-canlf3
- BTC|5s|DOWN|tradable_fade|0/5: BTC-DOWN-1787238511387-mzvvky, BTC-DOWN-1787275319882-irpp3q, BTC-DOWN-1787925796592-ifnk9o
- BTC|5s|DOWN|tradable_fade|4/5: BTC-DOWN-1786916406641-e8hw5f, BTC-DOWN-1787320689065-b3stna, BTC-DOWN-1787747408423-396e8g
- ETH|5s|DOWN|tradable_fade|0/5: ETH-DOWN-1787175220292-7f6ia5, ETH-DOWN-1787238511645-by69lq, ETH-DOWN-1787925796609-1akwtg
- ETH|5s|UP|tradable_fade|4/5: ETH-UP-1787172614564-fzmr6k, ETH-UP-1787225500796-3ofepo, ETH-UP-1787244073621-ke6bqj
- BTC|5s|UP|tradable_fade|5/5: BTC-UP-1787618594753-08i4ek, BTC-UP-1787624271618-4140ih, BTC-UP-1790914794505-uhcylz
- BTC|5s|DOWN|tradable_fade|5/5: BTC-DOWN-1787932936519-w6nkti, BTC-DOWN-1790961865240-o2fz2h
