export function spamCandidates() {
  const validation = {
    baseline: "time_matched_alternating_direction",
    gates: ["minSample", "expectancy", "profitFactor", "drawdown", "worstSlice", "outOfSample", "baselineLift", "deflatedSharpe"],
    killCriteria: ["low_sample", "weak_expectancy_after_costs", "weak_profit_factor", "weak_out_of_sample_expectancy", "weak_baseline_lift", "bad_failure_slice", "deflated_sharpe_fail"]
  };
  const dataRequirements = {
    markets: ["spot"],
    requiredFeatures: ["ohlcv", "volume", "rsi", "trend", "volatility"],
    minLookbackDays: 1825
  };

  return [
    {
      id: "spam-btc-volume-breakout-v0",
      idea: "Spam simple BTC volume-confirmed breakouts across 1h/4h to see whether any dumb breakout parameter pocket survives strict gates.",
      family: "spam_breakout",
      rule: "breakout",
      directions: ["long", "short"],
      thesis: thesis("range expansion after participation spike", "breakout direction should beat alternating-direction baseline after costs"),
      dataRequirements,
      validation,
      parameters: {
        symbol: ["BTC"],
        timeframe: ["1h", "4h"],
        lookback: [10, 20, 40],
        volumeZ: [0.2, 0.6, 1.0],
        rsiMinLong: [50, 55],
        rsiMaxShort: [45, 50]
      }
    },
    {
      id: "spam-btc-rsi-fade-v0",
      idea: "Spam BTC RSI mean-reversion fades with trend-strength caps.",
      family: "spam_mean_reversion",
      rule: "rsi_reversion",
      directions: ["long", "short"],
      thesis: thesis("stretched BTC moves can revert when trend strength is muted", "contrarian direction should beat timing baseline after costs"),
      dataRequirements,
      validation,
      parameters: {
        symbol: ["BTC"],
        timeframe: ["1h", "4h"],
        rsiLow: [25, 30, 35],
        rsiHigh: [65, 70, 75],
        maxTrendStrength: [0.005, 0.01, 0.02]
      }
    },
    {
      id: "spam-btc-ma-reclaim-v0",
      idea: "Spam BTC moving-average reclaim/reject continuation variants.",
      family: "spam_trend_pullback",
      rule: "ma_reclaim",
      directions: ["long", "short"],
      thesis: thesis("pullbacks can continue after reclaiming or rejecting a fast moving average", "MA reclaim/reject should survive OOS and baseline-lift gates"),
      dataRequirements,
      validation,
      parameters: {
        symbol: ["BTC"],
        timeframe: ["1h", "4h"],
        fast: [10, 20],
        slow: [50, 100],
        rsiFloorLong: [45, 50],
        rsiCeilShort: [50, 55]
      }
    },
    {
      id: "spam-btc-downshock-fade-v0",
      idea: "Spam BTC downside volume-shock fades.",
      family: "spam_velocity_fade",
      rule: "volume_velocity_fade",
      directions: ["long"],
      thesis: thesis("fast BTC downside shocks can exhaust when volume is already elevated", "down-shock fade should beat matched timestamp baseline after costs"),
      dataRequirements,
      validation,
      parameters: {
        symbol: ["BTC"],
        timeframe: ["1h", "4h"],
        returnLookback: [1, 2],
        minMovePct: [0.5, 0.8, 1.2],
        volumeZ: [0.8, 1.3],
        rsiLow: [35, 45],
        rsiHigh: [55]
      }
    },
    {
      id: "spam-btc-upshock-fade-v0",
      idea: "Spam BTC upside volume-shock fades.",
      family: "spam_velocity_fade",
      rule: "volume_velocity_fade",
      directions: ["short"],
      thesis: thesis("fast BTC upside shocks can exhaust when volume is already elevated", "up-shock fade should beat matched timestamp baseline after costs"),
      dataRequirements,
      validation,
      parameters: {
        symbol: ["BTC"],
        timeframe: ["1h", "4h"],
        returnLookback: [1, 2],
        minMovePct: [0.5, 0.8, 1.2],
        volumeZ: [0.8, 1.3],
        rsiLow: [45],
        rsiHigh: [55, 65]
      }
    },
    {
      id: "spam-alt-btc-gated-ma-reclaim-v0",
      idea: "Spam ETH/SOL continuation after moving-average reclaim/reject, but only when BTC regime explicitly agrees with the alt direction.",
      family: "spam_alt_btc_gated_continuation",
      rule: "ma_reclaim",
      directions: ["long", "short"],
      thesis: thesis("alt continuation has a better prior when BTC regime aligns first", "alt MA reclaim/reject should only count when BTC gate permits the direction"),
      dataRequirements: {
        markets: ["spot"],
        requiredFeatures: ["ohlcv", "rsi", "trend", "btc_regime_gate"],
        minLookbackDays: 1825
      },
      validation,
      parameters: {
        symbol: ["ETH", "SOL"],
        timeframe: ["1h", "4h"],
        fast: [10, 20],
        slow: [50, 100],
        rsiFloorLong: [45, 50],
        rsiCeilShort: [50, 55]
      }
    },
    {
      id: "spam-alt-btc-gated-rsi-fade-v0",
      idea: "Spam ETH/SOL RSI fades only when BTC regime permits the fade direction.",
      family: "spam_alt_btc_gated_fade",
      rule: "rsi_reversion",
      directions: ["long", "short"],
      thesis: thesis("alt mean-reversion is less dangerous when it does not fight BTC regime", "alt RSI fade should survive only after BTC-gated direction filtering"),
      dataRequirements: {
        markets: ["spot"],
        requiredFeatures: ["ohlcv", "rsi", "trend", "btc_regime_gate"],
        minLookbackDays: 1825
      },
      validation,
      parameters: {
        symbol: ["ETH", "SOL"],
        timeframe: ["1h", "4h"],
        rsiLow: [25, 30, 35],
        rsiHigh: [65, 70, 75],
        maxTrendStrength: [0.005, 0.01]
      }
    }
  ];
}

function thesis(mechanism, expectedBehavior) {
  return {
    mechanism,
    edgeSpeed: "hours",
    expectedBehavior,
    falsifiableClaim: "Reject unless the variant survives sample, expectancy, profit-factor, drawdown, worst-slice, out-of-sample, baseline-lift, and deflated-Sharpe gates."
  };
}
