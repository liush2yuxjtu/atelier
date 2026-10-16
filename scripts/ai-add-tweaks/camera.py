# ai-add-tweaks camera: cosine ease + log-zoom. Centres filled from boxes after take.
# KEYS patched by encode.sh from evidence/boxes-after.json when available.
import json, math, subprocess, sys, glob, os
from PIL import Image
SW,SH,DPR,W,H,FPS=3840,2160,2,1920,1080,30
# Default keyframes (raw deliverable timeline AFTER wait cut — frames are already cut)
# Override via zoom_keys.json next to frames
def load_keys(path):
    p=os.path.join(path,"zoom_keys.json")
    if os.path.isfile(p):
        d=json.load(open(p))
        return [(k["t"],k["dur"],k["to"]["zoom"],k["to"]["center_css_px"][0],k["to"]["center_css_px"][1],k.get("shot","S"),k.get("label","")) for k in d["keyframes"]]
    return [(0,0,1.0,960,540,"S1","global: Home + Tweaks AI form"),
            (1.0,0.55,2.4,1600,280,"S2","push: Add more tweaks input"),
            (3.2,0.4,2.0,1600,360,"S3","hold: after Add / new knobs"),
            (4.2,0.45,2.6,1600,420,"S4","close: Price layout control"),
            (5.6,0.5,1.8,900,520,"S5","pan: pricing artboard result"),
            (8.0,0.5,1.0,960,540,"S6","pull back payoff")]
KEYS=None
def cam(t, keys):
    z,cx,cy=keys[0][2:5]
    for (t0,d,z1,x1,y1,*_) in keys[1:]:
        if t<t0: break
        e=min(1,(t-t0)/max(d,1e-6)); e=0.5-0.5*math.cos(math.pi*e)
        z=math.exp(math.log(max(z,1e-3))+(math.log(max(z1,1e-3))-math.log(max(z,1e-3)))*e)
        cx,cy=cx+(x1-cx)*e,cy+(y1-cy)*e
    return z,cx,cy
if __name__=="__main__":
    src,dst=sys.argv[1],sys.argv[2]
    keys=load_keys(os.path.dirname(dst) if False else src)
    # also allow keys beside dst dir
    alt=os.path.join(os.path.dirname(dst),"zoom_keys.json")
    if os.path.isfile(alt):
        d=json.load(open(alt)); keys=[(k["t"],k["dur"],k["to"]["zoom"],k["to"]["center_css_px"][0],k["to"]["center_css_px"][1],k.get("shot","S"),k.get("label","")) for k in d["keyframes"]]
    frames=sorted(glob.glob(src+"/*.jpg"))
    ff=subprocess.Popen(["ffmpeg","-loglevel","error","-y","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-","-c:v","libx264","-crf","14","-preset","fast","-pix_fmt","yuv420p","-movflags","+faststart",dst],stdin=subprocess.PIPE)
    log=[]
    for i,f in enumerate(frames):
        t=i/FPS; z,cx,cy=cam(t,keys); cw,ch=W/z,H/z
        x0=min(max(cx-cw/2,0),W-cw); y0=min(max(cy-ch/2,0),H-ch)
        im=Image.open(f).convert("RGB")
        # DPR2 source
        if im.size[0]>=SW-10:
            im=im.resize((W,H),Image.LANCZOS,box=(x0*DPR,y0*DPR,(x0+cw)*DPR,(y0+ch)*DPR))
        else:
            im=im.resize((W,H),Image.LANCZOS,box=(x0,y0,x0+cw,y0+ch)) if z>1.001 else im.resize((W,H),Image.LANCZOS)
        ff.stdin.write(im.tobytes())
        if i%15==0: log.append({"t":round(t,3),"zoom":round(z,3),"crop_css":[round(x0),round(y0),round(cw),round(ch)]})
    ff.stdin.close(); ff.wait()
    json.dump({"easing":"cosine ease-in-out, log-zoom","source_px":[SW,SH],"dpr":DPR,"keyframes":[{"t":k[0],"dur":k[1],"shot":k[5],"to":{"zoom":k[2],"center_css_px":[k[3],k[4]]},"label":k[6]} for k in keys],"sampled":log},open(os.path.join(os.path.dirname(dst),"zoom.json"),"w"),indent=1)
