import React, { useState, useRef, useMemo, useEffect } from 'react';
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
import { EcommerceMegaMenu } from './EcommerceMegaMenu';
import { useTaxonomy } from '../context/TaxonomyContext';

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
  categories: propCategories = [],
  selectedCategory = '',
  onSelectCategory,
  taxonomy: propTaxonomy = [],
  currentTaxonomyFilter = {} as Partial<TaxonomyFilterState>,
  onSelectTaxonomy,
  products = [],
  onSelectProduct,
}) => {
  const taxonomyContext = useTaxonomy();
  const categories = (propCategories && propCategories.length > 0) ? propCategories : taxonomyContext.reconciledCategories;
  const taxonomy = (propTaxonomy && propTaxonomy.length > 0) ? propTaxonomy : taxonomyContext.taxonomyTree;

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close More menu when clicking outside
  useEffect(() => {
    if (!isMoreMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMoreMenuOpen]);

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

  // Structured dynamic categories for clean top navigation:
  // Primary top categories (max 7-8) + remaining categories neatly placed in "More ▼"
  const { primaryNavLinks, moreNavLinks } = useMemo(() => {
    // Desired priority order matching ecommerce navigation standard
    const priorityKeywords = [
      { regex: /electronic/i },
      { regex: /smart/i },
      { regex: /fashion|lifestyle/i },
      { regex: /beauty|personal/i },
      { regex: /home|living|kitchen/i },
      { regex: /accessor/i },
      { regex: /kid|baby/i },
    ];

    const activeCats = (categories || [])
      .filter((c) => c.active !== 0 && c.active !== false && String(c.active) !== '0')
      .sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));

    if (activeCats.length === 0) {
      return {
        primaryNavLinks: [
          { name: 'Electronics', slug: 'electronics', id: 'cat-electronics' },
          { name: 'Smart Gadgets', slug: 'smart-gadgets', id: 'cat-smart-gadgets' },
          { name: 'Fashion', slug: 'fashion-lifestyle', id: 'cat-fashion-lifestyle' },
          { name: 'Beauty', slug: 'beauty-personal-care', id: 'cat-beauty-personal-care' },
          { name: 'Home & Living', slug: 'home-living', id: 'cat-home-living' },
          { name: 'Accessories', slug: 'accessories', id: 'cat-accessories' },
          { name: 'Kids & Baby', slug: 'kids-baby', id: 'cat-kids-baby' },
        ],
        moreNavLinks: [],
      };
    }

    const primary: { name: string; slug: string; id: string }[] = [];
    const matchedIds = new Set<string>();

    // 1. Pick categories matching priority themes first
    priorityKeywords.forEach(({ regex }) => {
      const found = activeCats.find(
        (c) => !matchedIds.has(c.id) && (regex.test(c.slug) || regex.test(c.name))
      );
      if (found && primary.length < 7) {
        primary.push({
          name: found.name,
          slug: found.slug || found.name.toLowerCase().replace(/[\s_&]+/g, '-'),
          id: cId(found),
        });
        matchedIds.add(found.id);
      }
    });

    // 2. Fill up to 7 primary links with other active categories
    activeCats.forEach((c) => {
      if (!matchedIds.has(c.id)) {
        if (primary.length < 7) {
          primary.push({
            name: c.name,
            slug: c.slug || c.name.toLowerCase().replace(/[\s_&]+/g, '-'),
            id: cId(c),
          });
          matchedIds.add(c.id);
        }
      }
    });

    // 3. Put all remaining active categories inside moreNavLinks
    const more: { name: string; slug: string; id: string }[] = [];
    activeCats.forEach((c) => {
      if (!matchedIds.has(c.id)) {
        more.push({
          name: c.name,
          slug: c.slug || c.name.toLowerCase().replace(/[\s_&]+/g, '-'),
          id: cId(c),
        });
      }
    });

    function cId(cat: Category): string {
      return cat.id || '';
    }

    return { primaryNavLinks: primary, moreNavLinks: more };
  }, [categories]);

  // Check if currently selected category resides in "More"
  const isMoreActive = useMemo(() => {
    if (!currentTaxonomyFilter.category) return false;
    return moreNavLinks.some(
      (link) =>
        matchesTaxonomyField(currentTaxonomyFilter.category, link.slug) ||
        matchesTaxonomyField(currentTaxonomyFilter.category, link.name) ||
        (link.id && currentTaxonomyFilter.categoryId === link.id)
    );
  }, [moreNavLinks, currentTaxonomyFilter]);

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

      {/* 3. Sub-Navigation Bar (Clean Dark Navy #0f172a with responsive horizontal scroll) */}
      <div className="bg-[#0f172a] text-white text-xs font-semibold w-full border-t border-zinc-800 relative z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center gap-2 sm:gap-4 py-2 overflow-x-auto no-scrollbar">
          {/* Left Categories Menu Trigger */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              id="navbar-categories-menu-button"
              onClick={() => {
                setCategoryMenuOpen(!categoryMenuOpen);
                setIsMoreMenuOpen(false);
              }}
              className="flex items-center gap-2 text-white hover:text-emerald-400 font-bold px-3 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-800 transition-colors cursor-pointer text-xs"
              aria-expanded={categoryMenuOpen}
            >
              <Menu className="w-4 h-4 text-emerald-400" />
              <span>All Categories</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform shrink-0 ${categoryMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Desktop Ecommerce Mega Menu */}
            {categoryMenuOpen && (
              <EcommerceMegaMenu
                isOpen={categoryMenuOpen}
                onClose={() => setCategoryMenuOpen(false)}
                taxonomy={taxonomy}
                currentFilter={currentTaxonomyFilter}
                onSelectTaxonomy={handleTaxonomySelect}
                products={products}
              />
            )}
          </div>

          {/* Vertical divider */}
          <div className="h-4 w-px bg-zinc-700/80 shrink-0 hidden sm:block" />

          {/* Category Navigation Row */}
          <nav className="flex items-center gap-1 sm:gap-2 shrink-0 py-0.5" aria-label="Category Navigation">
            {/* Home button */}
            <button
              type="button"
              onClick={handleLogoClick}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors whitespace-nowrap cursor-pointer ${
                !currentTaxonomyFilter.category
                  ? 'text-white bg-zinc-800/90 font-bold border-b-2 border-emerald-400'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50 font-medium'
              }`}
            >
              Home
            </button>

            {/* Primary category links */}
            {primaryNavLinks.map((link) => {
              const isActive =
                Boolean(currentTaxonomyFilter.category) &&
                (matchesTaxonomyField(currentTaxonomyFilter.category, link.slug) ||
                  matchesTaxonomyField(currentTaxonomyFilter.category, link.name) ||
                  (link.id && currentTaxonomyFilter.categoryId === link.id));

              return (
                <button
                  key={link.id || link.slug || link.name}
                  type="button"
                  onClick={() => {
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
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'text-white bg-zinc-800/90 font-bold border-b-2 border-emerald-400'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50 font-medium'
                  }`}
                >
                  {link.name}
                </button>
              );
            })}

            {/* Interactive "More ▼" dropdown */}
            <div className="relative shrink-0" ref={moreMenuRef}>
              <button
                type="button"
                id="navbar-more-categories-button"
                onClick={() => {
                  if (moreNavLinks.length > 0) {
                    setIsMoreMenuOpen(!isMoreMenuOpen);
                    setCategoryMenuOpen(false);
                  } else {
                    setCategoryMenuOpen(!categoryMenuOpen);
                  }
                }}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  isMoreActive
                    ? 'text-white bg-zinc-800/90 font-bold border-b-2 border-emerald-400'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50 font-medium'
                }`}
                aria-expanded={isMoreMenuOpen}
              >
                <span>More</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* More Dropdown Menu */}
              {isMoreMenuOpen && (
                <div className="absolute top-full right-0 sm:left-0 mt-2 z-50 w-56 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl py-2 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-zinc-400 tracking-wider border-b border-zinc-800 flex items-center justify-between">
                    <span>Other Categories</span>
                    <span>{moreNavLinks.length}</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {moreNavLinks.map((link) => {
                      const isActive =
                        Boolean(currentTaxonomyFilter.category) &&
                        (matchesTaxonomyField(currentTaxonomyFilter.category, link.slug) ||
                          matchesTaxonomyField(currentTaxonomyFilter.category, link.name) ||
                          (link.id && currentTaxonomyFilter.categoryId === link.id));

                      return (
                        <button
                          key={link.id || link.slug}
                          type="button"
                          onClick={() => {
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
                            setIsMoreMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-zinc-800 text-emerald-400 font-bold'
                              : 'text-zinc-300 hover:text-white hover:bg-zinc-800/70 font-medium'
                          }`}
                        >
                          <span className="truncate">{link.name}</span>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-zinc-800 pt-1.5 px-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        setCategoryMenuOpen(true);
                      }}
                      className="w-full text-center py-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold hover:bg-zinc-800/60 rounded-lg transition-colors cursor-pointer"
                    >
                      Browse All Categories →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Categories Floating Menu Container */}
      {categoryMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in-50 duration-150">
          <div className="relative w-full max-w-xl mx-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <EcommerceMegaMenu
              isOpen={categoryMenuOpen}
              onClose={() => setCategoryMenuOpen(false)}
              taxonomy={taxonomy}
              currentFilter={currentTaxonomyFilter}
              onSelectTaxonomy={handleTaxonomySelect}
              products={products}
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
