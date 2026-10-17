#!/bin/bash
# Executed directly from the repository inside the detached R6 scope.
set -u
cd -- "$(dirname -- "$0")/.." || exit 1
node src/run-queue.mjs
queue_status=$?
printf '%s\n' "$queue_status" > results/h3a-exit-code.txt
exit "$queue_status"
