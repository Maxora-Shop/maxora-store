import React, { useState, useRef, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Truck,
  Phone,
  LayoutGrid,
  ChevronDown,
  PackageCheck,
  X,
  Heart,
  User,
  UserCheck,
  Headphones,
  Menu,
} from 'lucide-react';
import { StoreSettings, Category, Product, Customer } from '../types';
import { TaxonomyCategory, TaxonomyFilterState, matchesTaxonomyField } from '../utils/taxonomy';
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
  onOpenAdmin?: () => void;
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
  onOpenAdmin,
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
  };

  // Dynamic categories for the dark sub-navigation bar
  const subNavLinks = useMemo(() => {
    const defaultNav = [
      { name: 'Home', slug: '', id: '' },
      { name: 'Electronics', slug: 'electronics', id: 'cat-electronics' },
      { name: 'Home & Living', slug: 'home-living', id: 'cat-home-living' },
      { name: 'Smart Gadgets', slug: 'smart-gadgets', id: 'cat-smart-gadgets' },
      { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', id: 'cat-beauty-personal-care' },
      { name: 'Fashion & Lifestyle', slug: 'fashion-lifestyle', id: 'cat-fashion-lifestyle' },
    ];

    if (categories && categories.length > 0) {
      const activeCats = categories
        .filter((c) => c.active !== 0 && c.active !== false && String(c.active) !== '0')
        .sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));

      if (activeCats.length > 0) {
        return [
          { name: 'Home', slug: '', id: '' },
          ...activeCats.map((c) => ({
            name: c.name,
            slug: c.slug || c.name.toLowerCase().replace(/[\s_&]+/g, '-'),
            id: c.id,
          })),
        ];
      }
    }

    return defaultNav;
  }, [categories]);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-xs border-b border-zinc-200/90 w-full max-w-full">
      {/* 1. Slim Announcement / Top Bar matching screenshot */}
      <div className="bg-[#0f172a] text-zinc-300 text-xs py-2 px-3 sm:px-6 w-full border-b border-zinc-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-zinc-300 font-medium truncate">
            <Truck className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
            <span>Free Delivery on orders above ৳1500</span>
            <span className="text-zinc-600 hidden xs:inline">|</span>
            <span className="hidden xs:inline">Cash on Delivery Available</span>
            <span className="text-zinc-600 hidden md:inline">|</span>
            <span className="hidden md:inline">Fast Delivery Across Bangladesh</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 text-zinc-300 shrink-0 text-[11px] sm:text-xs font-medium">
            <button
              onClick={onOpenTracker}
              className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <PackageCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span>Track Order</span>
            </button>
            <span className="text-zinc-700 hidden sm:inline">•</span>
            <a
              href="#support-section"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('support-section') || document.getElementById('footer-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer hidden sm:flex"
            >
              <Headphones className="w-3.5 h-3.5 text-zinc-400" />
              <span>Help & Support</span>
            </a>
            {settings.phone && (
              <>
                <span className="text-zinc-700 hidden md:inline">•</span>
                <a
                  href={`tel:${settings.phone}`}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer hidden md:flex font-semibold"
                >
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{settings.phone}</span>
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Marketplace Header: [Logo] [Search] [Login] [Wishlist] [Cart] */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6 w-full">
        {/* Logo & Store Name */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2.5 text-left group cursor-pointer shrink-0 max-w-[220px] sm:max-w-none"
        >
          {settings.logo_url ? (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-white border border-zinc-200/80 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <img
                src={settings.logo_url}
                alt={settings.store_name || "Store Logo"}
                className="w-full h-full object-contain p-0.5"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.navbar-logo-fallback') as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div
                className="navbar-logo-fallback hidden w-full h-full bg-zinc-950 text-white items-center justify-center font-black text-xl tracking-tight"
              >
                {(settings.store_name?.trim() || 'M').charAt(0).toUpperCase()}
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-black text-xl tracking-tight shadow-md group-hover:scale-105 transition-transform shrink-0">
              {(settings.store_name?.trim() || 'M').charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-lg sm:text-2xl font-black tracking-tight text-zinc-950 group-hover:text-zinc-800 transition-colors truncate">
            {settings.store_name || "Maxora Shop BD"}
          </span>
        </button>

        {/* Center Search Bar matching screenshot */}
        <div className="flex-1 max-w-2xl mx-2 hidden sm:block">
          <div className="relative flex items-center w-full">
            <input
              type="text"
              placeholder="Search for products, categories, brands..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-zinc-50 hover:bg-white focus:bg-white text-zinc-900 text-sm pl-4 pr-14 py-2.5 rounded-xl border border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all placeholder:text-zinc-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-14 text-xs text-zinc-400 hover:text-zinc-700 bg-zinc-200 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            )}
            <button
              type="button"
              className="absolute right-1 top-1 bottom-1 px-4 bg-[#0f172a] hover:bg-zinc-800 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right utility items: [Login/Register] [Wishlist] [Cart] */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="sm:hidden p-2 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 flex items-center justify-center cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Login / Customer Account Button */}
          <button
            id="navbar-customer-account-button"
            onClick={onOpenCustomerAccount}
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-2.5 py-2 rounded-xl border transition-colors cursor-pointer ${
              customer
                ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                : 'bg-white text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 border-zinc-200'
            }`}
          >
            {customer ? (
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <User className="w-4 h-4 text-zinc-600 shrink-0" />
            )}
            <span className="hidden md:inline">
              {customer ? (customer.name ? customer.name.split(' ')[0] : 'Account') : 'Login / Register'}
            </span>
          </button>

          {/* Wishlist Button */}
          {onOpenWishlist && (
            <button
              id="wishlist-trigger-button"
              onClick={onOpenWishlist}
              className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-2.5 py-2 rounded-xl border transition-colors cursor-pointer relative ${
                wishlistCount > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-white text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 border-zinc-200'
              }`}
              title="View Wishlist"
            >
              <Heart
                className={`w-4 h-4 shrink-0 ${
                  wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : 'text-zinc-600'
                }`}
              />
              <span className="hidden md:inline">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="bg-rose-600 text-white font-extrabold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </button>
          )}

          {/* Cart Trigger Button */}
          <button
            id="cart-trigger-button"
            onClick={onOpenCart}
            className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-800 hover:text-zinc-950 px-3 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors cursor-pointer relative"
            aria-label="Shopping Cart"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-zinc-800" />
              <span className="absolute -top-2 -right-2.5 bg-rose-600 text-white font-extrabold text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            </div>
            <span className="hidden sm:inline font-bold">Cart</span>
          </button>
        </div>
      </div>

      {/* 3. Sub-Navigation Bar matching screenshot (Dark Navy #0f172a) */}
      <div className="bg-[#0f172a] text-white text-xs font-semibold w-full border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center overflow-x-auto no-scrollbar">
          {/* Left Categories Menu Trigger */}
          <div className="relative shrink-0 py-2.5" ref={menuRef}>
            <button
              type="button"
              id="navbar-categories-menu-button"
              onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
              className="flex items-center gap-2 text-white hover:text-emerald-400 font-bold px-3 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Menu className="w-4 h-4" />
              <span>All Categories</span>
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

          {/* Moderate / Balanced Divider Spacing (মাঝামাঝি পরিমিত দূরত্ব) */}
          <div className="h-4 w-px bg-zinc-700/80 shrink-0 mx-5 sm:mx-8 hidden sm:block" />

          {/* Direct Category Links with moderate balanced spacing */}
          <nav className="flex items-center gap-5 sm:gap-7 overflow-x-auto no-scrollbar py-2.5">
            {subNavLinks.map((link) => {
              const isActive =
                (!link.slug && !currentTaxonomyFilter.category) ||
                (Boolean(link.slug) &&
                  Boolean(currentTaxonomyFilter.category) &&
                  (matchesTaxonomyField(currentTaxonomyFilter.category, link.slug) ||
                    matchesTaxonomyField(currentTaxonomyFilter.category, link.name) ||
                    (link.id && currentTaxonomyFilter.categoryId === link.id)));

              return (
                <button
                  key={link.id || link.slug || link.name}
                  onClick={() => {
                    if (!link.slug) {
                      handleLogoClick();
                    } else {
                      handleTaxonomySelect({
                        category: link.slug,
                        subCategory: '',
                        productType: '',
                        childCategory: '',
                        categoryId: link.id || '',
                        subCategoryId: '',
                        productTypeId: '',
                        childCategoryId: '',
                      });
                    }
                  }}
                  className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer text-xs font-medium ${
                    isActive
                      ? 'text-white border-b-2 border-emerald-400 pb-0.5 font-bold'
                      : 'text-zinc-300'
                  }`}
                >
                  {link.name}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
              className="text-zinc-400 hover:text-white transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 text-xs"
            >
              <span>More</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </nav>
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
        <div className="sm:hidden px-3 pb-3 pt-2 border-t border-zinc-100 bg-white animate-in slide-in-from-top-2 duration-200">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              autoFocus
              className="w-full bg-zinc-100 text-zinc-900 text-xs sm:text-sm pl-9 pr-8 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-950"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3 shrink-0" />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-zinc-600 bg-zinc-200 rounded-full w-4 h-4 flex items-center justify-center"
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
