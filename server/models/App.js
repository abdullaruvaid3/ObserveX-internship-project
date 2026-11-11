const mongoose = require("mongoose");
const appSchema = new mongoose.Schema({
  name: { type: String, required: true },
  apiKey: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("App", appSchema);
