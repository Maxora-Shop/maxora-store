import React, { useMemo } from 'react';
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
  Gamepad2,
  Smartphone,
  Heart,
  Baby,
  Utensils,
  Wrench,
  Check,
} from 'lucide-react';
import { Category, SubCategory, ProductType, ChildCategory, Product } from '../types';
import {
  TaxonomyCategory,
  TaxonomySubCategory,
  TaxonomyProductType,
  TaxonomyChildCategory,
  matchesTaxonomyField,
} from '../utils/taxonomy';
import { useTaxonomy } from '../context/TaxonomyContext';

export interface CategoryFilterProps {
  categories?: Category[];
  selectedCategory: string;
  onSelectCategory?: (category: string) => void;
  subCategories?: SubCategory[];
  selectedSubCategory?: string;
  onSelectSubCategory?: (subCategory: string) => void;
  productTypes?: ProductType[];
  selectedProductType?: string;
  onSelectProductType?: (productType: string) => void;
  childCategories?: ChildCategory[];
  selectedChildCategory?: string;
  onSelectChildCategory?: (childCategory: string) => void;
  taxonomy?: TaxonomyCategory[];
  products?: Product[];
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
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  all: <Sparkles className="w-4 h-4" />,
  electronics: <Cpu className="w-4 h-4" />,
  'smart-gadgets': <Watch className="w-4 h-4" />,
  audio: <Headphones className="w-4 h-4" />,
  'computer-gaming': <Gamepad2 className="w-4 h-4" />,
  'lifestyle-bags': <ShoppingBag className="w-4 h-4" />,
  'home-living': <Home className="w-4 h-4" />,
  accessories: <Shirt className="w-4 h-4" />,
  'mobile-accessories': <Smartphone className="w-4 h-4" />,
  'gourmet-food': <Coffee className="w-4 h-4" />,
  'home-kitchen': <Utensils className="w-4 h-4" />,
  'home-kitchen-appliances': <Utensils className="w-4 h-4" />,
  'beauty-personal-care': <Heart className="w-4 h-4" />,
  'health-beauty': <Heart className="w-4 h-4" />,
  'fashion-lifestyle': <Shirt className="w-4 h-4" />,
  'lifestyle-accessories': <ShoppingBag className="w-4 h-4" />,
  'kids-baby': <Baby className="w-4 h-4" />,
};

function getCategoryIcon(nameOrSlug?: string): React.ReactNode {
  if (!nameOrSlug) return <Package className="w-4 h-4" />;
  const key = nameOrSlug.toLowerCase().trim().replace(/[\s_&]+/g, '-');
  return CATEGORY_ICONS[key] || <Package className="w-4 h-4" />;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories: propCategories,
  selectedCategory = '',
  onSelectCategory,
  subCategories: propSubCategories,
  selectedSubCategory = '',
  onSelectSubCategory,
  productTypes: propProductTypes,
  selectedProductType = '',
  onSelectProductType,
  childCategories: propChildCategories,
  selectedChildCategory = '',
  onSelectChildCategory,
  taxonomy: propTaxonomy,
  products = [],
  onSelectTaxonomy,
}) => {
  const taxonomyContext = useTaxonomy();
  const categories = (propCategories && propCategories.length > 0) ? propCategories : taxonomyContext.reconciledCategories;
  const subCategories = (propSubCategories && propSubCategories.length > 0) ? propSubCategories : taxonomyContext.reconciledSubCategories;
  const productTypes = (propProductTypes && propProductTypes.length > 0) ? propProductTypes : taxonomyContext.reconciledProductTypes;
  const childCategories = (propChildCategories && propChildCategories.length > 0) ? propChildCategories : taxonomyContext.reconciledChildCategories;
  const taxonomy = (propTaxonomy && propTaxonomy.length > 0) ? propTaxonomy : taxonomyContext.taxonomyTree;

  // Active Categories filtered and sorted
  const activeCats = useMemo(() => {
    return categories
      .filter((c) => c.active !== 0 && c.active !== false && String(c.active) !== '0')
      .sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));
  }, [categories]);

  // Find active node in taxonomy tree
  const activeTaxonomyCat = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'All' || selectedCategory === 'all') return null;
    return (
      taxonomy.find(
        (c) =>
          c.slug?.toLowerCase() === selectedCategory.toLowerCase() ||
          c.name?.toLowerCase() === selectedCategory.toLowerCase() ||
          c.id === selectedCategory ||
          matchesTaxonomyField(c.slug, selectedCategory) ||
          matchesTaxonomyField(c.name, selectedCategory)
      ) || null
    );
  }, [selectedCategory, taxonomy]);

  const activeTaxonomySub = useMemo(() => {
    if (!selectedSubCategory || selectedSubCategory === 'All' || selectedSubCategory === 'all') return null;
    if (activeTaxonomyCat?.subCategories) {
      const match = activeTaxonomyCat.subCategories.find(
        (s) =>
          s.slug?.toLowerCase() === selectedSubCategory.toLowerCase() ||
          s.name?.toLowerCase() === selectedSubCategory.toLowerCase() ||
          s.id === selectedSubCategory ||
          matchesTaxonomyField(s.slug, selectedSubCategory) ||
          matchesTaxonomyField(s.name, selectedSubCategory)
      );
      if (match) return match;
    }
    // Also search entire taxonomy if not directly found in cat
    for (const c of taxonomy) {
      const sMatch = c.subCategories.find(
        (s) =>
          s.slug?.toLowerCase() === selectedSubCategory.toLowerCase() ||
          s.name?.toLowerCase() === selectedSubCategory.toLowerCase() ||
          s.id === selectedSubCategory ||
          matchesTaxonomyField(s.slug, selectedSubCategory) ||
          matchesTaxonomyField(s.name, selectedSubCategory)
      );
      if (sMatch) return sMatch;
    }
    return null;
  }, [selectedSubCategory, activeTaxonomyCat, taxonomy]);

  const activeTaxonomyType = useMemo(() => {
    if (!selectedProductType || selectedProductType === 'All' || selectedProductType === 'all') return null;
    if (activeTaxonomySub?.productTypes) {
      const match = activeTaxonomySub.productTypes.find(
        (t) =>
          t.slug?.toLowerCase() === selectedProductType.toLowerCase() ||
          t.name?.toLowerCase() === selectedProductType.toLowerCase() ||
          t.id === selectedProductType ||
          matchesTaxonomyField(t.slug, selectedProductType) ||
          matchesTaxonomyField(t.name, selectedProductType)
      );
      if (match) return match;
    }
    return null;
  }, [selectedProductType, activeTaxonomySub]);

  // Available Subcategories under selected Category
  const availableSubCategories = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'All' || selectedCategory === 'all') {
      return [];
    }
    // 1. From active taxonomy tree
    if (activeTaxonomyCat && activeTaxonomyCat.subCategories.length > 0) {
      return activeTaxonomyCat.subCategories;
    }
    // 2. Direct fallback from subCategories prop
    const filteredSubs = subCategories.filter((sub) => {
      if (sub.active === 0 || sub.active === false || String(sub.active) === '0') return false;
      return (
        matchesTaxonomyField(sub.category_slug, selectedCategory) ||
        matchesTaxonomyField(sub.category_id, selectedCategory) ||
        (activeTaxonomyCat && sub.category_id === activeTaxonomyCat.id)
      );
    });

    return filteredSubs.map((sub) => {
      const count = products.filter(
        (p) =>
          p.active !== 0 &&
          p.active !== false &&
          String(p.active) !== '0' &&
          (matchesTaxonomyField(p.sub_category, sub.name) ||
            matchesTaxonomyField(p.subcategory_slug, sub.slug || sub.name))
      ).length;

      return {
        id: sub.id,
        name: sub.name,
        slug: sub.slug || sub.name.toLowerCase().replace(/[\s_]+/g, '-'),
        count,
        productTypes: [],
      };
    });
  }, [selectedCategory, activeTaxonomyCat, subCategories, products]);

  // Available Product Types under selected Category or Subcategory
  const availableProductTypes = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'All' || selectedCategory === 'all') {
      return [];
    }

    // If a specific subcategory is selected, show types for that subcategory
    if (selectedSubCategory && selectedSubCategory !== 'All' && selectedSubCategory !== 'all') {
      if (activeTaxonomySub && activeTaxonomySub.productTypes.length > 0) {
        return activeTaxonomySub.productTypes;
      }
      const filteredTypes = productTypes.filter((pt) => {
        if (pt.active === 0 || pt.active === false || String(pt.active) === '0') return false;
        return (
          matchesTaxonomyField(pt.subcategory_slug, selectedSubCategory) ||
          matchesTaxonomyField(pt.subcategory_id, selectedSubCategory) ||
          (activeTaxonomySub && pt.subcategory_id === activeTaxonomySub.id)
        );
      });

      return filteredTypes.map((pt) => {
        const count = products.filter(
          (p) =>
            p.active !== 0 &&
            p.active !== false &&
            String(p.active) !== '0' &&
            (matchesTaxonomyField(p.product_type, pt.name) ||
              matchesTaxonomyField(p.product_type_slug, pt.slug || pt.name))
        ).length;

        return {
          id: pt.id,
          name: pt.name,
          slug: pt.slug || pt.name.toLowerCase().replace(/[\s_]+/g, '-'),
          count,
          childCategories: [],
        };
      });
    }

    // If NO subcategory selected yet, gather ALL product types under selected Category!
    if (activeTaxonomyCat && activeTaxonomyCat.subCategories.length > 0) {
      const allTypes: TaxonomyProductType[] = [];
      const seen = new Set<string>();
      activeTaxonomyCat.subCategories.forEach((sub) => {
        sub.productTypes.forEach((pt) => {
          const key = pt.slug || pt.name;
          if (!seen.has(key)) {
            seen.add(key);
            allTypes.push(pt);
          }
        });
      });
      if (allTypes.length > 0) return allTypes;
    }

    // Direct fallback from productTypes prop
    const filteredTypes = productTypes.filter((pt) => {
      if (pt.active === 0 || pt.active === false || String(pt.active) === '0') return false;
      return (
        matchesTaxonomyField(pt.category_slug, selectedCategory) ||
        matchesTaxonomyField(pt.category_id, selectedCategory) ||
        (activeTaxonomyCat && pt.category_id === activeTaxonomyCat.id)
      );
    });

    return filteredTypes.map((pt) => {
      const count = products.filter(
        (p) =>
          p.active !== 0 &&
          p.active !== false &&
          String(p.active) !== '0' &&
          (matchesTaxonomyField(p.product_type, pt.name) ||
            matchesTaxonomyField(p.product_type_slug, pt.slug || pt.name))
      ).length;

      return {
        id: pt.id,
        name: pt.name,
        slug: pt.slug || pt.name.toLowerCase().replace(/[\s_]+/g, '-'),
        count,
        childCategories: [],
      };
    });
  }, [selectedCategory, selectedSubCategory, activeTaxonomyCat, activeTaxonomySub, productTypes, products]);

  // Available Child Categories under selected Product Type, Subcategory, or Category
  const availableChildCategories = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'All' || selectedCategory === 'all') {
      return [];
    }

    // 1. If a specific product type is selected:
    if (selectedProductType && selectedProductType !== 'All' && selectedProductType !== 'all') {
      if (activeTaxonomyType && activeTaxonomyType.childCategories.length > 0) {
        return activeTaxonomyType.childCategories;
      }
      const filteredChildren = childCategories.filter((ch) => {
        if (ch.active === 0 || ch.active === false || String(ch.active) === '0') return false;
        return (
          matchesTaxonomyField(ch.product_type_slug, selectedProductType) ||
          matchesTaxonomyField(ch.product_type_id, selectedProductType) ||
          (activeTaxonomyType && ch.product_type_id === activeTaxonomyType.id)
        );
      });

      return filteredChildren.map((ch) => {
        const count = products.filter(
          (p) =>
            p.active !== 0 &&
            p.active !== false &&
            String(p.active) !== '0' &&
            (matchesTaxonomyField(p.child_category, ch.name) ||
              matchesTaxonomyField(p.childcategory_slug, ch.slug || ch.name))
        ).length;

        return {
          id: ch.id,
          name: ch.name,
          slug: ch.slug || ch.name.toLowerCase().replace(/[\s_]+/g, '-'),
          count,
        };
      });
    }

    // 2. If NO product type is selected yet, gather ALL child categories in the current branch!
    if (availableProductTypes.length > 0) {
      const allChildren: TaxonomyChildCategory[] = [];
      const seen = new Set<string>();
      availableProductTypes.forEach((pt) => {
        pt.childCategories?.forEach((ch) => {
          const key = ch.slug || ch.name;
          if (!seen.has(key)) {
            seen.add(key);
            allChildren.push(ch);
          }
        });
      });
      if (allChildren.length > 0) return allChildren;
    }

    // Direct fallback from childCategories prop
    const filteredChildren = childCategories.filter((ch) => {
      if (ch.active === 0 || ch.active === false || String(ch.active) === '0') return false;
      return (
        matchesTaxonomyField(ch.category_slug, selectedCategory) ||
        matchesTaxonomyField(ch.category_id, selectedCategory) ||
        (activeTaxonomyCat && ch.category_id === activeTaxonomyCat.id)
      );
    });

    return filteredChildren.map((ch) => {
      const count = products.filter(
        (p) =>
          p.active !== 0 &&
          p.active !== false &&
          String(p.active) !== '0' &&
          (matchesTaxonomyField(p.child_category, ch.name) ||
            matchesTaxonomyField(p.childcategory_slug, ch.slug || ch.name))
      ).length;

      return {
        id: ch.id,
        name: ch.name,
        slug: ch.slug || ch.name.toLowerCase().replace(/[\s_]+/g, '-'),
        count,
      };
    });
  }, [
    selectedCategory,
    selectedProductType,
    activeTaxonomyType,
    availableProductTypes,
    childCategories,
    products,
    activeTaxonomyCat,
  ]);

  // Handlers for 4-tier selection
  const handleClearAll = () => {
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
    } else {
      if (onSelectCategory) onSelectCategory('');
      if (onSelectSubCategory) onSelectSubCategory('');
      if (onSelectProductType) onSelectProductType('');
      if (onSelectChildCategory) onSelectChildCategory('');
    }
  };

  const handleSelectCat = (catSlugOrName: string, catId?: string) => {
    if (onSelectTaxonomy) {
      onSelectTaxonomy({
        category: catSlugOrName,
        subCategory: '',
        productType: '',
        childCategory: '',
        categoryId: catId || '',
        subCategoryId: '',
        productTypeId: '',
        childCategoryId: '',
      });
    } else {
      if (onSelectCategory) onSelectCategory(catSlugOrName);
      if (onSelectSubCategory) onSelectSubCategory('');
      if (onSelectProductType) onSelectProductType('');
      if (onSelectChildCategory) onSelectChildCategory('');
    }
  };

  const handleSelectSub = (subSlugOrName: string, subId?: string) => {
    if (onSelectTaxonomy) {
      onSelectTaxonomy({
        category: selectedCategory,
        subCategory: subSlugOrName,
        productType: '',
        childCategory: '',
        categoryId: activeTaxonomyCat?.id || '',
        subCategoryId: subId || '',
        productTypeId: '',
        childCategoryId: '',
      });
    } else {
      if (onSelectSubCategory) onSelectSubCategory(subSlugOrName);
      if (onSelectProductType) onSelectProductType('');
      if (onSelectChildCategory) onSelectChildCategory('');
    }
  };

  const handleSelectType = (typeSlugOrName: string, typeId?: string) => {
    // If subCategory is not yet selected, auto-resolve parent subcategory
    let targetSubSlug = selectedSubCategory;
    let targetSubId = activeTaxonomySub?.id || '';
    if (!targetSubSlug && activeTaxonomyCat) {
      for (const sub of activeTaxonomyCat.subCategories) {
        const hasType = sub.productTypes.some(
          (t) =>
            t.slug === typeSlugOrName ||
            t.name === typeSlugOrName ||
            (typeId && t.id === typeId)
        );
        if (hasType) {
          targetSubSlug = sub.slug || sub.name;
          targetSubId = sub.id || '';
          break;
        }
      }
    }

    if (onSelectTaxonomy) {
      onSelectTaxonomy({
        category: selectedCategory,
        subCategory: targetSubSlug,
        productType: typeSlugOrName,
        childCategory: '',
        categoryId: activeTaxonomyCat?.id || '',
        subCategoryId: targetSubId,
        productTypeId: typeId || '',
        childCategoryId: '',
      });
    } else {
      if (targetSubSlug && onSelectSubCategory && !selectedSubCategory) onSelectSubCategory(targetSubSlug);
      if (onSelectProductType) onSelectProductType(typeSlugOrName);
      if (onSelectChildCategory) onSelectChildCategory('');
    }
  };

  const handleSelectChild = (childSlugOrName: string, childId?: string) => {
    let targetSubSlug = selectedSubCategory;
    let targetSubId = activeTaxonomySub?.id || '';
    let targetTypeSlug = selectedProductType;
    let targetTypeId = activeTaxonomyType?.id || '';

    // Auto-resolve parent type & subcategory if missing
    if ((!targetTypeSlug || !targetSubSlug) && activeTaxonomyCat) {
      for (const sub of activeTaxonomyCat.subCategories) {
        for (const type of sub.productTypes) {
          const hasChild = type.childCategories.some(
            (ch) =>
              ch.slug === childSlugOrName ||
              ch.name === childSlugOrName ||
              (childId && ch.id === childId)
          );
          if (hasChild) {
            targetSubSlug = sub.slug || sub.name;
            targetSubId = sub.id || '';
            targetTypeSlug = type.slug || type.name;
            targetTypeId = type.id || '';
            break;
          }
        }
        if (targetTypeSlug) break;
      }
    }

    if (onSelectTaxonomy) {
      onSelectTaxonomy({
        category: selectedCategory,
        subCategory: targetSubSlug,
        productType: targetTypeSlug,
        childCategory: childSlugOrName,
        categoryId: activeTaxonomyCat?.id || '',
        subCategoryId: targetSubId,
        productTypeId: targetTypeId,
        childCategoryId: childId || '',
      });
    } else {
      if (targetSubSlug && onSelectSubCategory && !selectedSubCategory) onSelectSubCategory(targetSubSlug);
      if (targetTypeSlug && onSelectProductType && !selectedProductType) onSelectProductType(targetTypeSlug);
      if (onSelectChildCategory) onSelectChildCategory(childSlugOrName);
    }
  };

  const hasAnyFilter = Boolean(
    selectedCategory || selectedSubCategory || selectedProductType || selectedChildCategory
  );

  return (
    <div className="mb-6 w-full" id="category-filter-container">
      {/* Tier 1: Main Categories Ribbon */}
      <div className="relative">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            id="cat-filter-all"
            onClick={handleClearAll}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs shrink-0 active:scale-98 ${
              !selectedCategory
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'bg-white text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 border border-zinc-200/90'
            }`}
          >
            <span className={!selectedCategory ? 'text-emerald-400' : 'text-zinc-400'}>
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span>All Products</span>
          </button>

          {activeCats.map((cat) => {
            const isSelected =
              Boolean(selectedCategory) &&
              (matchesTaxonomyField(selectedCategory, cat.slug) ||
                matchesTaxonomyField(selectedCategory, cat.name) ||
                selectedCategory === cat.id);

            const icon = getCategoryIcon(cat.slug || cat.name);

            return (
              <button
                key={cat.id || cat.slug || cat.name}
                type="button"
                id={`cat-filter-${cat.slug || cat.id}`}
                onClick={() => handleSelectCat(cat.slug || cat.name, cat.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs shrink-0 active:scale-98 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/20'
                    : 'bg-white text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 border border-zinc-200/90'
                }`}
              >
                <span className={isSelected ? 'text-white' : 'text-zinc-400'}>{icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tier 2: Sub-Categories Ribbon (shows whenever a Category is selected) */}
      {selectedCategory && (
        <div
          id="subcategories-filter-bar"
          className="mt-3 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl animate-in fade-in-50 duration-200 shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-zinc-600 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Subcategories:</span>
            </div>
            {availableSubCategories.length > 0 && (
              <span className="text-[10px] text-zinc-400 font-medium">
                {availableSubCategories.length} subcategories
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {/* "All [Category]" reset button */}
            <button
              type="button"
              id="subcat-filter-all"
              onClick={() => handleSelectCat(selectedCategory, activeTaxonomyCat?.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                !selectedSubCategory
                  ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                  : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
              }`}
            >
              All {activeTaxonomyCat?.name || selectedCategory}
            </button>

            {availableSubCategories.map((sub) => {
              const isSubSelected =
                Boolean(selectedSubCategory) &&
                (matchesTaxonomyField(selectedSubCategory, sub.slug) ||
                  matchesTaxonomyField(selectedSubCategory, sub.name) ||
                  selectedSubCategory === sub.id);

              return (
                <button
                  key={sub.id || sub.slug || sub.name}
                  type="button"
                  id={`subcat-filter-${sub.slug || sub.id}`}
                  onClick={() => handleSelectSub(sub.slug || sub.name, sub.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isSubSelected
                      ? 'bg-emerald-600 text-white shadow-2xs font-bold ring-1 ring-emerald-700'
                      : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                  }`}
                >
                  <span>{sub.name}</span>
                  {sub.count !== undefined && sub.count > 0 && (
                    <span
                      className={`text-[10px] px-1 rounded-full ${
                        isSubSelected
                          ? 'bg-emerald-700 text-white font-bold'
                          : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {sub.count}
                    </span>
                  )}
                </button>
              );
            })}

            {availableSubCategories.length === 0 && (
              <span className="text-xs text-zinc-400 italic px-2 py-1">
                No subcategories listed for this category
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tier 3: Product Types Ribbon (shows whenever Category is selected and product types are available) */}
      {selectedCategory && availableProductTypes.length > 0 && (
        <div
          id="product-types-filter-bar"
          className="mt-2.5 p-3 bg-zinc-100/80 border border-zinc-200/90 rounded-2xl animate-in fade-in-50 duration-200 shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-zinc-700 uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5 text-zinc-600" />
              <span>Product Types:</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-medium">
              {availableProductTypes.length} types
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {/* "All Types" button */}
            <button
              type="button"
              id="type-filter-all"
              onClick={() => {
                if (selectedSubCategory) {
                  handleSelectSub(selectedSubCategory, activeTaxonomySub?.id);
                } else {
                  handleSelectCat(selectedCategory, activeTaxonomyCat?.id);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                !selectedProductType
                  ? 'bg-zinc-950 text-white shadow-2xs font-bold'
                  : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
              }`}
            >
              All {activeTaxonomySub?.name || 'Product Types'}
            </button>

            {availableProductTypes.map((type) => {
              const isTypeSelected =
                Boolean(selectedProductType) &&
                (matchesTaxonomyField(selectedProductType, type.slug) ||
                  matchesTaxonomyField(selectedProductType, type.name) ||
                  selectedProductType === type.id);

              return (
                <button
                  key={type.id || type.slug || type.name}
                  type="button"
                  id={`type-filter-${type.slug || type.id}`}
                  onClick={() => handleSelectType(type.slug || type.name, type.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isTypeSelected
                      ? 'bg-zinc-950 text-white shadow-2xs font-bold'
                      : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                  }`}
                >
                  <span>{type.name}</span>
                  {type.count !== undefined && type.count > 0 && (
                    <span
                      className={`text-[10px] px-1 rounded-full ${
                        isTypeSelected
                          ? 'bg-zinc-800 text-zinc-200 font-bold'
                          : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {type.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tier 4: Child Categories Ribbon (shows whenever Category is selected and child categories are available) */}
      {selectedCategory && availableChildCategories.length > 0 && (
        <div
          id="child-categories-filter-bar"
          className="mt-2.5 p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl animate-in fade-in-50 duration-200 shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Child Categories / Features:</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold">
              {availableChildCategories.length} options
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {/* "All Child" button */}
            <button
              type="button"
              id="child-filter-all"
              onClick={() => {
                if (selectedProductType) {
                  handleSelectType(selectedProductType, activeTaxonomyType?.id);
                } else if (selectedSubCategory) {
                  handleSelectSub(selectedSubCategory, activeTaxonomySub?.id);
                } else {
                  handleSelectCat(selectedCategory, activeTaxonomyCat?.id);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                !selectedChildCategory
                  ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                  : 'bg-white text-zinc-700 hover:bg-emerald-100/60 border border-zinc-200'
              }`}
            >
              All {activeTaxonomyType?.name || 'Options'}
            </button>

            {availableChildCategories.map((child) => {
              const isChildSelected =
                Boolean(selectedChildCategory) &&
                (matchesTaxonomyField(selectedChildCategory, child.slug) ||
                  matchesTaxonomyField(selectedChildCategory, child.name) ||
                  selectedChildCategory === child.id);

              return (
                <button
                  key={child.id || child.slug || child.name}
                  type="button"
                  id={`child-filter-${child.slug || child.id}`}
                  onClick={() => handleSelectChild(child.slug || child.name, child.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isChildSelected
                      ? 'bg-emerald-600 text-white shadow-2xs font-bold ring-1 ring-emerald-700'
                      : 'bg-white text-zinc-700 hover:bg-emerald-100/60 border border-zinc-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isChildSelected ? 'bg-white' : 'bg-emerald-500'
                    }`}
                  />
                  <span>{child.name}</span>
                  {child.count !== undefined && child.count > 0 && (
                    <span
                      className={`text-[10px] px-1 rounded-full ${
                        isChildSelected
                          ? 'bg-emerald-700 text-white font-bold'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {child.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
