import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductSection from "../components/ProductSection";
import OrderPanel from "../components/OrderPanel";
import Reviews from "../components/Reviews";
import InfoSections from "../components/InfoSections";
import { defaultPackages, defaultSettings } from "../mock";
import api from "../lib/api";
import { useToast } from "../hooks/use-toast";
import { ChevronRight } from "lucide-react";

export default function HomePage() {
  const { toast } = useToast();
  const [packages, setPackages] = useState(defaultPackages);
  const [settings, setSettings] = useState(defaultSettings);
  const [selected, setSelected] = useState(defaultPackages[0]);
  const [uid, setUid] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("gmail") === "connected") {
      toast({ title: "Gmail connected \u2705", description: "You can now receive delivery confirmations verification." });
      window.history.replaceState(null, "", window.location.pathname);
    } else if (params.get("gmail") === "error") {
      toast({ title: "Gmail connection failed", description: "Please try connecting again." });
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [pRes, sRes] = await Promise.all([api.get("/packages"), api.get("/settings")]);
        if (Array.isArray(pRes.data) && pRes.data.length) {
          setPackages(pRes.data);
          setSelected(pRes.data[0]);
        }
        if (sRes.data) setSettings(sRes.data);
      } catch (e) {
        // fallback to mock defaults already set
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#0e0b1a]">
      <Header />
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[#1c1440] to-transparent pointer-events-none" />
        <main className="relative max-w-[1240px] mx-auto px-4 pt-6 pb-12">
          <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
            <button className="hover:text-white transition-colors">Home</button>
            <ChevronRight className="w-4 h-4" />
            <button className="hover:text-white transition-colors">Top Up</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#8b5cf6] font-medium">Free Fire Top Up</span>
          </nav>

          <div className="grid lg:grid-cols-[1fr_340px] gap-6 animate-fade-up">
            <ProductSection
              settings={settings}
              packages={packages}
              selectedId={selected?.id}
              onSelect={setSelected}
            />
            <OrderPanel selected={selected} uid={uid} setUid={setUid} qty={qty} setQty={setQty} />
          </div>

          <div className="mt-8 space-y-6">
            <InfoSections />
            <Reviews />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
