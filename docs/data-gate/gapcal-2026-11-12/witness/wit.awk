# wit.awk - wit95 second witness for gapcal (read-only; independent awk re-implementation of its definitions).
# Usage: awk -v sym=BTCUSDT -v files="<hour file 1> <hour file 2> ..." -v err=<file for xz stderr> -f wit.awk
# Reads the given hour files in the given order through `xz -dc` as one continuous stream (no state before the
# first line of the first file) and uses websocket lines only ("src":"ws"). Lines are split at double quotes:
# field 2 recv_ms, 3 ":<ms>,", 4 src, 6 src value, 8 stream, 10 stream name; the stream is the part after the first @.
# Connections: market = aggTrade, markPrice@1s, forceOrder; public = depth@100ms, bookTicker.
# Output lines (tab separated):
#   L sym hour lines nonstd nonws other    per file: all lines, lines not in that layout, non-ws lines, other ws streams
#   G sym stream start_ms len_ms sibling_msgs conn_max_silence_ms
#        a receive gap of one stream > 2000 ms (aggTrade > 10000 ms); sibling_msgs = messages of the other streams
#        of its connection inside the gap; conn_max_silence_ms = longest step between consecutive messages of the
#        connection inside the gap if >= 1000 ms, else 0
#   R sym conn start_ms len_ms first_ms stream_a delay_a stream_b delay_b status
#        a step >= 3000 ms between consecutive messages of a connection; delay = first message of the stream after
#        it minus first_ms (the message that ends the step) or never; status closed (both seen), superseded (a later
#        step of the same connection came first) or open (input ended first)
#   N sym neg_market neg_public            backward receive-time steps per connection (counted, then held at the max)
BEGIN {
  CONN["aggTrade"] = "market"; CONN["markPrice@1s"] = "market"; CONN["forceOrder"] = "market"
  CONN["depth@100ms"] = "public"; CONN["bookTicker"] = "public"
  LIM["aggTrade"] = 10000; LIM["markPrice@1s"] = 2000; LIM["depth@100ms"] = 2000; LIM["bookTicker"] = 2000
  SA["market"] = "aggTrade"; SB["market"] = "markPrice@1s"
  SA["public"] = "depth@100ms"; SB["public"] = "bookTicker"
  neg["market"] = 0; neg["public"] = 0
  nr = 0
  n = split(files, F, " ")
  for (i = 1; i <= n; i++) {
    f = F[i]
    lab = f; sub(/^.*raw_[A-Z0-9]+_/, "", lab); sub(/\.jsonl\.xz$/, "", lab)
    cmd = "xz -dc '" f "' 2>>'" err "'"
    c = 0; ns = 0; nw = 0; oth = 0
    while ((cmd | getline ln) > 0) {
      c++
      k = split(ln, q, "\"")
      if (k < 11 || q[2] != "recv_ms" || q[4] != "src" || q[8] != "stream" || q[3] !~ /^:[0-9]+,$/) { ns++; continue }
      if (q[6] != "ws") { nw++; continue }
      s = q[10]; at = index(s, "@")
      if (at == 0) { ns++; continue }
      s = substr(s, at + 1)
      if (!(s in CONN)) { oth++; continue }
      feed(substr(q[3], 2, length(q[3]) - 2) + 0, s, CONN[s])
    }
    close(cmd)
    printf "L\t%s\t%s\t%d\t%d\t%d\t%d\n", sym, lab, c, ns, nw, oth
  }
  for (r = 1; r <= nr; r++) {
    c = Rc[r]
    if (ha[r] && hb[r]) st = "closed"
    else if ((c in opn) && opn[c] == r) st = "open"
    else st = "superseded"
    da = ha[r] ? sprintf("%.0f", fa[r] - Rf[r]) : "never"
    db = hb[r] ? sprintf("%.0f", fb[r] - Rf[r]) : "never"
    printf "R\t%s\t%s\t%.0f\t%.0f\t%.0f\t%s\t%s\t%s\t%s\t%s\n", sym, c, Rs[r], Rl[r], Rf[r], SA[c], da, SB[c], db, st
  }
  printf "N\t%s\t%d\t%d\n", sym, neg["market"], neg["public"]
}

function feed(t, s, c,    g, o, sib, cm0) {
  if (c in clast) {
    if (t < clast[c]) { neg[c]++; t = clast[c] }
    g = t - clast[c]
    if (g > cm[SA[c]]) cm[SA[c]] = g
    if (g > cm[SB[c]]) cm[SB[c]] = g
    if (g >= 3000) {
      nr++; Rc[nr] = c; Rs[nr] = clast[c]; Rl[nr] = g; Rf[nr] = t; ha[nr] = 0; hb[nr] = 0
      opn[c] = nr
    }
  }
  clast[c] = t
  cc[c]++; sc[s]++
  if (!(s in LIM)) return
  if (c in opn) {
    o = opn[c]
    if (s == SA[c] && !ha[o]) { ha[o] = 1; fa[o] = t }
    if (s == SB[c] && !hb[o]) { hb[o] = 1; fb[o] = t }
    if (ha[o] && hb[o]) delete opn[c]
  }
  sib = cc[c] - sc[s]
  if (s in last) {
    g = t - last[s]
    if (g > LIM[s]) {
      cm0 = (cm[s] >= 1000) ? cm[s] : 0
      printf "G\t%s\t%s\t%.0f\t%.0f\t%.0f\t%.0f\n", sym, s, last[s], g, sib - sat[s], cm0
    }
  }
  last[s] = t; sat[s] = sib; cm[s] = 0
}
