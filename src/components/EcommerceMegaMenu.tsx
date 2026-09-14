import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LayoutGrid,
  ChevronRight,
  ChevronDown,
  X,
  Search,
  ArrowRight,
  Sparkles,
  Watch,
  Headphones,
  Cpu,
  ShoppingBag,
  Home,
  Shirt,
  Package,
  Coffee,
  HeartHandshake,
  Baby,
  Utensils,
  Smartphone,
  Check,
} from 'lucide-react';
import { TaxonomyCategory, TaxonomySubCategory, TaxonomyFilterState, matchesTaxonomyField } from '../utils/taxonomy';
import { Product } from '../types';
import { useTaxonomy } from '../context/TaxonomyContext';

export interface EcommerceMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  taxonomy?: TaxonomyCategory[];
  currentFilter?: Partial<TaxonomyFilterState>;
  onSelectTaxonomy?: (filter: {
    category?: string;
    subCategory?: string;
    productType?: string;
    childCategory?: string;
    categoryId?: string;
    subCategoryId?: string;
    productTypeId?: string;
    childCategoryId?: string;
  }) => void;
  products?: Product[];
}

// Icon mapper for categories with rich fallback mapping
const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  electronics: <Cpu className="w-4 h-4" />,
  'smart-gadgets': <Watch className="w-4 h-4" />,
  smartwatch: <Watch className="w-4 h-4" />,
  audio: <Headphones className="w-4 h-4" />,
  'computer-gaming': <Sparkles className="w-4 h-4" />,
  'lifestyle-bags': <ShoppingBag className="w-4 h-4" />,
  fashion: <Shirt className="w-4 h-4" />,
  'fashion-lifestyle': <Shirt className="w-4 h-4" />,
  beauty: <Sparkles className="w-4 h-4" />,
  'beauty-personal-care': <Sparkles className="w-4 h-4" />,
  'home-living': <Home className="w-4 h-4" />,
  'home-kitchen': <Utensils className="w-4 h-4" />,
  accessories: <ShoppingBag className="w-4 h-4" />,
  'mobile-accessories': <Smartphone className="w-4 h-4" />,
  'kids-baby': <Baby className="w-4 h-4" />,
  'health-wellness': <HeartHandshake className="w-4 h-4" />,
  'gourmet-food': <Coffee className="w-4 h-4" />,
};

function getCategoryIcon(nameOrSlug?: string): React.ReactNode {
  if (!nameOrSlug) return <Package className="w-4 h-4" />;
  const key = nameOrSlug.toLowerCase().trim().replace(/[\s_&]+/g, '-');
  return CATEGORY_ICON_MAP[key] || <Package className="w-4 h-4" />;
}

export const EcommerceMegaMenu: React.FC<EcommerceMegaMenuProps> = ({
  isOpen,
  onClose,
  taxonomy: propTaxonomy,
  currentFilter = {} as Partial<TaxonomyFilterState>,
  onSelectTaxonomy,
  products = [],
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { taxonomyTree: contextTaxonomy } = useTaxonomy();
  const taxonomy = (propTaxonomy && propTaxonomy.length > 0) ? propTaxonomy : contextTaxonomy;

  // Search filter query within the mega menu
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile Accordion state: Set of opened category IDs
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(() => {
    // Expand the currently active category if any
    const initial = new Set<string>();
    if (currentFilter.category) {
      const active = taxonomy.find(
        (c) =>
          matchesTaxonomyField(currentFilter.category, c.slug) ||
          matchesTaxonomyField(currentFilter.category, c.name) ||
          (currentFilter.categoryId && c.id === currentFilter.categoryId)
      );
      if (active) initial.add(active.id);
    }
    // Default open first category on mobile if none active
    if (initial.size === 0 && taxonomy.length > 0) {
      initial.add(taxonomy[0].id);
    }
    return initial;
  });

  // Handle ESC and click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        // Check if the click was on the trigger button
        const trigger = document.getElementById('navbar-categories-menu-button');
        if (trigger && trigger.contains(e.target as Node)) {
          return;
        }
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

  // Filter categories and subcategories based on internal search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return taxonomy;
    const q = searchQuery.toLowerCase().trim();

    return taxonomy
      .map((cat) => {
        const catMatch = cat.name.toLowerCase().includes(q) || (cat.slug && cat.slug.toLowerCase().includes(q));
        const matchedSubs = cat.subCategories.filter(
          (sub) => sub.name.toLowerCase().includes(q) || (sub.slug && sub.slug.toLowerCase().includes(q))
        );

        if (catMatch) {
          return cat;
        }
        if (matchedSubs.length > 0) {
          return {
            ...cat,
            subCategories: matchedSubs,
          };
        }
        return null;
      })
      .filter(Boolean) as TaxonomyCategory[];
  }, [taxonomy, searchQuery]);

  // Navigate to Level 1: Category
  const handleCategoryClick = (cat: TaxonomyCategory, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onSelectTaxonomy) {
      onSelectTaxonomy({
        category: cat.slug || cat.name,
        subCategory: '',
        productType: '',
        childCategory: '',
        categoryId: cat.id,
        subCategoryId: '',
        productTypeId: '',
        childCategoryId: '',
      });
    }
    onClose();

    // Smooth scroll down to catalog section
    setTimeout(() => {
      const catalogEl = document.getElementById('products-catalog-section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 60);
  };

  // Navigate to Level 2: Subcategory
  const handleSubCategoryClick = (
    cat: TaxonomyCategory,
    sub: TaxonomySubCategory,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onSelectTaxonomy) {
      onSelectTaxonomy({
        category: cat.slug || cat.name,
        subCategory: sub.slug || sub.name,
        productType: '',
        childCategory: '',
        categoryId: cat.id,
        subCategoryId: sub.id,
        productTypeId: '',
        childCategoryId: '',
      });
    }
    onClose();

    // Smooth scroll down to catalog section
    setTimeout(() => {
      const catalogEl = document.getElementById('products-catalog-section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 60);
  };

  // Reset to All Products
  const handleViewAllProducts = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onSelectTaxonomy) {
      onSelectTaxonomy({
        category: '',
        subCategory: '',
        productType: '',
        childCategory: '',
        categoryId: '',
        subCategoryId: '',
        productTypeId: '',
        childCategoryId: '',
      });
    }
    onClose();

    setTimeout(() => {
      const catalogEl = document.getElementById('products-catalog-section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 60);
  };

  // Toggle mobile accordion section
  const toggleMobileAccordion = (id: string) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      id="ecommerce-mega-menu-container"
      data-mega-menu="true"
      onClick={(e) => e.stopPropagation()}
      className="absolute top-full left-0 mt-2 z-50 w-full max-w-[95vw] lg:max-w-5xl bg-white rounded-2xl shadow-2xl border border-zinc-200/90 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
    >
      {/* Top Header Bar */}
      <div className="px-4 sm:px-6 py-3 bg-[#0f172a] text-white flex items-center justify-between gap-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black tracking-tight flex items-center gap-2">
              <span>All Categories</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold border border-zinc-700/60">
                {taxonomy.length} Categories
              </span>
            </div>
          </div>
        </div>

        {/* Quick search input */}
        <div className="relative hidden sm:block max-w-xs w-full">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search categories & items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/90 text-white placeholder-zinc-400 text-xs pl-8 pr-7 py-1.5 rounded-xl border border-zinc-700/80 focus:outline-none focus:border-teal-500 transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1.5 text-zinc-400 hover:text-white text-xs w-4 h-4 rounded-full flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleViewAllProducts}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            All Products
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center cursor-pointer transition-colors"
            title="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          DESKTOP: MODERN MULTI-COLUMN ECOMMERCE MEGA MENU GRID
         ========================================================================= */}
      <div className="hidden md:block p-6 max-h-[62vh] overflow-y-auto">
        {filteredCategories.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-xs">
            No categories or subcategories matched &quot;{searchQuery}&quot;
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-start">
            {filteredCategories.map((cat) => {
              const isCatActive =
                Boolean(currentFilter.category) &&
                (matchesTaxonomyField(currentFilter.category, cat.slug) ||
                  matchesTaxonomyField(currentFilter.category, cat.name) ||
                  (currentFilter.categoryId && cat.id === currentFilter.categoryId));

              return (
                <div
                  key={cat.id || cat.slug || cat.name}
                  className="flex flex-col space-y-2 group/category p-2 rounded-xl hover:bg-zinc-50/70 transition-colors"
                >
                  {/* Category Header (Clickable Link to Category Page) */}
                  <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-zinc-200/90">
                    <button
                      type="button"
                      onClick={(e) => handleCategoryClick(cat, e)}
                      className={`flex items-center gap-2 font-black text-xs sm:text-sm text-left group-hover/category:text-teal-700 transition-colors cursor-pointer truncate ${
                        isCatActive ? 'text-teal-700' : 'text-zinc-950'
                      }`}
                      title={`Browse ${cat.name}`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-zinc-100 text-zinc-700 group-hover/category:bg-teal-50 group-hover/category:text-teal-600 flex items-center justify-center shrink-0 transition-colors">
                        {getCategoryIcon(cat.slug || cat.name)}
                      </span>
                      <span className="truncate">{cat.name}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleCategoryClick(cat, e)}
                      className="text-[10px] font-bold text-zinc-400 hover:text-teal-600 shrink-0 cursor-pointer flex items-center gap-0.5"
                      title="View all items in this category"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Subcategories List */}
                  <ul className="space-y-1 pt-1">
                    {cat.subCategories && cat.subCategories.length > 0 ? (
                      cat.subCategories.map((sub) => {
                        const isSubActive =
                          Boolean(currentFilter.subCategory) &&
                          (matchesTaxonomyField(currentFilter.subCategory, sub.slug) ||
                            matchesTaxonomyField(currentFilter.subCategory, sub.name) ||
                            (currentFilter.subCategoryId && sub.id === currentFilter.subCategoryId));

                        return (
                          <li key={sub.id || sub.slug || sub.name}>
                            <button
                              type="button"
                              onClick={(e) => handleSubCategoryClick(cat, sub, e)}
                              className={`w-full group/item flex items-center justify-between text-left text-xs py-1 px-1.5 rounded-lg transition-colors cursor-pointer ${
                                isSubActive
                                  ? 'bg-teal-50 text-teal-800 font-bold'
                                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80 font-medium'
                              }`}
                              title={`Shop ${sub.name}`}
                            >
                              <span className="truncate flex items-center gap-1.5">
                                <span className={`w-1 h-1 rounded-full transition-all ${
                                  isSubActive ? 'bg-teal-600 w-1.5 h-1.5' : 'bg-zinc-300 group-hover/item:bg-teal-500'
                                }`} />
                                <span className="truncate">{sub.name}</span>
                              </span>

                              {sub.count > 0 && (
                                <span className="text-[10px] text-zinc-400 font-normal shrink-0 ml-1">
                                  ({sub.count})
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })
                    ) : (
                      <li className="text-[11px] text-zinc-400 italic py-1 px-1">
                        Explore all items in {cat.name}
                      </li>
                    )}
                  </ul>

                  {/* Bottom Explore Link */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={(e) => handleCategoryClick(cat, e)}
                      className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors cursor-pointer group-hover/category:translate-x-0.5"
                    >
                      <span>Explore {cat.name}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          MOBILE: TOUCH-FRIENDLY ACCORDION DRAWER
         ========================================================================= */}
      <div className="md:hidden max-h-[75vh] overflow-y-auto p-3 divide-y divide-zinc-100">
        {/* Mobile Search input */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-100 text-zinc-900 placeholder-zinc-500 text-xs pl-8 pr-7 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-900"
          />
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-3" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-600 text-xs w-5 h-5 rounded-full flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>

        {filteredCategories.map((cat) => {
          const isExpanded = expandedCategoryIds.has(cat.id);
          const isCatActive =
            Boolean(currentFilter.category) &&
            (matchesTaxonomyField(currentFilter.category, cat.slug) ||
              matchesTaxonomyField(currentFilter.category, cat.name));

          return (
            <div key={cat.id || cat.slug} className="py-2">
              {/* Category Header Row */}
              <div className="flex items-center justify-between gap-2 min-h-[44px]">
                <button
                  type="button"
                  onClick={() => toggleMobileAccordion(cat.id)}
                  className="flex-1 flex items-center gap-2.5 text-left font-bold text-xs sm:text-sm text-zinc-900 cursor-pointer py-1.5 truncate"
                >
                  <span className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0">
                    {getCategoryIcon(cat.slug || cat.name)}
                  </span>
                  <span className={`truncate ${isCatActive ? 'text-teal-600' : ''}`}>{cat.name}</span>
                  {cat.count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-500 shrink-0 font-medium">
                      {cat.count}
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleCategoryClick(cat, e)}
                    className="px-2 py-1 text-[11px] font-bold text-teal-600 hover:bg-teal-50 rounded-md cursor-pointer"
                  >
                    View All
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleMobileAccordion(cat.id)}
                    className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-700 cursor-pointer"
                    aria-label={`Toggle ${cat.name}`}
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-teal-600' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Subcategories Accordion Content */}
              {isExpanded && (
                <div className="pl-9 pr-2 pt-1 pb-2 space-y-1 animate-in fade-in-50 duration-150">
                  {cat.subCategories && cat.subCategories.length > 0 ? (
                    cat.subCategories.map((sub) => {
                      const isSubActive =
                        Boolean(currentFilter.subCategory) &&
                        (matchesTaxonomyField(currentFilter.subCategory, sub.slug) ||
                          matchesTaxonomyField(currentFilter.subCategory, sub.name));

                      return (
                        <button
                          key={sub.id || sub.slug}
                          type="button"
                          onClick={(e) => handleSubCategoryClick(cat, sub, e)}
                          className={`w-full flex items-center justify-between text-left text-xs py-2 px-2.5 rounded-lg min-h-[40px] transition-colors cursor-pointer ${
                            isSubActive
                              ? 'bg-teal-50 text-teal-800 font-bold'
                              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 font-medium'
                          }`}
                        >
                          <span className="truncate">{sub.name}</span>
                          {sub.count > 0 && (
                            <span className="text-[10px] text-zinc-400 font-normal shrink-0 ml-1">
                              ({sub.count})
                            </span>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleCategoryClick(cat, e)}
                      className="w-full text-left text-xs text-teal-600 font-bold py-2 px-2"
                    >
                      Browse all items in {cat.name} →
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Footer Bar with Store Value Propositions */}
      <div className="px-4 sm:px-6 py-2.5 bg-zinc-50 border-t border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-500">
        <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
          <span className="flex items-center gap-1.5 font-medium">
            <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>100% Authentic Quality</span>
          </span>
          <span className="hidden sm:inline text-zinc-300">•</span>
          <span className="flex items-center gap-1.5 font-medium">
            <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>Cash on Delivery across 64 Districts</span>
          </span>
        </div>

        <button
          type="button"
          onClick={handleViewAllProducts}
          className="text-xs font-bold text-zinc-900 hover:text-teal-700 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Browse Complete Catalog</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
