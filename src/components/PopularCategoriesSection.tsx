import React from 'react';
import {
  Laptop,
  ChefHat,
  Home,
  Sparkles,
  Shirt,
  Dumbbell,
  Baby,
  Wrench,
  LayoutGrid,
  ArrowRight,
} from 'lucide-react';
import { Category } from '../types';

interface PopularCategoriesSectionProps {
  categories: Category[];
  selectedCategory?: string;
  onSelectCategory: (slug: string) => void;
  productCountMap?: Record<string, number>;
}

interface PastelCategoryDef {
  name: string;
  slug: string;
  icon: React.ComponentType<{ className?: string }>;
  bgClass: string;
  borderClass: string;
  iconBgClass: string;
  iconTextClass: string;
}

const PRESET_CATEGORIES: PastelCategoryDef[] = [
  {
    name: 'Electronics',
    slug: 'electronics',
    icon: Laptop,
    bgClass: 'bg-blue-50/70 hover:bg-blue-100/70',
    borderClass: 'border-blue-100',
    iconBgClass: 'bg-blue-100/80',
    iconTextClass: 'text-blue-600',
  },
  {
    name: 'Kitchen Appliances',
    slug: 'kitchen-appliances',
    icon: ChefHat,
    bgClass: 'bg-amber-50/70 hover:bg-amber-100/70',
    borderClass: 'border-amber-100',
    iconBgClass: 'bg-amber-100/80',
    iconTextClass: 'text-amber-600',
  },
  {
    name: 'Home & Living',
    slug: 'home-living',
    icon: Home,
    bgClass: 'bg-emerald-50/70 hover:bg-emerald-100/70',
    borderClass: 'border-emerald-100',
    iconBgClass: 'bg-emerald-100/80',
    iconTextClass: 'text-emerald-600',
  },
  {
    name: 'Beauty & Health',
    slug: 'beauty-health',
    icon: Sparkles,
    bgClass: 'bg-pink-50/70 hover:bg-pink-100/70',
    borderClass: 'border-pink-100',
    iconBgClass: 'bg-pink-100/80',
    iconTextClass: 'text-pink-600',
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    icon: Shirt,
    bgClass: 'bg-indigo-50/70 hover:bg-indigo-100/70',
    borderClass: 'border-indigo-100',
    iconBgClass: 'bg-indigo-100/80',
    iconTextClass: 'text-indigo-600',
  },
  {
    name: 'Sports',
    slug: 'sports',
    icon: Dumbbell,
    bgClass: 'bg-orange-50/70 hover:bg-orange-100/70',
    borderClass: 'border-orange-100',
    iconBgClass: 'bg-orange-100/80',
    iconTextClass: 'text-orange-600',
  },
  {
    name: 'Toys & Baby',
    slug: 'toys-baby',
    icon: Baby,
    bgClass: 'bg-rose-50/70 hover:bg-rose-100/70',
    borderClass: 'border-rose-100',
    iconBgClass: 'bg-rose-100/80',
    iconTextClass: 'text-rose-600',
  },
  {
    name: 'Tools & Hardware',
    slug: 'tools-hardware',
    icon: Wrench,
    bgClass: 'bg-yellow-50/70 hover:bg-yellow-100/70',
    borderClass: 'border-yellow-100',
    iconBgClass: 'bg-yellow-100/80',
    iconTextClass: 'text-yellow-600',
  },
  {
    name: 'View All',
    slug: '',
    icon: LayoutGrid,
    bgClass: 'bg-slate-50/80 hover:bg-slate-100',
    borderClass: 'border-slate-200',
    iconBgClass: 'bg-slate-200/70',
    iconTextClass: 'text-slate-700',
  },
];

export const PopularCategoriesSection: React.FC<PopularCategoriesSectionProps> = ({
  categories = [],
  selectedCategory = '',
  onSelectCategory,
  productCountMap = {},
}) => {
  return (
    <section className="my-6 sm:my-8 w-full">
      {/* Header matching screenshot */}
      <div className="flex items-end justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
            Popular Categories
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5 font-medium">
            Explore our most popular product categories
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelectCategory('')}
          className="text-xs sm:text-sm font-bold text-zinc-700 hover:text-zinc-950 flex items-center gap-1 transition-colors cursor-pointer group"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Grid of 9 Pastel Category Cards matching screenshot */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-9 gap-2.5 sm:gap-3">
        {PRESET_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected =
            cat.slug === ''
              ? !selectedCategory
              : selectedCategory.toLowerCase() === cat.slug.toLowerCase();

          const count = cat.slug ? productCountMap[cat.slug] || 0 : null;

          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => onSelectCategory(cat.slug)}
              className={`group text-center p-3 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center cursor-pointer hover:-translate-y-1 hover:shadow-sm aspect-square ${cat.bgClass} ${cat.borderClass} ${
                isSelected ? 'ring-2 ring-zinc-950 shadow-xs' : ''
              }`}
            >
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 ${cat.iconBgClass} ${cat.iconTextClass}`}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              <h3 className="font-bold text-[11px] sm:text-xs text-zinc-900 leading-snug line-clamp-2">
                {cat.name}
              </h3>

              {count !== null && count > 0 && (
                <span className="text-[10px] text-zinc-500 mt-0.5 font-medium hidden sm:inline">
                  {count} items
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};
