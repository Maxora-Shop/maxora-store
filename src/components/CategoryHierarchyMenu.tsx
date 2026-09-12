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
  Edit2,
  Layers,
} from 'lucide-react';

export interface CategoryHierarchyMenuProps {
  isOpen: boolean;
  onClose: () => void;
  taxonomy: TaxonomyCategory[];
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
  onSelectProduct?: (product: Product) => void;
  mode?: 'store' | 'admin';
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
  taxonomy = [],
  currentFilter = {} as Partial<TaxonomyFilterState>,
  onSelectTaxonomy,
  products = [],
  onSelectProduct,
  mode = 'store',
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Separate, explicit states for each of the 4 levels
  const [selectedCategory, setSelectedCategory] = useState<TaxonomyCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<TaxonomySubCategory | null>(null);
  const [selectedProductType, setSelectedProductType] = useState<TaxonomyProductType | null>(null);
  const [selectedChildCategory, setSelectedChildCategory] = useState<TaxonomyChildCategory | null>(null);

  // Mobile drill-down navigation step
  type MobileStep = 'categories' | 'subcategories' | 'product_types' | 'child_categories';
  const [mobileStep, setMobileStep] = useState<MobileStep>('categories');

  // Sync state when taxonomy loads or currentFilter is passed on mount
  useEffect(() => {
    if (!isOpen || taxonomy.length === 0) return;

    // 1. If currentFilter has a category, sync from currentFilter
    if (currentFilter.category) {
      const matched = taxonomy.find(
        (c) =>
          c.slug.toLowerCase() === currentFilter.category?.toLowerCase() ||
          c.name.toLowerCase() === currentFilter.category?.toLowerCase() ||
          (c.id && currentFilter.categoryId && c.id === currentFilter.categoryId) ||
          matchesTaxonomyField(c.slug, currentFilter.category) ||
          matchesTaxonomyField(c.name, currentFilter.category)
      );

      if (matched) {
        setSelectedCategory(matched);
        if (currentFilter.subCategory) {
          const subMatched = matched.subCategories.find(
            (s) =>
              s.slug.toLowerCase() === currentFilter.subCategory?.toLowerCase() ||
              s.name.toLowerCase() === currentFilter.subCategory?.toLowerCase() ||
              (s.id && currentFilter.subCategoryId && s.id === currentFilter.subCategoryId) ||
              matchesTaxonomyField(s.slug, currentFilter.subCategory) ||
              matchesTaxonomyField(s.name, currentFilter.subCategory)
          );
          if (subMatched) {
            setSelectedSubcategory(subMatched);
            if (currentFilter.productType) {
              const typeMatched = subMatched.productTypes.find(
                (t) =>
                  t.slug.toLowerCase() === currentFilter.productType?.toLowerCase() ||
                  t.name.toLowerCase() === currentFilter.productType?.toLowerCase() ||
                  (t.id && currentFilter.productTypeId && t.id === currentFilter.productTypeId) ||
                  matchesTaxonomyField(t.slug, currentFilter.productType) ||
                  matchesTaxonomyField(t.name, currentFilter.productType)
              );
              if (typeMatched) {
                setSelectedProductType(typeMatched);
                if (currentFilter.childCategory) {
                  const childMatched = typeMatched.childCategories.find(
                    (ch) =>
                      ch.slug.toLowerCase() === currentFilter.childCategory?.toLowerCase() ||
                      ch.name.toLowerCase() === currentFilter.childCategory?.toLowerCase() ||
                      (ch.id && currentFilter.childCategoryId && ch.id === currentFilter.childCategoryId) ||
                      matchesTaxonomyField(ch.slug, currentFilter.childCategory) ||
                      matchesTaxonomyField(ch.name, currentFilter.childCategory)
                  );
                  setSelectedChildCategory(childMatched || null);
                } else {
                  setSelectedChildCategory(null);
                }
              } else {
                setSelectedProductType(null);
                setSelectedChildCategory(null);
              }
            } else {
              setSelectedProductType(null);
              setSelectedChildCategory(null);
            }
          } else {
            setSelectedSubcategory(null);
            setSelectedProductType(null);
            setSelectedChildCategory(null);
          }
        } else {
          setSelectedSubcategory(null);
          setSelectedProductType(null);
          setSelectedChildCategory(null);
        }
        return;
      }
    }

    // 2. If already have selectedCategory in internal state, keep it synced with updated taxonomy
    if (selectedCategory) {
      const liveCat = taxonomy.find(
        (c) =>
          c.slug === selectedCategory.slug ||
          (c.id && c.id === selectedCategory.id) ||
          c.name.toLowerCase() === selectedCategory.name.toLowerCase()
      );
      if (liveCat) {
        setSelectedCategory(liveCat);
        return;
      }
    }

    // 3. Fallback to first category so user sees its subcategories immediately
    setSelectedCategory(taxonomy[0]);
    setSelectedSubcategory(null);
    setSelectedProductType(null);
    setSelectedChildCategory(null);
  }, [
    isOpen,
    taxonomy,
    currentFilter.category,
    currentFilter.subCategory,
    currentFilter.productType,
    currentFilter.childCategory,
    currentFilter.categoryId,
    currentFilter.subCategoryId,
    currentFilter.productTypeId,
    currentFilter.childCategoryId,
  ]);

  // Robust outside-click and escape handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;

      // Check if click is inside the menu ref
      if (menuRef.current && (menuRef.current === target || menuRef.current.contains(target))) {
        return;
      }

      // Check if target has a parent inside the menu (protects against elements unmounted mid-click)
      const targetEl = target as HTMLElement;
      if (targetEl.closest && targetEl.closest('#category-hierarchy-mega-menu, [data-hierarchy-menu]')) {
        return;
      }

      // Check if clicked the toggle trigger button
      if (
        targetEl.closest &&
        targetEl.closest('[data-hierarchy-trigger], #navbar-categories-menu-button, #admin-hierarchy-trigger')
      ) {
        return;
      }

      // Check if clicked inside an active action dialog/modal (e.g. product edit modal opened from hierarchy)
      if (
        targetEl.closest &&
        targetEl.closest('[role="dialog"], [data-modal-container], .modal, [id*="modal"], [id*="Modal"]')
      ) {
        return;
      }

      // Only close if genuinely clicked outside
      onClose();
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

  // Real-time matching products within the current active hierarchy selection
  const matchingProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    return products.filter((p) => {
      // In store mode, only active products; in admin mode, show products for catalog management
      if (mode !== 'admin' && (p.active === 0 || p.active === false || String(p.active) === '0')) {
        return false;
      }

      // Filter by Level 1: Category
      if (selectedCategory) {
        const matchCat =
          (p.category_id &&
            (p.category_id === selectedCategory.id || matchesTaxonomyField(p.category_id, selectedCategory.id))) ||
          matchesTaxonomyField(p.category, selectedCategory.slug) ||
          matchesTaxonomyField(p.category, selectedCategory.name);
        if (!matchCat) return false;
      }

      // Filter by Level 2: Subcategory
      if (selectedSubcategory) {
        const matchSub =
          (p.subcategory_id &&
            (p.subcategory_id === selectedSubcategory.id || matchesTaxonomyField(p.subcategory_id, selectedSubcategory.id))) ||
          matchesTaxonomyField(p.sub_category, selectedSubcategory.slug) ||
          matchesTaxonomyField(p.sub_category, selectedSubcategory.name);
        if (!matchSub) return false;
      }

      // Filter by Level 3: Product Type
      if (selectedProductType) {
        const matchType =
          (p.product_type_id &&
            (p.product_type_id === selectedProductType.id || matchesTaxonomyField(p.product_type_id, selectedProductType.id))) ||
          matchesTaxonomyField(p.product_type, selectedProductType.slug) ||
          matchesTaxonomyField(p.product_type, selectedProductType.name);
        if (!matchType) return false;
      }

      // Filter by Level 4: Child Category
      if (selectedChildCategory) {
        const childKey = selectedChildCategory.slug || selectedChildCategory.name;
        const matchChild =
          (p.childcategory_id &&
            (p.childcategory_id === selectedChildCategory.id ||
              matchesTaxonomyField(p.childcategory_id, selectedChildCategory.id))) ||
          (p.child_category_id &&
            (p.child_category_id === selectedChildCategory.id ||
              matchesTaxonomyField(p.child_category_id, selectedChildCategory.id))) ||
          matchesTaxonomyField(p.child_category, childKey) ||
          matchesTaxonomyField(p.childcategory_slug, childKey) ||
          matchesTaxonomyField(p.child_category_slug, childKey);
        if (!matchChild) return false;
      }

      return true;
    });
  }, [products, selectedCategory, selectedSubcategory, selectedProductType, selectedChildCategory, mode]);

  // =========================================================================
  // INTERACTION HANDLERS: ALL PRESERVE OPEN STATE & RESET ONLY LOWER TIERS
  // =========================================================================

  // 1. Level 1: Category Click -> Reset subcategory, productType, childCategory
  const handleCategoryClick = (cat: TaxonomyCategory, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedCategory(cat);
    setSelectedSubcategory(null);
    setSelectedProductType(null);
    setSelectedChildCategory(null);

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
    // DO NOT call onClose()
  };

  // 2. Level 2: Subcategory Click -> Reset productType, childCategory
  const handleSubCategoryClick = (sub: TaxonomySubCategory, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedSubcategory(sub);
    setSelectedProductType(null);
    setSelectedChildCategory(null);

    if (onSelectTaxonomy && selectedCategory) {
      onSelectTaxonomy({
        category: selectedCategory.slug || selectedCategory.name,
        subCategory: sub.slug || sub.name,
        productType: '',
        childCategory: '',
        categoryId: selectedCategory.id,
        subCategoryId: sub.id,
        productTypeId: '',
        childCategoryId: '',
      });
    }
    // DO NOT call onClose()
  };

  // 3. Level 3: Product Type Click -> Reset childCategory
  const handleProductTypeClick = (type: TaxonomyProductType, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedProductType(type);
    setSelectedChildCategory(null);

    if (onSelectTaxonomy && selectedCategory && selectedSubcategory) {
      onSelectTaxonomy({
        category: selectedCategory.slug || selectedCategory.name,
        subCategory: selectedSubcategory.slug || selectedSubcategory.name,
        productType: type.slug || type.name,
        childCategory: '',
        categoryId: selectedCategory.id,
        subCategoryId: selectedSubcategory.id,
        productTypeId: type.id,
        childCategoryId: '',
      });
    }
    // DO NOT call onClose()
  };

  // 4. Level 4: Child Category Click
  const handleChildCategoryClick = (child: TaxonomyChildCategory, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedChildCategory(child);

    if (onSelectTaxonomy && selectedCategory && selectedSubcategory && selectedProductType) {
      onSelectTaxonomy({
        category: selectedCategory.slug || selectedCategory.name,
        subCategory: selectedSubcategory.slug || selectedSubcategory.name,
        productType: selectedProductType.slug || selectedProductType.name,
        childCategory: child.slug || child.name,
        categoryId: selectedCategory.id,
        subCategoryId: selectedSubcategory.id,
        productTypeId: selectedProductType.id,
        childCategoryId: child.id,
      });
    }
    // DO NOT call onClose()
  };

  // 5. VIEW ALL BUTTONS -> Filter and update, DO NOT CLOSE
  const handleViewAllCategory = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!selectedCategory) return;
    setSelectedSubcategory(null);
    setSelectedProductType(null);
    setSelectedChildCategory(null);

    if (onSelectTaxonomy) {
      onSelectTaxonomy({
        category: selectedCategory.slug || selectedCategory.name,
        subCategory: '',
        productType: '',
        childCategory: '',
        categoryId: selectedCategory.id,
        subCategoryId: '',
        productTypeId: '',
        childCategoryId: '',
      });
    }
    // DO NOT call onClose()
  };

  const handleViewAllSubcategory = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!selectedCategory || !selectedSubcategory) return;
    setSelectedProductType(null);
    setSelectedChildCategory(null);

    if (onSelectTaxonomy) {
      onSelectTaxonomy({
        category: selectedCategory.slug || selectedCategory.name,
        subCategory: selectedSubcategory.slug || selectedSubcategory.name,
        productType: '',
        childCategory: '',
        categoryId: selectedCategory.id,
        subCategoryId: selectedSubcategory.id,
        productTypeId: '',
        childCategoryId: '',
      });
    }
    // DO NOT call onClose()
  };

  const handleViewAllProductType = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!selectedCategory || !selectedSubcategory || !selectedProductType) return;
    setSelectedChildCategory(null);

    if (onSelectTaxonomy) {
      onSelectTaxonomy({
        category: selectedCategory.slug || selectedCategory.name,
        subCategory: selectedSubcategory.slug || selectedSubcategory.name,
        productType: selectedProductType.slug || selectedProductType.name,
        childCategory: '',
        categoryId: selectedCategory.id,
        subCategoryId: selectedSubcategory.id,
        productTypeId: selectedProductType.id,
        childCategoryId: '',
      });
    }
    // DO NOT call onClose()
  };

  const handleSelectAllProducts = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (taxonomy.length > 0) {
      setSelectedCategory(taxonomy[0]);
    }
    setSelectedSubcategory(null);
    setSelectedProductType(null);
    setSelectedChildCategory(null);

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
    // DO NOT call onClose()
  };

  // 6. PRODUCT CLICK -> Open product modal/editor, DO NOT CLOSE PANEL BEFORE ACTION
  const handleProductClick = (e: React.MouseEvent, prod: Product) => {
    e.preventDefault();
    e.stopPropagation();

    if (onSelectProduct) {
      onSelectProduct(prod);
    } else {
      const slug = getProductSlug(prod);
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const fullUrl = `${origin}/product/${slug}`;

      if (typeof window !== 'undefined') {
        window.history.pushState({ slug, productId: prod.id }, '', `/product/${slug}`);
      }
      try {
        window.open(fullUrl, '_blank');
      } catch {
        // iframe fallback
      }
    }
    // DO NOT close hierarchy automatically
  };

  // Explicit Close Button handler
  const handleExplicitClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      id="category-hierarchy-mega-menu"
      data-hierarchy-menu="true"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className="absolute top-full left-0 mt-2 z-50 w-full max-w-[95vw] lg:max-w-5xl bg-white rounded-2xl shadow-2xl border border-zinc-200/90 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
    >
      {/* Top Header Bar */}
      <div className="px-5 py-3 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black tracking-tight flex items-center gap-2">
              <span>Category Hierarchy</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-semibold">
                {mode === 'admin' ? 'Admin Catalog Navigator' : 'Dynamic Store Catalog'}
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
            title="Reset filters and show all products"
          >
            All Products
          </button>
          <button
            type="button"
            onClick={handleExplicitClose}
            className="w-7 h-7 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center cursor-pointer transition-colors"
            title="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          DESKTOP 4-COLUMN MEGA MENU
          Hierarchy:
          Column 1: Categories
          Column 2: Subcategory
          Column 3: Product Type
          Column 4: Child Category & Matching Products
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
              const isSelected = selectedCategory?.slug === cat.slug || selectedCategory?.id === cat.id;

              return (
                <button
                  key={cat.slug || cat.id || cat.name}
                  type="button"
                  onClick={(e) => handleCategoryClick(cat, e)}
                  className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-white shadow-sm border border-zinc-200 text-zinc-950 font-bold'
                      : 'hover:bg-zinc-100/80 text-zinc-700 font-medium border border-transparent'
                  }`}
                >
                  <div className="flex-1 text-left flex items-center gap-2.5 truncate">
                    <span className={isSelected ? 'text-emerald-600' : 'text-zinc-400'}>
                      {getCategoryIcon(cat.slug || cat.name)}
                    </span>
                    <span className="truncate">{cat.name}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-500 font-medium">
                      {cat.count}
                    </span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isSelected ? 'text-emerald-600 translate-x-0.5' : 'text-zinc-300'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tier 2: Subcategory */}
        <div className="flex flex-col bg-white p-2 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
            <span>2. Subcategory</span>
            <span className="text-[10px] text-zinc-400">
              {selectedCategory?.subCategories.length || 0}
            </span>
          </div>

          {selectedCategory ? (
            <div className="space-y-1">
              {/* Direct "View all [Category]" button */}
              <button
                type="button"
                onClick={handleViewAllCategory}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center justify-between mb-1 border border-dashed border-emerald-200 cursor-pointer"
                title={`Filter all items in ${selectedCategory.name}`}
              >
                <span>View All {selectedCategory.name}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                  {selectedCategory.count} items
                </span>
              </button>

              {selectedCategory.subCategories.map((sub) => {
                const isSelected = selectedSubcategory?.slug === sub.slug || selectedSubcategory?.id === sub.id;

                return (
                  <button
                    key={sub.slug || sub.id || sub.name}
                    type="button"
                    onClick={(e) => handleSubCategoryClick(sub, e)}
                    className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-zinc-100 shadow-2xs text-zinc-950 font-bold border border-zinc-200/80'
                        : 'hover:bg-zinc-50 text-zinc-700 font-medium border border-transparent'
                    }`}
                  >
                    <div className="flex-1 text-left flex items-center gap-2 truncate">
                      <span className="truncate">{sub.name}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-500 font-medium">
                        {sub.count}
                      </span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          isSelected ? 'text-emerald-600 translate-x-0.5' : 'text-zinc-300'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}

              {selectedCategory.subCategories.length === 0 && (
                <div className="p-4 text-center text-xs text-zinc-400 italic">
                  No subcategories under {selectedCategory.name}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-zinc-400">Select a category in column 1</div>
          )}
        </div>

        {/* Tier 3: Product Type */}
        <div className="flex flex-col bg-zinc-50/40 p-2 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
            <span>3. Product Type</span>
            <span className="text-[10px] text-zinc-400">
              {selectedSubcategory?.productTypes.length || 0}
            </span>
          </div>

          {selectedSubcategory ? (
            <div className="space-y-1">
              {/* Direct "View all [SubCategory]" button */}
              <button
                type="button"
                onClick={handleViewAllSubcategory}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center justify-between mb-1 border border-dashed border-emerald-200 cursor-pointer"
                title={`Filter all items in ${selectedSubcategory.name}`}
              >
                <span>View All {selectedSubcategory.name}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                  {selectedSubcategory.count} items
                </span>
              </button>

              {selectedSubcategory.productTypes.map((type) => {
                const isSelected = selectedProductType?.slug === type.slug || selectedProductType?.id === type.id;

                return (
                  <button
                    key={type.slug || type.id || type.name}
                    type="button"
                    onClick={(e) => handleProductTypeClick(type, e)}
                    className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-white shadow-sm border border-zinc-200 text-zinc-950 font-bold'
                        : 'hover:bg-zinc-100/80 text-zinc-700 font-medium border border-transparent'
                    }`}
                  >
                    <div className="flex-1 text-left flex items-center gap-2 truncate">
                      <Tag className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="truncate">{type.name}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-500 font-medium">
                        {type.count}
                      </span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          isSelected ? 'text-emerald-600 translate-x-0.5' : 'text-zinc-300'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}

              {selectedSubcategory.productTypes.length === 0 && (
                <div className="p-4 text-center text-xs text-zinc-400 italic">
                  No product types under {selectedSubcategory.name}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-zinc-400">Select a subcategory in column 2</div>
          )}
        </div>

        {/* Tier 4: Child Category & Matching Products */}
        <div className="flex flex-col bg-white p-2 overflow-y-auto max-h-[480px]">
          <div className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center justify-between bg-emerald-50/50 rounded-lg mb-1">
            <span>4. Child Category</span>
            <span className="text-[10px] text-emerald-600 font-bold">
              {selectedProductType?.childCategories.length || 0}
            </span>
          </div>

          {selectedProductType ? (
            <div className="space-y-1">
              {/* Direct "View all [Product Type]" button */}
              <button
                type="button"
                onClick={handleViewAllProductType}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-zinc-900 hover:bg-zinc-100 transition-colors flex items-center justify-between mb-1 border border-zinc-200 cursor-pointer"
                title={`Filter all items in ${selectedProductType.name}`}
              >
                <span>All {selectedProductType.name}</span>
                <span className="text-[10px] bg-zinc-200 text-zinc-800 px-1.5 py-0.5 rounded font-bold">
                  {selectedProductType.count} items
                </span>
              </button>

              {selectedProductType.childCategories.map((child) => {
                const isSelected =
                  selectedChildCategory?.slug === child.slug || selectedChildCategory?.name === child.name;

                return (
                  <button
                    key={child.slug || child.id || child.name}
                    type="button"
                    onClick={(e) => handleChildCategoryClick(child, e)}
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
                );
              })}

              {selectedProductType.childCategories.length === 0 && (
                <div className="p-3 text-center text-xs text-zinc-400 italic">
                  No child categories under {selectedProductType.name}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-zinc-400 italic">
              Select a product type to view child categories
            </div>
          )}

          {/* Direct Matching Products Preview List */}
          <div className="mt-3 pt-3 border-t border-zinc-200/80">
            <div className="px-1 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-600 truncate">
                Products ({matchingProducts.length})
              </span>
              <span className="text-[10px] text-emerald-600 font-bold shrink-0 flex items-center gap-0.5">
                {mode === 'admin' ? (
                  <>
                    <Edit2 className="w-3 h-3" />
                    <span>Click to Edit</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3 h-3" />
                    <span>Open details</span>
                  </>
                )}
              </span>
            </div>

            {matchingProducts.length > 0 ? (
              <div className="space-y-1.5">
                {matchingProducts.slice(0, 8).map((prod) => {
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={(e) => handleProductClick(e, prod)}
                      className="w-full text-left p-2 rounded-xl bg-zinc-50 hover:bg-emerald-50/80 border border-zinc-200/80 hover:border-emerald-300 transition-all flex items-center gap-2.5 group cursor-pointer"
                      title={mode === 'admin' ? `Edit product ${prod.name}` : `View product ${prod.name}`}
                    >
                      {prod.images?.[0] || prod.image_url ? (
                        <img
                          src={prod.images?.[0] || prod.image_url}
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
                      {mode === 'admin' ? (
                        <div className="shrink-0 text-[10px] px-2 py-1 rounded bg-zinc-200 group-hover:bg-emerald-600 group-hover:text-white font-bold text-zinc-700 flex items-center gap-1 transition-colors">
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </div>
                      ) : (
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-zinc-400 italic bg-zinc-50 rounded-xl">
                No matching products found in this branch
              </div>
            )}
          </div>
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
              Browse Hierarchy
            </span>
          )}

          <div className="text-[11px] text-zinc-600 truncate max-w-[180px]">
            {mobileStep === 'categories' && '1. Choose Category'}
            {mobileStep === 'subcategories' && `2. ${selectedCategory?.name}`}
            {mobileStep === 'product_types' && `3. ${selectedSubcategory?.name}`}
            {mobileStep === 'child_categories' && `4. ${selectedProductType?.name}`}
          </div>
        </div>

        {/* Step 1: Mobile Categories */}
        {mobileStep === 'categories' && (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={handleSelectAllProducts}
              className="w-full text-left px-3.5 py-2.5 rounded-xl bg-zinc-950 text-white font-bold text-xs flex items-center justify-between cursor-pointer"
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
                  onClick={(e) => {
                    handleCategoryClick(cat, e);
                    if (cat.subCategories.length > 0) {
                      setMobileStep('subcategories');
                    }
                  }}
                  className="flex-1 text-left px-2.5 py-2 text-xs font-bold text-zinc-900 truncate flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-emerald-600">{getCategoryIcon(cat.slug || cat.name)}</span>
                  <span className="truncate">{cat.name}</span>
                  <span className="text-[10px] text-zinc-500 font-normal">({cat.count})</span>
                </button>

                {cat.subCategories.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      handleCategoryClick(cat, e);
                      setMobileStep('subcategories');
                    }}
                    className="px-2.5 py-1.5 bg-white text-zinc-700 hover:text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-zinc-200 shrink-0 cursor-pointer"
                  >
                    <span>Subcategories</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Mobile Subcategories */}
        {mobileStep === 'subcategories' && selectedCategory && (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={handleViewAllCategory}
              className="w-full text-left px-3 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-between cursor-pointer"
            >
              <span>View All in {selectedCategory.name}</span>
              <span className="text-[10px] bg-emerald-700 px-2 py-0.5 rounded font-bold">
                {selectedCategory.count} items
              </span>
            </button>

            {selectedCategory.subCategories.map((sub) => (
              <div
                key={sub.slug}
                className="flex items-center justify-between p-1 bg-zinc-50 rounded-xl border border-zinc-200"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    handleSubCategoryClick(sub, e);
                    if (sub.productTypes.length > 0) {
                      setMobileStep('product_types');
                    }
                  }}
                  className="flex-1 text-left px-2.5 py-2 text-xs font-bold text-zinc-900 truncate cursor-pointer"
                >
                  <span>{sub.name}</span>
                  <span className="text-[10px] text-zinc-500 font-normal ml-1">({sub.count})</span>
                </button>

                {sub.productTypes.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      handleSubCategoryClick(sub, e);
                      setMobileStep('product_types');
                    }}
                    className="px-2.5 py-1.5 bg-white text-zinc-700 hover:text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-zinc-200 shrink-0 cursor-pointer"
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
        {mobileStep === 'product_types' && selectedCategory && selectedSubcategory && (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={handleViewAllSubcategory}
              className="w-full text-left px-3 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-between cursor-pointer"
            >
              <span>View All in {selectedSubcategory.name}</span>
              <span className="text-[10px] bg-emerald-700 px-2 py-0.5 rounded font-bold">
                {selectedSubcategory.count} items
              </span>
            </button>

            {selectedSubcategory.productTypes.map((type) => (
              <div
                key={type.slug}
                className="flex items-center justify-between p-1 bg-zinc-50 rounded-xl border border-zinc-200"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    handleProductTypeClick(type, e);
                    if (type.childCategories.length > 0) {
                      setMobileStep('child_categories');
                    }
                  }}
                  className="flex-1 text-left px-2.5 py-2 text-xs font-bold text-zinc-900 truncate cursor-pointer"
                >
                  <span>{type.name}</span>
                  <span className="text-[10px] text-zinc-500 font-normal ml-1">({type.count})</span>
                </button>

                {type.childCategories.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      handleProductTypeClick(type, e);
                      setMobileStep('child_categories');
                    }}
                    className="px-2.5 py-1.5 bg-white text-zinc-700 hover:text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-zinc-200 shrink-0 cursor-pointer"
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
                    Products ({matchingProducts.length})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {matchingProducts.slice(0, 6).map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={(e) => handleProductClick(e, prod)}
                      className="w-full text-left p-2 rounded-xl bg-white border border-zinc-200 flex items-center gap-2 cursor-pointer hover:border-emerald-400 transition-colors"
                    >
                      {prod.images?.[0] || prod.image_url ? (
                        <img
                          src={prod.images?.[0] || prod.image_url}
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
                      {mode === 'admin' ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-bold">
                          Edit
                        </span>
                      ) : (
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Mobile Child Categories */}
        {mobileStep === 'child_categories' && selectedCategory && selectedSubcategory && selectedProductType && (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={handleViewAllProductType}
              className="w-full text-left px-3 py-2.5 rounded-xl bg-zinc-950 text-white font-bold text-xs flex items-center justify-between cursor-pointer"
            >
              <span>All in {selectedProductType.name}</span>
              <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded font-bold">
                {selectedProductType.count} items
              </span>
            </button>

            {selectedProductType.childCategories.map((child) => (
              <button
                key={child.slug}
                type="button"
                onClick={(e) => handleChildCategoryClick(child, e)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-2xs cursor-pointer ${
                  selectedChildCategory?.slug === child.slug || selectedChildCategory?.name === child.name
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-zinc-200 text-zinc-900 hover:border-emerald-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedChildCategory?.slug === child.slug ? 'bg-white' : 'bg-emerald-500'
                    }`}
                  />
                  <span>{child.name}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100/30">
                  {child.count} items
                </span>
              </button>
            ))}

            {matchingProducts.length > 0 && (
              <div className="pt-2 mt-2 border-t border-zinc-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 block">
                    Products in {selectedProductType.name} ({matchingProducts.length})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {matchingProducts.slice(0, 8).map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={(e) => handleProductClick(e, prod)}
                      className="w-full text-left p-2 rounded-xl bg-white border border-zinc-200 flex items-center gap-2 cursor-pointer hover:border-emerald-400 transition-colors"
                    >
                      {prod.images?.[0] || prod.image_url ? (
                        <img
                          src={prod.images?.[0] || prod.image_url}
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
                      {mode === 'admin' ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-bold">
                          Edit
                        </span>
                      ) : (
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="px-5 py-2.5 bg-zinc-50 border-t border-zinc-200 text-[11px] text-zinc-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-zinc-700">Category Hierarchy:</span>
          <span>Click any level to view matching subcategories, types, child categories and products</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-emerald-700 font-bold">
          <Check className="w-3.5 h-3.5" />
          <span>Real-time Dynamic Sync</span>
        </div>
      </div>
    </div>
  );
};

