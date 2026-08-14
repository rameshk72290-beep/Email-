import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Globe, ChevronDown, Menu, User, ShoppingCart } from "lucide-react";

const navItems = ["Top Up", "Game Card", "Gift Card", "Item Trade", "News"];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#12101f]/95 backdrop-blur-md border-b border-[#241f3d]">
      <div className="max-w-[1240px] mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#6d3bf5] flex items-center justify-center font-display font-extrabold text-white text-lg">
            L
          </div>
          <span className="font-display font-extrabold text-xl text-white tracking-tight">
            Loot<span className="text-[#8b5cf6]">Bar</span>
            <span className="text-[#8b5cf6]">.gg</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1 ml-2">
          {navItems.map((n) => (
            <button
              key={n}
              className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white rounded-lg hover:bg-[#1e1a34] transition-colors"
            >
              {n}
            </button>
          ))}
        </nav>

        {/* Search */}
        <div className="hidden md:flex items-center flex-1 max-w-sm ml-auto">
          <div className="flex items-center w-full bg-[#1b1730] border border-[#2c2748] rounded-full px-4 py-2 focus-within:border-[#8b5cf6] transition-colors">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              placeholder="Search games"
              className="bg-transparent outline-none text-sm text-white placeholder-gray-500 px-2 w-full"
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto md:ml-0">
          <button className="hidden sm:flex items-center gap-1 px-3 py-2 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-[#1e1a34] transition-colors">
            <Globe className="w-4 h-4" />
            <span>USD</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          <button className="p-2 text-gray-300 hover:text-white rounded-lg hover:bg-[#1e1a34] transition-colors">
            <ShoppingCart className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-2 bg-gradient-to-r from-[#8b5cf6] to-[#6d3bf5] text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-opacity">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Sign in</span>
          </button>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="lg:hidden p-2 text-gray-300 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#241f3d] bg-[#12101f] px-4 py-3 flex flex-col gap-1">
          {navItems.map((n) => (
            <button
              key={n}
              className="text-left px-3 py-2 text-sm font-medium text-gray-300 hover:text-white rounded-lg hover:bg-[#1e1a34]"
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
