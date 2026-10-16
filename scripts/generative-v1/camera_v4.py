# generative-v1 take4 camera: DPR-2 GT frames (3840x2160) -> 1920x1080 master with a legibility-driven shot list.
# Centres are CSS px (1920x1080 viewport); zoom 1.0 = full viewport. Cosine ease between keys (raw time).
# Result text (hero or CTA) legible 3.9-7.0 s GIF time (>=3 s readable-result rule).
# Shots sized so key text meets the legibility gate at the 520px GIF (scale = zoom*520/1920):
#   hero close 5.8x -> hero cap ~19css*1.57 = 30px (block incl. CTA in frame); CTA close 8.0x; control close 7.0x -> 'Playful' x-height ~5css*1.9 = 9.5px.
import json, math, subprocess, sys, glob
from PIL import Image
SW,SH,DPR,W,H,FPS=3840,2160,2,1920,1080,30
G0=1.467  # GIF window start (click at 4.467 raw = 3.0 s GIF)
HERO=(748,314); CTRL=(1722,286); MID=(1270,420); CTA=(702,322)
# (t_raw, dur, zoom, cx, cy, shot_id, label)
KEYS=[(0,0,1.0,960,540,"S1","full: Home + Tweaks panel (Mood=SaaS)"),
(G0+0.5,0.6,5.8,*HERO,"S2","push to hero close: 'Coffee that tastes like the trail.' + CTA 'Start a subscription'"),
(G0+1.9,0.3,1.25,*MID,"T23","pull out through panel"),
(G0+2.2,0.3,7.0,*CTRL,"S3","close on Tweaks > Prepared for this design > Mood (SaaS -> Playful click at 3.0s)"),
(G0+3.35,0.25,1.25,*MID,"T34","pull out back to artboard"),
(G0+3.6,0.3,5.8,*HERO,"S4","hero close: 'Bags without the boredom' + CTA 'Let's roast'"),
(G0+5.4,0.4,8.0,*CTA,"S4b","push to CTA: '...boredom' / 'Let's roast'"),
(G0+7.0,0.5,1.0,960,540,"S5","pull back: global payoff hold")]
def cam(t):
    z,cx,cy=KEYS[0][2:5]
    for (t0,d,z1,x1,y1,*_) in KEYS[1:]:
        if t<t0: break
        e=min(1,(t-t0)/d); e=0.5-0.5*math.cos(math.pi*e)
        # interpolate zoom in log space so the visual scale change is even
        z=math.exp(math.log(z)+(math.log(z1)-math.log(z))*e); cx,cy=cx+(x1-cx)*e,cy+(y1-cy)*e
    return z,cx,cy
if __name__=="__main__":
    src,dst=sys.argv[1],sys.argv[2]
    frames=sorted(glob.glob(src+"/*.jpg"))
    ff=subprocess.Popen(["ffmpeg","-loglevel","error","-y","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-","-c:v","libx264","-crf","14","-preset","slow","-pix_fmt","yuv420p","-movflags","+faststart",dst],stdin=subprocess.PIPE)
    log=[]
    for i,f in enumerate(frames):
        t=i/FPS; z,cx,cy=cam(t); cw,ch=W/z,H/z
        x0=min(max(cx-cw/2,0),W-cw); y0=min(max(cy-ch/2,0),H-ch)
        im=Image.open(f).convert("RGB").resize((W,H),Image.LANCZOS,box=(x0*DPR,y0*DPR,(x0+cw)*DPR,(y0+ch)*DPR))
        ff.stdin.write(im.tobytes())
        if i%15==0: log.append({"t":round(t,3),"zoom":round(z,3),"crop_css":[round(x0),round(y0),round(cw),round(ch)]})
    ff.stdin.close(); ff.wait()
    json.dump({"easing":"cosine ease-in-out, log-zoom","source_px":[SW,SH],"dpr":DPR,"gif_start_s":G0,"keyframes":[{"t":k[0],"dur":k[1],"shot":k[5],"to":{"zoom":k[2],"center_css_px":[k[3],k[4]]},"label":k[6]} for k in KEYS],"sampled":log},open(dst.rsplit("/",1)[0]+"/zoom.json","w"),indent=1)
