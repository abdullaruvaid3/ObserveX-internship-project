#!/bin/bash
# Fills the dashboard with fresh logs from both applications.
cd ~/ObserveX/sdk
export NODE_PATH=$HOME/ObserveX/server/node_modules
for i in 1 2 3; do
  node sample-app.js "Case Status App"
  node sample-app.js "E-Filing App"
  sleep 1
done
echo "Demo data sent. Refresh the dashboard."
