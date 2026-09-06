import React from 'react';
import {
  Sparkles,
  Headphones,
  Watch,
  ShoppingBag,
  Home,
  Coffee,
  Shirt,
  Package,
  Layers,
  ChevronRight,
  X,
  Cpu,
  Tag,
} from 'lucide-react';
import { Category, SubCategory, Product } from '../types';
import {
  TaxonomyCategory,
  TaxonomySubCategory,
  TaxonomyProductType,
  TaxonomyChildCategory,
} from '../utils/taxonomy';

interface CategoryFilterProps {
  categories: (Category | string)[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  subCategories?: SubCategory[];
  selectedSubCategory?: string;
  onSelectSubCategory?: (subCategory: string) => void;
  selectedProductType?: string;
  onSelectProductType?: (productType: string) => void;
  selectedChildCategory?: string;
  onSelectChildCategory?: (childCategory: string) => void;
  taxonomy?: TaxonomyCategory[];
  products?: Product[];
  onSelectTaxonomy?: (filter: {
    category?: string;
    subCategory?: string;
    productType?: string;
    childCategory?: string;
  }) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  All: <Sparkles className="w-4 h-4" />,
  Electronics: <Cpu className="w-4 h-4" />,
  electronics: <Cpu className="w-4 h-4" />,
  'Smart Gadgets': <Watch className="w-4 h-4" />,
  'smart-gadgets': <Watch className="w-4 h-4" />,
  Audio: <Headphones className="w-4 h-4" />,
  audio: <Headphones className="w-4 h-4" />,
  'Lifestyle & Bags': <ShoppingBag className="w-4 h-4" />,
  'lifestyle-bags': <ShoppingBag className="w-4 h-4" />,
  'Home & Living': <Home className="w-4 h-4" />,
  'home-living': <Home className="w-4 h-4" />,
  Accessories: <Shirt className="w-4 h-4" />,
  accessories: <Shirt className="w-4 h-4" />,
  'Gourmet & Food': <Coffee className="w-4 h-4" />,
  'gourmet-food': <Coffee className="w-4 h-4" />,
};

function getCategoryIcon(nameOrSlug?: string): React.ReactNode {
  if (!nameOrSlug) return <Package className="w-4 h-4" />;
  const key = nameOrSlug.toLowerCase().trim().replace(/[\s_]+/g, '-');
  return CATEGORY_ICONS[key] || CATEGORY_ICONS[nameOrSlug] || <Package className="w-4 h-4" />;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  subCategories = [],
  selectedSubCategory = '',
  onSelectSubCategory,
  selectedProductType = '',
  onSelectProductType,
  selectedChildCategory = '',
  onSelectChildCategory,
  taxonomy = [],
  products = [],
  onSelectTaxonomy,
}) => {
  // Normalize categories list
  const normalizedCats = categories.map((c) => {
    if (typeof c === 'string') {
      return { id: c, name: c, slug: c.toLowerCase().replace(/[\s_]+/g, '-') };
    }
    return c;
  });

  const activeCats = normalizedCats.filter(
    (c) => (c as Category).active !== 0 && (c as Category).active !== false
  );

  // Find active node in taxonomy
  const activeTaxonomyCat = taxonomy.find(
    (c) =>
      c.slug.toLowerCase() === selectedCategory.toLowerCase() ||
      c.name.toLowerCase() === selectedCategory.toLowerCase()
  );

  const activeTaxonomySub = activeTaxonomyCat?.subCategories.find(
    (s) =>
      s.slug.toLowerCase() === selectedSubCategory.toLowerCase() ||
      s.name.toLowerCase() === selectedSubCategory.toLowerCase()
  );

  const activeTaxonomyType = activeTaxonomySub?.productTypes.find(
    (t) =>
      t.slug.toLowerCase() === selectedProductType.toLowerCase() ||
      t.name.toLowerCase() === selectedProductType.toLowerCase()
  );

  // Calculate product counts per category
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

  // Subcategories available to show
  const availableSubCategories = activeTaxonomyCat
    ? activeTaxonomyCat.subCategories
    : [];

  // Product types available to show
  const availableProductTypes = activeTaxonomySub
    ? activeTaxonomySub.productTypes
    : [];

  // Child categories available to show
  const availableChildCategories = activeTaxonomyType
    ? activeTaxonomyType.childCategories
    : [];

  const handleClearAllTaxonomy = () => {
    if (onSelectTaxonomy) {
      onSelectTaxonomy({
        category: '',
        subCategory: '',
        productType: '',
        childCategory: '',
      });
    } else {
      onSelectCategory('');
      if (onSelectSubCategory) onSelectSubCategory('');
      if (onSelectProductType) onSelectProductType('');
      if (onSelectChildCategory) onSelectChildCategory('');
    }
  };

  const handleSelectCat = (slug: string) => {
    if (onSelectTaxonomy) {
      onSelectTaxonomy({
        category: slug,
        subCategory: '',
        productType: '',
        childCategory: '',
      });
    } else {
      onSelectCategory(slug);
      if (onSelectSubCategory) onSelectSubCategory('');
      if (onSelectProductType) onSelectProductType('');
      if (onSelectChildCategory) onSelectChildCategory('');
    }
  };

  const handleSelectSub = (subSlug: string) => {
    if (onSelectTaxonomy) {
      onSelectTaxonomy({
        category: selectedCategory,
        subCategory: subSlug,
        productType: '',
        childCategory: '',
      });
    } else if (onSelectSubCategory) {
      onSelectSubCategory(subSlug);
      if (onSelectProductType) onSelectProductType('');
      if (onSelectChildCategory) onSelectChildCategory('');
    }
  };

  const handleSelectType = (typeName: string) => {
    if (onSelectTaxonomy) {
      onSelectTaxonomy({
        category: selectedCategory,
        subCategory: selectedSubCategory,
        productType: typeName,
        childCategory: '',
      });
    } else if (onSelectProductType) {
      onSelectProductType(typeName);
      if (onSelectChildCategory) onSelectChildCategory('');
    }
  };

  const handleSelectChild = (childName: string) => {
    if (onSelectTaxonomy) {
      onSelectTaxonomy({
        category: selectedCategory,
        subCategory: selectedSubCategory,
        productType: selectedProductType,
        childCategory: childName,
      });
    } else if (onSelectChildCategory) {
      onSelectChildCategory(childName);
    }
  };

  const hasAnyFilter =
    Boolean(selectedCategory) ||
    Boolean(selectedSubCategory) ||
    Boolean(selectedProductType) ||
    Boolean(selectedChildCategory);

  return (
    <div className="my-6 sm:my-8" id="category-filter-container">
      {/* Title & Catalog Header */}
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

        {hasAnyFilter && (
          <button
            onClick={handleClearAllTaxonomy}
            className="text-xs font-bold text-zinc-500 hover:text-zinc-950 underline transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset All Categories</span>
          </button>
        )}
      </div>

      {/* 4-Tier Interactive Breadcrumbs Trail */}
      {hasAnyFilter && (
        <div className="mb-4 p-2.5 sm:p-3 bg-zinc-900 text-white rounded-2xl flex items-center gap-2 text-xs overflow-x-auto shadow-sm">
          <span className="text-zinc-400 font-medium shrink-0">Filtered By:</span>

          <button
            type="button"
            onClick={handleClearAllTaxonomy}
            className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium cursor-pointer shrink-0"
          >
            All
          </button>

          {selectedCategory && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <button
                type="button"
                onClick={() => handleSelectCat(selectedCategory)}
                className={`px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1 shrink-0 ${
                  !selectedSubCategory ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                }`}
              >
                <span>{activeTaxonomyCat?.name || selectedCategory}</span>
              </button>
            </>
          )}

          {selectedSubCategory && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <button
                type="button"
                onClick={() => handleSelectSub(selectedSubCategory)}
                className={`px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1 shrink-0 ${
                  !selectedProductType ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                }`}
              >
                <span>{activeTaxonomySub?.name || selectedSubCategory}</span>
              </button>
            </>
          )}

          {selectedProductType && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <button
                type="button"
                onClick={() => handleSelectType(selectedProductType)}
                className={`px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1 shrink-0 ${
                  !selectedChildCategory ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                }`}
              >
                <span>{activeTaxonomyType?.name || selectedProductType}</span>
              </button>
            </>
          )}

          {selectedChildCategory && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500 text-zinc-950 font-black flex items-center gap-1 shrink-0 shadow-xs">
                <span>{selectedChildCategory}</span>
              </span>
            </>
          )}
        </div>
      )}

      {/* Visual Marketplace Category Showcase Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-4">
        {activeCats.slice(0, 6).map((category) => {
          const isSelected =
            selectedCategory !== '' &&
            (selectedCategory.toLowerCase() === category.slug?.toLowerCase() ||
              selectedCategory.toLowerCase() === category.name?.toLowerCase());

          const icon = getCategoryIcon(category.slug || category.name);
          const count =
            categoryCounts[(category.name || '').toLowerCase().trim()] ||
            categoryCounts[(category.slug || '').toLowerCase().trim()] ||
            0;

          return (
            <button
              key={`card-${category.id || category.slug}`}
              type="button"
              onClick={() => handleSelectCat(category.slug || category.name)}
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

      {/* Tier 1: Primary Categories Horizontal Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={handleClearAllTaxonomy}
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

          const icon = getCategoryIcon(category.slug || category.name);

          return (
            <button
              key={category.id || category.slug}
              onClick={() => handleSelectCat(category.slug || category.name)}
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

      {/* Tier 2: Subcategories Ribbon (if Category Selected) */}
      {selectedCategory && availableSubCategories.length > 0 && (
        <div className="mt-3 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              <span>{activeTaxonomyCat?.name || selectedCategory} Subcategories:</span>
              <ChevronRight className="w-3 h-3 text-zinc-400" />
            </div>
            <span className="text-[10px] text-zinc-400">{availableSubCategories.length} available</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => handleSelectCat(selectedCategory)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                !selectedSubCategory
                  ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                  : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
              }`}
            >
              All {activeTaxonomyCat?.name || 'Category'}
            </button>
            {availableSubCategories.map((sub) => {
              const isSubSelected =
                selectedSubCategory !== '' &&
                (selectedSubCategory.toLowerCase() === sub.slug?.toLowerCase() ||
                  selectedSubCategory.toLowerCase() === sub.name?.toLowerCase());

              return (
                <button
                  key={sub.slug}
                  onClick={() => handleSelectSub(sub.slug || sub.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isSubSelected
                      ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                      : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                  }`}
                >
                  <span>{sub.name}</span>
                  <span className={`text-[10px] ${isSubSelected ? 'text-emerald-100' : 'text-zinc-400'}`}>
                    ({sub.count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tier 3: Product Types Ribbon (if Subcategory Selected) */}
      {selectedSubCategory && availableProductTypes.length > 0 && (
        <div className="mt-2.5 p-3 bg-zinc-100/70 border border-zinc-200/90 rounded-2xl animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
              <span>{activeTaxonomySub?.name || selectedSubCategory} Product Types:</span>
              <ChevronRight className="w-3 h-3 text-zinc-400" />
            </div>
            <span className="text-[10px] text-zinc-400">{availableProductTypes.length} types</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => handleSelectSub(selectedSubCategory)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                !selectedProductType
                  ? 'bg-zinc-950 text-white shadow-2xs font-bold'
                  : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
              }`}
            >
              All {activeTaxonomySub?.name}
            </button>
            {availableProductTypes.map((type) => {
              const isTypeSelected =
                selectedProductType !== '' &&
                (selectedProductType.toLowerCase() === type.slug?.toLowerCase() ||
                  selectedProductType.toLowerCase() === type.name?.toLowerCase());

              return (
                <button
                  key={type.slug}
                  onClick={() => handleSelectType(type.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isTypeSelected
                      ? 'bg-zinc-950 text-white shadow-2xs font-bold'
                      : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                  }`}
                >
                  <Tag className="w-3 h-3 text-zinc-400" />
                  <span>{type.name}</span>
                  <span className={`text-[10px] ${isTypeSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>
                    ({type.count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tier 4: Child Categories Ribbon (if Product Type Selected) */}
      {selectedProductType && availableChildCategories.length > 0 && (
        <div className="mt-2.5 p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              <span>{activeTaxonomyType?.name || selectedProductType} Child Categories:</span>
              <ChevronRight className="w-3 h-3 text-emerald-600" />
            </div>
            <span className="text-[10px] text-emerald-700 font-bold">
              {availableChildCategories.length} child categories
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => handleSelectType(selectedProductType)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                !selectedChildCategory
                  ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                  : 'bg-white text-zinc-700 hover:bg-emerald-100/60 border border-zinc-200'
              }`}
            >
              All {activeTaxonomyType?.name}
            </button>
            {availableChildCategories.map((child) => {
              const isChildSelected =
                selectedChildCategory !== '' &&
                (selectedChildCategory.toLowerCase() === child.slug?.toLowerCase() ||
                  selectedChildCategory.toLowerCase() === child.name?.toLowerCase());

              return (
                <button
                  key={child.slug}
                  onClick={() => handleSelectChild(child.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isChildSelected
                      ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                      : 'bg-white text-zinc-700 hover:bg-emerald-100/60 border border-zinc-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isChildSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                  <span>{child.name}</span>
                  <span className={`text-[10px] ${isChildSelected ? 'text-emerald-100' : 'text-zinc-400'}`}>
                    ({child.count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
