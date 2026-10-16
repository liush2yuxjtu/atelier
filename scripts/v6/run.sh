#!/bin/bash
export PATH=/opt/homebrew/bin:/usr/local/bin:$PATH; cd /tmp/atelier
npx next start --port 43173 --hostname 127.0.0.1 > ~/fx/server.log 2>&1 & S=$!
for i in $(seq 1 40); do curl -s -o /dev/null http://127.0.0.1:43173 && break; sleep 0.5; done
node "$@"; R=$?; kill $S; exit $R
