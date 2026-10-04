# Market Volatility Watch Loop

Purpose: monitor market conditions as context for research, not as an execution signal.

## Trigger

- Future approved A2 cadence.
- Manual A1 request after major crypto move.

## Inputs

- BTC/ETH/SOL price and volatility context
- security incidents
- protocol incidents
- liquidation spikes
- exchange/custody/stablecoin events
- wallet/entity movement when available

## Actions

1. Check whether large moves or incidents occurred.
2. Record why the event might matter for strategy research.
3. Link event to candidate strategies or unknowns.
4. Ask what a bot would need to know before, during, and after the event.
5. Do not generate trade recommendations.

## Outputs

- battlefield note under `wiki/notes/`
- candidate or unknown update
- event sample for future replay

## Safety

- Market movement is research context only.
- No alert-to-trade path.

