const express = require("express");
const App = require("../models/App");
const Log = require("../models/Log");
const auth = require("../middleware/auth");
const router = express.Router();
const { sendAlertEmail } = require("../mailer");
const lastEmail = {};

// An app sends a log (must include its API key)
router.post("/", async (req, res) => {
  try {
    const apiKey = req.header("x-api-key");
    if (!apiKey) return res.status(401).json({ error: "API key missing" });
    const app = await App.findOne({ apiKey });
    if (!app) return res.status(401).json({ error: "Invalid API key" });

    const { level, message } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });

    const log = await Log.create({ appId: app._id, level, message });
    await log.populate("appId", "name");
    req.app.get("io").emit("log:new", log);

    // Alert: 5 or more ERRORs from this app within 60 seconds
    if (log.level === "ERROR") {
      const since = new Date(Date.now() - 60000);
      const recent = await Log.countDocuments({ appId: app._id, level: "ERROR", timestamp: { $gte: since } });
      if (recent >= 5) {
        req.app.get("io").emit("alert:new", { app: app.name, count: recent, seconds: 60 });
        if (!lastEmail[app.name] || Date.now() - lastEmail[app.name] > 2 * 60 * 1000) {
          lastEmail[app.name] = Date.now();
          sendAlertEmail(app.name, recent, 60);
        }
      }
    }
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard reads logs (needs login)
router.get("/", auth, async (req, res) => {
  const logs = await Log.find().populate("appId", "name").sort({ timestamp: -1 }).limit(500);
  res.json(logs);
});

module.exports = router;
