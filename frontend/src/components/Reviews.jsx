import React, { useState } from "react";
import { Star, ThumbsUp } from "lucide-react";
import { reviews } from "../mock";

const filters = ["All reviews", "With image", "Latest", "Most Helpful"];

export default function Reviews() {
  const [active, setActive] = useState(0);

  return (
    <section className="rounded-2xl bg-[#141127] border border-[#272142] p-5 sm:p-6">
      <h2 className="font-display text-xl font-bold text-white mb-5">User Reviews</h2>

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="sm:w-48 shrink-0 flex sm:flex-col items-center sm:items-start gap-4">
          <div className="text-center sm:text-left">
            <div className="text-4xl font-extrabold text-white">5.0</div>
            <div className="flex gap-0.5 mt-1 justify-center sm:justify-start">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-[#ffb020] text-[#ffb020]" />
              ))}
            </div>
            <div className="text-xs text-gray-400 mt-1">40,068 reviews</div>
          </div>
          <div className="flex-1 w-full space-y-1">
            {[["5 stars", 100], ["4 stars", 0], ["3 stars", 0], ["2 stars", 0], ["1 star", 0]].map(
              ([label, pct]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400 w-12">{label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[#272142] overflow-hidden">
                    <div className="h-full bg-[#ffb020]" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[11px] text-gray-400 w-8 text-right">{pct}%</span>
                </div>
              )
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.map((f, i) => (
              <button
                key={f}
                onClick={() => setActive(i)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  active === i
                    ? "bg-[#8b5cf6] text-white"
                    : "bg-[#1e1a34] text-gray-400 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="border-b border-[#241f3d] pb-4 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#6d3bf5] flex items-center justify-center text-white text-xs font-bold">
                    {r.id.slice(1, 3)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{r.id}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[...Array(r.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-[#ffb020] text-[#ffb020]" />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{r.date}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[#8b5cf6] mt-2">Purchased {r.purchased}</p>
                <p className="text-sm text-gray-300 mt-1 leading-relaxed">{r.text}</p>
                <button className="flex items-center gap-1.5 mt-2 text-xs text-gray-400 hover:text-white transition-colors">
                  <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({r.helpful.toLocaleString()})
                </button>
              </div>
            ))}
          </div>

          <button className="mt-4 w-full py-2.5 rounded-lg border border-[#2c2748] text-sm font-medium text-gray-300 hover:bg-[#1e1a34] transition-colors">
            Show more
          </button>
        </div>
      </div>
    </section>
  );
}
