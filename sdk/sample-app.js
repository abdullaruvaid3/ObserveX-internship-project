// Sample app: pretends to be a court application sending logs via the SDK.
const path = require("path");
const os = require("os");
require("dotenv").config({ path: path.join(os.homedir(), "ObserveX", "server", ".env") });
const mongoose = require("mongoose");
const ObserveX = require("./observex");

const appName = process.argv[2] || "Case Status App";

async function getKey(name) {
  await mongoose.connect(process.env.MONGO_URI);
  const doc = await mongoose.connection.db.collection("apps").findOne({ name });
  await mongoose.disconnect();
  if (!doc) return null;
  return Object.values(doc).find((v) => typeof v === "string" && v.startsWith("obx_"));
}

async function main() {
  const apiKey = await getKey(appName);
  if (!apiKey) { console.log("No key found for app:", appName); return; }
  const obx = new ObserveX({ apiKey });
  await obx.info("User logged in");
  await obx.info("Case status page opened");
  await obx.warn("Upload is taking longer than usual");
  await obx.error("Payment failed (sent by SDK)");
  await obx.info("Document uploaded successfully");
  console.log("Sent 5 logs as", appName);
}
main();
