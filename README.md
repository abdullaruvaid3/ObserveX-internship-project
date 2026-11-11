
## How to run

Requirements: Node.js 18 or higher, MongoDB.

```
cd ~/ObserveX && ./start.sh
```

- Dashboard: http://localhost:5173
- API: http://localhost:5000
- First time only: open the Register tab on the login page and create the admin user.

## API reference

| Method | Endpoint | Auth | What it does |
|--------|----------|------|--------------|
| POST | /api/apps | none | Register an application, returns its API key (obx_...) |
| POST | /api/logs | x-api-key header | Send a log: `{ "level": "INFO\|WARN\|ERROR", "message": "..." }` |
| GET | /api/logs | JWT token | Read the latest 500 logs (dashboard) |
| POST | /api/auth/register | none | Create the first admin (only works once) |
| POST | /api/auth/login | none | Log in, returns a JWT |

A wrong or missing API key is rejected with `Invalid API key`.

## SDK

```js
const ObserveX = require("./sdk/observex");
const obx = new ObserveX({ apiKey: "obx_your_key" });

obx.info("User logged in");
obx.warn("Upload is slow");
obx.error("Payment failed");
```

## Middleware (Express)

Logs every request automatically: 2xx is INFO, 4xx is WARN, 5xx is ERROR.

```js
const observexMiddleware = require("./sdk/observex-middleware");
app.use(observexMiddleware(obx));
```

## Agent (CPU and memory)

Sends CPU and memory usage as logs every 5 seconds. Level becomes WARN above 70% and ERROR above 90%.

```
cd sdk && NODE_PATH=../server/node_modules node agent.js "Case Status App"
```

## Email alerts

When one application sends 5 ERROR logs within 60 seconds, ObserveX shows the red alert and sends an email (at most one per application every 2 minutes).

By default it uses a free test mailbox (Ethereal) and prints a preview link in the server console. For real email, add these to `server/.env`: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_EMAIL_TO.

## Demo scripts

- `./demo.sh` fills the dashboard with logs from both applications.
- `sdk/alert-demo.js` sends 5 errors to trigger the alert.

## Future work

Alert settings page, API key management page, Docker deployment, log detail view.
