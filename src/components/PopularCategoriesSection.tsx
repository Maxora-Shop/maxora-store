import React from 'react';
import {
  Cpu,
  Watch,
  Headphones,
  ShoppingBag,
  Sparkles,
  Smartphone,
  Laptop,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { Category } from '../types';

interface PopularCategoriesSectionProps {
  categories: Category[];
  selectedCategory?: string;
  onSelectCategory: (slug: string) => void;
  productCountMap?: Record<string, number>;
}

// Fallback icon helper based on category name or slug
const getCategoryIcon = (category: Category) => {
  const name = (category.name || '').toLowerCase();
  const slug = (category.slug || '').toLowerCase();

  if (name.includes('electr') || slug.includes('electr')) return <Cpu className="w-5 h-5 text-emerald-600" />;
  if (name.includes('watch') || name.includes('gadget') || slug.includes('gadget')) return <Watch className="w-5 h-5 text-blue-600" />;
  if (name.includes('audio') || name.includes('headphone') || name.includes('sound') || slug.includes('audio')) return <Headphones className="w-5 h-5 text-indigo-600" />;
  if (name.includes('game') || name.includes('computer') || slug.includes('computer')) return <Sparkles className="w-5 h-5 text-purple-600" />;
  if (name.includes('phone') || name.includes('mobile')) return <Smartphone className="w-5 h-5 text-rose-600" />;
  if (name.includes('laptop')) return <Laptop className="w-5 h-5 text-cyan-600" />;
  if (name.includes('deal') || name.includes('hot')) return <Flame className="w-5 h-5 text-amber-600" />;

  return <ShoppingBag className="w-5 h-5 text-emerald-600" />;
};

export const PopularCategoriesSection: React.FC<PopularCategoriesSectionProps> = ({
  categories,
  selectedCategory = '',
  onSelectCategory,
  productCountMap = {},
}) => {
  // Filter only active categories and sort by display_order
  const displayCategories = categories
    .filter((c) => c.active !== 0 && c.active !== false)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  if (displayCategories.length === 0) return null;

  return (
    <section className="my-6 sm:my-10 w-full">
      <div className="flex items-end justify-between mb-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
              Browse Collections
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-zinc-950 tracking-tight">
            Popular Categories
          </h2>
        </div>

        <button
          type="button"
          onClick={() => onSelectCategory('')}
          className="text-xs sm:text-sm font-bold text-zinc-600 hover:text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer group"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Grid of Clean Category Cards */}
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-4">
        {displayCategories.map((category) => {
          const isSelected =
            selectedCategory.toLowerCase() === (category.slug || '').toLowerCase() ||
            selectedCategory.toLowerCase() === (category.name || '').toLowerCase();

          const count = productCountMap[category.slug || ''] || productCountMap[category.name || ''] || 0;

          return (
            <button
              key={category.id || category.slug}
              type="button"
              onClick={() => onSelectCategory(category.slug || category.name)}
              className={`group text-left p-3 sm:p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-1 hover:shadow-md ${
                isSelected
                  ? 'bg-zinc-950 text-white border-zinc-950 shadow-md ring-2 ring-emerald-500/50'
                  : 'bg-white text-zinc-900 border-zinc-200/90 hover:border-emerald-500/40 hover:bg-zinc-50/70'
              }`}
            >
              <div className="flex items-center justify-between mb-3 w-full">
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-zinc-800 text-white shadow-inner'
                      : 'bg-zinc-100/90 group-hover:bg-emerald-50 text-zinc-800'
                  }`}
                >
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="w-6 h-6 object-contain rounded-md"
                      onError={(e) => {
                        // Fallback to icon if image fails
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    getCategoryIcon(category)
                  )}
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-opacity ${
                    isSelected ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 group-hover:text-emerald-600'
                  }`}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <h3
                  className={`font-black text-xs sm:text-sm leading-snug line-clamp-1 transition-colors ${
                    isSelected ? 'text-white' : 'text-zinc-900 group-hover:text-emerald-700'
                  }`}
                  title={category.name}
                >
                  {category.name}
                </h3>
                {count > 0 && (
                  <p
                    className={`text-[10px] sm:text-[11px] mt-0.5 font-medium ${
                      isSelected ? 'text-zinc-400' : 'text-zinc-500'
                    }`}
                  >
                    {count} {count === 1 ? 'Product' : 'Products'}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
