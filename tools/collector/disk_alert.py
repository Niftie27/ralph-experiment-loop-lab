#!/usr/bin/env python3
"""Exit non-zero when free disk space is below a threshold."""
import argparse
import shutil
import sys


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--path", default="/home/coder/data")
    ap.add_argument("--min-free-pct", type=float, default=20.0)
    args = ap.parse_args()
    usage = shutil.disk_usage(args.path)
    free_pct = usage.free / usage.total * 100
    print(f"disk_free_pct={free_pct:.2f} path={args.path}")
    if free_pct < args.min_free_pct:
        sys.exit(2)


if __name__ == "__main__":
    main()
