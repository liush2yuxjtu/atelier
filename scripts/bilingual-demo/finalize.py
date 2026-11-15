"""Create a new edit with a smaller palette, keeping the camera and capture unchanged."""
import argparse,hashlib,json,shutil,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('edit');p.add_argument('output');p.add_argument('--colors',type=int,default=128,choices=[64,96,128,256]);a=p.parse_args();src=Path(a.edit).resolve();out=Path(a.output).resolve();m=json.loads((src/'manifest.json').read_text());locale=m['ui_language']
assert not out.exists();out.mkdir(parents=True)
shutil.copytree(src/locale,out/locale,ignore=shutil.ignore_patterns('feature-8s.gif'))
f=out/locale/'feature-8s.gif'
command=['ffmpeg','-v','error','-n','-i',str(out/locale/'gif-camera.mp4'),'-filter_complex',f'fps=12,split[a][b];[a]palettegen=max_colors={a.colors}:stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle','-loop','0',str(f)]
subprocess.run(command,check=True)
m['gif_palette_colors']=a.colors;m['parent_edit']=src.name;m['parent_manifest_sha256']=hashlib.sha256((src/'manifest.json').read_bytes()).hexdigest()
m['artifacts']={str(f.relative_to(out)):hashlib.sha256(f.read_bytes()).hexdigest() for f in out.rglob('*') if f.suffix in ['.mp4','.gif']}
(out/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
print(f, f.stat().st_size)
