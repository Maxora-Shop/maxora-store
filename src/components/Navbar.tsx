import React, { useState, useRef } from 'react';
import { ShoppingBag, Search, Truck, Phone, LayoutGrid, ChevronDown, PackageCheck, X, Heart, User, UserCheck } from 'lucide-react';
import { StoreSettings, Category, Product, Customer } from '../types';
import { TaxonomyCategory, TaxonomyFilterState } from '../utils/taxonomy';
import { CategoryHierarchyMenu } from './CategoryHierarchyMenu';

interface NavbarProps {
  settings: StoreSettings;
  cartCount: number;
  wishlistCount?: number;
  customer?: Customer | null;
  onOpenCart: () => void;
  onOpenWishlist?: () => void;
  onOpenTracker: () => void;
  onOpenCustomerAccount: () => void;
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
  customer = null,
  onOpenCart,
  onOpenWishlist,
  onOpenTracker,
  onOpenCustomerAccount,
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
    categoryId?: string;
    subCategoryId?: string;
    productTypeId?: string;
    childCategoryId?: string;
  }) => {
    if (onSelectTaxonomy) {
      onSelectTaxonomy(filter);
    } else if (onSelectCategory && filter.category) {
      onSelectCategory(filter.category);
    }
    // Do NOT close the menu here - user can freely browse hierarchy levels
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-xs border-b border-zinc-200/90 w-full max-w-full">
      {/* 1. Slim Announcement / Top Bar */}
      <div className="bg-zinc-950 text-zinc-100 text-xs py-1.5 sm:py-2 px-2.5 sm:px-6 w-full max-w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3 w-full min-w-0">
          <div className="flex items-center gap-1.5 truncate min-w-0">
            <span className="inline-flex items-center justify-center bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold border border-emerald-500/30 shrink-0">
              <Truck className="w-3 h-3 mr-1 inline shrink-0" />
              Cash on Delivery
            </span>
            <span className="text-zinc-300 font-medium text-[11px] sm:text-xs truncate hidden sm:inline">
              {settings.promo_text || "Nationwide Delivery Across All 64 Districts in Bangladesh"}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 text-zinc-300 shrink-0 text-xs">
            {settings.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="hover:text-white transition-colors hidden sm:flex items-center gap-1 text-[10px] sm:text-xs font-semibold"
              >
                <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="hidden md:inline text-zinc-400 font-normal">Helpline:</span>
                <span>{settings.phone}</span>
              </a>
            )}
            <button
              onClick={onOpenTracker}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1 font-semibold text-[10px] sm:text-xs cursor-pointer"
            >
              <PackageCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Track Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Marketplace Header: [Logo] [Categories] [Search] [Account] [Cart] */}
      <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-6 h-14 sm:h-20 flex items-center justify-between gap-1 xs:gap-2 sm:gap-4 w-full min-w-0">
        {/* 1. Maxora Logo */}
        <div className="flex items-center min-w-0 shrink">
          <button
            onClick={handleLogoClick}
            title={settings.store_name || "Maxora"}
            className="flex items-center gap-1.5 sm:gap-2.5 text-left group cursor-pointer min-w-0"
          >
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-black text-base sm:text-2xl tracking-tight shadow-md group-hover:scale-105 transition-transform shrink-0">
              M
            </div>
            <div className="min-w-0">
              <span className="text-base sm:text-2xl font-black tracking-tight text-zinc-950 group-hover:text-zinc-700 transition-colors truncate block">
                {settings.store_name || "Maxora"}
                <span className="text-emerald-500">.</span>
              </span>
              <span className="hidden xs:block text-[8px] sm:text-[10px] uppercase font-bold text-zinc-600 tracking-wider -mt-1">
                Shop BD
              </span>
            </div>
          </button>
        </div>

        {/* Center: Desktop Categories Menu Button + Search Bar */}
        <div className="hidden lg:flex items-center flex-1 max-w-2xl xl:max-w-3xl mx-2 gap-2.5 relative min-w-0">
          {/* Categories Hierarchy Menu Trigger */}
          <div className="shrink-0" ref={menuRef}>
            <button
              type="button"
              id="navbar-categories-menu-button"
              data-hierarchy-trigger="true"
              onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all border cursor-pointer shadow-2xs active:scale-98 ${
                categoryMenuOpen || currentTaxonomyFilter.category
                  ? 'bg-zinc-950 text-white border-zinc-950 shadow-md'
                  : 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 border-zinc-200'
              }`}
            >
              <LayoutGrid className={`w-4 h-4 ${categoryMenuOpen || currentTaxonomyFilter.category ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <span className="truncate max-w-[130px]">
                {currentTaxonomyFilter.childCategory ||
                  currentTaxonomyFilter.productType ||
                  currentTaxonomyFilter.subCategory ||
                  currentTaxonomyFilter.category ||
                  'Categories'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform shrink-0 ${categoryMenuOpen ? 'rotate-180' : ''}`} />
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
          <div className="relative flex-1 min-w-0">
            <div className="relative flex items-center w-full">
              <input
                type="text"
                placeholder="Search products by name, category, or SKU..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-zinc-50 hover:bg-white focus:bg-white text-zinc-900 text-sm pl-11 pr-24 py-2.5 rounded-xl border border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 focus:outline-none transition-all placeholder:text-zinc-500 shadow-2xs"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-4 shrink-0" />
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
        <div className="hidden sm:flex lg:hidden flex-1 max-w-xs mx-1 min-w-0">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-zinc-100 focus:bg-white text-zinc-900 text-xs sm:text-sm pl-8 pr-7 py-2 rounded-xl border border-zinc-200 focus:border-zinc-900 focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5 shrink-0" />
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

        {/* Action Controls: [Categories] [Search] [Account] [Cart] */}
        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2.5 shrink-0">
          {/* 2. Categories Button (Mobile & Tablet only) */}
          <button
            type="button"
            id="navbar-categories-menu-button-mobile"
            onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
            className={`lg:hidden p-1.5 xs:p-2 sm:px-2.5 sm:py-2 rounded-xl border flex items-center gap-1 text-xs font-bold transition-all cursor-pointer shrink-0 ${
              categoryMenuOpen || currentTaxonomyFilter.category
                ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                : 'border-zinc-200 text-zinc-800 hover:bg-zinc-100'
            }`}
            aria-label="Browse Categories"
            title="Browse Categories"
          >
            <LayoutGrid className={`w-4 h-4 shrink-0 ${categoryMenuOpen || currentTaxonomyFilter.category ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span className="hidden sm:inline">Categories</span>
          </button>

          {/* 3. Search Button (Mobile toggle) */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className={`sm:hidden p-1.5 xs:p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              mobileSearchOpen
                ? 'bg-zinc-950 text-white border-zinc-950'
                : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100'
            }`}
            aria-label="Search"
            title="Search products"
          >
            <Search className="w-4 h-4 shrink-0" />
          </button>

          {/* Wishlist / Saved Items Trigger Button (Desktop & Tablet) */}
          {onOpenWishlist && (
            <button
              id="wishlist-trigger-button"
              onClick={onOpenWishlist}
              className={`hidden md:flex relative items-center gap-1.5 px-3 py-2 rounded-xl border font-bold text-xs transition-all cursor-pointer active:scale-95 shrink-0 ${
                wishlistCount > 0
                  ? 'bg-rose-50/80 hover:bg-rose-100 border-rose-200 text-rose-700'
                  : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700'
              }`}
              title="View Saved Items"
              aria-label="Saved Items"
            >
              <Heart
                className={`w-4 h-4 shrink-0 transition-transform ${
                  wishlistCount > 0
                    ? 'fill-rose-500 text-rose-500 scale-105'
                    : 'text-zinc-600'
                }`}
              />
              <span className="hidden xl:inline">Saved</span>
              {wishlistCount > 0 && (
                <span className="bg-rose-500 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow-2xs">
                  {wishlistCount}
                </span>
              )}
            </button>
          )}

          {/* 4. Customer Account / Login Button */}
          <button
            id="navbar-customer-account-button"
            onClick={onOpenCustomerAccount}
            className={`p-1.5 xs:p-2 sm:px-3 sm:py-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 ${
              customer
                ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-950 shadow-2xs'
                : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-800'
            }`}
            aria-label={customer ? `Account: ${customer.name}` : 'Customer Login'}
            title={customer ? `Hi, ${customer.name} (My Account)` : 'Customer Login / Account'}
          >
            <div className="relative shrink-0 flex items-center justify-center">
              {customer ? (
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <User className="w-4 h-4 text-zinc-700 shrink-0" />
              )}
              {customer && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </div>
            {/* Display text where space allows, graceful truncation, icon-only on 320px */}
            <span className="hidden min-[380px]:inline-block max-w-[62px] xs:max-w-[85px] sm:max-w-[110px] truncate text-[11px] sm:text-xs">
              {customer ? (customer.name ? customer.name.split(' ')[0] : 'Account') : 'Login'}
            </span>
          </button>

          {/* 5. Cart Trigger Button */}
          <button
            id="cart-trigger-button"
            onClick={onOpenCart}
            className="relative flex items-center gap-1 xs:gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-white px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
            aria-label="Shopping Cart"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="hidden min-[420px]:inline text-xs">Cart</span>
            {cartCount > 0 && (
              <span className="bg-emerald-500 text-zinc-950 font-black text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full min-w-[18px] text-center shrink-0">
                {cartCount}
              </span>
            )}
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
        <div className="sm:hidden px-3 pb-3 pt-1 border-t border-zinc-100 bg-white animate-in slide-in-from-top-2 duration-200">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              autoFocus
              className="w-full bg-zinc-100 text-zinc-900 text-xs sm:text-sm pl-9 pr-8 py-2 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-950"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5 shrink-0" />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-2 text-xs text-zinc-400 hover:text-zinc-600 bg-zinc-200 rounded-full w-4 h-4 flex items-center justify-center"
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
