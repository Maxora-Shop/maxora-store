import React from 'react';
import { Sparkles, Headphones, Watch, ShoppingBag, Home, Coffee, Shirt, Package, Layers, ChevronRight } from 'lucide-react';
import { Category, SubCategory } from '../types';

interface CategoryFilterProps {
  categories: (Category | string)[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  subCategories?: SubCategory[];
  selectedSubCategory?: string;
  onSelectSubCategory?: (subCategory: string) => void;
  products?: Product[];
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "All": <Sparkles className="w-4 h-4" />,
  "Smart Gadgets": <Watch className="w-4 h-4" />,
  "Audio": <Headphones className="w-4 h-4" />,
  "Lifestyle & Bags": <ShoppingBag className="w-4 h-4" />,
  "Home & Living": <Home className="w-4 h-4" />,
  "Accessories": <Shirt className="w-4 h-4" />,
  "Gourmet & Food": <Coffee className="w-4 h-4" />
};

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  subCategories = [],
  selectedSubCategory = '',
  onSelectSubCategory,
  products = [],
}) => {
  // Normalize categories into objects
  const normalizedCats = categories.map((c) => {
    if (typeof c === 'string') {
      return { id: c, name: c, slug: c.toLowerCase().replace(/[\s_]+/g, '-') };
    }
    return c;
  });

  const activeCats = normalizedCats.filter(
    (c) => (c as Category).active !== 0 && (c as Category).active !== false
  );

  const activeCatSlug = (selectedCategory || '').toLowerCase();
  const currentCategoryObj = activeCats.find(
    (c) => c.slug?.toLowerCase() === activeCatSlug || c.name?.toLowerCase() === activeCatSlug
  );

  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    if (!products) return counts;
    products.forEach((p) => {
      if (p.active === 0 || p.active === false) return;
      const cat = (p.category || '').toLowerCase().trim();
      const catSlug = cat.replace(/[\s_]+/g, '-');
      counts[cat] = (counts[cat] || 0) + 1;
      counts[catSlug] = (counts[catSlug] || 0) + 1;
    });
    return counts;
  }, [products]);

  const relevantSubCategories = currentCategoryObj
    ? subCategories.filter(
        (sub) =>
          sub.active !== 0 &&
          sub.active !== false &&
          ((sub.category_slug && sub.category_slug.toLowerCase() === currentCategoryObj.slug?.toLowerCase()) ||
            (sub.category_id && sub.category_id === currentCategoryObj.id))
      )
    : [];

  return (
    <div className="my-6 sm:my-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Marketplace Catalog</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-zinc-950 tracking-tight">
            Shop by Category
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500">
            Browse verified authentic essentials and top trending gadget deals
          </p>
        </div>

        {selectedCategory && (
          <button
            onClick={() => {
              onSelectCategory('');
              if (onSelectSubCategory) onSelectSubCategory('');
            }}
            className="text-xs font-bold text-zinc-500 hover:text-zinc-900 underline transition-colors cursor-pointer self-start sm:self-auto"
          >
            Clear Filter (Show All)
          </button>
        )}
      </div>

      {/* Visual Marketplace Category Showcase Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-4">
        {activeCats.slice(0, 6).map((category) => {
          const isSelected =
            selectedCategory !== '' &&
            (selectedCategory.toLowerCase() === category.slug?.toLowerCase() ||
              selectedCategory.toLowerCase() === category.name?.toLowerCase());

          const icon =
            CATEGORY_ICONS[category.name || ''] ||
            CATEGORY_ICONS[category.slug || ''] ||
            <Package className="w-5 h-5" />;

          const count =
            categoryCounts[(category.name || '').toLowerCase().trim()] ||
            categoryCounts[(category.slug || '').toLowerCase().trim()] ||
            0;

          return (
            <button
              key={`card-${category.id || category.slug}`}
              type="button"
              onClick={() => {
                onSelectCategory(category.slug || category.name);
                if (onSelectSubCategory) onSelectSubCategory('');
              }}
              className={`group flex flex-col items-center text-center p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-50/90 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                  : 'bg-white hover:bg-zinc-50/80 border-zinc-200/90 hover:border-zinc-300 shadow-2xs hover:shadow-xs'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 mb-2.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-700 group-hover:bg-emerald-100 group-hover:text-emerald-700'
                }`}
              >
                {icon}
              </div>
              <span
                className={`text-xs sm:text-sm font-bold tracking-tight line-clamp-1 ${
                  isSelected ? 'text-emerald-950' : 'text-zinc-900 group-hover:text-emerald-700'
                }`}
              >
                {category.name}
              </span>
              <span className="text-[10px] text-zinc-400 font-medium mt-0.5">
                {count > 0 ? `${count} Products` : 'Browse'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Primary Categories Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => {
            onSelectCategory('');
            if (onSelectSubCategory) onSelectSubCategory('');
          }}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs active:scale-98 ${
            !selectedCategory
              ? 'bg-zinc-950 text-white shadow-md'
              : 'bg-white text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 border border-zinc-200/90'
          }`}
        >
          <span className={!selectedCategory ? 'text-emerald-400' : 'text-zinc-400'}>
            <Sparkles className="w-4 h-4" />
          </span>
          <span>All Products</span>
        </button>

        {activeCats.map((category) => {
          const isSelected =
            selectedCategory !== '' &&
            (selectedCategory.toLowerCase() === category.slug?.toLowerCase() ||
              selectedCategory.toLowerCase() === category.name?.toLowerCase());

          const icon =
            CATEGORY_ICONS[category.name || ''] ||
            CATEGORY_ICONS[category.slug || ''] ||
            <Package className="w-4 h-4" />;

          return (
            <button
              key={category.id || category.slug}
              onClick={() => {
                onSelectCategory(category.slug || category.name);
                if (onSelectSubCategory) onSelectSubCategory('');
              }}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs active:scale-98 ${
                isSelected
                  ? 'bg-zinc-950 text-white shadow-md'
                  : 'bg-white text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 border border-zinc-200/90'
              }`}
            >
              <span className={isSelected ? 'text-emerald-400' : 'text-zinc-400'}>
                {icon}
              </span>
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>

      {/* Subcategories Ribbon (if selected category has subcategories) */}
      {selectedCategory && relevantSubCategories.length > 0 && (
        <div className="mt-3 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2 mb-2 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            <span>{currentCategoryObj?.name} Subcategories:</span>
            <ChevronRight className="w-3 h-3 text-zinc-400" />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => onSelectSubCategory && onSelectSubCategory('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                !selectedSubCategory
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
              }`}
            >
              All {currentCategoryObj?.name}
            </button>
            {relevantSubCategories.map((sub) => {
              const isSubSelected =
                selectedSubCategory !== '' &&
                (selectedSubCategory.toLowerCase() === sub.slug?.toLowerCase() ||
                  selectedSubCategory.toLowerCase() === sub.name?.toLowerCase());

              return (
                <button
                  key={sub.id || sub.slug}
                  onClick={() => onSelectSubCategory && onSelectSubCategory(sub.slug || sub.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    isSubSelected
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
