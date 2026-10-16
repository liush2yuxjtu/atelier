# OCR the delivered MP4 at the beat times (GIF beat + gif_start offset): usage verify_mp4_ocr.py MP4 LABEL GIF_START OUT.json
import sys, json, subprocess, os, difflib
from PIL import Image, ImageOps
mp4,label,g0,out=sys.argv[1],sys.argv[2],float(sys.argv[3]),sys.argv[4]
S=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),"legibility_spec.json")))
res={"mp4":mp4,"label":label,"gif_start_s":g0,"checks":[]}
for k in S["texts"]:
    t=g0+S["beat_t_gif_s"][label][k["id"]]
    subprocess.run(["ffmpeg","-loglevel","error","-y","-ss",str(t),"-i",mp4,"-frames:v","1","/tmp/_m.png"],check=True)
    im=Image.open("/tmp/_m.png").convert("L"); txt=""
    for v in (im,ImageOps.invert(im)):
        v.save("/tmp/_m2.png")
        for psm in ("11","6"): txt+=" "+subprocess.run(["tesseract","/tmp/_m2.png","-","--psm",psm],capture_output=True,text=True).stdout
    ws=txt.split()
    f=[s for s in k["ocr_tokens"] if any(s.lower() in w.lower() or difflib.SequenceMatcher(None,w.lower().strip(".,"),s.lower()).ratio()>=0.8 for w in ws)]
    res["checks"].append({"id":k["id"],"t_mp4_s":round(t,3),"ocr_found":f,"pass":len(f)==len(k["ocr_tokens"])})
res["pass"]=all(c["pass"] for c in res["checks"]); json.dump(res,open(out,"w"),indent=1)
print(label,[(c["id"],c["ocr_found"]) for c in res["checks"]],res["pass"])
