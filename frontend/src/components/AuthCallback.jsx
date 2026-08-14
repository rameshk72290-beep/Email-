import React, { useEffect, useRef } from "react";
import api from "../lib/api";

export default function AuthCallback() {
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash || "";
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const sessionId = params.get("session_id");

    (async () => {
      try {
        if (sessionId) {
          await api.post("/auth/session", {}, { headers: { "X-Session-ID": sessionId } });
        }
      } catch (e) {
        // ignore, will land on home unauthenticated
      }
      // clear the hash and hard-redirect to home so AuthProvider re-checks /me
      window.history.replaceState(null, "", window.location.pathname);
      window.location.href = "/";
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#0e0b1a] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-[#8b5cf6] border-t-transparent animate-spin" />
      <p className="text-gray-300 text-sm">Signing you in…</p>
    </div>
  );
}
