import React, { useState } from "react";
import AdminPanel from "../components/AdminPanel";
import { Lock } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  const login = (e) => {
    e.preventDefault();
    // Mock gate — default password: admin123
    if (pw === "admin123") {
      setAuthed(true);
      setErr("");
    } else {
      setErr("Incorrect password. Try: admin123");
    }
  };

  if (authed) return <AdminPanel />;

  return (
    <div className="min-h-screen bg-[#0e0b1a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#6d3bf5] flex items-center justify-center font-display font-extrabold text-white text-xl">
            L
          </div>
          <span className="font-display font-extrabold text-2xl text-white">
            Loot<span className="text-[#8b5cf6]">Bar.gg</span>
          </span>
        </Link>

        <form
          onSubmit={login}
          className="rounded-2xl bg-[#141127] border border-[#272142] p-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-5 h-5 text-[#8b5cf6]" />
            <h1 className="font-display text-lg font-bold text-white">Admin Login</h1>
          </div>
          <p className="text-sm text-gray-400 mb-5">Enter password to manage packages &amp; images.</p>

          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Password"
            className="w-full bg-[#120f28] border border-[#2c2748] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-[#8b5cf6] transition-colors"
          />
          {err && <p className="text-xs text-red-400 mt-2">{err}</p>}

          <button
            type="submit"
            className="w-full mt-4 bg-gradient-to-r from-[#8b5cf6] to-[#6d3bf5] text-white font-bold py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            Login
          </button>
          <p className="text-xs text-gray-600 mt-3 text-center">Demo password: admin123</p>
        </form>
      </div>
    </div>
  );
}
