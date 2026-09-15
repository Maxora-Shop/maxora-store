import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, ChevronDown, Check } from 'lucide-react';
import { ProductSortOption } from '../types';

interface ProductSortDropdownProps {
  value: ProductSortOption;
  onChange: (value: ProductSortOption) => void;
  className?: string;
}

export const SORT_OPTIONS: { value: ProductSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'best_selling', label: 'Best Selling' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export const ProductSortDropdown: React.FC<ProductSortDropdownProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = SORT_OPTIONS.find((opt) => opt.value === value) || SORT_OPTIONS[0];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div
      ref={dropdownRef}
      id="product-sort-container"
      className={`relative inline-block text-left ${className}`}
    >
      <div className="flex items-center gap-2">
        <label
          htmlFor="product-sort-trigger"
          className="text-xs font-bold text-zinc-500 hidden sm:inline whitespace-nowrap"
        >
          Sort by:
        </label>
        <button
          id="product-sort-trigger"
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`Sort products, currently sorted by ${selectedOption.label}`}
          className="inline-flex items-center justify-between gap-2.5 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold text-zinc-800 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs transition-all cursor-pointer min-w-[150px] sm:min-w-[170px]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="font-bold text-zinc-900 truncate">{selectedOption.label}</span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180 text-zinc-700' : ''
            }`}
          />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          id="product-sort-menu"
          aria-label="Sort options"
          className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-zinc-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3.5 py-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 mb-1">
            Sort by
          </div>
          {SORT_OPTIONS.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <button
                key={opt.value}
                id={`sort-option-${opt.value}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm transition-colors text-left cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-900 font-bold'
                    : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 font-medium'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
