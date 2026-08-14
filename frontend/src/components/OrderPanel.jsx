import React from "react";
import { ShieldCheck, Headphones, QrCode } from "lucide-react";
import { useToast } from "../hooks/use-toast";

export default function OrderPanel({ selected, uid, setUid, qty, setQty }) {
  const { toast } = useToast();
  const total = selected ? (selected.price * qty).toFixed(2) : "0.00";
  const save = selected ? ((selected.originalPrice - selected.price) * qty).toFixed(2) : "0.00";

  const handleTopUp = () => {
    if (!uid.trim()) {
      toast({ title: "UID required", description: "Please enter your Free Fire UID to continue." });
      return;
    }
    if (!selected) {
      toast({ title: "Select a package", description: "Please choose a recharge package first." });
      return;
    }
    toast({
      title: "Order placed (demo)",
      description: `${selected.name} for UID ${uid} \u2014 Total $${total}. This is a mock checkout.`,
    });
  };

  return (
    <div className="lg:sticky lg:top-20 space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-[#1c1733] to-[#15122a] border border-[#2a2447] p-5">
        <h3 className="font-display text-lg font-bold text-white mb-4">Order Information</h3>

        <label className="block text-xs font-medium text-gray-400 mb-1.5">Free Fire UID</label>
        <input
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          placeholder="Enter your player UID"
          className="w-full bg-[#120f28] border border-[#2c2748] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-[#8b5cf6] transition-colors"
        />

        <label className="block text-xs font-medium text-gray-400 mb-1.5 mt-4">Quantity</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-9 h-9 rounded-lg bg-[#231d3d] border border-[#2c2748] text-white text-lg hover:bg-[#2c2550] transition-colors"
          >
            −
          </button>
          <span className="w-10 text-center text-white font-semibold">{qty}</span>
          <button
            onClick={() => setQty(qty + 1)}
            className="w-9 h-9 rounded-lg bg-[#231d3d] border border-[#2c2748] text-white text-lg hover:bg-[#2c2550] transition-colors"
          >
            +
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-[#2a2447] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Selected</span>
            <span className="text-sm text-gray-200 font-medium max-w-[60%] text-right truncate">
              {selected ? selected.name : "None"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Price</span>
            <span className="text-2xl font-extrabold text-[#ff7a1a]">${total}</span>
          </div>
          {selected && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">You save</span>
              <span className="text-sm font-semibold text-[#4ade80]">${save}</span>
            </div>
          )}
        </div>

        <button
          onClick={handleTopUp}
          className="w-full mt-4 bg-gradient-to-r from-[#8b5cf6] to-[#6d3bf5] text-white font-bold py-3 rounded-xl hover:opacity-90 active:scale-[0.99] transition-all"
        >
          Top-up Now
        </button>

        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-[#4ade80]" /> Secure</span>
          <span className="flex items-center gap-1"><Headphones className="w-4 h-4 text-[#8b5cf6]" /> 24/7</span>
        </div>
      </div>

      {/* QR download card */}
      <div className="rounded-2xl bg-[#171331] border border-[#272142] p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-lg bg-white flex items-center justify-center shrink-0">
          <QrCode className="w-10 h-10 text-[#12101f]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Get the LootBar App</p>
          <p className="text-xs text-gray-400">Scan the code to download</p>
        </div>
      </div>
    </div>
  );
}
