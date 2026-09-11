import React, { useState, useEffect, useRef } from 'react';
import { Order, OrderItem, StoreSettings, Product } from '../types';
import { Printer, X, Package, Loader2 } from 'lucide-react';
import { storeService } from '../services/storeService';
import { getProductSlug, generateSlug, findProductBySlugOrId, SITE_URL } from '../utils/seo';

interface InvoiceModalProps {
  order: Order | null;
  settings: StoreSettings;
  products?: Product[];
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  order,
  settings,
  products = [],
  onClose,
}) => {
  if (!order) return null;

  const [loadedProducts, setLoadedProducts] = useState<Product[]>(products);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [isPreloadingPrint, setIsPreloadingPrint] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  // Sync or fetch products from store product database
  useEffect(() => {
    if (products && products.length > 0) {
      setLoadedProducts(products);
    } else {
      storeService
        .getProducts()
        .then((list) => {
          if (Array.isArray(list) && list.length > 0) {
            setLoadedProducts(list);
          }
        })
        .catch(() => {});
    }
  }, [products]);

  const handleImageError = (key: string) => {
    setImageErrors((prev) => ({ ...prev, [key]: true }));
  };

  /**
   * Universally resolves the real product record belonging to this order item from the store's product database.
   */
  const getItemProduct = (item: OrderItem, index: number): Product | null => {
    if (!loadedProducts || loadedProducts.length === 0) return null;

    if (item.product_id) {
      const byId = loadedProducts.find((p) => String(p.id) === String(item.product_id));
      if (byId) return byId;
    }

    if (item.sku && item.sku.trim()) {
      const bySku = loadedProducts.find(
        (p) => p.sku && p.sku.toLowerCase().trim() === item.sku?.toLowerCase().trim()
      );
      if (bySku) return bySku;
    }

    if (item.product_name && item.product_name.trim()) {
      const byName = loadedProducts.find(
        (p) => p.name && p.name.toLowerCase().trim() === item.product_name?.toLowerCase().trim()
      );
      if (byName) return byName;
    }

    if (item.product_id) {
      const byHelper = findProductBySlugOrId(loadedProducts, item.product_id);
      if (byHelper) return byHelper;
    }

    return null;
  };

  /**
   * Retrieves the product's actual image from the store's product database.
   */
  const getItemImage = (item: OrderItem, index: number, matchedProd?: Product | null): string => {
    // 1. Prioritize actual image from store product database
    const prod = matchedProd !== undefined ? matchedProd : getItemProduct(item, index);
    if (prod) {
      if (item.selected_color && Array.isArray(prod.colors)) {
        const matchedCol = prod.colors.find(
          (c) => c.name?.toLowerCase().trim() === item.selected_color?.toLowerCase().trim()
        );
        if (matchedCol?.image_url && matchedCol.image_url.trim()) {
          return matchedCol.image_url.trim();
        }
      }
      if (prod.image_url && typeof prod.image_url === 'string' && prod.image_url.trim()) {
        return prod.image_url.trim();
      }
      if (Array.isArray(prod.images) && prod.images.length > 0 && prod.images[0]?.trim()) {
        return prod.images[0].trim();
      }
    }

    // 2. Fallback to image saved on the order item if not found in catalog
    if (item.image_url && typeof item.image_url === 'string' && item.image_url.trim()) {
      return item.image_url.trim();
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

    if (typeof window !== 'undefined') {
      const isExternalAdmin =
        window.location.hostname.includes('admin') && !window.location.pathname.startsWith('/admin');
      if (isExternalAdmin) {
        const storeBase =
          (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_STORE_URL) || SITE_URL;
        return `${storeBase.replace(/\/$/, '')}/product/${slug}`;
      }
    }

    return `/product/${slug}`;
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
   * Ensures all product thumbnails are fully loaded and decoded in memory before invoking the browser print dialog.
   */
  const handlePrint = async () => {
    setIsPreloadingPrint(true);
    try {
      // 1. Collect all product image URLs for this order
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

      // 2. Preload and decode images via Image constructor
      if (urls.length > 0) {
        await Promise.all(
          urls.map((url) => {
            return new Promise<void>((resolve) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
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

              // Guard against stalled images (max 2 seconds)
              setTimeout(complete, 2000);
            });
          })
        );
      }

      // 3. Ensure all rendered DOM <img> elements inside the printable invoice are complete and decoded
      const printContainer = printableRef.current || document.getElementById('printable-invoice');
      if (printContainer) {
        const domImages = Array.from(printContainer.querySelectorAll<HTMLImageElement>('img'));
        await Promise.all(
          domImages.map((domImg: HTMLImageElement) => {
            return new Promise<void>((resolve) => {
              let finished = false;
              const complete = () => {
                if (!finished) {
                  finished = true;
                  resolve();
                }
              };

              if (domImg.complete && domImg.naturalWidth > 0) {
                if ('decode' in domImg && typeof domImg.decode === 'function') {
                  domImg.decode().then(complete).catch(complete);
                } else {
                  complete();
                }
              } else {
                domImg.addEventListener(
                  'load',
                  () => {
                    if ('decode' in domImg && typeof domImg.decode === 'function') {
                      domImg.decode().then(complete).catch(complete);
                    } else {
                      complete();
                    }
                  },
                  { once: true }
                );
                domImg.addEventListener('error', complete, { once: true });
                setTimeout(complete, 2000);
              }
            });
          })
        );
      }

      // 4. Brief delay to allow browser layout and painting
      await new Promise((resolve) => setTimeout(resolve, 150));
    } catch (e) {
      console.warn('Image preload before print warning:', e);
    } finally {
      setIsPreloadingPrint(false);
    }

    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-sm animate-fade-in print:bg-white print:p-0 print:static print:overflow-visible">
      {/* Printable styles to guarantee exact 50x50px thumbnails, colors, borders, and images appear in print & PDF */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                margin: 10mm;
                size: auto;
              }
              body * {
                visibility: hidden;
              }
              #printable-invoice, #printable-invoice * {
                visibility: visible;
              }
              #printable-invoice {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 0;
                background: white !important;
                color: black !important;
              }
              a {
                text-decoration: none !important;
                color: inherit !important;
              }
              img {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .invoice-thumb {
                width: 50px !important;
                height: 50px !important;
                min-width: 50px !important;
                min-height: 50px !important;
                max-width: 50px !important;
                max-height: 50px !important;
                object-fit: cover !important;
                border-radius: 8px !important;
              }
            }
          `,
        }}
      />

      <div className="relative bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 max-h-[95vh] flex flex-col my-auto print:max-h-none print:shadow-none print:border-none print:rounded-none print:max-w-none print:w-full">
        {/* Modal Top Actions */}
        <div className="p-3.5 sm:p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 print:hidden">
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
              className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Area */}
        <div
          ref={printableRef}
          id="printable-invoice"
          className="p-4 sm:p-8 overflow-y-auto space-y-5 sm:space-y-6 text-zinc-900 bg-white print:p-0 print:overflow-visible"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-zinc-200 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white font-black text-lg flex items-center justify-center">
                  M
                </div>
                <h1 className="text-xl font-black tracking-tight">
                  {settings.store_name || 'MAXORA'}
                </h1>
              </div>
              <p className="text-xs text-zinc-500">
                {settings.store_tagline || 'Premium Online Store Bangladesh'}
              </p>
              {settings.phone && (
                <p className="text-xs text-zinc-600 font-medium mt-1">Helpline: {settings.phone}</p>
              )}
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-zinc-100 text-zinc-800 font-bold text-xs rounded-lg uppercase tracking-wider mb-2">
                Cash on Delivery
              </span>
              <div className="font-mono font-bold text-base text-zinc-950">
                Order #{order.order_number}
              </div>
              <div className="text-xs text-zinc-500">
                Date:{' '}
                {new Date(order.created_at).toLocaleDateString('en-BD', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>

          {/* Customer & Delivery Address */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs">
            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wider text-[10px] text-zinc-400">
                Deliver To
              </span>
              <div className="font-bold text-sm text-zinc-900">{order.customer_name}</div>
              <div className="font-semibold text-zinc-800">{order.phone}</div>
              {order.alt_phone && (
                <div className="text-zinc-500">Alt Phone: {order.alt_phone}</div>
              )}
              {order.email && <div className="text-zinc-500">{order.email}</div>}
            </div>

            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wider text-[10px] text-zinc-400">
                Shipping Details
              </span>
              <div className="text-zinc-700 leading-relaxed font-medium">{order.address}</div>
              <div className="font-bold text-zinc-900">
                {order.area}, {order.district}
              </div>
              <div className="text-emerald-700 font-semibold text-[11px] pt-1">
                Area: {order.delivery_area || (order.district === 'Dhaka' ? 'Dhaka City' : 'Outside Dhaka')}
              </div>
            </div>
          </div>

          {/* Ordered Products Table */}
          <div className="border border-zinc-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Item Description</th>
                  <th className="p-3 text-center">SKU</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {Array.isArray(order.items) && order.items.length > 0 ? (
                  order.items.map((item, index) => {
                    const matchedProduct = getItemProduct(item, index);
                    const imageUrl = getItemImage(item, index, matchedProduct);
                    const productUrl = getItemUrl(item, index, matchedProduct);
                    const itemKey = item.id || `item-${index}`;
                    const isImgFailed = Boolean(imageErrors[itemKey]);
                    const hasValidImage = Boolean(imageUrl && !isImgFailed);
                    const hasUrl = Boolean(productUrl);

                    return (
                      <tr key={itemKey}>
                        <td className="p-3 text-zinc-400 align-middle">{index + 1}</td>
                        <td className="p-3 align-middle text-zinc-900">
                          <div className="flex items-center gap-3">
                            {/* 50x50px Clean Product Thumbnail */}
                            {hasUrl ? (
                              <a
                                href={productUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-[50px] h-[50px] min-w-[50px] min-h-[50px] max-w-[50px] max-h-[50px] shrink-0 block rounded-lg overflow-hidden border border-zinc-200 hover:border-emerald-600 transition-all focus:outline-none print:border-zinc-200"
                                title={`View product: ${item.product_name}`}
                              >
                                {hasValidImage ? (
                                  <img
                                    src={imageUrl}
                                    alt={item.product_name}
                                    width={50}
                                    height={50}
                                    loading="eager"
                                    decoding="sync"
                                    referrerPolicy="no-referrer"
                                    onError={() => handleImageError(itemKey)}
                                    className="w-[50px] h-[50px] min-w-[50px] min-h-[50px] max-w-[50px] max-h-[50px] object-cover bg-zinc-50 block invoice-thumb"
                                  />
                                ) : (
                                  <div className="w-[50px] h-[50px] min-w-[50px] min-h-[50px] max-w-[50px] max-h-[50px] bg-zinc-100 flex items-center justify-center text-zinc-400 print:bg-zinc-50">
                                    <Package className="w-5 h-5 text-zinc-400" />
                                  </div>
                                )}
                              </a>
                            ) : (
                              <div className="w-[50px] h-[50px] min-w-[50px] min-h-[50px] max-w-[50px] max-h-[50px] shrink-0 rounded-lg overflow-hidden border border-zinc-200 print:border-zinc-200">
                                {hasValidImage ? (
                                  <img
                                    src={imageUrl}
                                    alt={item.product_name}
                                    width={50}
                                    height={50}
                                    loading="eager"
                                    decoding="sync"
                                    referrerPolicy="no-referrer"
                                    onError={() => handleImageError(itemKey)}
                                    className="w-[50px] h-[50px] min-w-[50px] min-h-[50px] max-w-[50px] max-h-[50px] object-cover bg-zinc-50 block invoice-thumb"
                                  />
                                ) : (
                                  <div className="w-[50px] h-[50px] min-w-[50px] min-h-[50px] max-w-[50px] max-h-[50px] bg-zinc-100 flex items-center justify-center text-zinc-400 print:bg-zinc-50">
                                    <Package className="w-5 h-5 text-zinc-400" />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Product Name & Details */}
                            <div className="min-w-0 flex-1">
                              {hasUrl ? (
                                <a
                                  href={productUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-bold text-zinc-900 hover:text-emerald-700 hover:underline transition-colors block text-xs leading-snug print:text-zinc-900 print:no-underline"
                                  title={`View product: ${item.product_name}`}
                                >
                                  {item.product_name}
                                </a>
                              ) : (
                                <span className="font-bold text-zinc-900 block text-xs leading-snug">
                                  {item.product_name}
                                </span>
                              )}
                              {item.selected_color && (
                                <div className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1 font-normal print:text-zinc-600">
                                  <span>Color:</span>
                                  <span className="font-medium text-zinc-700">
                                    {item.selected_color}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono text-zinc-500 align-middle">
                          {item.sku || '-'}
                        </td>
                        <td className="p-3 text-center font-bold text-zinc-900 align-middle">
                          {item.quantity}
                        </td>
                        <td className="p-3 text-right align-middle">
                          ৳{Number(item.unit_price || 0).toLocaleString('en-BD')}
                        </td>
                        <td className="p-3 text-right font-bold text-zinc-950 align-middle">
                          ৳{Number(item.line_total || Number(item.unit_price) * Number(item.quantity)).toLocaleString('en-BD')}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="p-3 text-zinc-400 align-middle">1</td>
                    <td className="p-3 align-middle text-zinc-900">
                      <div className="flex items-center gap-3">
                        <div className="w-[50px] h-[50px] min-w-[50px] min-h-[50px] max-w-[50px] max-h-[50px] shrink-0 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100 flex items-center justify-center text-zinc-400 print:bg-zinc-50 print:border-zinc-200">
                          <Package className="w-5 h-5 text-zinc-400" />
                        </div>
                        <span className="font-bold text-zinc-900 block text-xs leading-snug">
                          Custom Order Package
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono text-zinc-500 align-middle">-</td>
                    <td className="p-3 text-center font-bold text-zinc-900 align-middle">1</td>
                    <td className="p-3 text-right align-middle">
                      ৳{Number(order.subtotal || 0).toLocaleString('en-BD')}
                    </td>
                    <td className="p-3 text-right font-bold text-zinc-950 align-middle">
                      ৳{Number(order.subtotal || 0).toLocaleString('en-BD')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal:</span>
                <span className="font-semibold">
                  ৳{Number(order.subtotal || 0).toLocaleString('en-BD')}
                </span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Delivery Charge:</span>
                <span className="font-semibold">
                  ৳{Number(order.delivery_charge || 0).toLocaleString('en-BD')}
                </span>
              </div>
              <div className="border-t border-zinc-200 pt-2 flex justify-between text-sm font-black text-zinc-950">
                <span>Amount Payable:</span>
                <span className="text-emerald-700">
                  ৳{Number(order.total || 0).toLocaleString('en-BD')}
                </span>
              </div>
            </div>
          </div>

          {/* Remarks & Footer Note */}
          {order.note && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
              <span className="font-bold">Customer Note:</span> {order.note}
            </div>
          )}

          <div className="border-t border-zinc-200 pt-4 text-center text-[11px] text-zinc-400 space-y-1">
            <p className="font-semibold text-zinc-600">
              Thank you for shopping with {settings.store_name || 'Maxora'}!
            </p>
            <p>Please inspect your package in front of the courier delivery officer before payment.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
