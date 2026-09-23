import React from 'react';
import { X, Trash2, ArrowRight, ShoppingBag, Truck, CheckCircle2, Sparkles } from 'lucide-react';
import { CartItem, StoreSettings } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number, selectedColor?: string) => void;
  onRemoveItem: (productId: string, selectedColor?: string) => void;
  onProceedToCheckout: () => void;
  settings: StoreSettings;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  settings,
}) => {
  if (!isOpen) return null;

  const subtotal = cart.reduce(
    (total, item) => total + Number(item.unit_price) * Number(item.quantity),
    0
  );

  const totalItemsCount = cart.reduce((total, item) => total + Number(item.quantity), 0);

  // Free delivery toggle & threshold from store settings
  const isFreeDeliveryFeatureEnabled = settings.free_delivery_enabled !== false;
  const FREE_SHIPPING_THRESHOLD =
    Number(settings.free_delivery_threshold) > 0 ? Number(settings.free_delivery_threshold) : 2000;
  const amountRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const isFreeShippingUnlocked = isFreeDeliveryFeatureEnabled && subtotal >= FREE_SHIPPING_THRESHOLD;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-full max-w-md bg-white shadow-2xl flex flex-col justify-between animate-slide-left">
          {/* Drawer Header */}
          <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-base text-zinc-900">
                  Your Cart
                </h2>
                <span className="text-xs text-zinc-500 font-medium">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Free Shipping Dynamic Progress Bar (Controlled from Admin) */}
          {isFreeDeliveryFeatureEnabled && cart.length > 0 && (
            <div
              className={`p-3.5 sm:p-4 border-b transition-all ${
                isFreeShippingUnlocked
                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                  : 'bg-gradient-to-r from-amber-50/80 via-orange-50/60 to-emerald-50/70 border-zinc-200/80 text-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-xs font-black min-w-0">
                  {isFreeShippingUnlocked ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                      <Truck className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                  )}
                  <span className="truncate">
                    {isFreeShippingUnlocked ? (
                      <span className="text-emerald-900 font-black">
                        🎉 অভিনন্দন! <span className="underline decoration-emerald-500 underline-offset-2">ফ্রি ডেলিভারি</span> আনলক হয়েছে!
                      </span>
                    ) : (
                      <span>
                        আর মাত্র <strong className="text-emerald-700 font-black text-xs sm:text-sm">৳{amountRemaining.toLocaleString('en-BD')}</strong> টাকার কেনাকাটায় <strong className="text-zinc-950 font-black">ফ্রি ডেলিভারি!</strong>
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isFreeShippingUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full shadow-2xs">
                      <Sparkles className="w-3 h-3 text-emerald-600 animate-spin-slow" /> চার্জ ৳০
                    </span>
                  ) : progressPercent >= 70 ? (
                    <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                      কাছাকাছি! 🔥
                    </span>
                  ) : null}
                  <span className="text-[10px] sm:text-[11px] font-black text-zinc-600 shrink-0 bg-white px-2 py-0.5 rounded-full border border-zinc-200/80 shadow-2xs">
                    {progressPercent}%
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full bg-zinc-200/80 rounded-full h-2 overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    isFreeShippingUnlocked
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-xs'
                      : 'bg-gradient-to-r from-amber-500 via-emerald-500 to-emerald-600'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {!isFreeShippingUnlocked && (
                <div className="text-[10px] text-zinc-500 font-medium mt-1.5 flex items-center justify-between">
                  <span>৳{subtotal.toLocaleString('en-BD')}</span>
                  <span>ফ্রি ডেলিভারি টার্গেট: ৳{FREE_SHIPPING_THRESHOLD.toLocaleString('en-BD')}</span>
                </div>
              )}
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-zinc-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-1">
                  Your cart is empty
                </h3>
                <p className="text-xs text-zinc-500 max-w-xs mb-6 leading-relaxed">
                  Looks like you haven't added any products to your cart yet.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                {cart.map((item) => {
                  const lineTotal = Number(item.unit_price) * Number(item.quantity);
                  return (
                    <div key={`${item.product_id}-${item.selected_color || ''}`} className="flex gap-3.5 py-3 group">
                      <div className="w-18 h-18 rounded-xl bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200/80">
                        <img
                          src={item.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80";
                          }}
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 line-clamp-2">
                              {item.name}
                            </h4>
                            <button
                              onClick={() => onRemoveItem(item.product_id, item.selected_color)}
                              className="text-zinc-400 hover:text-rose-600 transition-colors p-1"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Selected Color Badge */}
                          {item.selected_color && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span
                                className="w-3 h-3 rounded-full border border-zinc-300 inline-block shadow-2xs"
                                style={{ backgroundColor: item.selected_color_code || '#71717a' }}
                              />
                              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200/60">
                                Color: {item.selected_color}
                              </span>
                            </div>
                          )}

                          <div className="text-xs text-zinc-500 font-semibold mt-0.5">
                            ৳{Number(item.unit_price).toLocaleString('en-BD')} each
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          {/* Quantity Counter */}
                          <div className="flex items-center border border-zinc-300 rounded-lg overflow-hidden bg-white">
                            <button
                              onClick={() => onUpdateQuantity(item.product_id, -1, item.selected_color)}
                              className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 font-bold text-xs"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-zinc-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.product_id, 1, item.selected_color)}
                              className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 font-bold text-xs"
                            >
                              +
                            </button>
                          </div>

                          <div className="text-sm font-extrabold text-zinc-950">
                            ৳{lineTotal.toLocaleString('en-BD')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          {cart.length > 0 && (
            <div className="p-5 bg-zinc-50 border-t border-zinc-200 space-y-4">
              {isFreeShippingUnlocked ? (
                <div className="flex items-center justify-between text-xs text-emerald-900 bg-emerald-100/70 p-2.5 rounded-xl border border-emerald-300/80">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Free Home Delivery Unlocked!</span>
                  </div>
                  <span className="font-extrabold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                    ৳0 (FREE)
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-zinc-600 bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>Cash on Delivery nationwide</span>
                  </div>
                  <span className="font-bold">Inside Dhaka ৳{settings.delivery_inside_dhaka || 70}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm text-zinc-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-zinc-900">
                    ৳{subtotal.toLocaleString('en-BD')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Delivery Charge</span>
                  <span className={isFreeShippingUnlocked ? 'font-bold text-emerald-700' : ''}>
                    {isFreeShippingUnlocked ? '৳0 (Free Delivery)' : 'Calculated at checkout'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-200">
                <div className="flex items-center justify-between text-base font-black text-zinc-950 mb-3">
                  <span>Estimated Total</span>
                  <span className="text-lg text-emerald-700">
                    ৳{subtotal.toLocaleString('en-BD')} {isFreeShippingUnlocked ? '(Free Delivery)' : '+ Delivery'}
                  </span>
                </div>

                <button
                  onClick={onProceedToCheckout}
                  className="w-full py-3.5 px-5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
