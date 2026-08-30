import React from 'react';
import { Store, Search, Phone, Truck, ShoppingBag, ArrowRight } from 'lucide-react';
import { StoreSettings, CartItem } from '../types';

interface MobileBottomNavProps {
  settings: StoreSettings;
  cart: CartItem[];
  onOpenCart: () => void;
  onOpenCheckout: () => void;
  onOpenTracker: () => void;
  onHomeClick: () => void;
  onSearchClick: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  settings,
  cart,
  onOpenCart,
  onOpenCheckout,
  onOpenTracker,
  onHomeClick,
  onSearchClick,
}) => {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      {/* Floating Quick Checkout Bar when cart has items */}
      {totalCount > 0 && (
        <div className="px-3 pb-2 pointer-events-auto animate-in slide-in-from-bottom-3 duration-300">
          <div className="bg-zinc-950 text-white p-2.5 sm:p-3 rounded-2xl shadow-2xl border border-zinc-800 flex items-center justify-between gap-2 backdrop-blur-md">
            <div
              onClick={onOpenCart}
              className="flex items-center gap-2.5 cursor-pointer pl-1"
            >
              <div className="relative w-9 h-9 rounded-xl bg-emerald-500 text-zinc-950 font-black text-xs flex items-center justify-center shadow-sm">
                <ShoppingBag className="w-4 h-4" />
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-black rounded-full px-1.5 py-0.2 border border-zinc-950">
                  {totalCount}
                </span>
              </div>
              <div>
                <div className="text-[11px] text-zinc-400 font-medium">
                  {totalCount} {totalCount === 1 ? 'item' : 'items'} in Cart
                </div>
                <div className="text-sm font-black text-emerald-400">
                  ৳{subtotal.toLocaleString('en-BD')}
                </div>
              </div>
            </div>

            <button
              onClick={onOpenCheckout}
              className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all shrink-0"
            >
              <span>অর্ডার করুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Bar */}
      <nav className="bg-white/95 backdrop-blur-lg border-t border-zinc-200 px-3 py-2 flex items-center justify-around shadow-2xl pointer-events-auto">
        {/* Home */}
        <button
          onClick={onHomeClick}
          className="flex flex-col items-center justify-center gap-1 py-1 px-2 text-zinc-900 active:scale-95 transition-transform"
        >
          <Store className="w-5 h-5 text-zinc-900" />
          <span className="text-[10px] font-bold">Store</span>
        </button>

        {/* Search */}
        <button
          onClick={onSearchClick}
          className="flex flex-col items-center justify-center gap-1 py-1 px-2 text-zinc-600 active:scale-95 transition-transform"
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-bold">Search</span>
        </button>

        {/* Helpline Phone */}
        {settings.phone ? (
          <a
            href={`tel:${settings.phone}`}
            className="flex flex-col items-center justify-center gap-1 py-1 px-2 text-zinc-600 active:scale-95 transition-transform"
          >
            <Phone className="w-5 h-5 text-emerald-600" />
            <span className="text-[10px] font-bold">Helpline</span>
          </a>
        ) : (
          <div className="w-8" />
        )}

        {/* Track Order */}
        <button
          onClick={onOpenTracker}
          className="flex flex-col items-center justify-center gap-1 py-1 px-2 text-zinc-600 active:scale-95 transition-transform"
        >
          <Truck className="w-5 h-5 text-zinc-700" />
          <span className="text-[10px] font-bold">Track</span>
        </button>

        {/* Cart */}
        <button
          onClick={onOpenCart}
          className="relative flex flex-col items-center justify-center gap-1 py-1 px-2 text-zinc-900 active:scale-95 transition-transform"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 text-zinc-900" />
            {totalCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-white">
                {totalCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">Cart</span>
        </button>
      </nav>
    </div>
  );
};
