const express = require("express");
const crypto = require("crypto");
const App = require("../models/App");
const router = express.Router();

// Register an app and give it a secret API key
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const apiKey = "obx_" + crypto.randomBytes(24).toString("hex");
    const app = await App.create({ name, apiKey });
    res.status(201).json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List registered apps
router.get("/", async (req, res) => {
  res.json(await App.find().sort({ createdAt: -1 }));
});

module.exports = router;
