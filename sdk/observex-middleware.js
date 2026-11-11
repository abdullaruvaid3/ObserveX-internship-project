// Express middleware: logs every request automatically to ObserveX.
function observexMiddleware(obx) {
  return (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const ms = Date.now() - start;
      const msg = req.method + " " + req.originalUrl + " " + res.statusCode + " " + ms + "ms";
      if (res.statusCode >= 500) obx.error(msg);
      else if (res.statusCode >= 400) obx.warn(msg);
      else obx.info(msg);
    });
    next();
  };
}
module.exports = observexMiddleware;
