import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  LayoutGrid,
  ChevronRight,
  X,
  ArrowRight,
  Search,
} from 'lucide-react';
import { TaxonomyFilterState } from '../utils/taxonomy';

export interface MegaMenuProductType {
  id?: string;
  name: string;
  slug: string;
  count?: number;
}

export interface MegaMenuSubItem {
  id?: string;
  name: string;
  slug: string;
  count?: number;
  parentCatSlug: string;
  parentCatId?: string;
  productTypes?: MegaMenuProductType[];
}

export interface MegaMenuCategoryItem {
  id?: string;
  name: string;
  slug: string;
  icon?: React.ReactNode;
  count?: number;
  subcategories: MegaMenuSubItem[];
}

export interface CategoryMegaMenuProps {
  isOpen: boolean;
  activeMenu: string | null; // 'all' | category slug
  allCategories: MegaMenuCategoryItem[];
  currentCategory?: MegaMenuCategoryItem | null;
  currentFilter?: Partial<TaxonomyFilterState>;
  onSelectTaxonomy: (filter: {
    category?: string;
    subCategory?: string;
    productType?: string;
    childCategory?: string;
    categoryId?: string;
    subCategoryId?: string;
  }) => void;
  onClose: () => void;
}

export const CategoryMegaMenu: React.FC<CategoryMegaMenuProps> = ({
  isOpen,
  activeMenu,
  allCategories,
  currentCategory,
  currentFilter,
  onSelectTaxonomy,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const filterState: Partial<TaxonomyFilterState> = currentFilter || {};
  const [searchQuery, setSearchQuery] = useState('');

  // Filter categories and subcategories when searching
  const displayedCategories = useMemo(() => {
    if (!searchQuery.trim()) return allCategories;
    const q = searchQuery.toLowerCase().trim();
    return allCategories
      .map((cat) => {
        const catMatch = cat.name.toLowerCase().includes(q) || cat.slug.toLowerCase().includes(q);
        const matchedSubs = cat.subcategories.filter(
          (sub) => sub.name.toLowerCase().includes(q) || sub.slug.toLowerCase().includes(q)
        );
        if (catMatch) return cat;
        if (matchedSubs.length > 0) {
          return {
            ...cat,
            subcategories: matchedSubs,
          };
        }
        return null;
      })
      .filter(Boolean) as MegaMenuCategoryItem[];
  }, [allCategories, searchQuery]);

  // Close on Escape key or outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // Check if click was on a nav bar category button
        const navTarget = (e.target as HTMLElement)?.closest('[data-nav-category-button="true"]');
        if (navTarget) return;
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !activeMenu) return null;

  const isAllCategories = activeMenu === 'all';

  // Subcategory click handler
  const handleSubCategoryClick = (
    catSlug: string,
    catId?: string,
    subSlug?: string,
    subId?: string
  ) => {
    onSelectTaxonomy({
      category: catSlug,
      subCategory: subSlug || '',
      productType: '',
      childCategory: '',
      categoryId: catId || '',
      subCategoryId: subId || '',
    });
    onClose();

    setTimeout(() => {
      const catalogEl = document.getElementById('products-catalog-section');
      if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  // Product Type click handler
  const handleProductTypeClick = (
    catSlug: string,
    catId?: string,
    subSlug?: string,
    subId?: string,
    ptSlug?: string
  ) => {
    onSelectTaxonomy({
      category: catSlug,
      subCategory: subSlug || '',
      productType: ptSlug || '',
      childCategory: '',
      categoryId: catId || '',
      subCategoryId: subId || '',
    });
    onClose();

    setTimeout(() => {
      const catalogEl = document.getElementById('products-catalog-section');
      if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  // Main Category View All click handler
  const handleMainCategoryClick = (catSlug: string, catId?: string) => {
    onSelectTaxonomy({
      category: catSlug,
      subCategory: '',
      productType: '',
      childCategory: '',
      categoryId: catId || '',
      subCategoryId: '',
    });
    onClose();

    setTimeout(() => {
      const catalogEl = document.getElementById('products-catalog-section');
      if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  // Reset to All Products
  const handleBrowseAllProducts = () => {
    onSelectTaxonomy({
      category: '',
      subCategory: '',
      productType: '',
      childCategory: '',
      categoryId: '',
      subCategoryId: '',
    });
    onClose();

    setTimeout(() => {
      const catalogEl = document.getElementById('products-catalog-section');
      if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  return (
    <>
      {/* Subtle backdrop to focus attention on mega-menu */}
      <div
        className="fixed inset-0 top-[110px] sm:top-[115px] bg-slate-950/20 backdrop-blur-[1px] z-35 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* White Mega-Menu floating directly below category bar */}
      <div
        ref={containerRef}
        id="category-mega-menu"
        data-mega-menu="true"
        className="absolute top-full left-0 right-0 z-40 w-full flex justify-center pointer-events-auto shadow-2xl shadow-slate-900/10"
        role="region"
        aria-label="Category mega navigation menu"
      >
        <div className="max-w-7xl w-full px-3 sm:px-6">
          <div className="bg-white rounded-b-2xl border border-zinc-200/90 border-t-0 shadow-xl p-5 sm:p-7 md:p-8 text-zinc-800 animate-in fade-in-50 slide-in-from-top-1 duration-150 max-h-[78vh] overflow-y-auto">
            
            {/* =========================================================================
                SCENARIO A: "ALL CATEGORIES" MEGA-MENU (Organized Multi-Column Grid)
               ========================================================================= */}
            {isAllCategories ? (
              <div>
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold shrink-0">
                      <LayoutGrid className="w-4 h-4" />
                    </span>
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
                        <span>All Categories</span>
                        <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                          {allCategories.length} Departments
                        </span>
                      </h2>
                      <p className="text-xs text-zinc-500 font-normal mt-0.5">
                        Browse all store departments and explore corresponding subcategories
                      </p>
                    </div>
                  </div>

                  {/* Search and Action Buttons */}
                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="relative flex-1 sm:w-56">
                      <input
                        type="text"
                        placeholder="Filter categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-50 text-zinc-800 placeholder-zinc-400 text-xs pl-8 pr-7 py-1.5 rounded-lg border border-zinc-200 focus:outline-none focus:border-teal-600 focus:bg-white transition-colors"
                      />
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2 top-1.5 text-zinc-400 hover:text-zinc-600 text-xs w-4 h-4 rounded-full flex items-center justify-center cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleBrowseAllProducts}
                      className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <span>Browse All</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      aria-label="Close menu"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Grid of All Main Categories with their Subcategories */}
                {displayedCategories.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400 text-xs">
                    No categories or subcategories matched &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-7 items-start">
                    {displayedCategories.map((cat) => {
                      const isCatActive = filterState.category === cat.slug;

                    return (
                      <div key={cat.slug} className="flex flex-col space-y-2">
                        {/* Main Category Header Link */}
                        <button
                          type="button"
                          onClick={() => handleMainCategoryClick(cat.slug, cat.id)}
                          className={`flex items-center gap-2 font-bold text-xs sm:text-sm text-left pb-1.5 border-b border-zinc-100 group transition-colors cursor-pointer ${
                            isCatActive ? 'text-teal-600' : 'text-zinc-900 hover:text-teal-600'
                          }`}
                        >
                          <span className="w-6 h-6 rounded-md bg-zinc-100 text-zinc-600 group-hover:bg-teal-50 group-hover:text-teal-600 flex items-center justify-center shrink-0 transition-colors">
                            {cat.icon}
                          </span>
                          <span className="truncate">{cat.name}</span>
                          <ChevronRight className="w-3 h-3 text-zinc-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all ml-auto shrink-0" />
                        </button>

                        {/* Subcategories underneath */}
                        <ul className="space-y-1 pt-0.5">
                          {cat.subcategories.length > 0 ? (
                            cat.subcategories.map((sub) => {
                              const isSubActive =
                                filterState.category === (sub.parentCatSlug || cat.slug) &&
                                filterState.subCategory === sub.slug;

                              return (
                                <li key={sub.slug}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSubCategoryClick(
                                        sub.parentCatSlug || cat.slug,
                                        sub.parentCatId || cat.id,
                                        sub.slug,
                                        sub.id
                                      )
                                    }
                                    className={`w-full group flex items-center justify-between text-left text-xs py-1 px-1 rounded transition-colors font-medium cursor-pointer ${
                                      isSubActive
                                        ? 'text-teal-700 font-bold bg-teal-50'
                                        : 'text-zinc-600 hover:text-teal-600 hover:translate-x-0.5'
                                    }`}
                                  >
                                    <span className="truncate">{sub.name}</span>
                                    {typeof sub.count === 'number' && sub.count > 0 && (
                                      <span className="text-[10px] text-zinc-400 font-normal ml-1 shrink-0">
                                        ({sub.count})
                                      </span>
                                    )}
                                  </button>
                                </li>
                              );
                            })
                          ) : (
                            <li>
                              <button
                                type="button"
                                onClick={() => handleMainCategoryClick(cat.slug, cat.id)}
                                className="text-xs text-teal-600 hover:underline py-1 font-medium cursor-pointer"
                              >
                                View all {cat.name} →
                              </button>
                            </li>
                          )}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : currentCategory ? (
              /* =========================================================================
                 SCENARIO B: SINGLE CATEGORY MEGA-MENU (e.g. "Electronics", "Smart Gadgets")
                 Matching exact ASCII design concept:
                 Category Header on top, Subcategories in columns with their Product Types
                 ========================================================================= */
              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                      {currentCategory.icon}
                    </span>
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
                        <span>{currentCategory.name}</span>
                        {typeof currentCategory.count === 'number' && currentCategory.count > 0 && (
                          <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                            {currentCategory.count} Items
                          </span>
                        )}
                      </h2>
                      <p className="text-xs text-zinc-500 font-normal mt-0.5">
                        Select a subcategory or specific product type to view collection
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleMainCategoryClick(currentCategory.slug, currentCategory.id)}
                      className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>View All {currentCategory.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 flex items-center justify-center transition-colors cursor-pointer"
                      aria-label="Close menu"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subcategories & Product Types in Clean Organized Grid */}
                {currentCategory.subcategories.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-7 items-start">
                    {currentCategory.subcategories.map((sub) => {
                      const isSubActive =
                        filterState.category === (sub.parentCatSlug || currentCategory.slug) &&
                        filterState.subCategory === sub.slug;

                      return (
                        <div key={sub.slug} className="flex flex-col space-y-2">
                          {/* Subcategory Column Header (Clickable) */}
                          <button
                            type="button"
                            onClick={() =>
                              handleSubCategoryClick(
                                sub.parentCatSlug || currentCategory.slug,
                                sub.parentCatId || currentCategory.id,
                                sub.slug,
                                sub.id
                              )
                            }
                            className={`flex items-center justify-between font-bold text-xs sm:text-sm text-left pb-1.5 border-b border-zinc-100 group transition-colors cursor-pointer ${
                              isSubActive ? 'text-teal-600' : 'text-zinc-900 hover:text-teal-600'
                            }`}
                          >
                            <span className="truncate">{sub.name}</span>
                            <ChevronRight className="w-3 h-3 text-zinc-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all ml-1 shrink-0" />
                          </button>

                          {/* Product Types or Sub-items */}
                          <ul className="space-y-1 pt-0.5">
                            {sub.productTypes && sub.productTypes.length > 0 ? (
                              sub.productTypes.map((pt) => {
                                const isPtActive =
                                  isSubActive && filterState.productType === pt.slug;

                                return (
                                  <li key={pt.slug}>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleProductTypeClick(
                                          sub.parentCatSlug || currentCategory.slug,
                                          sub.parentCatId || currentCategory.id,
                                          sub.slug,
                                          sub.id,
                                          pt.slug
                                        )
                                      }
                                      className={`w-full group flex items-center justify-between text-left text-xs py-1 px-1 rounded transition-colors font-medium cursor-pointer ${
                                        isPtActive
                                          ? 'text-teal-700 font-bold bg-teal-50'
                                          : 'text-zinc-500 hover:text-teal-600 hover:translate-x-0.5'
                                      }`}
                                    >
                                      <span className="truncate">{pt.name}</span>
                                      {typeof pt.count === 'number' && pt.count > 0 && (
                                        <span className="text-[10px] text-zinc-400 font-normal ml-1 shrink-0">
                                          ({pt.count})
                                        </span>
                                      )}
                                    </button>
                                  </li>
                                );
                              })
                            ) : (
                              <li>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSubCategoryClick(
                                      sub.parentCatSlug || currentCategory.slug,
                                      sub.parentCatId || currentCategory.id,
                                      sub.slug,
                                      sub.id
                                    )
                                  }
                                  className="w-full text-left text-xs text-teal-600 hover:underline py-1 font-medium cursor-pointer"
                                >
                                  Browse all {sub.name} →
                                </button>
                              </li>
                            )}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-zinc-400 text-xs italic">
                    Explore all products in {currentCategory.name}
                  </div>
                )}
              </div>
            ) : null}

          </div>
        </div>
      </div>
    </>
  );
};
