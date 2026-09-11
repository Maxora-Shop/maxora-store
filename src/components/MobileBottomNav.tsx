import React from 'react';
import { Store, Search, ShoppingBag, ArrowRight, Heart, User, UserCheck } from 'lucide-react';
import { StoreSettings, CartItem, Customer } from '../types';

interface MobileBottomNavProps {
  settings: StoreSettings;
  cart: CartItem[];
  wishlistCount?: number;
  customer?: Customer | null;
  onOpenCart: () => void;
  onOpenWishlist?: () => void;
  onOpenCheckout: () => void;
  onOpenTracker: () => void;
  onOpenCustomerAccount?: () => void;
  onHomeClick: () => void;
  onSearchClick: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  settings,
  cart,
  wishlistCount = 0,
  customer = null,
  onOpenCart,
  onOpenWishlist,
  onOpenCheckout,
  onOpenTracker,
  onOpenCustomerAccount,
  onHomeClick,
  onSearchClick,
}) => {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none w-full max-w-full">
      {/* Floating Quick Checkout Bar when cart has items */}
      {totalCount > 0 && (
        <div className="px-2.5 pb-1.5 pointer-events-auto animate-in slide-in-from-bottom-3 duration-300 w-full max-w-full">
          <div className="bg-zinc-950 text-white p-2.5 rounded-2xl shadow-2xl border border-zinc-800 flex items-center justify-between gap-2 backdrop-blur-md w-full min-w-0">
            <div
              onClick={onOpenCart}
              className="flex items-center gap-2 cursor-pointer pl-0.5 min-w-0"
            >
              <div className="relative w-8 h-8 rounded-xl bg-emerald-500 text-zinc-950 font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                <ShoppingBag className="w-4 h-4" />
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-black rounded-full px-1 py-0.2 border border-zinc-950">
                  {totalCount}
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-zinc-400 font-medium truncate">
                  {totalCount} {totalCount === 1 ? 'item' : 'items'} in Cart
                </div>
                <div className="text-xs font-black text-emerald-400 truncate">
                  ৳{subtotal.toLocaleString('en-BD')}
                </div>
              </div>
            </div>

            <button
              onClick={onOpenCheckout}
              className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-black text-xs px-3 py-2 rounded-xl flex items-center gap-1 shadow-md cursor-pointer transition-all shrink-0"
            >
              <span>অর্ডার করুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Bar */}
      <nav className="bg-white/95 backdrop-blur-lg border-t border-zinc-200 px-1 py-1.5 flex items-center justify-around shadow-2xl pointer-events-auto w-full max-w-full">
        {/* 1. Store */}
        <button
          onClick={onHomeClick}
          className="flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 text-zinc-900 active:scale-95 transition-transform"
          aria-label="Store Home"
        >
          <Store className="w-4.5 h-4.5 text-zinc-900" />
          <span className="text-[10px] font-bold">Store</span>
        </button>

        {/* 2. Search */}
        <button
          onClick={onSearchClick}
          className="flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 text-zinc-600 active:scale-95 transition-transform"
          aria-label="Search"
        >
          <Search className="w-4.5 h-4.5 text-zinc-600" />
          <span className="text-[10px] font-bold">Search</span>
        </button>

        {/* 3. Saved Items */}
        <button
          onClick={onOpenWishlist}
          className="relative flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 text-zinc-700 active:scale-95 transition-transform"
          aria-label="Saved Items"
        >
          <div className="relative">
            <Heart className={`w-4.5 h-4.5 ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : 'text-zinc-700'}`} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white font-black text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white">
                {wishlistCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">Saved</span>
        </button>

        {/* 4. Customer Account / Login */}
        <button
          onClick={onOpenCustomerAccount || onOpenTracker}
          className="relative flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 text-zinc-700 active:scale-95 transition-transform"
          aria-label="Account"
        >
          <div className="relative">
            {customer ? (
              <UserCheck className="w-4.5 h-4.5 text-emerald-700" />
            ) : (
              <User className="w-4.5 h-4.5 text-zinc-700" />
            )}
            {customer && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
            )}
          </div>
          <span className="text-[10px] font-bold truncate max-w-[50px]">
            {customer ? (customer.name ? customer.name.split(' ')[0] : 'Account') : 'Account'}
          </span>
        </button>

        {/* 5. Cart */}
        <button
          onClick={onOpenCart}
          className="relative flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 text-zinc-900 active:scale-95 transition-transform"
          aria-label="Cart"
        >
          <div className="relative">
            <ShoppingBag className="w-4.5 h-4.5 text-zinc-900" />
            {totalCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white font-black text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white">
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
