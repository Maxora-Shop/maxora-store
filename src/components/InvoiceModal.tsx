import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Order, OrderItem, StoreSettings, Product } from '../types';
import { Printer, X, Package, Loader2, ArrowRight } from 'lucide-react';
import { storeService } from '../services/storeService';
import { INITIAL_PRODUCTS } from '../data/initialData';
import { getProductSlug, generateSlug, findProductBySlugOrId, SITE_URL } from '../utils/seo';

interface InvoiceModalProps {
  order: Order | null;
  settings: StoreSettings;
  products?: Product[];
  onClose: () => void;
  onOpenProduct?: (product: Product) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  order,
  settings,
  products = [],
  onClose,
  onOpenProduct,
}) => {
  if (!order) return null;

  const [loadedProducts, setLoadedProducts] = useState<Product[]>(products);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [isPreloadingPrint, setIsPreloadingPrint] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const printPortalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync or fetch products from store product database with resilient local cache fallback
  useEffect(() => {
    if (products && products.length > 0) {
      setLoadedProducts(products);
      return;
    }

    // 1. Immediately read cached products from localStorage if available
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('maxora_products') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLoadedProducts(parsed);
        }
      }
    } catch {}

    // 2. Query admin products in background
    storeService
      .getAllAdminProducts()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setLoadedProducts(list);
        } else {
          setLoadedProducts((prev) => (prev.length > 0 ? prev : INITIAL_PRODUCTS));
        }
      })
      .catch(() => {
        setLoadedProducts((prev) => (prev.length > 0 ? prev : INITIAL_PRODUCTS));
      });
  }, [products]);

  const handleImageError = (key: string) => {
    setImageErrors((prev) => ({ ...prev, [key]: true }));
  };

  /**
   * Universally resolves the real product record belonging to this order item from all available product sources.
   */
  const getItemProduct = (item: OrderItem, index: number): Product | null => {
    // Gather pool of products across loaded state, props, localStorage cache, and initial catalog
    const candidateList: Product[] = [];
    if (Array.isArray(loadedProducts) && loadedProducts.length > 0) candidateList.push(...loadedProducts);
    if (Array.isArray(products) && products.length > 0) candidateList.push(...products);
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('maxora_products') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) candidateList.push(...parsed);
      }
    } catch {}
    if (Array.isArray(INITIAL_PRODUCTS)) candidateList.push(...INITIAL_PRODUCTS);

    if (candidateList.length === 0) return null;

    // Deduplicate by ID
    const seen = new Set<string>();
    const pool: Product[] = [];
    for (const p of candidateList) {
      const key = String(p.id || '').trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        pool.push(p);
      }
    }

    const rawItemId = String(item.product_id || (item as any).productId || (item as any).id || '').trim();
    const rawItemSku = String(item.sku || (item as any).sku || '').trim();
    const rawItemName = String(item.product_name || (item as any).productName || (item as any).name || '').trim();
    const rawItemSlug = String((item as any).slug || '').trim();

    // 1. By ID match (exact string or number)
    if (rawItemId && rawItemId.toLowerCase() !== 'custom') {
      const byId = pool.find((p) => String(p.id).trim().toLowerCase() === rawItemId.toLowerCase());
      if (byId) return byId;
    }

    // 2. By SKU match
    if (rawItemSku) {
      const bySku = pool.find(
        (p) => p.sku && p.sku.trim().toLowerCase() === rawItemSku.toLowerCase()
      );
      if (bySku) return bySku;
    }

    // 3. By Exact Name match (case-insensitive)
    if (rawItemName) {
      const byName = pool.find(
        (p) => p.name && p.name.trim().toLowerCase() === rawItemName.toLowerCase()
      );
      if (byName) return byName;
    }

    // 4. By Slug or ID helper
    if (rawItemId) {
      const byHelper = findProductBySlugOrId(pool, rawItemId);
      if (byHelper) return byHelper;
    }
    if (rawItemSlug) {
      const bySlug = findProductBySlugOrId(pool, rawItemSlug);
      if (bySlug) return bySlug;
    }

    // 5. By partial name match (contains)
    if (rawItemName && rawItemName.length >= 3) {
      const targetLower = rawItemName.toLowerCase();
      const byPartial = pool.find((p) => {
        if (!p.name) return false;
        const pLower = p.name.trim().toLowerCase();
        return pLower.includes(targetLower) || targetLower.includes(pLower);
      });
      if (byPartial) return byPartial;
    }

    // 6. By keywords match
    if (rawItemName) {
      const words = rawItemName
        .toLowerCase()
        .split(/[\s\-_,]+/)
        .filter((w) => w.length >= 3 && !['with', 'and', 'the', 'for', 'pro', 'new'].includes(w));
      if (words.length > 0) {
        const byWords = pool.find((p) => {
          if (!p.name) return false;
          const pLower = p.name.toLowerCase();
          const matchCount = words.filter((w) => pLower.includes(w)).length;
          return matchCount >= Math.min(2, words.length);
        });
        if (byWords) return byWords;
      }
    }

    return null;
  };

  /**
   * Retrieves the product's actual image from the store's product database or order item snapshot.
   */
  const getItemImage = (item: OrderItem, index: number, matchedProd?: Product | null): string => {
    const prod = matchedProd !== undefined ? matchedProd : getItemProduct(item, index);

    // 1. Direct item.image_url stored with the order at checkout (check all possible field naming variants)
    const directUrl = String(
      item.image_url ||
      (item as any).imageUrl ||
      (item as any).image ||
      (item as any).img ||
      (item as any).product_image ||
      (item as any).productImage ||
      (item as any).thumbnail ||
      ''
    ).trim();

    // 2. If color variant matches a specific color image
    const selectedColor = String(item.selected_color || (item as any).color || '').trim().toLowerCase();
    if (prod && selectedColor && Array.isArray(prod.colors)) {
      const matchedCol = prod.colors.find(
        (c) => c.name?.toLowerCase().trim() === selectedColor
      );
      if (matchedCol?.image_url && typeof matchedCol.image_url === 'string' && matchedCol.image_url.trim()) {
        return matchedCol.image_url.trim();
      }
    }

    // 3. Direct image url from item
    if (directUrl && directUrl.length > 5) {
      return directUrl;
    }

    // 4. Product's primary image_url
    if (prod?.image_url && typeof prod.image_url === 'string' && prod.image_url.trim()) {
      return prod.image_url.trim();
    }

    // 5. Product's images array
    if (
      prod &&
      Array.isArray(prod.images) &&
      prod.images.length > 0 &&
      typeof prod.images[0] === 'string' &&
      prod.images[0].trim()
    ) {
      return prod.images[0].trim();
    }

    // 6. Additional product image fields (og_image, thumbnail, photo)
    const extraImg = String(
      (prod as any)?.og_image ||
      (prod as any)?.thumbnail ||
      (prod as any)?.photo ||
      ''
    ).trim();
    if (extraImg && extraImg.length > 5) {
      return extraImg;
    }

    return '';
  };

  /**
   * Dynamically constructs the real product details URL according to the application routing system.
   */
  const getItemUrl = (item: OrderItem, index: number, matchedProd?: Product | null): string => {
    const prod = matchedProd !== undefined ? matchedProd : getItemProduct(item, index);
    let slug = '';

    if (prod) {
      slug = getProductSlug(prod);
    } else if ((item as any).slug && typeof (item as any).slug === 'string' && (item as any).slug.trim()) {
      slug = (item as any).slug.trim();
    } else if (item.product_id && item.product_id.trim() && item.product_id !== 'custom') {
      slug = generateSlug(item.product_id) || item.product_id;
    } else if (item.product_name && item.product_name.trim() && item.product_name !== 'Custom Order Package') {
      slug = generateSlug(item.product_name);
    }

    if (!slug) return '';
    return `/product/${slug}`;
  };

  /**
   * Seamlessly handles clicking on a product from the invoice:
   * Opens the product details page directly so the customer or admin can view and order the product.
   */
  const handleProductClick = (e: React.MouseEvent, item: OrderItem, index: number) => {
    e.preventDefault();
    const prod = getItemProduct(item, index);

    if (onOpenProduct) {
      if (prod) {
        onClose();
        onOpenProduct(prod);
        return;
      }

      // Build a fallback product object so the customer can still view and order
      const fallbackProd: Product = {
        id: item.product_id || `prod-${index}`,
        name: item.product_name || 'Product',
        slug: (item as any).slug || generateSlug(item.product_name || 'product'),
        selling_price: Number(item.unit_price) || 0,
        buying_price: Number(item.buying_price) || 0,
        discount: 0,
        stock: 99,
        image_url: getItemImage(item, index, null) || '',
        category: 'All',
        category_slug: 'all',
      };
      onClose();
      onOpenProduct(fallbackProd);
      return;
    }

    // Default: if no onOpenProduct handler (e.g. admin panel), open product in new window/tab
    const slug = prod ? getProductSlug(prod) : ((item as any).slug || generateSlug(item.product_name));
    if (slug && typeof window !== 'undefined') {
      window.open(`/product/${slug}`, '_blank', 'noopener,noreferrer');
    }
  };

  // Eagerly preload images in the background on modal mount
  useEffect(() => {
    if (!order?.items || order.items.length === 0) return;
    order.items.forEach((item, idx) => {
      const url = getItemImage(item, idx);
      if (url) {
        const img = new Image();
        img.referrerPolicy = 'no-referrer';
        img.src = url;
      }
    });
  }, [order, loadedProducts]);

  /**
   * Ensures all product thumbnails are loaded before invoking the browser print dialog.
   */
  const handlePrint = async () => {
    setIsPreloadingPrint(true);
    try {
      const urls: string[] = [];
      if (Array.isArray(order?.items)) {
        order.items.forEach((item, idx) => {
          const key = item.id || `item-${idx}`;
          if (!imageErrors[key]) {
            const url = getItemImage(item, idx);
            if (url) urls.push(url);
          }
        });
      }

      if (urls.length > 0) {
        await Promise.all(
          urls.map((url) => {
            return new Promise<void>((resolve) => {
              const img = new Image();
              img.referrerPolicy = 'no-referrer';
              let finished = false;
              const complete = () => {
                if (!finished) {
                  finished = true;
                  resolve();
                }
              };

              img.onload = () => {
                if ('decode' in img && typeof img.decode === 'function') {
                  img.decode().then(complete).catch(complete);
                } else {
                  complete();
                }
              };
              img.onerror = complete;
              img.src = url;

              if (img.complete) {
                if ('decode' in img && typeof img.decode === 'function') {
                  img.decode().then(complete).catch(complete);
                } else {
                  complete();
                }
              }

              // Guard against stalled images (max 1.5 seconds)
              setTimeout(complete, 1500);
            });
          })
        );
      }

      // Brief delay to allow browser painting
      await new Promise((resolve) => setTimeout(resolve, 150));
    } catch (e) {
      console.warn('Image preload before print warning:', e);
    } finally {
      setIsPreloadingPrint(false);
    }

    window.print();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-BD', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  const deliveryAreaLabel =
    order.delivery_area === 'inside_dhaka'
      ? 'Inside Dhaka City'
      : order.delivery_area === 'sub_dhaka'
      ? 'Dhaka Suburbs'
      : order.delivery_area === 'outside_dhaka'
      ? 'Outside Dhaka'
      : order.delivery_area || (order.district === 'Dhaka' ? 'Inside Dhaka City' : 'Outside Dhaka');

  /**
   * Reusable core layout rendering the invoice details.
   * Shared between on-screen preview and the body print portal.
   */
  const renderInvoiceContent = (isForPrint: boolean = false) => {
    return (
      <div className={`space-y-5 text-zinc-950 bg-white ${isForPrint ? 'w-full p-0' : 'p-4 sm:p-8'}`}>
        {/* Header with Store & Order Details */}
        <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white font-black text-lg flex items-center justify-center print:bg-black print:text-white">
                M
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950">
                {settings.store_name || 'MAXORA'}
              </h1>
            </div>
            <p className="text-xs text-zinc-600 font-medium">
              {settings.store_tagline || 'Premium Online Store Bangladesh'}
            </p>
            {settings.phone && (
              <p className="text-xs text-zinc-700 font-semibold mt-1">
                Helpline: {settings.phone}
              </p>
            )}
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              {SITE_URL.replace(/^https?:\/\//, '')}
            </p>
          </div>

          <div className="text-right">
            <div className="inline-block px-3 py-1 bg-zinc-100 text-zinc-900 font-extrabold text-[11px] rounded-md uppercase tracking-wider mb-2 border border-zinc-300 print:border-zinc-400">
              INVOICE / PACKING SLIP
            </div>
            <div className="font-mono font-black text-base sm:text-lg text-zinc-950">
              Order #{order.order_number || order.id}
            </div>
            <div className="text-xs text-zinc-700 font-medium mt-1">
              Date: <span className="font-bold">{formatDate(order.created_at)}</span>
              {order.created_at && (
                <span className="text-zinc-500 font-normal"> ({formatTime(order.created_at)})</span>
              )}
            </div>
            <div className="flex items-center justify-end gap-1.5 mt-2">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-zinc-300 bg-zinc-50 text-zinc-800">
                Status: {order.status || 'Pending'}
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-zinc-300 bg-zinc-50 text-zinc-800">
                Payment: {order.payment_method || 'Cash on Delivery'}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Delivery Address Card */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs print-avoid-break print:bg-zinc-50 print:border-zinc-300">
          <div className="space-y-1">
            <span className="font-black uppercase tracking-wider text-[10px] text-zinc-500 block mb-1">
              Deliver To (Customer)
            </span>
            <div className="font-bold text-sm text-zinc-950">{order.customer_name}</div>
            <div className="font-semibold text-zinc-900 text-xs flex items-center gap-1.5">
              <span>Phone:</span>
              <span className="font-mono font-bold text-zinc-950">{order.phone}</span>
            </div>
            {order.alt_phone && (
              <div className="text-zinc-600 text-xs flex items-center gap-1.5">
                <span>Alt Phone:</span>
                <span className="font-mono">{order.alt_phone}</span>
              </div>
            )}
            {order.email && (
              <div className="text-zinc-600 text-[11px] truncate">Email: {order.email}</div>
            )}
          </div>

          <div className="space-y-1">
            <span className="font-black uppercase tracking-wider text-[10px] text-zinc-500 block mb-1">
              Shipping & Delivery Info
            </span>
            <div className="text-zinc-800 leading-relaxed font-medium">{order.address}</div>
            <div className="font-bold text-zinc-950 pt-0.5">
              {order.area ? `${order.area}, ` : ''}{order.district}
            </div>
            <div className="text-emerald-800 font-bold text-[11px] pt-1">
              Delivery Zone: {deliveryAreaLabel}
            </div>
          </div>
        </div>

        {/* Ordered Products Table */}
        <div className="border border-zinc-200 rounded-xl overflow-hidden print:border-zinc-300">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-700 font-bold uppercase tracking-wider print:bg-zinc-100 print:border-zinc-300">
              <tr>
                <th className="p-2.5 w-8 text-center">#</th>
                <th className="p-2.5">Item Description</th>
                <th className="p-2.5 text-center w-24">SKU</th>
                <th className="p-2.5 text-center w-14">Qty</th>
                <th className="p-2.5 text-right w-24">Unit Price</th>
                <th className="p-2.5 text-right w-28">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-medium print:divide-zinc-200">
              {Array.isArray(order.items) && order.items.length > 0 ? (
                order.items.map((item, index) => {
                  const matchedProduct = getItemProduct(item, index);
                  const resolvedUrl = getItemImage(item, index, matchedProduct);
                  const itemKey = item.id || `item-${index}`;
                  const isImgFailed = Boolean(imageErrors[itemKey]);
                  const fallbackProductUrl = matchedProduct?.image_url || (matchedProduct?.images && matchedProduct.images[0]) || '';
                  const displayImageUrl = (!isImgFailed && resolvedUrl) ? resolvedUrl : (fallbackProductUrl || resolvedUrl);
                  const productUrl = getItemUrl(item, index, matchedProduct);
                  const hasValidImage = Boolean(displayImageUrl);

                  return (
                    <tr key={itemKey} className="break-inside-avoid">
                      <td className="p-2.5 text-zinc-500 text-center align-middle font-mono">
                        {index + 1}
                      </td>
                      <td className="p-2.5 align-middle text-zinc-950">
                        <div className="flex items-center gap-3">
                          {/* 48x48px Clean Product Thumbnail */}
                          {!isForPrint ? (
                            <button
                              type="button"
                              onClick={(e) => handleProductClick(e, item, index)}
                              className="w-12 h-12 min-w-12 min-h-12 max-w-12 max-h-12 shrink-0 rounded-lg overflow-hidden border border-zinc-200 hover:border-emerald-600 hover:ring-2 hover:ring-emerald-500/20 transition-all cursor-pointer block bg-white"
                              title={`View & order ${item.product_name}`}
                              style={{ width: '48px', height: '48px', minWidth: '48px', minHeight: '48px' }}
                            >
                              {hasValidImage ? (
                                <img
                                  src={displayImageUrl}
                                  alt={item.product_name}
                                  width={48}
                                  height={48}
                                  loading="eager"
                                  decoding="async"
                                  referrerPolicy="no-referrer"
                                  onError={() => handleImageError(itemKey)}
                                  style={{ width: '48px', height: '48px', minWidth: '48px', minHeight: '48px', objectFit: 'cover', display: 'block', borderRadius: '6px' }}
                                  className="w-12 h-12 min-w-12 min-h-12 max-w-12 max-h-12 object-cover block rounded-lg transition-transform hover:scale-105"
                                />
                              ) : (
                                <div className="w-12 h-12 min-w-12 min-h-12 max-w-12 max-h-12 bg-zinc-100 flex items-center justify-center text-zinc-400">
                                  <Package className="w-5 h-5 text-zinc-400" />
                                </div>
                              )}
                            </button>
                          ) : (
                            <div
                              className="w-12 h-12 min-w-12 min-h-12 max-w-12 max-h-12 shrink-0 rounded-lg overflow-hidden border border-zinc-300 bg-white"
                              style={{ width: '48px', height: '48px', minWidth: '48px', minHeight: '48px' }}
                            >
                              {hasValidImage ? (
                                <img
                                  src={displayImageUrl}
                                  alt={item.product_name}
                                  width={48}
                                  height={48}
                                  loading="eager"
                                  decoding="sync"
                                  referrerPolicy="no-referrer"
                                  style={{ width: '48px', height: '48px', minWidth: '48px', minHeight: '48px', objectFit: 'cover', display: 'block', borderRadius: '6px' }}
                                  className="w-12 h-12 min-w-12 min-h-12 max-w-12 max-h-12 object-cover block rounded-lg"
                                />
                              ) : (
                                <div className="w-12 h-12 min-w-12 min-h-12 max-w-12 max-h-12 bg-zinc-50 flex items-center justify-center text-zinc-400">
                                  <Package className="w-5 h-5 text-zinc-400" />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Product Name & Variant & Clickable Actions */}
                          <div className="min-w-0 flex-1">
                            {!isForPrint ? (
                              <button
                                type="button"
                                onClick={(e) => handleProductClick(e, item, index)}
                                className="text-left font-bold text-zinc-950 hover:text-emerald-700 hover:underline transition-colors block text-xs leading-snug cursor-pointer group"
                                title={`View & order ${item.product_name}`}
                              >
                                <span>{item.product_name}</span>
                              </button>
                            ) : (
                              <span className="font-bold text-zinc-950 block text-xs leading-snug">
                                {item.product_name}
                              </span>
                            )}

                            {item.selected_color && (
                              <div className="text-[11px] text-zinc-600 mt-0.5 flex items-center gap-1 font-normal">
                                <span>Color/Variant:</span>
                                <span className="font-semibold text-zinc-900">
                                  {item.selected_color}
                                </span>
                              </div>
                            )}

                            {!isForPrint && (
                              <button
                                type="button"
                                onClick={(e) => handleProductClick(e, item, index)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline mt-1 cursor-pointer"
                                title="Open product to view and order"
                              >
                                <span>প্রোডাক্ট দেখুন / অর্ডার করুন</span>
                                <ArrowRight className="w-3 h-3 text-emerald-700" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-2.5 text-center font-mono text-zinc-600 align-middle text-xs">
                        {item.sku || matchedProduct?.sku || '-'}
                      </td>
                      <td className="p-2.5 text-center font-bold text-zinc-950 align-middle font-mono text-xs">
                        {item.quantity}
                      </td>
                      <td className="p-2.5 text-right align-middle text-zinc-800 font-mono">
                        ৳{Number(item.unit_price || 0).toLocaleString('en-BD')}
                      </td>
                      <td className="p-2.5 text-right font-bold text-zinc-950 align-middle font-mono">
                        ৳{Number(item.line_total || Number(item.unit_price) * Number(item.quantity)).toLocaleString('en-BD')}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="p-2.5 text-zinc-500 text-center align-middle font-mono">1</td>
                  <td className="p-2.5 align-middle text-zinc-950">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 min-w-12 min-h-12 max-w-12 max-h-12 shrink-0 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100 flex items-center justify-center text-zinc-400 print:bg-zinc-50 print:border-zinc-300">
                        <Package className="w-5 h-5 text-zinc-400" />
                      </div>
                      <span className="font-bold text-zinc-950 block text-xs leading-snug">
                        Custom Order Package
                      </span>
                    </div>
                  </td>
                  <td className="p-2.5 text-center font-mono text-zinc-500 align-middle">-</td>
                  <td className="p-2.5 text-center font-bold text-zinc-950 align-middle font-mono">1</td>
                  <td className="p-2.5 text-right align-middle font-mono">
                    ৳{Number(order.subtotal || 0).toLocaleString('en-BD')}
                  </td>
                  <td className="p-2.5 text-right font-bold text-zinc-950 align-middle font-mono">
                    ৳{Number(order.subtotal || 0).toLocaleString('en-BD')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pricing Totals Card */}
        <div className="flex justify-end pt-1 print-avoid-break">
          <div className="w-72 space-y-2 text-xs p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 print:bg-white print:border-zinc-300">
            <div className="flex justify-between text-zinc-700">
              <span>Subtotal:</span>
              <span className="font-semibold font-mono">
                ৳{Number(order.subtotal || 0).toLocaleString('en-BD')}
              </span>
            </div>
            <div className="flex justify-between text-zinc-700">
              <span>Delivery Charge:</span>
              <span className="font-semibold font-mono">
                ৳{Number(order.delivery_charge || 0).toLocaleString('en-BD')}
              </span>
            </div>
            {order.discount && Number(order.discount) > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount:</span>
                <span className="font-mono">- ৳{Number(order.discount).toLocaleString('en-BD')}</span>
              </div>
            )}
            <div className="border-t-2 border-zinc-900 pt-2 flex justify-between text-sm font-black text-zinc-950">
              <span>Amount Payable:</span>
              <span className="text-zinc-950 font-mono">
                ৳{Number(order.total || 0).toLocaleString('en-BD')}
              </span>
            </div>
            <div className="text-right text-[11px] text-zinc-600 font-bold uppercase tracking-wider pt-0.5">
              Payment: {order.payment_method || 'Cash on Delivery'}
            </div>
          </div>
        </div>

        {/* Customer Remarks Note if available */}
        {order.note && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 print-avoid-break print:bg-zinc-50 print:border-zinc-300">
            <span className="font-bold text-amber-900">Customer Note:</span> {order.note}
          </div>
        )}

        {/* Signatures & Packing Slip Footer */}
        <div className="pt-8 print-avoid-break space-y-6">
          <div className="grid grid-cols-2 gap-12 text-xs pt-6">
            <div className="text-center">
              <div className="border-t border-dashed border-zinc-400 w-48 mx-auto pt-2 text-zinc-600 font-semibold">
                Customer Signature
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-dashed border-zinc-400 w-48 mx-auto pt-2 text-zinc-600 font-semibold">
                Authorized Signature & Seal
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-3 text-center text-[11px] text-zinc-500 space-y-0.5 print:border-zinc-300">
            <p className="font-bold text-zinc-700">
              Thank you for shopping with {settings.store_name || 'MAXORA'}!
            </p>
            <p className="text-zinc-500">
              Please inspect the parcel in front of the courier delivery officer before payment.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 1. Dedicated Print Portal injected directly into document.body for Chrome print & PDF */}
      {isMounted &&
        createPortal(
          <div id="admin-print-invoice-portal" ref={printPortalRef}>
            {renderInvoiceContent(true)}
          </div>,
          document.body
        )}

      {/* 2. On-Screen Interactive Modal Dialog */}
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-sm animate-fade-in no-print">
        <div className="relative bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 max-h-[95vh] flex flex-col my-auto">
          {/* Modal Header Actions */}
          <div className="p-3.5 sm:p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-sm text-zinc-900">
                Customer Invoice & Packaging Slip
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                disabled={isPreloadingPrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isPreloadingPrint ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Preparing Print...</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Invoice</span>
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* On-Screen Scrollable Invoice Area */}
          <div className="p-0 overflow-y-auto max-h-[calc(95vh-70px)]">
            {renderInvoiceContent(false)}
          </div>
        </div>
      </div>
    </>
  );
};
