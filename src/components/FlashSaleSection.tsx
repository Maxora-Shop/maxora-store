import React, { useState, useEffect } from 'react';
import { Zap, Clock, ShoppingBag, ArrowRight, Eye, Check, Star, Heart, ExternalLink } from 'lucide-react';
import { Product, ProductRatingStats } from '../types';
import { getProductSlug } from '../utils/seo';

interface FlashSaleSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onQuickView: (product: Product, initialTab?: 'details' | 'reviews') => void;
  ratingStatsMap?: Record<string, ProductRatingStats>;
  wishlistIds?: string[];
  onToggleWishlist?: (product: Product) => void;
  recentlyAddedId?: string | null;
}

export const FlashSaleSection: React.FC<FlashSaleSectionProps> = ({
  products,
  onAddToCart,
  onBuyNow,
  onQuickView,
  ratingStatsMap = {},
  wishlistIds = [],
  onToggleWishlist,
  recentlyAddedId = null,
}) => {
  // Real-time Countdown Timer State (Hours, Minutes, Seconds)
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 11,
    minutes: 45,
    seconds: 30,
  });

  useEffect(() => {
    // Calculate time remaining until midnight or next cycle
    const calculateTimeRemaining = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = Math.max(0, endOfDay.getTime() - now.getTime());

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter products for Flash Sale:
  // 1. Explicitly marked is_flash_sale by Admin
  // 2. Or fallback to products with highest discount / badge SALE if none explicitly marked
  const flashSaleProducts = React.useMemo(() => {
    const explicitlyMarked = products.filter(
      (p) =>
        (p.is_flash_sale === true || p.is_flash_sale === 1 || String(p.is_flash_sale) === '1') &&
        p.active !== 0 &&
        p.active !== false
    );

    if (explicitlyMarked.length > 0) return explicitlyMarked;

    // Smart fallback: products with discount > 0 or badge containing SALE or HOT
    return products
      .filter((p) => p.active !== 0 && p.active !== false && Number(p.discount || 0) > 0)
      .sort((a, b) => Number(b.discount || 0) - Number(a.discount || 0))
      .slice(0, 4);
  }, [products]);

  if (flashSaleProducts.length === 0) return null;

  const padZero = (n: number) => n.toString().padStart(2, '0');

  return (
    <section className="my-6 sm:my-10 w-full bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-transparent p-4 sm:p-6 lg:p-8 rounded-3xl border border-amber-300/60 shadow-xs relative overflow-hidden">
      {/* Background Subtle Accent */}
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-24 w-72 h-72 bg-amber-400/15 rounded-full blur-3xl pointer-events-none"
      />

      {/* Header Row: Title, Badge, Real Countdown Timer */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-amber-200/80 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500 text-zinc-950 flex items-center justify-center shadow-md font-black shrink-0">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-zinc-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-rose-600 text-white font-extrabold text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs animate-pulse">
                ⚡ Flash Sale
              </span>
              <span className="text-zinc-600 text-xs font-semibold hidden sm:inline">
                Limited Time Deals
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-zinc-950 tracking-tight mt-0.5">
              Today's Super Deals
            </h2>
          </div>
        </div>

        {/* Real Countdown Timer Blocks */}
        <div className="flex items-center gap-2 bg-white/95 p-2 sm:p-2.5 rounded-2xl border border-amber-200 shadow-xs self-start md:self-auto">
          <div className="flex items-center gap-1.5 text-zinc-700 text-xs font-bold mr-1 pl-1">
            <Clock className="w-4 h-4 text-rose-600 animate-spin-slow" />
            <span className="text-zinc-900 hidden sm:inline">Ends In:</span>
          </div>

          <div className="flex items-center gap-1 font-mono">
            {/* Hours */}
            <div className="flex flex-col items-center">
              <span className="bg-zinc-950 text-white px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black shadow-inner">
                {padZero(timeLeft.hours)}
              </span>
              <span className="text-[9px] uppercase font-bold text-zinc-500 mt-0.5">Hours</span>
            </div>
            <span className="font-black text-zinc-900 pb-2">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <span className="bg-zinc-950 text-white px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black shadow-inner">
                {padZero(timeLeft.minutes)}
              </span>
              <span className="text-[9px] uppercase font-bold text-zinc-500 mt-0.5">Mins</span>
            </div>
            <span className="font-black text-zinc-900 pb-2">:</span>

            {/* Seconds */}
            <div className="flex flex-col items-center">
              <span className="bg-rose-600 text-white px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black shadow-inner">
                {padZero(timeLeft.seconds)}
              </span>
              <span className="text-[9px] uppercase font-bold text-rose-600 mt-0.5">Secs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Flash Sale Products */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 relative z-10">
        {flashSaleProducts.map((product) => {
          const sellingPrice = Number(product.selling_price || 0);
          const discount = Number(product.discount || 0);
          // If admin set flash_sale_price explicitly, use it
          const finalPrice = product.flash_sale_price
            ? Number(product.flash_sale_price)
            : Math.max(0, sellingPrice - discount);

          const discountPercent =
            sellingPrice > 0 ? Math.round(((sellingPrice - finalPrice) / sellingPrice) * 100) : 0;

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
              className="group bg-white rounded-2xl border border-amber-200/90 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 h-full"
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

                {/* Badges */}
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
                  <span className="bg-rose-600 text-white font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-white" />
                    <span>FLASH</span>
                  </span>
                  {discountPercent > 0 && (
                    <span className="bg-amber-400 text-zinc-950 font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md shadow-xs">
                      -{discountPercent}% OFF
                    </span>
                  )}
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

                {/* Desktop Overlay */}
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
                  <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1 truncate">
                    {product.category || 'Special Offer'}
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
                      className="hover:text-emerald-700 transition-colors cursor-pointer"
                    >
                      {product.name}
                    </a>
                  </h3>

                  {/* Rating display */}
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex items-center text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </div>
                    <span className="text-xs font-bold text-zinc-900">
                      {ratingStats && ratingStats.count > 0 ? ratingStats.average.toFixed(1) : '5.0'}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      ({ratingStats && ratingStats.count > 0 ? ratingStats.count : '12+'})
                    </span>
                  </div>

                  {/* Stock Limited Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-600 mb-1">
                      <span className="text-rose-600">⚡ Stock Limited</span>
                      <span>{product.stock || 12} left</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-rose-600 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(25, (Number(product.stock || 10) / 25) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Price & Action Buttons */}
                <div>
                  <div className="flex items-baseline gap-2 mb-2.5">
                    <span className="text-base sm:text-lg font-black text-rose-600">
                      ৳{finalPrice.toLocaleString('en-BD')}
                    </span>
                    {sellingPrice > finalPrice && (
                      <span className="text-xs text-zinc-400 line-through font-semibold">
                        ৳{sellingPrice.toLocaleString('en-BD')}
                      </span>
                    )}
                  </div>

                  {/* Dual Action: Add to Cart + Buy Now */}
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
                          : 'bg-zinc-950 hover:bg-zinc-800 text-white'
                      }`}
                      title="Buy now with 1-click checkout"
                    >
                      <span>Buy Now</span>
                      <ArrowRight className="w-3 h-3 text-amber-400" />
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
