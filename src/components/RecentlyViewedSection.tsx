import React, { useState, useEffect } from 'react';
import { History, Trash2, ArrowRight } from 'lucide-react';
import { Product, ProductRatingStats } from '../types';
import { ProductCard } from './ProductCard';
import { getRecentlyViewedIds, clearRecentlyViewed } from '../utils/recentViews';

interface RecentlyViewedSectionProps {
  products: Product[];
  currentProductId?: string;
  onAddToCart: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
  onQuickView: (product: Product, initialTab?: 'details' | 'reviews') => void;
  ratingStatsMap?: Record<string, ProductRatingStats>;
  wishlistIds?: string[];
  onToggleWishlist?: (product: Product) => void;
  recentlyAddedId?: string | null;
  className?: string;
  maxDisplay?: number;
}

export const RecentlyViewedSection: React.FC<RecentlyViewedSectionProps> = ({
  products,
  currentProductId,
  onAddToCart,
  onBuyNow,
  onQuickView,
  ratingStatsMap = {},
  wishlistIds = [],
  onToggleWishlist,
  recentlyAddedId,
  className = '',
  maxDisplay = 6,
}) => {
  const [recentProductIds, setRecentProductIds] = useState<string[]>([]);

  const loadRecent = () => {
    const ids = getRecentlyViewedIds(currentProductId);
    setRecentProductIds(ids);
  };

  useEffect(() => {
    loadRecent();
    const handleUpdate = () => loadRecent();
    window.addEventListener('maxora_recently_viewed_updated', handleUpdate);
    return () => window.removeEventListener('maxora_recently_viewed_updated', handleUpdate);
  }, [currentProductId]);

  const recentProducts = recentProductIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p && p.active !== 0 && String(p.active) !== '0'))
    .slice(0, maxDisplay);

  if (recentProducts.length === 0) {
    return null;
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearRecentlyViewed();
    setRecentProductIds([]);
  };

  return (
    <section className={`py-8 sm:py-12 border-t border-zinc-200/80 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center shrink-0 border border-amber-500/20">
              <History className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                  Recently Viewed
                </h3>
                <span className="text-xs font-bold text-zinc-500">
                  (সম্প্রতি দেখা প্রোডাক্ট)
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 font-medium">
                Products you browsed during this shopping session
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-rose-200 bg-white hover:bg-rose-50 text-zinc-600 hover:text-rose-700 text-xs font-bold transition-colors cursor-pointer"
            title="Clear viewing history"
          >
            <Trash2 className="w-3.5 h-3.5 text-zinc-400 group-hover:text-rose-600" />
            <span className="hidden sm:inline">মুছে ফেলুন</span>
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {recentProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onBuyNow={onBuyNow}
              onQuickView={onQuickView}
              isAdded={recentlyAddedId === product.id}
              ratingStats={ratingStatsMap[product.id]}
              isWishlisted={wishlistIds.includes(product.id)}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
