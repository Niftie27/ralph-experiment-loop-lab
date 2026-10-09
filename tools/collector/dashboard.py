#!/usr/bin/env python3
"""
dashboard.py - live dashboard for the data from binance_live.py --features

    python3 dashboard.py
    then open http://localhost:8050 in your browser (works from Windows too)

    /         live: order book heatmap with price and trades, fragility, footprint of the current minute, tape, events
              (pushed by the collector over a WebSocket on the dashboard port + 1, i.e. 8051, no polling;
              through an SSH tunnel use local ports 18050 and 18051, or add ?ws=PORT to the URL)
    /prehled  overview: 1-minute candles, VWAP, delta, CVD, velocity

It only reads files, it never touches the collector. Options: --features (~/data/features),
--data (~/data/binance), --port (8050).
"""
import argparse
import http.server
import json
import os
import time
from datetime import datetime, timezone

PAGE = r"""<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BTC živě</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Source+Serif+4:opsz,wght@8..60,400..600&display=swap" rel="stylesheet">
<style>
:root { --paper:#EEF2F4; --panel:#F8FAFB; --ink:#142230; --ink-2:#3D4B59; --muted:#66727F; --rule:#CBD4DC; --grid:#E1E6EA;
  --buy:#0E8A6E; --sell:#C2413B; --vwap:#B4730F; --band:#5462A8; --warn:#B4730F;
  --sans:"Archivo","Helvetica Neue",Arial,sans-serif; --serif:"Source Serif 4",Georgia,serif; color-scheme:light; }
@media (prefers-color-scheme: dark) { :root { --paper:#0E1822; --panel:#13202C; --ink:#E3E9EE; --ink-2:#B8C4CE; --muted:#8796A4;
  --rule:#283746; --grid:#1A2733; --buy:#2DBF97; --sell:#EA6A63; --vwap:#E7A841; --band:#8F9CEB; --warn:#E7A841; color-scheme:dark; } }
* { box-sizing:border-box; }
body { margin:0; background:var(--paper); color:var(--ink); font-family:var(--sans); font-variant-numeric:tabular-nums; }
.wrap { max-width:1440px; margin:0 auto; padding:18px clamp(12px,2.5vw,32px) 48px; }
header { display:flex; flex-wrap:wrap; align-items:baseline; gap:10px 22px; padding-bottom:14px; border-bottom:1px solid var(--rule); }
h1 { margin:0; font-size:clamp(1.8rem,4vw,2.8rem); font-weight:760; font-stretch:125%; letter-spacing:-.03em; }
.pill { font-weight:650; font-size:.95rem; padding:5px 12px; border-radius:999px; border:1px solid var(--rule); }
.pill.ok { color:var(--buy); border-color:var(--buy); } .pill.warn { color:var(--warn); border-color:var(--warn); } .pill.bad { color:var(--sell); border-color:var(--sell); }
.sub { color:var(--muted); font-size:.88rem; }
.cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(165px,1fr)); gap:12px; margin:16px 0; }
.card { background:var(--panel); border:1px solid var(--rule); border-radius:6px; padding:12px 14px; }
.card .k { font-size:.8rem; color:var(--muted); font-weight:600; }
.card .v { font-size:1.45rem; font-weight:720; margin:3px 0 2px; }
.card .w { font-size:.92rem; font-weight:600; }
.card .x { font-family:var(--serif); font-size:.82rem; color:var(--ink-2); margin-top:6px; line-height:1.4; }
.buy { color:var(--buy); } .sell { color:var(--sell); } .warnc { color:var(--warn); }
.main { display:grid; grid-template-columns:minmax(0,1fr) 360px; gap:16px; align-items:start; }
.chartbox { position:relative; background:var(--panel); border:1px solid var(--rule); border-radius:6px; }
#chart { height:clamp(520px,70vh,780px); }
.panelabel { position:absolute; left:10px; z-index:5; font-size:.75rem; font-weight:600; color:var(--muted); pointer-events:none;
  background:color-mix(in srgb,var(--panel) 82%,transparent); padding:1px 5px; border-radius:2px; }
.legend { display:flex; flex-wrap:wrap; gap:4px 14px; padding:8px 12px; border-top:1px solid var(--rule); font-size:.78rem; color:var(--ink-2); }
.legend i { display:inline-block; width:12px; height:3px; margin-right:5px; vertical-align:middle; }
aside h2 { font-size:1rem; margin:0 0 8px; font-stretch:110%; }
.events { list-style:none; margin:0 0 18px; padding:0; max-height:360px; overflow:auto; border:1px solid var(--rule); border-radius:6px; background:var(--panel); }
.events li { padding:7px 10px; border-bottom:1px solid var(--grid); font-size:.86rem; line-height:1.35; }
.events li .t { color:var(--muted); margin-right:6px; font-weight:600; }
.ladwrap { max-height:380px; overflow:auto; border:1px solid var(--rule); border-radius:6px; background:var(--panel); }
table.ladder { width:100%; border-collapse:collapse; font-size:.8rem; }
.ladder th { position:sticky; top:0; background:var(--panel); color:var(--muted); font-weight:600; padding:5px; border-bottom:1px solid var(--rule); }
.ladder td { padding:2px 8px; } .ladder td.s { text-align:right; } .ladder td.p { text-align:center; color:var(--ink-2); }
.ladder tr.poc td.p { outline:1.5px solid var(--ink); outline-offset:-2px; font-weight:700; color:var(--ink); }
.ladsum, .hint { font-family:var(--serif); font-size:.84rem; color:var(--ink-2); margin:0 0 8px; }
details.guide { margin-top:22px; border-top:1px solid var(--rule); padding-top:14px; }
details.guide summary { cursor:pointer; font-weight:700; }
.gl { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:10px 28px; margin-top:12px; }
.gl p { margin:0; font-family:var(--serif); font-size:.92rem; line-height:1.5; } .gl b { font-family:var(--sans); }
.empty { padding:30px; font-family:var(--serif); font-size:1.1rem; color:var(--ink-2); }
@media (max-width:1050px) { .main { grid-template-columns:minmax(0,1fr); } }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>BTC živě</h1>
    <span id="pill" class="pill">Načítám…</span>
    <span class="sub" id="sub"></span>
    <a href="/" style="margin-left:auto;color:var(--ink-2);font-size:.88rem">← Živě: kniha a obchody</a>
  </header>
  <div id="empty" class="empty" hidden></div>
  <section class="cards" id="cards"></section>
  <section class="main">
    <div class="chartbox">
      <div id="chart"></div><div id="panelabels"></div>
      <div class="legend">
        <span><i style="background:var(--vwap)"></i>průměr dne (VWAP)</span>
        <span><i style="background:var(--band)"></i>normální rozsah ±1σ, ±2σ</span>
        <span><i style="background:var(--buy)"></i>kupci tlačí</span>
        <span><i style="background:var(--sell)"></i>prodávající tlačí</span>
        <span>tmavé čtverečky = velryby, kolečka = zeď (absorpce), šipky = trh zrychlil</span>
      </div>
    </div>
    <aside>
      <h2>Co se právě stalo</h2>
      <p class="hint"><label><input type="checkbox" id="shownoisy"> ukázat i změny zdí v knize a velké shluky</label></p>
      <ul class="events" id="events"></ul>
      <h2>Uvnitř svíčky</h2>
      <p class="hint">Klikni na svíčku. Vlevo kolik se prodalo, vpravo kolik se koupilo, na každé ceně.</p>
      <p class="ladsum" id="ladsum"></p>
      <div class="ladwrap"><table class="ladder" id="ladder"><thead><tr><th>Prodáno</th><th>Cena</th><th>Koupeno</th></tr></thead><tbody></tbody></table></div>
    </aside>
  </section>
  <details class="guide">
    <summary>Co znamená co (pro jeskynního člověka)</summary>
    <div class="gl">
      <p><b>Svíčka.</b> Jedna minuta. Kde cena začala, skončila, kam nejvýš a nejníž došla.</p>
      <p><b>Kupci a prodávající tlačí.</b> Kdo klikl „kup hned“ nebo „prodej hned“. Zelená kupci, červená prodávající.</p>
      <p><b>Delta.</b> Koupeno minus prodáno ve svíčce. Plus = kupci tlačili víc.</p>
      <p><b>CVD.</b> Delta sčítaná od půlnoci UTC. Skóre zápasu za celý den.</p>
      <p><b>Průměr dne (VWAP) a pásma.</b> Průměrná cena, za kterou se dnes obchodovalo. Za ±2σ je cena natažená jako guma.</p>
      <p><b>POC, VAH, VAL.</b> POC je cena, kde se dnes obchodovalo nejvíc. Mezi VAL a VAH je 70 % dnešního objemu.</p>
      <p><b>Velryba.</b> Jeden velký příkaz (10 BTC a víc), i když projel přes víc cen.</p>
      <p><b>Absorpce (zeď).</b> Někdo hodně tlačil, ale cena se nepohnula. Čekající příkazy to spolkly.</p>
      <p><b>Rychlost trhu.</b> Kolikrát rychleji se obchoduje než posledních 5 minut. Říká „něco se děje“, ne kam.</p>
      <p><b>Kniha.</b> Čekající limitní příkazy. Zeď = hodně BTC na jedné ceně. Stažená zeď zmizela bez obchodu.</p>
      <p><b>Likvidace.</b> Burza násilím zavřela pozici. Hodně likvidací longů = tlak dolů.</p>
      <p><b>Open interest a funding.</b> Kolik pozic je otevřených a kdo komu platí za držení.</p>
    </div>
  </details>
</div>
<script src="https://cdn.jsdelivr.net/npm/lightweight-charts@5.2.1/dist/lightweight-charts.standalone.production.js"></script>
<script>
(function () {
  "use strict";
  const LC = window.LightweightCharts;
  const $ = (s) => document.querySelector(s);
  const MINUS = "\u2212";
  const nf = (v, d = 1) => (v === null || v === undefined || Number.isNaN(+v)) ? "–" : ((+v < 0 ? MINUS : "") + Math.abs(+v).toLocaleString("cs-CZ", { minimumFractionDigits: d, maximumFractionDigits: d }));
  const sf = (v, d = 1) => (v === null || v === undefined || Number.isNaN(+v)) ? "–" : ((+v > 0 ? "+" : +v < 0 ? MINUS : "") + Math.abs(+v).toLocaleString("cs-CZ", { minimumFractionDigits: d, maximumFractionDigits: d }));
  const tz = new Date().getTimezoneOffset() * 60;
  const lt = (ms) => Math.floor(ms / 1000) - tz;                 // chart time shown in local clock
  const clock = (ms) => new Date(ms).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  function rgba(hex, a) { const h = hex.replace("#", ""); const n = parseInt(h, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
  const C = {}; ["panel", "ink", "muted", "rule", "grid", "buy", "sell", "vwap", "band"].forEach((k) => (C[k] = css("--" + k)));

  let chart, sC, sV, sB = [], sD, sCvd, sVel, markers, lines = [], first = true, data = null, selected = null;
  function initChart() {
    chart = LC.createChart($("#chart"), { autoSize: true,
      layout: { background: { type: LC.ColorType.Solid, color: C.panel }, textColor: C.muted, fontFamily: "Archivo, Arial, sans-serif", fontSize: 11,
        panes: { separatorColor: C.rule, separatorHoverColor: rgba(C.muted, 0.25), enableResize: true } },
      grid: { vertLines: { color: C.grid }, horzLines: { color: C.grid } },
      rightPriceScale: { borderColor: C.rule, scaleMargins: { top: 0.08, bottom: 0.06 } },
      timeScale: { borderColor: C.rule, timeVisible: true, secondsVisible: false, rightOffset: 4 },
      crosshair: { mode: LC.CrosshairMode.Normal } });
    const pf = { type: "price", precision: 1, minMove: 0.1 };
    sC = chart.addSeries(LC.CandlestickSeries, { upColor: C.buy, downColor: C.sell, wickUpColor: C.buy, wickDownColor: C.sell, borderVisible: false, priceFormat: pf }, 0);
    const quiet = { priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false, priceFormat: pf };
    sV = chart.addSeries(LC.LineSeries, { ...quiet, color: C.vwap, lineWidth: 2 }, 0);
    sB = [1, -1, 2, -2].map((k) => chart.addSeries(LC.LineSeries, { ...quiet, color: rgba(C.band, 0.9), lineWidth: 1, lineStyle: Math.abs(k) === 2 ? LC.LineStyle.Dashed : LC.LineStyle.Solid }, 0));
    sD = chart.addSeries(LC.HistogramSeries, { priceLineVisible: false, lastValueVisible: false, priceFormat: pf }, 1);
    sCvd = chart.addSeries(LC.BaselineSeries, { baseValue: { type: "price", price: 0 }, topLineColor: C.buy, bottomLineColor: C.sell,
      topFillColor1: rgba(C.buy, 0.2), topFillColor2: rgba(C.buy, 0.03), bottomFillColor1: rgba(C.sell, 0.03), bottomFillColor2: rgba(C.sell, 0.2),
      lineWidth: 2, priceLineVisible: false, priceFormat: pf }, 2);
    sVel = chart.addSeries(LC.HistogramSeries, { priceLineVisible: false, lastValueVisible: false, priceFormat: { type: "custom", minMove: 0.1, formatter: (x) => x.toFixed(1) + "×" } }, 3);
    const panes = chart.panes();
    if (panes.length >= 4) { panes[0].setStretchFactor(3.2); [1, 2, 3].forEach((i) => panes[i].setStretchFactor(1)); }
    markers = LC.createSeriesMarkers(sC, []);
    chart.subscribeClick((p) => { if (p && p.time !== undefined) { selected = p.time; renderLadder(); } });
    new ResizeObserver(placeLabels).observe($(".chartbox"));
  }
  const LABELS = ["Cena, průměr dne a normální rozsah", "Kdo tlačil (delta za minutu)", "Skóre dne (CVD)", "Rychlost trhu (× normálu)"];
  function placeLabels() {
    if (!chart) return;
    requestAnimationFrame(() => { let top = 0; $("#panelabels").innerHTML = chart.panes().map((p, i) => { const h = `<span class="panelabel" style="top:${top + 6}px">${LABELS[i] || ""}</span>`; top += p.getHeight() + 1; return h; }).join(""); });
  }

  function allBars() {
    const bars = (data.bars || []).filter((b) => b.t_ms != null);
    const cur = data.status && data.status.bar;
    if (cur && (!bars.length || cur.t > bars[bars.length - 1].t_ms)) bars.push({ t_ms: cur.t, open: cur.open, high: cur.high, low: cur.low, close: cur.close,
      delta: cur.delta, vel_max: cur.vel_max, cvd_session: data.status.session ? data.status.session.cvd : null,
      vwap: data.status.session ? data.status.session.vwap : null, vwap_sd: data.status.session ? data.status.session.sd : null, live: true });
    return bars;
  }

  function renderChart() {
    const bars = allBars();
    sC.setData(bars.map((b) => ({ time: lt(b.t_ms), open: b.open, high: b.high, low: b.low, close: b.close })));
    const line = (f) => bars.map((b) => { const v = f(b); return v == null || Number.isNaN(v) ? { time: lt(b.t_ms) } : { time: lt(b.t_ms), value: v }; });
    sV.setData(line((b) => b.vwap));
    [1, -1, 2, -2].forEach((k, i) => sB[i].setData(line((b) => (b.vwap != null && b.vwap_sd != null ? b.vwap + k * b.vwap_sd : null))));
    sD.setData(bars.map((b) => (b.delta == null ? { time: lt(b.t_ms) } : { time: lt(b.t_ms), value: b.delta, color: b.delta >= 0 ? rgba(C.buy, 0.85) : rgba(C.sell, 0.85) })));
    sCvd.setData(line((b) => b.cvd_session));
    sVel.setData(bars.map((b) => (b.vel_max == null ? { time: lt(b.t_ms) } : { time: lt(b.t_ms), value: b.vel_max, color: b.vel_max >= 5 ? C.vwap : rgba(C.muted, 0.55) })));
    lines.forEach((l) => sC.removePriceLine(l)); lines = [];
    const st = data.status || {}, s = st.session, pd = st.prev_day;
    const pl = (price, title, color, style) => { if (price != null && price !== "") lines.push(sC.createPriceLine({ price: +price, title, color, lineWidth: 1, lineStyle: style, axisLabelVisible: true })); };
    if (s) { pl(s.poc, "POC", C.ink, LC.LineStyle.Solid); pl(s.vah, "VAH", C.muted, LC.LineStyle.Dotted); pl(s.val, "VAL", C.muted, LC.LineStyle.Dotted); }
    if (pd) { pl(pd.high, "včera max", rgba(C.muted, 0.8), LC.LineStyle.LargeDashed); pl(pd.low, "včera min", rgba(C.muted, 0.8), LC.LineStyle.LargeDashed); }
    const times = new Set(bars.map((b) => b.t_ms));
    const barOf = (t) => Math.floor(t / 60000) * 60000;
    const mk = [];
    for (const e of data.events || []) {
      const bt = barOf(e.t);
      if (!times.has(bt)) continue;
      if (e.type === "big_trade") mk.push({ time: lt(bt), position: "atPriceMiddle", price: e.avg_price, shape: "square", size: Math.min(2, Math.max(0.6, Math.sqrt(e.qty / 10) * 0.7)), color: rgba(C.ink, 0.8) });
      if (e.type === "absorption") mk.push({ time: lt(bt), position: e.kind === "bull" ? "belowBar" : "aboveBar", shape: "circle", color: e.kind === "bull" ? C.buy : C.sell });
      if (e.type === "price_shock") mk.push({ time: lt(bt), position: e.side === "up" ? "belowBar" : "aboveBar", shape: e.side === "up" ? "arrowUp" : "arrowDown", color: e.side === "up" ? C.buy : C.sell, size: 1.4 });
      if (e.type === "velocity") mk.push({ time: lt(bt), position: e.side === "buy" ? "belowBar" : "aboveBar", shape: e.side === "buy" ? "arrowUp" : "arrowDown", color: C.vwap, size: 0.8 });
    }
    mk.sort((a, b) => a.time - b.time);
    markers.setMarkers(mk);
    if (first) { chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, bars.length - 120), to: bars.length + 3 }); first = false; }
    placeLabels();
  }

  function card(k, v, w, x, cls) { return `<div class="card"><div class="k">${k}</div><div class="v ${cls || ""}">${v}</div><div class="w ${cls || ""}">${w || ""}</div><div class="x">${x}</div></div>`; }
  function renderCards() {
    const st = data.status || {}, bars = allBars(), last = bars[bars.length - 1] || {}, prev = bars[bars.length - 2] || {};
    const price = st.last_price;
    const chg = price != null && prev.close != null ? price - prev.close : null;
    const d = st.bar ? st.bar.delta : null;
    const who = d == null ? ["–", ""] : Math.abs(d) < 0.5 ? ["Vyrovnané", ""] : d > 0 ? ["Kupci", "buy"] : ["Prodávající", "sell"];
    const v = st.velocity;
    const vw = v == null ? "–" : v < 0.7 ? "Klid" : v < 2 ? "Normál" : v < 5 ? "Zrychluje" : "Velký nával";
    const s = st.session || {};
    const dist = s.sd > 0 && price != null ? (price - s.vwap) / s.sd : null;
    const distW = dist == null ? "" : (Math.abs(dist) < 1 ? "v normálním rozsahu" : Math.abs(dist) < 2 ? "natažená" : "hodně natažená") + (dist >= 0 ? ", nad průměrem" : ", pod průměrem");
    const bk = st.book || {};
    const imb = bk.imbalance;
    const bookW = imb == null ? "–" : imb > 0.15 ? "Víc čekajících kupců" : imb < -0.15 ? "Víc čekajících prodávajících" : "Vyrovnaná";
    const lq = st.liq_5m || {};
    const oiNow = st.oi, oiBefore = bars.length > 6 ? bars[bars.length - 6].oi : null;
    const m = st.mark || {};
    const fund = m.funding != null ? +m.funding * 100 : null;
    $("#cards").innerHTML = [
      card("Cena", nf(price, 1), chg == null ? "" : `${sf(chg, 1)} za minutu`, "Poslední obchod na Binance Futures.", chg > 0 ? "buy" : chg < 0 ? "sell" : ""),
      card("Kdo teď tlačí", who[0], d == null ? "" : `${sf(d, 2)} BTC v této minutě`, "Agresivní nákupy minus prodeje v aktuální svíčce.", who[1]),
      card("Rychlost trhu", v == null ? "–" : nf(v, 1) + "×", vw, "Kolikrát rychleji se obchoduje než posledních 5 minut.", v >= 5 ? "warnc" : ""),
      card("Cena vs průměr dne", dist == null ? "–" : sf(dist, 2) + "σ", distW, `Průměr dne (VWAP) je ${nf(s.vwap, 1)}. Za ±2σ je cena natažená.`),
      card("Kniha", bookW, imb == null ? "" : `nerovnováha ${sf(imb * 100, 0)} %`, "Čekající limitní příkazy v nejbližších 100 cenách na každé straně.", imb > 0.15 ? "buy" : imb < -0.15 ? "sell" : ""),
      card("Likvidace za 5 min", `${nf(lq.long, 2)} / ${nf(lq.short, 2)}`, "longy / shorty v BTC", "Burza násilím zavřela pozice. Hodně likvidací longů = tlak dolů."),
      card("Open interest", nf(oiNow, 0), oiBefore != null && oiNow != null ? `${sf(oiNow - oiBefore, 1)} BTC za 5 min` : "", "Kolik pozic je otevřených. Roste = přichází nové peníze."),
      card("Funding", fund == null ? "–" : sf(fund, 4) + " %", fund == null ? "" : fund >= 0 ? "longy platí shortům" : "shorty platí longům", "Poplatek za držení pozice, platí se každých 8 hodin."),
    ].join("");
  }

  function eventText(e) {
    const p = (x) => nf(x, 1);
    switch (e.type) {
      case "big_trade": return [`Velryba ${e.side === "buy" ? "koupila" : "prodala"} <b>${nf(e.qty, 1)} BTC</b>${e.levels > 1 ? ` přes ${e.levels} cen` : ""} kolem ${p(e.avg_price)}`, e.side === "buy" ? "buy" : "sell"];
      case "velocity": return [`Trh zrychlil na <b>${nf(e.ratio, 1)}×</b>, tlačí ${e.side === "buy" ? "kupci" : "prodávající"}`, "warnc"];
      case "price_shock": return [`Cena za 5 s ${e.side === "down" ? "spadla" : "vyletěla"} o <b>${nf(Math.abs(e.move_pct), 2)} %</b> (z ${p(e.from)} na ${p(e.to)})`, e.side === "down" ? "sell" : "buy"];
      case "absorption": return [e.kind === "bull" ? `Prodávající narazili na zeď kupců u ${p(e.price)}` : `Kupci narazili na zeď prodávajících u ${p(e.price)}`, e.kind === "bull" ? "buy" : "sell"];
      case "stacked_imbalance": return [`Řada agresivních ${e.side === "buy" ? "nákupů" : "prodejů"} od ${p(e.from)} do ${p(e.to)}`, e.side === "buy" ? "buy" : "sell"];
      case "cluster": return [`Hodně objemu na jedné ceně: ${nf(e.volume, 1)} BTC u ${p(e.price)}`, ""];
      case "liquidation": return [`Likvidace ${e.liquidated === "long" ? "longu" : "shortu"} ${nf(e.qty, 2)} BTC u ${p(e.price)}`, e.liquidated === "long" ? "sell" : "buy"];
      case "wall_added": return [`Nová zeď v knize: ${nf(e.qty, 1)} BTC na ${p(e.price)} (${e.side === "bid" ? "kupci" : "prodávající"})`, e.side === "bid" ? "buy" : "sell"];
      case "wall_filled": return [`Zeď ${nf(e.qty, 1)} BTC na ${p(e.price)} byla sežrána obchody`, ""];
      case "wall_pulled": return [`Zeď ${nf(e.qty, 1)} BTC na ${p(e.price)} zmizela bez obchodu (stažená)`, ""];
      case "naked_poc_touched": return [`Cena se vrátila na nahý POC ${p(e.price)} ze dne ${e.from_day}`, ""];
      default: return [e.type, ""];
    }
  }
  function renderEvents() {
    const noisy = new Set(["wall_added", "wall_filled", "wall_pulled", "cluster"]);
    const showNoisy = $("#shownoisy").checked;
    const ev = (data.events || []).filter((e) => showNoisy || !noisy.has(e.type)).slice(-60).reverse();
    $("#events").innerHTML = ev.length ? ev.map((e) => { const [txt, cls] = eventText(e); return `<li><span class="t">${clock(e.t)}</span><span class="${cls}">${txt}</span></li>`; }).join("")
      : `<li>Zatím nic. Události se objeví, jak se budou dít.</li>`;
  }

  function renderLadder() {
    const fps = (data.footprints || []).slice();
    if (data.status && data.status.bar_fp) fps.push(data.status.bar_fp);
    let fp = fps[fps.length - 1];
    if (selected != null) fp = fps.find((f) => lt(f.t) === selected) || fp;
    if (!fp) { $("#ladder tbody").innerHTML = ""; $("#ladsum").textContent = ""; return; }
    const lv = fp.lv || [];
    const max = Math.max(1e-9, ...lv.map((x) => Math.max(x[1], x[2])));
    const pocVol = Math.max(0, ...lv.map((x) => x[1] + x[2]));
    $("#ladder tbody").innerHTML = lv.map((x) => {
      const ws = (x[1] / max) * 100, wb = (x[2] / max) * 100;
      return `<tr class="${x[1] + x[2] === pocVol ? "poc" : ""}"><td class="s" style="background:linear-gradient(270deg,${rgba(C.sell, 0.25)} ${ws}%,transparent ${ws}%)">${x[1] > 0 ? nf(x[1], 2) : ""}</td>
        <td class="p">${nf(x[0], 0)}</td><td style="background:linear-gradient(90deg,${rgba(C.buy, 0.25)} ${wb}%,transparent ${wb}%)">${x[2] > 0 ? nf(x[2], 2) : ""}</td></tr>`;
    }).join("");
    const sold = lv.reduce((a, x) => a + x[1], 0), bought = lv.reduce((a, x) => a + x[2], 0);
    $("#ladsum").innerHTML = `Svíčka ${clock(fp.t)}${fp === (data.status || {}).bar_fp ? " (právě běží)" : ""}: koupeno <span class="buy">${nf(bought, 1)}</span>, prodáno <span class="sell">${nf(sold, 1)}</span> BTC.`;
  }

  function renderStatus(files) {
    const pill = $("#pill");
    if (!data) { pill.className = "pill bad"; pill.textContent = "Žádná data"; return; }
    const age = (Date.now() - data.generated) / 1000;
    const c = data.collector || {};
    if (age < 15) { pill.className = "pill ok"; pill.textContent = "Sběr běží"; }
    else if (age < 180) { pill.className = "pill warn"; pill.textContent = `Data stará ${Math.round(age)} s`; }
    else { pill.className = "pill bad"; pill.textContent = `Sběr stojí ${Math.round(age / 60)} min`; }
    const parts = [];
    if (c.delay_ms != null) parts.push(`zpoždění ${nf(c.delay_ms / 1000, 2)} s`);
    if (c.gaps != null) parts.push(`výpadky ${c.gaps}`);
    if (c.book) parts.push(c.book.state === "synced" ? "kniha OK" : "kniha se synchronizuje");
    if (files) parts.push(`dnes nahráno ${nf(files.today_mb, 0)} MB, celkem ${nf(files.total_mb / 1024, 2)} GB`);
    $("#sub").textContent = parts.join(", ");
  }

  let files = null;
  async function loadFiles() { try { files = await (await fetch("/files.json", { cache: "no-store" })).json(); } catch (e) { files = null; } renderStatus(files); }
  async function loadLive() {
    try {
      const res = await fetch("/live.json", { cache: "no-store" });
      if (!res.ok) throw new Error("missing");
      data = await res.json();
      $("#empty").hidden = true;
      if (!chart) initChart();
      renderCards(); renderChart(); renderEvents(); renderLadder(); renderStatus(files);
    } catch (e) {
      $("#empty").hidden = false;
      $("#empty").textContent = "Zatím tu nic není. Sběrač musí běžet s --features /home/tomas/data/features (viz návod). Po spuštění to chvíli trvá.";
      renderStatus(files);
    }
  }
  if (!LC) { document.body.insertAdjacentHTML("afterbegin", '<div class="empty">Knihovna grafů se nenačetla. Je prohlížeč připojený k internetu?</div>'); }
  $("#shownoisy").onchange = () => data && renderEvents();
  loadFiles(); loadLive();
  setInterval(loadLive, 3000); setInterval(loadFiles, 15000);
})();
</script>
</body>
</html>
"""


LIVE_PAGE = r"""<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BTC živě</title>
<style>
:root { --paper:#EEF2F4; --panel:#F8FAFB; --ink:#142230; --ink-2:#3D4B59; --muted:#66727F; --rule:#CBD4DC; --grid:#E1E6EA;
  --buy:#0E8A6E; --sell:#C2413B; --warn:#B4730F; --sans:"Archivo","Helvetica Neue",Arial,sans-serif; --serif:"Source Serif 4",Georgia,serif;
  --bidrgb:14,138,110; --askrgb:194,65,59; color-scheme:light; }
@media (prefers-color-scheme: dark) { :root { --paper:#0E1822; --panel:#13202C; --ink:#E3E9EE; --ink-2:#B8C4CE; --muted:#8796A4;
  --rule:#283746; --grid:#1A2733; --buy:#2DBF97; --sell:#EA6A63; --warn:#E7A841; --bidrgb:45,191,151; --askrgb:234,106,99; color-scheme:dark; } }
* { box-sizing:border-box; }
body { margin:0; background:var(--paper); color:var(--ink); font-family:var(--sans); font-variant-numeric:tabular-nums; }
.wrap { max-width:1500px; margin:0 auto; padding:14px clamp(10px,2vw,28px) 40px; }
header { display:flex; flex-wrap:wrap; align-items:center; gap:8px 18px; padding-bottom:10px; border-bottom:1px solid var(--rule); }
h1 { margin:0; font-size:clamp(1.5rem,3vw,2.2rem); font-weight:780; letter-spacing:-.02em; }
.pill { font-weight:650; font-size:.9rem; padding:4px 11px; border-radius:999px; border:1.5px solid var(--rule); }
.pill.ok { color:var(--buy); border-color:var(--buy); } .pill.bad { color:var(--sell); border-color:var(--sell); }
.sub { color:var(--muted); font-size:.85rem; } header a { color:var(--ink-2); font-size:.88rem; margin-left:auto; }
.cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:10px; margin:12px 0; }
.card { background:var(--panel); border:1px solid var(--rule); border-radius:6px; padding:10px 13px; }
.card .k { font-size:.78rem; color:var(--muted); font-weight:600; } .card .v { font-size:1.45rem; font-weight:740; margin:2px 0; }
.card .w { font-size:.88rem; font-weight:600; } .card .x { font-family:var(--serif); font-size:.8rem; color:var(--ink-2); margin-top:4px; line-height:1.35; }
.buy { color:var(--buy); } .sell { color:var(--sell); } .warnc { color:var(--warn); }
.main { display:grid; grid-template-columns:minmax(0,1fr) 340px; gap:14px; align-items:start; }
.box { background:var(--panel); border:1px solid var(--rule); border-radius:6px; }
.heathead { display:flex; flex-wrap:wrap; align-items:center; gap:6px 12px; padding:8px 12px; border-bottom:1px solid var(--rule); font-size:.85rem; }
.heathead b { font-size:.95rem; } .heathead button { font:inherit; font-size:.8rem; padding:2px 8px; border:1px solid var(--rule); background:transparent; color:var(--ink-2); border-radius:3px; cursor:pointer; }
.heathead button.on { background:var(--ink); color:var(--panel); border-color:var(--ink); }
.heatwrap { position:relative; height:clamp(420px,62vh,720px); }
.heatwrap canvas { position:absolute; inset:0; width:100%; height:100%; }
#tip { position:absolute; pointer-events:none; background:var(--ink); color:var(--panel); font-size:.78rem; padding:4px 7px; border-radius:3px; display:none; white-space:nowrap; z-index:3; }
.legend { padding:7px 12px; border-top:1px solid var(--rule); font-family:var(--serif); font-size:.82rem; color:var(--ink-2); }
.legend i { display:inline-block; width:11px; height:11px; border-radius:2px; vertical-align:-1px; margin:0 4px 0 10px; }
aside h2 { font-size:.95rem; margin:0; padding:8px 12px; border-bottom:1px solid var(--rule); }
aside .box { margin-bottom:12px; }
table { width:100%; border-collapse:collapse; font-size:.78rem; }
.fp td { padding:1px 6px; } .fp td.s { text-align:right; } .fp td.p { text-align:center; color:var(--ink-2); width:64px; }
.fp tr.now td.p { outline:1.5px solid var(--ink); outline-offset:-2px; font-weight:700; color:var(--ink); }
.fpwrap { max-height:300px; overflow:auto; } .fpsum { font-family:var(--serif); font-size:.8rem; color:var(--ink-2); padding:6px 12px 2px; }
.tape { max-height:260px; overflow:auto; } .tape td { padding:2px 8px; border-bottom:1px solid var(--grid); } .tape tr.big td { font-weight:750; }
.events { list-style:none; margin:0; padding:0; max-height:260px; overflow:auto; }
.events li { padding:5px 12px; border-bottom:1px solid var(--grid); font-size:.82rem; line-height:1.35; } .events .t { color:var(--muted); font-weight:600; margin-right:6px; }
.opt { font-family:var(--serif); font-size:.78rem; color:var(--ink-2); padding:4px 12px; }
.empty { padding:24px; font-family:var(--serif); color:var(--ink-2); }
@media (max-width:1100px) { .main { grid-template-columns:minmax(0,1fr); } }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>BTC živě</h1><span id="pill" class="pill">Připojuji…</span><span id="sub" class="sub"></span>
    <a href="/prehled">Svíčky a přehled →</a>
  </header>
  <section class="cards" id="cards"></section>
  <section class="main">
    <div class="box">
      <div class="heathead"><b>Kniha a obchody živě</b><span class="sub" id="winlab">poslední minuta</span>
        <span style="margin-left:auto">rozsah ceny</span>
        <button data-r="50">±50 $</button><button data-r="100" class="on">±100 $</button><button data-r="150">±150 $</button></div>
      <div class="heatwrap" id="hw"><canvas id="heat"></canvas><canvas id="over"></canvas><div id="tip"></div></div>
      <div class="legend"><i style="background:rgb(var(--bidrgb))"></i>čekající nákupy <i style="background:rgb(var(--askrgb))"></i>čekající prodeje.
        Čím jasnější, tím víc BTC tam čeká. Čára je cena, kolečka jsou obchody (větší = víc BTC). Když je pod čarou tma, stačí málo prodejů na velký pád.</div>
    </div>
    <aside>
      <div class="box"><h2>Uvnitř aktuální minuty</h2><div class="fpsum" id="fpsum"></div>
        <div class="fpwrap"><table class="fp"><tbody id="fp"></tbody></table></div></div>
      <div class="box"><h2>Obchody právě teď</h2><div class="opt"><label><input type="checkbox" id="small"> ukázat i malé (pod 0,2 BTC)</label></div>
        <div class="tape"><table><tbody id="tape"></tbody></table></div></div>
      <div class="box"><h2>Co se právě stalo</h2><div class="opt"><label><input type="checkbox" id="noisy"> ukázat i zdi a shluky</label></div>
        <ul class="events" id="events"></ul></div>
    </aside>
  </section>
</div>
<script>
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const MINUS = "\u2212";
  const nf = (v, d = 1) => v == null || Number.isNaN(+v) ? "–" : (+v < 0 ? MINUS : "") + Math.abs(+v).toLocaleString("cs-CZ", { minimumFractionDigits: d, maximumFractionDigits: d });
  const sf = (v, d = 1) => v == null || Number.isNaN(+v) ? "–" : (+v > 0 ? "+" : +v < 0 ? MINUS : "") + Math.abs(+v).toLocaleString("cs-CZ", { minimumFractionDigits: d, maximumFractionDigits: d });
  const clock = (ms, tenth) => { const d = new Date(ms); const s = d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" }); return tenth ? s + "," + Math.floor(d.getMilliseconds() / 100) : s; };
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  let WIN = 60 * 1000;
  function updateWin() {
    const first = S.heat.length ? S.heat[0].t : S.line.length ? S.line[0][0] : now();
    WIN = Math.min(600000, Math.max(60000, Math.ceil((now() - first + 5000) / 60000) * 60000));
    const lab = document.getElementById("winlab"); if (lab) lab.textContent = `posledních ${Math.round(WIN / 60000)} min`;
  }
  const S = { heat: [], line: [], bubbles: [], tape: [], events: [], fp: null, bar: null, price: null, vel: null, lag: null, frag: [], status: null, half: 100, center: null, connected: false };

  // ------------------------------------------------------------ canvas
  const hw = $("#hw"), heat = $("#heat"), over = $("#over"), tip = $("#tip");
  const off = document.createElement("canvas");
  const M = { r: 70, b: 22 };
  let W = 0, H = 0, DPR = 1;
  function size() {
    DPR = window.devicePixelRatio || 1; W = hw.clientWidth; H = hw.clientHeight;
    for (const c of [heat, over]) { c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); }
    drawHeat(); drawOver();
  }
  new ResizeObserver(size).observe(hw);
  const plotW = () => W - M.r, plotH = () => H - M.b;
  const now = () => (S.line.length ? S.line[S.line.length - 1][0] : Date.now());
  const xOf = (t) => plotW() - ((now() - t) / WIN) * plotW();
  const yOf = (p) => ((S.center + S.half - p) / (2 * S.half)) * plotH();
  function recenter(force) {
    const p = S.price; if (p == null) return false;
    if (force || S.center == null || Math.abs(p - S.center) > S.half * 0.65) { S.center = Math.round(p / 2) * 2; return true; }
    return false;
  }
  function drawHeat() {
    const ctx = heat.getContext("2d"); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
    if (!S.heat.length || S.center == null) return;
    updateWin();
    const step = S.heat[S.heat.length - 1].step, rows = Math.round((2 * S.half) / step), cols = Math.round(WIN / 1000), top = S.center + S.half;
    off.width = cols; off.height = rows;
    const octx = off.getContext("2d"), img = octx.createImageData(cols, rows), px = img.data;
    const t1 = now(), qs = [];
    for (const c of S.heat) for (let i = 0; i < c.b.length; i += 3) { const q = c.b[i] || c.a[i]; if (q > 0) qs.push(q); }
    qs.sort((a, b) => a - b);
    const qref = Math.max(1, qs.length ? qs[Math.floor(qs.length * 0.95)] : 10), lref = Math.log1p(qref);
    const bid = css("--bidrgb").split(",").map(Number), ask = css("--askrgb").split(",").map(Number);
    for (const c of S.heat) {
      const x = cols - 1 - Math.round((t1 - c.t) / 1000); if (x < 0 || x >= cols) continue;
      for (let i = 0; i < c.b.length; i++) {
        const price = c.lo + i * c.step, row = Math.floor((top - price) / step);
        if (row < 0 || row >= rows) continue;
        const qb = c.b[i], qa = c.a[i]; if (!qb && !qa) continue;
        const col = qb >= qa ? bid : ask, q = Math.max(qb, qa);
        const a = Math.min(1, Math.log1p(q) / lref);
        for (let dx = 0; dx < 1; dx++) { const k = (row * cols + x) * 4; px[k] = col[0]; px[k + 1] = col[1]; px[k + 2] = col[2]; px[k + 3] = Math.round(30 + 225 * a); }
      }
    }
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, cols, rows, 0, 0, plotW(), plotH());
  }
  let pending = false;
  function drawOverSoon() { if (!pending) { pending = true; requestAnimationFrame(() => { pending = false; drawOver(); }); } }
  function drawOver() {
    const ctx = over.getContext("2d"); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
    if (S.center == null) return;
    const ink = css("--ink"), muted = css("--muted"), grid = css("--grid"), panel = css("--panel");
    ctx.font = "11px Archivo, Arial, sans-serif"; ctx.textBaseline = "middle";
    const tick = S.half <= 50 ? 10 : S.half <= 100 ? 20 : 50;
    for (let p = Math.ceil((S.center - S.half) / tick) * tick; p <= S.center + S.half; p += tick) {
      const y = yOf(p); ctx.strokeStyle = grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(plotW(), y); ctx.stroke();
      ctx.fillStyle = muted; ctx.fillText(p.toLocaleString("cs-CZ"), plotW() + 6, y);
    }
    const t1 = now();
    ctx.textBaseline = "alphabetic";
    for (let t = Math.ceil((t1 - WIN) / 60000) * 60000; t <= t1; t += 60000) { const x = xOf(t); ctx.fillStyle = muted; ctx.fillText(new Date(t).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }), x - 14, H - 6); }
    const buy = css("--buy"), sell = css("--sell");
    for (const b of S.bubbles) {
      if (b[0] < t1 - WIN) continue;
      const r = Math.max(2, Math.min(22, Math.sqrt(b[3]) * 2.6));
      ctx.beginPath(); ctx.arc(xOf(b[0]), yOf(b[2]), r, 0, Math.PI * 2);
      ctx.fillStyle = b[1] ? sell : buy; ctx.globalAlpha = 0.45; ctx.fill(); ctx.globalAlpha = 0.9; ctx.strokeStyle = b[1] ? sell : buy; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = ink; ctx.lineWidth = 1.6; ctx.beginPath(); let first = true;
    for (const [t, p] of S.line) { if (t < t1 - WIN) continue; const x = xOf(t), y = yOf(p); if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y); }
    ctx.stroke();
    if (S.price != null) {
      const y = yOf(S.price); ctx.fillStyle = ink; ctx.fillRect(plotW() + 1, y - 9, M.r - 2, 18);
      ctx.fillStyle = panel; ctx.textBaseline = "middle"; ctx.fillText(nf(S.price, 1), plotW() + 5, y);
    }
  }
  over.addEventListener("mousemove", (ev) => {
    const r = over.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top;
    if (x > plotW() || y > plotH() || !S.heat.length) { tip.style.display = "none"; return; }
    const t = now() - ((plotW() - x) / plotW()) * WIN, price = S.center + S.half - (y / plotH()) * 2 * S.half;
    let col = null, best = 1e18; for (const c of S.heat) { const d = Math.abs(c.t - t); if (d < best) { best = d; col = c; } }
    if (!col || best > 3000) { tip.style.display = "none"; return; }
    const i = Math.floor((price - col.lo) / col.step);
    const qb = col.b[i] || 0, qa = col.a[i] || 0;
    tip.textContent = `${clock(col.t)} · ${nf(col.lo + i * col.step, 0)} $ · ` + (qb >= qa ? `čeká ${nf(qb, 1)} BTC nákupů` : `čeká ${nf(qa, 1)} BTC prodejů`);
    tip.style.display = "block"; tip.style.left = Math.min(x + 12, W - 240) + "px"; tip.style.top = (y + 12) + "px";
  });
  over.addEventListener("mouseleave", () => (tip.style.display = "none"));
  document.querySelectorAll(".heathead button").forEach((b) => b.onclick = () => {
    document.querySelectorAll(".heathead button").forEach((x) => x.classList.toggle("on", x === b));
    S.half = +b.dataset.r; recenter(true); drawHeat(); drawOver();
  });

  // ------------------------------------------------------------ panels
  const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  function card(k, v, w, x, cls) { return `<div class="card"><div class="k">${k}</div><div class="v ${cls || ""}">${v}</div><div class="w ${cls || ""}">${w || ""}</div><div class="x">${x}</div></div>`; }
  function renderCards() {
    const b = S.bar, d = b ? b.d : null;
    const who = d == null ? ["–", ""] : Math.abs(d) < 0.5 ? ["Vyrovnané", ""] : d > 0 ? ["Kupci", "buy"] : ["Prodávající", "sell"];
    const v = S.vel, vw = v == null ? "rozjíždí se" : v < 0.7 ? "Klid" : v < 2 ? "Normál" : v < 5 ? "Zrychluje" : "Velký nával";
    const f = S.heat.length ? S.heat[S.heat.length - 1].frag : null;
    const recent = S.frag.filter((x) => x.t > now() - 30 * 60000);
    const md = median(recent.map((x) => x.d100)), mu = median(recent.map((x) => x.u100));
    const word = (q, m) => (q == null || m == null ? "" : q < 0.5 * m ? "KŘEHKÉ" : q < 0.8 * m ? "slabší" : "normální");
    const fragCls = f && md && (f.d100 < 0.5 * md || f.u100 < 0.5 * mu) ? "warnc" : "";
    $("#cards").innerHTML = [
      card("Cena", nf(S.price, 1), b ? `minuta ${sf(b.c - b.o, 1)} $` : "", "Poslední obchod na Binance Futures.", b && b.c >= b.o ? "buy" : "sell"),
      card("Kdo teď tlačí", who[0], d == null ? "" : `${sf(d, 2)} BTC v této minutě`, "Agresivní nákupy minus prodeje v aktuální minutě.", who[1]),
      card("Rychlost trhu", v == null ? "–" : nf(v, 1) + "×", vw, "Kolikrát rychleji se obchoduje než posledních 5 minut.", v >= 5 ? "warnc" : ""),
      card("Křehkost knihy", f ? `↓ ${nf(f.d100, 0)} · ↑ ${nf(f.u100, 0)} BTC` : "–",
        f ? `dolů ${word(f.d100, md)}, nahoru ${word(f.u100, mu)}` : "",
        f ? `Na pohyb o 100 $ dolů stačí prodat ${nf(f.d100, 0)} BTC (běžně ${nf(md, 0)}), nahoru koupit ${nf(f.u100, 0)} BTC (běžně ${nf(mu, 0)}).` : "Čekám na knihu.", fragCls),
    ].join("");
  }
  function renderFp() {
    const fp = S.fp; if (!fp || !fp.length) { $("#fp").innerHTML = ""; return; }
    const max = Math.max(1e-9, ...fp.map((x) => Math.max(x[1], x[2])));
    const cur = S.price != null ? Math.floor(S.price / 5) * 5 : null;
    const rgb = (n) => `rgba(${css(n)},0.28)`;
    $("#fp").innerHTML = fp.map((x) => `<tr class="${x[0] === cur ? "now" : ""}"><td class="s" style="background:linear-gradient(270deg,${rgb("--askrgb")} ${x[1] / max * 100}%,transparent 0)">${x[1] > 0 ? nf(x[1], 2) : ""}</td><td class="p">${nf(x[0], 0)}</td><td style="background:linear-gradient(90deg,${rgb("--bidrgb")} ${x[2] / max * 100}%,transparent 0)">${x[2] > 0 ? nf(x[2], 2) : ""}</td></tr>`).join("");
    const sold = fp.reduce((a, x) => a + x[1], 0), bought = fp.reduce((a, x) => a + x[2], 0);
    $("#fpsum").innerHTML = `${S.bar ? clock(S.bar.t).slice(0, 5) : ""}: koupeno <span class="buy">${nf(bought, 1)}</span>, prodáno <span class="sell">${nf(sold, 1)}</span> BTC. Vlevo prodeje, vpravo nákupy, po 5 $.`;
  }
  function renderTape() {
    const small = $("#small").checked;
    const rows = S.tape.filter((x) => small || x.q >= 0.2).slice(-60).reverse();
    $("#tape").innerHTML = rows.map((x) => `<tr class="${x.q >= 10 ? "big" : ""}"><td>${clock(x.t, true)}</td><td class="${x.s ? "sell" : "buy"}">${x.s ? "prodej" : "nákup"}</td><td style="text-align:right">${nf(x.q, x.q >= 10 ? 1 : 3)} BTC</td><td>${x.lo === x.hi ? nf(x.lo, 1) : nf(x.lo, 0) + "–" + nf(x.hi, 0)}</td></tr>`).join("");
  }
  function eventText(e) {
    const p = (x) => nf(x, 1);
    switch (e.type) {
      case "big_trade": return [`Velryba ${e.side === "buy" ? "koupila" : "prodala"} <b>${nf(e.qty, 1)} BTC</b>${e.levels > 1 ? ` přes ${e.levels} cen` : ""}`, e.side === "buy" ? "buy" : "sell"];
      case "velocity": return [`Trh zrychlil na <b>${nf(e.ratio, 1)}×</b>, tlačí ${e.side === "buy" ? "kupci" : "prodávající"}`, "warnc"];
      case "price_shock": return [`Cena za 5 s ${e.side === "down" ? "spadla" : "vyletěla"} o <b>${nf(Math.abs(e.move_pct), 2)} %</b> (${p(e.from)} → ${p(e.to)})`, e.side === "down" ? "sell" : "buy"];
      case "absorption": return [e.kind === "bull" ? `Prodávající narazili na zeď kupců u ${p(e.price)}` : `Kupci narazili na zeď prodávajících u ${p(e.price)}`, e.kind === "bull" ? "buy" : "sell"];
      case "stacked_imbalance": return [`Řada agresivních ${e.side === "buy" ? "nákupů" : "prodejů"} ${p(e.from)}–${p(e.to)}`, e.side === "buy" ? "buy" : "sell"];
      case "liquidation": return [`Likvidace ${e.liquidated === "long" ? "longu" : "shortu"} ${nf(e.qty, 2)} BTC`, e.liquidated === "long" ? "sell" : "buy"];
      case "cluster": return [`Hodně objemu na jedné ceně: ${nf(e.volume, 1)} BTC u ${p(e.price)}`, ""];
      case "wall_added": return [`Nová zeď ${nf(e.qty, 1)} BTC na ${p(e.price)}`, e.side === "bid" ? "buy" : "sell"];
      case "wall_filled": return [`Zeď ${nf(e.qty, 1)} BTC na ${p(e.price)} sežrána`, ""];
      case "wall_pulled": return [`Zeď ${nf(e.qty, 1)} BTC na ${p(e.price)} stažena`, ""];
      case "naked_poc_touched": return [`Cena se vrátila na nahý POC ${p(e.price)}`, ""];
      default: return [e.type, ""];
    }
  }
  function renderEvents() {
    const noisy = new Set(["wall_added", "wall_filled", "wall_pulled", "cluster"]), all = $("#noisy").checked;
    const ev = S.events.filter((e) => all || !noisy.has(e.type)).slice(-50).reverse();
    $("#events").innerHTML = ev.length ? ev.map((e) => { const [t, c] = eventText(e); return `<li><span class="t">${clock(e.t)}</span><span class="${c}">${t}</span></li>`; }).join("") : "<li>Zatím nic.</li>";
  }
  $("#small").onchange = renderTape; $("#noisy").onchange = renderEvents;
  function renderStatus() {
    const pill = $("#pill");
    pill.className = "pill " + (S.connected ? "ok" : "bad"); pill.textContent = S.connected ? "Živě" : "Odpojeno";
    $("#sub").textContent = S.connected ? (S.lag != null ? `data z burzy dorazila za ${S.lag} ms` : "") : "Sběrač neposílá živá data. Běží s --features? Zkouším znovu…";
  }

  // ------------------------------------------------------------ messages
  let lastPanels = 0;
  function onMsg(m) {
    if (m.type === "snapshot") {
      S.heat = (m.heat || []).slice(-600); S.events = m.events || [];
      for (const c of S.heat) { S.frag.push({ t: c.t, d100: c.frag.d100, u100: c.frag.u100 }); S.line.push([c.t, c.mid]); }
      for (const e of S.events) if (e.type === "big_trade") S.bubbles.push([e.t, e.side === "sell" ? 1 : 0, e.avg_price, e.qty]);
      S.bubbles.sort((a, b) => a[0] - b[0]);
      if (m.status) { S.price = m.status.last_price; }
      recenter(true); drawHeat(); renderEvents(); renderCards();
    } else if (m.type === "heat") {
      S.heat.push(m); if (S.heat.length > 600) S.heat.shift();
      S.frag.push({ t: m.t, d100: m.frag.d100, u100: m.frag.u100 }); if (S.frag.length > 1800) S.frag.shift();
      recenter(false); drawHeat(); renderCards();
    } else if (m.type === "tick") {
      if (m.price != null) { S.price = m.price; S.line.push([m.t, m.price]); }
      while (S.line.length && S.line[0][0] < m.t - 600000 - 5000) S.line.shift();
      for (const [s, lo, hi, q, c] of m.tr || []) {
        S.tape.push({ t: m.t, s, lo, hi, q, c }); if (q >= 0.5) S.bubbles.push([m.t, s, (lo + hi) / 2, q]);
      }
      if (S.tape.length > 2000) S.tape.splice(0, S.tape.length - 2000);
      while (S.bubbles.length && S.bubbles[0][0] < m.t - 600000) S.bubbles.shift();
      if (m.bar) S.bar = m.bar; if (m.fp) S.fp = m.fp; S.vel = m.vel;
      if (m.e) S.lag = Math.max(0, Date.now() - m.e);
      if (recenter(false)) drawHeat();
      drawOverSoon();
      if (Date.now() - lastPanels > 400) { lastPanels = Date.now(); renderTape(); renderFp(); renderCards(); renderStatus(); }
    } else if (m.type === "event") {
      S.events.push(m.e); if (S.events.length > 500) S.events.shift(); renderEvents();
    } else if (m.type === "status") {
      S.status = m.status;
    }
  }
  function connect() {
    const wsPort = new URLSearchParams(location.search).get("ws") || (Number(location.port || 80) + 1);
    const ws = new WebSocket(`ws://${location.hostname || "localhost"}:${wsPort}`);
    ws.onopen = () => { S.connected = true; renderStatus(); };
    ws.onmessage = (ev) => { try { onMsg(JSON.parse(ev.data)); } catch (e) { console.error(e); } };
    ws.onclose = () => { S.connected = false; renderStatus(); setTimeout(connect, 2000); };
    ws.onerror = () => ws.close();
  }
  renderStatus(); renderCards(); connect();
})();
</script>
</body>
</html>
"""


def files_info(data_dir):
    total = today = 0
    newest = 0.0
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    try:
        for e in os.scandir(data_dir):
            if e.is_file():
                st = e.stat()
                total += st.st_size
                newest = max(newest, st.st_mtime)
                if day in e.name:
                    today += st.st_size
    except OSError:
        pass
    return {"total_mb": total / 1e6, "today_mb": today / 1e6, "newest_age_s": (time.time() - newest) if newest else None}


def main():
    ap = argparse.ArgumentParser(description="Live dashboard pro data ze sberace")
    ap.add_argument("--features", default=os.path.expanduser("~/data/features"))
    ap.add_argument("--data", default=os.path.expanduser("~/data/binance"))
    ap.add_argument("--port", type=int, default=8050)
    a = ap.parse_args()

    class Handler(http.server.BaseHTTPRequestHandler):
        def _send(self, code, body, ctype):
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            path = self.path.split("?")[0]
            if path in ("/", "/index.html", "/live"):
                self._send(200, LIVE_PAGE.encode("utf-8"), "text/html; charset=utf-8")
            elif path == "/prehled":
                self._send(200, PAGE.encode("utf-8"), "text/html; charset=utf-8")
            elif path == "/favicon.ico":
                self._send(204, b"", "image/x-icon")
            elif path == "/live.json":
                try:
                    with open(os.path.join(a.features, "live.json"), "rb") as f:
                        self._send(200, f.read(), "application/json")
                except OSError:
                    self._send(404, b'{"missing":true}', "application/json")
            elif path == "/files.json":
                self._send(200, json.dumps(files_info(a.data)).encode(), "application/json")
            else:
                self._send(404, b"not found", "text/plain")

        def log_message(self, *args):
            pass

    srv = http.server.ThreadingHTTPServer(("127.0.0.1", a.port), Handler)
    print(f"Dashboard bezi. Otevri v prohlizeci: http://localhost:{a.port}  (zastavis Ctrl+C)", flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
