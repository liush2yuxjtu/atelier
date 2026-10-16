#!/bin/bash
# take4 encode on the Mac mini: GT mp4 (DPR2 frames, scaled 1920) + camera master + 8s/520px/12fps GIF + MP4 deliverable.
set -e; export PATH=/opt/homebrew/bin:$PATH; R=~/gen/runs/${TAKE:-generative-v1-take5}; E=$R/edits/${EDIT:-zoom-v6}; mkdir -p $E $R/raw
[ -f $R/raw/gt.mp4 ] || ffmpeg -loglevel error -y -framerate 30 -i $R/frames/%05d.jpg -vf scale=1920:1080:flags=lanczos -c:v libx264 -crf 16 -pix_fmt yuv420p -movflags +faststart $R/raw/gt.mp4
/opt/homebrew/bin/python3.14 ~/gen/scripts/camera_v4.py $R/frames $E/zoom-master.mp4
ffmpeg -loglevel error -y -ss 1.467 -t 8 -i $E/zoom-master.mp4 -filter_complex "fps=12,scale=520:-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=192:stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle" $E/generative-v1.gif
ln -f $E/zoom-master.mp4 $E/generative-v1.mp4
ls -la $E; ffprobe -v error -count_frames -show_entries stream=nb_read_frames,width -of csv $E/generative-v1.gif
