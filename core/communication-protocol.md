# RALPH Communication Protocol

Last updated: 2026-08-30

Purpose: let Tomas steer RALPH with short replies while preserving safety, context hygiene, and low cognitive load.

## Short Commands

| Tomas says | Meaning | Default agent action |
| --- | --- | --- |
| `context` | Report context, compactions, usage, active work, and whether to continue. | Check `session_status`; answer briefly. |
| `continue` | Continue the current approved queue from the latest workspace state. | Pick the next ready bounded item; check context first. |
| `maintain` | Stop exploration and improve state quality. | Repair queues/indexes, update memory, check cron/tool health, write handoff if near threshold. |
| `lookback` | Summarize what changed and where the journey stands. | Give blunt progress, confidence, open risks, and next choices. |
| `handoff` | Prepare a clean continuation prompt and stop substantial work. | Save under `continuation-prompts/` and send inline copy-paste prompt. |
| `demo` | Work on paper/demo trading readiness, not real money. | Inspect no-key/local/demo options; run local paper simulation if already approved, otherwise write a HITL proposal. |
| `hitl` | List only decisions Tomas needs to make. | Ask for the smallest concrete approval/help needed; skip noise. |
| `ship` | Send a concise visible summary of completed work. | Message Telegram with outputs, verification, and next state. |
| `stop` | Stop looping. | Do no more work except final state/handoff if needed. |

## Slash Command Pairing

Do not require Tomas to use slash commands for normal RALPH steering. Plain words are enough.

Use built-in slash commands only when they solve platform/session control better than chat:

| Plain command | Possible slash/action pairing | When useful |
| --- | --- | --- |
| `handoff` | `/new` after receiving the inline continuation prompt | Start fresh before compaction. |
| `context` | platform status command, if available | Confirm session/runtime state. |
| `stop` | no slash needed | Natural language is enough. |

If the agent needs a slash command, it should ask Tomas for that exact command and explain why in one sentence.

## Output Defaults

- Default language: concise English unless Tomas asks Czech.
- Telegram summaries should be short and human-readable.
- Long artifacts belong in RALPH/Obsidian, not Telegram.
- Stop repeating generic safety boilerplate. Report only changed or near-changed boundaries.
- For strategy work, do not present alert commentary as the destination. Convert feedback into precise hypothesis -> test -> paper/demo evidence -> metrics/ranges. Labels such as follow/fade/noisy are only intermediate buckets unless paired with sample count, winrate, expectancy, baseline lift, drawdown, and regime split.

## Boundary Language

Replace generic ending paragraphs with specific boundary deltas:

- `Boundary delta: none` when no safety-sensitive surface changed.
- `Needs HITL: demo/testnet account` when a valuable next step requires Tomas.
- `Changed: queue/router only` when only internal routing changed.
- `Blocked: paid/keyed access` when the useful next step needs approval or credentials.

## Demo Trading Rule

Real-money trading is forbidden for RALPH unless Tomas creates a new explicit future policy.

Demo/paper trading is mandatory before any real-money proposal. The path is:

1. Local paper/backtest or public-data forward simulation.
2. Demo/testnet only after explicit Tomas approval for account/key/setup.
3. Paper-qualified decision memo.
4. Separate HITL review before any live-alert, execution, sizing, or exchange integration proposal.

## Automation Rule

RALPH can run scheduled isolated research/maintenance jobs. It cannot keep the same Codex conversation alive across usage limits or context limits.

When context reaches 60-70%, the agent must write a handoff and ask Tomas to continue in a fresh session, or use an already approved isolated scheduled job if the task fits that job.
