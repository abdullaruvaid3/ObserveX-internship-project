// ObserveX Agent: sends CPU and memory usage as logs every 5 seconds.
const path = require("path");
const os = require("os");
require("dotenv").config({ path: path.join(os.homedir(), "ObserveX", "server", ".env") });
const mongoose = require("mongoose");
const ObserveX = require("./observex");

const appName = process.argv[2] || "Case Status App";

function cpuTimes() {
  let idle = 0, total = 0;
  for (const c of os.cpus()) {
    for (const t in c.times) total += c.times[t];
    idle += c.times.idle;
  }
  return { idle, total };
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const doc = await mongoose.connection.db.collection("apps").findOne({ name: appName });
  await mongoose.disconnect();
  const apiKey = doc && Object.values(doc).find((v) => typeof v === "string" && v.startsWith("obx_"));
  if (!apiKey) { console.log("No key found for app:", appName); return; }
  const obx = new ObserveX({ apiKey });
  console.log("Agent running for", appName, "- press Ctrl+C to stop");

  let last = cpuTimes();
  setInterval(async () => {
    const now = cpuTimes();
    const cpu = Math.round(100 * (1 - (now.idle - last.idle) / (now.total - last.total)));
    last = now;
    const mem = Math.round(100 * (1 - os.freemem() / os.totalmem()));
    const msg = "Agent: CPU " + cpu + "% | Memory " + mem + "%";
    const level = cpu > 90 || mem > 90 ? "ERROR" : cpu > 70 || mem > 70 ? "WARN" : "INFO";
    await obx.log(level, msg);
    console.log(level, msg);
  }, 5000);
}
main();
