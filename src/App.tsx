import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PriceFilter, PriceRange } from './components/PriceFilter';
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
import { Product, CartItem, StoreSettings, Category, SubCategory, ProductType, ChildCategory, Review, Customer, Order, Brand } from './types';
import { storeService } from './services/storeService';
import { pixelService } from './services/pixelService';
import {
  INITIAL_SETTINGS,
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_SUBCATEGORIES,
  INITIAL_PRODUCT_TYPES,
  INITIAL_CHILD_CATEGORIES,
} from './data/initialData';
import { Truck, ShieldCheck, Phone, MapPin, ShoppingBag, AlertCircle, Heart, ChevronRight, Home, Tag } from 'lucide-react';
import { getProductSlug, findProductBySlugOrId, generateSlug } from './utils/seo';
import { getStoredWishlist, toggleWishlistProduct, clearStoredWishlist } from './utils/wishlist';
import { SavedItemsDrawer } from './components/SavedItemsDrawer';
import {
  reconcileCategories,
  reconcileSubCategories,
  reconcileProductTypes,
  reconcileChildCategories,
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
  const [products, setProducts] = useState<Product[]>(() => {
    const cached = typeof window !== 'undefined' ? storeService.getCachedProducts() : null;
    return cached && cached.length > 0 ? cached : INITIAL_PRODUCTS;
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    const cached = typeof window !== 'undefined' ? storeService.getCachedCategories() : null;
    return cached && cached.length > 0 ? cached : INITIAL_CATEGORIES;
  });
  const [subCategories, setSubCategories] = useState<SubCategory[]>(() => {
    const cached = typeof window !== 'undefined' ? storeService.getCachedSubCategories() : null;
    return cached && cached.length > 0 ? cached : INITIAL_SUBCATEGORIES;
  });
  const [productTypes, setProductTypes] = useState<ProductType[]>(() => {
    const cached = typeof window !== 'undefined' ? storeService.getCachedProductTypes() : null;
    return cached && cached.length > 0 ? cached : INITIAL_PRODUCT_TYPES;
  });
  const [childCategories, setChildCategories] = useState<ChildCategory[]>(() => {
    const cached = typeof window !== 'undefined' ? storeService.getCachedChildCategories() : null;
    return cached && cached.length > 0 ? cached : INITIAL_CHILD_CATEGORIES;
  });
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

  // Fetch products on initial mount or when returning from admin
  useEffect(() => {
    fetchProducts();
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

  // Reconcile categories and subcategories with existing product data
  const reconciledCategories = useMemo(
    () => reconcileCategories(categories, products),
    [categories, products]
  );
  const reconciledSubCategories = useMemo(
    () => reconcileSubCategories(subCategories, reconciledCategories, products),
    [subCategories, reconciledCategories, products]
  );
  const reconciledProductTypes = useMemo(
    () => reconcileProductTypes(productTypes, reconciledCategories, reconciledSubCategories, products),
    [productTypes, reconciledCategories, reconciledSubCategories, products]
  );
  const reconciledChildCategories = useMemo(
    () => reconcileChildCategories(childCategories, reconciledCategories, reconciledSubCategories, reconciledProductTypes, products),
    [childCategories, reconciledCategories, reconciledSubCategories, reconciledProductTypes, products]
  );

  // Dynamic 4-Tier Taxonomy Hierarchy Tree (Category -> Subcategory -> Product Type -> Child Category)
  const taxonomyTree = useMemo(() => {
    return buildTaxonomyTree(products, reconciledCategories, reconciledSubCategories, reconciledProductTypes, reconciledChildCategories);
  }, [products, reconciledCategories, reconciledSubCategories, reconciledProductTypes, reconciledChildCategories]);

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
            {/* Hero Section - Only displayed when on the general home view without active taxonomy filters or search */}
            {!searchQuery && !selectedCategory && !selectedSubCategory && !selectedProductType && !selectedChildCategory && (
              <Hero
                settings={settings}
                products={products}
                onExploreClick={scrollToProducts}
                onOpenProduct={handleOpenProductDetail}
                onAddToCart={(p) => handleAddToCart(p, 1)}
              />
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
                  ? `Showing ${filteredProducts.length} saved item${filteredProducts.length === 1 ? '' : 's'}`
                  : `Showing ${filteredProducts.length} ${filteredProducts.length === 1 ? 'product' : 'products'} matching your criteria`}
              </p>
            </div>

            {/* Active Filters Badges & Clear Controls */}
            {(selectedCategory || selectedSubCategory || selectedProductType || selectedChildCategory || selectedBrand || selectedPricePreset !== 'all' || priceRange.min > 0 || priceRange.max < 50000) && (
              <div className="flex items-center flex-wrap gap-2">
                {selectedBrand && (
                  <button
                    onClick={() => setSelectedBrand('')}
                    className="text-xs font-bold text-orange-900 bg-orange-100 hover:bg-orange-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3 text-orange-600" />
                    <span>Brand: {selectedBrand} ✕</span>
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
              </div>
            )}
          </div>

          {/* Products List Grid with Brand Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Left Sidebar Filter for Brands (desktop) */}
            <div className="hidden lg:block lg:col-span-1 space-y-4 sticky top-24">
              <BrandSidebarFilter
                products={products}
                selectedBrand={selectedBrand}
                onSelectBrand={setSelectedBrand}
              />
            </div>

            {/* Product Cards Grid & Mobile Filter */}
            <div className="lg:col-span-3">
              {/* Mobile Brand Chips Bar */}
              <div className="lg:hidden mb-4 overflow-x-auto pb-1 scrollbar-thin">
                <div className="flex items-center gap-2">
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
                  {Array.from(new Set(products.map((p) => (p.brand || '').trim()).filter(Boolean))).map((bName) => (
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
                <div
                  className={`grid gap-2.5 sm:gap-4 lg:gap-6 ${
                    filteredProducts.length === 1
                      ? 'grid-cols-1 max-w-xs sm:max-w-sm'
                      : filteredProducts.length === 2
                      ? 'grid-cols-2'
                      : 'grid-cols-2 sm:grid-cols-3'
                  }`}
                >
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
                        handleResetPrice();
                        setSelectedBrand('');
                      }}
                      className="px-6 py-2.5 rounded-full bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
                    >
                      {showSavedOnly ? 'Browse All Products' : 'Clear All Filters'}
                    </button>
                    {(selectedChildCategory || selectedProductType || selectedBrand) && (
                      <button
                        onClick={() => {
                          updateTaxonomyFilter({ childCategory: '', productType: '' });
                          setSelectedBrand('');
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
          </>
        )}
      </main>

      {/* Trust & Guarantee Banner */}
      <section className="bg-white border-t border-zinc-200 py-8 sm:py-10 px-4 sm:px-6 mt-6 sm:mt-8">
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
      <footer className="mt-auto bg-zinc-950 text-white pt-14 pb-24 sm:pb-8 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-zinc-800">
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

      {/* Floating WhatsApp / Live Chat Support Button */}
      <FloatingSupportButton settings={settings} />
    </div>
  );
}
