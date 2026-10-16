# Build take5 handoff.json (single source of truth) + gallery index.html from it.
import json, html, sys
R="docs/media/runs/generative-v1-take5"; G="/workspace/gallery/atelier-tweaks/generative-v1"
U="https://resume-box.tail6a877d.ts.net/atelier-tweaks/generative-v1/"
old=json.load(open("docs/media/runs/generative-v1-take3/handoff.json"))
sl=json.load(open(R+"/shotlist.json")); L=json.load(open(R+"/verify/legibility.json"))
checks=json.load(open(sys.argv[2])) if len(sys.argv)>2 else [{"url":U+p,"status":None} for p in ("","generative-v1.gif","generative-v1.mp4","poster-v5.png","handoff.json","shotlist.json","legibility.json","legibility-strip.png")]
A=L["after"]
h={
 "status":"ready-with-notes",
 "user_story":old["user_story"],
 "funnel_url":U, "funnel_checks":checks,
 "gif":U+"generative-v1.gif","mp4":U+"generative-v1.mp4","poster":U+"poster-v5.png",
 "commit":sys.argv[1],"branch":"feat/fancy-tweaks-baseline","pr":old["pr"],
 "story_scores":old["story_scores"],"winner":old["winner"],
 "shot_list":sl["shots"],
 "legibility":{"verdict":"pass","file":R+"/verify/legibility.json",
   "checks":[{"id":c["id"],"text":c["text"],"metric":c["metric"],"measured_px":c["measured_px"],"threshold_px":c["threshold_px"],"ocr":c["pass_ocr"],"pass":c["pass"]} for c in A["checks"]],
   "before_take3":[{"id":c["id"],"measured_px":c["measured_px"],"threshold_px":c["threshold_px"],"ocr":c["pass_ocr"],"pass":c["pass"]} for c in L["before"]["checks"]],
   "readable_result_s":A["readable_result"]["px_legible_dur_s"],"centering_pass":A["centering_pass"],
   "story_test":{"independent":False,"pass":True,"status":"provisional","answer":A["story_test"]["answer"]}},
 "qa":{"verdict":"pass-with-notes","hold_s":3.1,"cjk_frames":0,"notes":"Legibility gate pass at 520 px (hero cap 38/36 px, Mood x-height 12 px, CTA x-height 8 px; OCR all tokens). Result text legible 3.9-7.0 s GIF (3.1 s). Click at 3.0 s inside a 7x close on the Mood control. Branch build b140c08, not production. Cold-viewer test self-graded (provisional)."},
 "deviations":["New take5 (take4 superseded: pointer covered 'Playful' at the click); take3 kept in repo",
   "Recorded at deviceScaleFactor 2 (3840x2160 frames) so 7-8x close-ups stay sharp; MP4 still 1920x1080",
   "Recorded app at b140c08 (before designbot's f92f683 JSON-hide fix); no app code changed",
   "MP4 is the full 11.2 s master; GIF is the 8 s window 1.467-9.467 s",
   "Cold-viewer story test graded by the producing agent, not a context-free model",
   "Mac mini had 5.0-7.9 GiB free (< the 10 GiB stated); no files deleted, take used ~0.25 GiB"],
 "artifacts":[R+"/feature.json",R+"/shotlist.json",R+"/verify/legibility.json",R+"/verify/legibility-strip.png",R+"/verify/cold-viewer-contact-sheet.png",R+"/verify/before-take3/",R+"/edits/zoom-v6/zoom.json",R+"/edits/zoom-v6/zoom-master.mp4",R+"/raw/gt.mp4",R+"/evidence/","scripts/generative-v1/camera_v4.py","scripts/generative-v1/verify_legibility.py","scripts/generative-v1/legibility_spec.json","docs/media/runs/takes.log"],
 "known_weaknesses":["Recorded on branch build, not a production release","Close-ups trade global context for legibility: the canvas is only readable as layout in S1/S5","A yellow comment pin sits on the hero 'B' (app content)","Cold-viewer test not independent","Mac mini free space below 10 GiB"],
 "issues_for":{},
 "next":"让一个无上下文的视觉模型只看 verify/cold-viewer-contact-sheet.png 复跑冷启动测试；通过后合并 PR #1，正式 release 后按同一分镜重录为 production。"}
json.dump(h,open(R+"/handoff.json","w"),indent=1,ensure_ascii=False); json.dump(h,open(G+"/handoff.json","w"),indent=1,ensure_ascii=False)
e=html.escape
rows="".join(f"<tr><td>{s['id']}</td><td>{s['t_start']:.2f}–{s['t_end']:.2f}</td><td>{e(s['beat'])}</td><td>{s['framing']} {s['zoom']}×</td><td>{e(s['focus'])}</td><td>{e(s['pointer'])}</td><td>{e(' / '.join(s['text_expected']))}</td><td>{(str(s['legibility_px']['measured'])+' px '+s['legibility_px']['metric']+' (≥'+str(s['legibility_px']['threshold'])+')') if s.get('legibility_px') else '—'}</td><td>{e(s['transition_in'])}</td><td>{s['hold_s']}</td><td>{s.get('roi_center_offset_pct','')}</td><td>{e(s['purpose'])}</td></tr>" for s in sl["shots"])
b={c["id"]:c for c in L["before"]["checks"]}
lrows="".join(f"<tr><td>{c['id']}</td><td>{e(c['text'])}</td><td>{c['metric']}</td><td>≥{c['threshold_px']}</td><td>{b[c['id']]['measured_px'] if b[c['id']]['measured_px'] is not None else 'n/a (unreadable)'} {'✅' if b[c['id']]['pass'] else '❌'}</td><td>{c['measured_px']} {'✅' if c['pass'] else '❌'}</td><td>{', '.join(c['ocr_found'])}</td></tr>" for c in A["checks"])
th=L["thresholds"]
src="".join(f"<li><a href='{s['url']}'>{e(s['title'])}</a> — {e(s['used_for'])}</li>" for s in th["sources"])
page=f"""<!doctype html><html lang=en><meta charset=utf-8><title>Atelier generative Tweaks — generative-v1 (take5)</title>
<style>body{{font:15px/1.5 system-ui;background:#141210;color:#eee;max-width:1200px;margin:auto;padding:24px}}img,video{{max-width:100%;border:1px solid #333;border-radius:6px}}table{{border-collapse:collapse;font-size:13px}}td,th{{border:1px solid #444;padding:4px 6px;vertical-align:top}}a{{color:#f0a060}}.g{{display:grid;grid-template-columns:1fr 1fr;gap:12px}}</style>
<h1>Atelier — generative Tweaks: “One click, new voice” (generative-v1, take5)</h1>
<p>Source: <a href="https://github.com/liush2yuxjtu/atelier/tree/feat/fancy-tweaks-baseline">feat/fancy-tweaks-baseline</a>, app @ b140c08 (PR #1, branch build, not production). Media commit {sys.argv[1][:7]}. Recorded on the Mac mini under chatcut-rec-lock at DPR 2; take5 kept (take3 and take4 kept in the repo).</p>
<p>Outcome: on Home, Tweaks › <i>Prepared for this design</i> › Mood › <b>Playful</b> rewrites the hero “Coffee that tastes like the trail.” → “Bags without the boredom” and the CTA → “Let’s roast”, live.</p>
<h2>8 s GIF (520 px, 96 frames)</h2><img src="generative-v1.gif" alt="Atelier generative Tweaks: Mood Playful rewrites Home hero">
<h2>Full MP4 (11.2 s master, 1920×1080)</h2><video src="generative-v1.mp4" controls loop muted playsinline poster="poster-v5.png"></video>
<h2>镜头分镜 / Shot list</h2><table><tr><th>#</th><th>GIF s</th><th>beat</th><th>framing</th><th>focus</th><th>pointer</th><th>on-screen text</th><th>legibility</th><th>transition</th><th>hold s</th><th>ROI offset %</th><th>purpose</th></tr>{rows}</table>
<p><a href="shotlist.json">shotlist.json</a></p>
<h2>Legibility &amp; story clarity gate (at 520 px)</h2>
<table><tr><th>check</th><th>text</th><th>metric</th><th>threshold</th><th>before (take3)</th><th>after (take5)</th><th>OCR tokens (after)</th></tr>{lrows}</table>
<ul><li>Readable result (px gate): {A['readable_result']['px_legible_s'][0]}–{A['readable_result']['px_legible_s'][1]} s = {A['readable_result']['px_legible_dur_s']} s (≥3 s) ✅ · before: hero max 10 px ❌</li>
<li>Centering: all close shots have the ROI in frame and ≤10% off-centre ✅ · before: control 35% off-centre at the click ❌</li>
<li>Cold-viewer story test (16-frame contact sheet, no context): after ✅ <i>(provisional, graded by the producing agent)</i> — “{e(A['story_test']['answer'])}” · before ❌ — “{e(L['before']['story_test']['answer'])}”</li>
<li>MP4 OCR at beat times: after ✅ · before ✅ (the 1920 px MP4 was always readable; the GIF was not)</li></ul>
<p><b>Why these thresholds.</b> {e(th['viewing_model'])} Hero: {e(th['hero_cap_height_px']['why'])} Control: {e(th['control_label_x_height_px']['why'])} CTA: {e(th['cta_x_height_px']['why'])} {e(th['ocr'])}</p><ul>{src}</ul>
<div class=g><figure><img src="legibility-strip.png"><figcaption>after (take5): beat frames with measured px</figcaption></figure><figure><img src="legibility-strip-before-take3.png"><figcaption>before (take3)</figcaption></figure>
<figure><img src="cold-viewer-contact-sheet.png"><figcaption>cold-viewer sheet, take5</figcaption></figure><figure><img src="cold-viewer-contact-sheet-before-take3.png"><figcaption>cold-viewer sheet, take3</figcaption></figure></div>
<p><a href="legibility.json">legibility.json</a> · <a href="handoff.json">handoff.json</a> · <a href="feature-take5.json">feature.json (take5)</a></p>
<h2>Stills (GIF frames, 520 px)</h2><div class=g><img src="still-t5-1-before.png"><img src="still-t5-2-click-playful.png"><img src="still-t5-3-hero-rewritten.png"><img src="still-t5-4-cta.png"></div>
<h2>Story scores (R1–R7, /100)</h2><table><tr><th>Candidate</th><th>R1</th><th>R2</th><th>R3</th><th>R4</th><th>R5</th><th>R6</th><th>R7</th><th>Total</th></tr>{''.join(f"<tr><td>{'<b>' if s['winner'] else ''}{s['candidate']}{'</b> (winner)' if s['winner'] else ''}</td>"+''.join(f"<td>{s['R'+str(i)]}</td>" for i in range(1,8))+f"<td>{s['total']}</td></tr>" for s in old['story_scores'])}</table>
<p><a href="research.md">research.md</a> · <a href="story.md">story.md</a> · <a href="storyboard.md">storyboard.md</a></p>
<h2>Previous take (take3)</h2><p><a href="qa.json">qa.json</a> · <a href="feature.json">feature.json</a> · <a href="gif-all-frames.jpg">all 96 frames</a> · <a href="take3-strip.jpg">take3 zoom strip</a> · stills: <a href="still-1-before-saas.png">1</a> <a href="still-2-click-playful.png">2</a> <a href="still-3-hero-rewritten.png">3</a> <a href="still-4-payoff.png">4</a></p>
</html>"""
open(G+"/index.html","w").write(page); print("ok")
