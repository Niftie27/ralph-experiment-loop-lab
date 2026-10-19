#!/usr/bin/env python3
"""W1: serial, verified research archival. No scheduler/config mutations.

Design: a durable one-row-per-file CSV is the resumable interface. Pilot two
files/set, archive, freshly verify all local/remote hashes, restore 2+1 files,
then require a complete /proc fd/cwd scan before manifest-only deletion.
Transport follows collector/archive_upload.py: storagebox, rsync partial-dir,
remote sha256sum. Never emit transport stderr (may contain private identifiers).
Run only inside the authorized 50% CPU / 1 GiB transient unit.
"""
import argparse
import csv
import fcntl
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import tempfile
import time

ROOTS = {
    'S1': Path('~/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/binance-usdm-archive-cache').expanduser(),
    'S2': Path('~/ralph-research-data').expanduser(),
}
REMOTE = {'S1': 'research/binance-usdm-archive-cache', 'S2': 'research/ralph-research-data'}
FIELDS = 'set rel_path bytes sha256 stored_name stored_bytes stored_sha256 remote_sha256 codec status'.split()


class ArchiveError(RuntimeError):
    pass


def run(argv, **kwargs):
    result = subprocess.run(argv, stderr=subprocess.PIPE, **kwargs)
    if result.returncode:
        raise ArchiveError(f'{Path(argv[0]).name} failed (exit {result.returncode}); stderr withheld')
    return result


def retry(fn):
    for attempt in range(2):
        try:
            return fn()
        except (ArchiveError, OSError):
            if attempt:
                raise
            time.sleep(1)


def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def signature(path):
    s = path.stat(follow_symlinks=False)
    return (s.st_dev, s.st_ino, s.st_size, s.st_mtime_ns, s.st_ctime_ns)


def safe_rel(value):
    p = PurePosixPath(value)
    if not value or p.is_absolute() or '..' in p.parts or not re.fullmatch(r'[A-Za-z0-9_./+-]+', value):
        raise ArchiveError('Unsafe relative path')
    return value


def inventory():
    out = {}
    for name, root in ROOTS.items():
        if not root.is_dir() or root.is_symlink():
            raise ArchiveError(f'{name} root missing or symlink')
        for path in sorted(root.rglob('*')):
            if path.is_symlink() or (not path.is_dir() and not path.is_file()):
                raise ArchiveError(f'{name} contains non-regular entry')
            if path.is_file():
                rel = safe_rel(path.relative_to(root).as_posix())
                if name == 'S1' and path.suffix != '.csv':
                    raise ArchiveError('S1 contains non-CSV file')
                out[(name, rel)] = signature(path)
    return out


def read_manifest(path):
    if not path.exists():
        return {}
    with path.open(newline='') as f:
        reader = csv.DictReader(f)
        if reader.fieldnames != FIELDS:
            raise ArchiveError('Unexpected manifest schema')
        out = {}
        for row in reader:
            key = (row['set'], safe_rel(row['rel_path']))
            if key[0] not in ROOTS or key in out:
                raise ArchiveError('Unknown set or duplicate manifest row')
            safe_rel(row['stored_name'])
            out[key] = row
        return out


def save_manifest(path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(mode='w', newline='', dir=path.parent, delete=False) as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows[k] for k in sorted(rows))
        f.flush()
        os.fsync(f.fileno())
        tmp = f.name
    os.replace(tmp, path)


def remote_path(row):
    return REMOTE[row['set']] + '/' + safe_rel(row['stored_name'])


def remote_sha(path):
    result = run(['ssh', '-o', 'BatchMode=yes', 'storagebox', 'sha256sum', path],
                 stdout=subprocess.PIPE, text=True)
    value = result.stdout.split()[0] if result.stdout.split() else ''
    if not re.fullmatch('[0-9a-f]{64}', value):
        raise ArchiveError('Invalid remote sha256 response')
    return value


def mkdir_remote(path):
    # Restricted Storage Box shells may need parents created individually.
    parts = PurePosixPath(path).parts
    for i in range(1, len(parts) + 1):
        retry(lambda i=i: run(['ssh', '-o', 'BatchMode=yes', 'storagebox', 'mkdir', '-p', '/'.join(parts[:i])], stdout=subprocess.PIPE))


def upload(path, destination):
    run(['rsync', '-a', '--checksum', '--partial-dir=.rsync-partial', '--bwlimit=20000',
         '-e', 'ssh -o BatchMode=yes', str(path), 'storagebox:' + destination], stdout=subprocess.PIPE)


def download(source, destination):
    run(['rsync', '-a', '--partial-dir=.rsync-partial', '--bwlimit=20000',
         '-e', 'ssh -o BatchMode=yes', 'storagebox:' + source, str(destination)], stdout=subprocess.PIPE)


def decompressed_sha(path, codec):
    cmd = ['zstd', '-q', '-d', '-c', str(path)] if codec == 'zstd' else ['xz', '-d', '-c', str(path)]
    with subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL) as proc:
        h = hashlib.sha256()
        for block in iter(lambda: proc.stdout.read(1024 * 1024), b''):
            h.update(block)
        if proc.wait():
            raise ArchiveError('Decompression failed')
    return h.hexdigest()


def archive_one(key, expected, codec):
    name, rel = key
    path = ROOTS[name] / rel
    if signature(path) != expected:
        raise ArchiveError('Source changed since inventory')
    original = sha(path)
    row = dict(zip(FIELDS, [name, rel, expected[2], original, rel, expected[2], original, '', 'none', 'FAIL']))
    with tempfile.TemporaryDirectory(prefix='w1-compress-') as tmp:
        stored = path
        if name == 'S1':
            row['codec'] = codec
            row['stored_name'] = rel + ('.zst' if codec == 'zstd' else '.xz')
            stored = Path(tmp) / Path(row['stored_name']).name
            cmd = ['zstd', '-q', '-9', '-T1', '-c', str(path)] if codec == 'zstd' else ['xz', '-3', '-T1', '-c', str(path)]
            with stored.open('wb') as f:
                run(cmd, stdout=f)
            if decompressed_sha(stored, codec) != original:
                raise ArchiveError('Compression roundtrip mismatch')
            row['stored_bytes'], row['stored_sha256'] = stored.stat().st_size, sha(stored)
        if signature(path) != expected:
            raise ArchiveError('Source changed during compression/hash')
        destination = remote_path(row)
        mkdir_remote(str(PurePosixPath(destination).parent))
        def transfer():
            upload(stored, destination)
            value = remote_sha(destination)
            if value != row['stored_sha256']:
                raise ArchiveError('Remote hash mismatch')
            return value
        row['remote_sha256'] = retry(transfer)
        if signature(path) != expected:
            raise ArchiveError('Source changed during upload')
        row['status'] = 'PASS'
    return row


def archive(keys, initial, rows, manifest, codec):
    for key in keys:
        if key in rows and rows[key]['status'] == 'PASS':
            continue
        try:
            rows[key] = archive_one(key, initial[key], codec)
        except (ArchiveError, OSError):
            # Persist a FAIL even when failure happened before hashing/compression.
            name, rel = key
            rows[key] = dict(zip(FIELDS, [name, rel, initial[key][2], '', rel, '', '', '', 'none', 'FAIL']))
            save_manifest(manifest, rows)
            raise
        save_manifest(manifest, rows)
        print(json.dumps({'phase': 'archive', 'PASS': sum(r['status'] == 'PASS' for r in rows.values()), 'total': len(initial)}), flush=True)


def proc_scan():
    hits, denied = [], []
    prefixes = [str(p) for p in ROOTS.values()]
    for proc in Path('/proc').iterdir():
        if not proc.name.isdigit():
            continue
        try:
            links = [proc / 'cwd'] + list((proc / 'fd').iterdir())
            for link in links:
                try:
                    target = str(link.readlink()).removesuffix(' (deleted)')
                except FileNotFoundError:
                    continue
                if any(target == p or target.startswith(p + '/') for p in prefixes):
                    hits.append(f'{proc.name}:{link.name}')
        except (FileNotFoundError, ProcessLookupError):
            continue
        except PermissionError:
            denied.append(proc.name)
    return {'hits': hits, 'inaccessible_pids': denied, 'status': 'PASS' if not hits and not denied else 'not verified' if denied else 'FAIL'}


def df():
    return run(['df', '-B1', '/'], stdout=subprocess.PIPE, text=True).stdout.strip()


def save_report(path, report):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, indent=2) + '\n')


def verify(rows, initial):
    if set(rows) != set(initial) or any(r['status'] != 'PASS' for r in rows.values()):
        raise ArchiveError('R4 manifest coverage/status failed')
    if inventory() != initial:
        raise ArchiveError('R4 inventory changed')
    for i, (key, row) in enumerate(sorted(rows.items()), 1):
        expected_codec = row['codec']
        suffix = {'zstd': '.zst', 'xz': '.xz', 'none': ''}.get(expected_codec)
        if suffix is None or row['stored_name'] != row['rel_path'] + suffix:
            raise ArchiveError('R4 invalid stored filename/codec')
        if (key[0] == 'S1') != (expected_codec in ('zstd', 'xz')):
            raise ArchiveError('R4 codec/set mismatch')
        if int(row['bytes']) != initial[key][2] or sha(ROOTS[key[0]] / key[1]) != row['sha256']:
            raise ArchiveError('R4 fresh local hash mismatch')
        def check():
            value = remote_sha(remote_path(row))
            if value != row['stored_sha256'] or value != row['remote_sha256']:
                raise ArchiveError('R4 fresh remote hash mismatch')
        retry(check)
        if i % 20 == 0 or i == len(rows):
            print(json.dumps({'phase': 'fresh-verify', 'verified': i, 'total': len(rows)}), flush=True)
    selected = [k for k in sorted(rows) if k[0] == 'S1'][:2] + [k for k in sorted(rows) if k[0] == 'S2'][:1]
    if len(selected) != 3:
        raise ArchiveError('R4 insufficient restore samples')
    restored = []
    with tempfile.TemporaryDirectory(prefix='w1-restore-') as tmp:
        for i, key in enumerate(selected):
            row = rows[key]
            local = Path(tmp) / str(i)
            retry(lambda: download(remote_path(row), local))
            if sha(local) != row['stored_sha256']:
                raise ArchiveError('R4 restore stored hash mismatch')
            value = decompressed_sha(local, row['codec']) if row['codec'] != 'none' else sha(local)
            if value != row['sha256']:
                raise ArchiveError('R4 restore original hash mismatch')
            restored.append({'set': key[0], 'rel_path': key[1], 'status': 'PASS'})
    return restored


def delete_verified(rows, initial, report, report_path):
    # Fresh inventory and complete /proc scan immediately precede any source unlink.
    if inventory() != initial:
        raise ArchiveError('R4 inventory changed before deletion')
    scan = proc_scan()
    if scan['status'] != 'PASS':
        time.sleep(1)
        scan = proc_scan()  # one read-only retry; never treat inaccessible as empty
    report['proc_scan'] = scan
    save_report(report_path, report)
    if scan['status'] != 'PASS':
        raise ArchiveError('R4 /proc gate not PASS; no local dataset deletion')
    for name, root in ROOTS.items():
        report[name]['df_before_delete'] = df()
        save_report(report_path, report)
        for key in sorted(rows):
            if key[0] == name:
                path = root / key[1]
                if signature(path) != initial[key]:
                    raise ArchiveError('R4 source changed immediately before unlink')
                path.unlink()
        for path in sorted(root.rglob('*'), key=lambda p: len(p.parts), reverse=True):
            if path.is_dir() and not path.is_symlink():
                path.rmdir()  # only empty dirs; never recursive deletion
        root.rmdir()
        report[name]['df_after_delete'] = df()
        report[name]['local_removed'] = True
        save_report(report_path, report)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--report', type=Path, required=True)
    parser.add_argument('--delete-after-r4', action='store_true')
    args = parser.parse_args()
    args.manifest.parent.mkdir(parents=True, exist_ok=True)
    lock = args.manifest.with_suffix('.lock').open('a')
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    started = time.monotonic()
    report = {'started_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'df_initial': df(), 'script_sha256': sha(__file__)}
    code = 0
    try:
        initial = inventory()
        rows = read_manifest(args.manifest)
        if set(rows) - set(initial):
            raise ArchiveError('Manifest has files absent from local inventory')
        codec = 'zstd' if shutil.which('zstd') else 'xz'
        report['codec'] = codec
        for name in ROOTS:
            report[name] = {'files': sum(k[0] == name for k in initial), 'bytes': sum(v[2] for k, v in initial.items() if k[0] == name), 'local_removed': False}
        save_report(args.report, report)
        pilot = sum(([k for k in sorted(initial) if k[0] == name][:2] for name in ROOTS), [])
        if len(pilot) != 4:
            raise ArchiveError('Pilot needs two files per set')
        archive(pilot, initial, rows, args.manifest, codec)
        report['pilot'] = '4/4 PASS'
        save_report(args.report, report)
        print('PILOT 4/4 PASS', flush=True)
        archive(sorted(initial), initial, rows, args.manifest, codec)
        for name in ROOTS:
            subset = [r for r in rows.values() if r['set'] == name]
            report[name].update(stored_bytes=sum(int(r['stored_bytes']) for r in subset), PASS=sum(r['status'] == 'PASS' for r in subset), FAIL=sum(r['status'] == 'FAIL' for r in subset))
        save_report(args.report, report)
        report['restore'] = verify(rows, initial)
        report['fresh_hashes'] = f'{len(rows)}/{len(rows)} PASS'
        save_report(args.report, report)
        if args.delete_after_r4:
            delete_verified(rows, initial, report, args.report)
            report['df_before_prune'] = df()
            if shutil.which('uv'):
                retry(lambda: run(['uv', 'cache', 'prune'], stdout=subprocess.PIPE))
                report['uv_prune'] = 'PASS'
            else:
                report['uv_prune'] = 'not verified'
            report['df_after_prune'] = df()
            save_report(args.report, report)
            destination = 'research/manifests/w1-2026-10-19.csv'
            mkdir_remote('research/manifests')
            def upload_manifest():
                upload(args.manifest, destination)
                if remote_sha(destination) != sha(args.manifest):
                    raise ArchiveError('Manifest remote hash mismatch')
            retry(upload_manifest)
            report['remote_manifest'] = destination
        report['status'] = 'PASS'
    except (ArchiveError, OSError) as exc:
        report.update(status='STOPPED', error=str(exc))
        print(str(exc), flush=True)
        code = 1
    finally:
        report['runtime_seconds'] = round(time.monotonic() - started, 2)
        save_report(args.report, report)
    return code


if __name__ == '__main__':
    raise SystemExit(main())
