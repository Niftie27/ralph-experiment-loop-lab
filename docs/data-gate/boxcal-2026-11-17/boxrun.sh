# boxrun.sh - boxcal96: gapcal per UTC day over the Storage Box raw files (read-only on the box).
# Run from ~/boxcal96/run as: sh boxrun.sh  (inside the R6 scope). Writes only under ~/boxcal96/run.
# Per day D (2026-10-10..2026-11-04): copy raw D-1T23Z (lookback) + all raw hours of D (11-04: up to T22Z)
# for 4 symbols into tmp/D/binance*/, check the exact file set, run gapcal.py on tmp/D, check its files.tsv,
# delete tmp/D (only the checked copies), write out/D/day.txt. Days with out/D/day.txt are skipped (resume).
set -u
NOW_MS=1794787200000
DAYS="2026-10-10 2026-10-11 2026-10-12 2026-10-13 2026-10-14 2026-10-15 2026-10-16 2026-10-17 2026-10-18
2026-10-19 2026-10-20 2026-10-21 2026-10-22 2026-10-23 2026-10-24 2026-10-25 2026-10-26 2026-10-27 2026-10-28
2026-10-29 2026-10-30 2026-10-31 2026-11-01 2026-11-02 2026-11-03 2026-11-04"
FIRST_PREV=2026-10-09
LAST_DAY=2026-11-04
LAST_HOUR=22
SYMS="BTCUSDT ETHUSDT SOLUSDT HYPEUSDT"
RSH="ssh -o BatchMode=yes -o LogLevel=ERROR"
BWLIMIT=16000
MEM_MIN_MB=600
log() { echo "$(date -u +%FT%TZ) $*"; }
die() { log "STOP $*"; exit 3; }
subdir() { if [ "$1" = BTCUSDT ]; then echo binance; else echo "binance-$(echo "$1" | tr 'A-Z' 'a-z')"; fi; }
memavail() { awk '/^MemAvailable:/{print int($2/1024)}' /proc/meminfo; }
memgate() {
  w=0
  while [ "$(memavail)" -lt "$MEM_MIN_MB" ]; do
    w=$((w + 1))
    [ "$w" -gt 30 ] && die "MemAvailable below $MEM_MIN_MB MiB for 30 min"
    log "WAIT MemAvailable $(memavail) MiB"
    sleep 60
  done
}
diskgate() {
  df -P -k . | awk 'NR==2{t=$2; a=$4-4194304; ok=(a>=10485760 && a/t>=0.21); printf "%s free_gib=%.1f total_gib=%.1f free_pct=%.1f\n", (ok?"DISK ok":"DISK low"), $4/1048576, t/1048576, 100*$4/t}'
}
expected() {  # expected sorted file names for symbol $1, day $2, previous day $3
  last=23; [ "$2" = "$LAST_DAY" ] && last=$LAST_HOUR
  { echo "raw_$1_$3T23Z.jsonl.xz"; h=0
    while [ "$h" -le "$last" ]; do printf 'raw_%s_%sT%02dZ.jsonl.xz\n' "$1" "$2" "$h"; h=$((h + 1)); done; } | sort
}
[ "$(pwd)" = "$HOME/boxcal96/run" ] || die "not in ~/boxcal96/run"
[ -f gapcal.py ] || die "no gapcal.py"
mkdir -p tmp out logs || die "mkdir failed"
log "START boxrun days=26 pid=$$ MemAvailable=$(memavail)"
P=$FIRST_PREV
for D in $DAYS; do
  case "$D" in 20[0-9][0-9]-[01][0-9]-[0-3][0-9]) ;; *) die "bad day $D" ;; esac
  if [ -f "out/$D/day.txt" ]; then log "DAY $D skip_done"; P=$D; continue; fi
  [ ! -e "out/$D" ] || die "out/$D exists without day.txt"
  [ ! -e "tmp/$D" ] || die "tmp/$D exists"
  memgate
  dg=$(diskgate); log "$dg"
  case "$dg" in "DISK ok"*) ;; *) die "disk gate" ;; esac
  t0=$(date +%s)
  for S in $SYMS; do
    sd=$(subdir "$S"); mkdir -p "tmp/$D/$sd" || die "mkdir tmp/$D/$sd"
    rsync -t --bwlimit="$BWLIMIT" -e "$RSH" "storagebox:ralph/raw/$S/$P/raw_${S}_${P}T23Z.jsonl.xz" "tmp/$D/$sd/" \
      || die "rsync lookback $S $D"
    if [ "$D" = "$LAST_DAY" ]; then
      rsync -rt --bwlimit="$BWLIMIT" -e "$RSH" --exclude="raw_${S}_${D}T23Z.jsonl.xz" --include="raw_${S}_*.jsonl.xz" \
        --exclude='*' "storagebox:ralph/raw/$S/$D/" "tmp/$D/$sd/" || die "rsync day $S $D"
    else
      rsync -rt --bwlimit="$BWLIMIT" -e "$RSH" --include="raw_${S}_*.jsonl.xz" --exclude='*' \
        "storagebox:ralph/raw/$S/$D/" "tmp/$D/$sd/" || die "rsync day $S $D"
    fi
    got=$(cd "tmp/$D/$sd" && find . -mindepth 1 | sed 's#^\./##' | sort)
    [ "$got" = "$(expected "$S" "$D" "$P")" ] || die "file set mismatch $S $D ($(echo "$got" | grep -c .) files)"
  done
  t1=$(date +%s)
  nf=$(find "tmp/$D" -type f | grep -c .)
  nb=$(du -sk "tmp/$D" | cut -f1)
  python3 gapcal.py --root "tmp/$D" --out "out/$D" --now-ms "$NOW_MS" > "logs/$D.log" 2>&1
  rc=$?
  t2=$(date +%s)
  [ "$rc" -eq 0 ] || die "gapcal exit $rc on $D"
  [ "$(tail -n 1 "logs/$D.log")" = "gapcal done" ] || die "no 'gapcal done' on $D"
  for S in $SYMS; do
    want=25; [ "$D" = "$LAST_DAY" ] && want=24
    nok=$(awk -F'\t' -v s="$S" '$1==s && $2!="-" && $3=="ok" && $4>0' "out/$D/files.tsv" | grep -c .)
    nall=$(awk -F'\t' -v s="$S" '$1==s && $2!="-"' "out/$D/files.tsv" | grep -c .)
    tl=$(awk -F'\t' -v s="$S" '$1==s && $2=="-"{print $3}' "out/$D/files.tsv")
    [ "$nok" -eq "$want" ] && [ "$nall" -eq "$want" ] || die "files.tsv $S $D ok=$nok rows=$nall want=$want"
    case "$tl" in *" bad=0 recv_back=0 other_streams=0") ;; *) die "files.tsv tail $S $D: $tl" ;; esac
  done
  [ "$nf" -eq 100 ] || { [ "$D" = "$LAST_DAY" ] && [ "$nf" -eq 96 ]; } || die "copied files $nf on $D"
  bad=$(find "tmp/$D" -type f ! -name 'raw_*.jsonl.xz' | grep -c .)
  [ "$bad" -eq 0 ] || die "unexpected file in tmp/$D"
  rm -r "tmp/$D" || die "rm tmp/$D failed"
  [ ! -e "tmp/$D" ] || die "tmp/$D still exists"
  echo "day=$D files=$nf kib=$nb copy_s=$((t1 - t0)) gapcal_s=$((t2 - t1)) memavail_mb=$(memavail)" > "out/$D/day.txt"
  log "DAY $D done files=$nf kib=$nb copy_s=$((t1 - t0)) gapcal_s=$((t2 - t1)) deleted=tmp/$D"
  P=$D
done
log "ALL DONE days=$(ls out | grep -c .)"
