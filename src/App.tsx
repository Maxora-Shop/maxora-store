import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PriceRange } from './components/PriceFilter';
import { FloatingSupportButton } from './components/FloatingSupportButton';
import { ProductCard } from './components/ProductCard';
import { ProductDetailsPage } from './components/ProductDetailsPage';
import { ProductDetailsSkeleton } from './components/ProductDetailsSkeleton';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SEOHead } from './components/SEOHead';
import { AdminDashboard } from './components/AdminDashboard';
import { CustomerAccountModal } from './components/CustomerAccountModal';
import { InvoiceModal } from './components/InvoiceModal';
import { BrandSidebarFilter } from './components/BrandSidebarFilter';
import { ProductFilterSidebar } from './components/ProductFilterSidebar';
import { CategoryFilter } from './components/CategoryFilter';
import { ShopByCategorySection } from './components/ShopByCategorySection';
import { PromoTripleSection } from './components/PromoTripleSection';
import { BestSellersSection } from './components/BestSellersSection';
import { TrustBenefitsSection } from './components/TrustBenefitsSection';
import { FooterSection } from './components/FooterSection';
import { ProductPagination } from './components/ProductPagination';
import { ProductSortDropdown } from './components/ProductSortDropdown';
import { Product, CartItem, StoreSettings, Category, SubCategory, ProductType, ChildCategory, Review, Customer, Order, Brand, ProductSortOption } from './types';
import { storeService, initRealtimeFirestoreListeners } from './services/storeService';
import { pixelService } from './services/pixelService';
import {
  INITIAL_SETTINGS,
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_SUBCATEGORIES,
  INITIAL_PRODUCT_TYPES,
  INITIAL_CHILD_CATEGORIES,
} from './data/initialData';
import { Truck, ShieldCheck, Phone, MapPin, ShoppingBag, AlertCircle, Heart, ChevronRight, Home, Tag, PackageCheck, Star, Filter } from 'lucide-react';
import { getProductSlug, findProductBySlugOrId, generateSlug } from './utils/seo';
import { getStoredWishlist, toggleWishlistProduct, clearStoredWishlist } from './utils/wishlist';
import { SavedItemsDrawer } from './components/SavedItemsDrawer';
import { useTaxonomy } from './context/TaxonomyContext';
import {
  isProductInCategory,
  isProductInSubCategory,
  isProductInProductType,
  isProductInChildCategory,
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
      const hostname = window.location.hostname.toLowerCase();
      const path = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;
      return (
        hostname.includes('admin') ||
        path.startsWith('/admin') ||
        hash === '#admin' ||
        search.includes('admin=true')
      );
    }
    return false;
  });

  // Settings State
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);

  // Products State
  const [products, setProducts] = useState<Product[]>(() => {
    const cached = typeof window !== 'undefined' ? storeService.getCachedProducts() : null;
    return cached && cached.length > 0 ? cached : INITIAL_PRODUCTS;
  });

  // Unified 4-Tier Taxonomy Hierarchy from TaxonomyContext
  const {
    categories,
    subCategories,
    productTypes,
    childCategories,
    reconciledCategories,
    reconciledSubCategories,
    reconciledProductTypes,
    reconciledChildCategories,
    taxonomyTree,
    categoryProductCountMap,
    refreshTaxonomy,
    updateProductsState,
  } = useTaxonomy();

  // Sync products into TaxonomyContext whenever products state updates
  useEffect(() => {
    updateProductsState(products);
  }, [products, updateProductsState]);

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [hasFetchedProducts, setHasFetchedProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [selectedChildCategory, setSelectedChildCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');

  // Price Filter State
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 50000 });
  const [selectedPricePreset, setSelectedPricePreset] = useState<string>('all');

  // Availability Filter State ('all' | 'in_stock' | 'out_of_stock')
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

  // Rating Filter State (0 for all, 4 for 4+ stars, 3 for 3+ stars, etc.)
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);

  // Mobile Filter Drawer State
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Sort State ('newest' | 'best_selling' | 'price_asc' | 'price_desc')
  const [sortBy, setSortBy] = useState<ProductSortOption>('newest');
  const [ordersVersion, setOrdersVersion] = useState<number>(0);

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
  const [isCustomerAccountOpen, setIsCustomerAccountOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(() => storeService.getCurrentCustomer());
  const [customerInvoiceOrder, setCustomerInvoiceOrder] = useState<Order | null>(null);

  // Sync customer authentication across events
  useEffect(() => {
    const handleCustomerSync = () => {
      setCurrentCustomer(storeService.getCurrentCustomer());
    };
    window.addEventListener('maxora_customer_auth_changed', handleCustomerSync);
    return () => window.removeEventListener('maxora_customer_auth_changed', handleCustomerSync);
  }, []);

  // Listen for /admin, #admin, or Ctrl+Shift+A for discreet store owner admin access
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;
      if (path.startsWith('/admin') || hash === '#admin' || search.includes('admin=true')) {
        setIsAdminView(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsAdminView((prev) => {
          const next = !prev;
          if (next) {
            window.history.pushState({}, '', '/admin');
          } else {
            window.history.pushState({}, '', '/');
          }
          return next;
        });
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
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
  const productsRef = useRef<Product[]>(products);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  // Route listener: handles /admin, /product/:slug, browser back/forward, and direct URLs
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;

      // Admin check
      const hostname = window.location.hostname.toLowerCase();
      if (hostname.includes('admin') || path.startsWith('/admin') || hash === '#admin' || search.includes('admin=true')) {
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
        const rawSlug = path.replace('/product/', '').replace(/\/$/, '').trim();
        try {
          productSlug = decodeURIComponent(rawSlug);
        } catch {
          productSlug = rawSlug;
        }
      } else if (hash.startsWith('#product-')) {
        const rawSlug = hash.replace('#product-', '').trim();
        try {
          productSlug = decodeURIComponent(rawSlug);
        } catch {
          productSlug = rawSlug;
        }
        // Redirect legacy hash to clean URL
        if (productSlug) {
          window.history.replaceState({}, '', `/product/${productSlug}`);
        }
      }

      if (productSlug) {
        const currentProducts = productsRef.current;
        const found = findProductBySlugOrId(currentProducts, productSlug);
        if (found) {
          setQuickViewProduct(found);
          setIsProductNotFound(false);
          pixelService.trackViewContent(found);
          pendingSlugRef.current = null;
        } else {
          // Keep slug pending until products finish loading
          pendingSlugRef.current = productSlug;
        }
      } else {
        // Only clear quick view if user navigated via browser back/forward button to a non-product URL
        setQuickViewProduct(null);
        setIsProductNotFound(false);
        pendingSlugRef.current = null;

        // Category & Subcategory check: /products?..., /category/:slug, /type/:slug, /child/:slug
        if (search) {
          const searchParams = new URLSearchParams(search);
          const cat = searchParams.get('category') || '';
          const sub = searchParams.get('subcategory') || searchParams.get('subCategory') || '';
          const type = searchParams.get('productType') || searchParams.get('product_type') || searchParams.get('type') || '';
          const child = searchParams.get('childCategory') || searchParams.get('child_category') || searchParams.get('child') || '';
          const brand = searchParams.get('brand') || '';

          setSelectedCategory(cat);
          setSelectedSubCategory(sub);
          setSelectedProductType(type);
          setSelectedChildCategory(child);
          setSelectedBrand(brand);

          if (cat || sub || type || child || brand || path.startsWith('/products')) {
            setTimeout(() => {
              productSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 80);
          }
        } else if (path.startsWith('/category/')) {
          const match = path.match(/^\/category\/([^/?#]+)(?:\/([^/?#]+))?/);
          if (match) {
            const rawCat = decodeURIComponent(match[1]);
            const rawSub = match[2] ? decodeURIComponent(match[2]) : '';
            setSelectedCategory(rawCat);
            setSelectedSubCategory(rawSub);
            setSelectedProductType('');
            setSelectedChildCategory('');
            setTimeout(() => {
              productSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 80);
          }
        } else if (path.startsWith('/type/')) {
          const rawType = decodeURIComponent(path.replace('/type/', '').replace(/\/$/, '').trim());
          setSelectedProductType(rawType);
          setSelectedChildCategory('');
          setTimeout(() => {
            productSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 80);
        } else if (path.startsWith('/child/')) {
          const rawChild = decodeURIComponent(path.replace('/child/', '').replace(/\/$/, '').trim());
          setSelectedChildCategory(rawChild);
          setTimeout(() => {
            productSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 80);
        } else if (path === '/' && !hash && !search) {
          setSelectedCategory('');
          setSelectedSubCategory('');
          setSelectedProductType('');
          setSelectedChildCategory('');
          setSelectedBrand('');
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
  }, []);

  // Resolve any pending product slug whenever products array or fetch status changes
  useEffect(() => {
    const currentSlug = pendingSlugRef.current;
    if (currentSlug && products.length > 0) {
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

  // Keep currently viewed product details in sync in real time if changed from admin
  useEffect(() => {
    if (quickViewProduct && products.length > 0) {
      const refreshed = findProductBySlugOrId(products, quickViewProduct.slug || quickViewProduct.id);
      if (refreshed && (
        refreshed.name !== quickViewProduct.name ||
        refreshed.selling_price !== quickViewProduct.selling_price ||
        refreshed.discount !== quickViewProduct.discount ||
        refreshed.description !== quickViewProduct.description ||
        refreshed.image_url !== quickViewProduct.image_url ||
        refreshed.updated_at !== quickViewProduct.updated_at ||
        JSON.stringify(refreshed.images) !== JSON.stringify(quickViewProduct.images)
      )) {
        setQuickViewProduct(refreshed);
      }
    }
  }, [products]);

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
    // Start global real-time cloud sync listeners
    initRealtimeFirestoreListeners();

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

    // Auto-refresh products and settings when tab becomes active again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchProducts();
        fetchSettings();
        fetchCategories();
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (!e.key || e.key.includes('product')) {
        fetchProducts();
      }
      if (!e.key || e.key.includes('setting')) {
        fetchSettings();
      }
      if (!e.key || e.key.includes('categor') || e.key.includes('brand')) {
        fetchCategories();
      }
    };

    const handleOrdersUpdated = () => {
      setOrdersVersion((v) => v + 1);
    };

    window.addEventListener('maxora_products_updated', handleProductsUpdated);
    window.addEventListener('maxora_orders_updated', handleOrdersUpdated);
    window.addEventListener('maxora_settings_updated', handleSettingsUpdated);
    window.addEventListener('maxora_categories_updated', handleCategoriesUpdated);
    window.addEventListener('maxora_subcategories_updated', handleCategoriesUpdated);
    window.addEventListener('maxora_product_types_updated', handleCategoriesUpdated);
    window.addEventListener('maxora_child_categories_updated', handleCategoriesUpdated);
    window.addEventListener('maxora_brands_updated', handleCategoriesUpdated);
    window.addEventListener('storage', handleStorageEvent);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('maxora_products_updated', handleProductsUpdated);
      window.removeEventListener('maxora_orders_updated', handleOrdersUpdated);
      window.removeEventListener('maxora_settings_updated', handleSettingsUpdated);
      window.removeEventListener('maxora_categories_updated', handleCategoriesUpdated);
      window.removeEventListener('maxora_subcategories_updated', handleCategoriesUpdated);
      window.removeEventListener('maxora_product_types_updated', handleCategoriesUpdated);
      window.removeEventListener('maxora_child_categories_updated', handleCategoriesUpdated);
      window.removeEventListener('maxora_brands_updated', handleCategoriesUpdated);
      window.removeEventListener('storage', handleStorageEvent);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Fetch products, settings, and categories on initial mount or when returning from admin
  useEffect(() => {
    fetchProducts();
    fetchSettings();
    fetchCategories();
  }, [isAdminView]);

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
      await refreshTaxonomy();
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      // Always retrieve all active products from store so the entire inventory is available
      // for instant category/subcategory/type/child-category filtering, mega menu preview, and direct slug lookups
      const data = await storeService.getProducts();
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
    setIsProductNotFound(false);
    setQuickViewInitialTab(initialTab);
    if (updateHistory) {
      const slug = getProductSlug(product);
      const newPath = `/product/${slug}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({ slug, productId: product.id }, '', newPath);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Fire Ad Pixels ViewContent event for product page views
    pixelService.trackViewContent(product);
  };

  const handleCloseProductDetail = () => {
    setQuickViewProduct(null);
    setIsProductNotFound(false);
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/product/')) {
      if (selectedCategory && selectedSubCategory && activeCategoryObj && activeSubCategoryObj) {
        window.history.pushState({}, '', `/category/${activeCategoryObj.slug}/${activeSubCategoryObj.slug}`);
      } else if (selectedCategory && activeCategoryObj) {
        window.history.pushState({}, '', `/category/${activeCategoryObj.slug}`);
      } else if (selectedCategory) {
        window.history.pushState({}, '', `/products?category=${encodeURIComponent(selectedCategory)}`);
      } else {
        window.history.pushState({}, '', '/');
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Saved / Wishlisted products list
  const savedProducts = useMemo(() => {
    return products.filter((p) => wishlistIds.includes(p.id));
  }, [products, wishlistIds]);

  const activeCategoryObj = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'All' || selectedCategory === 'all') return null;
    const s = selectedCategory.toLowerCase().trim();
    return reconciledCategories.find(
      (c) => c.slug?.toLowerCase() === s || c.name?.toLowerCase().trim() === s || c.id === selectedCategory || matchesTaxonomyField(c.slug, selectedCategory) || matchesTaxonomyField(c.name, selectedCategory)
    );
  }, [selectedCategory, reconciledCategories]);

  const activeSubCategoryObj = useMemo(() => {
    if (!selectedSubCategory || selectedSubCategory === 'All' || selectedSubCategory === 'all') return null;
    const s = selectedSubCategory.toLowerCase().trim();
    return reconciledSubCategories.find(
      (sub) => sub.slug?.toLowerCase() === s || sub.name?.toLowerCase().trim() === s || sub.id === selectedSubCategory || matchesTaxonomyField(sub.slug, selectedSubCategory) || matchesTaxonomyField(sub.name, selectedSubCategory)
    );
  }, [selectedSubCategory, reconciledSubCategories]);

  const activeProductTypeObj = useMemo(() => {
    if (!selectedProductType || selectedProductType === 'All' || selectedProductType === 'all') return null;
    const s = selectedProductType.toLowerCase().trim();
    return reconciledProductTypes.find(
      (t) => t.slug?.toLowerCase() === s || t.name?.toLowerCase().trim() === s || t.id === selectedProductType || matchesTaxonomyField(t.slug, selectedProductType) || matchesTaxonomyField(t.name, selectedProductType)
    );
  }, [selectedProductType, reconciledProductTypes]);

  const activeChildCategoryObj = useMemo(() => {
    if (!selectedChildCategory || selectedChildCategory === 'All' || selectedChildCategory === 'all') return null;
    const s = selectedChildCategory.toLowerCase().trim();
    return reconciledChildCategories.find(
      (c) => c.slug?.toLowerCase() === s || c.name?.toLowerCase().trim() === s || c.id === selectedChildCategory || matchesTaxonomyField(c.slug, selectedChildCategory) || matchesTaxonomyField(c.name, selectedChildCategory)
    );
  }, [selectedChildCategory, reconciledChildCategories]);

  // Formatted display names with fallback title casing
  const displayCategoryName = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'All' || selectedCategory === 'all') return '';
    if (activeCategoryObj?.name) return activeCategoryObj.name;
    return selectedCategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }, [selectedCategory, activeCategoryObj]);

  const displaySubCategoryName = useMemo(() => {
    if (!selectedSubCategory || selectedSubCategory === 'All' || selectedSubCategory === 'all') return '';
    if (activeSubCategoryObj?.name) return activeSubCategoryObj.name;
    return selectedSubCategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }, [selectedSubCategory, activeSubCategoryObj]);

  const displayProductTypeName = useMemo(() => {
    if (!selectedProductType || selectedProductType === 'All' || selectedProductType === 'all') return '';
    if (activeProductTypeObj?.name) return activeProductTypeObj.name;
    return selectedProductType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }, [selectedProductType, activeProductTypeObj]);

  const displayChildCategoryName = useMemo(() => {
    if (!selectedChildCategory || selectedChildCategory === 'All' || selectedChildCategory === 'all') return '';
    if (activeChildCategoryObj?.name) return activeChildCategoryObj.name;
    return selectedChildCategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }, [selectedChildCategory, activeChildCategoryObj]);

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
  const handleTaxonomySelect = (filter: Partial<TaxonomyFilterState>) => {
    const cat = filter.category || '';
    const sub = filter.subCategory || '';
    const type = filter.productType || '';
    const child = filter.childCategory || '';

    setSelectedCategory(cat);
    setSelectedSubCategory(sub);
    setSelectedProductType(type);
    setSelectedChildCategory(child);
    setSearchQuery('');
    setQuickViewProduct(null);
    setIsProductNotFound(false);

    // Update browser URL query parameters cleanly
    const params = new URLSearchParams();
    if (cat) params.set('category', cat);
    if (sub) params.set('subcategory', sub);
    if (type) params.set('productType', type);
    if (child) params.set('childCategory', child);

    const qs = params.toString();
    const newPath = qs ? `/products?${qs}` : '/';

    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', newPath);
    }

    setTimeout(() => {
      productSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  const updateTaxonomyFilter = (updates: Partial<TaxonomyFilterState>) => {
    const newCat = updates.category !== undefined ? updates.category : selectedCategory;
    const newSub = updates.subCategory !== undefined ? updates.subCategory : selectedSubCategory;
    const newType = updates.productType !== undefined ? updates.productType : selectedProductType;
    const newChild = updates.childCategory !== undefined ? updates.childCategory : selectedChildCategory;

    setSelectedCategory(newCat);
    setSelectedSubCategory(newSub);
    setSelectedProductType(newType);
    setSelectedChildCategory(newChild);

    const params = new URLSearchParams();
    if (newCat) params.set('category', newCat);
    if (newSub) params.set('subcategory', newSub);
    if (newType) params.set('productType', newType);
    if (newChild) params.set('childCategory', newChild);

    const qs = params.toString();
    const newPath = qs ? `/products?${qs}` : '/';

    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', newPath);
    }
  };

  const handleClearAllTaxonomy = () => {
    setSelectedCategory('');
    setSelectedSubCategory('');
    setSelectedProductType('');
    setSelectedChildCategory('');
    setSelectedBrand('');
    setSearchQuery('');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
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

  const handleResetAllFilters = () => {
    setSelectedBrand('');
    handleResetPrice();
    setAvailabilityFilter('all');
    setMinRatingFilter(0);
  };

  // Source products for sidebar filter counts (scoped to category/search if active)
  const sidebarSourceProducts = useMemo(() => {
    if (!selectedCategory && !selectedSubCategory && !selectedProductType && !selectedChildCategory && !searchQuery.trim() && !showSavedOnly) {
      return products;
    }
    return products.filter((p) => {
      if (showSavedOnly && !wishlistIds.includes(p.id)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (selectedCategory && selectedCategory !== 'All' && selectedCategory !== 'all') {
        const matchCat =
          (p.category_id && p.category_id === selectedCategory) ||
          matchesTaxonomyField(p.category, selectedCategory) ||
          matchesTaxonomyField(p.category_slug, selectedCategory);
        if (!matchCat) return false;
      }
      if (selectedSubCategory && selectedSubCategory !== 'All' && selectedSubCategory !== 'all') {
        const matchSub =
          (p.sub_category_id && p.sub_category_id === selectedSubCategory) ||
          matchesTaxonomyField(p.sub_category, selectedSubCategory) ||
          matchesTaxonomyField(p.subcategory_slug, selectedSubCategory) ||
          matchesTaxonomyField(p.sub_category_slug, selectedSubCategory);
        if (!matchSub) return false;
      }
      if (selectedProductType && selectedProductType !== 'All' && selectedProductType !== 'all') {
        const matchType =
          (p.product_type_id && p.product_type_id === selectedProductType) ||
          matchesTaxonomyField(p.product_type, selectedProductType) ||
          matchesTaxonomyField(p.producttype_slug, selectedProductType) ||
          matchesTaxonomyField(p.product_type_slug, selectedProductType);
        if (!matchType) return false;
      }
      if (selectedChildCategory && selectedChildCategory !== 'All' && selectedChildCategory !== 'all') {
        const matchChild =
          (p.child_category_id && p.child_category_id === selectedChildCategory) ||
          matchesTaxonomyField(p.child_category, selectedChildCategory) ||
          matchesTaxonomyField(p.childcategory_slug, selectedChildCategory) ||
          matchesTaxonomyField(p.child_category_slug, selectedChildCategory);
        if (!matchChild) return false;
      }
      return true;
    });
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedSubCategory,
    selectedProductType,
    selectedChildCategory,
    showSavedOnly,
    wishlistIds,
  ]);

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
        } else {
          const matchCat =
            (p.category_id && p.category_id === selectedCategory) ||
            matchesTaxonomyField(p.category, selectedCategory) ||
            matchesTaxonomyField(p.category_slug, selectedCategory);
          if (!matchCat) return false;
        }
      }

      // 3. Subcategory matching
      if (selectedSubCategory && selectedSubCategory !== 'All' && selectedSubCategory !== 'all') {
        if (activeSubCategoryObj) {
          if (!isProductInSubCategory(p, activeSubCategoryObj)) return false;
        } else {
          const matchSub =
            (p.subcategory_id && p.subcategory_id === selectedSubCategory) ||
            matchesTaxonomyField(p.sub_category, selectedSubCategory) ||
            matchesTaxonomyField(p.subcategory_slug, selectedSubCategory);
          if (!matchSub) return false;
        }
      }

      // 4. Product Type matching
      if (selectedProductType && selectedProductType !== 'All' && selectedProductType !== 'all') {
        if (activeProductTypeObj) {
          if (!isProductInProductType(p, activeProductTypeObj)) return false;
        } else {
          const matchType =
            (p.product_type_id && p.product_type_id === selectedProductType) ||
            matchesTaxonomyField(p.product_type, selectedProductType) ||
            matchesTaxonomyField(p.product_type_slug, selectedProductType);
          if (!matchType) return false;
        }
      }

      // 5. Child Category matching
      if (selectedChildCategory && selectedChildCategory !== 'All' && selectedChildCategory !== 'all') {
        if (activeChildCategoryObj) {
          if (!isProductInChildCategory(p, activeChildCategoryObj)) return false;
        } else {
          const pChildId = p.childcategory_id || p.child_category_id;
          const matchChild =
            (pChildId && pChildId === selectedChildCategory) ||
            matchesTaxonomyField(p.child_category, selectedChildCategory) ||
            matchesTaxonomyField(p.childcategory_slug, selectedChildCategory) ||
            matchesTaxonomyField(p.child_category_slug, selectedChildCategory);
          if (!matchChild) return false;
        }
      }

      // 5b. Brand matching
      if (selectedBrand) {
        const brandMatch =
          (p.brand && p.brand.toLowerCase().trim() === selectedBrand.toLowerCase().trim()) ||
          (p.brand_slug && p.brand_slug.toLowerCase().trim() === selectedBrand.toLowerCase().trim());
        if (!brandMatch) return false;
      }

      // 6. Price Range Filter
      const discount = Number(p.discount || 0);
      const price = Number(p.selling_price || 0);
      const finalPrice = Math.max(0, price - discount);

      if (finalPrice < priceRange.min) return false;
      if (priceRange.max < 50000 && finalPrice > priceRange.max) return false;

      // 7. Availability Filter
      const stock = Number(p.stock || 0);
      if (availabilityFilter === 'in_stock' && stock <= 0) return false;
      if (availabilityFilter === 'out_of_stock' && stock > 0) return false;

      // 8. Rating Filter
      if (minRatingFilter > 0) {
        const stats = ratingStatsMap[p.id];
        const rating = stats && stats.count > 0 ? stats.average : (Number(p.rating) || 0);
        if (rating < minRatingFilter) return false;
      }

      return true;
    });
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedSubCategory,
    selectedProductType,
    selectedChildCategory,
    selectedBrand,
    activeCategoryObj,
    activeSubCategoryObj,
    activeProductTypeObj,
    activeChildCategoryObj,
    priceRange,
    availabilityFilter,
    minRatingFilter,
    ratingStatsMap,
    showSavedOnly,
    wishlistIds,
  ]);

  // Real sales count per product calculated from orders in storeService + product.sold_count
  const productSalesMap = useMemo<Record<string, number>>(() => {
    const salesMap: Record<string, number> = {};
    try {
      const orders = storeService.getCachedOrders();
      if (Array.isArray(orders)) {
        for (const order of orders) {
          if (order.status === 'Cancelled' || order.status === 'Returned') continue;
          if (Array.isArray(order.items)) {
            for (const item of order.items) {
              if (item.product_id) {
                const pid = String(item.product_id);
                salesMap[pid] = (salesMap[pid] || 0) + Number(item.quantity || 1);
              }
            }
          }
        }
      }
    } catch {
      // Graceful fallback
    }
    for (const p of products) {
      if (p.sold_count && Number(p.sold_count) > 0) {
        salesMap[p.id] = (salesMap[p.id] || 0) + Number(p.sold_count);
      }
    }
    return salesMap;
  }, [products, ordersVersion]);

  // Sorted products based on selected sort option before pagination
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (sortBy) {
      case 'price_asc':
        return list.sort((a, b) => {
          const priceA = Math.max(0, Number(a.selling_price || 0) - Number(a.discount || 0));
          const priceB = Math.max(0, Number(b.selling_price || 0) - Number(b.discount || 0));
          if (priceA !== priceB) return priceA - priceB;
          const timeA = a.created_at ? new Date(a.created_at).getTime() || 0 : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() || 0 : 0;
          return timeB - timeA;
        });
      case 'price_desc':
        return list.sort((a, b) => {
          const priceA = Math.max(0, Number(a.selling_price || 0) - Number(a.discount || 0));
          const priceB = Math.max(0, Number(b.selling_price || 0) - Number(b.discount || 0));
          if (priceB !== priceA) return priceB - priceA;
          const timeA = a.created_at ? new Date(a.created_at).getTime() || 0 : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() || 0 : 0;
          return timeB - timeA;
        });
      case 'best_selling':
        return list.sort((a, b) => {
          const salesA = productSalesMap[a.id] || 0;
          const salesB = productSalesMap[b.id] || 0;
          if (salesB !== salesA) return salesB - salesA;
          const bestA = (a.is_best_seller === true || a.is_best_seller === 1 || String(a.is_best_seller) === '1') ? 1 : 0;
          const bestB = (b.is_best_seller === true || b.is_best_seller === 1 || String(b.is_best_seller) === '1') ? 1 : 0;
          if (bestB !== bestA) return bestB - bestA;
          const timeA = a.created_at ? new Date(a.created_at).getTime() || 0 : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() || 0 : 0;
          return timeB - timeA;
        });
      case 'newest':
      default:
        return list.sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() || 0 : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() || 0 : 0;
          if (timeB !== timeA) return timeB - timeA;
          return String(b.id).localeCompare(String(a.id));
        });
    }
  }, [filteredProducts, sortBy, productSalesMap]);

  // Product Pagination State (Exactly 20 products per page by default)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PRODUCTS_PER_PAGE = 20;

  // Automatically reset to Page 1 whenever any filter, sort, or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedCategory,
    selectedSubCategory,
    selectedProductType,
    selectedChildCategory,
    selectedBrand,
    priceRange.min,
    priceRange.max,
    selectedPricePreset,
    availabilityFilter,
    minRatingFilter,
    showSavedOnly,
    sortBy,
  ]);

  const totalFilteredCount = sortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / PRODUCTS_PER_PAGE));

  // If page index exceeds totalPages after filtering or deleting products, clamp smoothly
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Paginated product slice for the active page
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return sortedProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [sortedProducts, currentPage, PRODUCTS_PER_PAGE]);

  // Page change handler with smooth scrolling to the catalog view
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    const catalogElement = document.getElementById('products-catalog-section');
    if (catalogElement) {
      const yOffset = -90;
      const y = catalogElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    } else if (productSectionRef.current) {
      productSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
        customer={currentCustomer}
        onOpenCustomerAccount={() => setIsCustomerAccountOpen(true)}
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
        products={products}
        onSelectProduct={handleOpenProductDetail}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 w-full min-h-[60vh]">
        {quickViewProduct ? (
          <ProductDetailsPage
            product={quickViewProduct}
            settings={settings}
            allProducts={products}
            onAddToCart={(p, qty, col) => handleAddToCart(p, qty, col)}
            onBuyNow={(p, qty, col) => handleBuyNow(p, qty, col)}
            isWishlisted={quickViewProduct ? wishlistIds.includes(quickViewProduct.id) : false}
            onToggleWishlist={handleToggleWishlist}
            ratingStats={quickViewProduct ? ratingStatsMap[quickViewProduct.id] : undefined}
            onBackToHome={handleCloseProductDetail}
            onSelectProduct={(p) => handleOpenProductDetail(p, true)}
            initialTab={quickViewInitialTab}
          />
        ) : pendingSlugRef.current ? (
          <ProductDetailsSkeleton />
        ) : isProductNotFound && typeof window !== 'undefined' && window.location.pathname.startsWith('/product/') ? (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-950">
              Product Not Found
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-medium">
              The product you are looking for is unavailable, may have been removed, or the link is incorrect.
            </p>
            <button
              type="button"
              onClick={handleCloseProductDetail}
              className="py-3.5 px-7 rounded-2xl font-bold text-xs sm:text-sm bg-zinc-950 hover:bg-zinc-800 text-white transition-colors cursor-pointer shadow-md active:scale-98"
            >
              Browse All Products
            </button>
          </div>
        ) : (
          <>
            {/* Homepage Sections - Only displayed on main home view without active taxonomy filters or search */}
            {!searchQuery && !selectedCategory && !selectedSubCategory && !selectedProductType && !selectedChildCategory && !showSavedOnly && (
              <>
                <Hero
                  settings={settings}
                  products={products}
                  onExploreClick={scrollToProducts}
                  onOpenProduct={handleOpenProductDetail}
                  onAddToCart={(p) => handleAddToCart(p, 1)}
                />

                {/* Shop by Category Section below Hero Banner */}
                <ShopByCategorySection
                  categories={reconciledCategories}
                  taxonomy={taxonomyTree}
                  products={products}
                  onSelectCategory={(slug, id) => {
                    handleTaxonomySelect({
                      category: slug,
                      subCategory: '',
                      productType: '',
                      childCategory: '',
                      categoryId: id,
                    });
                  }}
                  onSelectTaxonomy={handleTaxonomySelect}
                />

                {/* 3-Column Promo Section: Hot Deals | Flash Sale with countdown | New Arrivals */}
                <PromoTripleSection
                  products={products}
                  onAddToCart={(p) => handleAddToCart(p, 1)}
                  onBuyNow={(p) => handleBuyNow(p, 1)}
                  onQuickView={(p, tab) => handleOpenProductDetail(p, true, tab || 'details')}
                  onViewAllHotDeals={scrollToProducts}
                  onViewAllFlashSale={scrollToProducts}
                  onViewAllNewArrivals={scrollToProducts}
                  ratingStatsMap={ratingStatsMap}
                  recentlyAddedId={recentlyAddedId}
                />

                {/* Best Sellers Section (6 horizontal mini cards matching screenshot) */}
                <BestSellersSection
                  products={products}
                  onAddToCart={(p) => handleAddToCart(p, 1)}
                  onBuyNow={(p) => handleBuyNow(p, 1)}
                  onQuickView={(p, tab) => handleOpenProductDetail(p, true, tab || 'details')}
                  ratingStatsMap={ratingStatsMap}
                  wishlistIds={wishlistIds}
                  onToggleWishlist={handleToggleWishlist}
                  recentlyAddedId={recentlyAddedId}
                  onViewAll={scrollToProducts}
                />
              </>
            )}

            {/* Product Grid Section */}
            <section ref={productSectionRef} className="mt-6 sm:mt-8 mb-8 sm:mb-10 scroll-mt-24" id="products-catalog-section">
          {/* Breadcrumb Navigation matching: Home > Category > Subcategory > Product Type > Child Category */}
          {(selectedCategory || selectedSubCategory || selectedProductType || selectedChildCategory) && (
            <nav aria-label="Breadcrumb" className="mb-4 flex items-center flex-wrap gap-1.5 text-xs text-zinc-600 font-medium bg-zinc-50 px-3 py-2 rounded-xl border border-zinc-200/90 max-w-full overflow-hidden">
              <button
                type="button"
                onClick={handleClearAllTaxonomy}
                className="flex items-center gap-1.5 text-zinc-600 hover:text-emerald-700 font-semibold transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>

              {selectedCategory && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <button
                    type="button"
                    onClick={() => updateTaxonomyFilter({ subCategory: '', productType: '', childCategory: '' })}
                    className={`hover:text-emerald-700 transition-colors cursor-pointer truncate max-w-[160px] ${
                      !selectedSubCategory && !selectedProductType && !selectedChildCategory ? 'text-zinc-950 font-bold' : 'text-zinc-600'
                    }`}
                  >
                    {displayCategoryName}
                  </button>
                </>
              )}

              {selectedSubCategory && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <button
                    type="button"
                    onClick={() => updateTaxonomyFilter({ productType: '', childCategory: '' })}
                    className={`hover:text-emerald-700 transition-colors cursor-pointer truncate max-w-[160px] ${
                      !selectedProductType && !selectedChildCategory ? 'text-zinc-950 font-bold' : 'text-zinc-600'
                    }`}
                  >
                    {displaySubCategoryName}
                  </button>
                </>
              )}

              {selectedProductType && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <button
                    type="button"
                    onClick={() => updateTaxonomyFilter({ childCategory: '' })}
                    className={`hover:text-emerald-700 transition-colors cursor-pointer truncate max-w-[160px] ${
                      !selectedChildCategory ? 'text-zinc-950 font-bold' : 'text-zinc-600'
                    }`}
                  >
                    {displayProductTypeName}
                  </button>
                </>
              )}

              {selectedChildCategory && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="text-emerald-800 font-bold bg-emerald-100/90 px-2 py-0.5 rounded-md truncate max-w-[180px]">
                    {displayChildCategoryName}
                  </span>
                </>
              )}
            </nav>
          )}

          <div className="mb-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight flex items-center flex-wrap gap-2">
                  {showSavedOnly ? (
                    <span className="flex items-center gap-2 text-rose-600">
                      <Heart className="w-6 h-6 fill-rose-500 text-rose-500 inline" />
                      Saved Items / Wishlist
                    </span>
                  ) : (selectedCategory || selectedSubCategory || selectedProductType || selectedChildCategory) ? (
                    <>
                      {displayCategoryName && <span>{displayCategoryName}</span>}
                      {displaySubCategoryName && (
                        <>
                          <span className="text-zinc-400 font-light">/</span>
                          <span className="text-emerald-600">{displaySubCategoryName}</span>
                        </>
                      )}
                      {displayProductTypeName && (
                        <>
                          <span className="text-zinc-400 font-light">/</span>
                          <span className="text-zinc-700">{displayProductTypeName}</span>
                        </>
                      )}
                      {displayChildCategoryName && (
                        <>
                          <span className="text-zinc-400 font-light">/</span>
                          <span className="text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-lg text-lg sm:text-xl font-black">
                            {displayChildCategoryName}
                          </span>
                        </>
                      )}
                    </>
                  ) : searchQuery ? (
                    `Search Results for "${searchQuery}"`
                  ) : (
                    "Featured Collections"
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 font-medium">
                  {showSavedOnly
                    ? `Showing ${totalFilteredCount} saved item${totalFilteredCount === 1 ? '' : 's'}`
                    : `Showing ${totalFilteredCount} ${totalFilteredCount === 1 ? 'product' : 'products'} matching your criteria`}
                </p>
              </div>

              {/* Sort by Dropdown */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <ProductSortDropdown value={sortBy} onChange={setSortBy} />
              </div>
            </div>

            {/* Active Filters Badges & Clear Controls */}
            {(selectedCategory || selectedSubCategory || selectedProductType || selectedChildCategory || selectedBrand || selectedPricePreset !== 'all' || priceRange.min > 0 || priceRange.max < 50000 || availabilityFilter !== 'all' || minRatingFilter > 0) && (
              <div className="flex items-center flex-wrap gap-2 pt-1">
                {selectedBrand && (
                  <button
                    onClick={() => setSelectedBrand('')}
                    className="text-xs font-bold text-orange-900 bg-orange-100 hover:bg-orange-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3 text-orange-600" />
                    <span>Brand: {selectedBrand} ✕</span>
                  </button>
                )}
                {availabilityFilter !== 'all' && (
                  <button
                    onClick={() => setAvailabilityFilter('all')}
                    className="text-xs font-bold text-teal-950 bg-teal-100 hover:bg-teal-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <PackageCheck className="w-3 h-3 text-teal-600" />
                    <span>Availability: {availabilityFilter === 'in_stock' ? 'In Stock' : 'Out of Stock'} ✕</span>
                  </button>
                )}
                {minRatingFilter > 0 && (
                  <button
                    onClick={() => setMinRatingFilter(0)}
                    className="text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    <span>Rating: {minRatingFilter}★ & above ✕</span>
                  </button>
                )}
                {selectedChildCategory && (
                  <button
                    onClick={() => updateTaxonomyFilter({ childCategory: '' })}
                    className="text-xs font-bold text-emerald-950 bg-emerald-200/90 hover:bg-emerald-300 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    Child Category: {displayChildCategoryName} ✕
                  </button>
                )}
                {selectedProductType && (
                  <button
                    onClick={() => updateTaxonomyFilter({ productType: '', childCategory: '' })}
                    className="text-xs font-bold text-zinc-800 bg-zinc-200 hover:bg-zinc-300 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    Type: {displayProductTypeName} ✕
                  </button>
                )}
                {selectedSubCategory && (
                  <button
                    onClick={() => updateTaxonomyFilter({ subCategory: '', productType: '', childCategory: '' })}
                    className="text-xs font-bold text-zinc-700 hover:text-zinc-900 bg-zinc-200/80 hover:bg-zinc-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    Subcategory: {displaySubCategoryName} ✕
                  </button>
                )}
                {selectedCategory && (
                  <button
                    onClick={handleClearAllTaxonomy}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    Category: {displayCategoryName} ✕
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
                <button
                  onClick={() => {
                    handleClearAllTaxonomy();
                    handleResetAllFilters();
                  }}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 underline ml-1 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Products List Grid with Left-side Filter Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Left Sidebar Filter with 4 Sections (Brand, Price Range, Availability, Rating) */}
            <div className="hidden lg:block lg:col-span-1 space-y-4 sticky top-24">
              <ProductFilterSidebar
                products={sidebarSourceProducts}
                selectedBrand={selectedBrand}
                onSelectBrand={setSelectedBrand}
                priceRange={priceRange}
                maxStorePrice={10000}
                onPriceRangeChange={setPriceRange}
                selectedPricePreset={selectedPricePreset}
                onSelectPricePreset={handleSelectPricePreset}
                onResetPrice={handleResetPrice}
                availability={availabilityFilter}
                onSelectAvailability={setAvailabilityFilter}
                minRating={minRatingFilter}
                onSelectRating={setMinRatingFilter}
                ratingStatsMap={ratingStatsMap}
                onResetAll={handleResetAllFilters}
              />
            </div>

            {/* Product Cards Grid & Mobile Filter */}
            <div className="lg:col-span-3">
              {/* Mobile Filter Button & Brand Chips Bar */}
              <div className="lg:hidden mb-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    selectedBrand || selectedPricePreset !== 'all' || priceRange.min > 0 || priceRange.max < 50000 || availabilityFilter !== 'all' || minRatingFilter > 0
                      ? 'bg-teal-50 border-teal-300 text-teal-900 shadow-2xs'
                      : 'bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 text-teal-600" />
                  <span>Filters</span>
                  {(Number(Boolean(selectedBrand)) +
                    Number(selectedPricePreset !== 'all' || priceRange.min > 0 || priceRange.max < 50000) +
                    Number(availabilityFilter !== 'all') +
                    Number(minRatingFilter > 0)) > 0 && (
                    <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center font-black">
                      {Number(Boolean(selectedBrand)) +
                        Number(selectedPricePreset !== 'all' || priceRange.min > 0 || priceRange.max < 50000) +
                        Number(availabilityFilter !== 'all') +
                        Number(minRatingFilter > 0)}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBrand('')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    !selectedBrand
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  All Brands
                </button>
                {Array.from(new Set(sidebarSourceProducts.map((p) => (p.brand || '').trim()).filter(Boolean))).map((bName) => (
                  <button
                    key={bName}
                    type="button"
                    onClick={() => setSelectedBrand(selectedBrand === bName ? '' : bName)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                      selectedBrand === bName
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    <span>{bName}</span>
                  </button>
                ))}
              </div>

              {loadingProducts ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 lg:gap-6">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-3 animate-pulse">
                      <div className="aspect-square bg-zinc-200 rounded-xl" />
                      <div className="h-4 bg-zinc-200 rounded w-3/4" />
                      <div className="h-4 bg-zinc-200 rounded w-1/2" />
                      <div className="h-9 bg-zinc-200 rounded-xl mt-4" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <>
                  <div
                    className={`grid gap-2.5 sm:gap-4 lg:gap-6 ${
                      paginatedProducts.length === 1
                        ? 'grid-cols-1 max-w-xs sm:max-w-sm'
                        : paginatedProducts.length === 2
                        ? 'grid-cols-2'
                        : 'grid-cols-2 sm:grid-cols-3'
                    }`}
                  >
                    {paginatedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        ratingStats={ratingStatsMap[product.id]}
                        isWishlisted={wishlistIds.includes(product.id)}
                        onToggleWishlist={handleToggleWishlist}
                        onAddToCart={(p) => handleAddToCart(p, 1)}
                        onBuyNow={(p) => handleBuyNow(p, 1)}
                        onQuickView={(p, initialTab) => handleOpenProductDetail(p, true, initialTab || 'details')}
                        isAdded={recentlyAddedId === product.id}
                      />
                    ))}
                  </div>

                  {/* Clean & Premium Product Pagination */}
                  <ProductPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalFilteredCount}
                    itemsPerPage={PRODUCTS_PER_PAGE}
                    onPageChange={handlePageChange}
                  />
                </>
              ) : (
                <div className="bg-white rounded-3xl border border-zinc-200 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xs">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    showSavedOnly ? 'bg-rose-50 text-rose-500' : 'bg-zinc-100 text-zinc-400'
                  }`}>
                    {showSavedOnly ? <Heart className="w-8 h-8 fill-rose-500" /> : <ShoppingBag className="w-8 h-8" />}
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-1">
                    {showSavedOnly
                      ? 'Your Wishlist is Empty'
                      : selectedBrand
                      ? `No Products found for brand "${selectedBrand}"`
                      : selectedChildCategory
                      ? `No Products in "${activeChildCategoryObj?.name || selectedChildCategory}"`
                      : selectedProductType
                      ? `No Products in "${activeProductTypeObj?.name || selectedProductType}"`
                      : selectedCategory
                      ? `No Products in "${activeCategoryObj?.name || selectedCategory}"`
                      : 'No Products Found'}
                  </h3>
                  <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                    {showSavedOnly
                      ? "You haven't saved any items yet. Tap the heart icon on any product in the store to save it here!"
                      : "We couldn't find any products matching your current filters. Try changing or clearing your search, brand or category filters."}
                  </p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button
                      onClick={() => {
                        handleClearAllTaxonomy();
                        handleResetAllFilters();
                      }}
                      className="px-6 py-2.5 rounded-full bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
                    >
                      {showSavedOnly ? 'Browse All Products' : 'Clear All Filters'}
                    </button>
                    {(selectedChildCategory || selectedProductType || selectedBrand || availabilityFilter !== 'all' || minRatingFilter > 0) && (
                      <button
                        onClick={() => {
                          updateTaxonomyFilter({ childCategory: '', productType: '' });
                          handleResetAllFilters();
                        }}
                        className="px-5 py-2.5 rounded-full bg-zinc-100 text-zinc-800 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
                      >
                        Reset Sub-filters
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

            {/* Trust & Guarantee Section (Free Shipping, Secure Payment, 7-Day Returns, 24/7 Support) */}
            <TrustBenefitsSection />
          </>
        )}
      </main>

      {/* Modern Comprehensive Footer with FAQs, Policies */}
      <FooterSection
        settings={settings}
        onOpenTracker={() => setIsTrackerOpen(true)}
        onScrollToProducts={scrollToProducts}
        onSelectCategory={(slug) => handleTaxonomySelect({ category: slug })}
      />

      {/* Mobile Bottom Navigation & Floating Checkout */}
      <MobileBottomNav
        settings={settings}
        cart={cart}
        wishlistCount={wishlistIds.length}
        customer={currentCustomer}
        onOpenCustomerAccount={() => setIsCustomerAccountOpen(true)}
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

      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
      />

      {/* Customer Account & Order History Modal */}
      <CustomerAccountModal
        isOpen={isCustomerAccountOpen}
        onClose={() => setIsCustomerAccountOpen(false)}
        settings={settings}
        wishlistProducts={savedProducts}
        onRemoveWishlist={handleToggleWishlist}
        onAddToCart={(p) => handleAddToCart(p, 1)}
        onOpenInvoice={(order) => setCustomerInvoiceOrder(order)}
        onOpenProduct={(p) => handleOpenProductDetail(p)}
      />

      {/* Customer Invoice Slip Modal */}
      {customerInvoiceOrder && (
        <InvoiceModal
          order={customerInvoiceOrder}
          settings={settings}
          products={products}
          onClose={() => setCustomerInvoiceOrder(null)}
          onOpenProduct={(p) => {
            setCustomerInvoiceOrder(null);
            handleOpenProductDetail(p);
          }}
        />
      )}

      {/* Mobile Product Filter Sidebar Drawer */}
      <ProductFilterSidebar
        isMobileDrawer
        isOpenMobile={isMobileFilterOpen}
        onCloseMobile={() => setIsMobileFilterOpen(false)}
        products={sidebarSourceProducts}
        selectedBrand={selectedBrand}
        onSelectBrand={setSelectedBrand}
        priceRange={priceRange}
        maxStorePrice={10000}
        onPriceRangeChange={setPriceRange}
        selectedPricePreset={selectedPricePreset}
        onSelectPricePreset={handleSelectPricePreset}
        onResetPrice={handleResetPrice}
        availability={availabilityFilter}
        onSelectAvailability={setAvailabilityFilter}
        minRating={minRatingFilter}
        onSelectRating={setMinRatingFilter}
        ratingStatsMap={ratingStatsMap}
        onResetAll={handleResetAllFilters}
      />

      {/* Floating WhatsApp / Live Chat Support Button */}
      <FloatingSupportButton settings={settings} />
    </div>
  );
}
