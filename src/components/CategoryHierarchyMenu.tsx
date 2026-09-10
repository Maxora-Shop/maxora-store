import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  TaxonomyCategory,
  TaxonomySubCategory,
  TaxonomyProductType,
  TaxonomyChildCategory,
  TaxonomyFilterState,
  matchesTaxonomyField,
} from '../utils/taxonomy';
import { Product } from '../types';
import { getProductSlug } from '../utils/seo';
import {
  LayoutGrid,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Watch,
  Headphones,
  Cpu,
  ShoppingBag,
  Home,
  Shirt,
  Package,
  Coffee,
  Check,
  Tag,
  ExternalLink,
} from 'lucide-react';

interface CategoryHierarchyMenuProps {
  isOpen: boolean;
  onClose: () => void;
  taxonomy: TaxonomyCategory[];
  currentFilter: Partial<TaxonomyFilterState>;
  onSelectTaxonomy: (filter: {
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
  onSelectProduct?: (product: Product) => void;
}

// Icon mapper for categories
const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  electronics: <Cpu className="w-4 h-4" />,
  'smart-gadgets': <Watch className="w-4 h-4" />,
  smartwatch: <Watch className="w-4 h-4" />,
  audio: <Headphones className="w-4 h-4" />,
  'computer-gaming': <Sparkles className="w-4 h-4" />,
  'lifestyle-bags': <ShoppingBag className="w-4 h-4" />,
  'home-living': <Home className="w-4 h-4" />,
  accessories: <Shirt className="w-4 h-4" />,
  'gourmet-food': <Coffee className="w-4 h-4" />,
};

function getCategoryIcon(nameOrSlug?: string): React.ReactNode {
  if (!nameOrSlug) return <Package className="w-4 h-4" />;
  const key = nameOrSlug.toLowerCase().trim().replace(/[\s_]+/g, '-');
  return CATEGORY_ICON_MAP[key] || <Package className="w-4 h-4" />;
}

export const CategoryHierarchyMenu: React.FC<CategoryHierarchyMenuProps> = ({
  isOpen,
  onClose,
  taxonomy,
  currentFilter,
  onSelectTaxonomy,
  products = [],
  onSelectProduct,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Active hover/selection state for desktop flyout columns
  const [activeCatSlug, setActiveCatSlug] = useState<string>('');
  const [activeSubSlug, setActiveSubSlug] = useState<string>('');
  const [activeTypeSlug, setActiveTypeSlug] = useState<string>('');
  const [activeChildSlug, setActiveChildSlug] = useState<string>('');

  // Mobile drill-down navigation state
  type MobileStep = 'categories' | 'subcategories' | 'product_types' | 'child_categories';
  const [mobileStep, setMobileStep] = useState<MobileStep>('categories');

  // Initialize or sync active columns when menu opens
  useEffect(() => {
    if (isOpen) {
      if (currentFilter.category) {
        const matched = taxonomy.find(
          (c) =>
            c.slug.toLowerCase() === currentFilter.category?.toLowerCase() ||
            c.name.toLowerCase() === currentFilter.category?.toLowerCase()
        );
        if (matched) {
          setActiveCatSlug(matched.slug);

          if (currentFilter.subCategory) {
            const subMatched = matched.subCategories.find(
              (s) =>
                s.slug.toLowerCase() === currentFilter.subCategory?.toLowerCase() ||
                s.name.toLowerCase() === currentFilter.subCategory?.toLowerCase()
            );
            if (subMatched) {
              setActiveSubSlug(subMatched.slug);

              if (currentFilter.productType) {
                const typeMatched = subMatched.productTypes.find(
                  (t) =>
                    t.slug.toLowerCase() === currentFilter.productType?.toLowerCase() ||
                    t.name.toLowerCase() === currentFilter.productType?.toLowerCase()
                );
                if (typeMatched) {
                  setActiveTypeSlug(typeMatched.slug);
                }
              }
            }
          }
          return;
        }
      }

      // Default to first category if none active
      if (taxonomy.length > 0 && !activeCatSlug) {
        setActiveCatSlug(taxonomy[0].slug);
        if (taxonomy[0].subCategories.length > 0) {
          setActiveSubSlug(taxonomy[0].subCategories[0].slug);
          if (taxonomy[0].subCategories[0].productTypes.length > 0) {
            setActiveTypeSlug(taxonomy[0].subCategories[0].productTypes[0].slug);
          }
        }
      }
    }
  }, [isOpen, currentFilter, taxonomy]);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentCat = taxonomy.find((c) => c.slug === activeCatSlug) || taxonomy[0];
  const currentSub = currentCat?.subCategories.find((s) => s.slug === activeSubSlug) || currentCat?.subCategories[0];
  const currentType = currentSub?.productTypes.find((t) => t.slug === activeTypeSlug) || currentSub?.productTypes[0];

  // Real-time matching products within the current active hierarchy branch
  const matchingProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    return products.filter((p) => {
      if (p.active === 0 || p.active === false || String(p.active) === '0') return false;
      if (currentCat) {
        const matchCat =
          (p.category_id && (p.category_id === currentCat.id || matchesTaxonomyField(p.category_id, currentCat.id))) ||
          matchesTaxonomyField(p.category, currentCat.slug) ||
          matchesTaxonomyField(p.category, currentCat.name);
        if (!matchCat) return false;
      }
      if (currentSub) {
        const matchSub =
          (p.subcategory_id && (p.subcategory_id === currentSub.id || matchesTaxonomyField(p.subcategory_id, currentSub.id))) ||
          matchesTaxonomyField(p.sub_category, currentSub.slug) ||
          matchesTaxonomyField(p.sub_category, currentSub.name);
        if (!matchSub) return false;
      }
      if (currentType) {
        const matchType =
          (p.product_type_id && (p.product_type_id === currentType.id || matchesTaxonomyField(p.product_type_id, currentType.id))) ||
          matchesTaxonomyField(p.product_type, currentType.slug) ||
          matchesTaxonomyField(p.product_type, currentType.name);
        if (!matchType) return false;
      }
      if (activeChildSlug) {
        const matchChild =
          (p.childcategory_id && (p.childcategory_id === activeChildSlug || matchesTaxonomyField(p.childcategory_id, activeChildSlug))) ||
          (p.child_category_id && (p.child_category_id === activeChildSlug || matchesTaxonomyField(p.child_category_id, activeChildSlug))) ||
          matchesTaxonomyField(p.child_category, activeChildSlug) ||
          matchesTaxonomyField(p.childcategory_slug, activeChildSlug) ||
          matchesTaxonomyField(p.child_category_slug, activeChildSlug);
        if (!matchChild) return false;
      }
      return true;
    });
  }, [products, currentCat, currentSub, currentType, activeChildSlug]);

  const handleSelectAllProducts = () => {
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
    setTimeout(() => {
      onClose();
    }, 160);
  };

  const handleCategoryClick = (cat: TaxonomyCategory) => {
    onSelectTaxonomy({
      category: cat.slug || cat.name,
      subCategory: '',
      productType: '',
      childCategory: '',
      categoryId: cat.id,
    });
    setTimeout(() => {
      onClose();
    }, 160);
  };

  const handleSubCategoryClick = (cat: TaxonomyCategory, sub: TaxonomySubCategory) => {
    onSelectTaxonomy({
      category: cat.slug || cat.name,
      subCategory: sub.slug || sub.name,
      productType: '',
      childCategory: '',
      categoryId: cat.id,
      subCategoryId: sub.id,
    });
    setTimeout(() => {
      onClose();
    }, 160);
  };

  const handleProductTypeClick = (
    cat: TaxonomyCategory,
    sub: TaxonomySubCategory,
    type: TaxonomyProductType
  ) => {
    onSelectTaxonomy({
      category: cat.slug || cat.name,
      subCategory: sub.slug || sub.name,
      productType: type.slug || type.name,
      childCategory: '',
      categoryId: cat.id,
      subCategoryId: sub.id,
      productTypeId: type.id,
    });
    setTimeout(() => {
      onClose();
    }, 160);
  };

  const handleChildCategoryClick = (
    cat: TaxonomyCategory,
    sub: TaxonomySubCategory,
    type: TaxonomyProductType,
    child: TaxonomyChildCategory
  ) => {
    onSelectTaxonomy({
      category: cat.slug || cat.name,
      subCategory: sub.slug || sub.name,
      productType: type.slug || type.name,
      childCategory: child.slug || child.name,
      categoryId: cat.id,
      subCategoryId: sub.id,
      productTypeId: type.id,
      childCategoryId: child.id,
    });
    setTimeout(() => {
      onClose();
    }, 160);
  };

  const handleProductNavigate = (
    e: React.MouseEvent<HTMLAnchorElement>,
    prod: Product
  ) => {
    const slug = getProductSlug(prod);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = `${origin}/product/${slug}`;

    // Always invoke onSelectProduct so the product details view/modal opens immediately
    if (onSelectProduct) {
      onSelectProduct(prod);
    }

    if (typeof window !== 'undefined') {
      window.history.pushState({ slug, productId: prod.id }, '', `/product/${slug}`);
    }

    // Attempt to open in a new tab as well
    try {
      window.open(fullUrl, '_blank');
    } catch {
      // Popups may be restricted in sandbox iframe; onSelectProduct already handled it
    }

    onClose();
  };

  return (
    <div
      ref={menuRef}
      id="category-hierarchy-mega-menu"
      className="absolute top-full left-0 mt-2 z-50 w-full max-w-[95vw] lg:max-w-5xl bg-white rounded-2xl shadow-2xl border border-zinc-200/90 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
    >
      {/* Top Header Bar */}
      <div className="px-5 py-3 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black tracking-tight flex items-center gap-2">
              <span>Category Hierarchy</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-semibold">
                Dynamic Store Catalog
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 hidden sm:block">
              Categories → Subcategory → Product Type → Child Category
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAllProducts}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 transition-colors cursor-pointer"
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
          DESKTOP 4-COLUMN MEGA MENU (Hidden on small screens)
          Hierarchy:
          Column 1: Categories
          Column 2: Subcategory
          Column 3: Product Type
          Column 4: Child Category
          NOTE: "Products" is NOT a separate level; products display automatically on click!
         ========================================================================= */}
      <div className="hidden md:grid md:grid-cols-4 divide-x divide-zinc-200/80 min-h-[380px] max-h-[520px]">
        {/* Tier 1: Categories */}
        <div className="flex flex-col bg-zinc-50/60 p-2 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
            <span>1. Categories</span>
            <span className="text-[10px] text-zinc-400">{taxonomy.length}</span>
          </div>

          <div className="space-y-1">
            {taxonomy.map((cat) => {
              const isActive = cat.slug === activeCatSlug;
              const isSelected =
                currentFilter.category &&
                (currentFilter.category.toLowerCase() === cat.slug.toLowerCase() ||
                  currentFilter.category.toLowerCase() === cat.name.toLowerCase());

              return (
                <div
                  key={cat.slug}
                  onMouseEnter={() => {
                    setActiveCatSlug(cat.slug);
                    if (cat.subCategories.length > 0) {
                      setActiveSubSlug(cat.subCategories[0].slug);
                      if (cat.subCategories[0].productTypes.length > 0) {
                        setActiveTypeSlug(cat.subCategories[0].productTypes[0].slug);
                      } else {
                        setActiveTypeSlug('');
                      }
                    } else {
                      setActiveSubSlug('');
                      setActiveTypeSlug('');
                    }
                  }}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white shadow-sm border border-zinc-200 text-zinc-950 font-bold'
                      : 'hover:bg-zinc-100/80 text-zinc-700 font-medium'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    className="flex-1 text-left flex items-center gap-2.5 truncate"
                  >
                    <span className={isActive || isSelected ? 'text-emerald-600' : 'text-zinc-400'}>
                      {getCategoryIcon(cat.slug || cat.name)}
                    </span>
                    <span className="truncate">{cat.name}</span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    )}
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-500 font-medium">
                      {cat.count}
                    </span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isActive ? 'text-emerald-600 translate-x-0.5' : 'text-zinc-300'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tier 2: Subcategory */}
        <div className="flex flex-col bg-white p-2 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
            <span>2. Subcategory</span>
            <span className="text-[10px] text-zinc-400">
              {currentCat?.subCategories.length || 0}
            </span>
          </div>

          {currentCat ? (
            <div className="space-y-1">
              {/* Direct "View all [Category]" button */}
              <button
                type="button"
                onClick={() => handleCategoryClick(currentCat)}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center justify-between mb-1 border border-dashed border-emerald-200"
              >
                <span>View All {currentCat.name}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                  {currentCat.count} items
                </span>
              </button>

              {currentCat.subCategories.map((sub) => {
                const isActive = sub.slug === activeSubSlug;
                const isSelected =
                  currentFilter.subCategory &&
                  (currentFilter.subCategory.toLowerCase() === sub.slug.toLowerCase() ||
                    currentFilter.subCategory.toLowerCase() === sub.name.toLowerCase());

                return (
                  <div
                    key={sub.slug}
                    onMouseEnter={() => {
                      setActiveSubSlug(sub.slug);
                      if (sub.productTypes.length > 0) {
                        setActiveTypeSlug(sub.productTypes[0].slug);
                      } else {
                        setActiveTypeSlug('');
                      }
                      setActiveChildSlug('');
                    }}
                    onClick={() => {
                      setActiveSubSlug(sub.slug);
                      if (sub.productTypes.length > 0) {
                        setActiveTypeSlug(sub.productTypes[0].slug);
                      } else {
                        setActiveTypeSlug('');
                        if (currentCat) {
                          handleSubCategoryClick(currentCat, sub);
                        }
                      }
                      setActiveChildSlug('');
                    }}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-zinc-100 shadow-2xs text-zinc-950 font-bold border border-zinc-200/80'
                        : 'hover:bg-zinc-50 text-zinc-700 font-medium'
                    }`}
                  >
                    <div className="flex-1 text-left flex items-center gap-2 truncate">
                      <span className="truncate">{sub.name}</span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-500 font-medium">
                        {sub.count}
                      </span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          isActive ? 'text-emerald-600 translate-x-0.5' : 'text-zinc-300'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}

              {currentCat.subCategories.length === 0 && (
                <div className="p-4 text-center text-xs text-zinc-400 italic">
                  No subcategories under {currentCat.name}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-zinc-400">Select a category</div>
          )}
        </div>

        {/* Tier 3: Product Type */}
        <div className="flex flex-col bg-zinc-50/40 p-2 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
            <span>3. Product Type</span>
            <span className="text-[10px] text-zinc-400">
              {currentSub?.productTypes.length || 0}
            </span>
          </div>

          {currentSub ? (
            <div className="space-y-1">
              {/* Direct "View all [SubCategory]" button */}
              <button
                type="button"
                onClick={() => currentCat && handleSubCategoryClick(currentCat, currentSub)}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center justify-between mb-1 border border-dashed border-emerald-200 cursor-pointer"
              >
                <span>View All {currentSub.name}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                  {currentSub.count} items
                </span>
              </button>

              {currentSub.productTypes.map((type) => {
                const isActive = type.slug === activeTypeSlug;
                const isSelected =
                  currentFilter.productType &&
                  (matchesTaxonomyField(currentFilter.productType, type.name) ||
                   matchesTaxonomyField(currentFilter.productType, type.slug));

                return (
                  <div
                    key={type.slug}
                    onMouseEnter={() => {
                      setActiveTypeSlug(type.slug);
                      setActiveChildSlug('');
                    }}
                    onClick={() => {
                      setActiveTypeSlug(type.slug);
                      setActiveChildSlug('');
                      if (type.childCategories.length === 0 && currentCat && currentSub) {
                        handleProductTypeClick(currentCat, currentSub, type);
                      }
                    }}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white shadow-sm border border-zinc-200 text-zinc-950 font-bold'
                        : 'hover:bg-zinc-100/80 text-zinc-700 font-medium'
                    }`}
                  >
                    <div className="flex-1 text-left flex items-center gap-2 truncate">
                      <Tag className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="truncate">{type.name}</span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-500 font-medium">
                        {type.count}
                      </span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          isActive ? 'text-emerald-600 translate-x-0.5' : 'text-zinc-300'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}

              {currentSub.productTypes.length === 0 && (
                <div className="p-4 text-center text-xs text-zinc-400 italic">
                  No product types under {currentSub.name}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-zinc-400">Select a subcategory</div>
          )}
        </div>

        {/* Tier 4: Child Category & Matching Products */}
        <div className="flex flex-col bg-white p-2 overflow-y-auto max-h-[480px]">
          <div className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center justify-between bg-emerald-50/50 rounded-lg mb-1">
            <span>4. Child Category</span>
            <span className="text-[10px] text-emerald-600 font-bold">
              {currentType?.childCategories.length || 0}
            </span>
          </div>

          {currentType ? (
            <div className="space-y-1">
              {/* Direct "View all [Product Type]" button */}
              {currentCat && currentSub && (
                <button
                  type="button"
                  onClick={() => handleProductTypeClick(currentCat, currentSub, currentType)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-zinc-900 hover:bg-zinc-100 transition-colors flex items-center justify-between mb-1 border border-zinc-200 cursor-pointer"
                >
                  <span>All {currentType.name}</span>
                  <span className="text-[10px] bg-zinc-200 text-zinc-800 px-1.5 py-0.5 rounded">
                    {currentType.count} items
                  </span>
                </button>
              )}

              {currentType.childCategories.map((child) => {
                const isChildActive = activeChildSlug === (child.slug || child.name);
                const isSelected =
                  isChildActive ||
                  (currentFilter.childCategory &&
                    (matchesTaxonomyField(currentFilter.childCategory, child.name) ||
                     matchesTaxonomyField(currentFilter.childCategory, child.slug)));

                return (
                  <div
                    key={child.slug}
                    onMouseEnter={() => setActiveChildSlug(child.slug || child.name)}
                    onClick={() => setActiveChildSlug(child.slug || child.name)}
                    className="flex items-center gap-1 group/child"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveChildSlug(child.slug || child.name);
                        if (currentCat && currentSub) {
                          handleChildCategoryClick(currentCat, currentSub, currentType, child);
                        }
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white font-bold shadow-sm'
                          : 'hover:bg-emerald-50 text-zinc-800 font-semibold border border-transparent hover:border-emerald-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                        <span className="truncate">{child.name}</span>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                          isSelected ? 'bg-emerald-700 text-white' : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {child.count}
                      </span>
                    </button>
                  </div>
                );
              })}

              {currentType.childCategories.length === 0 && (
                <div className="p-3 text-center text-xs text-zinc-400 italic">
                  No child categories under {currentType.name}
                </div>
              )}

              {/* Direct Matching Products Preview List in Category Menu */}
              {matchingProducts.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-200/80">
                  <div className="px-1 mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-600 truncate">
                      Products ({matchingProducts.length})
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold shrink-0 flex items-center gap-0.5">
                      <ExternalLink className="w-3 h-3" />
                      Open in tab
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {matchingProducts.slice(0, 6).map((prod) => {
                      const slug = getProductSlug(prod);
                      const prodUrl = `/product/${slug}`;
                      return (
                        <a
                          key={prod.id}
                          href={prodUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => handleProductNavigate(e, prod)}
                          className="w-full text-left p-2 rounded-xl bg-zinc-50 hover:bg-emerald-50/80 border border-zinc-200/80 hover:border-emerald-300 transition-all flex items-center gap-2.5 group cursor-pointer"
                          title="Open product details / separate tab"
                        >
                          {prod.images?.[0] ? (
                            <img
                              src={prod.images[0]}
                              alt={prod.name}
                              className="w-9 h-9 rounded-lg object-cover bg-white border border-zinc-200 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-zinc-200 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-zinc-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-zinc-900 truncate group-hover:text-emerald-700">
                              {prod.name}
                            </p>
                            <p className="text-[11px] font-bold text-emerald-600">
                              ৳{Number(prod.selling_price || 0).toLocaleString()}
                            </p>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-600 shrink-0" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-zinc-400">Select a product type</div>
          )}
        </div>
      </div>

      {/* =========================================================================
          MOBILE VIEW (Interactive Drill-Down Accordion / Navigator)
         ========================================================================= */}
      <div className="md:hidden max-h-[75vh] overflow-y-auto p-3">
        {/* Mobile Navigation Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200 text-xs font-bold">
          {mobileStep !== 'categories' ? (
            <button
              type="button"
              onClick={() => {
                if (mobileStep === 'child_categories') setMobileStep('product_types');
                else if (mobileStep === 'product_types') setMobileStep('subcategories');
                else if (mobileStep === 'subcategories') setMobileStep('categories');
              }}
              className="flex items-center gap-1 text-emerald-700 cursor-pointer font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <span className="text-zinc-500 uppercase text-[10px] tracking-wider">
              Browse Categories
            </span>
          )}

          <div className="text-[11px] text-zinc-600 truncate max-w-[180px]">
            {mobileStep === 'categories' && '1. Choose Category'}
            {mobileStep === 'subcategories' && `2. ${currentCat?.name}`}
            {mobileStep === 'product_types' && `3. ${currentSub?.name}`}
            {mobileStep === 'child_categories' && `4. ${currentType?.name}`}
          </div>
        </div>

        {/* Step 1: Mobile Categories */}
        {mobileStep === 'categories' && (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={handleSelectAllProducts}
              className="w-full text-left px-3.5 py-2.5 rounded-xl bg-zinc-950 text-white font-bold text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>All Products</span>
              </div>
              <span className="text-[10px] text-zinc-400">View all</span>
            </button>

            {taxonomy.map((cat) => (
              <div
                key={cat.slug}
                className="flex items-center justify-between p-1 bg-zinc-50 rounded-xl border border-zinc-200"
              >
                <button
                  type="button"
                  onClick={() => handleCategoryClick(cat)}
                  className="flex-1 text-left px-2.5 py-2 text-xs font-bold text-zinc-900 truncate flex items-center gap-2"
                >
                  <span className="text-emerald-600">{getCategoryIcon(cat.slug || cat.name)}</span>
                  <span className="truncate">{cat.name}</span>
                  <span className="text-[10px] text-zinc-500 font-normal">({cat.count})</span>
                </button>

                {cat.subCategories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCatSlug(cat.slug);
                      if (cat.subCategories.length > 0) {
                        setActiveSubSlug(cat.subCategories[0].slug);
                      }
                      setMobileStep('subcategories');
                    }}
                    className="px-2.5 py-1.5 bg-white text-zinc-700 hover:text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-zinc-200 shrink-0"
                  >
                    <span>Explore</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Mobile Subcategories */}
        {mobileStep === 'subcategories' && currentCat && (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => handleCategoryClick(currentCat)}
              className="w-full text-left px-3 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-between"
            >
              <span>View All in {currentCat.name}</span>
              <span className="text-[10px] bg-emerald-700 px-2 py-0.5 rounded">
                {currentCat.count}
              </span>
            </button>

            {currentCat.subCategories.map((sub) => (
              <div
                key={sub.slug}
                className="flex items-center justify-between p-1 bg-zinc-50 rounded-xl border border-zinc-200"
              >
                <button
                  type="button"
                  onClick={() => handleSubCategoryClick(currentCat, sub)}
                  className="flex-1 text-left px-2.5 py-2 text-xs font-bold text-zinc-900 truncate"
                >
                  <span>{sub.name}</span>
                  <span className="text-[10px] text-zinc-500 font-normal ml-1">({sub.count})</span>
                </button>

                {sub.productTypes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubSlug(sub.slug);
                      if (sub.productTypes.length > 0) {
                        setActiveTypeSlug(sub.productTypes[0].slug);
                      }
                      setMobileStep('product_types');
                    }}
                    className="px-2.5 py-1.5 bg-white text-zinc-700 hover:text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-zinc-200 shrink-0"
                  >
                    <span>Types</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step 3: Mobile Product Types */}
        {mobileStep === 'product_types' && currentCat && currentSub && (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => handleSubCategoryClick(currentCat, currentSub)}
              className="w-full text-left px-3 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-between"
            >
              <span>View All in {currentSub.name}</span>
              <span className="text-[10px] bg-emerald-700 px-2 py-0.5 rounded">
                {currentSub.count}
              </span>
            </button>

            {currentSub.productTypes.map((type) => (
              <div
                key={type.slug}
                className="flex items-center justify-between p-1 bg-zinc-50 rounded-xl border border-zinc-200"
              >
                <button
                  type="button"
                  onClick={() => handleProductTypeClick(currentCat, currentSub, type)}
                  className="flex-1 text-left px-2.5 py-2 text-xs font-bold text-zinc-900 truncate"
                >
                  <span>{type.name}</span>
                  <span className="text-[10px] text-zinc-500 font-normal ml-1">({type.count})</span>
                </button>

                {type.childCategories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTypeSlug(type.slug);
                      setMobileStep('child_categories');
                    }}
                    className="px-2.5 py-1.5 bg-white text-zinc-700 hover:text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-zinc-200 shrink-0"
                  >
                    <span>Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            {matchingProducts.length > 0 && (
              <div className="pt-2 mt-2 border-t border-zinc-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 block">
                    Products in this category ({matchingProducts.length})
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <ExternalLink className="w-3 h-3" />
                    Open in tab
                  </span>
                </div>
                <div className="space-y-1.5">
                  {matchingProducts.slice(0, 4).map((prod) => {
                    const slug = getProductSlug(prod);
                    const prodUrl = `/product/${slug}`;
                    return (
                      <a
                        key={prod.id}
                        href={prodUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => handleProductNavigate(e, prod)}
                        className="w-full text-left p-2 rounded-xl bg-white border border-zinc-200 flex items-center gap-2 cursor-pointer hover:border-emerald-400 transition-colors"
                        title="Open product details / separate tab"
                      >
                        {prod.images?.[0] ? (
                          <img
                            src={prod.images[0]}
                            alt={prod.name}
                            className="w-9 h-9 rounded-lg object-cover bg-zinc-100 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-zinc-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 truncate">{prod.name}</p>
                          <p className="text-[11px] font-bold text-emerald-600">
                            ৳{Number(prod.selling_price || 0).toLocaleString()}
                          </p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Mobile Child Categories */}
        {mobileStep === 'child_categories' && currentCat && currentSub && currentType && (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => handleProductTypeClick(currentCat, currentSub, currentType)}
              className="w-full text-left px-3 py-2.5 rounded-xl bg-zinc-950 text-white font-bold text-xs flex items-center justify-between"
            >
              <span>All in {currentType.name}</span>
              <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded">
                {currentType.count}
              </span>
            </button>

            {currentType.childCategories.map((child) => (
              <button
                key={child.slug}
                type="button"
                onClick={() =>
                  handleChildCategoryClick(currentCat, currentSub, currentType, child)
                }
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-white border border-zinc-200 hover:border-emerald-500 text-xs font-bold text-zinc-900 flex items-center justify-between shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{child.name}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
                  {child.count} items
                </span>
              </button>
            ))}

            {matchingProducts.length > 0 && (
              <div className="pt-2 mt-2 border-t border-zinc-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 block">
                    Products in {currentType.name} ({matchingProducts.length})
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <ExternalLink className="w-3 h-3" />
                    Open in tab
                  </span>
                </div>
                <div className="space-y-1.5">
                  {matchingProducts.slice(0, 5).map((prod) => {
                    const slug = getProductSlug(prod);
                    const prodUrl = `/product/${slug}`;
                    return (
                      <a
                        key={prod.id}
                        href={prodUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => handleProductNavigate(e, prod)}
                        className="w-full text-left p-2 rounded-xl bg-white border border-zinc-200 flex items-center gap-2 cursor-pointer hover:border-emerald-400 transition-colors"
                        title="Open product details / separate tab"
                      >
                        {prod.images?.[0] ? (
                          <img
                            src={prod.images[0]}
                            alt={prod.name}
                            className="w-9 h-9 rounded-lg object-cover bg-zinc-100 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-zinc-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 truncate">{prod.name}</p>
                          <p className="text-[11px] font-bold text-emerald-600">
                            ৳{Number(prod.selling_price || 0).toLocaleString()}
                          </p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="px-5 py-2.5 bg-zinc-50 border-t border-zinc-200 text-[11px] text-zinc-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-zinc-700">Instant Navigation:</span>
          <span>Click any category, subcategory, type, or child category to view matching products</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-emerald-700 font-bold">
          <Check className="w-3.5 h-3.5" />
          <span>Real-time Dynamic Sync</span>
        </div>
      </div>
    </div>
  );
};
