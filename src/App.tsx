import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PriceFilter, PriceRange } from './components/PriceFilter';
import { FloatingSupportButton } from './components/FloatingSupportButton';
import { ProductCard } from './components/ProductCard';
import { ProductQuickView } from './components/ProductQuickView';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SEOHead } from './components/SEOHead';
import { AdminDashboard } from './components/AdminDashboard';
import { Product, CartItem, StoreSettings, Category, SubCategory, ProductType, ChildCategory, Review } from './types';
import { storeService } from './services/storeService';
import { pixelService } from './services/pixelService';
import { INITIAL_SETTINGS, INITIAL_PRODUCTS } from './data/initialData';
import { Truck, ShieldCheck, Phone, MapPin, ShoppingBag, AlertCircle, Heart } from 'lucide-react';
import { getProductSlug, findProductBySlugOrId, generateSlug } from './utils/seo';
import { getStoredWishlist, toggleWishlistProduct, clearStoredWishlist } from './utils/wishlist';
import { SavedItemsDrawer } from './components/SavedItemsDrawer';
import {
  reconcileCategories,
  reconcileSubCategories,
  isProductInCategory,
  isProductInSubCategory,
} from './utils/categoryCompatibility';
import {
  buildTaxonomyTree,
  matchesTaxonomyField,
  TaxonomyFilterState,
} from './utils/taxonomy';

export default function App() {
  // Admin View State
  const [isAdminView, setIsAdminView] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;
      return path.startsWith('/admin') || hash === '#admin' || search.includes('admin=true');
    }
    return false;
  });

  // Settings State
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);

  // Products & 4-Tier Taxonomy State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [childCategories, setChildCategories] = useState<ChildCategory[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [hasFetchedProducts, setHasFetchedProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [selectedChildCategory, setSelectedChildCategory] = useState('');

  // Price Filter State
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 50000 });
  const [selectedPricePreset, setSelectedPricePreset] = useState<string>('all');

  // Modals & Drawers
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('maxora_cart') || '[]');
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewInitialTab, setQuickViewInitialTab] = useState<'details' | 'reviews'>('details');
  const [isProductNotFound, setIsProductNotFound] = useState(false);

  // Wishlist / Saved Items State (persisted in localStorage)
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => getStoredWishlist());
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Sync wishlist across storage events and windows
  useEffect(() => {
    const handleWishlistChange = () => {
      setWishlistIds(getStoredWishlist());
    };
    window.addEventListener('maxora_wishlist_updated', handleWishlistChange);
    return () => window.removeEventListener('maxora_wishlist_updated', handleWishlistChange);
  }, []);

  const handleToggleWishlist = (product: Product) => {
    const { ids } = toggleWishlistProduct(product.id);
    setWishlistIds(ids);
  };

  // Reviews and Ratings State
  const [reviews, setReviews] = useState<Review[]>([]);

  // Computed Rating Stats per Product for ProductCard and Catalog views
  const ratingStatsMap = useMemo(() => {
    return storeService.getAllProductRatingStats(reviews);
  }, [reviews]);

  // Ref to hold a pending product slug while products are loading
  const pendingSlugRef = useRef<string | null>(
    typeof window !== 'undefined'
      ? window.location.pathname.startsWith('/product/')
        ? window.location.pathname.replace('/product/', '').replace(/\/$/, '').trim()
        : window.location.hash.startsWith('#product-')
        ? window.location.hash.replace('#product-', '').trim()
        : null
      : null
  );

  // Added animation state map
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  const productSectionRef = useRef<HTMLDivElement>(null);

  // Route listener: handles /admin, /product/:slug, browser back/forward, and direct URLs
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;

      // Admin check
      if (path.startsWith('/admin') || hash === '#admin' || search.includes('admin=true')) {
        setIsAdminView(true);
        setQuickViewProduct(null);
        setIsProductNotFound(false);
        return;
      } else {
        setIsAdminView(false);
      }

      // Product check: /product/:slug or legacy #product-:slug
      let productSlug: string | null = null;
      if (path.startsWith('/product/')) {
        productSlug = path.replace('/product/', '').replace(/\/$/, '').trim();
      } else if (hash.startsWith('#product-')) {
        productSlug = hash.replace('#product-', '').trim();
        // Redirect legacy hash to clean URL
        if (productSlug) {
          window.history.replaceState({}, '', `/product/${productSlug}`);
        }
      }

      if (productSlug) {
        const found = findProductBySlugOrId(products, productSlug);
        if (found) {
          setQuickViewProduct(found);
          setIsProductNotFound(false);
          pixelService.trackViewContent(found);
          pendingSlugRef.current = null;
        } else if (hasFetchedProducts && !loadingProducts) {
          // Products fetched and not found
          setQuickViewProduct(null);
          setIsProductNotFound(true);
          pendingSlugRef.current = null;
        } else {
          // Still waiting for store products to load
          pendingSlugRef.current = productSlug;
        }
      } else {
        setQuickViewProduct(null);
        setIsProductNotFound(false);
        pendingSlugRef.current = null;

        // Category & Subcategory check: /category/:slug or /category/:slug/:subslug
        if (path.startsWith('/category/')) {
          const match = path.match(/^\/category\/([^/?#]+)(?:\/([^/?#]+))?/);
          if (match) {
            const rawCat = decodeURIComponent(match[1]);
            const rawSub = match[2] ? decodeURIComponent(match[2]) : '';
            setSelectedCategory(rawCat);
            setSelectedSubCategory(rawSub);
          }
        } else if (path.startsWith('/type/')) {
          const rawType = decodeURIComponent(path.replace('/type/', '').replace(/\/$/, '').trim());
          setSelectedProductType(rawType);
        } else if (path.startsWith('/child/')) {
          const rawChild = decodeURIComponent(path.replace('/child/', '').replace(/\/$/, '').trim());
          setSelectedChildCategory(rawChild);
        } else if (path === '/' && !hash && !search) {
          setSelectedCategory('');
          setSelectedSubCategory('');
          setSelectedProductType('');
          setSelectedChildCategory('');
        } else if (search) {
          const searchParams = new URLSearchParams(search);
          if (searchParams.has('category')) {
            setSelectedCategory(searchParams.get('category') || '');
            if (searchParams.has('subcategory')) {
              setSelectedSubCategory(searchParams.get('subcategory') || '');
            }
          }
          if (searchParams.has('type')) {
            setSelectedProductType(searchParams.get('type') || '');
          }
          if (searchParams.has('child')) {
            setSelectedChildCategory(searchParams.get('child') || '');
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    // Initial check on mount
    handlePopState();

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, [products, hasFetchedProducts, loadingProducts]);

  // Resolve any pending product slug whenever products array or fetch status changes
  useEffect(() => {
    const currentSlug = pendingSlugRef.current;
    if (currentSlug) {
      const found = findProductBySlugOrId(products, currentSlug);
      if (found) {
        setQuickViewProduct(found);
        setIsProductNotFound(false);
        pixelService.trackViewContent(found);
        pendingSlugRef.current = null;
      } else if (hasFetchedProducts && !loadingProducts) {
        // Checked all database products and slug doesn't exist
        setQuickViewProduct(null);
        setIsProductNotFound(true);
        pendingSlugRef.current = null;
      }
    }
  }, [products, hasFetchedProducts, loadingProducts]);

  // Save Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('maxora_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  // Initialize Marketing & Ad Pixels when settings change
  useEffect(() => {
    if (settings) {
      pixelService.initPixels(settings);
    }
  }, [settings]);

  // Load Settings, Products & Categories on startup and listen for live updates
  useEffect(() => {
    fetchSettings();
    fetchProducts();
    fetchCategories();

    // Live update listeners
    const handleProductsUpdated = () => {
      fetchProducts();
    };

    const handleSettingsUpdated = () => {
      fetchSettings();
    };

    const handleCategoriesUpdated = () => {
      fetchCategories();
    };

    // Auto-refresh products when tab becomes active again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchProducts();
        fetchSettings();
        fetchCategories();
      }
    };

    window.addEventListener('maxora_products_updated', handleProductsUpdated);
    window.addEventListener('maxora_settings_updated', handleSettingsUpdated);
    window.addEventListener('maxora_categories_updated', handleCategoriesUpdated);
    window.addEventListener('storage', handleProductsUpdated);
    window.addEventListener('storage', handleCategoriesUpdated);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('maxora_products_updated', handleProductsUpdated);
      window.removeEventListener('maxora_settings_updated', handleSettingsUpdated);
      window.removeEventListener('maxora_categories_updated', handleCategoriesUpdated);
      window.removeEventListener('storage', handleProductsUpdated);
      window.removeEventListener('storage', handleCategoriesUpdated);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Re-fetch products when category, subcategory, product type, child category, search, or view changes
  useEffect(() => {
    fetchProducts();
  }, [
    searchQuery,
    selectedCategory,
    selectedSubCategory,
    selectedProductType,
    selectedChildCategory,
    isAdminView,
  ]);

  const fetchSettings = async () => {
    try {
      const data = await storeService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const [cats, subs, types, childs] = await Promise.all([
        storeService.getCategories(),
        storeService.getSubCategories(),
        storeService.getProductTypes(),
        storeService.getChildCategories(),
      ]);
      setCategories(cats);
      setSubCategories(subs);
      setProductTypes(types);
      setChildCategories(childs);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await storeService.getProducts(
        searchQuery,
        selectedCategory,
        selectedSubCategory,
        selectedProductType,
        selectedChildCategory
      );
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoadingProducts(false);
      setHasFetchedProducts(true);
    }
  };

  // Cart Management
  const handleAddToCart = (
    product: Product,
    quantity = 1,
    selectedColor?: { name: string; code?: string; image_url?: string }
  ) => {
    const finalPrice = Math.max(
      0,
      Number(product.selling_price || 0) - Number(product.discount || 0)
    );

    const colorName = selectedColor?.name;
    const colorCode = selectedColor?.code;
    const colorImage = selectedColor?.image_url;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.product_id === product.id && (item.selected_color || '') === (colorName || '')
      );

      if (existingIndex >= 0) {
        const existing = prevCart[existingIndex];
        const newQty = Math.min(
          Number(existing.stock || product.stock || 99),
          existing.quantity + quantity
        );
        const updatedCart = [...prevCart];
        updatedCart[existingIndex] = { ...existing, quantity: newQty };
        return updatedCart;
      } else {
        return [
          ...prevCart,
          {
            product_id: product.id,
            name: product.name,
            image_url: colorImage || product.image_url || (product.images?.[0] || ''),
            unit_price: finalPrice,
            quantity: Math.min(Number(product.stock || 99), quantity),
            stock: Number(product.stock || 0),
            sku: product.sku,
            selected_color: colorName,
            selected_color_code: colorCode,
          },
        ];
      }
    });

    // Fire Ad Pixels (Meta, Google, TikTok) AddToCart event
    pixelService.trackAddToCart(product, quantity);

    setRecentlyAddedId(product.id);
    setTimeout(() => setRecentlyAddedId(null), 1500);
  };

  const handleBuyNow = (
    product: Product,
    quantity = 1,
    selectedColor?: { name: string; code?: string; image_url?: string }
  ) => {
    handleAddToCart(product, quantity, selectedColor);
    setIsCartOpen(false);
    openCheckout();
  };

  const openCheckout = () => {
    const cartSubtotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    pixelService.trackInitiateCheckout(cart, cartSubtotal);
    setIsCheckoutOpen(true);
  };

  // Fetch reviews initially and listen to reviews update events
  const loadReviewsData = async () => {
    try {
      const data = await storeService.getReviews();
      setReviews(data);
    } catch (err) {
      console.warn('Error loading reviews in App:', err);
    }
  };

  useEffect(() => {
    loadReviewsData();
    const handler = () => {
      loadReviewsData();
    };
    window.addEventListener('maxora_reviews_updated', handler);
    return () => window.removeEventListener('maxora_reviews_updated', handler);
  }, []);

  const handleOpenProductDetail = (
    product: Product,
    updateHistory = true,
    initialTab: 'details' | 'reviews' = 'details'
  ) => {
    setQuickViewProduct(product);
    setQuickViewInitialTab(initialTab);
    if (updateHistory) {
      const slug = getProductSlug(product);
      const newPath = `/product/${slug}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({ slug, productId: product.id }, '', newPath);
      }
    }
    // Fire Ad Pixels ViewContent event for product page views
    pixelService.trackViewContent(product);
  };

  const handleCloseProductDetail = () => {
    setQuickViewProduct(null);
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/product/')) {
      if (selectedCategory && selectedSubCategory && activeCategoryObj && activeSubCategoryObj) {
        window.history.pushState({}, '', `/category/${activeCategoryObj.slug}/${activeSubCategoryObj.slug}`);
      } else if (selectedCategory && activeCategoryObj) {
        window.history.pushState({}, '', `/category/${activeCategoryObj.slug}`);
      } else {
        window.history.pushState({}, '', '/');
      }
    }
  };

  const handleUpdateQuantity = (productId: string, delta: number, selectedColor?: string) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          const matchColor = selectedColor === undefined || (item.selected_color || '') === (selectedColor || '');
          if (item.product_id === productId && matchColor) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: Math.min(item.stock, newQty) } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (productId: string, selectedColor?: string) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.product_id === productId && (selectedColor === undefined || (item.selected_color || '') === (selectedColor || '')))
      )
    );
  };

  const handleOrderSuccess = (orderData?: any) => {
    if (orderData) {
      // Fire Ad Pixels Purchase event with conversion values
      pixelService.trackPurchase(orderData);
    }
    setCart([]);
    fetchProducts();
  };

  const scrollToProducts = () => {
    productSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Reconcile categories and subcategories with existing product data
  const reconciledCategories = useMemo(
    () => reconcileCategories(categories, products),
    [categories, products]
  );
  const reconciledSubCategories = useMemo(
    () => reconcileSubCategories(subCategories, reconciledCategories, products),
    [subCategories, reconciledCategories, products]
  );

  // Dynamic 4-Tier Taxonomy Hierarchy Tree (Category -> Subcategory -> Product Type -> Child Category)
  const taxonomyTree = useMemo(() => {
    return buildTaxonomyTree(products, reconciledCategories, reconciledSubCategories, productTypes, childCategories);
  }, [products, reconciledCategories, reconciledSubCategories, productTypes, childCategories]);

  // Saved / Wishlisted products list
  const savedProducts = useMemo(() => {
    return products.filter((p) => wishlistIds.includes(p.id));
  }, [products, wishlistIds]);

  const activeCategoryObj = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'All' || selectedCategory === 'all') return null;
    const s = selectedCategory.toLowerCase();
    return reconciledCategories.find(
      (c) => c.slug?.toLowerCase() === s || c.name?.toLowerCase() === s || c.id === selectedCategory
    );
  }, [selectedCategory, reconciledCategories]);

  const activeSubCategoryObj = useMemo(() => {
    if (!selectedSubCategory || selectedSubCategory === 'All' || selectedSubCategory === 'all') return null;
    const s = selectedSubCategory.toLowerCase();
    return reconciledSubCategories.find(
      (sub) => sub.slug?.toLowerCase() === s || sub.name?.toLowerCase() === s || sub.id === selectedSubCategory
    );
  }, [selectedSubCategory, reconciledSubCategories]);

  // Max product price calculation for budget slider
  const maxStorePrice = useMemo(() => {
    let max = 10000;
    products.forEach((p) => {
      const price = Number(p.selling_price || 0);
      if (price > max) max = price;
    });
    return Math.max(10000, max);
  }, [products]);

  // Unified Taxonomy Selection Handler across Navbar and Catalog components
  const handleTaxonomySelect = (filter: {
    category?: string;
    subCategory?: string;
    productType?: string;
    childCategory?: string;
  }) => {
    setSelectedCategory(filter.category || '');
    setSelectedSubCategory(filter.subCategory || '');
    setSelectedProductType(filter.productType || '');
    setSelectedChildCategory(filter.childCategory || '');
    scrollToProducts();
  };

  const handleClearAllTaxonomy = () => {
    setSelectedCategory('');
    setSelectedSubCategory('');
    setSelectedProductType('');
    setSelectedChildCategory('');
  };

  // Price Filter Handlers
  const handlePriceRangeChange = (range: PriceRange) => {
    setPriceRange(range);
    setSelectedPricePreset('custom');
  };

  const handleSelectPricePreset = (presetId: string, range: PriceRange) => {
    setSelectedPricePreset(presetId);
    setPriceRange(range);
  };

  const handleResetPrice = () => {
    setSelectedPricePreset('all');
    setPriceRange({ min: 0, max: 50000 });
  };

  // Filter products by search, 4-tier taxonomy, and budget price range
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 0. Wishlist filter if user selected "Saved Items" section view
      if (showSavedOnly && !wishlistIds.includes(p.id)) {
        return false;
      }

      // 1. Search filter
      const search = searchQuery.toLowerCase().trim();
      if (search) {
        const matchSearch =
          p.name.toLowerCase().includes(search) ||
          (p.description && p.description.toLowerCase().includes(search)) ||
          (p.sku && p.sku.toLowerCase().includes(search)) ||
          (p.category && p.category.toLowerCase().includes(search)) ||
          (p.sub_category && p.sub_category.toLowerCase().includes(search)) ||
          (p.product_type && p.product_type.toLowerCase().includes(search)) ||
          (p.child_category && p.child_category.toLowerCase().includes(search));
        if (!matchSearch) return false;
      }

      // 2. Category matching
      if (selectedCategory && selectedCategory !== 'All' && selectedCategory !== 'all') {
        if (activeCategoryObj) {
          if (!isProductInCategory(p, activeCategoryObj)) return false;
        } else if (!matchesTaxonomyField(p.category, selectedCategory)) {
          return false;
        }
      }

      // 3. Subcategory matching
      if (selectedSubCategory && selectedSubCategory !== 'All' && selectedSubCategory !== 'all') {
        if (activeSubCategoryObj) {
          if (!isProductInSubCategory(p, activeSubCategoryObj)) return false;
        } else if (!matchesTaxonomyField(p.sub_category, selectedSubCategory)) {
          return false;
        }
      }

      // 4. Product Type matching
      if (selectedProductType && selectedProductType !== 'All' && selectedProductType !== 'all') {
        if (!matchesTaxonomyField(p.product_type, selectedProductType)) {
          return false;
        }
      }

      // 5. Child Category matching
      if (selectedChildCategory && selectedChildCategory !== 'All' && selectedChildCategory !== 'all') {
        if (!matchesTaxonomyField(p.child_category, selectedChildCategory)) {
          return false;
        }
      }

      // 6. Price Range Filter
      const discount = Number(p.discount || 0);
      const price = Number(p.selling_price || 0);
      const finalPrice = Math.max(0, price - discount);

      if (finalPrice < priceRange.min) return false;
      if (priceRange.max < 50000 && finalPrice > priceRange.max) return false;

      return true;
    });
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedSubCategory,
    selectedProductType,
    selectedChildCategory,
    activeCategoryObj,
    activeSubCategoryObj,
    priceRange,
    showSavedOnly,
    wishlistIds,
  ]);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (isAdminView) {
    return (
      <AdminDashboard
        onBackToStore={() => {
          setIsAdminView(false);
          window.history.pushState({}, '', '/');
          fetchProducts();
          fetchSettings();
        }}
        globalSettings={settings}
        onSettingsUpdated={() => {
          fetchSettings();
          fetchProducts();
          fetchCategories();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col selection:bg-zinc-900 selection:text-white pb-20 sm:pb-0">
      {/* Dynamic SEO & Google SERP JSON-LD schema injection */}
      <SEOHead settings={settings} activeProduct={quickViewProduct} />

      {/* Sticky Top Navbar with 4-Tier Hierarchy Menu */}
      <Navbar
        settings={settings}
        cartCount={totalCartCount}
        wishlistCount={wishlistIds.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenTracker={() => setIsTrackerOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={reconciledCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={(slug) => {
          handleTaxonomySelect({ category: slug, subCategory: '', productType: '', childCategory: '' });
        }}
        taxonomy={taxonomyTree}
        currentTaxonomyFilter={{
          category: selectedCategory,
          subCategory: selectedSubCategory,
          productType: selectedProductType,
          childCategory: selectedChildCategory,
        }}
        onSelectTaxonomy={handleTaxonomySelect}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex-1">
        {/* Hero Section */}
        {!searchQuery && (
          <Hero
            settings={settings}
            products={products}
            onExploreClick={scrollToProducts}
            onOpenProduct={handleOpenProductDetail}
            onAddToCart={(p) => handleAddToCart(p, 1)}
          />
        )}

        {/* Product Grid Section */}
        <section ref={productSectionRef} className="my-8 scroll-mt-24" id="products-catalog-section">
          {/* Budget & Price Range Filter */}
          <PriceFilter
            priceRange={priceRange}
            maxProductPrice={maxStorePrice}
            onPriceRangeChange={handlePriceRangeChange}
            selectedPreset={selectedPricePreset}
            onSelectPreset={handleSelectPricePreset}
            onResetPrice={handleResetPrice}
          />

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setShowSavedOnly(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    !showSavedOnly
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  }`}
                >
                  All Products ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setShowSavedOnly(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    showSavedOnly
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60'
                  }`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      showSavedOnly ? 'fill-white text-white' : 'fill-rose-500 text-rose-500'
                    }`}
                  />
                  <span>Saved Items ({wishlistIds.length})</span>
                </button>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight flex items-center flex-wrap gap-2">
                {showSavedOnly ? (
                  <span className="flex items-center gap-2 text-rose-600">
                    <Heart className="w-6 h-6 fill-rose-500 text-rose-500 inline" />
                    Saved Items / Wishlist
                  </span>
                ) : activeCategoryObj ? (
                  <>
                    <span>{activeCategoryObj.name}</span>
                    {activeSubCategoryObj && (
                      <>
                        <span className="text-zinc-400 font-light">/</span>
                        <span className="text-emerald-600">{activeSubCategoryObj.name}</span>
                      </>
                    )}
                    {selectedProductType && (
                      <>
                        <span className="text-zinc-400 font-light">/</span>
                        <span className="text-zinc-700">{selectedProductType}</span>
                      </>
                    )}
                    {selectedChildCategory && (
                      <>
                        <span className="text-zinc-400 font-light">/</span>
                        <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg text-lg sm:text-xl font-black">
                          {selectedChildCategory}
                        </span>
                      </>
                    )}
                  </>
                ) : selectedCategory ? (
                  `${selectedCategory}`
                ) : searchQuery ? (
                  `Search Results for "${searchQuery}"`
                ) : (
                  "Featured Collections"
                )}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium">
                {showSavedOnly
                  ? `Showing ${filteredProducts.length} saved item${filteredProducts.length === 1 ? '' : 's'}`
                  : `Showing ${filteredProducts.length} ${filteredProducts.length === 1 ? 'product' : 'products'} matching your criteria`}
              </p>
            </div>

            {/* Active Filters Badges & Clear Controls */}
            {(selectedCategory || selectedSubCategory || selectedProductType || selectedChildCategory || selectedPricePreset !== 'all' || priceRange.min > 0 || priceRange.max < 50000) && (
              <div className="flex items-center flex-wrap gap-2">
                {selectedChildCategory && (
                  <button
                    onClick={() => setSelectedChildCategory('')}
                    className="text-xs font-bold text-emerald-950 bg-emerald-200/90 hover:bg-emerald-300 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    Child Category: {selectedChildCategory} ✕
                  </button>
                )}
                {selectedProductType && (
                  <button
                    onClick={() => {
                      setSelectedProductType('');
                      setSelectedChildCategory('');
                    }}
                    className="text-xs font-bold text-zinc-800 bg-zinc-200 hover:bg-zinc-300 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    Type: {selectedProductType} ✕
                  </button>
                )}
                {selectedSubCategory && (
                  <button
                    onClick={() => {
                      setSelectedSubCategory('');
                      setSelectedProductType('');
                      setSelectedChildCategory('');
                    }}
                    className="text-xs font-bold text-zinc-700 hover:text-zinc-900 bg-zinc-200/80 hover:bg-zinc-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    Subcategory: {activeSubCategoryObj?.name || selectedSubCategory} ✕
                  </button>
                )}
                {selectedCategory && (
                  <button
                    onClick={handleClearAllTaxonomy}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    Category: {activeCategoryObj?.name || selectedCategory} ✕
                  </button>
                )}
                {(selectedPricePreset !== 'all' || priceRange.min > 0 || priceRange.max < 50000) && (
                  <button
                    onClick={handleResetPrice}
                    className="text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    Budget: {priceRange.min} - {priceRange.max >= 50000 ? 'Any' : `${priceRange.max} TK`} ✕
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Products List Grid */}
          {loadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-3 animate-pulse">
                  <div className="aspect-square bg-zinc-200 rounded-xl" />
                  <div className="h-4 bg-zinc-200 rounded w-3/4" />
                  <div className="h-4 bg-zinc-200 rounded w-1/2" />
                  <div className="h-9 bg-zinc-200 rounded-xl mt-4" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  ratingStats={ratingStatsMap[product.id]}
                  isWishlisted={wishlistIds.includes(product.id)}
                  onToggleWishlist={handleToggleWishlist}
                  onAddToCart={(p) => handleAddToCart(p, 1)}
                  onQuickView={(p, initialTab) => handleOpenProductDetail(p, true, initialTab || 'details')}
                  isAdded={recentlyAddedId === product.id}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center max-w-lg mx-auto shadow-xs">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                showSavedOnly ? 'bg-rose-50 text-rose-500' : 'bg-zinc-100 text-zinc-400'
              }`}>
                {showSavedOnly ? <Heart className="w-8 h-8 fill-rose-500" /> : <ShoppingBag className="w-8 h-8" />}
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-1">
                {showSavedOnly ? 'Your Wishlist is Empty' : 'No Products Found'}
              </h3>
              <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                {showSavedOnly
                  ? "You haven't saved any items yet. Tap the heart icon on any product in the store to save it here!"
                  : "We couldn't find any products matching your search or category criteria."}
              </p>
              <button
                onClick={() => {
                  if (showSavedOnly) {
                    setShowSavedOnly(false);
                  } else {
                    setSearchQuery('');
                    setSelectedCategory('');
                  }
                }}
                className="px-6 py-2.5 rounded-full bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
              >
                {showSavedOnly ? 'Browse All Products' : 'Reset Search & Filters'}
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Trust & Guarantee Banner */}
      <section className="bg-white border-t border-zinc-200 py-12 px-4 sm:px-6 my-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-900 shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-zinc-900">Cash on Delivery</h4>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Inspect and pay after receiving your parcel at your doorstep anywhere in Bangladesh.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-900 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-zinc-900">Quality Checked</h4>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Every single gadget is tested before packing to ensure zero defects.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-900 shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-zinc-900">Dedicated BD Support</h4>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Our support team is active 7 days a week to help with your orders and inquiries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 text-white pt-14 pb-8 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-zinc-800">
          {/* Col 1 */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white text-zinc-950 font-black text-lg flex items-center justify-center">
                M
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                {settings.store_name || "Maxora"}
                <span className="text-emerald-500">.</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed">
              {settings.footer_text ||
                "Maxora is Bangladesh's trusted destination for premium lifestyle gadgets and accessories. Cash on delivery available across all 64 districts."}
            </p>
            <div className="pt-2 flex items-center gap-3">
              <span className="inline-block px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800 text-[11px] font-semibold text-emerald-400">
                🇧🇩 64 Districts Delivery
              </span>
              <span className="inline-block px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800 text-[11px] font-semibold text-zinc-300">
                💵 100% Cash on Delivery
              </span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-zinc-400 font-medium">
              <li>
                <button
                  onClick={scrollToProducts}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  All Products
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsTrackerOpen(true)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Track Your Order
                </button>
              </li>
              {settings.phone && (
                <li>
                  <a
                    href={`tel:${settings.phone}`}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Customer Support
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Customer Hotline
            </h4>
            <div className="space-y-2 text-xs text-zinc-400 font-medium">
              {settings.phone && (
                <a
                  href={`tel:${settings.phone}`}
                  className="flex items-center gap-2 text-white font-bold hover:text-emerald-400 transition-colors"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>{settings.phone}</span>
                </a>
              )}
              <div className="flex items-center gap-2 text-zinc-400">
                <MapPin className="w-4 h-4 text-zinc-500" />
                <span>Dhaka, Bangladesh</span>
              </div>
              <div className="text-[11px] text-zinc-500 pt-1">
                Support Hours: 10:00 AM - 10:00 PM (Daily)
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <div>
            <span>{settings.footer_text || "© Maxora Bangladesh. All rights reserved."}</span>
          </div>
          <div className="flex items-center flex-wrap gap-3 sm:gap-4">
            <button onClick={() => setIsTrackerOpen(true)} className="hover:text-zinc-300 transition-colors cursor-pointer">Track Your Order</button>
            <span>•</span>
            <button onClick={scrollToProducts} className="hover:text-zinc-300 transition-colors cursor-pointer">Shop Collections</button>
            <span>•</span>
            <span className="text-zinc-400">Cash on Delivery</span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation & Floating Checkout */}
      <MobileBottomNav
        settings={settings}
        cart={cart}
        wishlistCount={wishlistIds.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        onOpenTracker={() => setIsTrackerOpen(true)}
        onHomeClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSearchClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          const searchBtn = document.querySelector('button[aria-label="Search"]') as HTMLButtonElement;
          if (searchBtn) searchBtn.click();
        }}
      />

      {/* Drawers & Modals */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        settings={settings}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        settings={settings}
        onOrderSuccess={handleOrderSuccess}
      />

      <ProductQuickView
        product={quickViewProduct}
        initialTab={quickViewInitialTab}
        onClose={handleCloseProductDetail}
        onAddToCart={(p, qty, col) => handleAddToCart(p, qty, col)}
        onBuyNow={(p, qty, col) => handleBuyNow(p, qty, col)}
        onReviewSubmitted={loadReviewsData}
        isWishlisted={quickViewProduct ? wishlistIds.includes(quickViewProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* Saved Items / Wishlist Slide-Over Drawer */}
      <SavedItemsDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        savedProducts={savedProducts}
        onAddToCart={(p) => handleAddToCart(p, 1)}
        onRemoveFromWishlist={(id) => {
          const { ids } = toggleWishlistProduct(id);
          setWishlistIds(ids);
        }}
        onClearWishlist={() => {
          clearStoredWishlist();
          setWishlistIds([]);
        }}
        onQuickView={(p) => handleOpenProductDetail(p)}
        onAddAllToCart={() => {
          savedProducts
            .filter((p) => Number(p.stock || 0) > 0)
            .forEach((p) => handleAddToCart(p, 1));
        }}
        ratingStatsMap={ratingStatsMap}
      />

      {/* Product Not Found Modal for Invalid Product URLs */}
      {isProductNotFound && (
        <div
          onClick={() => {
            setIsProductNotFound(false);
            if (window.location.pathname.startsWith('/product/')) {
              window.history.pushState({}, '', '/');
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 text-center shadow-2xl border border-zinc-200 animate-scale-up"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 mb-2">
              Product Not Found
            </h2>
            <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
              The product you are looking for is unavailable, may have been removed, or the link is incorrect.
            </p>
            <button
              onClick={() => {
                setIsProductNotFound(false);
                if (window.location.pathname.startsWith('/product/')) {
                  window.history.pushState({}, '', '/');
                }
              }}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-zinc-950 hover:bg-zinc-800 text-white transition-colors cursor-pointer shadow-md"
            >
              Browse All Products
            </button>
          </div>
        </div>
      )}

      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
      />

      {/* Floating WhatsApp / Live Chat Support Button */}
      <FloatingSupportButton settings={settings} />
    </div>
  );
}
