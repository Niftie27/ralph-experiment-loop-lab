#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="/home/coder/.openclaw/workspace"
NODE_BIN="${NODE_BIN:-node}"
TMP_DIR="$WORKSPACE/.tmp"

mkdir -p "$TMP_DIR"

is_running_script() {
  local pid_file="$1"
  local script_path="$2"
  local pid

  [[ -f "$pid_file" ]] || return 1
  pid="$(<"$pid_file")"
  [[ "$pid" =~ ^[0-9]+$ ]] || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  tr '\0' ' ' <"/proc/$pid/cmdline" 2>/dev/null | grep -Fq "$script_path"
}

start_detached() {
  local pid_file="$1"
  local log_file="$2"
  shift 2

  setsid env "$@" >>"$log_file" 2>&1 </dev/null &
  printf '%s\n' "$!" >"$pid_file"
}

ensure_btc() {
  local script="$WORKSPACE/scripts/btc-short-watch-82k.mjs"
  local pid_file="$TMP_DIR/btc-short-watch-82k.pid"
  local log_file="$TMP_DIR/btc-short-watch-82k.log"

  if ! is_running_script "$pid_file" "$script"; then
    start_detached "$pid_file" "$log_file" \
      BTC_SHORT_WATCH_EXPIRES_AT=0 \
      BTC_SHORT_WATCH_CHECK_MS=30000 \
      "$NODE_BIN" "$script"
  fi
}

ensure_zec_hype() {
  local script="$WORKSPACE/scripts/zec-hype-short-watch.mjs"
  local pid_file="$TMP_DIR/zec-hype-short-watch.pid"
  local log_file="$TMP_DIR/zec-hype-short-watch.log"

  if ! is_running_script "$pid_file" "$script"; then
    start_detached "$pid_file" "$log_file" \
      ALT_SHORT_WATCH_CHECK_MS=30000 \
      "$NODE_BIN" "$script"
  fi
}

ensure_btc
ensure_zec_hype
