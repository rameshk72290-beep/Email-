import React, { useState, useEffect } from "react";
import AdminPanel from "../components/AdminPanel";
import { Lock, User } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../lib/api";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("admin_token")) setAuthed(true);
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      const r = await api.post("/admin/login", { username, password: pw });
      localStorage.setItem("admin_token", r.data.admin_token);
      setAuthed(true);
    } catch (e2) {
      setErr("Incorrect username or password.");
    } finally {
      setLoading(false);
    }
  };

  if (authed) return <AdminPanel />;

  return (
    <div className="min-h-screen bg-[#0e0b1a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#6d3bf5] flex items-center justify-center font-display font-extrabold text-white text-xl">L</div>
          <span className="font-display font-extrabold text-2xl text-white">Loot<span className="text-[#8b5cf6]">Bar.gg</span></span>
        </Link>

        <form onSubmit={login} className="rounded-2xl bg-[#141127] border border-[#272142] p-6">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-5 h-5 text-[#8b5cf6]" />
            <h1 className="font-display text-lg font-bold text-white">Owner Login</h1>
          </div>
          <p className="text-sm text-gray-400 mb-5">Only the website owner can manage packages &amp; images.</p>

          <div className="relative mb-3">
            <User className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full bg-[#120f28] border border-[#2c2748] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-[#8b5cf6] transition-colors"
            />
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Password"
              className="w-full bg-[#120f28] border border-[#2c2748] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-[#8b5cf6] transition-colors"
            />
          </div>
          {err && <p className="text-xs text-red-400 mt-2">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-[#8b5cf6] to-[#6d3bf5] text-white font-bold py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? "Logging in\u2026" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
