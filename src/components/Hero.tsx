import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Check,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Banknote,
  ShieldCheck,
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
  // Filter for featured products or active products
  const activeProducts = products.filter((p) => p.active !== 0 && p.active !== false);

  const heroSlides = [
    {
      pill: 'Your Trusted Online Shopping Partner',
      titlePrimary: 'Shop Smart,',
      titleAccent: 'Live Better',
      subtitle:
        'Discover top-tier electronics, modern kitchen essentials, and daily lifestyle gear with 100% Cash on Delivery across Bangladesh.',
      cta: 'Shop Now',
    },
    {
      pill: 'Flash Deals & Discounts',
      titlePrimary: 'Premium Quality,',
      titleAccent: 'Best Prices',
      subtitle:
        'Save big on verified gadgets, headphones, smart watches, and home appliances with 7-day replacement warranty.',
      cta: 'Shop Now',
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isHovered, heroSlides.length]);

  const slide = heroSlides[currentSlide];

  // Pick top 4 products for the right-hand collage representation
  const featured = activeProducts.slice(0, 4);

  return (
    <section className="my-3 sm:my-5 w-full">
      <div
        className="relative bg-gradient-to-r from-[#e0f2fe] via-[#e8f4fc] to-[#f0f7fd] border border-[#bae6fd]/70 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xs overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* LEFT SIDE: Hero Typography, Benefits & Shop Now CTA */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-5 sm:space-y-6">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0284c7]/10 text-[#0369a1] text-xs sm:text-sm font-bold w-fit">
              <span>{slide.pill}</span>
            </div>

            {/* Main Headline */}
            <div>
              <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-black text-zinc-950 tracking-tight leading-[1.12]">
                {slide.titlePrimary} <br />
                <span className="text-[#2563eb]">{slide.titleAccent}</span>
              </h1>
            </div>

            {/* Key Benefits Checklist with Dividers matching screenshot */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm font-bold text-zinc-700">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Quality Products</span>
              </div>
              <span className="text-zinc-300 font-light">|</span>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#2563eb] shrink-0" />
                <span>Fast Delivery</span>
              </div>
              <span className="text-zinc-300 font-light">|</span>
              <div className="flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Cash on Delivery</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2 flex items-center gap-4">
              <button
                type="button"
                onClick={onExploreClick}
                className="px-7 sm:px-9 py-3 sm:py-3.5 rounded-full bg-[#0f172a] hover:bg-zinc-800 text-white font-bold text-sm sm:text-base flex items-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
              >
                <span>{slide.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RIGHT SIDE: Lifestyle Gadgets Collage matching reference screenshot */}
          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[260px] sm:min-h-[320px]">
            {/* Ambient circular backdrop */}
            <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-white/70 blur-2xl pointer-events-none" />

            {/* Gadget Collage layout */}
            <div className="relative w-full max-w-lg aspect-4/3 flex items-center justify-center">
              {/* Main Headphones (Left-Center) */}
              <div className="absolute left-2 sm:left-4 top-2 sm:top-4 w-36 sm:w-52 h-36 sm:h-52 z-20 drop-shadow-xl hover:scale-105 transition-transform">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80"
                  alt="Over-ear Headphones"
                  className="w-full h-full object-contain filter drop-shadow-lg"
                />
              </div>

              {/* Smartphone (Center-Right) */}
              <div className="absolute right-12 sm:right-20 top-0 sm:top-2 w-32 sm:w-44 h-44 sm:h-60 z-30 drop-shadow-2xl hover:scale-105 transition-transform rotate-6">
                <img
                  src="https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&auto=format&fit=crop&q=80"
                  alt="Modern Smartphone"
                  className="w-full h-full object-contain filter drop-shadow-xl"
                />
              </div>

              {/* Smart Watch (Bottom-Left) */}
              <div className="absolute left-16 sm:left-24 bottom-2 sm:bottom-4 w-24 sm:w-36 h-24 sm:h-36 z-30 drop-shadow-xl hover:scale-105 transition-transform -rotate-12">
                <img
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80"
                  alt="Smart Watch"
                  className="w-full h-full object-contain filter drop-shadow-lg"
                />
              </div>

              {/* Wireless Earbuds Case (Bottom-Right) */}
              <div className="absolute right-4 sm:right-6 bottom-4 sm:bottom-6 w-24 sm:w-36 h-24 sm:h-36 z-20 drop-shadow-lg hover:scale-105 transition-transform">
                <img
                  src="https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80"
                  alt="Wireless Earbuds"
                  className="w-full h-full object-contain filter drop-shadow-md"
                />
              </div>

              {/* Cursive Handwriting Note: "Better Products ~ Better Life" */}
              <div className="absolute -bottom-2 right-12 sm:right-16 z-30 pointer-events-none select-none">
                <span className="font-serif italic text-xs sm:text-sm text-zinc-500/90 tracking-wide font-medium">
                  Better Products ~ Better Life
                </span>
              </div>
            </div>

            {/* Carousel Navigation Arrows matching screenshot */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-40">
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
                className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-zinc-800 shadow-sm border border-zinc-200 flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
                className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-zinc-800 shadow-sm border border-zinc-200 flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Pagination Dots at Bottom */}
        <div className="flex items-center justify-center gap-1.5 mt-4 sm:mt-6">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                currentSlide === idx ? 'w-6 bg-zinc-900' : 'w-2 bg-zinc-300 hover:bg-zinc-400'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
