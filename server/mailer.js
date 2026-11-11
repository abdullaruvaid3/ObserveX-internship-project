// Sends an alert email. Uses a free fake mailbox (Ethereal) unless SMTP_* is set in .env
const nodemailer = require("nodemailer");
let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    const acc = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: acc.smtp.host, port: acc.smtp.port, secure: acc.smtp.secure,
      auth: { user: acc.user, pass: acc.pass },
    });
  }
  return transporter;
}

async function sendAlertEmail(appName, count, seconds) {
  try {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: '"ObserveX Alerts" <alerts@observex.local>',
      to: process.env.ALERT_EMAIL_TO || "admin@observex.local",
      subject: "ObserveX ALERT: " + appName + " has " + count + " errors",
      text: appName + " sent " + count + " ERROR logs within " + seconds + " seconds. Please check the ObserveX dashboard.",
    });
    const url = nodemailer.getTestMessageUrl(info);
    console.log("Alert email sent" + (url ? " - preview: " + url : ""));
  } catch (e) {
    console.log("Alert email failed:", e.message);
  }
}

module.exports = { sendAlertEmail };
