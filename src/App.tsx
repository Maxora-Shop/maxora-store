import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { ProductQuickView } from './components/ProductQuickView';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { AdminDashboard } from './components/AdminDashboard';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Product, CartItem, StoreSettings } from './types';
import { storeService } from './services/storeService';
import { INITIAL_SETTINGS, INITIAL_PRODUCTS } from './data/initialData';
import { Truck, ShieldCheck, Phone, Mail, MapPin, Heart, ShoppingBag, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  // App view: 'store' or 'admin' based on route /admin or #admin
  const [activeView, setActiveView] = useState<'store' | 'admin'>(() => {
    return window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin') || window.location.hash === '#admin' ? 'admin' : 'store';
  });

  // Settings State
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);

  // Products State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

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

  // Added animation state map
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  const productSectionRef = useRef<HTMLDivElement>(null);

  // Save Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('maxora_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  // Load Settings & Products on startup and listen for route changes
  useEffect(() => {
    fetchSettings();
    fetchProducts();

    const handleLocationChange = () => {
      const isAdminRoute =
        window.location.pathname === '/admin' ||
        window.location.pathname.startsWith('/admin') ||
        window.location.hash === '#admin';
      setActiveView(isAdminRoute ? 'admin' : 'store');
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await storeService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await storeService.getProducts(searchQuery, selectedCategory);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Cart Management
  const handleAddToCart = (product: Product, quantity = 1) => {
    const finalPrice = Math.max(
      0,
      Number(product.selling_price || 0) - Number(product.discount || 0)
    );

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product_id === product.id);
      if (existing) {
        const newQty = Math.min(
          Number(product.stock || 99),
          existing.quantity + quantity
        );
        return prevCart.map((item) =>
          item.product_id === product.id ? { ...item, quantity: newQty } : item
        );
      } else {
        return [
          ...prevCart,
          {
            product_id: product.id,
            name: product.name,
            image_url: product.image_url || (product.images?.[0] || ''),
            unit_price: finalPrice,
            quantity: Math.min(Number(product.stock || 99), quantity),
            stock: Number(product.stock || 0),
            sku: product.sku,
          },
        ];
      }
    });

    setRecentlyAddedId(product.id);
    setTimeout(() => setRecentlyAddedId(null), 1500);
  };

  const handleBuyNow = (product: Product, quantity = 1) => {
    handleAddToCart(product, quantity);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: Math.min(item.stock, newQty) } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const handleOrderSuccess = () => {
    setCart([]);
    fetchProducts();
  };

  const scrollToProducts = () => {
    productSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Filter products by category and search
  const filteredProducts = products.filter((p) => {
    const search = searchQuery.toLowerCase().trim();
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search) ||
      (p.description && p.description.toLowerCase().includes(search)) ||
      (p.sku && p.sku.toLowerCase().includes(search)) ||
      p.category.toLowerCase().includes(search);

    const matchCategory = !selectedCategory || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const uniqueCategories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  );

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // If activeView is admin, show the admin portal
  if (activeView === 'admin') {
    return (
      <AdminDashboard
        onBackToStore={() => {
          setActiveView('store');
          window.history.pushState(null, '', '/');
        }}
        globalSettings={settings}
        onSettingsUpdated={() => {
          fetchSettings();
          fetchProducts();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col selection:bg-zinc-900 selection:text-white pb-20 sm:pb-0">
      {/* Sticky Top Navbar */}
      <Navbar
        settings={settings}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTracker={() => setIsTrackerOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex-1">
        {/* Hero Section */}
        {!searchQuery && (
          <Hero
            settings={settings}
            onExploreClick={scrollToProducts}
          />
        )}

        {/* Category Selector Filter */}
        <CategoryFilter
          categories={uniqueCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            scrollToProducts();
          }}
        />

        {/* Product Grid Section */}
        <section ref={productSectionRef} className="my-8 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
                {selectedCategory ? `${selectedCategory}` : searchQuery ? `Search Results for "${searchQuery}"` : "Featured Collections"}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium">
                Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} available in stock
              </p>
            </div>

            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory('')}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-full transition-colors self-start sm:self-auto cursor-pointer"
              >
                Clear Category Filter ✕
              </button>
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
                  onAddToCart={(p) => handleAddToCart(p, 1)}
                  onQuickView={(p) => setQuickViewProduct(p)}
                  isAdded={recentlyAddedId === product.id}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center max-w-lg mx-auto shadow-xs">
              <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-1">
                No Products Found
              </h3>
              <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                We couldn't find any products matching your search or category criteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                }}
                className="px-6 py-2.5 rounded-full bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
              >
                Reset Search & Filters
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
          <div>
            <span>{settings.footer_text || "© Maxora Bangladesh. All rights reserved."}</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsTrackerOpen(true)} className="hover:text-zinc-300 cursor-pointer">Order Tracking</button>
            <span>•</span>
            <button onClick={scrollToProducts} className="hover:text-zinc-300 cursor-pointer">Shop Collections</button>
            <span>•</span>
            <button
              onClick={() => {
                setActiveView('admin');
                window.history.pushState(null, '', '/admin');
              }}
              className="text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
            >
              <span>Admin Portal</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation & Floating Checkout */}
      <MobileBottomNav
        settings={settings}
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
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
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={(p, qty) => handleAddToCart(p, qty)}
        onBuyNow={(p, qty) => handleBuyNow(p, qty)}
      />

      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
      />
    </div>
  );
}
