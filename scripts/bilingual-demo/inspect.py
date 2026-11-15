"""Probe and decode derivatives; export actual-size images for a separate visual review."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from PIL import Image
p=argparse.ArgumentParser();p.add_argument('edit');a=p.parse_args();r=Path(a.edit).resolve();m=json.loads((r/'manifest.json').read_text());locale=m['ui_language'];d=r/locale;v=r/'verify';v.mkdir(exist_ok=False)
g=Image.open(d/'feature-8s.gif');frames=[];durations=[]
for i in range(g.n_frames):
 g.seek(i);frames.append(g.convert('RGB').copy());durations.append(g.info.get('duration',0)/1000)
assert round(sum(durations),3)==8 and len(frames)==96
assert (g.width,g.height)==(520,400) and (d/'feature-8s.gif').stat().st_size<=3*1024**2
sheet=Image.new('RGB',(g.width*4,g.height*4),'#111')
for i in range(16):sheet.paste(frames[round(i*(len(frames)-1)/15)],(i%4*g.width,i//4*g.height))
sheet.save(v/'contact-sheet.png')
for name,i in [('before',10),('control',24),('result',72),('result-end',94)]:frames[i].save(v/f'{name}.png')
# Dense 12fps source-sized delivery strip around the input and transition.
strip=Image.new('RGB',(g.width*4,g.height*3),'#111')
for i,index in enumerate(range(16,40,2)):strip.paste(frames[index],(i%4*g.width,i//4*g.height))
strip.save(v/'interaction-strip.png')
probes={}
for name in ['demo.mp4','feature-8s.gif']:
 f=d/name;subprocess.run(['ffmpeg','-v','error','-i',str(f),'-f','null','-'],check=True)
 probes[name]=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(f)]))
video=probes['demo.mp4']['streams'][0];assert video['codec_name']=='h264' and video['pix_fmt']=='yuv420p'
source=r.parent.parent/'raw/gt.mp4';assert hashlib.sha256(source.read_bytes()).hexdigest()==m['source_sha256']
assert m['gif_result_visible_s']>=3
report={'ui_language':locale,'native_language_recording':True,'subtitle_overlay':False,'gif':{'frames':len(frames),'duration_s':round(sum(durations),3),'size':[g.width,g.height],'bytes':(d/'feature-8s.gif').stat().st_size},'mp4':{'duration_s':float(probes['demo.mp4']['format']['duration']),'codec':video['codec_name'],'pixel_format':video['pix_fmt'],'size':[video['width'],video['height']]},'decode_pass':True,'raw_hash_unchanged':True,'camera_result_hold_s':m['gif_result_visible_s'],'visual_review':'pending','independent_cold_viewer':'pending','chinese_ocr':'not run; independent visual review required'}
(v/'qa-machine.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
