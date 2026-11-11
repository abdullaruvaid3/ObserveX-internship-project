const mongoose = require("mongoose");
const logSchema = new mongoose.Schema({
  appId: { type: mongoose.Schema.Types.ObjectId, ref: "App", required: true },
  level: { type: String, enum: ["INFO", "WARN", "ERROR"], default: "INFO" },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Log", logSchema);
