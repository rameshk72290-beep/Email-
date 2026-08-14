import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2, Save, ArrowLeft, RotateCcw, ImageIcon, LogOut, Users, ShoppingBag, Mail, Inbox, RefreshCw, CheckCircle2 } from "lucide-react";
import { defaultPackages, defaultSettings } from "../mock";
import { useToast } from "../hooks/use-toast";
import api from "../lib/api";

function Field({ label, ...props }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-400 mb-1">{label}</label>
      <input
        {...props}
        className="w-full bg-[#120f28] border border-[#2c2748] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-[#8b5cf6] transition-colors"
      />
    </div>
  );
}

export default function AdminPanel() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total_users: 0, total_orders: 0 });
  const [gmailUserId, setGmailUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState("");
  const token = localStorage.getItem("admin_token");
  const adminHeaders = { "X-Admin-Token": token };

  const connectedUsers = users.filter((u) => u.gmail_connected);

  const loadMessages = async (uid) => {
    if (!uid) return;
    setMsgLoading(true);
    setMsgError("");
    setMessages([]);
    try {
      const r = await api.get(`/admin/gmail/messages?user_id=${uid}`, { headers: adminHeaders });
      setMessages(r.data.messages || []);
      if (!r.data.messages?.length) setMsgError("No Garena/Free Fire confirmation emails found in this inbox.");
    } catch (e) {
      setMsgError(e?.response?.data?.detail || "Could not load emails.");
    } finally {
      setMsgLoading(false);
    }
  };

  const clearMessage = async (messageId) => {
    try {
      await api.post("/admin/gmail/clear", { user_id: gmailUserId, message_id: messageId }, { headers: adminHeaders });
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (e) {}
  };

  useEffect(() => {
    (async () => {
      try {
        const [p, s] = await Promise.all([api.get("/packages"), api.get("/settings")]);
        setPackages(p.data);
        setSettings(s.data);
      } catch (e) {
        setPackages(defaultPackages);
        setSettings(defaultSettings);
      }
      try {
        const u = await api.get("/admin/users", { headers: { "X-Admin-Token": token } });
        setUsers(u.data.users || []);
        setStats({ total_users: u.data.total_users || 0, total_orders: u.data.total_orders || 0 });
      } catch (e) {}
    })();
  }, []);

  const updatePkg = (id, key, value) =>
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, [key]: value } : p)));

  const addPkg = () => {
    const id = "p" + Date.now();
    setPackages((prev) => [
      ...prev,
      { id, name: "New Package", image: "https://img.lootbar.com/file/66dad2385bcd5dcccf249149UCmGWzPC03?fop=imageView/2/w/340/h/340", price: 1.0, originalPrice: 1.2, tag: "" },
    ]);
  };

  const removePkg = (id) => setPackages((prev) => prev.filter((p) => p.id !== id));

  const handleSave = async () => {
    const cleaned = packages.map((p) => ({
      id: p.id,
      name: p.name,
      image: p.image,
      tag: p.tag || "",
      price: parseFloat(p.price) || 0,
      originalPrice: parseFloat(p.originalPrice) || 0,
    }));
    try {
      const headers = { "X-Admin-Token": token };
      await api.put("/admin/packages", cleaned, { headers });
      await api.put("/admin/settings", settings, { headers });
      toast({ title: "Saved \u2705", description: "Changes are live on the store now." });
    } catch (e) {
      if (e?.response?.status === 401) {
        toast({ title: "Session expired", description: "Please log in again." });
        localStorage.removeItem("admin_token");
        navigate("/admin");
      } else {
        toast({ title: "Save failed", description: "Please try again." });
      }
    }
  };

  const handleReset = () => {
    setPackages(defaultPackages);
    setSettings(defaultSettings);
    toast({ title: "Reverted", description: "Defaults loaded \u2014 click Save Changes to apply." });
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-[#0e0b1a]">
      <div className="sticky top-0 z-40 bg-[#12101f]/95 backdrop-blur-md border-b border-[#241f3d]">
        <div className="max-w-[1100px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Store
            </Link>
            <span className="font-display font-bold text-white">Admin Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 border border-[#2c2748] hover:bg-[#1e1a34] transition-colors">
              <LogOut className="w-4 h-4" /> Logout
            </button>
            <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 border border-[#2c2748] hover:bg-[#1e1a34] transition-colors">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-[#8b5cf6] to-[#6d3bf5] hover:opacity-90 transition-opacity">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 py-8 space-y-8">
        {/* Stats + Users */}
        <section className="rounded-2xl bg-[#141127] border border-[#272142] p-5">
          <h2 className="font-display text-lg font-bold text-white mb-4">Customers</h2>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-xl bg-[#1c1733] border border-[#2a2447] p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#8b5cf6]/15 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#8b5cf6]" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white leading-none">{stats.total_users}</p>
                <p className="text-xs text-gray-400 mt-1">Total Users</p>
              </div>
            </div>
            <div className="rounded-xl bg-[#1c1733] border border-[#2a2447] p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#ff7a1a]/15 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-[#ff7a1a]" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white leading-none">{stats.total_orders}</p>
                <p className="text-xs text-gray-400 mt-1">Total Orders</p>
              </div>
            </div>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No users have signed in yet. Users who log in with Google will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-[#272142]">
                    <th className="py-2 pr-3 font-medium">User</th>
                    <th className="py-2 pr-3 font-medium">Email</th>
                    <th className="py-2 pr-3 font-medium">Joined</th>
                    <th className="py-2 pr-3 font-medium text-right">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_id} className="border-b border-[#1e1a34] last:border-0">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          {u.picture ? (
                            <img src={u.picture} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#8b5cf6] flex items-center justify-center text-white text-xs font-bold">
                              {(u.name || u.email || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-gray-200 font-medium">{u.name || "\u2014"}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="flex items-center gap-1.5 text-gray-300">
                          <Mail className="w-3.5 h-3.5 text-gray-500" /> {u.email}
                          {u.gmail_connected && (
                            <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#4ade80]/15 text-[#4ade80]">
                              <CheckCircle2 className="w-3 h-3" /> Gmail
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-gray-400">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "\u2014"}
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-[#8b5cf6]/15 text-[#c4b5fd]">
                          {u.orders}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Garena Delivery Confirmation (Gmail) */}
        <section className="rounded-2xl bg-[#141127] border border-[#272142] p-5">
          <div className="flex items-center gap-2 mb-1">
            <Inbox className="w-5 h-5 text-[#8b5cf6]" />
            <h2 className="font-display text-lg font-bold text-white">Garena Delivery Confirmation</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            After a diamond giveaway, pick a client who connected their Gmail to view the Garena confirmation email
            in their inbox and mark it cleared. Only clients who granted permission appear here.
          </p>

          {connectedUsers.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No client has connected their Gmail yet. Ask the client to sign in and tap
              &nbsp;<span className="text-[#c4b5fd]">Connect Gmail</span>&nbsp; from their profile menu.
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <select
                  value={gmailUserId}
                  onChange={(e) => { setGmailUserId(e.target.value); loadMessages(e.target.value); }}
                  className="flex-1 bg-[#120f28] border border-[#2c2748] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#8b5cf6]"
                >
                  <option value="">Select a client's Gmail...</option>
                  {connectedUsers.map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.gmail_email || u.email} {u.name ? `(${u.name})` : ""}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => loadMessages(gmailUserId)}
                  disabled={!gmailUserId || msgLoading}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-[#c4b5fd] border border-[#8b5cf6]/40 bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${msgLoading ? "animate-spin" : ""}`} /> Refresh
                </button>
              </div>

              {msgLoading && <p className="text-sm text-gray-400 py-4">Loading inbox...</p>}
              {!msgLoading && msgError && <p className="text-sm text-gray-500 py-4">{msgError}</p>}

              <div className="space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className="rounded-xl bg-[#1c1733] border border-[#2a2447] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-[#4ade80] shrink-0" />
                          <p className="text-sm font-semibold text-white truncate">{m.subject || "(no subject)"}</p>
                        </div>
                        <p className="text-xs text-gray-400 truncate">From: {m.from}</p>
                        <p className="text-xs text-gray-500 mb-2">{m.date}</p>
                        <p className="text-sm text-gray-300 leading-relaxed">{m.snippet}</p>
                      </div>
                      <button
                        onClick={() => clearMessage(m.id)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 border border-[#2c2748] hover:bg-[#1e1a34] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="rounded-2xl bg-[#141127] border border-[#272142] p-5">
          <h2 className="font-display text-lg font-bold text-white mb-4">Store Settings</h2>
          <div className="flex gap-4 items-start">
            <img src={settings.productImage} alt="product" className="w-20 h-20 rounded-xl object-cover border border-[#332c56] shrink-0" />
            <div className="grid sm:grid-cols-2 gap-3 flex-1">
              <Field label="Product Image URL" value={settings.productImage} onChange={(e) => setSettings({ ...settings, productImage: e.target.value })} />
              <Field label="Title" value={settings.title} onChange={(e) => setSettings({ ...settings, title: e.target.value })} />
              <Field label="Rating" value={settings.rating} onChange={(e) => setSettings({ ...settings, rating: e.target.value })} />
              <Field label="Sold Count" value={settings.soldCount} onChange={(e) => setSettings({ ...settings, soldCount: e.target.value })} />
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-white">
              Packages <span className="text-gray-500 text-sm font-normal">({packages.length})</span>
            </h2>
            <button onClick={addPkg} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[#c4b5fd] border border-[#8b5cf6]/40 bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 transition-colors">
              <Plus className="w-4 h-4" /> Add Package
            </button>
          </div>

          <div className="space-y-3">
            {packages.map((p) => (
              <div key={p.id} className="rounded-xl bg-[#141127] border border-[#272142] p-4 flex flex-col sm:flex-row gap-4">
                <div className="shrink-0">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#0f0c22] border border-[#272142] flex items-center justify-center">
                    {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-gray-600" />}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1">
                  <div className="lg:col-span-2">
                    <Field label="Package Name" value={p.name} onChange={(e) => updatePkg(p.id, "name", e.target.value)} />
                  </div>
                  <Field label="Tag (optional)" value={p.tag} placeholder="e.g. Hot" onChange={(e) => updatePkg(p.id, "tag", e.target.value)} />
                  <div className="sm:col-span-2 lg:col-span-3">
                    <Field label="Image URL" value={p.image} onChange={(e) => updatePkg(p.id, "image", e.target.value)} />
                  </div>
                  <Field label="Price ($)" type="number" step="0.01" value={p.price} onChange={(e) => updatePkg(p.id, "price", e.target.value)} />
                  <Field label="Original Price ($)" type="number" step="0.01" value={p.originalPrice} onChange={(e) => updatePkg(p.id, "originalPrice", e.target.value)} />
                </div>
                <button onClick={() => removePkg(p.id)} className="self-start sm:self-center p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Delete package">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
