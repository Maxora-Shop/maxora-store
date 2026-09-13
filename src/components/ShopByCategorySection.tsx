import React, { useState, useMemo } from 'react';
import { ArrowRight, ChevronRight, Layers, Sparkles, LayoutGrid } from 'lucide-react';
import { Category, Product } from '../types';
import { useTaxonomy } from '../context/TaxonomyContext';
import { TaxonomyCategory } from '../utils/taxonomy';

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

// Curated high-quality, theme-consistent photography fallback map for Maxora categories
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

// Generic brand placeholder if image completely fails
const GENERIC_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&auto=format&fit=crop&q=80';

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

  // Track broken image errors gracefully
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Compute active categories with item counts and real images
  const displayCategories = useMemo(() => {
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

    // Also look at taxonomyTree for precalculated counts
    const taxonomyCountMap = new Map<string, number>();
    taxonomyTree.forEach((t) => {
      if (t.id) taxonomyCountMap.set(t.id, t.count);
      if (t.slug) taxonomyCountMap.set(t.slug.toLowerCase(), t.count);
    });

    // Filter active categories
    const active = rawCategories.filter(
      (c) => c.active !== 0 && c.active !== false && String(c.active) !== '0'
    );

    // If active categories exist, sort them according to display_order or item popularity
    const list = active.map((cat) => {
      const slugKey = (cat.slug || cat.name.toLowerCase().replace(/[\s_&]+/g, '-')).trim();
      const nameKey = cat.name.toLowerCase().trim();
      const idKey = cat.id?.toLowerCase().trim() || '';

      const count =
        taxonomyCountMap.get(cat.id) ??
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

      return {
        id: cat.id,
        name: cat.name,
        slug: slugKey,
        image_url: imageUrl,
        display_order: cat.display_order ?? 99,
        count,
      };
    });

    // Sort by display order
    list.sort((a, b) => a.display_order - b.display_order);

    // Limit to 6 to 10 cards as requested in prompt (or all if between 6 and 10)
    if (list.length > 10) {
      return list.slice(0, 10);
    }
    return list;
  }, [rawCategories, taxonomyTree, products]);

  const handleCardClick = (cat: { id: string; name: string; slug: string }) => {
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

    // Smooth scroll down to catalog
    setTimeout(() => {
      const catalogEl = document.getElementById('products-catalog-section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  if (displayCategories.length === 0) {
    return null;
  }

  return (
    <section
      id="shop-by-category-section"
      className="my-6 sm:my-8 w-full"
      aria-label="Shop by Category"
    >
      {/* Section Header with clean title, subtitle, and badge */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4 sm:mb-5 pb-2 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <LayoutGrid className="w-3.5 h-3.5" />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-zinc-950 tracking-tight">
              Shop by Category
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
            Explore our most popular categories
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onSelectTaxonomy) {
              onSelectTaxonomy({
                category: '',
                subCategory: '',
                productType: '',
                childCategory: '',
              });
            } else {
              onSelectCategory('');
            }
            const catalogEl = document.getElementById('products-catalog-section');
            catalogEl?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer group shrink-0"
        >
          <span>View All Products</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Premium Category Grid (Responsive: 2 cols on mobile, 3-4 on tablet, 5-6 on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-4.5">
        {displayCategories.map((cat) => {
          const isBroken = brokenImages[cat.id || cat.slug];
          const imageSrc = !isBroken && cat.image_url
            ? cat.image_url
            : THEME_FALLBACK_IMAGES[cat.slug] || GENERIC_FALLBACK_IMAGE;

          return (
            <button
              key={cat.id || cat.slug}
              type="button"
              onClick={() => handleCardClick(cat)}
              className="group bg-white rounded-2xl border border-zinc-200/90 hover:border-emerald-300/80 p-3 sm:p-3.5 flex flex-col justify-between text-left transition-all duration-200 hover:shadow-md cursor-pointer hover:-translate-y-0.5"
              title={`Shop ${cat.name}`}
            >
              {/* Image Container with strict aspect ratio and object-contain */}
              <div className="relative aspect-[4/3] w-full rounded-xl bg-zinc-50 overflow-hidden flex items-center justify-center p-2 mb-2.5">
                <img
                  src={imageSrc}
                  alt={`${cat.name} Category - Maxora Online Shopping BD`}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain group-hover:scale-106 transition-transform duration-300"
                  onError={() => {
                    setBrokenImages((prev) => ({ ...prev, [cat.id || cat.slug]: true }));
                  }}
                />

                {cat.count > 0 && (
                  <span className="absolute bottom-1.5 right-1.5 bg-white/95 backdrop-blur-xs text-[10px] font-bold text-zinc-700 px-1.5 py-0.5 rounded-md shadow-2xs border border-zinc-200/60 pointer-events-none">
                    {cat.count} {cat.count === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>

              {/* Title & Small Explore arrow matching requirement */}
              <div className="w-full">
                <h3 className="text-xs sm:text-sm font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors line-clamp-1 truncate leading-snug">
                  {cat.name}
                </h3>
                <div className="mt-1 flex items-center justify-between text-[11px] font-bold text-emerald-600 group-hover:text-emerald-700">
                  <span>Explore</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
