import { useState } from "react";

const SERVER = "http://localhost:5000";

function Spark({ d, color }) {
  return (
    <svg viewBox="0 0 100 40" className="spark">
      <polyline points={d} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(SERVER + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      if (mode === "register") {
        setInfo("Admin created. Please sign in.");
        setMode("login");
      } else {
        localStorage.setItem("obx_token", data.token);
        localStorage.setItem("obx_user", data.username);
        onLogin(data.token, data.username);
      }
    } catch (err) {
      setError(err.message === "Failed to fetch" ? "Cannot reach the server. Is it running?" : err.message);
    }
    setBusy(false);
  }

  return (
    <div className="auth">
      <div className="auth-top">⚡ ObserveX</div>
      <div className="auth-left">
        <h1 className="auth-title">{mode === "login" ? "Login" : "Register"}</h1>
        <p className="auth-sub">Centralized log monitoring for applications</p>
        <form className="auth-card" onSubmit={submit}>
          <div className="tabs">
            <button type="button" className={mode === "login" ? "tab on" : "tab"} onClick={() => setMode("login")}>Login</button>
            <button type="button" className={mode === "register" ? "tab on" : "tab"} onClick={() => setMode("register")}>Register</button>
          </div>
          {error && <div className="msg bad">{error}</div>}
          {info && <div className="msg good">{info}</div>}
          <label>Username</label>
          <div className="field"><span>👤</span><input placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} /></div>
          <label>Password</label>
          <div className="field"><span>🔒</span><input type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <button className="go" type="submit" disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Login" : "Create admin"}</button>
          <div className="hint">ObserveX Platform</div>
        </form>
      </div>

      <div className="auth-right">
        <h2>Real-Time Insights</h2>
        <p>Instant visibility into application errors and alert limits.</p>
        <div className="floats">
          <div className="fcard">
            System Efficiency
            <svg viewBox="0 0 100 100" className="ringsvg">
              <circle cx="50" cy="50" r="34" fill="none" stroke="#12384a" strokeWidth="9" />
              <circle cx="50" cy="50" r="34" fill="none" stroke="#2dd4bf" strokeWidth="9" strokeLinecap="round" strokeDasharray="188 214" transform="rotate(-90 50 50)" />
              <text x="50" y="56" textAnchor="middle" fill="#e8f1f8" fontSize="20" fontWeight="700">88%</text>
            </svg>
          </div>
          <div className="fcard gold">
            <b>12ms</b>Avg Response Time
            <svg viewBox="0 0 100 100" className="ringsvg">
              <circle cx="50" cy="50" r="30" fill="none" stroke="#f5b942" strokeWidth="7" />
            </svg>
          </div>
          <div className="fcard"><b>94%</b>Log Overview<Spark color="#2dd4bf" d="0,32 15,24 30,28 45,12 60,20 75,8 100,16" /></div>
          <div className="fcard"><b>0/100</b>Error Limit<Spark color="#f5b942" d="0,30 20,26 40,32 60,22 80,26 100,14" /></div>
        </div>
      </div>
    </div>
  );
}
