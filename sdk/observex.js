// ObserveX SDK: send logs to the ObserveX server with one line.
class ObserveX {
  constructor({ apiKey, url = "http://localhost:5000" }) {
    this.apiKey = apiKey;
    this.url = url;
  }

  async log(level, message) {
    try {
      const res = await fetch(this.url + "/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": this.apiKey },
        body: JSON.stringify({ level, message }),
      });
      return res.ok;
    } catch (err) {
      return false; // never crash the host app if ObserveX is down
    }
  }

  info(message) { return this.log("INFO", message); }
  warn(message) { return this.log("WARN", message); }
  error(message) { return this.log("ERROR", message); }
}

module.exports = ObserveX;
