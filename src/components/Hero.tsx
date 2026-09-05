import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Truck,
  Check,
  RefreshCw,
  Zap,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Product, StoreSettings } from '../types';

interface HeroProps {
  settings: StoreSettings;
  products?: Product[];
  onExploreClick: () => void;
  onOpenProduct?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export const Hero: React.FC<HeroProps> = ({
  settings,
  products = [],
  onExploreClick,
  onOpenProduct,
  onAddToCart,
}) => {
  // Filter for featured products (active & marked featured)
  const featuredProducts = products.filter(
    (p) =>
      (p.featured === 1 || p.featured === true || String(p.featured) === '1' || String(p.featured) === 'true') &&
      p.active !== 0 &&
      p.active !== false
  );

  // Fallback: if no product is explicitly marked featured, use the first available active products
  const displayProducts =
    featuredProducts.length > 0
      ? featuredProducts
      : products.filter((p) => p.active !== 0 && p.active !== false).slice(0, 3);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const count = displayProducts.length;

  // Ensure index is in bounds
  useEffect(() => {
    if (currentIndex >= count && count > 0) {
      setCurrentIndex(0);
    }
  }, [count, currentIndex]);

  // Auto-rotate every 5 seconds if multiple products exist and not hovered
  useEffect(() => {
    if (count <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setDirection('next');
      setCurrentIndex((prev) => (prev + 1) % count);
    }, 5000);

    return () => clearInterval(interval);
  }, [count, isHovered]);

  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (count <= 1) return;
      setDirection('next');
      setCurrentIndex((prev) => (prev + 1) % count);
    },
    [count]
  );

  const handlePrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (count <= 1) return;
      setDirection('prev');
      setCurrentIndex((prev) => (prev - 1 + count) % count);
    },
    [count]
  );

  const handleSelectDot = useCallback(
    (idx: number, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (idx === currentIndex) return;
      setDirection(idx > currentIndex ? 'next' : 'prev');
      setCurrentIndex(idx);
    },
    [currentIndex]
  );

  const currentProduct = count > 0 ? displayProducts[currentIndex] : null;

  // Price calculations for featured product
  const sellingPrice = currentProduct ? Number(currentProduct.selling_price || 0) : 0;
  const discount = currentProduct ? Number(currentProduct.discount || 0) : 0;
  const finalPrice = Math.max(0, sellingPrice - discount);
  const hasDiscount = discount > 0;
  const productImage =
    currentProduct?.image_url ||
    (currentProduct?.images && currentProduct.images[0]) ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';

  // Animation variants
  const slideVariants = {
    initial: (dir: 'next' | 'prev') => ({
      opacity: 0,
      x: dir === 'next' ? 24 : -24,
      scale: 0.98,
    }),
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.45,
        ease: [0.25, 1, 0.5, 1],
      },
    },
    exit: (dir: 'next' | 'prev') => ({
      opacity: 0,
      x: dir === 'next' ? -24 : 24,
      scale: 0.98,
      transition: {
        duration: 0.35,
        ease: [0.25, 1, 0.5, 1],
      },
    }),
  };

  return (
    <section className="my-4 sm:my-6 mx-auto max-w-7xl px-3 sm:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
        {/* ====================================================
            MAIN MARKETPLACE HERO / BANNER SECTION (8 Cols on Desktop)
        ==================================================== */}
        <div
          className="lg:col-span-8 relative bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm border border-zinc-800 overflow-hidden flex flex-col justify-between"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Subtle Ambient Accents */}
          <div
            aria-hidden="true"
            className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"
          />

          {/* Top Row: Pill Tag & Carousel Controls */}
          <div className="relative z-10 flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[11px] font-black text-emerald-300 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Featured Collection</span>
              </span>
              {currentProduct?.badge && (
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-bold uppercase tracking-wider">
                  {currentProduct.badge}
                </span>
              )}
            </div>

            {count > 1 && (
              <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous Featured Product"
                  className="w-7 h-7 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next Featured Product"
                  className="w-7 h-7 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Main Hero Content Area */}
          {currentProduct ? (
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentProduct.id || currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center flex-1"
              >
                {/* Text Details (7 Cols) */}
                <div className="md:col-span-7 flex flex-col justify-center space-y-4">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                      {currentProduct.category || 'Trending Gadget'}
                    </span>
                    <h1
                      onClick={() => onOpenProduct && onOpenProduct(currentProduct)}
                      className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight hover:text-emerald-300 transition-colors cursor-pointer line-clamp-2"
                      title={currentProduct.name}
                    >
                      {currentProduct.name}
                    </h1>
                    {currentProduct.description && (
                      <p className="text-zinc-400 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                        {currentProduct.description}
                      </p>
                    )}
                  </div>

                  {/* Pricing and Value */}
                  <div className="flex items-baseline gap-3 pt-1">
                    <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                      ৳{finalPrice.toLocaleString('en-BD')}
                    </div>
                    {hasDiscount && (
                      <div className="text-sm sm:text-base text-zinc-500 line-through font-semibold">
                        ৳{sellingPrice.toLocaleString('en-BD')}
                      </div>
                    )}
                    {hasDiscount && (
                      <span className="bg-rose-500/20 text-rose-300 text-[11px] font-black px-2 py-0.5 rounded-md border border-rose-500/30">
                        SAVE ৳{discount.toLocaleString('en-BD')}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => onOpenProduct && onOpenProduct(currentProduct)}
                      className="px-6 py-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <span>Shop Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onAddToCart && onAddToCart(currentProduct)}
                      className="px-5 py-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all border border-zinc-700 active:scale-95 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4 text-emerald-400" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>

                {/* Product Visual Showcase (5 Cols) */}
                <div className="md:col-span-5 flex items-center justify-center">
                  <div
                    onClick={() => onOpenProduct && onOpenProduct(currentProduct)}
                    className="relative w-full aspect-square max-w-[280px] sm:max-w-[320px] rounded-2xl bg-zinc-900/70 border border-zinc-800 p-4 flex items-center justify-center group cursor-pointer overflow-hidden shadow-inner"
                  >
                    <img
                      src={productImage}
                      alt={currentProduct.name}
                      className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)] group-hover:scale-108 transition-transform duration-500 ease-out"
                      loading="eager"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-zinc-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/90 text-white text-xs font-bold shadow-lg border border-zinc-700">
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Quick View</span>
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-emerald-400 mb-3" />
              <h2 className="text-xl font-bold text-white mb-1">Discover Top Quality Products</h2>
              <p className="text-xs text-zinc-400 mb-4">Cash on Delivery with fast delivery across Bangladesh.</p>
              <button
                type="button"
                onClick={onExploreClick}
                className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs cursor-pointer"
              >
                Browse All Products
              </button>
            </div>
          )}

          {/* Dots Indicator */}
          {count > 1 && (
            <div className="relative z-10 flex items-center justify-center gap-2 pt-4 mt-2">
              {displayProducts.map((p, idx) => (
                <button
                  key={p.id || idx}
                  type="button"
                  onClick={(e) => handleSelectDot(idx, e)}
                  aria-label={`View featured slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentIndex
                      ? 'w-7 bg-emerald-400 shadow-sm shadow-emerald-400/50'
                      : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ====================================================
            PROMOTIONAL BANNER AREA (4 Cols on Desktop)
        ==================================================== */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Promo Card 1: Fast Cash on Delivery */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200/90 shadow-xs flex flex-col justify-between h-full group hover:border-emerald-500/40 transition-all">
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-extrabold uppercase">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Delivery Guarantee</span>
              </div>
              <h3 className="text-lg font-black text-zinc-900 leading-snug">
                Fast Delivery to All 64 Districts
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Enjoy hassle-free Cash on Delivery. Pay only when you safely receive and inspect your parcel.
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="text-[11px] text-zinc-500">Dhaka City: <strong className="text-zinc-900 font-bold">৳{settings.delivery_inside_dhaka || 70}</strong></div>
                <div className="text-[11px] text-zinc-500">Outside Dhaka: <strong className="text-zinc-900 font-bold">৳{settings.delivery_outside_dhaka || 130}</strong></div>
              </div>
              <button
                type="button"
                onClick={onExploreClick}
                className="font-bold text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Promo Card 2: 100% Quality & Easy Exchange */}
          <div className="bg-gradient-to-br from-zinc-50 to-emerald-50/40 rounded-3xl p-5 sm:p-6 border border-zinc-200/90 shadow-xs flex flex-col justify-between h-full group hover:border-emerald-500/40 transition-all">
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 text-white text-[11px] font-extrabold uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Customer Protection</span>
              </div>
              <h3 className="text-lg font-black text-zinc-900 leading-snug">
                Verified Quality & Easy Exchange
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Every single package is tested before dispatch. We provide full replacement support for defects.
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-200/60 flex items-center justify-between text-xs">
              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> 7-Day Exchange Policy
              </span>
              <button
                type="button"
                onClick={onExploreClick}
                className="font-bold text-xs text-zinc-900 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Browse</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 8. Trust & Marketplace Benefits Strip */}
      <div className="mt-4 bg-white rounded-2xl border border-zinc-200/80 p-3 sm:p-4 shadow-2xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs font-semibold text-zinc-700">
          <div className="flex items-center gap-2.5 p-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-zinc-900 text-[12px] leading-tight">Cash on Delivery</div>
              <div className="text-[10px] text-zinc-500 font-normal">Pay upon receipt</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-zinc-900 text-[12px] leading-tight">100% Quality Checked</div>
              <div className="text-[10px] text-zinc-500 font-normal">Tested before dispatch</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-zinc-900 text-[12px] leading-tight">7-Day Easy Exchange</div>
              <div className="text-[10px] text-zinc-500 font-normal">Fast replacement support</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-zinc-900 text-[12px] leading-tight">Fast Nationwide Shipping</div>
              <div className="text-[10px] text-zinc-500 font-normal">Dhaka 24-48h, Nationwide 48-72h</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
