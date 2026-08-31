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
    <section className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white my-4 sm:my-6 mx-auto shadow-2xl border border-zinc-800/90 max-w-7xl">
      {/* Background Ambience Glows */}
      <div
        aria-hidden="true"
        className="absolute -right-24 -top-24 w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -left-24 -bottom-24 w-[450px] h-[450px] bg-zinc-700/20 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-950/20 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative z-10 p-6 sm:p-10 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* ====================================================
              LEFT COLUMN: HERO COPY & VALUE PROPOSITIONS (50%)
          ==================================================== */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6 sm:space-y-7">
            {/* Small Premium Badge */}
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] sm:text-xs font-bold tracking-wider text-emerald-400 shadow-sm backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span>PREMIUM PRODUCTS • TRUSTED SERVICE</span>
              </div>
            </div>

            {/* Main Heading */}
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black tracking-tight text-white leading-[1.12]">
                <span className="block">Premium Products.</span>
                <span className="block text-zinc-100">Made for Everyday Life.</span>
              </h1>
            </div>

            {/* Supporting Text */}
            <p className="text-zinc-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl font-normal">
              Discover smart gadgets, lifestyle essentials and everyday products — delivered across Bangladesh.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <button
                type="button"
                onClick={onExploreClick}
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 rounded-full bg-white text-zinc-950 font-extrabold hover:bg-zinc-100 hover:shadow-emerald-500/10 active:scale-95 transition-all shadow-lg text-sm sm:text-base cursor-pointer group"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={onExploreClick}
                className="inline-flex items-center justify-center px-5 sm:px-6 py-3.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 hover:text-white font-bold border border-zinc-700/80 active:scale-95 transition-all text-sm sm:text-base cursor-pointer"
              >
                <span>Explore Categories</span>
              </button>
            </div>

            {/* Trust & Guarantee Indicators */}
            <div className="pt-2 border-t border-zinc-800/80">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm text-zinc-300 font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 text-base shrink-0">🚚</span>
                  <span className="font-semibold text-zinc-200">Cash on Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 text-base font-black shrink-0">✓</span>
                  <span className="font-semibold text-zinc-200">Quality Checked</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 text-base shrink-0">↔</span>
                  <span className="font-semibold text-zinc-200">Easy Exchange</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 text-base shrink-0">⚡</span>
                  <span className="font-semibold text-zinc-200">Fast Delivery</span>
                </div>
              </div>
            </div>

            {/* Delivery Charge Overview */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs text-zinc-400 bg-zinc-900/50 p-2.5 sm:p-3 rounded-2xl border border-zinc-800/70">
              <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
                <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Inside Dhaka: <strong className="text-white">৳{settings.delivery_inside_dhaka || 70}</strong></span>
              </div>
              <span className="text-zinc-700 hidden sm:inline">•</span>
              <div className="text-zinc-200 font-medium">
                <span>Dhaka Sub Area: <strong className="text-white">৳{settings.delivery_sub_dhaka || 100}</strong></span>
              </div>
              <span className="text-zinc-700 hidden sm:inline">•</span>
              <div className="text-zinc-200 font-medium">
                <span>Outside Dhaka: <strong className="text-white">৳{settings.delivery_outside_dhaka || 130}</strong></span>
              </div>
            </div>
          </div>

          {/* ====================================================
              RIGHT COLUMN: FEATURED PRODUCT CARD & ROTATION (50%)
          ==================================================== */}
          <div
            className="lg:col-span-6 relative w-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {currentProduct ? (
              <div className="relative bg-zinc-900/85 backdrop-blur-md rounded-3xl border border-zinc-800/90 shadow-2xl p-4 sm:p-6 overflow-hidden">
                {/* Subtle Card Background Glow */}
                <div
                  aria-hidden="true"
                  className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"
                />

                {/* Card Header: Featured Pill & Slide Navigation */}
                <div className="relative z-10 flex items-center justify-between gap-2 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[10px] sm:text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Featured Product</span>
                    </span>
                    {currentProduct.badge && (
                      <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[10px] font-bold uppercase tracking-wider">
                        {currentProduct.badge}
                      </span>
                    )}
                  </div>

                  {/* Previous / Next Arrow Controls (if multiple featured products) */}
                  {count > 1 && (
                    <div className="flex items-center gap-1 bg-zinc-950/70 p-1 rounded-xl border border-zinc-800">
                      <button
                        type="button"
                        onClick={handlePrev}
                        aria-label="Previous Featured Product"
                        className="w-7 h-7 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        aria-label="Next Featured Product"
                        className="w-7 h-7 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Animated Featured Product Container */}
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentProduct.id || currentIndex}
                    custom={direction}
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="relative z-10 flex flex-col space-y-4"
                  >
                    {/* Visual Product Showcase Box */}
                    <div
                      onClick={() => onOpenProduct && onOpenProduct(currentProduct)}
                      className="relative aspect-[4/3] sm:aspect-[16/10] w-full rounded-2xl bg-gradient-to-b from-zinc-950/90 to-zinc-900/90 border border-zinc-800/90 flex items-center justify-center p-4 sm:p-6 overflow-hidden cursor-pointer group shadow-inner"
                    >
                      {/* Product Image */}
                      <img
                        src={productImage}
                        alt={currentProduct.name}
                        className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="eager"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
                        }}
                      />

                      {/* Floating Discount Tag */}
                      {hasDiscount && (
                        <div className="absolute top-3 left-3 bg-rose-600/95 text-white font-extrabold text-[10px] sm:text-xs px-2.5 py-1 rounded-lg shadow-lg border border-rose-500/40 backdrop-blur-xs">
                          SAVE ৳{discount.toLocaleString('en-BD')}
                        </div>
                      )}

                      {/* Floating Category Pill */}
                      <div className="absolute top-3 right-3 bg-zinc-900/90 text-zinc-300 text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-lg border border-zinc-700/80 backdrop-blur-xs">
                        {currentProduct.category || 'Maxora Collection'}
                      </div>

                      {/* Hover Overlay Hint */}
                      <div className="absolute inset-0 bg-zinc-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-900/90 text-white text-xs font-bold shadow-lg border border-zinc-700">
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Quick View</span>
                        </span>
                      </div>
                    </div>

                    {/* Product Details & Actions */}
                    <div className="space-y-3 pt-1">
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
                        <div className="min-w-0 flex-1">
                          <h2
                            onClick={() => onOpenProduct && onOpenProduct(currentProduct)}
                            className="font-extrabold text-base sm:text-lg text-white truncate hover:text-emerald-400 transition-colors cursor-pointer"
                            title={currentProduct.name}
                          >
                            {currentProduct.name}
                          </h2>
                          {currentProduct.description && (
                            <p className="text-zinc-400 text-xs sm:text-sm line-clamp-1 mt-0.5">
                              {currentProduct.description}
                            </p>
                          )}
                        </div>

                        {/* Price Presentation */}
                        <div className="flex items-baseline sm:flex-col sm:items-end gap-2 sm:gap-0 shrink-0">
                          <div className="text-lg sm:text-xl font-black text-emerald-400">
                            ৳{finalPrice.toLocaleString('en-BD')}
                          </div>
                          {hasDiscount && (
                            <div className="text-xs sm:text-sm text-zinc-500 line-through font-medium">
                              ৳{sellingPrice.toLocaleString('en-BD')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interactive Buttons */}
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => onOpenProduct && onOpenProduct(currentProduct)}
                          className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                          <span>Shop Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onAddToCart && onAddToCart(currentProduct)}
                          className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all border border-zinc-700 active:scale-95 cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Bottom Navigation Dots (if multiple featured products) */}
                {count > 1 && (
                  <div className="relative z-10 flex items-center justify-center gap-2 pt-4 border-t border-zinc-800/80 mt-4">
                    {displayProducts.map((p, idx) => (
                      <button
                        key={p.id || idx}
                        type="button"
                        onClick={(e) => handleSelectDot(idx, e)}
                        aria-label={`View featured product ${idx + 1}: ${p.name}`}
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
            ) : (
              /* Fallback when no products are in the database yet */
              <div className="bg-zinc-900/80 rounded-3xl border border-zinc-800 p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800 text-emerald-400 flex items-center justify-center mb-3">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Explore Our Catalog</h3>
                <p className="text-xs text-zinc-400 max-w-xs mb-4">
                  Smart lifestyle gadgets and daily essentials with fast Cash on Delivery across Bangladesh.
                </p>
                <button
                  type="button"
                  onClick={onExploreClick}
                  className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs"
                >
                  Browse Products →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
