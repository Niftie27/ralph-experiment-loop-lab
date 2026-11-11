import os, shutil, subprocess, sys
R=os.environ['REPO']; MUT=os.environ['MUT_DIR']; NODE=os.environ['NODE']; CL=os.environ['M9_CLOSURE_ROOT']; HERE=os.path.dirname(os.path.abspath(__file__))
src=R+'/experiments/m9-gate/m9-scan.mjs'; s=open(src).read()
M={
 'Ma_flags_le_0800': ("if(flags!==0||method!==8", "if(flags>0x0800||method!==8", 'm_utf8flag,m_flag8'),
 'Mb_method': ("||method!==8||!buf", "||!buf", 'm_method0'),
 'Mc_local_flags': ("if(buf.readUInt16LE(local+6)!==flags||", "if(", 'm_lflag'),
 'Md_local_method': ("||buf.readUInt16LE(local+8)!==method||", "||", 'm_lmethod'),
 'Me_cd_diskstart': ("||buf.readUInt16LE(p+34)!==0||", "||", 'm_cddiskstart'),
 'Mf_data_end': ("||start+packed>at) reject('member')", ") reject('member')", 'm_dataend'),
 'Mg_two_entries': ("if(records.length!==1) reject('member');", "", 'm_two'),
 'Mh_safe_int': ("if(!Number.isSafeInteger(h)) reject('interval');", "", 'g_hbig'),
}
for mid,(old,new,cases) in M.items():
  assert s.count(old)==1, mid
  d=f'{MUT}/{mid}/experiments/m9-gate'; shutil.rmtree(f'{MUT}/{mid}',ignore_errors=True)
  shutil.copytree(R+'/experiments/m9-gate', d)
  open(d+'/m9-scan.mjs','w').write(s.replace(old,new))
  env=dict(os.environ, REPO=f'{MUT}/{mid}', M9_CLOSURE_ROOT=CL, ONLY=cases, FIX='key-001,key-016')
  out=subprocess.run([NODE,HERE+'/mut.mjs'],env=env,capture_output=True,text=True).stdout
  print(mid, '|', ' / '.join(l for l in out.splitlines() if not l.startswith('result')))
