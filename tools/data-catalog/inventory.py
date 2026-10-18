#!/usr/bin/env python3
"""Read-only dataset inventory; stdlib only. JSON lines to stdout, no writes.

Usage: inventory.py [--pattern NAME GLOB] [--metadata-only] [--settle-seconds N]
Default: known RALPH datasets. File dates are UTC filename partitions when known,
otherwise mtime (never creation time). Daily bytes describe retained physical
files attributed to those dates, NOT historical ingress. Schema covers every
row of the selected file; array elements use [] and numeric map keys use {}.
Private categories are count/bytes only, with no filenames or content emitted.
"""
import argparse
import contextlib
import csv
import datetime as dt
import glob
import gzip
import io
import json
import lzma
import os
from pathlib import Path
import re
import sys
import time
import zipfile

UTC = dt.timezone.utc
HOME = Path.home()
WS = HOME / '.openclaw/workspace'
REPO = Path(__file__).resolve().parents[2]
HOUR = re.compile(r'(\d{4}-\d{2}-\d{2}T\d{2}Z)')
DAY = re.compile(r'(?<![0-9])(20[0-9]{2}-?[0-9]{2}-?[0-9]{2})(?![0-9])')
TIME_FIELD = re.compile(r'(time|timestamp|recv|recorded|created|updated|(?:^|\.)(?:t|T|E|t_ms|ts|at|day)$)', re.I)


def short(path):
    return str(path).replace(str(HOME), '~')


def iso(t):
    return dt.datetime.fromtimestamp(t, UTC).isoformat()


def partition(path):
    m = HOUR.search(path.name)
    if m:
        return dt.datetime.strptime(m[1], '%Y-%m-%dT%HZ').replace(tzinfo=UTC).timestamp(), 3600
    m = DAY.search(path.name)
    if m:
        try:
            return dt.datetime.strptime(m[1].replace('-', ''), '%Y%m%d').replace(tzinfo=UTC).timestamp(), 86400
        except ValueError:
            pass  # Numeric cache identifiers need not be calendar dates.
    return None, None


def datasets():
    out = []
    def add(name, pattern, cadence='static', private=False):
        out.append((name, str(pattern), cadence, private))
    for symbol, suffix in [('BTCUSDT',''),('ETHUSDT','-ethusdt'),('SOLUSDT','-solusdt'),('HYPEUSDT','-hypeusdt')]:
        raw = HOME / ('data/binance' + suffix)
        features = HOME / ('data/features' + suffix)
        for kind, ext in [('raw','jsonl.*'),('tape','csv*'),('book','jsonl.*')]:
            add(f'{symbol} {kind}', raw / f'{kind}_{symbol}_*.{ext}', 'hour')
        for kind, pattern, cadence in [
            ('bars','live_bars_*.csv','day'),('events','live_events_*.jsonl','day'),
            ('footprints','live_footprint_*.jsonl.gz','day'),('profiles','all_prices_*.csv','day'),
            ('sessions','live_sessions.csv','mutable'),('live snapshot','live.json','mutable'),
            ('engine state','engine_state.json','mutable'),
            ('offline bars','bars_*.csv','static'),('offline events','events.jsonl','static'),
            ('offline footprints','footprint_*.jsonl.gz','static'),('offline sessions','sessions.csv','static')]:
            add(f'{symbol} {kind}',features/pattern,cadence)
        add(f'{symbol} legacy rounded tapes',raw/'tape_rounded/*','static')
        add(f'{symbol} legacy rounded engine',features/'engine_rounded/*','static')
    for name, pattern, cadence in [
        ('Binance Vision research trades','ralph-research-data/binance-vision/*.zip','static'),
        ('Binance Vision checksums','ralph-research-data/binance-vision/*.CHECKSUM','static'),
        ('Bybit public research trades','ralph-research-data/bybit-public/*.csv.gz','static'),
        ('Bybit mark klines','ralph-research-data/bybit-markkline/*.csv','static'),
        ('Research download manifest','ralph-research-data/manifest.csv','mutable'),
        ('Archive upload ledger','ralph-state/archive-files.csv','mutable'),
        ('Archive lock','ralph-state/archive-upload.lock','mutable'),
        ('Raw deletion ledger','ralph-state/raw-deleted.csv','mutable'),
        ('Disk alert state','data/disk-alert*state.json','mutable'),
        ('Daily data checks','ralph-data-checks-repo/data-checks/*.csv','day')]:
        add(name,HOME/pattern,cadence)
    for p in sorted((HOME/'ralph-state').glob('*')):
        if p.is_file() and p.name not in ('archive-files.csv','archive-upload.lock','raw-deleted.csv') and p.suffix not in ('.py',):
            # Chat-derived exports and execution/account records are personal.
            private = any(x in p.name for x in ('alert-text','feedback-snapshot','short-watch-alert-text'))
            add('Evaluation '+p.name,p,'static',private)
    runtime = WS/'crypto-updates/runtime'
    for p in sorted(runtime.glob('*')):
        if p.is_file():
            private = any(x in p.name for x in ('execution','journal','monitor-index','alert-feedback','paper-trades','demo-sim'))
            add('Watcher '+p.name,p,'mutable',private)
    for name, pat in [('Orderflow spike raw','*/raw-events.jsonl'),('Orderflow spike features','*/features-1s.csv'),('Orderflow spike databases','*/*.sqlite'),('Orderflow spike manifests','*/*.yaml')]:
        add(name,runtime/'orderflow-spikes'/pat)
    for root in [REPO,WS/'ralph-research-os']:
        tag = 'repo' if root == REPO else 'workspace'
        for exp in sorted((root/'experiments').iterdir()):
            if not exp.is_dir(): continue
            data = exp/'data'
            if data.exists():
                for directory, dirs, files in os.walk(data):
                    dirs[:] = sorted(d for d in dirs if d not in ('node_modules','.git'))
                    if files:
                        add(f'{tag} cache {exp.name}/{Path(directory).relative_to(data)}',Path(directory)/'*')
            for sub in ('results','runtime','paper'):
                if (exp/sub).exists():
                    add(f'{tag} {exp.name} {sub}',exp/sub/'**/*')
    # Personal material: no individual file paths, times, examples or fields.
    for name, paths in [
        ('Personal sessions',HOME/'.openclaw/agents/*/sessions/**/*'),
        ('Personal voice and media',HOME/'.openclaw/media/**/*'),
        ('Personal memory',WS/'memory/**/*'),
        ('Personal chat-derived wiki',WS/'crypto-updates/wiki/**/*'),
        ('Personal backups',HOME/'backups/**/*'),
        ('Personal transcript scratch',WS/'.tmp-transcribe/**/*'),
        ('Personal speech scratch',WS/'.tmp-stt/**/*')]:
        add(name,paths,'private',True)
    return out


def field_type(v):
    if v is None: return 'null'
    if isinstance(v,bool): return 'boolean'
    if isinstance(v,int): return 'integer'
    if isinstance(v,float): return 'number'
    if isinstance(v,dict): return 'object'
    if isinstance(v,list): return 'array'
    return 'string'


def fields(v, prefix='', result=None):
    if result is None: result = {}
    if prefix: result.setdefault(prefix,set()).add(field_type(v))
    if isinstance(v,dict):
        for k,val in v.items():
            key = '{}' if re.fullmatch(r'-?\d+(?:\.\d+)?',str(k)) else str(k)
            fields(val, f'{prefix}.{key}' if prefix else key, result)
    elif isinstance(v,list):
        # All elements, including heterogeneous arrays, contribute types.
        for val in v: fields(val, prefix+'[]', result)
    return result


@contextlib.contextmanager
def opened(path):
    if path.suffix == '.zip':
        with zipfile.ZipFile(path) as z:
            members = [x for x in z.namelist() if not x.endswith('/')]
            if len(members) != 1: raise ValueError(f'Expected one archive member: {short(path)}')
            with z.open(members[0]) as raw, io.TextIOWrapper(raw,encoding='utf-8-sig') as f:
                yield f,members[0]
    else:
        opener = gzip.open if path.suffix == '.gz' else lzma.open if path.suffix == '.xz' else open
        with opener(path,'rt',encoding='utf-8-sig') as f:
            name = path.name.removesuffix('.gz').removesuffix('.xz')
            yield f,name


def rows(path):
    with opened(path) as (f,name):
        if name.endswith('.jsonl'):
            for line in f:
                if line.strip(): yield json.loads(line)
        elif name.endswith('.json'):
            obj=json.load(f)
            if isinstance(obj,list): yield from obj
            else: yield obj
        elif name.endswith('.csv'):
            first=f.readline(); f.seek(0)
            delimiter=';' if first.count(';') > first.count(',') else ','
            reader=csv.reader(f,delimiter=delimiter)
            header=next(reader,[])
            # Headerless public archives: don't discard the first trade.
            headerless=bool(header and re.fullmatch(r'\d+(?:\.\d+)?',header[0]))
            if headerless:
                values=header; header=[f'column_{i+1}' for i in range(len(values))]
                yield dict(zip(header,values))
            # Preserve blank/duplicate ATAS headers by column position.
            seen=set(); normalized=[]
            for i,key in enumerate(header):
                key=key if key and key not in seen else f'column_{i+1}'
                seen.add(key); normalized.append(key)
            for values in reader:
                if not values: continue
                if len(values)!=len(normalized): raise ValueError(f'CSV width mismatch in {short(path)}')
                yield dict(zip(normalized,values))
        else:
            raise ValueError('unsupported format')


def epoch_integer(value):
    """Accept integer epoch seconds or milliseconds, not strings/bools/microseconds.

    Bounds: 2000-01-01 inclusive through 2100-01-01 exclusive, UTC.
    """
    return type(value) is int and (
        946684800 <= value < 4102444800 or
        946684800000 <= value < 4102444800000)


def time_values(value, prefix=''):
    if isinstance(value, dict):
        for key, item in value.items():
            key = '{}' if re.fullmatch(r'-?\d+(?:\.\d+)?', str(key)) else str(key)
            yield from time_values(item, f'{prefix}.{key}' if prefix else key)
    elif isinstance(value, list):
        for item in value:
            yield from time_values(item, prefix + '[]')
    elif TIME_FIELD.search(prefix):
        yield prefix, value


def inspect_file(path):
    schema={}; count=0; example=None; temporal={}; variants={}; invalid_times=set()
    for row in rows(path):
        count+=1
        if example is None: example=row
        # Full schema; time ranges use scalar top-level fields + raw data times.
        fields(row,result=schema)
        if isinstance(row,dict):
            if 'stream' in row:
                variants[str(row['stream'])]=variants.get(str(row['stream']),0)+1
        for key, value in time_values(row):
            if value is None:
                continue
            if not epoch_integer(value):
                invalid_times.add(key)
                continue
            if key not in temporal:
                temporal[key] = [value, value]
            else:
                temporal[key][0] = min(temporal[key][0], value)
                temporal[key][1] = max(temporal[key][1], value)
    temporal = {key: bounds for key, bounds in temporal.items() if key not in invalid_times}
    return {'row_count':count,'fields':{k:sorted(v) for k,v in sorted(schema.items())},
            'time_fields':sorted(temporal),
            'time_ranges':{key + ':integer': bounds for key, bounds in temporal.items()},'example':example,'stream_row_counts':variants}


def inventory(name, pattern, cadence, private, now, settle, metadata_only=False):
    paths=sorted({Path(p) for p in glob.iglob(os.path.expanduser(pattern),recursive=True)
                  if Path(p).is_file() and not Path(p).is_symlink()})
    paths=[p for p in paths if not p.name.endswith(('.tmp','.pyc')) and '.git' not in p.parts and 'node_modules' not in p.parts]
    stats=[(p,p.stat()) for p in paths]
    out={'dataset':name,'file_count':len(stats),'total_bytes':sum(s.st_size for p,s in stats)}
    if private: return out
    out.update(pattern=short(pattern),cadence=cadence)
    days={(dt.datetime.fromtimestamp(now,UTC).date()-dt.timedelta(days=i)).isoformat():0 for i in range(6,-1,-1)}
    times=[]; complete=[]
    for p,s in stats:
        t, duration=partition(p)
        stamp=t if t is not None else s.st_mtime
        times.append(stamp); day=dt.datetime.fromtimestamp(stamp,UTC).date().isoformat()
        if day in days: days[day]+=s.st_size
        eligible=s.st_mtime <= now-settle and (t is None or t+duration+settle <= now)
        if eligible and cadence!='mutable': complete.append((stamp,p,s))
    out.update(first_file_time=iso(min(times)) if times else None,last_file_time=iso(max(times)) if times else None,
               first_mtime=iso(min(s.st_mtime for p,s in stats)) if stats else None,
               last_mtime=iso(max(s.st_mtime for p,s in stats)) if stats else None,
               bytes_per_day=days,bytes_per_day_basis='UTC filename partition, else mtime; current day partial')
    if metadata_only: return out
    selected=max(complete,key=lambda x:(x[0],str(x[1]))) if complete else None
    if selected is None:
        out['newest_complete_file']=None
        out['sample_status']='no complete file (mutable files are not complete)' if stats else 'no files'
        # Mutable snapshots may still be inspected, explicitly separate.
        if stats and cadence=='mutable':
            p,s=max(stats,key=lambda x:x[1].st_mtime); selected=(s.st_mtime,p,s)
            out['sample_status']='mutable snapshot, not complete'
    if selected:
        _,p,before=selected
        out['sample_file']=short(p)
        if cadence!='mutable': out['newest_complete_file']=short(p)
        supported=any(p.name.endswith(x) for x in ('.json','.jsonl','.jsonl.gz','.jsonl.xz','.csv','.csv.gz','.csv.xz','.zip'))
        if supported:
            out.update(inspect_file(p))
            after=p.stat()
            out['stable_during_read']=(before.st_size,before.st_mtime_ns)==(after.st_size,after.st_mtime_ns)
            if not out['stable_during_read']: out['sample_status']='changed during read; not a consistent sample'
        else: out['sample_status']='unsupported format; metadata only'
    return out


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--pattern',nargs=2,action='append',metavar=('NAME','GLOB'))
    ap.add_argument('--metadata-only',action='store_true')
    ap.add_argument('--settle-seconds',type=int,default=900)
    args=ap.parse_args(); now=time.time()
    selected=[(n,p,'static',False) for n,p in args.pattern] if args.pattern else datasets()
    for n,p,c,private in selected:
        try:
            result=inventory(n,p,c,private,now,args.settle_seconds,args.metadata_only)
        except (OSError,ValueError,EOFError,zipfile.BadZipFile,lzma.LZMAError) as exc:
            print(json.dumps({'dataset':n,'error':short(str(exc))}),flush=True)
            return 1  # caller's failure policy: never skip a failed read silently
        print(json.dumps(result,separators=(',',':')),flush=True)
    return 0

if __name__=='__main__':
    sys.exit(main())
