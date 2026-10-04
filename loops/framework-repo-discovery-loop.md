# Framework And Repo Discovery Loop

Purpose: continuously find public frameworks, repos, and architecture examples that can teach RALPH how trading bot systems are structured.

## Trigger

- Manual A1 request.
- Future approved A2 cadence.

## Search Targets

- trading bot frameworks
- backtesting frameworks
- paper trading frameworks
- event-driven bot repos
- wallet/intelligence repos
- MEV/searcher educational repos
- liquidation monitors
- simulation/replay harnesses

## Actions

1. Search local memory first.
2. Search GitHub and public web sources when needed.
3. For each candidate repo, record:
   - purpose
   - maturity
   - language/runtime
   - strategy type
   - data sources
   - simulation/backtest support
   - live-trading boundaries
   - fit for RALPH
   - risks
4. Promote only repos that teach architecture or enable read-only validation.
5. Reject hype repos that only offer live execution or shallow AI trading claims.

## Outputs

- source candidate or source page
- repo note under `wiki/notes/` or `wiki/repos/`
- candidate score
- work queue update

## Stop Conditions

- A concrete repo shortlist exists, or the search produced only low-signal results and that is recorded.

