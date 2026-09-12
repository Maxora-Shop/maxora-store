import React, { useState, useEffect, useRef } from 'react';
import { Tag, ChevronDown, Check, Plus, Search, X } from 'lucide-react';
import { Brand } from '../types';
import { storeService } from '../services/storeService';
import { generateSlug } from '../utils/seo';

interface BrandSelectDropdownProps {
  value?: string;
  onChange: (brandName: string, brandId?: string, brandSlug?: string) => void;
  required?: boolean;
  className?: string;
  brandsList?: Brand[];
}

export const BrandSelectDropdown: React.FC<BrandSelectDropdownProps> = ({
  value = '',
  onChange,
  required = false,
  className = '',
  brandsList,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [brands, setBrands] = useState<Brand[]>(brandsList || []);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (brandsList && brandsList.length > 0) {
      setBrands(brandsList);
    } else {
      loadBrands();
    }
  }, [brandsList]);

  const loadBrands = async () => {
    setLoading(true);
    try {
      const data = await storeService.getBrands(false);
      setBrands(data);
    } catch {
      setBrands(storeService.getCachedBrands());
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const selectedBrand = brands.find(
    (b) => b.name.toLowerCase().trim() === (value || '').toLowerCase().trim()
  );

  const handleSelect = (brand: Brand) => {
    onChange(brand.name, brand.id, brand.slug);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleAddNewBrand = async () => {
    const rawName = searchQuery.trim();
    if (!rawName) return;

    const slug = generateSlug(rawName);
    const newBrand: Partial<Brand> = {
      name: rawName,
      slug: slug || 'brand',
      active: 1,
      display_order: 99,
      description: `${rawName} genuine products`,
    };

    try {
      const saved = await storeService.saveBrand(newBrand);
      if (saved.success) {
        setBrands((prev) => [...prev, saved.brand]);
        onChange(saved.brand.name, saved.brand.id, saved.brand.slug);
        setIsOpen(false);
        setSearchQuery('');
      }
    } catch {
      onChange(rawName, `brand-${slug}`, slug);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('Other', 'brand-other', 'other');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-amber-400" />
          <span>Brand</span>
          {required && <span className="text-rose-400">*</span>}
        </span>
        {value && value.toLowerCase() !== 'other' && (
          <span className="text-[10px] text-amber-400/80 font-normal">Selected: {value}</span>
        )}
      </label>

      {/* Select Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 flex items-center justify-between cursor-pointer transition shadow-sm select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selectedBrand?.logo_url ? (
            <img
              src={selectedBrand.logo_url}
              alt={selectedBrand.name}
              className="w-5 h-5 rounded object-contain bg-white/10 shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-5 h-5 rounded bg-slate-800 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0">
              {(value || 'O').substring(0, 1).toUpperCase()}
            </div>
          )}
          <span className="truncate font-medium text-slate-200">
            {value || 'Select Brand'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {value && value !== 'Other' && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-white rounded-md transition"
              title="Reset to Other"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-amber-400' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-72 flex flex-col">
          {/* Search Field */}
          <div className="p-2 border-b border-slate-800 bg-slate-950/80 sticky top-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Search or add brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          {/* Brand Options List */}
          <div className="overflow-y-auto p-1.5 space-y-0.5 divide-y divide-slate-800/40">
            {filteredBrands.length === 0 ? (
              <div className="p-3 text-center">
                <p className="text-xs text-slate-400 mb-2">No existing brand named "{searchQuery}"</p>
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={handleAddNewBrand}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add "{searchQuery.trim()}" as New Brand</span>
                  </button>
                )}
              </div>
            ) : (
              filteredBrands.map((brand) => {
                const isSelected =
                  (value || '').toLowerCase().trim() === brand.name.toLowerCase().trim();
                const isInactive =
                  brand.active === 0 || brand.active === false || String(brand.active) === '0';

                return (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => handleSelect(brand)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition text-left ${
                      isSelected
                        ? 'bg-amber-500/15 text-amber-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                        {brand.logo_url ? (
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="w-full h-full object-contain p-0.5"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-amber-400">
                            {brand.name.substring(0, 1).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="truncate">
                        <span className="block truncate">{brand.name}</span>
                        {isInactive && (
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block">
                            (Inactive)
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0 ml-2" />}
                  </button>
                );
              })
            )}

            {/* Quick Add button if searched term is not exact match */}
            {searchQuery.trim() &&
              !brands.some(
                (b) => b.name.toLowerCase().trim() === searchQuery.toLowerCase().trim()
              ) &&
              filteredBrands.length > 0 && (
                <div className="pt-1.5 mt-1 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleAddNewBrand}
                    className="w-full flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/10 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add "{searchQuery.trim()}" as New Brand</span>
                  </button>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};
