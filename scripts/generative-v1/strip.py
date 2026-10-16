# fixed-time frame strip with timestamps: strip.py video out.jpg t0 t1 step [cols] [width]
import sys, subprocess, io
from PIL import Image, ImageDraw
v,out,t0,t1,st=sys.argv[1],sys.argv[2],*map(float,sys.argv[3:6]); cols=int(sys.argv[6]) if len(sys.argv)>6 else 4; w=int(sys.argv[7]) if len(sys.argv)>7 else 480
ts=[]; t=t0
while t<=t1+1e-6: ts.append(round(t,3)); t+=st
ims=[]
for t in ts:
    b=subprocess.run(["ffmpeg","-loglevel","error","-ss",str(t),"-i",v,"-frames:v","1","-vf",f"scale={w}:-1","-f","image2pipe","-vcodec","png","-"],capture_output=True).stdout
    im=Image.open(io.BytesIO(b)).convert("RGB"); d=ImageDraw.Draw(im); d.rectangle((0,0,70,20),fill=(0,0,0)); d.text((4,4),f"{t:.2f}s",fill=(255,230,0)); ims.append(im)
h=ims[0].height; rows=(len(ims)+cols-1)//cols; S=Image.new("RGB",(cols*w,rows*h),(40,40,40))
for i,im in enumerate(ims): S.paste(im,((i%cols)*w,(i//cols)*h))
S.save(out,quality=88); print(out,len(ims))
