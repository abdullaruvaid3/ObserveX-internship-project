const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// Creates the first admin only
router.post("/register", async (req, res) => {
  try {
    if ((await User.countDocuments()) > 0) {
      return res.status(403).json({ error: "Admin already exists" });
    }
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "username and password required" });
    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ username, passwordHash });
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login: returns a token the dashboard keeps
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    const ok = user && (await bcrypt.compare(password || "", user.passwordHash));
    if (!ok) return res.status(401).json({ error: "Wrong username or password" });
    const token = jwt.sign({ id: user._id, username }, process.env.JWT_SECRET, { expiresIn: "12h" });
    res.json({ token, username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
