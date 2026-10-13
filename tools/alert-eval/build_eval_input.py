#!/usr/bin/env python3
"""Build the alert-eval ledger input from paired Telegram export rows."""

from __future__ import annotations

import argparse
from collections import Counter
import csv
from decimal import Decimal
import os
from pathlib import Path


PRICE_FIELDS = ("sl_sent", "tp1_sent", "tp2_sent", "tp3_sent")
EXPORT_FIELDS = {
    "sl_sent": "sl",
    "tp1_sent": "tp1",
    "tp2_sent": "tp2",
    "tp3_sent": "tp3",
}


def normalize(value: str) -> str:
    return str(Decimal(value.replace(",", "").strip()).normalize())


def load_paired_export(path: Path) -> tuple[dict[str, dict[str, str]], int]:
    paired: dict[str, dict[str, str]] = {}
    unpaired = 0
    with path.open(newline="") as f:
        for row in csv.DictReader(f):
            if row.get("match_status") != "paired":
                unpaired += 1
                continue
            alert_id = row.get("alert_id", "")
            if not alert_id:
                raise ValueError("paired export row has no alert_id")
            if alert_id in paired:
                raise ValueError(f"duplicate paired export alert_id={alert_id}")
            paired[alert_id] = row
    return paired, unpaired


def fill_row(row: dict[str, str], export_rows: dict[str, dict[str, str]]) -> tuple[dict[str, str], bool]:
    alert_id = row["alert_id"]
    export = export_rows.get(alert_id)
    filled = False
    if export is None:
        raise ValueError(f"{alert_id}: no paired Telegram export row")
    for ledger_field, export_field in EXPORT_FIELDS.items():
        existing = row.get(ledger_field, "")
        exported = export.get(export_field, "")
        if not exported:
            raise ValueError(f"{alert_id}: paired export lacks {export_field}")
        if existing:
            if normalize(existing) != normalize(exported):
                raise ValueError(f"{alert_id}: {ledger_field} disagreement ledger={existing} export={exported}")
            continue
        row[ledger_field] = exported
        filled = True
    if filled:
        row["text_source"] = "telegram_export"
    missing = [field for field in PRICE_FIELDS if not row.get(field, "")]
    if missing:
        raise ValueError(f"{alert_id}: missing {','.join(missing)}")
    return row, filled


def count_rows(rows: list[dict[str, str]]) -> Counter[tuple[str, str, str, str]]:
    counts: Counter[tuple[str, str, str, str]] = Counter()
    for row in rows:
        counts[(row.get("source_id", ""), row.get("version", ""), row.get("text_source", ""), row.get("status", ""))] += 1
    return counts


def write_output(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    os.chmod(path, 0o600)


def run(args: argparse.Namespace) -> int:
    export_rows, unpaired_exports = load_paired_export(args.alert_texts_export)
    rows: list[dict[str, str]] = []
    filled = 0
    with args.ledger.open(newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            raise ValueError("ledger has no header")
        fieldnames = list(reader.fieldnames)
        for row in reader:
            out, was_filled = fill_row(dict(row), export_rows)
            rows.append(out)
            filled += int(was_filled)
    if len(rows) != len(export_rows):
        ledger_ids = {row["alert_id"] for row in rows}
        missing = sorted(set(export_rows) - ledger_ids)
        extra = sorted(ledger_ids - set(export_rows))
        raise ValueError(f"ledger/export paired alert_id mismatch missing_from_ledger={missing} extra_in_ledger={extra}")
    write_output(args.output, fieldnames, rows)
    print(f"rows={len(rows)} filled_from_telegram_export={filled} unpaired_exports_excluded={unpaired_exports}")
    print("counts source_id|version|text_source|status count")
    for key, count in sorted(count_rows(rows).items()):
        print("|".join(key), count)
    return 0


def build_parser() -> argparse.ArgumentParser:
    state_dir = Path.home() / "ralph-state"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ledger", type=Path, default=state_dir / "alert-ledger.csv")
    parser.add_argument("--alert-texts-export", type=Path, default=state_dir / "alert-texts-export.csv")
    parser.add_argument("--output", type=Path, default=state_dir / "alerts-for-eval.csv")
    return parser


if __name__ == "__main__":
    raise SystemExit(run(build_parser().parse_args()))
