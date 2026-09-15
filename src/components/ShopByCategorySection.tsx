import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowRight, ArrowUp, ChevronRight, LayoutGrid, X, Layers } from 'lucide-react';
import { Category, Product, SubCategory } from '../types';
import { useTaxonomy } from '../context/TaxonomyContext';
import { TaxonomyCategory, TaxonomySubCategory } from '../utils/taxonomy';

interface ShopByCategorySectionProps {
  categories?: Category[];
  taxonomy?: TaxonomyCategory[];
  products?: Product[];
  onSelectCategory: (categorySlug: string, categoryId?: string) => void;
  onSelectTaxonomy?: (filter: {
    category?: string;
    subCategory?: string;
    productType?: string;
    childCategory?: string;
    categoryId?: string;
  }) => void;
}

// Curated high-quality, cutout-style product photography fallback map for Maxora categories
const THEME_FALLBACK_IMAGES: Record<string, string> = {
  'electronics': 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&auto=format&fit=crop&q=80',
  'smart-gadgets': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80',
  'audio': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=80',
  'computer-gaming': 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&auto=format&fit=crop&q=80',
  'lifestyle-bags': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&auto=format&fit=crop&q=80',
  'fashion': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&auto=format&fit=crop&q=80',
  'fashion-lifestyle': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&auto=format&fit=crop&q=80',
  'beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&auto=format&fit=crop&q=80',
  'beauty-personal-care': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&auto=format&fit=crop&q=80',
  'home-living': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&auto=format&fit=crop&q=80',
  'home-kitchen': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&auto=format&fit=crop&q=80',
  'accessories': 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&auto=format&fit=crop&q=80',
  'mobile-accessories': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&auto=format&fit=crop&q=80',
  'kids-baby': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&auto=format&fit=crop&q=80',
  'health-wellness': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&auto=format&fit=crop&q=80',
  'gourmet-food': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80',
};

const GENERIC_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&auto=format&fit=crop&q=80';

export interface DisplayCategoryItem {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  display_order: number;
  count: number;
  subCategories: Array<{
    id?: string;
    name: string;
    slug: string;
    count: number;
  }>;
}

export const ShopByCategorySection: React.FC<ShopByCategorySectionProps> = ({
  categories: propCategories,
  taxonomy: propTaxonomy,
  products = [],
  onSelectCategory,
  onSelectTaxonomy,
}) => {
  const taxonomyContext = useTaxonomy();
  const rawCategories = propCategories || taxonomyContext.categories;
  const taxonomyTree = propTaxonomy || taxonomyContext.taxonomyTree;

  // Track expanded state (initially show 5, expand to reveal all)
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Track broken image errors gracefully
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Active subcategory modal state for categories that have subcategories
  const [activeSubcategoryCat, setActiveSubcategoryCat] = useState<DisplayCategoryItem | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close subcategory modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveSubcategoryCat(null);
      }
    };
    if (activeSubcategoryCat) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeSubcategoryCat]);

  // Compute active categories with dynamic item counts, subcategories, and real images
  const displayCategories = useMemo<DisplayCategoryItem[]>(() => {
    // Count products per category
    const countByCatId = new Map<string, number>();
    const countByCatSlug = new Map<string, number>();
    const countByCatName = new Map<string, number>();
    const sampleProductImage = new Map<string, string>();

    products.forEach((p) => {
      if (p.active === 0 || p.active === false || String(p.active) === '0') return;

      const img = p.image_url || (p.images && p.images[0]) || '';

      if (p.category_id) {
        const idKey = String(p.category_id).toLowerCase().trim();
        countByCatId.set(idKey, (countByCatId.get(idKey) || 0) + 1);
        if (img && !sampleProductImage.has(idKey)) sampleProductImage.set(idKey, img);
      }
      if (p.category) {
        const nameKey = String(p.category).toLowerCase().trim();
        countByCatName.set(nameKey, (countByCatName.get(nameKey) || 0) + 1);
        if (img && !sampleProductImage.has(nameKey)) sampleProductImage.set(nameKey, img);
      }
    });

    // Look at taxonomyTree for precalculated counts & subcategories
    const taxonomyCountMap = new Map<string, number>();
    const taxonomySubMap = new Map<string, TaxonomySubCategory[]>();

    taxonomyTree.forEach((t) => {
      if (t.id) {
        const idK = t.id.toLowerCase().trim();
        taxonomyCountMap.set(idK, t.count);
        if (t.subCategories?.length) taxonomySubMap.set(idK, t.subCategories);
      }
      if (t.slug) {
        const slugK = t.slug.toLowerCase().trim();
        taxonomyCountMap.set(slugK, t.count);
        if (t.subCategories?.length) taxonomySubMap.set(slugK, t.subCategories);
      }
    });

    // Filter only active categories
    const active = rawCategories.filter(
      (c) => c.active !== 0 && c.active !== false && String(c.active) !== '0'
    );

    // Map categories with accurate counts, images, and subcategories
    const list: DisplayCategoryItem[] = active.map((cat) => {
      const slugKey = (cat.slug || cat.name.toLowerCase().replace(/[\s_&]+/g, '-')).trim();
      const nameKey = cat.name.toLowerCase().trim();
      const idKey = cat.id?.toLowerCase().trim() || '';

      const count =
        taxonomyCountMap.get(idKey) ??
        taxonomyCountMap.get(slugKey) ??
        countByCatId.get(idKey) ??
        countByCatName.get(nameKey) ??
        countByCatSlug.get(slugKey) ??
        0;

      // Determine best image
      let imageUrl = cat.image_url?.trim() || '';
      if (!imageUrl || imageUrl.includes('placeholder')) {
        imageUrl =
          sampleProductImage.get(idKey) ||
          sampleProductImage.get(nameKey) ||
          sampleProductImage.get(slugKey) ||
          THEME_FALLBACK_IMAGES[slugKey] ||
          THEME_FALLBACK_IMAGES[nameKey] ||
          '';
      }

      // Determine subcategories
      let subs = taxonomySubMap.get(idKey) || taxonomySubMap.get(slugKey) || [];
      if (subs.length === 0 && taxonomyContext.getSubCategoriesForCategory) {
        const rawSubs = taxonomyContext.getSubCategoriesForCategory(cat.id);
        if (rawSubs && rawSubs.length > 0) {
          subs = rawSubs.map((s) => ({
            id: s.id,
            name: s.name,
            slug: s.slug || s.name.toLowerCase().replace(/[\s_&]+/g, '-'),
            count: 0,
            productTypes: [],
          }));
        }
      }

      // Calculate dynamic count for each subcategory
      const formattedSubs = subs.map((s) => {
        let subCount = s.count || 0;
        if (subCount === 0) {
          products.forEach((p) => {
            if (p.active === 0 || p.active === false || String(p.active) === '0') return;
            const pSub = (p.subcategory || '').toLowerCase().trim();
            const pSubId = (p.subcategory_id || '').toLowerCase().trim();
            const sSlug = s.slug.toLowerCase().trim();
            const sId = (s.id || '').toLowerCase().trim();
            if ((sId && pSubId === sId) || (sSlug && pSub === sSlug)) {
              subCount++;
            }
          });
        }
        return {
          id: s.id,
          name: s.name,
          slug: s.slug,
          count: subCount,
        };
      });

      return {
        id: cat.id,
        name: cat.name,
        slug: slugKey,
        image_url: imageUrl,
        display_order: cat.display_order ?? 99,
        count,
        subCategories: formattedSubs,
      };
    });

    // Sort by database display order
    list.sort((a, b) => a.display_order - b.display_order);

    return list;
  }, [rawCategories, taxonomyTree, products, taxonomyContext]);

  // Initial state shows only 5 categories horizontally; expanded reveals all
  const visibleCategories = useMemo(() => {
    if (isExpanded) {
      return displayCategories;
    }
    return displayCategories.slice(0, 5);
  }, [displayCategories, isExpanded]);

  // Navigate directly to category product listing page and scroll
  const handleNavigateCategory = (cat: DisplayCategoryItem) => {
    if (onSelectTaxonomy) {
      onSelectTaxonomy({
        category: cat.slug || cat.name,
        subCategory: '',
        productType: '',
        childCategory: '',
        categoryId: cat.id,
      });
    } else {
      onSelectCategory(cat.slug || cat.name, cat.id);
    }
  };

  // Navigate to selected subcategory product listing page and scroll
  const handleNavigateSubcategory = (
    cat: DisplayCategoryItem,
    sub: { id?: string; name: string; slug: string }
  ) => {
    if (onSelectTaxonomy) {
      onSelectTaxonomy({
        category: cat.slug || cat.name,
        subCategory: sub.slug || sub.name,
        productType: '',
        childCategory: '',
        categoryId: cat.id,
      });
    } else {
      onSelectCategory(cat.slug || cat.name, cat.id);
    }
  };

  // Click handler on category card
  const handleCardClick = (cat: DisplayCategoryItem) => {
    // If the category has subcategories, show the available subcategories
    if (cat.subCategories && cat.subCategories.length > 0) {
      setActiveSubcategoryCat(cat);
    } else {
      // If the category does NOT have subcategories, navigate directly to that category's product listing page
      handleNavigateCategory(cat);
    }
  };

  if (displayCategories.length === 0) {
    return null;
  }

  return (
    <section
      id="shop-by-category-section"
      className="my-6 sm:my-8 w-full bg-white transition-all"
      aria-label="Shop by Category"
    >
      {/* Section Header matching Reference Image: Left heading & subtitle, Right "View All Categories →" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[#008A45] flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              Shop by <span className="text-[#008A45]">Category</span>
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-medium text-zinc-500 mt-1">
            Explore our most popular categories
          </p>
        </div>

        {displayCategories.length > 5 && (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full border border-[#008A45] text-[#008A45] hover:bg-[#008A45]/5 text-xs sm:text-sm font-semibold transition-all cursor-pointer self-start sm:self-center shrink-0 active:scale-98"
          >
            <span>{isExpanded ? 'Show Less' : 'View All Categories'}</span>
            {isExpanded ? (
              <ArrowUp className="w-3.5 h-3.5" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Circular Category Grid matching Reference Image (5 horizontally on desktop, compact and elegant) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 transition-all duration-300">
        {visibleCategories.map((cat) => {
          const isBroken = brokenImages[cat.id || cat.slug];
          const imageSrc =
            !isBroken && cat.image_url
              ? cat.image_url
              : THEME_FALLBACK_IMAGES[cat.slug] || GENERIC_FALLBACK_IMAGE;

          return (
            <button
              key={cat.id || cat.slug}
              type="button"
              onClick={() => handleCardClick(cat)}
              className="group flex flex-col items-center text-left w-full cursor-pointer focus:outline-none transition-transform duration-200 hover:-translate-y-1"
              title={`Shop ${cat.name}`}
            >
              {/* Circular Category Image Container with soft gradient background, subtle border & soft shadow */}
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full mx-auto aspect-square flex items-center justify-center bg-gradient-to-b from-[#f2faf5] to-[#def3e7] border border-emerald-100/90 shadow-[0_4px_16px_rgba(5,150,105,0.08)] overflow-visible">
                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center p-3 sm:p-4">
                  <img
                    src={imageSrc}
                    alt={`${cat.name} - Maxora BD`}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-108"
                    onError={() => {
                      setBrokenImages((prev) => ({ ...prev, [cat.id || cat.slug]: true }));
                    }}
                  />
                </div>

                {/* Overlapping Product Count Badge on lower-right */}
                <span className="absolute bottom-0 right-0 sm:right-1 z-10 bg-white px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold text-emerald-800 border border-emerald-100/80 shadow-xs whitespace-nowrap">
                  {cat.count} {cat.count === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Category Name & Small Circular Green Arrow Button underneath */}
              <div className="w-full mt-3 sm:mt-3.5 flex items-center justify-between px-1 sm:px-2 gap-1.5">
                <span className="font-bold text-xs sm:text-sm text-zinc-900 group-hover:text-emerald-700 transition-colors truncate">
                  {cat.name}
                </span>
                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#e6f7ef] text-[#008A45] flex items-center justify-center shrink-0 group-hover:bg-[#008A45] group-hover:text-white transition-all duration-200">
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Available Subcategories Selection Modal/Popover for Categories with Subcategories */}
      {activeSubcategoryCat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setActiveSubcategoryCat(null)}
        >
          <div
            ref={popoverRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-emerald-100 p-5 max-w-sm w-full animate-in zoom-in-95 duration-150 relative"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-b from-[#f2faf5] to-[#def3e7] border border-emerald-100 flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={
                      activeSubcategoryCat.image_url ||
                      THEME_FALLBACK_IMAGES[activeSubcategoryCat.slug] ||
                      GENERIC_FALLBACK_IMAGE
                    }
                    alt=""
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">{activeSubcategoryCat.name}</h4>
                  <p className="text-xs text-zinc-500 font-medium">Choose a subcategory</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubcategoryCat(null)}
                className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-700 flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Subcategories Options List */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin pr-1">
              {/* Option to View All in this Category */}
              <button
                type="button"
                onClick={() => {
                  handleNavigateCategory(activeSubcategoryCat);
                  setActiveSubcategoryCat(null);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50/90 hover:bg-emerald-100 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>All {activeSubcategoryCat.name} Products</span>
                </div>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  {activeSubcategoryCat.count} items
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>

              {/* Subcategories list */}
              {activeSubcategoryCat.subCategories.map((sub) => (
                <button
                  key={sub.id || sub.slug}
                  type="button"
                  onClick={() => {
                    handleNavigateSubcategory(activeSubcategoryCat, sub);
                    setActiveSubcategoryCat(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 hover:text-emerald-900 hover:bg-zinc-50 transition-colors text-left cursor-pointer group border border-transparent hover:border-zinc-200"
                >
                  <span>{sub.name}</span>
                  <span className="flex items-center gap-1 text-[11px] text-zinc-400 group-hover:text-emerald-600 font-medium">
                    {sub.count > 0 ? `${sub.count} items` : ''}
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
