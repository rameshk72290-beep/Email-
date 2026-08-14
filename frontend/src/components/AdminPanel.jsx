import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2, Save, ArrowLeft, RotateCcw, ImageIcon, LogOut } from "lucide-react";
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
  const token = localStorage.getItem("admin_token");

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
