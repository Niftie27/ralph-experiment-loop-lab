import os, shutil, subprocess
RP=os.environ['REPO']; MUT=os.environ['MUT_DIR']; NODE=os.environ['NODE']; CL=os.environ['M9_CLOSURE_ROOT']; HERE=os.path.dirname(os.path.abspath(__file__))
src=RP+'/experiments/m9-gate/m9-scan.mjs'; s=open(src).read()
R='/[,"#@:;+\\u0000-\\u001f\\u007f-\\u009f\\s]/u'
assert s.count(R)==1
M={'S1_no_hash':(R.replace('#',''),'#'),'S1_no_at':(R.replace('@',''),'@'),'S1_no_semicolon':(R.replace(';',''),';'),
   'S1_no_quote':(R.replace('"',''),'"'),'S1_no_C1':(R.replace('\\u007f-\\u009f','\\u007f'),'\u0085 \u009f')}
for mid,(new,chars) in M.items():
  d=f'{MUT}/{mid}/experiments/m9-gate'; shutil.rmtree(f'{MUT}/{mid}',ignore_errors=True); shutil.copytree(RP+'/experiments/m9-gate', d)
  open(d+'/m9-scan.mjs','w').write(s.replace(R,new))
  out=subprocess.run([NODE,HERE+'/s1mut.mjs'],env=dict(os.environ,REPO=f'{MUT}/{mid}',M9_CLOSURE_ROOT=CL,CHARS=chars),capture_output=True,text=True).stdout
  print(mid,'|',' / '.join(l for l in out.splitlines() if not l.startswith('result')))
