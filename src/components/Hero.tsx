import React from 'react';
import { Truck, ShieldCheck, RefreshCw, Award, ArrowRight } from 'lucide-react';
import { StoreSettings } from '../types';

interface HeroProps {
  settings: StoreSettings;
  onExploreClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ settings, onExploreClick }) => {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white my-6 mx-auto shadow-2xl border border-zinc-800">
      {/* Subtle Background Glow Accent */}
      <div className="absolute -right-20 -top-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-zinc-700/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 px-6 sm:px-12 py-12 sm:py-16 max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700 text-xs font-semibold tracking-wide text-emerald-400 mb-6 uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {settings.store_tagline || "Official Bangladesh Store"}
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight mb-4">
          {settings.hero_title || "Discover Products You'll Love"}
        </h1>

        <p className="text-zinc-300 text-base sm:text-lg max-w-2xl leading-relaxed mb-8">
          {settings.hero_subtitle ||
            "Quality lifestyle gadgets, electronics, and daily essentials delivered right to your doorstep anywhere in Bangladesh."}
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={onExploreClick}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-zinc-950 font-bold hover:bg-zinc-100 hover:scale-105 active:scale-95 transition-all shadow-lg text-sm sm:text-base cursor-pointer"
          >
            Shop Now
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 text-xs sm:text-sm text-zinc-400 font-medium px-2 py-1">
            <span className="flex items-center gap-1.5 text-zinc-200">
              <Truck className="w-4 h-4 text-emerald-400" />
              Inside Dhaka ৳{settings.delivery_inside_dhaka || 70}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="flex items-center gap-1.5 text-zinc-200">
              Outside Dhaka ৳{settings.delivery_outside_dhaka || 130}
            </span>
          </div>
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="border-t border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-zinc-800">
        <div className="p-4 sm:p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-white">Cash on Delivery</div>
            <div className="text-xs text-zinc-400">Pay when you receive</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-white">100% Quality</div>
            <div className="text-xs text-zinc-400">Verified authentic items</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-white">Easy Exchange</div>
            <div className="text-xs text-zinc-400">Hassle-free 7-day policy</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-white">Fast BD Shipping</div>
            <div className="text-xs text-zinc-400">24-72 hours nationwide</div>
          </div>
        </div>
      </div>
    </section>
  );
};
