# Build shotlist.json + final legibility.json (merging OCR/px results, centering, readable-result timing, cold-viewer test).
import json, sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import camera_v4 as C
R=sys.argv[1]; V=R+"/verify"
G0=C.G0; SC=520/1920
def crop(tg):
    z,cx,cy=C.cam(G0+tg); cw,ch=1920/z,1080/z
    x0=min(max(cx-cw/2,0),1920-cw); y0=min(max(cy-ch/2,0),1080-ch); return z,[round(x0,1),round(y0,1),round(cw,1),round(ch,1)]
# ROIs in CSS px (DOM boxes from evidence/discovery.json + OCR of raw/gt.mp4)
ROI={"S1":[0,0,1920,1080],"S2":[634,240,228,150],"S3":[1633,258,180,58],"S4":[634,240,228,132],"S4b":[641,273,122,99],"S5":[0,0,1920,1080]}
_L=V+"/legibility-ocr-raw.json" if os.path.exists(V+"/legibility-ocr-raw.json") else V+"/legibility.json"
leg={c["id"]:c for c in json.load(open(_L))["checks"]}
shots=[
 dict(id="S1",t_start=0.0,t_end=0.5,beat="B0 establish",framing="full",focus="Home artboard + Tweaks panel 'Prepared for this design' (Mood=SaaS)",pointer="idle on canvas",text_expected=["Coffee that tastes like the trail."],legibility=None,transition_in="loop cut from S5 (same full frame)",ease="none",hold_s=0.5,purpose="Where we are: a Home page in Atelier with the Tweaks panel open."),
 dict(id="S2",t_start=0.5,t_end=1.9,beat="B1 before",framing="close",focus="Home hero h1 + CTA",pointer="idle (off frame)",text_expected=["Coffee that tastes like the trail.","Start a subscription"],legibility="hero_before",transition_in="push-in 0.6 s",ease="cosine, log-zoom",hold_s=0.8,purpose="Show the current (SaaS) voice so the change is measurable."),
 dict(id="T23",t_start=1.9,t_end=2.5,beat="transition",framing="medium",focus="pass through artboard -> Tweaks panel",pointer="gliding to Mood > Playful",text_expected=[],legibility=None,transition_in="pull-out 0.3 s to 1.25x then push-in 0.3 s",ease="cosine, log-zoom",hold_s=0.0,purpose="Spatial link: the control lives in the panel next to the page."),
 dict(id="S3",t_start=2.5,t_end=3.35,beat="B2 action",framing="close",focus="Tweaks > Prepared for this design > Mood: Editorial / SaaS / Playful",pointer="on Playful (lower-right of chip); click at 3.00 s",text_expected=["PREPARED FOR THIS DESIGN","Mood","Editorial","SaaS","Playful"],legibility="control_mood",transition_in="push-in",ease="cosine, log-zoom",hold_s=0.85,purpose="The one cause: a single Mood control switched SaaS -> Playful."),
 dict(id="T34",t_start=3.35,t_end=3.9,beat="transition",framing="medium",focus="panel -> artboard (hero already rewritten)",pointer="still on Playful",text_expected=["Bags without the boredom"],legibility=None,transition_in="pull-out 0.25 s then push-in 0.3 s",ease="cosine, log-zoom",hold_s=0.0,purpose="Carry the eye from cause to effect without a cut."),
 dict(id="S4",t_start=3.9,t_end=5.4,beat="B3 result",framing="close",focus="Home hero h1 + CTA (rewritten)",pointer="parks off artboard (out of frame)",text_expected=["Bags without the boredom","A brighter path from drum to doorstep. Confetti optional.","Let's roast"],legibility="hero_after",transition_in="push-in",ease="cosine, log-zoom",hold_s=1.5,purpose="Effect: same hero, playful voice."),
 dict(id="S4b",t_start=5.4,t_end=7.0,beat="B3b result detail",framing="close",focus="CTA button 'Let's roast' (+ 'boredom' line)",pointer="off frame",text_expected=["boredom","Let's roast","Maybe later"],legibility="cta_after",transition_in="push-in 0.4 s",ease="cosine, log-zoom",hold_s=1.2,purpose="The CTA changed too: the whole voice, not just a headline."),
 dict(id="S5",t_start=7.0,t_end=8.0,beat="B4 payoff",framing="full",focus="Home artboard (playful) + panel with Playful selected",pointer="parked",text_expected=["Bags without the boredom"],legibility=None,transition_in="pull-back 0.5 s",ease="cosine, log-zoom",hold_s=0.5,purpose="Global context; loops back to S1 framing."),
]
for s in shots:
    tm=(s["t_start"]+s["t_end"])/2 if s["hold_s"]==0 else s["t_end"]-s["hold_s"]/2
    z,cr=crop(tm); s["zoom"]=round(z,2); s["crop_css"]=cr
    roi=ROI.get(s["id"]); s["roi_css"]=roi
    if roi:
        rcx,rcy=roi[0]+roi[2]/2,roi[1]+roi[3]/2; ccx,ccy=cr[0]+cr[2]/2,cr[1]+cr[3]/2
        s["roi_center_offset_pct"]=[round(100*(rcx-ccx)/cr[2],1),round(100*(rcy-ccy)/cr[3],1)]
        s["roi_in_frame"]=roi[0]>=cr[0]-0.5 and roi[1]>=cr[1]-0.5 and roi[0]+roi[2]<=cr[0]+cr[2]+0.5 and roi[1]+roi[3]<=cr[1]+cr[3]+0.5
    if s["legibility"]:
        c=leg[s["legibility"]]; s["legibility_px"]={"metric":c["metric"],"measured":c["measured_px"],"threshold":c["threshold_px"],"frame":c["frame"],"pass":c["pass"]}
    s["t_raw_start"]=round(G0+s["t_start"],3)
json.dump({"take":"generative-v1-take5","edit":"edits/zoom-v5","gif":{"width":520,"height":292,"fps":12,"frames":96,"duration_s":8,"window_raw_s":[G0,G0+8]},"click_gif_s":3.0,"camera":"scripts/generative-v1/camera_v4.py","coords":"CSS px of the 1920x1080 viewport (captured at DPR 2)","shots":shots},open(R+"/shotlist.json","w"),indent=1)
print(json.dumps([(s["id"],s["zoom"],s.get("roi_center_offset_pct"),s.get("roi_in_frame")) for s in shots]))
