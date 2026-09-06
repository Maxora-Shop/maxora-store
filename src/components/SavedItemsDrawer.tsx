import React, { useState } from 'react';
import {
  X,
  Heart,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Star,
  ExternalLink,
  Check,
  Package,
} from 'lucide-react';
import { Product, ProductRatingStats } from '../types';

interface SavedItemsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedProducts: Product[];
  onAddToCart: (product: Product) => void;
  onRemoveFromWishlist: (productId: string) => void;
  onClearWishlist: () => void;
  onQuickView: (product: Product) => void;
  onAddAllToCart: () => void;
  ratingStatsMap?: Record<string, ProductRatingStats>;
}

export const SavedItemsDrawer: React.FC<SavedItemsDrawerProps> = ({
  isOpen,
  onClose,
  savedProducts,
  onAddToCart,
  onRemoveFromWishlist,
  onClearWishlist,
  onQuickView,
  onAddAllToCart,
  ratingStatsMap = {},
}) => {
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleItemAddToCart = (product: Product) => {
    onAddToCart(product);
    setAddedItemIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  const inStockProducts = savedProducts.filter(
    (p) => Number(p.stock || 0) > 0
  );

  const totalSavedValue = savedProducts.reduce((sum, p) => {
    const sp = Number(p.selling_price || 0);
    const disc = Number(p.discount || 0);
    return sum + Math.max(0, sp - disc);
  }, 0);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-in-right"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg text-zinc-900 leading-tight">
                Saved Items
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-500 font-medium">
                {savedProducts.length} {savedProducts.length === 1 ? 'product' : 'products'} in your wishlist
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-600 transition-colors cursor-pointer"
            aria-label="Close saved items drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {savedProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-400">
                <Heart className="w-8 h-8 stroke-[1.5]" />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <h3 className="font-black text-base text-zinc-900">
                  Your Wishlist is Empty
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Tap the heart icon on any product to save items you love. They will be stored here so you can order them anytime!
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {savedProducts.map((product) => {
                const sp = Number(product.selling_price || 0);
                const disc = Number(product.discount || 0);
                const finalPrice = Math.max(0, sp - disc);
                const isOutOfStock = Number(product.stock || 0) <= 0;
                const stats = ratingStatsMap[product.id];
                const isAdded = !!addedItemIds[product.id];

                return (
                  <div
                    key={product.id}
                    className="p-3 bg-white rounded-2xl border border-zinc-200 hover:border-zinc-300 transition-all flex gap-3 group relative shadow-2xs"
                  >
                    {/* Thumbnail Image */}
                    <div
                      onClick={() => onQuickView(product)}
                      className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0 cursor-pointer relative"
                    >
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[9px] font-black text-white uppercase">
                          Out of Stock
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-[10px] font-bold uppercase text-zinc-600 truncate">
                            {product.category || 'Essentials'}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemoveFromWishlist(product.id)}
                            className="text-zinc-500 hover:text-rose-600 p-1 -mr-1 transition-colors cursor-pointer"
                            title="Remove from saved items"
                            aria-label={`Remove ${product.name} from wishlist`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <h4
                          onClick={() => onQuickView(product)}
                          className="font-bold text-xs sm:text-sm text-zinc-900 line-clamp-1 hover:text-emerald-700 cursor-pointer transition-colors"
                        >
                          {product.name}
                        </h4>

                        {/* Rating */}
                        {stats && stats.count > 0 ? (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                            <span className="text-[11px] font-bold text-zinc-800">
                              {stats.average.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-zinc-600">
                              ({stats.count})
                            </span>
                          </div>
                        ) : null}
                      </div>

                      {/* Price & Action */}
                      <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-zinc-100">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-black text-sm text-zinc-950">
                            ৳{finalPrice.toLocaleString('en-BD')}
                          </span>
                          {disc > 0 && (
                            <span className="text-[10px] text-zinc-600 line-through">
                              ৳{sp.toLocaleString('en-BD')}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => handleItemAddToCart(product)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            isAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-zinc-950 hover:bg-zinc-800 text-white'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3 h-3" />
                              <span>Add to Cart</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {savedProducts.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-zinc-200 bg-zinc-50 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-medium">Total Saved Value:</span>
              <span className="font-black text-sm text-zinc-950">
                ৳{totalSavedValue.toLocaleString('en-BD')}
              </span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                disabled={inStockProducts.length === 0}
                onClick={onAddAllToCart}
                className="w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm bg-zinc-950 hover:bg-zinc-800 text-white transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>Move All to Cart ({inStockProducts.length})</span>
              </button>

              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={onClearWishlist}
                  className="text-zinc-500 hover:text-rose-600 font-semibold transition-colors cursor-pointer"
                >
                  Clear Wishlist
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="text-zinc-700 hover:text-zinc-950 font-bold transition-colors cursor-pointer"
                >
                  Continue Shopping →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
