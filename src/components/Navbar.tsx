import React, { useState } from 'react';
import { ShoppingBag, Search, Truck, Phone } from 'lucide-react';
import { StoreSettings } from '../types';

interface NavbarProps {
  settings: StoreSettings;
  cartCount: number;
  onOpenCart: () => void;
  onOpenTracker: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  cartCount,
  onOpenCart,
  onOpenTracker,
  searchQuery,
  onSearchChange,
}) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200">
      {/* Top Banner */}
      <div className="bg-zinc-900 text-zinc-100 text-xs py-2 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-flex items-center justify-center bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium border border-emerald-500/30 shrink-0">
              <Truck className="w-3 h-3 mr-1 inline" />
              Cash on Delivery
            </span>
            <span className="text-zinc-300 font-medium text-[11px] sm:text-xs truncate">
              {settings.promo_text || "Nationwide Delivery Across Bangladesh"}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-zinc-400 shrink-0 text-xs">
            {settings.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="hover:text-white transition-colors flex items-center gap-1 text-[11px] sm:text-xs"
              >
                <Phone className="w-3 h-3" />
                <span className="hidden sm:inline">Helpline:</span> {settings.phone}
              </a>
            )}
            <button
              onClick={onOpenTracker}
              className="hover:text-white transition-colors underline font-medium text-[11px] cursor-pointer"
            >
              Track Order
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogoClick}
            title={settings.store_name || "Maxora"}
            className="flex items-center gap-2 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-black text-lg sm:text-xl tracking-tight shadow-md group-hover:scale-105 transition-transform shrink-0">
              M
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 group-hover:text-zinc-700 transition-colors">
                {settings.store_name || "Maxora"}
                <span className="text-emerald-600">.</span>
              </span>
              <span className="block text-[9px] sm:text-[10px] uppercase font-semibold text-zinc-600 tracking-wider -mt-1">
                Bangladesh
              </span>
            </div>
          </button>
        </div>

        {/* Search Bar - Desktop */}
        <div className="hidden sm:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search products by name, category, or SKU..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-zinc-100/90 hover:bg-zinc-100 focus:bg-white text-zinc-900 text-sm pl-10 pr-8 py-2.5 rounded-full border border-zinc-200 focus:border-zinc-900 focus:outline-none transition-all placeholder:text-zinc-500 shadow-inner"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-zinc-600 bg-zinc-200 rounded-full w-5 h-5 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="sm:hidden w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Cart Trigger */}
          <button
            id="cart-trigger-button"
            onClick={onOpenCart}
            className="relative flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            <span className="bg-emerald-500 text-zinc-950 font-black text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
              {cartCount}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Search Bar Expandable */}
      {mobileSearchOpen && (
        <div className="sm:hidden px-4 pb-3 pt-1 border-t border-zinc-100 bg-white animate-in slide-in-from-top-2 duration-200">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              autoFocus
              className="w-full bg-zinc-100 text-zinc-900 text-sm pl-9 pr-8 py-2.5 rounded-full border border-zinc-300 focus:outline-none focus:border-zinc-900"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-zinc-600 bg-zinc-200 rounded-full w-5 h-5 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
