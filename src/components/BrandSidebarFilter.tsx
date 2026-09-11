import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { Check, Search, Tag, X } from 'lucide-react';

interface BrandSidebarFilterProps {
  products: Product[];
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  className?: string;
}

export const BrandSidebarFilter: React.FC<BrandSidebarFilterProps> = ({
  products,
  selectedBrand,
  onSelectBrand,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique brands and count occurrences from the provided products list
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

    // Sort alphabetically
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products]);

  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brandStats;
    const q = searchQuery.toLowerCase().trim();
    return brandStats.filter((b) => b.name.toLowerCase().includes(q));
  }, [brandStats, searchQuery]);

  if (brandStats.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-orange-600" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Brands</h3>
        </div>
        {selectedBrand && (
          <button
            type="button"
            onClick={() => onSelectBrand('')}
            className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
          >
            <span>Clear</span>
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Brand Search if more than 5 brands */}
      {brandStats.length > 5 && (
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search brands..."
            className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg pl-8 pr-3 py-1.5 text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Brand List */}
      <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
        {/* All Brands Option */}
        <button
          type="button"
          onClick={() => onSelectBrand('')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            !selectedBrand
              ? 'bg-orange-50 text-orange-700 font-bold'
              : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                !selectedBrand
                  ? 'border-orange-600 bg-orange-600 text-white'
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

        {/* Filtered Brands */}
        {filteredBrands.map((b) => {
          const isSelected = selectedBrand.toLowerCase() === b.name.toLowerCase();
          return (
            <button
              key={b.name}
              type="button"
              onClick={() => onSelectBrand(isSelected ? '' : b.name)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-orange-50 text-orange-700 font-bold'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'border-orange-600 bg-orange-600 text-white'
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
            No matching brands found
          </div>
        )}
      </div>
    </div>
  );
};
