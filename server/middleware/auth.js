const jwt = require("jsonwebtoken");

// Only allows requests that carry a valid login token
module.exports = (req, res, next) => {
  const token = (req.header("authorization") || "").replace("Bearer ", "");
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Login required" });
  }
};
