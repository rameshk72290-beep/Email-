import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductSection from "../components/ProductSection";
import OrderPanel from "../components/OrderPanel";
import Reviews from "../components/Reviews";
import InfoSections from "../components/InfoSections";
import { loadPackages, loadSettings } from "../mock";
import { ChevronRight } from "lucide-react";

export default function HomePage() {
  const [packages, setPackages] = useState([]);
  const [settings, setSettings] = useState(loadSettings());
  const [selected, setSelected] = useState(null);
  const [uid, setUid] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const pkgs = loadPackages();
    setPackages(pkgs);
    setSettings(loadSettings());
    if (pkgs.length) setSelected(pkgs[0]);
  }, []);

  return (
    <div className="min-h-screen bg-[#0e0b1a]">
      <Header />

      {/* decorative top glow */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[#1c1440] to-transparent pointer-events-none" />

        <main className="relative max-w-[1240px] mx-auto px-4 pt-6 pb-12">
          {/* breadcrumb */}
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
            <OrderPanel
              selected={selected}
              uid={uid}
              setUid={setUid}
              qty={qty}
              setQty={setQty}
            />
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
