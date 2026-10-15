# generative-v1 post camera (adapted from scripts/v7/camera.py): cosine ease-in-out between keyframes. GT untouched.
import json, math, subprocess, sys, glob
from PIL import Image
W,H,FPS=1920,1080,30
KEYS=[(0,0,1,960,540,"global: Home (Mood=SaaS) + Tweaks 'Prepared for this design'"),
(1.5,0.6,1.45,1258,372,"push 1.45x: Mood control + full Home hero in one frame (1.6x would crop the headline)"),
(3.4,0.6,1.7,861,320,"pan 1.7x: Home hero rewritten 'Bags without the boredom' / 'Let\'s roast'"),
(5.0,0.6,1,960,540,"pull back: global payoff hold")]
def cam(t):
    z,cx,cy=KEYS[0][2:5]
    for (t0,d,z1,x1,y1,_) in KEYS[1:]:
        if t<t0: break
        e=min(1,(t-t0)/d); e=0.5-0.5*math.cos(math.pi*e)
        z,cx,cy=z+(z1-z)*e,cx+(x1-cx)*e,cy+(y1-cy)*e
    return z,cx,cy
src,dst=sys.argv[1],sys.argv[2]
frames=sorted(glob.glob(src+"/*.jpg"))
ff=subprocess.Popen(["ffmpeg","-loglevel","error","-y","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-","-c:v","libx264","-crf","14","-preset","slow","-pix_fmt","yuv420p","-movflags","+faststart",dst],stdin=subprocess.PIPE)
log=[]
for i,f in enumerate(frames):
    t=i/FPS; z,cx,cy=cam(t); cw,ch=W/z,H/z
    x0=min(max(cx-cw/2,0),W-cw); y0=min(max(cy-ch/2,0),H-ch)
    im=Image.open(f).convert("RGB")
    if z>1.001: im=im.resize((W,H),Image.LANCZOS,box=(x0,y0,x0+cw,y0+ch))
    ff.stdin.write(im.tobytes())
    if i%15==0: log.append({"t":round(t,3),"zoom":round(z,3),"crop":[round(x0),round(y0),round(cw),round(ch)]})
ff.stdin.close(); ff.wait()
json.dump({"easing":"cosine ease-in-out","source_px":[W,H],"keyframes":[{"t":k[0],"dur":k[1],"to":{"zoom":k[2],"center_css_px":[k[3],k[4]]},"label":k[5]} for k in KEYS],"sampled":log},open(dst.rsplit("/",1)[0]+"/zoom.json","w"),indent=1)

