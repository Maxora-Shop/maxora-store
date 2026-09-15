import React, { useState, useMemo, useEffect } from 'react';
import { Product, ProductRatingStats } from '../types';
import { PriceRange } from './PriceFilter';
import {
  Check,
  Search,
  Tag,
  CircleDollarSign,
  SlidersHorizontal,
  PackageCheck,
  Star,
  RotateCcw,
  X,
  Filter,
} from 'lucide-react';

export interface ProductFilterSidebarProps {
  products: Product[];
  // 1. Brand Filter
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  // 2. Price Range Filter
  priceRange: PriceRange;
  maxStorePrice?: number;
  onPriceRangeChange: (range: PriceRange) => void;
  selectedPricePreset: string;
  onSelectPricePreset: (presetId: string, range: PriceRange) => void;
  onResetPrice: () => void;
  // 3. Availability Filter
  availability: 'all' | 'in_stock' | 'out_of_stock';
  onSelectAvailability: (availability: 'all' | 'in_stock' | 'out_of_stock') => void;
  // 4. Rating Filter
  minRating: number;
  onSelectRating: (rating: number) => void;
  ratingStatsMap?: Record<string, ProductRatingStats>;
  // Global Reset
  onResetAll?: () => void;
  className?: string;
  // Mobile drawer support
  isMobileDrawer?: boolean;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const PRESET_PRICE_OPTIONS = [
  { id: 'all', label: 'All Prices', min: 0, max: 50000 },
  { id: 'under-1000', label: 'Under 1,000 TK', min: 0, max: 1000 },
  { id: '1000-2500', label: '1,000 - 2,500 TK', min: 1000, max: 2500 },
  { id: '2500-5000', label: '2,500 - 5,000 TK', min: 2500, max: 5000 },
  { id: 'above-5000', label: 'Above 5,000 TK', min: 5000, max: 50000 },
];

export const ProductFilterSidebar: React.FC<ProductFilterSidebarProps> = ({
  products,
  selectedBrand,
  onSelectBrand,
  priceRange,
  maxStorePrice = 10000,
  onPriceRangeChange,
  selectedPricePreset,
  onSelectPricePreset,
  onResetPrice,
  availability,
  onSelectAvailability,
  minRating,
  onSelectRating,
  ratingStatsMap = {},
  onResetAll,
  className = '',
  isMobileDrawer = false,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  // Brand search input
  const [brandSearch, setBrandSearch] = useState('');

  // Local Min / Max inputs for manual Price entry
  const [localMin, setLocalMin] = useState(priceRange.min ? String(priceRange.min) : '');
  const [localMax, setLocalMax] = useState(
    priceRange.max && priceRange.max < 50000 ? String(priceRange.max) : ''
  );

  // Sync local price inputs when priceRange prop changes externally
  useEffect(() => {
    setLocalMin(priceRange.min ? String(priceRange.min) : '');
    setLocalMax(priceRange.max && priceRange.max < 50000 ? String(priceRange.max) : '');
  }, [priceRange.min, priceRange.max]);

  // Handle manual price apply
  const handleApplyCustomPrice = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const minVal = Math.max(0, Number(localMin) || 0);
    const maxVal = localMax && Number(localMax) > 0 ? Number(localMax) : 50000;
    const finalMax = maxVal < minVal ? minVal : maxVal;
    onPriceRangeChange({ min: minVal, max: finalMax });
  };

  // 1. Brand counts
  const brandStats = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => {
      const b = (p.brand || '').trim();
      if (b) {
        counts.set(b, (counts.get(b) || 0) + 1);
      }
    });

    const list = Array.from(counts.entries()).map(([name, count]) => ({
      name,
      count,
    }));
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products]);

  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return brandStats;
    const q = brandSearch.toLowerCase().trim();
    return brandStats.filter((b) => b.name.toLowerCase().includes(q));
  }, [brandStats, brandSearch]);

  // 3. Availability counts
  const availabilityStats = useMemo(() => {
    let inStock = 0;
    let outOfStock = 0;
    products.forEach((p) => {
      const s = Number(p.stock || 0);
      if (s > 0) inStock++;
      else outOfStock++;
    });
    return {
      all: products.length,
      inStock,
      outOfStock,
    };
  }, [products]);

  // 4. Rating counts
  const ratingStatsCounts = useMemo(() => {
    const counts: Record<number, number> = { 4: 0, 3: 0, 2: 0, 1: 0 };
    products.forEach((p) => {
      const stats = ratingStatsMap[p.id];
      const r = stats && stats.count > 0 ? stats.average : Number(p.rating || 0);
      if (r >= 4) counts[4]++;
      if (r >= 3) counts[3]++;
      if (r >= 2) counts[2]++;
      if (r >= 1) counts[1]++;
    });
    return counts;
  }, [products, ratingStatsMap]);

  // Check if any filter is currently applied
  const hasActiveFilters =
    Boolean(selectedBrand) ||
    selectedPricePreset !== 'all' ||
    priceRange.min > 0 ||
    priceRange.max < 50000 ||
    availability !== 'all' ||
    minRating > 0;

  const renderSections = () => (
    <>
      {/* Sidebar Top Title & Global Clear Button */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-sm font-black text-zinc-900 tracking-tight">Filters</h2>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              if (onResetAll) {
                onResetAll();
              } else {
                onSelectBrand('');
                onResetPrice();
                onSelectAvailability('all');
                onSelectRating(0);
              }
            }}
            className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 transition-colors cursor-pointer"
            title="Reset all filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* =========================================================================
          SECTION 1: BRAND
          ========================================================================= */}
      <section className="space-y-3" aria-labelledby="filter-brand-heading">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-teal-600" />
            <h3 id="filter-brand-heading" className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Brand
            </h3>
          </div>
          {selectedBrand && (
            <button
              type="button"
              onClick={() => onSelectBrand('')}
              className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-0.5 transition-colors cursor-pointer"
            >
              <span>Clear</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Brand Search if more than 5 brands */}
        {brandStats.length > 5 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              placeholder="Search brands..."
              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg pl-8 pr-7 py-1.5 text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
            />
            {brandSearch && (
              <button
                type="button"
                onClick={() => setBrandSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Brand Options List */}
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
          {/* All Brands option */}
          <button
            type="button"
            onClick={() => onSelectBrand('')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              !selectedBrand
                ? 'bg-teal-50/80 text-teal-900 font-bold'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 font-medium'
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                  !selectedBrand
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-zinc-300 bg-white'
                }`}
              >
                {!selectedBrand && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span>All Brands</span>
            </div>
            <span className="text-[11px] text-zinc-400 font-normal">
              {products.length}
            </span>
          </button>

          {/* Individual Brands */}
          {filteredBrands.map((b) => {
            const isSelected = selectedBrand.toLowerCase() === b.name.toLowerCase();
            return (
              <button
                key={b.name}
                type="button"
                onClick={() => onSelectBrand(isSelected ? '' : b.name)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-50/80 text-teal-900 font-bold'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 font-medium'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-zinc-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="truncate">{b.name}</span>
                </div>
                <span className="text-[11px] text-zinc-400 font-normal shrink-0 ml-2">
                  {b.count}
                </span>
              </button>
            );
          })}

          {filteredBrands.length === 0 && (
            <div className="text-center py-3 text-xs text-zinc-400">
              No matching brands
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: PRICE RANGE
          ========================================================================= */}
      <section className="pt-4 border-t border-zinc-100 space-y-3" aria-labelledby="filter-price-heading">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CircleDollarSign className="w-3.5 h-3.5 text-teal-600" />
            <h3 id="filter-price-heading" className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Price Range
            </h3>
          </div>
          {(selectedPricePreset !== 'all' || priceRange.min > 0 || priceRange.max < 50000) && (
            <button
              type="button"
              onClick={onResetPrice}
              className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-0.5 transition-colors cursor-pointer"
            >
              <span>Reset</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Min and Max Input Fields with Apply Button */}
        <form onSubmit={handleApplyCustomPrice} className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label htmlFor="price-min-input" className="block text-[10px] text-zinc-400 font-medium mb-1">
                Min (TK)
              </label>
              <input
                id="price-min-input"
                type="number"
                min="0"
                step="50"
                placeholder="0"
                value={localMin}
                onChange={(e) => setLocalMin(e.target.value)}
                className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>
            <span className="text-zinc-400 text-xs self-end pb-2">–</span>
            <div className="flex-1">
              <label htmlFor="price-max-input" className="block text-[10px] text-zinc-400 font-medium mb-1">
                Max (TK)
              </label>
              <input
                id="price-max-input"
                type="number"
                min="0"
                step="50"
                placeholder="50,000+"
                value={localMax}
                onChange={(e) => setLocalMax(e.target.value)}
                className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>
            <div className="self-end">
              <button
                type="submit"
                className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Go
              </button>
            </div>
          </div>
        </form>

        {/* Quick Price Preset Radio Buttons */}
        <div className="space-y-1 pt-1">
          {PRESET_PRICE_OPTIONS.map((preset) => {
            const isSelected = selectedPricePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPricePreset(preset.id, { min: preset.min, max: preset.max })}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-50/80 text-teal-900 font-bold'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 font-medium'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'border-teal-600 bg-teal-600'
                        : 'border-zinc-300 bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span>{preset.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Max Price Slider Bar */}
        <div className="pt-2 border-t border-zinc-100">
          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium mb-1">
            <span className="flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-teal-600" />
              <span>Up to:</span>
            </span>
            <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              {priceRange.max >= 50000 ? 'Any Max' : `${priceRange.max.toLocaleString()} TK`}
            </span>
          </div>
          <input
            type="range"
            min={500}
            max={10000}
            step={250}
            value={Math.min(priceRange.max, 10000)}
            onChange={(e) => {
              const newMax = Number(e.target.value);
              onPriceRangeChange({ min: priceRange.min, max: newMax });
            }}
            className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
            <span>500 TK</span>
            <span>10,000+ TK</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: AVAILABILITY
          ========================================================================= */}
      <section className="pt-4 border-t border-zinc-100 space-y-3" aria-labelledby="filter-availability-heading">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <PackageCheck className="w-3.5 h-3.5 text-teal-600" />
            <h3 id="filter-availability-heading" className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Availability
            </h3>
          </div>
          {availability !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectAvailability('all')}
              className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-0.5 transition-colors cursor-pointer"
            >
              <span>Reset</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="space-y-1">
          {/* All Items */}
          <button
            type="button"
            onClick={() => onSelectAvailability('all')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              availability === 'all'
                ? 'bg-teal-50/80 text-teal-900 font-bold'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 font-medium'
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  availability === 'all'
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-zinc-300 bg-white'
                }`}
              >
                {availability === 'all' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span>All Items</span>
            </div>
            <span className="text-[11px] text-zinc-400 font-normal">
              {availabilityStats.all}
            </span>
          </button>

          {/* In Stock */}
          <button
            type="button"
            onClick={() => onSelectAvailability(availability === 'in_stock' ? 'all' : 'in_stock')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              availability === 'in_stock'
                ? 'bg-emerald-50 text-emerald-900 font-bold'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 font-medium'
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  availability === 'in_stock'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-zinc-300 bg-white'
                }`}
              >
                {availability === 'in_stock' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>In Stock</span>
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-normal">
              {availabilityStats.inStock}
            </span>
          </button>

          {/* Out of Stock */}
          <button
            type="button"
            onClick={() => onSelectAvailability(availability === 'out_of_stock' ? 'all' : 'out_of_stock')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              availability === 'out_of_stock'
                ? 'bg-rose-50 text-rose-900 font-bold'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 font-medium'
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  availability === 'out_of_stock'
                    ? 'border-rose-600 bg-rose-600 text-white'
                    : 'border-zinc-300 bg-white'
                }`}
              >
                {availability === 'out_of_stock' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-400 inline-block" />
                <span>Out of Stock</span>
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-normal">
              {availabilityStats.outOfStock}
            </span>
          </button>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: RATING
          ========================================================================= */}
      <section className="pt-4 border-t border-zinc-100 space-y-3" aria-labelledby="filter-rating-heading">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <h3 id="filter-rating-heading" className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Rating
            </h3>
          </div>
          {minRating > 0 && (
            <button
              type="button"
              onClick={() => onSelectRating(0)}
              className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-0.5 transition-colors cursor-pointer"
            >
              <span>Reset</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="space-y-1">
          {/* All Ratings */}
          <button
            type="button"
            onClick={() => onSelectRating(0)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              minRating === 0
                ? 'bg-teal-50/80 text-teal-900 font-bold'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 font-medium'
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  minRating === 0
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-zinc-300 bg-white'
                }`}
              >
                {minRating === 0 && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span>All Ratings</span>
            </div>
            <span className="text-[11px] text-zinc-400 font-normal">
              {products.length}
            </span>
          </button>

          {/* 4, 3, 2, 1 Stars and Above */}
          {[4, 3, 2, 1].map((stars) => {
            const isSelected = minRating === stars;
            const count = ratingStatsCounts[stars] || 0;
            return (
              <button
                key={stars}
                type="button"
                onClick={() => onSelectRating(isSelected ? 0 : stars)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50 text-amber-900 font-bold'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 font-medium'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : 'border-zinc-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i <= stars
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-zinc-200 text-zinc-200'
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-[11px] text-zinc-700 font-medium">& up</span>
                  </div>
                </div>
                <span className="text-[11px] text-zinc-400 font-normal">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </>
  );

  // Mobile Drawer Mode
  if (isMobileDrawer) {
    if (!isOpenMobile) return null;
    return (
      <div className="fixed inset-0 z-50 lg:hidden overflow-hidden" role="dialog" aria-modal="true">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
        {/* Drawer Panel */}
        <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
          <div className="flex items-center justify-between p-4 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <Filter className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm font-black text-zinc-900">Filters</h2>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {renderSections()}
          </div>
          <div className="p-4 border-t border-zinc-100 bg-zinc-50">
            <button
              type="button"
              onClick={onCloseMobile}
              className="w-full py-2.5 bg-zinc-950 text-white font-bold text-xs rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              View Results ({products.length})
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Left Sidebar Mode
  return (
    <aside
      id="product-filter-sidebar"
      aria-label="Product Filters"
      className={`bg-white rounded-2xl border border-zinc-200/90 p-4 sm:p-5 shadow-xs flex flex-col space-y-6 ${className}`}
    >
      {renderSections()}
    </aside>
  );
};
