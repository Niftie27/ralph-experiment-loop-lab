# Disk audit - 2026-10-10

Scope: read-only audit. No files were deleted or changed.

## Summary

`/home/coder` uses about 35 GiB. `/home/coder/data` is only 2.3 GiB, so most disk use is outside the live collector data path.

Best candidates to free space, pending Tomas approval:

- `ralph-research-os` experiment archive/cache CSVs: largest single source. The `ralph-research-os` tree is 17 GiB; many largest files are unpacked Binance archive CSVs under `experiments/btc-eth-alert-edge/data/binance-usdm-archive-cache/`. Potential: several GiB, likely the bulk of the 17 GiB if the cache can be regenerated.
- OpenClaw agent logs: `logs_2.sqlite` is 0.73 GiB. Potential: about 0.7 GiB if compacted/rotated safely by OpenClaw tooling.
- Speech/STT models and caches: `.local/share/echogarden` is 3.7 GiB, with model files of 1.51 GiB, 1.19 GiB, and 0.45 GiB. Potential: up to about 3.7 GiB if those models are not needed locally.
- Package caches: `.npm` 1.9 GiB, `.cache/uv` 1.6 GiB, Hugging Face 0.54 GiB, Playwright 0.64 GiB. Potential: about 4.7 GiB if caches are cleanable and rebuild/download cost is acceptable.
- Workspace temp dirs: `.tmp`, `.tmp-stt`, `.tmp-transcribe` total about 2.2 GiB. Potential: about 2 GiB if no active jobs depend on them.
- Live collector `/home/coder/data`: 2.3 GiB. Leave to the storage-maintenance/retention path rather than manual deletion.

## Required output

Command:

```bash
du -xh --max-depth=3 /home/coder 2>/tmp/du-home-errors.log | sort -h | tail -30
```

Output:

```text
539M	/home/coder/.cache/huggingface/hub
610M	/home/coder/.npm-global
610M	/home/coder/.npm-global/lib
610M	/home/coder/.npm-global/lib/node_modules
641M	/home/coder/.cache/ms-playwright
693M	/home/coder/.openclaw/workspace/.tmp-transcribe
713M	/home/coder/.openclaw/workspace/.tmp-stt
715M	/home/coder/.openclaw/workspace/crypto-updates
721M	/home/coder/data/binance-ethusdt
805M	/home/coder/.npm/_npx/e9225f775dff863b
806M	/home/coder/data/binance
839M	/home/coder/.openclaw/workspace/.tmp
847M	/home/coder/.local/opt
862M	/home/coder/.npm/_npx
998M	/home/coder/.npm/_cacache/content-v2
1014M	/home/coder/.npm/_cacache
1.5G	/home/coder/.cache/uv/archive-v0
1.6G	/home/coder/.cache/uv
1.8G	/home/coder/.openclaw/agents
1.8G	/home/coder/.openclaw/agents/main
1.9G	/home/coder/.npm
2.3G	/home/coder/data
2.8G	/home/coder/.cache
3.7G	/home/coder/.local/share/echogarden
4.1G	/home/coder/.local/share
5.0G	/home/coder/.local
17G	/home/coder/.openclaw/workspace/ralph-research-os
20G	/home/coder/.openclaw/workspace
22G	/home/coder/.openclaw
35G	/home/coder
```

Command:

```bash
find /home/coder -xdev -type f -size +200M -printf '%s %p\n' 2>/tmp/find-big-errors.log | sort -n | tail -20
```

20 largest files over 200 MiB:

```text
0.28 GiB /home/coder/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/binance-usdm-archive-cache/__data__futures__um__daily__trades__BTCUSDT__BTCUSDT-trades-2026-08-25.zip.csv
0.29 GiB /home/coder/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/binance-usdm-archive-cache/__data__futures__um__daily__trades__ETHUSDT__ETHUSDT-trades-2026-09-14.zip.csv
0.29 GiB /home/coder/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/binance-usdm-archive-cache/__data__futures__um__daily__trades__BTCUSDT__BTCUSDT-trades-2026-08-24.zip.csv
0.31 GiB /home/coder/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/binance-usdm-archive-cache/__data__futures__um__daily__trades__ETHUSDT__ETHUSDT-trades-2026-08-23.zip.csv
0.32 GiB /home/coder/.npm/_npx/e9225f775dff863b/node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime_providers_cuda.so
0.32 GiB /home/coder/.openclaw/workspace/crypto-updates/runtime/orderflow-spikes/2026-08-22T08-39-ralph-hl-btc-2h/raw-events.jsonl
0.33 GiB /home/coder/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/binance-usdm-archive-cache/__data__futures__um__daily__trades__BTCUSDT__BTCUSDT-trades-2026-08-20.zip.csv
0.33 GiB /home/coder/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/binance-usdm-archive-cache/__data__futures__um__daily__trades__XRPUSDT__XRPUSDT-trades-2026-08-21.zip.csv
0.34 GiB /home/coder/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/binance-usdm-archive-cache/__data__futures__um__daily__trades__ETHUSDT__ETHUSDT-trades-2026-08-25.zip.csv
0.38 GiB /home/coder/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/binance-usdm-archive-cache/__data__futures__um__daily__trades__ETHUSDT__ETHUSDT-trades-2026-09-18.zip.csv
0.45 GiB /home/coder/.local/share/echogarden/packages/whisper-large-v3-turbo-fp16-20241002/decoder.onnx
0.45 GiB /home/coder/.cache/huggingface/hub/models--Systran--faster-whisper-small/blobs/3e305921506d8872816023e4c273e75d2419fb89b24da97b4fe7bce14170d671
0.48 GiB /home/coder/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/binance-usdm-archive-cache/__data__futures__um__daily__trades__ETHUSDT__ETHUSDT-trades-2026-09-21.zip.csv
0.48 GiB /home/coder/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/binance-usdm-archive-cache/__data__futures__um__daily__trades__ETHUSDT__ETHUSDT-trades-2026-08-19.zip.csv
0.52 GiB /home/coder/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/binance-usdm-archive-cache/__data__futures__um__daily__trades__BTCUSDT__BTCUSDT-trades-2026-08-21.zip.csv
0.52 GiB /home/coder/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/binance-usdm-archive-cache/__data__futures__um__daily__trades__XRPUSDT__XRPUSDT-trades-2026-08-22.zip.csv
0.62 GiB /home/coder/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/binance-usdm-archive-cache/__data__futures__um__daily__trades__ETHUSDT__ETHUSDT-trades-2026-08-21.zip.csv
0.73 GiB /home/coder/.openclaw/agents/main/agent/codex-home/logs_2.sqlite
1.19 GiB /home/coder/.local/share/echogarden/packages/whisper-large-v3-turbo-fp16-20241002/encoder.onnx
1.51 GiB /home/coder/.local/share/echogarden/packages/whisper.cpp-large-v3-turbo-20241003/ggml-large-v3-turbo.bin
```

No deletion was performed.
