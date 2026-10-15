#!/bin/bash
export PATH=/opt/homebrew/bin:/usr/local/bin:$PATH; cd /tmp/atelier-v7
npx next start --port 43174 --hostname 127.0.0.1 > /tmp/v7-server.log 2>&1 & S=$!
for i in $(seq 1 60); do curl -s -o /dev/null http://127.0.0.1:43174 && break; sleep 0.5; done
node "$@"; R=$?; kill $S; exit $R
