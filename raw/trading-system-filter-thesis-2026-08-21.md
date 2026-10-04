# Trading-System Filter Thesis

Date: 2026-08-21
Source: Tomas shared a trading-system thread in Telegram.
Status: Raw project memory for RALPH.

## Core Thesis

A trading agent that learns from internet strategies is dangerous if it mixes entries, exits, and trader threads into a strategy and treats that as an edge. The useful role for AI is not to generate more strategies. It is to destroy weak ideas faster.

## Build Implication

RALPH should be a strategy validation and filtering system before it is a trading bot. A user can write an idea in simple English, but the system must translate it into explicit rules, generate testable code, run backtests over years and hostile regimes, include realistic fees/slippage, analyze failure modes, and only then decide whether the idea deserves more work.

## Required Filters

- Realistic costs and slippage.
- Bad-market stress tests.
- Regime and slice analysis.
- Out-of-sample or walk-forward checks.
- Multiple-testing adjustment such as deflated Sharpe, so parameter searches do not promote luck.
- Paper-trading gate before live execution.
- Separate risk/verifier gate from the strategy generator.

## RALPH Rule

Generate many candidates only if the system is even better at killing them. Production promotion should be rare and evidence-backed.
