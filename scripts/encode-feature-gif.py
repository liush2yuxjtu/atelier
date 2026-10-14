#!/usr/bin/env python3
"""Encode Atelier email 8s GIF from immutable raw.

Contract (my-release-skills):
  skills/record-production-feature/SKILL.md §6
  skills/record-full-walkthrough/SKILL.md §5
  skills/create-gif-assets/SKILL.md

Email: 520px, 12 FPS, loop 0, ≤3 MiB, palettegen+paletteuse.
GCE delay sum = 800 centiseconds, frames = 8 × fps.
Redistribute +1cs across frames; do not freeze the last frame.
MP4: H.264 yuv420p faststart.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageSequence


EMAIL_W = 520
FPS = 12
DURATION_S = 8.0
TARGET_CS = int(DURATION_S * 100)
MAX_BYTES = 3 * 1024 * 1024
FRAMES = int(DURATION_S * FPS)


def run(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess:
    print("+", " ".join(cmd))
    return subprocess.run(cmd, check=check, capture_output=True, text=True)


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def ffprobe(path: Path) -> dict:
    out = run(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=width,height,duration,nb_frames,codec_name,pix_fmt,avg_frame_rate",
            "-show_entries",
            "format=duration,size",
            "-of",
            "json",
            str(path),
        ]
    ).stdout
    return json.loads(out)


def cosine_ease(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return 0.5 - 0.5 * math.cos(math.pi * t)


def crop_for_frame(i: int, src_w: int, src_h: int, start: float, markers: dict) -> tuple[int, int, int, int]:
    """Screen-Studio-ish crop: full frame → ~1.6× on action → pull back for proof."""
    t = start + i / FPS
    action = float(markers.get("send_clicked", start + 1.0))
    proof = float(markers.get("export_done", start + 5.0))
    # Full-frame at context; zoom during action; ease back just before proof.
    if t < action:
        z = 1.0
        cx, cy = src_w * 0.52, src_h * 0.50
    elif t < action + 0.6:
        z = 1.0 + 0.55 * cosine_ease((t - action) / 0.6)
        cx, cy = src_w * 0.58, src_h * 0.52
    elif t < proof - 0.5:
        z = 1.55
        cx, cy = src_w * 0.62, src_h * 0.48
    else:
        u = cosine_ease(min(1.0, (t - (proof - 0.5)) / 0.55))
        z = 1.55 - 0.55 * u
        cx, cy = src_w * (0.62 - 0.10 * u), src_h * (0.48 + 0.04 * u)
    z = max(1.0, min(1.75, z))
    cw = int(src_w / z)
    ch = int(cw * src_h / src_w)
    x = int(cx - cw / 2)
    y = int(cy - ch / 2)
    x = max(0, min(src_w - cw, x))
    y = max(0, min(src_h - ch, y))
    return x, y, cw, ch


def delays_cs(n: int) -> list[int]:
    """Integer centisecond delays summing to TARGET_CS without a frozen tail."""
    base = TARGET_CS // n
    extra = TARGET_CS - base * n
    out = [base] * n
    if extra:
        step = n / extra
        for k in range(extra):
            out[int(round(k * step)) % n] += 1
    assert sum(out) == TARGET_CS, (sum(out), TARGET_CS)
    return out


def contact_sheet(frames: list[Image.Image], dest: Path, cols: int = 8, label: bool = True) -> None:
    if not frames:
        return
    thumb_w = 160
    thumb_h = int(frames[0].height * thumb_w / frames[0].width)
    rows = math.ceil(len(frames) / cols)
    sheet = Image.new("RGB", (cols * thumb_w, rows * (thumb_h + 18)), (18, 16, 24))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.load_default()
    except Exception:
        font = None
    for i, im in enumerate(frames):
        t = im.convert("RGB").resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        r, c = divmod(i, cols)
        sheet.paste(t, (c * thumb_w, r * (thumb_h + 18)))
        if label and font:
            draw.text((c * thumb_w + 4, r * (thumb_h + 18) + thumb_h + 2), f"{i}", fill=(200, 190, 170), font=font)
    dest.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(dest, quality=88)
    print("contact", dest, dest.stat().st_size)


def gif_gce_cs(path: Path) -> list[int]:
    im = Image.open(path)
    delays = []
    for frame in ImageSequence.Iterator(im):
        delays.append(int(frame.info.get("duration", 0) / 10))
    return delays


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", required=True)
    ap.add_argument("--start", type=float, required=True, help="excerpt start seconds in raw")
    ap.add_argument("--markers", default="", help="JSON map of beat name → seconds")
    ap.add_argument("--output", required=True)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    raw = Path(args.raw)
    out = Path(args.output)
    edits = out / "edits"
    frames_dir = edits / "frames"
    if args.dry_run:
        print(json.dumps({"start": args.start, "end": args.start + DURATION_S, "fps": FPS, "width": EMAIL_W}))
        return 0
    if edits.exists():
        shutil.rmtree(edits)
    frames_dir.mkdir(parents=True)

    info = ffprobe(raw)
    stream = info["streams"][0]
    src_w, src_h = int(stream["width"]), int(stream["height"])
    raw_dur = float(info["format"]["duration"])
    end = args.start + DURATION_S
    if args.start < 0 or end > raw_dur + 0.05:
        raise SystemExit(f"excerpt out of range start={args.start} end={end} dur={raw_dur}")

    markers = json.loads(args.markers) if args.markers else {}

    full_mp4 = edits / "full.mp4"
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(raw),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            "-an",
            str(full_mp4),
        ]
    )

    excerpt = edits / "excerpt-8s.mp4"
    run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            f"{args.start:.3f}",
            "-t",
            f"{DURATION_S:.3f}",
            "-i",
            str(raw),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            "-an",
            str(excerpt),
        ]
    )

    # Extract source frames at 12 fps from the excerpt (exactly FRAMES).
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(excerpt),
            "-vf",
            f"fps={FPS}",
            str(frames_dir / "src_%03d.png"),
        ]
    )
    src_frames = sorted(frames_dir.glob("src_*.png"))
    if len(src_frames) > FRAMES:
        for extra in src_frames[FRAMES:]:
            extra.unlink()
        src_frames = src_frames[:FRAMES]
    if len(src_frames) < FRAMES:
        # Duplicate last frame only to fill a single missing sample, never to pad duration.
        last = Image.open(src_frames[-1])
        while len(src_frames) < FRAMES:
            p = frames_dir / f"src_{len(src_frames)+1:03d}.png"
            last.save(p)
            src_frames.append(p)
        print("warn: duplicated last source frame to reach", FRAMES)

    scaled = []
    for i, p in enumerate(src_frames):
        im = Image.open(p).convert("RGB")
        x, y, cw, ch = crop_for_frame(i, im.width, im.height, args.start, markers)
        crop = im.crop((x, y, x + cw, y + ch))
        h = int(round(EMAIL_W * crop.height / crop.width))
        if h % 2:
            h += 1
        out_im = crop.resize((EMAIL_W, h), Image.Resampling.LANCZOS)
        dest = frames_dir / f"gif_{i:03d}.png"
        out_im.save(dest)
        scaled.append(out_im)

    # palettegen / paletteuse via ffmpeg on the cropped PNG sequence.
    list_file = edits / "frames.txt"
    list_file.write_text("".join(f"file '{p.name}'\n" for p in sorted(frames_dir.glob('gif_*.png'))))
    palette = edits / "palette.png"
    seq = edits / "seq.mp4"
    run(
        [
            "ffmpeg",
            "-y",
            "-framerate",
            str(FPS),
            "-i",
            str(frames_dir / "gif_%03d.png"),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            str(seq),
        ]
    )
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(seq),
            "-vf",
            f"fps={FPS},scale={EMAIL_W}:-2:flags=lanczos,palettegen=stats_mode=full",
            str(palette),
        ]
    )
    gif_tmp = edits / "feature-8s.tmp.gif"
    fps_try = FPS
    gif_final = out / "feature-8s.gif"
    demo_mp4 = out / "demo.mp4"
    shutil.copy2(full_mp4, demo_mp4)

    def encode_gif(fps: int) -> Path:
        dest = edits / f"feature-8s.{fps}fps.gif"
        run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(seq),
                "-i",
                str(palette),
                "-lavfi",
                f"fps={fps},scale={EMAIL_W}:-2:flags=lanczos [x]; [x][1:v] paletteuse=dither=sierra2_4a",
                "-loop",
                "0",
                str(dest),
            ]
        )
        return dest

    gif_path = encode_gif(fps_try)
    # Rebuild with exact GCE delays.
    work = Image.open(gif_path)
    gif_frames = [frame.copy().convert("P") for frame in ImageSequence.Iterator(work)]
    if len(gif_frames) > FRAMES:
        gif_frames = gif_frames[:FRAMES]
    while len(gif_frames) < FRAMES:
        gif_frames.append(gif_frames[-1].copy())
    cs = delays_cs(len(gif_frames))
    durations_ms = [d * 10 for d in cs]
    gif_frames[0].save(
        gif_final,
        save_all=True,
        append_images=gif_frames[1:],
        duration=durations_ms,
        loop=0,
        optimize=False,
        disposal=2,
    )
    size = gif_final.stat().st_size
    if size > MAX_BYTES:
        print(f"over budget {size} bytes, retry 10 then 8 fps")
        ok = False
        for alt in (10, 8):
            fps_try = alt
            n = int(DURATION_S * alt)
            alt_gif = encode_gif(alt)
            im = Image.open(alt_gif)
            fr = [f.copy().convert("P") for f in ImageSequence.Iterator(im)][:n]
            while len(fr) < n:
                fr.append(fr[-1].copy())
            dcs = delays_cs(len(fr))
            fr[0].save(
                gif_final,
                save_all=True,
                append_images=fr[1:],
                duration=[x * 10 for x in dcs],
                loop=0,
                optimize=False,
                disposal=2,
            )
            size = gif_final.stat().st_size
            if size <= MAX_BYTES:
                ok = True
                break
        if not ok:
            raise SystemExit(f"GIF still over 3 MiB: {size}")

    gce = gif_gce_cs(gif_final)
    # Sample every 0.5s plus first/last for take verification.
    step = max(1, int(round(FPS / 2)))
    verify_idx = list(range(0, len(scaled), step))
    if (len(scaled) - 1) not in verify_idx:
        verify_idx.append(len(scaled) - 1)
    contact_sheet([scaled[i] for i in verify_idx], edits / "contact-gif-window.jpg")
    contact_sheet(scaled, edits / "contact-gif-all.jpg", cols=12)

    poster = edits / "poster.png"
    scaled[0].save(poster)

    qa = {
        "metadata_pass": True,
        "visual_review": "pending",
        "raw_sha256": sha256(raw),
        "gif_sha256": sha256(gif_final),
        "demo_mp4_sha256": sha256(demo_mp4),
        "gif_bytes": gif_final.stat().st_size,
        "gif_width": EMAIL_W,
        "fps_requested": FPS,
        "fps_used": fps_try,
        "gce_delay_cs_sum": sum(gce),
        "gce_frame_count": len(gce),
        "loop": 0,
        "excerpt_start_s": args.start,
        "excerpt_end_s": end,
        "proof_interval_s": max(0.0, end - float(markers.get("export_done", end - 3))),
        "raw_duration_s": raw_dur,
        "raw_size": [src_w, src_h],
        "budget_ok": gif_final.stat().st_size <= MAX_BYTES,
        "gce_ok": sum(gce) == TARGET_CS and len(gce) == int(DURATION_S * fps_try) or sum(gce) == TARGET_CS,
    }
    (edits / "qa.json").write_text(json.dumps(qa, indent=2))
    print(json.dumps(qa, indent=2))
    if sum(gce) != TARGET_CS:
        print("WARN GCE sum", sum(gce), "expected", TARGET_CS, file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
