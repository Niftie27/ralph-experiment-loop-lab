#!/bin/sh
# wit.sh - wit95 driver (read-only on ~/data). Usage: sh wit.sh <dir holding wit.awk> <out dir>
# For each window (3 consecutive hours) and symbol, runs wit.awk on the three raw hour files
# ~/data/binance*/raw_<SYM>_<hour>.jsonl.xz (exactly one file per hour, else MISSING and exit 3).
# Writes <out>/w_<first hour>_<SYM>.tsv per window and symbol, and xz errors to <out>/xz_err.txt.
set -u
d=$1
out=$2
mkdir -p "$out" || exit 2
: > "$out/xz_err.txt" || exit 2
for w in "2026-11-10T12Z 2026-11-10T13Z 2026-11-10T14Z" \
         "2026-11-11T02Z 2026-11-11T03Z 2026-11-11T04Z" \
         "2026-11-11T13Z 2026-11-11T14Z 2026-11-11T15Z"; do
  w0=${w%% *}
  for sym in BTCUSDT ETHUSDT SOLUSDT HYPEUSDT; do
    files=""
    for h in $w; do
      set -- "$HOME"/data/binance*/raw_"$sym"_"$h".jsonl.xz
      if [ $# -ne 1 ] || [ ! -f "$1" ]; then echo "MISSING $sym $h"; exit 3; fi
      files="$files $1"
    done
    t0=$(date +%s)
    awk -v sym="$sym" -v files="$files" -v err="$out/xz_err.txt" -f "$d/wit.awk" > "$out/w_${w0}_$sym.tsv" ||
      { echo "AWK_FAIL $w0 $sym"; exit 4; }
    echo "WIN $w0 $sym secs $(( $(date +%s) - t0 )) rows $(wc -l < "$out/w_${w0}_$sym.tsv")"
  done
done
echo "witness done"
