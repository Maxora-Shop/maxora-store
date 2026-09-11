import React from 'react';
import { SlidersHorizontal, RotateCcw, CircleDollarSign } from 'lucide-react';

export interface PriceRange {
  min: number;
  max: number;
}

interface PriceFilterProps {
  priceRange: PriceRange;
  maxProductPrice?: number;
  onPriceRangeChange: (range: PriceRange) => void;
  selectedPreset: string;
  onSelectPreset: (presetId: string, range: PriceRange) => void;
  onResetPrice: () => void;
}

export const PRESET_PRICE_OPTIONS = [
  { id: 'all', label: 'All Budgets', min: 0, max: 50000 },
  { id: 'under-1000', label: 'Under 1,000 TK', min: 0, max: 1000 },
  { id: '1000-2500', label: '1,000 - 2,500 TK', min: 1000, max: 2500 },
  { id: '2500-5000', label: '2,500 - 5,000 TK', min: 2500, max: 5000 },
  { id: 'above-5000', label: 'Above 5,000 TK', min: 5000, max: 50000 },
];

export const PriceFilter: React.FC<PriceFilterProps> = ({
  priceRange,
  maxProductPrice = 10000,
  onPriceRangeChange,
  selectedPreset,
  onSelectPreset,
  onResetPrice,
}) => {
  const isCustomOrFiltered =
    selectedPreset !== 'all' ||
    priceRange.min > 0 ||
    priceRange.max < maxProductPrice;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Number(e.target.value);
    onPriceRangeChange({ min: priceRange.min, max: newMax });
  };

  return (
    <div
      id="price-filter-section"
      className="p-3 sm:p-4 bg-zinc-50 border border-zinc-200/90 rounded-2xl mb-6 shadow-2xs max-w-full overflow-hidden"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <CircleDollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-extrabold text-zinc-950 flex items-center gap-2">
              <span>Filter by Budget (TK)</span>
              {isCustomOrFiltered && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  Active
                </span>
              )}
            </div>
            <div className="text-[11px] text-zinc-500">
              Select preset brackets or adjust maximum price slider
            </div>
          </div>
        </div>

        {/* Current Active Price Range Readout & Clear Button */}
        <div className="flex items-center gap-2.5 self-start lg:self-auto">
          <div className="px-3 py-1 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 shadow-2xs">
            <span>{priceRange.min.toLocaleString()} TK</span>
            <span className="text-zinc-400 mx-1.5">–</span>
            <span>{priceRange.max >= 50000 ? 'Any Max' : `${priceRange.max.toLocaleString()} TK`}</span>
          </div>

          {isCustomOrFiltered && (
            <button
              type="button"
              onClick={onResetPrice}
              className="px-2.5 py-1 text-xs font-bold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset price filter"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Price Filtering Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 max-w-full scrollbar-none">
        {PRESET_PRICE_OPTIONS.map((preset) => {
          const isSelected = selectedPreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset.id, { min: preset.min, max: preset.max })}
              className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs active:scale-95 ${
                isSelected
                  ? 'bg-zinc-950 text-white shadow-sm'
                  : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Price Slider Bar */}
      <div className="mt-3 pt-3 border-t border-zinc-200/80 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
          <span>Max Price:</span>
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            {priceRange.max >= 10000 ? '10,000+ TK' : `${priceRange.max.toLocaleString()} TK`}
          </span>
        </div>

        <div className="flex-1 w-full flex items-center gap-3">
          <span className="text-[11px] font-semibold text-zinc-400">500 TK</span>
          <input
            type="range"
            min={500}
            max={10000}
            step={250}
            value={Math.min(priceRange.max, 10000)}
            onChange={handleSliderChange}
            className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <span className="text-[11px] font-semibold text-zinc-400">10,000 TK</span>
        </div>
      </div>
    </div>
  );
};
