"""Timestamp-preserving real capture -> immutable raw -> localized camera edits."""
import argparse,hashlib,json,math,subprocess
from pathlib import Path
from PIL import Image,ImageDraw
p=argparse.ArgumentParser();p.add_argument('take');p.add_argument('--edit',default='v1');a=p.parse_args()
r=Path(a.take).resolve();out=r/'edits'/a.edit;out.mkdir(parents=True,exist_ok=False)
source_receipt=json.loads((r/'evidence/source.json').read_text());locale=source_receipt['ui_locale'];
e=json.loads((r/'evidence/markers.json').read_text());clicks=json.loads((r/'evidence/native-clicks.json').read_text());frames=json.loads((r/'frames.json').read_text())
frames=sorted(frames,key=lambda f:f['elapsed_ms']);frames=list({f['elapsed_ms']:f for f in frames}.values());origin=frames[0]['elapsed_ms']/1000
end=next(x['elapsed_ms']/1000 for x in e if x['label']=='end')-origin
click=clicks[0]['elapsed_ms']/1000-origin;result=next(x['elapsed_ms']/1000 for x in e if x['label'].startswith('result:'))-origin
raw=r/'raw';raw.mkdir(exist_ok=True);source=raw/'gt.mp4'
if not source.exists():
 lines=[]
 for i,f in enumerate(frames):
  duration=((frames[i+1]['elapsed_ms']-f['elapsed_ms'])/1000 if i+1<len(frames) else end+origin-f['elapsed_ms']/1000)
  if duration<=0:raise ValueError('Nonpositive frame duration')
  lines.extend([f"file '{(r/f['file']).as_posix()}'",f'duration {duration:.9f}'])
 lines.append(f"file '{(r/frames[-1]['file']).as_posix()}'")
 concat=out/'capture.ffconcat';concat.write_text('\n'.join(lines)+'\n')
 subprocess.run(['ffmpeg','-v','error','-n','-f','concat','-safe','0','-i',str(concat),'-t',str(end),'-vf','fps=30,scale=out_range=tv,format=yuv420p','-color_range','tv','-c:v','libx264','-crf','16','-preset','medium','-movflags','+faststart',str(source)],check=True)
sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest();original_hash=sha(source)
# Keys are CSS pixels measured from the real source. Distinct aspect ratios per delivery.
G0=click-2.0
bridge=max(result+.25,click+.85);proof=bridge+.6
discovery=json.loads((r/'evidence/discovery.json').read_text());control_y=discovery['boxes']['control']['y'];control_top=max(0,control_y-65)
assert G0>=0 and G0+8<end and G0+8-result>=3
MP=[(0,0,0,1440,900),(.7,0,0,1440,900),(1.5,615,205,310,193.75),(click-2.2,615,205,310,193.75),(click-1.4,600,135,840,525),(click-.6,1120,control_top,320,200),(click+.65,1120,control_top,320,200),(bridge,590,150,850,531.25),(proof,615,205,310,193.75),(end-1.4,615,205,310,193.75),(end-.3,0,0,1440,900)]
GK=[(G0,600,135,840,646.1538),(G0+.45,615,205,280,215.3846),(G0+1,615,205,280,215.3846),(click-.5,1120,control_top,320,246.1538),(click+.75,1120,control_top,320,246.1538),(bridge,600,135,840,646.1538),(proof,615,205,280,215.3846),(G0+8,615,205,280,215.3846)]
# Camera key order matters, reject an invalid choreography.
assert all(x[0]<=y[0] for keys in [MP,GK] for x,y in zip(keys,keys[1:]))
def cam(t,keys):
 for aa,bb in zip(keys,keys[1:]):
  if t<=bb[0]:
   f=max(0,min(1,(t-aa[0])/(bb[0]-aa[0])));f=(1-math.cos(math.pi*f))/2
   return [aa[j]+(bb[j]-aa[j])*f for j in range(1,5)]
 return keys[-1][1:]
records=[]
for kind,keys,begin,finish,dims in [('mp4',MP,0,end,(1280,800)),('gif',GK,G0,G0+8,(520,400))]:
 folder=out/locale;folder.mkdir(exist_ok=True)
 target=folder/('demo.mp4' if kind=='mp4' else 'gif-camera.mp4')
 dec=subprocess.Popen(['ffmpeg','-v','error','-i',str(source),'-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
 enc=subprocess.Popen(['ffmpeg','-v','error','-n','-f','rawvideo','-pix_fmt','rgb24','-s',f'{dims[0]}x{dims[1]}','-r','30','-i','-','-an','-c:v','libx264','-crf','18','-preset','medium','-vf','scale=out_range=tv,format=yuv420p','-color_range','tv','-movflags','+faststart',str(target)],stdin=subprocess.PIPE)
 i=0;count=0
 while True:
  data=dec.stdout.read(1440*900*3)
  if not data:break
  assert len(data)==1440*900*3
  t=i/30;i+=1
  if not (begin<=t<finish):continue
  x,y,w,h=cam(t,keys);assert min(x,y)>=0 and x+w<=1440.1 and y+h<=900.1
  im=Image.frombytes('RGB',(1440,900),data).transform(dims,Image.Transform.EXTENT,(x,y,x+w,y+h),Image.Resampling.BICUBIC)
  dt=t-click
  if 0<=dt<=.6:
   layer=Image.new('RGBA',dims);d=ImageDraw.Draw(layer);cx=(clicks[0]['x']-x)*dims[0]/w;cy=(clicks[0]['y']-y)*dims[1]/h;rad=12+dt*20
   d.ellipse((cx-rad,cy-rad,cx+rad,cy+rad),outline=(130,195,255,int(230*(1-dt/.6))),width=3);im=Image.alpha_composite(im.convert('RGBA'),layer).convert('RGB')
  enc.stdin.write(im.tobytes())
  if kind=='gif' and count in [0,15,30,45,60,75,90,120,150,180,210,239]:im.save(folder/f'sample-{count:03}.png')
  count+=1
 dec.stdout.close();assert dec.wait()==0
 enc.stdin.close();assert enc.wait()==0
 if kind=='gif':subprocess.run(['ffmpeg','-v','error','-n','-i',str(target),'-filter_complex','fps=12,split[a][b];[a]palettegen=max_colors=256:stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle','-loop','0',str(folder/'feature-8s.gif')],check=True)
 records.append({'kind':kind,'source_interval_s':[begin,finish],'frames':count,'keyframes':keys,'native_area':dims})
assert sha(source)==original_hash
manifest={'source':'raw/gt.mp4','source_sha256':original_hash,'capture_frames':len(frames),'capture_source_size':[1440,900],'capture_origin_ms':origin*1000,'capture_timestamp_order':'sorted by browser timestamp; no nominal-fps speedup','raw_duration_s':end,'click_s':click,'click_xy':[clicks[0]['x'],clicks[0]['y']],'result_s':result,'gif_start_s':G0,'gif_result_visible_s':G0+8-proof,'new_recording':True,'ui_language':locale,'localizations':'independent fresh take in native product language; no subtitles','model_calls':0,'source_environment':'local-repository-demo','production_verified':False,'records':records,'subtitles':False,'artifacts':{str(f.relative_to(out)):sha(f) for f in out.rglob('*') if f.suffix in ['.mp4','.gif']}}
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'out':str(out),'click_s':click,'gif_start':G0,'result_hold':manifest['gif_result_visible_s']}))
