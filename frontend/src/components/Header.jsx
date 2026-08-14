import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Globe, ChevronDown, Menu, User, ShoppingCart, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = ["Top Up", "Game Card", "Gift Card", "Item Trade", "News"];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, login, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-[#12101f]/95 backdrop-blur-md border-b border-[#241f3d]">
      <div className="max-w-[1240px] mx-auto px-4 h-16 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#6d3bf5] flex items-center justify-center font-display font-extrabold text-white text-lg">
            L
          </div>
          <span className="font-display font-extrabold text-xl text-white tracking-tight">
            Loot<span className="text-[#8b5cf6]">Bar.gg</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-2">
          {navItems.map((n) => (
            <button key={n} className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white rounded-lg hover:bg-[#1e1a34] transition-colors">
              {n}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center flex-1 max-w-sm ml-auto">
          <div className="flex items-center w-full bg-[#1b1730] border border-[#2c2748] rounded-full px-4 py-2 focus-within:border-[#8b5cf6] transition-colors">
            <Search className="w-4 h-4 text-gray-400" />
            <input placeholder="Search games" className="bg-transparent outline-none text-sm text-white placeholder-gray-500 px-2 w-full" />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto md:ml-0">
          <button className="hidden sm:flex items-center gap-1 px-3 py-2 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-[#1e1a34] transition-colors">
            <Globe className="w-4 h-4" /> <span>USD</span> <ChevronDown className="w-3 h-3" />
          </button>
          <button className="p-2 text-gray-300 hover:text-white rounded-lg hover:bg-[#1e1a34] transition-colors">
            <ShoppingCart className="w-5 h-5" />
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 bg-[#1b1730] border border-[#2c2748] rounded-full pl-1 pr-3 py-1 hover:border-[#8b5cf6] transition-colors"
              >
                {user.picture ? (
                  <img src={user.picture} alt="me" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#8b5cf6] flex items-center justify-center text-white text-xs font-bold">
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline text-sm text-white font-medium max-w-[100px] truncate">
                  {user.name || user.email}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#171331] border border-[#2c2748] shadow-xl p-1 z-50">
                  <div className="px-3 py-2 border-b border-[#2c2748]">
                    <p className="text-sm text-white font-medium truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); logout(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#1e1a34] rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={login}
              className="flex items-center gap-2 bg-gradient-to-r from-[#8b5cf6] to-[#6d3bf5] text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
            >
              <User className="w-4 h-4" /> <span className="hidden sm:inline">Sign in</span>
            </button>
          )}

          <button onClick={() => setMobileOpen((o) => !o)} className="lg:hidden p-2 text-gray-300 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-[#241f3d] bg-[#12101f] px-4 py-3 flex flex-col gap-1">
          {navItems.map((n) => (
            <button key={n} className="text-left px-3 py-2 text-sm font-medium text-gray-300 hover:text-white rounded-lg hover:bg-[#1e1a34]">
              {n}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
