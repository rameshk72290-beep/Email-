import React, { useState } from "react";
import { Star, Zap, ShieldCheck, Clock, Gift, ChevronRight } from "lucide-react";
import { serverTabs } from "../mock";

function Badge({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-1.5 bg-[#221d3a] border border-[#2f2950] rounded-full px-3 py-1.5">
      <Icon className="w-3.5 h-3.5 text-[#8b5cf6]" />
      <span className="text-xs font-medium text-gray-200">{label}</span>
    </div>
  );
}

export default function ProductSection({ settings, packages, selectedId, onSelect }) {
  const [activeServer, setActiveServer] = useState(0);

  return (
    <div className="space-y-6">
      {/* Product header card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1c1733] to-[#15122a] border border-[#2a2447] p-5 sm:p-6">
        <div className="flex gap-5">
          <img
            src={settings.productImage}
            alt={settings.title}
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover border border-[#332c56] shadow-lg shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {settings.title}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-[#ffb020] text-[#ffb020]" />
                <span className="text-white font-semibold text-sm">{settings.rating}</span>
                <span className="text-gray-400 text-sm">({settings.ratingCount})</span>
              </div>
              <span className="text-[#8b5cf6] text-sm font-semibold">{settings.soldCount}</span>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge icon={Zap} label="Fast" />
              <Badge icon={ShieldCheck} label="Safe" />
              <Badge icon={Clock} label="24/7" />
            </div>
          </div>
        </div>

        {/* Invite banner */}
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-[#2a1f12] border border-[#4a3418] px-4 py-3">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#ffb020]" />
            <span className="text-sm text-[#ffd591] font-medium">
              Invite Friends and Get 3*10% OFF Discount
            </span>
          </div>
          <button className="flex items-center gap-1 text-sm font-semibold text-[#ffb020] hover:text-[#ffca4d] transition-colors shrink-0">
            Invite Now <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Server selection */}
      <div>
        <h3 className="font-display text-base font-bold text-white mb-3">Select Server</h3>
        <div className="flex flex-wrap gap-2">
          {serverTabs.map((s, i) => (
            <button
              key={s}
              onClick={() => setActiveServer(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                activeServer === i
                  ? "bg-[#8b5cf6]/15 border-[#8b5cf6] text-[#c4b5fd]"
                  : "bg-[#1a1630] border-[#2a2447] text-gray-400 hover:border-[#3d3566] hover:text-gray-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Package grid */}
      <div>
        <h3 className="font-display text-base font-bold text-white mb-3">Select Recharge</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {packages.map((p) => {
            const active = p.id === selectedId;
            const save = (p.originalPrice - p.price).toFixed(2);
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className={`group relative text-left rounded-xl p-3 border transition-all duration-200 ${
                  active
                    ? "bg-[#8b5cf6]/10 border-[#8b5cf6] shadow-[0_0_0_1px_#8b5cf6]"
                    : "bg-[#171331] border-[#272142] hover:border-[#3d3566] hover:-translate-y-0.5"
                }`}
              >
                {p.tag && (
                  <span className="absolute -top-2 left-2 z-10 text-[10px] font-bold uppercase tracking-wide bg-gradient-to-r from-[#8b5cf6] to-[#6d3bf5] text-white px-2 py-0.5 rounded-full">
                    {p.tag}
                  </span>
                )}
                <div className="aspect-square rounded-lg overflow-hidden bg-[#0f0c22] mb-2">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-xs font-medium text-gray-200 leading-snug line-clamp-2 min-h-[32px]">
                  {p.name}
                </p>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-[#ff7a1a] font-bold text-base">${p.price.toFixed(2)}</span>
                  <span className="text-gray-500 text-xs line-through">${p.originalPrice.toFixed(2)}</span>
                </div>
                <span className="inline-block mt-1 text-[10px] font-semibold text-[#4ade80] bg-[#4ade80]/10 px-1.5 py-0.5 rounded">
                  Save ${save}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
