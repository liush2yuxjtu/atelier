import json, math, subprocess, sys, glob
from PIL import Image
W,H,FPS=1920,1080,30
KEYS=[(0,1,960,540,"global"),(2.3,2.3,838,1000,"push: Speed knob"),(3.9,1,960,540,"pull out: 3 boards speed up"),
(6.5,2.2,600,1000,"push: Aurora chip"),(7.4,1,960,540,"pull out: 3 boards go Aurora"),
(9.4,2.3,1178,1000,"push: Stage layout"),(10.1,1,960,540,"pull out: layout on 3 boards"),
(12.3,1.6,1592,687,"push: About board"),(13.5,2.2,600,1000,"pan: Unlink About + Ember"),
(15.7,1,960,540,"pull out: About differs"),(17.6,2.6,1197,1030,"push: linked in 2 boards"),
(19.4,1.15,960,600,"ease out"),(20.4,2.4,1130,1030,"push: Approved"),(21.7,1,960,540,"pull out: final hold")]
DUR=0.6
def cam(t):
    z,cx,cy=KEYS[0][1:4]
    for (t0,z1,x1,y1,_) in KEYS[1:]:
        if t<t0: break
        e=min(1,(t-t0)/DUR); e=0.5-0.5*math.cos(math.pi*e)
        z,cx,cy=z+(z1-z)*e,cx+(x1-cx)*e,cy+(y1-cy)*e
    return z,cx,cy
if __name__=="__main__":
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
    json.dump({"easing":"cosine ease-in-out","transition_s":DUR,"source_px":[W,H],"keyframes":[{"t":k[0],"dur":DUR if i else 0,"to":{"zoom":k[1],"center_css_px":[k[2],k[3]]},"label":k[4]} for i,k in enumerate(KEYS)],"sampled":log},open(dst.rsplit("/",1)[0]+"/zoom.json","w"),indent=1)
