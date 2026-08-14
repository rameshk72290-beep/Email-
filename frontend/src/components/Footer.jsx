import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube, Settings } from "lucide-react";

const cols = [
  { title: "Top Up", links: ["Free Fire", "PUBG Mobile", "Mobile Legends", "Genshin Impact", "Blood Strike"] },
  { title: "About", links: ["About Us", "Contact Us", "Careers", "Blog", "Reviews"] },
  { title: "Support", links: ["Help Center", "How to Buy", "Payment Methods", "Refund Policy", "FAQ"] },
  { title: "Legal", links: ["Terms of Service", "Privacy Policy", "Cookie Policy", "Anti-Fraud"] },
];

export default function Footer() {
  return (
    <footer className="bg-[#0c0a18] border-t border-[#221d3a] mt-10">
      <div className="max-w-[1240px] mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#6d3bf5] flex items-center justify-center font-display font-extrabold text-white text-lg">
                L
              </div>
              <span className="font-display font-extrabold text-xl text-white">
                Loot<span className="text-[#8b5cf6]">Bar.gg</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              The best marketplace to top up your favourite games at a discounted price. Safe, fast &amp; reliable.
            </p>
            <div className="flex gap-3 mt-4">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 rounded-full bg-[#1a1630] border border-[#2a2447] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#8b5cf6] transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="font-display text-sm font-bold text-white mb-3">{c.title}</h4>
              <ul className="space-y-2">
                {c.links.map((l) => (
                  <li key={l}>
                    <button className="text-sm text-gray-500 hover:text-[#8b5cf6] transition-colors">
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-[#221d3a] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">
            © 2025 LootBar.gg clone — Demo project. All game names &amp; images belong to their owners.
          </p>
          <Link
            to="/admin"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#8b5cf6] transition-colors"
          >
            <Settings className="w-3.5 h-3.5" /> Admin Panel
          </Link>
        </div>
      </div>
    </footer>
  );
}
