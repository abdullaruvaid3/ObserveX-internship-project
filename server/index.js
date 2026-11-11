require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/apps", require("./routes/apps"));
app.use("/api/logs", require("./routes/logs"));
app.use("/api/auth", require("./routes/auth"));

app.get("/", (req, res) => res.send("ObserveX server is running"));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.set("io", io);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  })
  .catch((err) => console.error("MongoDB connection failed:", err.message));
