# OpenClaw agent crash read-only check - 2026-10-10

Scope: read-only check for the two Telegram direct-session failures around 2026-10-10 12:11Z and 12:13Z. No OpenClaw service changes were made.

## Finding

Both failures were OpenClaw embedded-agent prompt failures caused by the remote Codex compact endpoint returning HTTP 404. I found no evidence in these lines that a large local command output or `storage_maintenance.py` failure caused the crash.

## Evidence

Command used:

```bash
journalctl --user --since '2026-10-10 12:08:00 UTC' --until '2026-10-10 12:16:00 UTC' --no-pager -o short-iso | rg -i 'openclaw|codex|error|exception|fatal|something went wrong|crash|oom|killed' | head -120
```

Relevant error lines:

```text
2026-10-10T12:11:26+00:00 node[3664620]: [diagnostic] lane task error: lane=main durationMs=413707 error="Error: Error running remote compact task: unexpected status 404 Not Found: {"detail":"Not Found"}, url: https://chatgpt.com/backend-api/codex/responses/compact, request id: 101d3e7d-6ec5-40a6-a8df-e343e9abef7d"
2026-10-10T12:11:26+00:00 node[3664620]: [diagnostic] lane task error: lane=session:agent:main:telegram:direct:1539856256 durationMs=413709 error="Error: Error running remote compact task: unexpected status 404 Not Found: {"detail":"Not Found"}, url: https://chatgpt.com/backend-api/codex/responses/compact, request id: 101d3e7d-6ec5-40a6-a8df-e343e9abef7d"
2026-10-10T12:11:26+00:00 node[3664620]: Embedded agent failed before reply: Error running remote compact task: unexpected status 404 Not Found: {"detail":"Not Found"}, url: https://chatgpt.com/backend-api/codex/responses/compact, request id: 101d3e7d-6ec5-40a6-a8df-e343e9abef7d
2026-10-10T12:13:14+00:00 node[3664620]: [diagnostic] lane task error: lane=main durationMs=2501 error="Error: Error running remote compact task: unexpected status 404 Not Found: {"detail":"Not Found"}, url: https://chatgpt.com/backend-api/codex/responses/compact, request id: 73741a1f-3bff-4175-b059-01aa93b4a67d"
2026-10-10T12:13:14+00:00 node[3664620]: [diagnostic] lane task error: lane=session:agent:main:telegram:direct:1539856256 durationMs=2502 error="Error: Error running remote compact task: unexpected status 404 Not Found: {"detail":"Not Found"}, url: https://chatgpt.com/backend-api/codex/responses/compact, request id: 73741a1f-3bff-4175-b059-01aa93b4a67d"
2026-10-10T12:13:14+00:00 node[3664620]: Embedded agent failed before reply: Error running remote compact task: unexpected status 404 Not Found: {"detail":"Not Found"}, url: https://chatgpt.com/backend-api/codex/responses/compact, request id: 73741a1f-3bff-4175-b059-01aa93b4a67d
```

Operational note: keep future command output short with `head`, `tail`, counts, and focused excerpts.
