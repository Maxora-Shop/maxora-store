import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Truck,
  Check,
  Zap,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Star,
  Flame,
} from 'lucide-react';
import { Product, StoreSettings } from '../types';
import { getProductSlug } from '../utils/seo';

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
      : products.filter((p) => p.active !== 0 && p.active !== false).slice(0, 4);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const count = displayProducts.length;

  useEffect(() => {
    if (currentIndex >= count && count > 0) {
      setCurrentIndex(0);
    }
  }, [count, currentIndex]);

  // Auto-rotate every 5 seconds if multiple products exist and not hovered
  useEffect(() => {
    if (count <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % count);
    }, 5000);

    return () => clearInterval(interval);
  }, [count, isHovered]);

  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (count <= 1) return;
      setCurrentIndex((prev) => (prev + 1) % count);
    },
    [count]
  );

  const handlePrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (count <= 1) return;
      setCurrentIndex((prev) => (prev - 1 + count) % count);
    },
    [count]
  );

  const currentProduct = count > 0 ? displayProducts[currentIndex] : null;

  // Secondary items for collage
  const collageItems = displayProducts.filter((_, idx) => idx !== currentIndex).slice(0, 2);

  return (
    <section className="my-3 sm:my-6 w-full">
      {/* ====================================================
          MAIN HERO CONTAINER
      ==================================================== */}
      <div
        className="relative bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white rounded-3xl p-5 sm:p-8 lg:p-12 shadow-xl border border-zinc-800/80 overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Subtle Ambient Glow */}
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* LEFT SIDE: Hero Typography, Benefits & Shop Now CTA */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-5 sm:space-y-6">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold w-fit">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official Maxora Store BD</span>
            </div>

            {/* Main Headline */}
            <div>
              <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Shop Smart, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
                  Live Better.
                </span>
              </h1>

              {/* Supporting Text */}
              <p className="text-zinc-300 text-sm sm:text-base lg:text-lg font-medium mt-3 max-w-lg leading-relaxed">
                Your Trusted Online Shopping Partner in Bangladesh. Discover verified lifestyle gadgets, smart accessories, and electronics with complete peace of mind.
              </p>
            </div>

            {/* Key Benefits Checklist */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 pt-1">
              <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Quality Products</span>
              </div>

              <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Fast Delivery</span>
              </div>

              <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Cash on Delivery</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onExploreClick}
                className="px-6 sm:px-8 py-3.5 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 font-black text-sm sm:text-base flex items-center gap-2.5 transition-all shadow-lg hover:shadow-xl active:scale-95 cursor-pointer"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4 text-emerald-600" />
              </button>

              <div className="hidden sm:flex flex-col text-xs text-zinc-400 border-l border-zinc-800 pl-4">
                <span className="text-white font-bold">100% Cash on Delivery</span>
                <span>Across all 64 districts</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Attractive Product Collage Showcase */}
          <div className="lg:col-span-6">
            {currentProduct ? (
              <div className="relative">
                {/* Main Hero Product Card */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xs">
                  {/* Top Product Controls */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-rose-600 text-white text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-md flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-white" />
                        <span>TRENDING</span>
                      </span>
                      {currentProduct.badge && (
                        <span className="bg-zinc-800 text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {currentProduct.badge}
                        </span>
                      )}
                    </div>

                    {/* Next / Prev buttons */}
                    {count > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handlePrev}
                          className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Previous Product"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNext}
                          className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Next Product"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Collage Grid: Big image + details */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    {/* Big Image (6 cols) */}
                    <div className="sm:col-span-6 aspect-square rounded-2xl bg-zinc-950/60 p-4 border border-zinc-800/80 flex items-center justify-center overflow-hidden group">
                      <a
                        href={`/product/${getProductSlug(currentProduct)}`}
                        onClick={(e) => {
                          if (!e.ctrlKey && !e.metaKey && onOpenProduct) {
                            e.preventDefault();
                            onOpenProduct(currentProduct);
                          }
                        }}
                        className="w-full h-full flex items-center justify-center cursor-pointer"
                      >
                        <img
                          src={
                            currentProduct.image_url ||
                            (currentProduct.images && currentProduct.images[0]) ||
                            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'
                          }
                          alt={currentProduct.name}
                          className="max-h-full max-w-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] group-hover:scale-108 transition-transform duration-300"
                        />
                      </a>
                    </div>

                    {/* Details (6 cols) */}
                    <div className="sm:col-span-6 flex flex-col justify-between h-full space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          {currentProduct.category || 'Lifestyle & Tech'}
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-white line-clamp-2 mt-0.5 leading-snug">
                          <a
                            href={`/product/${getProductSlug(currentProduct)}`}
                            onClick={(e) => {
                              if (!e.ctrlKey && !e.metaKey && onOpenProduct) {
                                e.preventDefault();
                                onOpenProduct(currentProduct);
                              }
                            }}
                            className="hover:text-emerald-300 transition-colors cursor-pointer"
                          >
                            {currentProduct.name}
                          </a>
                        </h3>

                        {/* Stars */}
                        <div className="flex items-center gap-1 mt-1 text-amber-400 text-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span className="font-bold text-white">4.9</span>
                          <span className="text-zinc-500 text-[10px]">(Verified)</span>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl sm:text-2xl font-black text-emerald-400">
                            ৳
                            {Math.max(
                              0,
                              Number(currentProduct.selling_price || 0) - Number(currentProduct.discount || 0)
                            ).toLocaleString('en-BD')}
                          </span>
                          {Number(currentProduct.discount || 0) > 0 && (
                            <span className="text-xs text-zinc-500 line-through">
                              ৳{Number(currentProduct.selling_price || 0).toLocaleString('en-BD')}
                            </span>
                          )}
                        </div>
                        {Number(currentProduct.discount || 0) > 0 && (
                          <span className="text-[10px] text-rose-400 font-bold">
                            Save ৳{Number(currentProduct.discount || 0).toLocaleString('en-BD')} today
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onAddToCart && onAddToCart(currentProduct)}
                          className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Add</span>
                        </button>
                        <a
                          href={`/product/${getProductSlug(currentProduct)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collage Mini Floating Cards (Collage effect on tablet/desktop) */}
                {collageItems.length > 0 && (
                  <div className="hidden sm:grid grid-cols-2 gap-3 mt-3">
                    {collageItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onOpenProduct && onOpenProduct(item)}
                        className="bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-2.5 flex items-center gap-3 transition-all cursor-pointer group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-zinc-950 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src={
                              item.image_url ||
                              (item.images && item.images[0]) ||
                              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80'
                            }
                            alt={item.name}
                            className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-emerald-300">
                            {item.name}
                          </h4>
                          <span className="text-xs font-black text-emerald-400">
                            ৳
                            {Math.max(
                              0,
                              Number(item.selling_price || 0) - Number(item.discount || 0)
                            ).toLocaleString('en-BD')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center">
                <ShoppingBag className="w-12 h-12 text-emerald-400 mb-3" />
                <h3 className="text-base font-bold text-white">Smart Gadgets & Lifestyle</h3>
                <p className="text-xs text-zinc-400 mt-1">Discover verified products with fast delivery across Bangladesh.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
