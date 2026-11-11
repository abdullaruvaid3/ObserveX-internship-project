// Sends 5 ERROR logs quickly to trigger the spike alert.
const path = require("path");
const os = require("os");
require("dotenv").config({ path: path.join(os.homedir(), "ObserveX", "server", ".env") });
const mongoose = require("mongoose");
const ObserveX = require("./observex");

const appName = process.argv[2] || "E-Filing App";

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const doc = await mongoose.connection.db.collection("apps").findOne({ name: appName });
  await mongoose.disconnect();
  const apiKey = doc && Object.values(doc).find((v) => typeof v === "string" && v.startsWith("obx_"));
  if (!apiKey) { console.log("No key found for app:", appName); return; }
  const obx = new ObserveX({ apiKey });
  for (let i = 1; i <= 5; i++) await obx.error("Database timeout #" + i);
  console.log("Sent 5 errors as", appName, "- check the dashboard for the red alert");
}
main();
