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
  Menu,
  Home,
  Cpu,
  Watch,
  Shirt,
  Sparkles,
  Baby,
  ArrowRight,
  Tag,
} from 'lucide-react';
import { StoreSettings, Category, Product, Customer } from '../types';
import { TaxonomyCategory, TaxonomyFilterState, matchesTaxonomyField } from '../utils/taxonomy';
import {
  CategoryMegaMenu,
  MegaMenuCategoryItem,
  MegaMenuSubItem,
  MegaMenuProductType,
} from './CategoryMegaMenu';
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
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);

  // Close mega menu and search dropdown on escape or click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // If clicking inside the nav container or mega menu, do not close mega menu here
      if (
        navContainerRef.current &&
        (navContainerRef.current.contains(target) || target.closest('[data-mega-menu="true"]'))
      ) {
        // keep menu
      } else {
        setActiveMegaMenu(null);
      }

      // Close instant search dropdown if clicked outside
      const inDesktopSearch = searchContainerRef.current && searchContainerRef.current.contains(target);
      const inMobileSearch = mobileSearchContainerRef.current && mobileSearchContainerRef.current.contains(target);
      if (!inDesktopSearch && !inMobileSearch) {
        setIsSearchFocused(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMegaMenu(null);
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Compute live instant search results (top 6 matches)
  const instantSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 1) return [];
    return products
      .filter((p) => {
        const name = (p.name || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const sub = (p.subcategory || '').toLowerCase();
        const sku = (p.sku || '').toLowerCase();
        return name.includes(q) || brand.includes(q) || cat.includes(q) || sub.includes(q) || sku.includes(q);
      })
      .slice(0, 6);
  }, [products, searchQuery]);

  const handleSelectInstantProduct = (prod: Product) => {
    setIsSearchFocused(false);
    setMobileSearchOpen(false);
    if (onSelectProduct) {
      onSelectProduct(prod);
    }
  };

  const handleViewAllResults = () => {
    setIsSearchFocused(false);
    setMobileSearchOpen(false);
    const el = document.getElementById('products-catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

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

  // The 7 Required Categories for Maxora Shop Category Navigation
  interface DefinedNavCategory {
    name: string;
    slug: string;
    matchPatterns: RegExp[];
    icon: React.ReactNode;
    fallbackSubcategories?: string[];
  }

  const DEFINED_NAV_CATEGORIES: DefinedNavCategory[] = useMemo(
    () => [
      {
        name: 'Electronics',
        slug: 'electronics',
        matchPatterns: [/^electronic/i, /computer/i, /audio/i],
        icon: <Cpu className="w-3.5 h-3.5" />,
        fallbackSubcategories: ['Audio', 'Power Banks', 'Printers & Accessories', 'Computer & Gaming'],
      },
      {
        name: 'Smart Gadgets',
        slug: 'smart-gadgets',
        matchPatterns: [/smart/i, /gadget/i],
        icon: <Watch className="w-3.5 h-3.5" />,
        fallbackSubcategories: ['Kids & Educational Gadgets', 'Smartwatches', 'Fitness Bands', 'Smart Devices'],
      },
      {
        name: 'Fashion & Lifestyle',
        slug: 'fashion-lifestyle',
        matchPatterns: [/fashion/i, /lifestyle/i, /bag/i, /backpack/i],
        icon: <Shirt className="w-3.5 h-3.5" />,
        fallbackSubcategories: ['Backpacks & Bags', 'Backpacks', 'Lifestyle Accessories', "Men's Fashion"],
      },
      {
        name: 'Beauty & Personal Care',
        slug: 'beauty-personal-care',
        matchPatterns: [/beauty/i, /personal/i, /health/i, /skin/i, /hair/i],
        icon: <Sparkles className="w-3.5 h-3.5" />,
        fallbackSubcategories: ['Hair Care', 'Skin Care', 'Sexual Wellness', 'Personal Grooming'],
      },
      {
        name: 'Home & Living',
        slug: 'home-living',
        matchPatterns: [/home/i, /living/i, /kitchen/i],
        icon: <Home className="w-3.5 h-3.5" />,
        fallbackSubcategories: ['Home Appliances', 'Kitchen & Dining', 'Kitchen Appliances', 'Portable Washing Machines', 'Coffee Drippers', 'Vacuum Flasks'],
      },
      {
        name: 'Accessories',
        slug: 'accessories',
        matchPatterns: [/accessor/i, /charger/i, /wallet/i, /lighter/i],
        icon: <ShoppingBag className="w-3.5 h-3.5" />,
        fallbackSubcategories: ['Lighter', 'Wallets', 'Chargers & Cables', 'Mobile Accessories'],
      },
      {
        name: 'Kids & Baby',
        slug: 'kids-baby',
        matchPatterns: [/kid/i, /baby/i, /toy/i],
        icon: <Baby className="w-3.5 h-3.5" />,
        fallbackSubcategories: ['Toys & Games', 'Kids Educational Gadgets', 'Baby Care', 'Kids Learning'],
      },
    ],
    []
  );

  // Aggregate subcategories and product types for each defined navigation category
  const categoryNavItems = useMemo<MegaMenuCategoryItem[]>(() => {
    return DEFINED_NAV_CATEGORIES.map((navCat) => {
      // Find matching categories in taxonomy tree
      const matchingTaxCats = taxonomy.filter((tCat) =>
        navCat.matchPatterns.some((pattern) => pattern.test(tCat.slug) || pattern.test(tCat.name))
      );

      // Find primary category in database
      const primaryCat = categories.find((c) =>
        navCat.matchPatterns.some((p) => p.test(c.slug) || p.test(c.name))
      );

      // Aggregate all subcategories and their product types from matched taxonomy
      const subMap = new Map<string, MegaMenuSubItem>();

      matchingTaxCats.forEach((tCat) => {
        tCat.subCategories?.forEach((sub) => {
          const subKey = sub.name.toLowerCase();
          const pTypes: MegaMenuProductType[] = (sub.productTypes || []).map((pt) => ({
            id: pt.id,
            name: pt.name,
            slug: pt.slug,
            count: pt.count,
          }));

          if (!subMap.has(subKey)) {
            subMap.set(subKey, {
              id: sub.id,
              name: sub.name,
              slug: sub.slug,
              count: sub.count,
              parentCatSlug: tCat.slug,
              parentCatId: tCat.id,
              productTypes: pTypes,
            });
          } else {
            const existing = subMap.get(subKey)!;
            existing.count = (existing.count || 0) + (sub.count || 0);
            pTypes.forEach((pt) => {
              if (
                !existing.productTypes?.some(
                  (existingPt) => existingPt.name.toLowerCase() === pt.name.toLowerCase()
                )
              ) {
                existing.productTypes?.push(pt);
              }
            });
          }
        });
      });

      // Ensure all fallback subcategories are present
      if (navCat.fallbackSubcategories) {
        navCat.fallbackSubcategories.forEach((name) => {
          const subKey = name.toLowerCase();
          if (!subMap.has(subKey)) {
            const slug = name.toLowerCase().replace(/[\s_&]+/g, '-');
            subMap.set(subKey, {
              name,
              slug,
              count: 0,
              parentCatSlug: primaryCat?.slug || navCat.slug,
              parentCatId: primaryCat?.id,
              productTypes: [],
            });
          }
        });
      }

      const subcategories = Array.from(subMap.values()).sort((a, b) => {
        if ((b.count || 0) !== (a.count || 0)) {
          return (b.count || 0) - (a.count || 0);
        }
        return a.name.localeCompare(b.name);
      });

      const totalCount = subcategories.reduce((acc, s) => acc + (s.count || 0), 0);

      return {
        name: navCat.name,
        slug: primaryCat?.slug || navCat.slug,
        id: primaryCat?.id || `cat-${navCat.slug}`,
        icon: navCat.icon,
        count: totalCount,
        subcategories,
      };
    });
  }, [categories, taxonomy, DEFINED_NAV_CATEGORIES]);

  // Combine defined nav categories + any additional database categories for "All Categories" menu
  const allMegaMenuCategories = useMemo<MegaMenuCategoryItem[]>(() => {
    const list: MegaMenuCategoryItem[] = [...categoryNavItems];

    // Check for any categories in taxonomy that are not already covered
    taxonomy.forEach((tCat) => {
      const isCovered = DEFINED_NAV_CATEGORIES.some((d) =>
        d.matchPatterns.some((pattern) => pattern.test(tCat.slug) || pattern.test(tCat.name))
      );
      if (!isCovered && tCat.name) {
        list.push({
          id: tCat.id,
          name: tCat.name,
          slug: tCat.slug,
          icon: <LayoutGrid className="w-3.5 h-3.5" />,
          count: tCat.count,
          subcategories: (tCat.subCategories || []).map((s) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            count: s.count,
            parentCatSlug: tCat.slug,
            parentCatId: tCat.id,
            productTypes: (s.productTypes || []).map((pt) => ({
              id: pt.id,
              name: pt.name,
              slug: pt.slug,
              count: pt.count,
            })),
          })),
        });
      }
    });

    return list;
  }, [categoryNavItems, taxonomy, DEFINED_NAV_CATEGORIES]);

  // Find currently active category object when a specific category mega-menu is open
  const currentActiveCategory = useMemo<MegaMenuCategoryItem | null>(() => {
    if (!activeMegaMenu || activeMegaMenu === 'all') return null;
    return (
      allMegaMenuCategories.find((c) => c.slug === activeMegaMenu) ||
      allMegaMenuCategories.find((c) => {
        const def = DEFINED_NAV_CATEGORIES.find((d) => d.slug === c.slug || d.name === c.name);
        return def?.matchPatterns.some((p) => p.test(activeMegaMenu));
      }) ||
      null
    );
  }, [activeMegaMenu, allMegaMenuCategories, DEFINED_NAV_CATEGORIES]);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-xs border-b border-zinc-200/90 w-full max-w-full">
      {/* 1. Slim Announcement / Top Bar matching screenshot */}
      <div className="bg-[#0f172a] text-zinc-300 text-xs py-2 px-3 sm:px-6 w-full border-b border-zinc-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-zinc-300 font-medium truncate">
            <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            {settings.free_delivery_enabled !== false ? (
              <>
                <span className="font-semibold text-white">
                  Free Delivery on orders above ৳{(Number(settings.free_delivery_threshold) > 0 ? Number(settings.free_delivery_threshold) : 1500).toLocaleString('en-BD')}
                </span>
                <span className="text-zinc-600 hidden xs:inline">|</span>
                <span className="hidden xs:inline">
                  {settings.promo_text?.trim() || "Cash on Delivery Available"}
                </span>
                <span className="text-zinc-600 hidden md:inline">|</span>
                <span className="hidden md:inline">Fast Delivery Across Bangladesh</span>
              </>
            ) : (
              <>
                <span className="font-semibold text-white">
                  {settings.promo_text?.trim() || "Cash on Delivery Available Across Bangladesh"}
                </span>
                <span className="text-zinc-600 hidden xs:inline">|</span>
                <span className="hidden xs:inline">Fast Delivery Across Bangladesh (64 Districts)</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-5 text-zinc-300 shrink-0 text-[11px] sm:text-xs font-medium">
            <button
              onClick={onOpenTracker}
              className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <PackageCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span>Track Order</span>
            </button>
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

        {/* Center Search Bar with Live Instant Results Dropdown */}
        <div className="flex-1 max-w-2xl mx-2 hidden sm:block relative" ref={searchContainerRef}>
          <div className="relative flex items-center w-full">
            <input
              type="text"
              placeholder="Search for products, categories, brands..."
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsSearchFocused(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsSearchFocused(false);
                } else if (e.key === 'Enter') {
                  handleViewAllResults();
                }
              }}
              className="w-full bg-zinc-50 hover:bg-white focus:bg-white text-zinc-900 text-sm pl-4 pr-14 py-2.5 rounded-xl border border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all placeholder:text-zinc-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  setIsSearchFocused(false);
                }}
                className="absolute right-14 text-xs text-zinc-400 hover:text-zinc-700 bg-zinc-200 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            )}
            <button
              type="button"
              onClick={handleViewAllResults}
              className="absolute right-1 top-1 bottom-1 px-4 bg-[#0f172a] hover:bg-zinc-800 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Live Instant Search Dropdown (Desktop) */}
          {isSearchFocused && searchQuery.trim().length >= 1 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-zinc-200/90 shadow-2xl z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-150 divide-y divide-zinc-100">
              <div className="px-4 py-2.5 bg-zinc-50/90 flex items-center justify-between text-xs font-bold text-zinc-600">
                <span className="flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-zinc-500" />
                  <span>ম্যাচিং প্রোডাক্ট ({instantSearchResults.length})</span>
                </span>
                <span className="text-[11px] text-zinc-400 font-normal">ESC দিয়ে বন্ধ করুন</span>
              </div>

              {instantSearchResults.length > 0 ? (
                <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-100">
                  {instantSearchResults.map((prod) => {
                    const sellingPrice = Number(prod.selling_price || 0);
                    const discount = Number(prod.discount || 0);
                    const finalPrice = Math.max(0, sellingPrice - discount);
                    const thumb =
                      prod.image_url ||
                      (prod.images && prod.images[0]) ||
                      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80';

                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleSelectInstantProduct(prod)}
                        className="w-full text-left p-3 hover:bg-emerald-50/50 flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200/80 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                          <img
                            src={thumb}
                            alt={prod.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-zinc-900 group-hover:text-emerald-700 truncate leading-snug">
                            {prod.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500">
                            {prod.category && (
                              <span className="truncate max-w-[120px] bg-zinc-100 px-1.5 py-0.2 rounded text-[10px] font-medium text-zinc-700">
                                {prod.category}
                              </span>
                            )}
                            {prod.brand && (
                              <span className="font-semibold text-zinc-600 truncate max-w-[100px]">
                                {prod.brand}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-zinc-950">
                            ৳{finalPrice.toLocaleString('en-BD')}
                          </div>
                          {discount > 0 && (
                            <div className="text-[10px] text-zinc-400 line-through">
                              ৳{sellingPrice.toLocaleString('en-BD')}
                            </div>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-zinc-500">
                  <p className="text-xs font-semibold text-zinc-700">"{searchQuery}" দিয়ে কোনো প্রোডাক্ট মেলেনি</p>
                  <p className="text-[11px] text-zinc-400 mt-1">অন্য কোনো প্রোডাক্টের নাম বা ব্র্যান্ড লিখে চেষ্টা করুন</p>
                </div>
              )}

              {instantSearchResults.length > 0 && (
                <button
                  type="button"
                  onClick={handleViewAllResults}
                  className="w-full py-2.5 px-4 bg-zinc-50 hover:bg-zinc-100 text-center text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>সবগুলো সার্চ ফলাফল দেখুন ({instantSearchResults.length}+)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
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
      <div className="bg-[#0f172a] text-white text-xs font-semibold w-full border-t border-b border-slate-800/90 relative z-30 shadow-xs">
        <div
          ref={navContainerRef}
          className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center gap-1.5 sm:gap-2 py-1.5 overflow-x-auto no-scrollbar scroll-smooth"
        >
          {/* 1. All Categories Button */}
          <button
            type="button"
            id="navbar-categories-menu-button"
            data-nav-category-button="true"
            onClick={() => {
              setActiveMegaMenu((prev) => (prev ? null : 'all'));
            }}
            className={`flex items-center gap-2 font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer text-xs shrink-0 ${
              activeMegaMenu
                ? 'bg-slate-800 text-teal-300 border-teal-500/80 shadow-xs'
                : 'text-white hover:text-teal-300 bg-slate-800/90 hover:bg-slate-800 border-slate-700/60'
            }`}
            aria-expanded={Boolean(activeMegaMenu)}
            aria-haspopup="true"
          >
            <Menu className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>All Categories</span>
            <ChevronDown
              className={`w-3 h-3 text-zinc-400 transition-transform shrink-0 duration-150 ${
                activeMegaMenu ? 'rotate-180 text-teal-400' : ''
              }`}
            />
          </button>

          {/* Vertical divider */}
          <div className="h-4 w-px bg-slate-800 shrink-0 hidden sm:block" />

          {/* Category Navigation Row */}
          <nav className="flex items-center gap-1 sm:gap-1.5 shrink-0 py-0.5" aria-label="Category Navigation">
            {/* 2. Home button */}
            <button
              type="button"
              id="navbar-home-button"
              data-nav-category-button="true"
              onClick={() => {
                setActiveMegaMenu(null);
                handleLogoClick();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
                !currentTaxonomyFilter.category && !activeMegaMenu
                  ? 'text-teal-300 bg-slate-800/90 font-bold border-b-2 border-teal-400'
                  : 'text-zinc-300 hover:text-teal-300 hover:bg-slate-800/50 font-medium'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-zinc-400" />
              <span>Home</span>
            </button>
          </nav>
        </div>

        {/* The Clean White Mega-Menu opening directly below the dark navy category bar */}
        <CategoryMegaMenu
          isOpen={Boolean(activeMegaMenu)}
          activeMenu={activeMegaMenu}
          allCategories={allMegaMenuCategories}
          currentCategory={currentActiveCategory}
          currentFilter={currentTaxonomyFilter}
          onSelectTaxonomy={handleTaxonomySelect}
          onClose={() => setActiveMegaMenu(null)}
        />
      </div>

      {/* Mobile Search Bar Expandable */}
      {mobileSearchOpen && (
        <div
          ref={mobileSearchContainerRef}
          className="sm:hidden px-3 pb-3 pt-2 border-t border-zinc-150 bg-white animate-in slide-in-from-top-2 duration-200 relative shadow-md"
        >
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsSearchFocused(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsSearchFocused(false);
                  setMobileSearchOpen(false);
                } else if (e.key === 'Enter') {
                  handleViewAllResults();
                }
              }}
              autoFocus
              className="w-full bg-zinc-100 text-zinc-900 text-xs sm:text-sm pl-9 pr-8 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-950 focus:bg-white"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3 shrink-0" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  setIsSearchFocused(false);
                }}
                className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-zinc-600 bg-zinc-200 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Mobile Instant Search Dropdown */}
          {isSearchFocused && searchQuery.trim().length >= 1 && (
            <div className="mt-2 bg-white rounded-xl border border-zinc-200 shadow-xl overflow-hidden divide-y divide-zinc-100 max-h-[60vh] overflow-y-auto">
              <div className="px-3 py-2 bg-zinc-50 flex items-center justify-between text-[11px] font-bold text-zinc-500">
                <span>ম্যাচিং প্রোডাক্ট ({instantSearchResults.length})</span>
                <button
                  type="button"
                  onClick={() => setIsSearchFocused(false)}
                  className="text-zinc-400 hover:text-zinc-700"
                >
                  ✕ বন্ধ করুন
                </button>
              </div>

              {instantSearchResults.length > 0 ? (
                <div className="divide-y divide-zinc-100">
                  {instantSearchResults.map((prod) => {
                    const sellingPrice = Number(prod.selling_price || 0);
                    const discount = Number(prod.discount || 0);
                    const finalPrice = Math.max(0, sellingPrice - discount);
                    const thumb =
                      prod.image_url ||
                      (prod.images && prod.images[0]) ||
                      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80';

                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleSelectInstantProduct(prod)}
                        className="w-full text-left p-2.5 hover:bg-emerald-50/50 flex items-center gap-2.5 active:bg-zinc-100 transition-colors cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-200/80 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                          <img
                            src={thumb}
                            alt={prod.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-zinc-900 truncate">
                            {prod.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-500">
                            {prod.category && <span className="truncate max-w-[100px]">{prod.category}</span>}
                            {prod.brand && <span>• {prod.brand}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-zinc-950">
                            ৳{finalPrice.toLocaleString('en-BD')}
                          </div>
                          {discount > 0 && (
                            <div className="text-[9px] text-zinc-400 line-through">
                              ৳{sellingPrice.toLocaleString('en-BD')}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-zinc-500 text-xs">
                  কোনো প্রোডাক্ট মেলেনি
                </div>
              )}

              {instantSearchResults.length > 0 && (
                <button
                  type="button"
                  onClick={handleViewAllResults}
                  className="w-full py-2.5 px-3 bg-zinc-50 hover:bg-zinc-100 text-center text-xs font-bold text-emerald-700 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>সবগুলো প্রোডাক্ট দেখুন ({instantSearchResults.length}+)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
