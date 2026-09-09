import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Search, Truck, Phone, LayoutGrid, ChevronDown, PackageCheck, Sparkles, X, Heart } from 'lucide-react';
import { StoreSettings, Category, Product } from '../types';
import { TaxonomyCategory, TaxonomyFilterState } from '../utils/taxonomy';
import { CategoryHierarchyMenu } from './CategoryHierarchyMenu';

interface NavbarProps {
  settings: StoreSettings;
  cartCount: number;
  wishlistCount?: number;
  onOpenCart: () => void;
  onOpenWishlist?: () => void;
  onOpenTracker: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  categories?: Category[];
  selectedCategory?: string;
  onSelectCategory?: (slug: string) => void;
  taxonomy?: TaxonomyCategory[];
  currentTaxonomyFilter?: Partial<TaxonomyFilterState>;
  onSelectTaxonomy?: (filter: {
    category?: string;
    subCategory?: string;
    productType?: string;
    childCategory?: string;
  }) => void;
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  cartCount,
  wishlistCount = 0,
  onOpenCart,
  onOpenWishlist,
  onOpenTracker,
  searchQuery,
  onSearchChange,
  categories = [],
  selectedCategory = '',
  onSelectCategory,
  taxonomy = [],
  currentTaxonomyFilter = {} as Partial<TaxonomyFilterState>,
  onSelectTaxonomy,
  products = [],
  onSelectProduct,
}) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogoClick = () => {
    if (onSelectTaxonomy) {
      onSelectTaxonomy({
        category: '',
        subCategory: '',
        productType: '',
        childCategory: '',
      });
    } else if (onSelectCategory) {
      onSelectCategory('');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTaxonomySelect = (filter: {
    category?: string;
    subCategory?: string;
    productType?: string;
    childCategory?: string;
  }) => {
    if (onSelectTaxonomy) {
      onSelectTaxonomy(filter);
    } else if (onSelectCategory && filter.category) {
      onSelectCategory(filter.category);
    }
    setCategoryMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-xs border-b border-zinc-200/90">
      {/* 1. Slim Announcement / Top Bar */}
      <div className="bg-zinc-950 text-zinc-100 text-xs py-2 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-flex items-center justify-center bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold border border-emerald-500/30 shrink-0">
              <Truck className="w-3 h-3 mr-1 inline" />
              100% Cash on Delivery
            </span>
            <span className="text-zinc-300 font-medium text-[11px] sm:text-xs truncate hidden sm:inline">
              {settings.promo_text || "Nationwide Delivery Across All 64 Districts in Bangladesh"}
            </span>
          </div>

          <div className="flex items-center gap-4 text-zinc-300 shrink-0 text-xs">
            {settings.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="hover:text-white transition-colors flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold"
              >
                <Phone className="w-3 h-3 text-emerald-400" />
                <span className="hidden md:inline text-zinc-400 font-normal">Helpline:</span>
                <span>{settings.phone}</span>
              </a>
            )}
            <button
              onClick={onOpenTracker}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1 font-semibold text-[11px] sm:text-xs cursor-pointer"
            >
              <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Track Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Marketplace Header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
        {/* Left: Maxora Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleLogoClick}
            title={settings.store_name || "Maxora"}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-black text-xl sm:text-2xl tracking-tight shadow-md group-hover:scale-105 transition-transform shrink-0">
              M
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950 group-hover:text-zinc-700 transition-colors">
                {settings.store_name || "Maxora"}
                <span className="text-emerald-500">.</span>
              </span>
              <span className="block text-[9px] sm:text-[10px] uppercase font-bold text-zinc-600 tracking-wider -mt-1">
                Shop BD
              </span>
            </div>
          </button>
        </div>

        {/* Center: Categories Menu Button + Large Search Bar */}
        <div className="hidden lg:flex items-center flex-1 max-w-3xl mx-2 gap-2.5 relative">
          {/* Categories Hierarchy Menu Trigger */}
          <div className="shrink-0" ref={menuRef}>
            <button
              type="button"
              id="navbar-categories-menu-button"
              onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all border cursor-pointer shadow-2xs active:scale-98 ${
                categoryMenuOpen || currentTaxonomyFilter.category
                  ? 'bg-zinc-950 text-white border-zinc-950 shadow-md'
                  : 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 border-zinc-200'
              }`}
            >
              <LayoutGrid className={`w-4 h-4 ${categoryMenuOpen || currentTaxonomyFilter.category ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <span>
                {currentTaxonomyFilter.childCategory ||
                  currentTaxonomyFilter.productType ||
                  currentTaxonomyFilter.subCategory ||
                  currentTaxonomyFilter.category ||
                  'Categories'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* 4-Tier Dynamic Category Hierarchy Mega Menu */}
            {categoryMenuOpen && (
              <CategoryHierarchyMenu
                isOpen={categoryMenuOpen}
                onClose={() => setCategoryMenuOpen(false)}
                taxonomy={taxonomy}
                currentFilter={currentTaxonomyFilter}
                onSelectTaxonomy={handleTaxonomySelect}
                products={products}
                onSelectProduct={onSelectProduct}
              />
            )}
          </div>

          {/* Large Marketplace Search Bar */}
          <div className="relative flex-1">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search products by name, category, or SKU..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-zinc-50 hover:bg-white focus:bg-white text-zinc-900 text-sm pl-11 pr-24 py-2.5 rounded-xl border border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 focus:outline-none transition-all placeholder:text-zinc-500 shadow-2xs"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-4" />
              {searchQuery ? (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-16 text-xs text-zinc-400 hover:text-zinc-700 bg-zinc-200 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : null}
              <span className="absolute right-2 px-3 py-1 bg-zinc-950 text-white rounded-lg text-xs font-bold pointer-events-none">
                Search
              </span>
            </div>
          </div>
        </div>

        {/* Medium Screen Search Bar (Tablets) */}
        <div className="hidden sm:flex lg:hidden flex-1 max-w-sm mx-2">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-zinc-100 focus:bg-white text-zinc-900 text-xs sm:text-sm pl-9 pr-8 py-2 rounded-xl border border-zinc-200 focus:border-zinc-900 focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-2 text-xs text-zinc-400 hover:text-zinc-600 bg-zinc-200 rounded-full w-4 h-4 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Actions: Categories (Mobile), Cart & Mobile Search */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Categories Menu Toggle */}
          <button
            type="button"
            onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
            className="lg:hidden px-2.5 py-2 rounded-xl border border-zinc-200 flex items-center gap-1.5 text-xs font-bold text-zinc-800 hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer"
            aria-label="Categories"
          >
            <LayoutGrid className="w-4 h-4 text-emerald-600" />
            <span className="hidden xs:inline">Catalog</span>
          </button>

          {/* Mobile Search Toggle */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="sm:hidden w-10 h-10 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Wishlist / Saved Items Trigger Button */}
          <button
            id="wishlist-trigger-button"
            onClick={onOpenWishlist}
            className={`relative flex items-center gap-1.5 px-3 sm:px-3.5 py-2.5 rounded-xl border font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95 ${
              wishlistCount > 0
                ? 'bg-rose-50/80 hover:bg-rose-100 border-rose-200 text-rose-700'
                : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700'
            }`}
            title="View Saved Items"
            aria-label="Saved Items"
          >
            <Heart
              className={`w-4 h-4 transition-transform ${
                wishlistCount > 0
                  ? 'fill-rose-500 text-rose-500 scale-105'
                  : 'text-zinc-600'
              }`}
            />
            <span className="hidden md:inline">Saved</span>
            {wishlistCount > 0 && (
              <span className="bg-rose-500 text-white font-black text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow-2xs">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Trigger Button */}
          <button
            id="cart-trigger-button"
            onClick={onOpenCart}
            className="relative flex items-center gap-2.5 bg-zinc-950 hover:bg-zinc-800 text-white px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Cart</span>
            <span className="bg-emerald-500 text-zinc-950 font-black text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-xs">
              {cartCount}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Categories Floating Menu Container */}
      {categoryMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-0 sm:p-4">
          <div className="relative w-full max-w-xl mx-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <CategoryHierarchyMenu
              isOpen={categoryMenuOpen}
              onClose={() => setCategoryMenuOpen(false)}
              taxonomy={taxonomy}
              currentFilter={currentTaxonomyFilter}
              onSelectTaxonomy={handleTaxonomySelect}
              products={products}
              onSelectProduct={onSelectProduct}
            />
          </div>
        </div>
      )}

      {/* Mobile Search Bar Expandable */}
      {mobileSearchOpen && (
        <div className="sm:hidden px-4 pb-3 pt-1 border-t border-zinc-100 bg-white animate-in slide-in-from-top-2 duration-200">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              autoFocus
              className="w-full bg-zinc-100 text-zinc-900 text-sm pl-9 pr-8 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-950"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-zinc-600 bg-zinc-200 rounded-full w-5 h-5 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

