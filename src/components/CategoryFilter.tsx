import React from 'react';
import { Sparkles, Headphones, Watch, ShoppingBag, Home, Coffee, Shirt, Package } from 'lucide-react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
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
}) => {
  const allList = ["All", ...categories.filter(c => c !== "All")];

  return (
    <div className="my-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
            Shop by Category
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500">
            Browse our curated selection of high quality essentials
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {allList.map((category) => {
          const isSelected = (selectedCategory === "" && category === "All") || selectedCategory === category;
          const icon = CATEGORY_ICONS[category] || <Package className="w-4 h-4" />;

          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category === "All" ? "" : category)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? "bg-zinc-900 text-white shadow-md scale-[1.02]"
                  : "bg-white text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200"
              }`}
            >
              <span className={isSelected ? "text-emerald-400" : "text-zinc-500"}>
                {icon}
              </span>
              <span>{category}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
