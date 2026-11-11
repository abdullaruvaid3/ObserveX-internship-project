import { useState } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("obx_token"));
  const [user, setUser] = useState(localStorage.getItem("obx_user") || "");

  function logout() {
    localStorage.removeItem("obx_token");
    localStorage.removeItem("obx_user");
    setToken(null);
  }

  if (!token) {
    return <Login onLogin={(t, u) => { setToken(t); setUser(u); }} />;
  }
  return <Dashboard token={token} user={user} onLogout={logout} />;
}
