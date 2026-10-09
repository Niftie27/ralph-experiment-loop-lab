#!/usr/bin/env python3
"""Per-symbol collector and orderflow settings.

Defaults keep BTCUSDT behaviour identical to the first collector version.
Non-BTC defaults are calibrated from local recorded Binance futures data and
can be overridden from symbols.json or CLI flags.
"""
import argparse
import json
import math
import os
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass, fields


CONFIG_NAME = "symbols.json"


@dataclass
class SymbolSettings:
    symbol: str
    tick_size: float = 0.1
    price_decimals: int = 1
    level: float = 5.0
    profile_bin: float = 1.0
    big: float = 10.0
    cluster: float = 25.0
    wall: float = 25.0
    imb_min: float = 2.0
    heat_range: float = 150.0
    heat_step: float = 2.0
    frag_steps: tuple[float, float, float] = (50.0, 100.0, 200.0)

    def price(self, value):
        if value is None or (isinstance(value, float) and math.isnan(value)):
            return ""
        return f"{float(value):.{self.price_decimals}f}"

    def qty(self, value):
        return f"{float(value):.3f}"


DEFAULTS = {
    "BTCUSDT": SymbolSettings("BTCUSDT"),
}


def _config_path(path=None):
    if path:
        return path
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), CONFIG_NAME)


def _coerce(symbol, data):
    allowed = {f.name for f in fields(SymbolSettings)}
    clean = {k: v for k, v in data.items() if k in allowed}
    clean["symbol"] = symbol.upper()
    if "frag_steps" in clean:
        clean["frag_steps"] = tuple(float(x) for x in clean["frag_steps"])
    return SymbolSettings(**clean)


def load_symbols(path=None):
    out = {k: _coerce(k, asdict(v)) for k, v in DEFAULTS.items()}
    cfg = _config_path(path)
    try:
        with open(cfg, encoding="utf-8") as f:
            raw = json.load(f)
    except (OSError, ValueError):
        raw = {}
    for symbol, data in raw.items():
        base = asdict(out.get(symbol.upper(), DEFAULTS["BTCUSDT"]))
        base.update(data)
        out[symbol.upper()] = _coerce(symbol, base)
    return out


def price_decimals_from_tick(tick):
    s = f"{float(tick):.12f}".rstrip("0").rstrip(".")
    return len(s.split(".")[1]) if "." in s else 0


def _round_up_to_tick(value, tick):
    if tick <= 0:
        return value
    return round(math.ceil(float(value) / tick - 1e-12) * tick, 12)


def apply_exchange_info(settings, rest_base):
    """Fetch tickSize once at startup. If Binance is unavailable, keep config."""
    url = rest_base.rstrip("/") + "/fapi/v1/exchangeInfo?" + urllib.parse.urlencode({"symbol": settings.symbol})
    try:
        with urllib.request.urlopen(url, timeout=20) as r:
            data = json.loads(r.read())
    except (OSError, urllib.error.URLError, ValueError):
        return settings
    if not isinstance(data, dict):
        return settings
    symbols = data.get("symbols") or []
    if not symbols:
        return settings
    tick = None
    for filt in symbols[0].get("filters", []):
        if filt.get("filterType") == "PRICE_FILTER":
            tick = float(filt["tickSize"])
            break
    if tick is None:
        return settings
    settings.tick_size = tick
    settings.price_decimals = price_decimals_from_tick(tick)
    return settings


def for_symbol(symbol, path=None, rest_base=None, overrides=None):
    sym = symbol.upper()
    settings = load_symbols(path).get(sym)
    if settings is None:
        settings = _coerce(sym, asdict(DEFAULTS["BTCUSDT"]))
    settings.symbol = sym
    if rest_base:
        settings = apply_exchange_info(settings, rest_base)
    for key, value in (overrides or {}).items():
        if value is not None and hasattr(settings, key):
            setattr(settings, key, tuple(value) if key == "frag_steps" else value)
    settings.level = _round_up_to_tick(settings.level, settings.tick_size)
    settings.profile_bin = _round_up_to_tick(settings.profile_bin, settings.tick_size)
    settings.heat_step = _round_up_to_tick(settings.heat_step, settings.tick_size)
    settings.frag_steps = tuple(_round_up_to_tick(x, settings.tick_size) for x in settings.frag_steps)
    return settings


def add_cli_args(ap):
    have = {opt for action in ap._actions for opt in action.option_strings}
    def add(*names, **kwargs):
        if not any(name in have for name in names):
            ap.add_argument(*names, **kwargs)
    ap.add_argument("--symbols-config", help="per-symbol settings JSON, default: tools/collector/symbols.json")
    add("--price-decimals", type=int, help="override output price decimals")
    add("--tick-size", type=float, help="override symbol tick size")
    add("--level", type=float, help="override footprint price step")
    add("--profile-bin", type=float, help="override value-area profile bin")
    add("--big", type=float, help="override big trade quantity threshold")
    add("--cluster", type=float, help="override footprint cluster quantity threshold")
    add("--wall", type=float, help="override order book wall quantity threshold")
    add("--imb-min", type=float, help="override diagonal imbalance minimum quantity")
    add("--heat-range", type=float, help="override live heatmap +/- range")
    add("--heat-step", type=float, help="override live heatmap row size")
    add("--frag-steps", type=float, nargs=3, help="override fragility distance steps")


def overrides_from_args(args):
    out = {}
    for key in ("price_decimals", "tick_size", "heat_range", "heat_step", "frag_steps"):
        value = getattr(args, key, None)
        if value is not None:
            out[key] = value
    for cli_key, attr in (("level", "level"), ("profile_bin", "profile_bin"), ("big", "big"),
                          ("cluster", "cluster"), ("wall", "wall"), ("imb_min", "imb_min")):
        value = getattr(args, attr, None)
        if value is not None:
            out[cli_key] = value
    return out
