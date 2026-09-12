import React from 'react';
import { Award, ArrowRight, Star } from 'lucide-react';
import { Product, ProductRatingStats } from '../types';

interface BestSellersSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onQuickView: (product: Product, initialTab?: 'details' | 'reviews') => void;
  ratingStatsMap?: Record<string, ProductRatingStats>;
  wishlistIds?: string[];
  onToggleWishlist?: (product: Product) => void;
  recentlyAddedId?: string | null;
  onViewAll?: () => void;
}

export const BestSellersSection: React.FC<BestSellersSectionProps> = ({
  products,
  onAddToCart,
  onBuyNow,
  onQuickView,
  ratingStatsMap = {},
  wishlistIds = [],
  onToggleWishlist,
  recentlyAddedId = null,
  onViewAll,
}) => {
  // Filter for products marked as is_best_seller by Admin, or highest sold_count / top rated
  const bestSellers = React.useMemo(() => {
    const explicitlyMarked = products.filter(
      (p) =>
        (p.is_best_seller === true || p.is_best_seller === 1 || String(p.is_best_seller) === '1') &&
        p.active !== 0 &&
        p.active !== false
    );

    if (explicitlyMarked.length >= 6) return explicitlyMarked.slice(0, 6);

    const activeList = products.filter((p) => p.active !== 0 && p.active !== false);
    const combined = [...explicitlyMarked];
    for (const p of activeList) {
      if (combined.length >= 6) break;
      if (!combined.some((c) => c.id === p.id)) combined.push(p);
    }
    return combined;
  }, [products]);

  if (bestSellers.length === 0) return null;

  return (
    <section className="my-6 sm:my-8 w-full">
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-6 shadow-xs">
        {/* Header matching reference screenshot */}
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-zinc-950 tracking-tight">
                Best Sellers
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Most loved products by our customers
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-bold text-zinc-700 hover:text-zinc-950 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 6 Horizontal Mini Cards matching screenshot */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
          {bestSellers.map((product) => {
            const sellingPrice = Number(product.selling_price || 0);
            const discount = Number(product.discount || 0);
            const finalPrice = Math.max(0, sellingPrice - discount);

            const rawImage =
              product.image_url ||
              (product.images && product.images[0]) ||
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80';

            return (
              <div
                key={product.id}
                onClick={() => onQuickView(product)}
                className="group p-2.5 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-white hover:border-zinc-300 transition-all flex items-center gap-3 cursor-pointer shadow-2xs hover:shadow-sm"
              >
                {/* Product Thumbnail */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-white border border-zinc-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src={rawImage}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <h4
                    className="text-xs font-bold text-zinc-900 group-hover:text-rose-600 transition-colors truncate"
                    title={product.name}
                  >
                    {product.name}
                  </h4>
                  <div className="text-xs sm:text-sm font-black text-rose-600 mt-0.5">
                    ৳{finalPrice.toLocaleString('en-BD')}
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 text-[10px] font-bold mt-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    <span>4.8</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
