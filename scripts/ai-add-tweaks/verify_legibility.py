# Legibility gate for a delivered GIF (pure-screen). usage: verify_legibility.py GIF OUT_DIR LABEL
# Decodes every frame at delivered size; per key text, OCRs candidate beat frames (tesseract psm 11 on a 3x
# upscale, for recognition only) and measures ink height of the word box ON THE DELIVERED-SIZE FRAME:
#   cap_height: ink rows of the word's first capital glyph; x_height: ink rows of an x-height-only slice (e.g. 'aa' in SaaS).
import sys, os, json, subprocess, glob, re
from PIL import Image, ImageDraw
gif,out,label=sys.argv[1:4]; fr=out+"/ocr-frames"; os.makedirs(fr,exist_ok=True)
subprocess.run(["ffmpeg","-loglevel","error","-y","-i",gif,"-vsync","0",fr+"/f%03d.png"],check=True)
frames=sorted(glob.glob(fr+"/f*.png")); N=len(frames); W,H=Image.open(frames[0]).size
import difflib
from PIL import ImageOps
def sim(a,b):
    a=a.strip(".,'’\"").lower(); b=b.lower()
    return 1.0 if b in a else difflib.SequenceMatcher(None,a,b).ratio()
def ocr(i):
    im=Image.open(frames[i]).convert("L"); p=fr+"/_big.png"; big=im.resize((W*3,H*3),Image.LANCZOS); ws=[]
    tsv=""
    for v in (big,ImageOps.invert(big)):   # normal + inverted pass (light-on-dark chips / buttons)
        v.save(p)
        for psm in ("11","6"):   # sparse + block layouts (psm 6 reads pill/segmented controls psm 11 misses)
            tsv+="\n".join(subprocess.run(["tesseract",p,"-","--psm",psm,"tsv"],capture_output=True,text=True).stdout.splitlines()[1:])+"\n"
    for l in tsv.splitlines():
        c=l.split("\t")
        if len(c)==12 and c[11].strip() and float(c[10])>=0: ws.append(dict(text=c[11],conf=float(c[10]),x=int(c[6])/3,y=int(c[7])/3,w=int(c[8])/3,h=int(c[9])/3))
    return im,ws
def ink(im,x,y,w,h,pad=0.2):
    y,h=y-h*pad,h*(1+2*pad)   # pad so a glyph clipped by a tight OCR box still has background above/below
    # background = median of the crop's border pixels; ink = pixels far from background (polarity-free).
    c=im.crop((max(0,int(x)),max(0,int(y)-2),min(W,int(x+w)+1),min(H,int(y+h)+2))); cw,ch=c.size
    if cw<2 or ch<3: return 0
    g=lambda q,r:c.getpixel((q,r))
    e=im.crop((max(0,int(x-w)),max(0,int(y)),min(W,int(x+2*w)+1),min(H,int(y+h)+1)))   # widened context
    from collections import Counter
    bg=Counter(v//16 for v in e.get_flattened_data()).most_common(1)[0][0]*16+8   # modal tone = page or button fill
    md=max(abs(g(q,r)-bg) for q in range(cw) for r in range(ch)); thr=max(40,0.5*md)
    rows=[r for r in range(ch) if sum(abs(g(q,r)-bg)>thr for q in range(cw))>=1]
    # longest contiguous run of ink rows = the glyph (ignores neighbouring lines / button edges clipped into the box)
    runs=[]; 
    for r in rows:
        if runs and r==runs[-1][1]+1: runs[-1][1]=r
        else: runs.append([r,r])
    inner=[b-a+1 for a,b in runs if a>0 and b<ch-1]   # runs touching the crop edge are neighbours/button edges
    return max(inner or [b-a+1 for a,b in runs] or [0])
SPEC=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),"legibility_spec.json")))
res={"gif":gif,"label":label,"size":[W,H],"frames":N,"method":"tesseract 5 psm11+psm6, normal+inverted, on 3x upscale for recognition; ink-row height measured on delivered-size frame","checks":[]}
for k in SPEC["texts"]:
    best=None; bt=SPEC["beat_t_gif_s"][label][k["id"]]
    for t in [bt]+[x for x in k["t_window_s"] if x!=bt]:
        i=min(N-1,int(round(t*SPEC["gif_fps"]))); im,ws=ocr(i); j=" ".join(w["text"] for w in ws)
        found=[s for s in k["ocr_tokens"] if any(sim(w["text"],s)>=0.8 for w in ws)]; m=None
        ms=[]   # every OCR pass that matched the word gives a box; boxes can be clipped, so keep the largest glyph run
        for w in ws:
            mw=k["measure_word"]; tx=w["text"].strip(".,'’\"")
            capok=k["metric"]!="cap_height" or tx[:1]==mw[:1]   # cap height must be read off the word's own capital
            if capok and (sim(w["text"],mw)>=0.8 or (k["metric"]=="cap_height" and tx==mw[:1])):   # "B" split from "ags" by an overlay
                t_=w["text"].lower(); ix=t_.find(k["measure_word"].lower())
                if ix>0 and k["metric"]=="x_height":   # measure word embedded in a merged token (e.g. "Let'sroast")
                    f0=ix/len(t_); w=dict(w,x=w["x"]+w["w"]*f0,w=w["w"]*len(k["measure_word"])/len(t_))
                if k["metric"]=="cap_height": ms.append(ink(im,w["x"],w["y"],max(2,w["w"]/len(k["measure_word"])*0.85),w["h"]))
                else: a_,b_=k["xh_slice"]; ms.append(ink(im,w["x"]+w["w"]*a_,w["y"],w["w"]*(b_-a_),w["h"]))
        m=max(ms) if ms else None
        cand={"t_gif_s":t,"frame":i+1,"ocr_found":found,"ocr_ratio":round(len(found)/len(k["ocr_tokens"]),2),"measured_px":m}
        if best is None: best=dict(cand,ocr_full_match_frames=[])
        if cand["ocr_ratio"]==1.0: best["ocr_full_match_frames"].append(cand["frame"])
    pp=(best["measured_px"] or 0)>=k["threshold_px"]; po=best["ocr_ratio"]>=k["ocr_min"]; best["beat_frame_measured"]=True
    res["checks"].append({"id":k["id"],"text":k["text"],"metric":k["metric"],"threshold_px":k["threshold_px"],**best,"pass_px":pp,"pass_ocr":po,"pass":pp and po})
res["pass"]=all(c["pass"] for c in res["checks"])
ims=[Image.open(frames[c["frame"]-1]).convert("RGB") for c in res["checks"]]
S=Image.new("RGB",(W,(H+18)*len(ims)),(20,20,20)); d=ImageDraw.Draw(S)
for j,(c,im) in enumerate(zip(res["checks"],ims)):
    S.paste(im,(0,j*(H+18)+18)); d.text((4,j*(H+18)+3),f"{c['id']} t={c['t_gif_s']}s f{c['frame']} {c['metric']}={c['measured_px']}px (>={c['threshold_px']}) ocr={c['ocr_ratio']} {'PASS' if c['pass'] else 'FAIL'}",fill=(255,230,0) if c['pass'] else (255,90,90))
S.save(out+"/legibility-strip.png"); os.remove(fr+"/_big.png")
json.dump(res,open(out+"/legibility.json","w"),indent=1)
print(json.dumps({c["id"]:[c["measured_px"],c["ocr_ratio"],c["frame"]] for c in res["checks"]}),"PASS" if res["pass"] else "FAIL")
