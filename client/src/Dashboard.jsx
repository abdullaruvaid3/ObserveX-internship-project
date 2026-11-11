import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SERVER = "http://localhost:5000";
const RANGES = [
  { l: "Last 15 min", m: 15 },
  { l: "Last 1 hr", m: 60 },
  { l: "Last 24 hrs", m: 1440 },
  { l: "Last 7 days", m: 10080 },
];

function fmtTime(t, range) {
  return range <= 1440
    ? new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : new Date(t).toLocaleDateString([], { month: "short", day: "numeric" });
}

function Chart({ logs, range, now }) {
  const N = 24, W = 760, H = 250, L = 38, R = 10, T = 10, B = 26;
  const span = range * 60000;
  const start = now - span;
  const size = span / N;
  const b = Array.from({ length: N }, () => ({ all: 0, e: 0, w: 0 }));
  logs.forEach((l) => {
    const i = Math.floor((new Date(l.timestamp).getTime() - start) / size);
    if (i < 0 || i >= N) return;
    b[i].all++;
    if (l.level === "ERROR") b[i].e++;
    if (l.level === "WARN") b[i].w++;
  });
  const top = Math.max(4, Math.ceil(Math.max(...b.map((p) => p.all)) / 4) * 4);
  const x = (i) => L + (i / (N - 1)) * (W - L - R);
  const y = (v) => T + (1 - v / top) * (H - T - B);
  const line = (k) => b.map((p, i) => x(i) + "," + y(p[k])).join(" ");
  const ticks = [0, 1, 2, 3, 4].map((k) => (top * k) / 4);
  const xt = [0, 4, 8, 12, 16, 20, 23];
  const bw = ((W - L - R) / N) * 0.38;
  return (
    <div>
      <svg viewBox={"0 0 " + W + " " + H} className="chartsvg">
        <defs>
          <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2dd4bf" stopOpacity="0.35" />
            <stop offset="1" stopColor="#2dd4bf" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#1a2c42" />
            <text x={L - 6} y={y(v) + 4} textAnchor="end" fill="#7f93a8" fontSize="11">{v}</text>
          </g>
        ))}
        {xt.map((i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fill="#7f93a8" fontSize="11">{fmtTime(start + i * size, range)}</text>
        ))}
        <polygon points={line("all") + " " + x(N - 1) + "," + y(0) + " " + x(0) + "," + y(0)} fill="url(#gA)" />
        <polyline points={line("all")} fill="none" stroke="#2dd4bf" strokeWidth="2" />
        <polyline points={line("w")} fill="none" stroke="#fbbf24" strokeWidth="1.5" />
        {b.map((p, i) => p.e > 0 && (
          <rect key={i} x={x(i) - bw / 2} y={y(p.e)} width={bw} height={y(0) - y(p.e)} fill="#ff5470" opacity="0.9" />
        ))}
      </svg>
      <div className="legend">
        <span><i className="sq" style={{ background: "#2dd4bf" }}></i>All logs</span>
        <span><i className="sq" style={{ background: "#fbbf24" }}></i>Warnings</span>
        <span><i className="sq" style={{ background: "#ff5470" }}></i>Errors</span>
      </div>
    </div>
  );
}

export default function Dashboard({ token, user, onLogout }) {
  const [logs, setLogs] = useState([]);
  const [online, setOnline] = useState(false);
  const [range, setRange] = useState(1440);
  const [now, setNow] = useState(Date.now());
  const [level, setLevel] = useState("ALL");
  const [app, setApp] = useState("ALL");
  const [search, setSearch] = useState("");
  const [appQ, setAppQ] = useState("");
  const [alert, setAlert] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [updated, setUpdated] = useState(new Date());

  async function load() {
    try {
      const res = await fetch(SERVER + "/api/logs", { headers: { Authorization: "Bearer " + token } });
      if (res.status === 401) return onLogout();
      setLogs(await res.json());
      setUpdated(new Date());
    } catch {
      /* server offline */
    }
  }

  useEffect(() => {
    load();
    const socket = io(SERVER);
    socket.on("connect", () => setOnline(true));
    socket.on("disconnect", () => setOnline(false));
    socket.on("alert:new", (a) => {
      setAlert(a);
      setAlerts((old) => [{ ...a, at: new Date() }, ...old].slice(0, 5));
    });
    socket.on("log:new", (log) => {
      setLogs((old) => [log, ...old].slice(0, 500));
      setUpdated(new Date());
    });
    const backup = setInterval(load, 30000);
    const tick = setInterval(() => setNow(Date.now()), 15000);
    return () => {
      socket.disconnect();
      clearInterval(backup);
      clearInterval(tick);
    };
  }, []);

  const appName = (l) => (l.appId ? l.appId.name : "unknown");
  const inRange = logs.filter((l) => new Date(l.timestamp).getTime() >= now - range * 60000);
  const appMap = {};
  inRange.forEach((l) => {
    const a = (appMap[appName(l)] = appMap[appName(l)] || { name: appName(l), total: 0, errors: 0 });
    a.total++;
    if (l.level === "ERROR") a.errors++;
  });
  const appList = Object.values(appMap).sort((a, b) => b.total - a.total);

  const scoped = inRange.filter((l) => app === "ALL" || appName(l) === app);
  const cnt = (lv) => scoped.filter((l) => l.level === lv).length;
  const total = scoped.length;
  const errors = cnt("ERROR");
  const rate = total ? ((errors / total) * 100).toFixed(1) : "0.0";
  const cards = [
    ["Logs received", total, "#2dd4bf"],
    ["Errors", errors, "#ff5470"],
    ["Warnings", cnt("WARN"), "#fbbf24"],
    ["Applications", appList.length, "#a78bfa"],
    ["Error rate", rate + "%", "#38bdf8"],
    ["Live alerts", alerts.length, "#3ddc84"],
  ];

  const evMap = {};
  scoped.filter((l) => l.level !== "INFO").forEach((l) => {
    const k = l.level + "|" + l.message;
    const e = (evMap[k] = evMap[k] || { message: l.message, level: l.level, app: appName(l), count: 0, last: l.timestamp });
    e.count++;
    if (new Date(l.timestamp) > new Date(e.last)) e.last = l.timestamp;
  });
  const events = Object.values(evMap).sort((a, b) => new Date(b.last) - new Date(a.last)).slice(0, 6);

  const shown = scoped
    .filter((l) => (level === "ALL" || l.level === level) && l.message.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 100);

  const go = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="app">
      <aside className="rail">
        <div className="logo">⚡</div>
        <button title="Home" onClick={() => go("top")}>🏠</button>
        <button title="Logs" onClick={() => go("logs")}>☰</button>
        <button title="Events" onClick={() => go("events")}>🚨</button>
        <div className="sp"></div>
        <button title="Logout" onClick={onLogout}>⏻</button>
      </aside>

      <main className="content">
        <div className="topbar" id="top">
          <h1>Observe<span className="x">X</span></h1>
          <div className="topr">
            <select className="sel" value={range} onChange={(e) => setRange(Number(e.target.value))}>
              {RANGES.map((r) => <option key={r.m} value={r.m}>{r.l}</option>)}
            </select>
            <span><span className={online ? "dot" : "dot off"}></span>{online ? "Live" : "Disconnected"}</span>
            <span className="chip">{user} · Admin</span>
          </div>
        </div>
        <div className="updated">Last updated: {updated.toLocaleTimeString()}</div>

        {alert && (
          <div className="alertbar">
            <span>🚨 <b>ALERT:</b> {alert.count} errors in {alert.seconds}s from <b>{alert.app}</b></span>
            <button onClick={() => setAlert(null)}>Dismiss</button>
          </div>
        )}

        <div className="stats">
          {cards.map((c) => (
            <div className="stat" key={c[0]} style={{ "--c": c[2] }}>
              <small>{c[0]}</small>
              <b>{c[1]}</b>
            </div>
          ))}
        </div>

        <div className="mainrow">
          <div className="panel">
            <h3>Logs over time {app !== "ALL" && "· " + app}</h3>
            <Chart logs={scoped} range={range} now={now} />
          </div>
          <div className="panel">
            <input className="search" placeholder="Search applications..." value={appQ} onChange={(e) => setAppQ(e.target.value)} />
            <h4>Applications</h4>
            <div className={app === "ALL" ? "aitem on" : "aitem"} onClick={() => setApp("ALL")}><span>All applications</span></div>
            {appList.filter((a) => a.name.toLowerCase().includes(appQ.toLowerCase())).map((a) => (
              <div key={a.name} className={app === a.name ? "aitem on" : "aitem"} onClick={() => setApp(a.name)}>
                <span>{a.name}</span>
                <span>{a.total} <i>{a.errors} err</i></span>
              </div>
            ))}
            <h4>Recent alerts</h4>
            {alerts.length === 0 && <div className="dim" style={{ fontSize: 13 }}>No alerts yet</div>}
            {alerts.map((a, i) => (
              <div key={i} className="aitem">
                <span>{a.app}</span>
                <span><i>{a.count} errors</i></span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel" id="events" style={{ marginTop: 12 }}>
          <h3>Recent events</h3>
          <div className="th ev"><span>Event</span><span>Application</span><span>Severity</span><span>Count</span><span>Last triggered</span><span></span></div>
          {events.length === 0 && <div className="empty">No warnings or errors in this range</div>}
          {events.map((e) => (
            <div className="tr ev" key={e.level + e.message}>
              <span>{e.message}</span>
              <span className="dim">{e.app}</span>
              <span className={"sevb " + (e.level === "ERROR" ? "high" : "medium")}>{e.level === "ERROR" ? "high" : "medium"}</span>
              <span>{e.count}</span>
              <span className="dim">{new Date(e.last).toLocaleString()}</span>
              <button className="inv" onClick={() => { setSearch(e.message); setLevel("ALL"); go("logs"); }}>🔍 Investigate</button>
            </div>
          ))}
        </div>

        <div className="panel" id="logs">
          <h3>Live logs</h3>
          <div className="tools">
            {["ALL", "ERROR", "WARN", "INFO"].map((f) => (
              <button key={f} className={level === f ? "on" : ""} onClick={() => setLevel(f)}>{f}</button>
            ))}
            <input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="th lg"><span>Severity</span><span>Time</span><span>Application</span><span>Message</span></div>
          {shown.length === 0 && <div className="empty">No logs found</div>}
          {shown.map((l) => (
            <div className="tr lg" key={l._id}>
              <span className={"sevb " + l.level}>{l.level}</span>
              <span className="dim mono">{new Date(l.timestamp).toLocaleTimeString()}</span>
              <span className="dim">{appName(l)}</span>
              <span className="mono">{l.message}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
