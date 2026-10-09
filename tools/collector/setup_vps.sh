#!/usr/bin/env bash
# Install the RALPH orderflow collector on this server. Read HANDOFF.md first.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
VENV="$HOME/venv-collector"

echo "1/4 Binance reachability"
code=$(curl -s -o /dev/null -w "%{http_code}" https://fapi.binance.com/fapi/v1/ping || true)
if [ "$code" != "200" ]; then
  echo "Binance Futures API answered HTTP $code from this server (451 = region blocked). Stopping."
  exit 1
fi

echo "2/4 Python venv"
python3 -m venv "$VENV"
"$VENV/bin/pip" install --quiet --upgrade pip websockets

echo "3/4 Data folders"
mkdir -p "$HOME/data/binance" "$HOME/data/features"

echo "4/4 Service"
if command -v systemctl >/dev/null 2>&1 && [ -d /run/systemd/system ] && sudo -n true 2>/dev/null; then
  sed -e "s#__USER__#$USER#g" -e "s#__DIR__#$DIR#g" -e "s#__HOME__#$HOME#g" "$DIR/ralph-collector.service" \
    | sudo tee /etc/systemd/system/ralph-collector.service >/dev/null
  sudo systemctl daemon-reload
  sudo systemctl enable --now ralph-collector
  echo "Running. Logs: journalctl -u ralph-collector -f"
else
  echo "No systemd or no passwordless sudo here. Add these lines with 'crontab -e':"
  echo "* * * * * flock -n /tmp/binance_live.lock $VENV/bin/python $DIR/binance_live.py --all --out $HOME/data/binance --features $HOME/data/features >> $HOME/data/binance/live.log 2>&1"
  echo "* * * * * flock -n /tmp/dashboard.lock $VENV/bin/python $DIR/dashboard.py >> $HOME/data/dashboard.log 2>&1"
fi
