import React from 'react';
import { Award, ArrowRight, ShoppingBag, Eye, Check, Star, Heart, ExternalLink } from 'lucide-react';
import { Product, ProductRatingStats } from '../types';
import { getProductSlug } from '../utils/seo';

interface BestSellersSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onQuickView: (product: Product, initialTab?: 'details' | 'reviews') => void;
  ratingStatsMap?: Record<string, ProductRatingStats>;
  wishlistIds?: string[];
  onToggleWishlist?: (product: Product) => void;
  recentlyAddedId?: string | null;
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
}) => {
  // Filter for products marked as is_best_seller by Admin, or highest sold_count / top rated
  const bestSellers = React.useMemo(() => {
    const explicitlyMarked = products.filter(
      (p) =>
        (p.is_best_seller === true || p.is_best_seller === 1 || String(p.is_best_seller) === '1') &&
        p.active !== 0 &&
        p.active !== false
    );

    if (explicitlyMarked.length > 0) return explicitlyMarked;

    // Fallback: sort by sold_count or reviews/ratings
    return products
      .filter((p) => p.active !== 0 && p.active !== false)
      .sort((a, b) => Number(b.sold_count || 0) - Number(a.sold_count || 0))
      .slice(0, 4);
  }, [products]);

  if (bestSellers.length === 0) return null;

  return (
    <section className="my-6 sm:my-10 w-full">
      {/* Header */}
      <div className="flex items-end justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-black shrink-0 border border-amber-200">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-100 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-900 font-extrabold text-[10px] sm:text-xs px-2 py-0.5 rounded-md uppercase tracking-wider">
                Customer Favorites
              </span>
              <span className="text-zinc-500 text-xs font-medium hidden sm:inline">
                Most loved & top-selling items
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-zinc-950 tracking-tight mt-0.5">
              ⭐ Best Sellers
            </h2>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {bestSellers.map((product) => {
          const sellingPrice = Number(product.selling_price || 0);
          const discount = Number(product.discount || 0);
          const finalPrice = Math.max(0, sellingPrice - discount);

          const isWishlisted = wishlistIds.includes(product.id);
          const ratingStats = ratingStatsMap[product.id] || ratingStatsMap[product.sku || ''];
          const isAdded = recentlyAddedId === product.id;
          const isOutOfStock = Number(product.stock || 0) <= 0;

          const productSlug = getProductSlug(product);
          const fullProductUrl = `/product/${productSlug}`;
          const rawImage =
            product.image_url ||
            (product.images && product.images[0]) ||
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';

          return (
            <div
              key={product.id}
              className="group bg-white rounded-2xl border border-zinc-200 hover:border-amber-300 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 h-full"
            >
              {/* Product Image & Badges */}
              <div className="relative aspect-square bg-zinc-50 border-b border-zinc-100 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
                <a
                  href={fullProductUrl}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey) {
                      e.preventDefault();
                      onQuickView(product);
                    }
                  }}
                  className="w-full h-full flex items-center justify-center cursor-pointer"
                  title={product.name}
                >
                  <img
                    src={rawImage}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain group-hover:scale-108 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                </a>

                {/* Top Selling Badge */}
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
                  <span className="bg-amber-500 text-zinc-950 font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                    <Award className="w-3 h-3 fill-zinc-950" />
                    <span>TOP SELLING</span>
                  </span>
                </div>

                {/* Wishlist Heart */}
                {onToggleWishlist && (
                  <button
                    type="button"
                    onClick={() => onToggleWishlist(product)}
                    className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full shadow-xs flex items-center justify-center z-20 transition-all cursor-pointer ${
                      isWishlisted
                        ? 'bg-white text-rose-500 scale-105 border border-rose-200'
                        : 'bg-white/90 hover:bg-white text-zinc-500 hover:text-rose-500 border border-zinc-200'
                    }`}
                    title="Save to Wishlist"
                  >
                    <Heart
                      className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'stroke-[2]'}`}
                    />
                  </button>
                )}

                {/* Quick actions overlay */}
                <div className="hidden sm:flex absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center gap-2 p-3 pointer-events-none">
                  <button
                    type="button"
                    onClick={() => onQuickView(product)}
                    className="pointer-events-auto bg-white hover:bg-zinc-100 text-zinc-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-zinc-700" />
                    <span>Quick View</span>
                  </button>
                  <a
                    href={fullProductUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pointer-events-auto bg-zinc-950 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tab</span>
                  </a>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1 truncate">
                    {product.brand || product.category || 'Popular Choice'}
                  </div>

                  <h3 className="font-black text-zinc-900 text-xs sm:text-sm line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] leading-snug mb-1">
                    <a
                      href={fullProductUrl}
                      onClick={(e) => {
                        if (!e.ctrlKey && !e.metaKey) {
                          e.preventDefault();
                          onQuickView(product);
                        }
                      }}
                      className="hover:text-amber-700 transition-colors cursor-pointer"
                    >
                      {product.name}
                    </a>
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex items-center text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </div>
                    <span className="text-xs font-bold text-zinc-900">
                      {ratingStats && ratingStats.count > 0 ? ratingStats.average.toFixed(1) : '4.9'}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      ({product.sold_count ? `${product.sold_count} sold` : '50+ sold'})
                    </span>
                  </div>
                </div>

                {/* Price & Action Buttons */}
                <div>
                  <div className="flex items-baseline gap-2 mb-2.5">
                    <span className="text-base sm:text-lg font-black text-zinc-950">
                      ৳{finalPrice.toLocaleString('en-BD')}
                    </span>
                    {discount > 0 && (
                      <span className="text-xs text-zinc-400 line-through font-semibold">
                        ৳{sellingPrice.toLocaleString('en-BD')}
                      </span>
                    )}
                  </div>

                  {/* Dual Action: Cart + Buy Now */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => onAddToCart(product)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        isOutOfStock
                          ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                          : isAdded
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 active:scale-95'
                      }`}
                      title="Add to shopping cart"
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Cart</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => onBuyNow(product)}
                      className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95 ${
                        isOutOfStock
                          ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                          : 'bg-amber-500 hover:bg-amber-600 text-zinc-950'
                      }`}
                      title="Buy now with 1-click checkout"
                    >
                      <span>Buy Now</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
