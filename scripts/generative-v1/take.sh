#!/bin/bash
T=$1; L=~/gen/$T.lock.json
echo "{\"requested_at\":\"$(date -u +%FT%TZ)\"" > $L
TAKE=$T ~/.local/bin/chatcut-rec-lock run --owner gif-job --purpose "atelier generative tweaks $T" --ttl 2700 -- bash -c "echo ,\\\"acquired_at\\\":\\\"\$(date -u +%FT%TZ)\\\" >> $L; ~/gen/scripts/run.sh rec.mjs" > ~/gen/$T.log 2>&1
echo ",\"exit\":$?,\"released_at\":\"$(date -u +%FT%TZ)\"}" >> $L
