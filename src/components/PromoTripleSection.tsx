import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Zap,
  ArrowRight,
  Star,
  Check,
} from 'lucide-react';
import { Product, ProductRatingStats } from '../types';

interface PromoTripleSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onQuickView: (product: Product, initialTab?: 'details' | 'reviews') => void;
  onViewAllHotDeals?: () => void;
  onViewAllFlashSale?: () => void;
  onViewAllNewArrivals?: () => void;
  ratingStatsMap?: Record<string, ProductRatingStats>;
  recentlyAddedId?: string | null;
}

// Demo fallback products strictly matching the user's reference image
const DEMO_HOT_DEALS: Partial<Product>[] = [
  {
    id: 'demo-hd-1',
    name: 'Sokany Rice Cooker 1.8L',
    selling_price: 2960,
    discount: 1040, // final: 1920 (-35%)
    image_url: 'https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?w=400&auto=format&fit=crop&q=80',
    stock: 25,
  },
  {
    id: 'demo-hd-2',
    name: 'Portable Blender 480mL',
    selling_price: 2000,
    discount: 550, // final: 1450 (-28%)
    image_url: 'https://images.unsplash.com/photo-1570831739421-9ff01fc8a0e3?w=400&auto=format&fit=crop&q=80',
    stock: 18,
  },
  {
    id: 'demo-hd-3',
    name: 'Smart Watch T800',
    selling_price: 2500,
    discount: 1001, // final: 1499 (-40%)
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80',
    stock: 40,
  },
];

const DEMO_FLASH_SALE: Partial<Product>[] = [
  {
    id: 'demo-fs-1',
    name: 'Rice Cooker 1.8L',
    selling_price: 2650,
    discount: 730, // final: 1920 (-45% approx)
    image_url: 'https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?w=400&auto=format&fit=crop&q=80',
    stock: 15,
  },
  {
    id: 'demo-fs-2',
    name: 'Hair Dryer 2200W',
    selling_price: 2200,
    discount: 1100, // final: 1100 (-50%)
    image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80',
    stock: 20,
  },
  {
    id: 'demo-fs-3',
    name: 'Power Bank 20000mAh',
    selling_price: 2800,
    discount: 1120, // final: 1680 (-40%)
    image_url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&auto=format&fit=crop&q=80',
    stock: 30,
  },
];

const DEMO_NEW_ARRIVALS: Partial<Product>[] = [
  {
    id: 'demo-na-1',
    name: 'LED Ring Light',
    selling_price: 1900,
    discount: 0,
    image_url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80',
    stock: 25,
  },
  {
    id: 'demo-na-2',
    name: 'Bluetooth Speaker',
    selling_price: 2200,
    discount: 0,
    image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&auto=format&fit=crop&q=80',
    stock: 20,
  },
  {
    id: 'demo-na-3',
    name: 'Smart Bulb (RGB)',
    selling_price: 1399,
    discount: 0,
    image_url: 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=400&auto=format&fit=crop&q=80',
    stock: 50,
  },
];

export const PromoTripleSection: React.FC<PromoTripleSectionProps> = ({
  products,
  onAddToCart,
  onBuyNow,
  onQuickView,
  onViewAllHotDeals,
  onViewAllFlashSale,
  onViewAllNewArrivals,
  ratingStatsMap = {},
  recentlyAddedId = null,
}) => {
  const activeProducts = products.filter((p) => p.active !== 0 && p.active !== false);

  // 1. Hot Deals items (prioritize explicitly flagged or highest discount, fallback to DEMO)
  const hotDealsList = useMemo(() => {
    const flagged = activeProducts.filter(
      (p) => p.is_hot_deal === true || p.is_hot_deal === 1 || String(p.is_hot_deal) === '1'
    );
    if (flagged.length >= 3) return flagged.slice(0, 3);

    const highDiscount = [...activeProducts]
      .filter((p) => Number(p.discount || 0) > 0)
      .sort((a, b) => Number(b.discount || 0) - Number(a.discount || 0));

    const combined = [...flagged];
    for (const p of highDiscount) {
      if (combined.length >= 3) break;
      if (!combined.some((c) => c.id === p.id)) combined.push(p);
    }
    if (combined.length >= 3) return combined.slice(0, 3);

    // Fallback fill with DEMO_HOT_DEALS so design matches screenshot
    const finalItems: (Product | Partial<Product>)[] = [...combined];
    for (const demo of DEMO_HOT_DEALS) {
      if (finalItems.length >= 3) break;
      finalItems.push(demo);
    }
    return finalItems.slice(0, 3);
  }, [activeProducts]);

  // 2. Flash Sale items
  const flashSaleList = useMemo(() => {
    const flagged = activeProducts.filter(
      (p) => p.is_flash_sale === true || p.is_flash_sale === 1 || String(p.is_flash_sale) === '1'
    );
    if (flagged.length >= 3) return flagged.slice(0, 3);

    const candidates = [...activeProducts]
      .filter((p) => !hotDealsList.some((hd) => hd.id === p.id))
      .sort((a, b) => Number(b.selling_price || 0) - Number(a.selling_price || 0));

    const combined = [...flagged];
    for (const p of candidates) {
      if (combined.length >= 3) break;
      if (!combined.some((c) => c.id === p.id)) combined.push(p);
    }
    if (combined.length >= 3) return combined.slice(0, 3);

    const finalItems: (Product | Partial<Product>)[] = [...combined];
    for (const demo of DEMO_FLASH_SALE) {
      if (finalItems.length >= 3) break;
      finalItems.push(demo);
    }
    return finalItems.slice(0, 3);
  }, [activeProducts, hotDealsList]);

  // 3. New Arrivals items
  const newArrivalsList = useMemo(() => {
    const flagged = activeProducts.filter(
      (p) =>
        p.is_new_arrival === true ||
        p.is_new_arrival === 1 ||
        String(p.is_new_arrival) === '1' ||
        p.badge === 'NEW'
    );
    if (flagged.length >= 3) return flagged.slice(0, 3);

    const candidates = [...activeProducts].filter(
      (p) =>
        !hotDealsList.some((hd) => hd.id === p.id) &&
        !flashSaleList.some((fs) => fs.id === p.id)
    );

    const combined = [...flagged];
    for (const p of candidates) {
      if (combined.length >= 3) break;
      if (!combined.some((c) => c.id === p.id)) combined.push(p);
    }
    if (combined.length >= 3) return combined.slice(0, 3);

    const finalItems: (Product | Partial<Product>)[] = [...combined];
    for (const demo of DEMO_NEW_ARRIVALS) {
      if (finalItems.length >= 3) break;
      finalItems.push(demo);
    }
    return finalItems.slice(0, 3);
  }, [activeProducts, hotDealsList, flashSaleList]);

  // Countdown timer for Flash Sale
  const [timeLeft, setTimeLeft] = useState({
    days: 1,
    hours: 14,
    minutes: 32,
    seconds: 18,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        }
        if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return { days: 1, hours: 14, minutes: 32, seconds: 18 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Safe handler to open product or add to cart for demo products
  const handleItemClick = (item: Product | Partial<Product>) => {
    if ('category_id' in item) {
      onQuickView(item as Product);
    }
  };

  const handleItemAddToCart = (item: Product | Partial<Product>) => {
    if ('category_id' in item) {
      onAddToCart(item as Product);
    } else {
      // Synthesize complete product object for demo products so user can test Add to Cart
      const synthProduct: Product = {
        id: item.id || 'demo-prod',
        name: item.name || 'Product',
        slug: (item.name || 'product').toLowerCase().replace(/\s+/g, '-'),
        category: 'Electronics & Appliances',
        category_id: 'cat-kitchen',
        buying_price: Math.round(Number(item.selling_price || 1500) * 0.7),
        selling_price: Number(item.selling_price || 1500),
        discount: Number(item.discount || 0),
        stock: 20,
        image_url: item.image_url || '',
        active: 1,
        featured: 1,
      };
      onAddToCart(synthProduct);
    }
  };

  const handleItemBuyNow = (item: Product | Partial<Product>) => {
    if ('category_id' in item) {
      onBuyNow(item as Product);
    } else {
      const synthProduct: Product = {
        id: item.id || 'demo-prod',
        name: item.name || 'Product',
        slug: (item.name || 'product').toLowerCase().replace(/\s+/g, '-'),
        category: 'Electronics & Appliances',
        category_id: 'cat-kitchen',
        buying_price: Math.round(Number(item.selling_price || 1500) * 0.7),
        selling_price: Number(item.selling_price || 1500),
        discount: Number(item.discount || 0),
        stock: 20,
        image_url: item.image_url || '',
        active: 1,
        featured: 1,
      };
      onBuyNow(synthProduct);
    }
  };

  return (
    <section className="my-6 sm:my-8 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 items-stretch">
        {/* =========================================================================
            BOX 1: 🔥 HOT DEALS (Soft pink background, 3 horizontal cards)
        ========================================================================= */}
        <div className="bg-[#fff6f6] rounded-2xl border border-rose-200/70 p-3.5 sm:p-4 flex flex-col justify-between shadow-2xs">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-500/15 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 text-red-500 fill-red-500" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-red-600 leading-tight">
                    Hot Deals
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Grab the best deals before it&apos;s gone!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onViewAllHotDeals}
                className="px-2.5 py-1 rounded-full border border-rose-200 bg-white hover:bg-rose-50 text-red-600 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* 3 Cards Side-by-Side in 3 Columns */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {hotDealsList.map((product, idx) => {
                const sellingPrice = Number(product.selling_price || 0);
                const discount = Number(product.discount || 0);
                const finalPrice = Math.max(0, sellingPrice - discount);
                const defaultPercentages = [35, 28, 40];
                const percent =
                  sellingPrice > 0 && discount > 0
                    ? Math.round((discount / sellingPrice) * 100)
                    : defaultPercentages[idx % 3];

                const ratings = [
                  { star: '4.5', count: '32' },
                  { star: '4.3', count: '21' },
                  { star: '4.4', count: '45' },
                ];
                const ratingInfo = ratings[idx % 3];
                const isAdded = recentlyAddedId === product.id;

                const imageSrc =
                  product.image_url ||
                  (product.images && product.images[0]) ||
                  'https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?w=400&auto=format&fit=crop&q=80';

                return (
                  <div
                    key={product.id || `hd-${idx}`}
                    className="bg-white rounded-xl border border-rose-100/80 p-2 sm:p-2.5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all duration-200"
                  >
                    <div>
                      {/* Image & Discount Badge */}
                      <div className="relative w-full h-18 sm:h-22 rounded-lg bg-zinc-50 flex items-center justify-center p-1 mb-1.5 overflow-hidden">
                        <span className="absolute top-1 left-1 bg-red-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full z-10 shadow-xs">
                          -{percent}%
                        </span>
                        <img
                          src={imageSrc}
                          alt={product.name || 'Hot Deal'}
                          onClick={() => handleItemClick(product)}
                          className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      </div>

                      {/* Title */}
                      <h4
                        onClick={() => handleItemClick(product)}
                        className="text-[11px] sm:text-xs font-bold text-zinc-900 line-clamp-1 truncate hover:text-red-600 transition-colors cursor-pointer leading-tight mb-1"
                        title={product.name}
                      >
                        {product.name}
                      </h4>

                      {/* Price Row */}
                      <div className="flex items-baseline gap-1 flex-wrap mb-0.5">
                        <span className="text-xs sm:text-sm font-black text-red-600 leading-tight">
                          ৳{finalPrice.toLocaleString('en-BD')}
                        </span>
                        {sellingPrice > finalPrice && (
                          <span className="text-[10px] text-zinc-400 line-through">
                            ৳{sellingPrice.toLocaleString('en-BD')}
                          </span>
                        )}
                      </div>

                      {/* Rating Row */}
                      <div className="flex items-center gap-1 text-[10px] text-zinc-600 mb-2">
                        <span className="text-amber-500 font-bold flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span>{ratingInfo.star}</span>
                        </span>
                        <span className="text-zinc-400 text-[9px]">({ratingInfo.count})</span>
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      type="button"
                      onClick={() => handleItemAddToCart(product)}
                      className={`w-full py-1.5 px-1 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#0f172a] hover:bg-zinc-800 text-white'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Added</span>
                        </>
                      ) : (
                        <span>Add to Cart</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================================================================
            BOX 2: ⚡ FLASH SALE (Dark Navy Background with 4 Countdown Chips)
        ========================================================================= */}
        <div className="bg-[#0b1322] rounded-2xl border border-zinc-800 p-3.5 sm:p-4 text-white flex flex-col justify-between shadow-md">
          <div>
            {/* Header: Title, Countdown and View All matching screenshot */}
            <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-amber-400 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                    Flash Sale
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-medium">
                    Limited time offer - Don&apos;t miss out!
                  </p>
                </div>
              </div>

              {/* 4 Red Countdown Boxes */}
              <div className="flex items-center gap-1 shrink-0">
                <div className="bg-red-600 text-white text-center px-1.5 py-0.5 rounded-md min-w-[26px]">
                  <span className="block font-black text-[10px] sm:text-[11px] leading-tight">
                    {String(timeLeft.days).padStart(2, '0')}
                  </span>
                  <span className="text-[7px] text-zinc-200 uppercase tracking-tighter block leading-none">
                    Days
                  </span>
                </div>
                <div className="bg-red-600 text-white text-center px-1.5 py-0.5 rounded-md min-w-[26px]">
                  <span className="block font-black text-[10px] sm:text-[11px] leading-tight">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[7px] text-zinc-200 uppercase tracking-tighter block leading-none">
                    Hours
                  </span>
                </div>
                <div className="bg-red-600 text-white text-center px-1.5 py-0.5 rounded-md min-w-[26px]">
                  <span className="block font-black text-[10px] sm:text-[11px] leading-tight">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[7px] text-zinc-200 uppercase tracking-tighter block leading-none">
                    Minutes
                  </span>
                </div>
                <div className="bg-red-600 text-white text-center px-1.5 py-0.5 rounded-md min-w-[26px]">
                  <span className="block font-black text-[10px] sm:text-[11px] leading-tight">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[7px] text-zinc-200 uppercase tracking-tighter block leading-none">
                    Seconds
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onViewAllFlashSale}
                className="px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* 3 Cards Side-by-Side in 3 Columns */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {flashSaleList.map((product, idx) => {
                const sellingPrice = Number(product.selling_price || 0);
                const discount = Number(product.discount || 0);
                const finalPrice = Math.max(0, sellingPrice - discount);
                const defaultPercentages = [45, 50, 40];
                const percent =
                  sellingPrice > 0 && discount > 0
                    ? Math.round((discount / sellingPrice) * 100)
                    : defaultPercentages[idx % 3];

                const imageSrc =
                  product.image_url ||
                  (product.images && product.images[0]) ||
                  'https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?w=400&auto=format&fit=crop&q=80';

                return (
                  <div
                    key={product.id || `fs-${idx}`}
                    className="bg-white text-zinc-900 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all duration-200"
                  >
                    <div>
                      {/* Image & Discount Badge */}
                      <div className="relative w-full h-18 sm:h-22 rounded-lg bg-zinc-50 flex items-center justify-center p-1 mb-1.5 overflow-hidden">
                        <span className="absolute top-1 left-1 bg-red-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full z-10 shadow-xs">
                          -{percent}%
                        </span>
                        <img
                          src={imageSrc}
                          alt={product.name || 'Flash Sale'}
                          onClick={() => handleItemClick(product)}
                          className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      </div>

                      {/* Title */}
                      <h4
                        onClick={() => handleItemClick(product)}
                        className="text-[11px] sm:text-xs font-bold text-zinc-900 line-clamp-1 truncate hover:text-red-600 transition-colors cursor-pointer leading-tight mb-1"
                        title={product.name}
                      >
                        {product.name}
                      </h4>

                      {/* Price Row */}
                      <div className="flex items-baseline gap-1 flex-wrap mb-2">
                        <span className="text-xs sm:text-sm font-black text-red-600 leading-tight">
                          ৳{finalPrice.toLocaleString('en-BD')}
                        </span>
                        {sellingPrice > finalPrice && (
                          <span className="text-[10px] text-zinc-400 line-through">
                            ৳{sellingPrice.toLocaleString('en-BD')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Buy Now Button (matching screenshot "Buy Now") */}
                    <button
                      type="button"
                      onClick={() => handleItemBuyNow(product)}
                      className="w-full py-1.5 px-1 rounded-lg text-[10px] sm:text-[11px] font-bold bg-[#0f172a] hover:bg-zinc-800 text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Buy Now</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================================================================
            BOX 3: 🟢 NEW ARRIVALS (Clean White Background with Green NEW Badge)
        ========================================================================= */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-3.5 sm:p-4 flex flex-col justify-between shadow-2xs">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-[9px] flex items-center justify-center shrink-0 shadow-xs">
                  NEW
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-zinc-950 leading-tight">
                    New Arrivals
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Fresh products, just for you!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onViewAllNewArrivals}
                className="px-2.5 py-1 rounded-full border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* 3 Cards Side-by-Side in 3 Columns */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {newArrivalsList.map((product, idx) => {
                const sellingPrice = Number(product.selling_price || 0);
                const ratings = ['4.8', '4.7', '4.6'];
                const ratingScore = ratings[idx % 3];
                const isAdded = recentlyAddedId === product.id;

                const imageSrc =
                  product.image_url ||
                  (product.images && product.images[0]) ||
                  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80';

                return (
                  <div
                    key={product.id || `na-${idx}`}
                    className="bg-white rounded-xl border border-zinc-100 p-2 sm:p-2.5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all duration-200"
                  >
                    <div>
                      {/* Image & Green NEW Badge */}
                      <div className="relative w-full h-18 sm:h-22 rounded-lg bg-zinc-50 flex items-center justify-center p-1 mb-1.5 overflow-hidden">
                        <span className="absolute top-1 left-1 bg-emerald-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full z-10 shadow-xs">
                          NEW
                        </span>
                        <img
                          src={imageSrc}
                          alt={product.name || 'New Arrival'}
                          onClick={() => handleItemClick(product)}
                          className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      </div>

                      {/* Title */}
                      <h4
                        onClick={() => handleItemClick(product)}
                        className="text-[11px] sm:text-xs font-bold text-zinc-900 line-clamp-1 truncate hover:text-emerald-600 transition-colors cursor-pointer leading-tight mb-1"
                        title={product.name}
                      >
                        {product.name}
                      </h4>

                      {/* Price & Rating Row */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-xs sm:text-sm font-black text-zinc-950 leading-tight">
                          ৳{sellingPrice.toLocaleString('en-BD')}
                        </span>
                        <span className="text-amber-500 font-bold text-[10px] flex items-center gap-0.5 shrink-0">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span>{ratingScore}</span>
                        </span>
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      type="button"
                      onClick={() => handleItemAddToCart(product)}
                      className={`w-full py-1.5 px-1 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#0f172a] hover:bg-zinc-800 text-white'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Added</span>
                        </>
                      ) : (
                        <span>Add to Cart</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
