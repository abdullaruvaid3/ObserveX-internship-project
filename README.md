# ObserveX

Centralized log monitoring for applications. Many applications send their logs to one place, and administrators watch them live on a dashboard, filter them, and get an alert when errors spike.

Built as an internship project at the Kerala High Court with the MERN stack (MongoDB, Express, React, Node).

## What problem does it solve?

Every application writes logs: INFO (normal), WARN (risky), ERROR (broken). Without ObserveX, someone has to open each application's server to read them. ObserveX collects all logs in one place.

## Architecture

```
Application --(API key)--> Log API (Express) --> MongoDB
                                  |
                                  +--> Socket.IO --> React dashboard (live)
                                  +--> Alert check (5 errors in 60 s) --> red alert + email
```

| Part | Technology | Job |
|------|-----------|-----|
| Server | Node.js + Express (port 5000) | Receives logs, serves the API |
| Database | MongoDB (local) | Stores apps, logs, users |
| Auth | JWT | Only logged-in admins can read logs |
| Live updates | Socket.IO | Pushes new logs and alerts to the dashboard |
| Dashboard | React + Vite (port 5173) | Charts, tiles, filters, live logs |
| SDK, middleware, agent | Node.js | Let an application send logs, request logs and CPU/memory usage |

## Features

- Register applications and get a secret API key (logs with a wrong key are rejected)
- Admin login with JWT (the first registered user becomes the admin)
- Live log stream with no page refresh
- Dashboard tiles: logs received, errors, warnings, applications, error rate, live alerts
- Logs-over-time chart and application list with error counts
- Filter by level (ALL, ERROR, WARN, INFO), filter by application, search
- Time-range selector
- Spike alert: 5 ERROR logs from one application within 60 seconds, with a red banner and an email
- SDK, Express middleware and an Agent that reports CPU and memory

# ObserveX

Centralized log monitoring for applications. Many applications send their logs to one place, and administrators watch them live on a dashboard, filter them, and get an alert when errors spike.

Built as an internship project at the Kerala High Court with the MERN stack (MongoDB, Express, React, Node).

## What problem does it solve?

Every application writes logs: INFO (normal), WARN (risky), ERROR (broken). Without ObserveX, someone has to open each application's server to read them. ObserveX collects all logs in one place.

## Architecture

```
Application --(API key)--> Log API (Express) --> MongoDB
                                  |
                                  +--> Socket.IO --> React dashboard (live)
                                  +--> Alert check (5 errors in 60 s) --> red alert + email
```

| Part | Technology | Job |
|------|-----------|-----|
| Server | Node.js + Express (port 5000) | Receives logs, serves the API |
| Database | MongoDB (local) | Stores apps, logs, users |
| Auth | JWT | Only logged-in admins can read logs |
| Live updates | Socket.IO | Pushes new logs and alerts to the dashboard |
| Dashboard | React + Vite (port 5173) | Charts, tiles, filters, live logs |
| SDK, middleware, agent | Node.js | Let an application send logs, request logs and CPU/memory usage |

## Features

- Register applications and get a secret API key (logs with a wrong key are rejected)
- Admin login with JWT (the first registered user becomes the admin)
- Live log stream with no page refresh
- Dashboard tiles: logs received, errors, warnings, applications, error rate, live alerts
- Logs-over-time chart and application list with error counts
- Filter by level (ALL, ERROR, WARN, INFO), filter by application, search
- Time-range selector
- Spike alert: 5 ERROR logs from one application within 60 seconds, with a red banner and an email
- SDK, Express middleware and an Agent that reports CPU and memory


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
