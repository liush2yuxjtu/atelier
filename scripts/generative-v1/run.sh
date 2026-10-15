#!/bin/bash
# start dev server (npm run dev -> 43173) in the gen worktree, run node script, stop server
export PATH=/opt/homebrew/bin:/usr/local/bin:$PATH; cd /tmp/atelier-gen
npm run dev > /tmp/gen-server.log 2>&1 & S=$!
for i in $(seq 1 120); do curl -s -o /dev/null http://127.0.0.1:43173 && break; sleep 0.5; done
curl -s -o /dev/null http://127.0.0.1:43173/studio/demo
node ~/gen/scripts/"$1"; R=$?; pkill -P $S; kill $S; exit $R
