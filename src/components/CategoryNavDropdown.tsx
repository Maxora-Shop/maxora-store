import React from 'react';
import { ChevronRight, ArrowRight, Sparkles, Tag } from 'lucide-react';
import { Product } from '../types';
import { TaxonomyFilterState, matchesTaxonomyField } from '../utils/taxonomy';

export interface CategoryNavDropdownSubItem {
  name: string;
  slug: string;
  count?: number;
  parentCatSlug?: string;
  parentCatId?: string;
}

export interface CategoryNavDropdownProps {
  category: {
    name: string;
    slug: string;
    id?: string;
    icon?: React.ReactNode;
  };
  alignRight?: boolean;
  subcategories: CategoryNavDropdownSubItem[];
  featuredProducts?: Product[];
  currentFilter?: Partial<TaxonomyFilterState>;
  onSelectTaxonomy?: (filter: {
    category?: string;
    subCategory?: string;
    productType?: string;
    childCategory?: string;
    categoryId?: string;
    subCategoryId?: string;
  }) => void;
  onSelectProduct?: (product: Product) => void;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const CategoryNavDropdown: React.FC<CategoryNavDropdownProps> = ({
  category,
  alignRight = false,
  subcategories,
  featuredProducts = [],
  currentFilter = {} as Partial<TaxonomyFilterState>,
  onSelectTaxonomy,
  onSelectProduct,
  onClose,
  onMouseEnter,
  onMouseLeave,
}) => {
  const activeSubCategory = currentFilter?.subCategory;
  // Handle Category click (browse entire category)
  const handleCategoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSelectTaxonomy) {
      onSelectTaxonomy({
        category: category.slug,
        subCategory: '',
        productType: '',
        childCategory: '',
        categoryId: category.id || '',
        subCategoryId: '',
      });
    }
    onClose();

    setTimeout(() => {
      const catalogEl = document.getElementById('products-catalog-section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 60);
  };

  // Handle Subcategory click
  const handleSubCategoryClick = (sub: CategoryNavDropdownSubItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSelectTaxonomy) {
      onSelectTaxonomy({
        category: sub.parentCatSlug || category.slug,
        subCategory: sub.slug || sub.name,
        productType: '',
        childCategory: '',
        categoryId: sub.parentCatId || category.id || '',
        subCategoryId: '',
      });
    }
    onClose();

    setTimeout(() => {
      const catalogEl = document.getElementById('products-catalog-section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 60);
  };

  // Handle Featured Product click
  const handleProductClick = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSelectProduct) {
      onSelectProduct(product);
    } else if (onSelectTaxonomy) {
      onSelectTaxonomy({
        category: product.category_slug || product.category || category.slug,
        subCategory: product.sub_category || '',
      });
    }
    onClose();
  };

  // Up to 1 top featured product for compact display
  const topProduct = featuredProducts[0];

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={(e) => e.stopPropagation()}
      role="menu"
      aria-label={`${category.name} navigation menu`}
      className={`absolute top-full mt-1.5 z-50 ${
        alignRight ? 'right-0' : 'left-0'
      } w-[480px] sm:w-[540px] max-w-[95vw] bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-zinc-200/90 p-5 overflow-hidden animate-in fade-in-50 zoom-in-98 duration-150 text-zinc-800`}
    >
      {/* Category Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100">
        <button
          type="button"
          onClick={handleCategoryClick}
          className="flex items-center gap-2 text-left group cursor-pointer focus:outline-none"
        >
          <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-150">
            {category.icon}
          </span>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 group-hover:text-teal-700 transition-colors duration-150">
              {category.name}
            </h3>
          </div>
        </button>

        <button
          type="button"
          onClick={handleCategoryClick}
          className="text-xs font-semibold text-teal-600 hover:text-teal-800 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Content Layout: Left Subcategories + Right Compact Featured Area */}
      <div className="flex gap-5 items-start">
        {/* LEFT SIDE: Subcategories vertical list */}
        <div className="flex-1 min-w-[190px]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Subcategories
          </div>

          {subcategories.length > 0 ? (
            <ul className={`space-y-1 ${subcategories.length > 7 ? 'grid grid-cols-2 gap-x-2 gap-y-1 space-y-0' : ''}`}>
              {subcategories.map((sub) => {
                const isSubActive =
                  Boolean(activeSubCategory) &&
                  (matchesTaxonomyField(activeSubCategory, sub.slug) ||
                    matchesTaxonomyField(activeSubCategory, sub.name));

                return (
                  <li key={sub.slug || sub.name}>
                    <button
                      type="button"
                      onClick={(e) => handleSubCategoryClick(sub, e)}
                      className={`w-full group flex items-center justify-between text-left text-xs py-1.5 px-2 rounded-lg transition-all duration-150 cursor-pointer ${
                        isSubActive
                          ? 'bg-teal-50 text-teal-800 font-bold'
                          : 'text-zinc-600 hover:text-teal-700 hover:bg-teal-50/50 font-medium'
                      }`}
                    >
                      <span className="truncate flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${
                            isSubActive
                              ? 'bg-teal-600 w-2 h-2'
                              : 'bg-zinc-300 group-hover:bg-teal-500'
                          }`}
                        />
                        <span className="truncate">{sub.name}</span>
                      </span>

                      {typeof sub.count === 'number' && sub.count > 0 && (
                        <span className="text-[10px] text-zinc-400 font-normal shrink-0 ml-1">
                          ({sub.count})
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="py-4 text-xs text-zinc-400 italic">
              Explore all items in {category.name}
            </div>
          )}

          {/* Bottom Action Link: [Shop Category →] */}
          <div className="pt-4 mt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={handleCategoryClick}
              className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1.5 transition-colors cursor-pointer group"
            >
              <span>Shop {category.name}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: Compact Featured Area (Subtle, NOT oversized) */}
        <div className="w-52 shrink-0 border-l border-zinc-100 pl-5 flex flex-col justify-between self-stretch">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-500" />
              <span>Featured Pick</span>
            </div>

            {topProduct ? (
              <div
                onClick={(e) => handleProductClick(topProduct, e)}
                className="group cursor-pointer rounded-xl border border-zinc-100 hover:border-teal-300 p-2.5 bg-zinc-50/70 hover:bg-white transition-all duration-150 shadow-xs hover:shadow-sm"
              >
                {/* Product Thumbnail */}
                <div className="w-full h-24 rounded-lg bg-white overflow-hidden relative border border-zinc-100">
                  <img
                    src={topProduct.image_url || (topProduct.images && topProduct.images[0]) || ''}
                    alt={topProduct.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                  {topProduct.discount && Number(topProduct.discount) > 0 ? (
                    <span className="absolute top-1 right-1 bg-teal-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                      SAVE ৳{Number(topProduct.discount).toLocaleString()}
                    </span>
                  ) : null}
                </div>

                {/* Product Title */}
                <h4 className="text-xs font-semibold text-zinc-900 line-clamp-2 mt-2 group-hover:text-teal-700 transition-colors">
                  {topProduct.name}
                </h4>

                {/* Price */}
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xs font-black text-teal-700">
                    ৳{Math.max(0, Number(topProduct.selling_price || 0) - Number(topProduct.discount || 0)).toLocaleString()}
                  </span>
                  {topProduct.discount && Number(topProduct.discount) > 0 && (
                    <span className="text-[10px] text-zinc-400 line-through">
                      ৳{Number(topProduct.selling_price || 0).toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="mt-2 text-[11px] font-bold text-teal-600 flex items-center gap-1 group-hover:underline">
                  <span>View Product</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-100 p-3 bg-zinc-50/70 text-center flex flex-col items-center justify-center py-6">
                <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mb-2">
                  <Tag className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-zinc-800 mb-0.5">{category.name}</div>
                <div className="text-[11px] text-zinc-500 mb-2">Quality & Authenticity Guaranteed</div>
                <button
                  type="button"
                  onClick={handleCategoryClick}
                  className="text-xs font-bold text-teal-600 hover:text-teal-800 hover:underline cursor-pointer"
                >
                  Browse Items →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
