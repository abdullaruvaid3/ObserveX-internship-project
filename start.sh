#!/bin/bash
pgrep mongod > /dev/null || mongod --dbpath ~/mongo-data --fork --logpath ~/mongo-data/mongod.log
fuser -k 5000/tcp 2>/dev/null
fuser -k 5173/tcp 2>/dev/null
cd ~/ObserveX/server && node index.js &
cd ~/ObserveX/client && npm run dev
