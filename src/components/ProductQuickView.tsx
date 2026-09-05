import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Truck, ShieldCheck, Check, ArrowRight, Tag, Copy, Share2, ExternalLink } from 'lucide-react';
import { Product } from '../types';
import { getProductSlug, SITE_URL } from '../utils/seo';

interface ProductQuickViewProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, selectedColor?: { name: string; code?: string; image_url?: string }) => void;
  onBuyNow: (product: Product, quantity: number, selectedColor?: { name: string; code?: string; image_url?: string }) => void;
}

export const ProductQuickView: React.FC<ProductQuickViewProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
}) => {
  if (!product) return null;

  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const [selectedColor, setSelectedColor] = useState<{ name: string; code?: string; stock?: number; image_url?: string } | null>(
    product.colors && product.colors.length > 0 ? product.colors[0] : null
  );
  const [selectedImage, setSelectedImage] = useState<string>(
    (product.colors && product.colors[0]?.image_url) || product.image_url || (product.images && product.images[0]) || ""
  );

  // When color changes, if the color has a dedicated image, switch to it
  const handleSelectColor = (col: { name: string; code?: string; stock?: number; image_url?: string }) => {
    setSelectedColor(col);
    if (col.image_url) {
      setSelectedImage(col.image_url);
    }
  };

  const productSlug = getProductSlug(product);
  const baseDomain = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : SITE_URL;
  const productUrl = `${baseDomain.replace(/\/$/, '')}/product/${productSlug}`;

  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(productUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = productUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy product link:', err);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on Maxora!`,
          url: productUrl,
        });
      } catch {
        // User cancelled or share failed, fallback to copy
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const allImages = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image_url].filter(Boolean);

  const sellingPrice = Number(product.selling_price || 0);
  const discount = Number(product.discount || 0);
  const finalPrice = Math.max(0, sellingPrice - discount);
  const hasDiscount = discount > 0;
  const isOutOfStock = Number(product.stock || 0) <= 0;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 max-h-[90vh] flex flex-col md:flex-row"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Media Column */}
        <div className="w-full md:w-1/2 p-6 bg-zinc-50 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-200">
          <div className="aspect-square rounded-2xl overflow-hidden bg-white border border-zinc-200 shadow-inner flex items-center justify-center mb-4">
            <img
              src={selectedImage || product.image_url}
              alt={`${product.name}${product.sku ? ` - ${product.sku}` : ''}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80";
              }}
            />
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === img
                      ? "border-zinc-950 scale-105 shadow-sm"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info Column */}
        <div className="w-full md:w-1/2 p-6 overflow-y-auto flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                {product.category || "General"}
              </span>
              {product.badge && (
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 bg-zinc-200 px-2.5 py-0.5 rounded-full">
                  {product.badge}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 leading-snug mb-2">
              {product.name}
            </h2>

            {product.sku && (
              <div className="text-xs text-zinc-600 font-mono mb-3">
                SKU: {product.sku}
              </div>
            )}

            {/* Price Box */}
            <div className="flex items-baseline gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200 mb-4">
              <span className="text-2xl font-black text-zinc-950">
                ৳{finalPrice.toLocaleString('en-BD')}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-sm font-semibold text-zinc-600 line-through">
                    ৳{sellingPrice.toLocaleString('en-BD')}
                  </span>
                  <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                    Save ৳{discount.toLocaleString('en-BD')}
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <div className="text-xs sm:text-sm text-zinc-700 leading-relaxed mb-4">
              {product.description || "High quality guaranteed. Designed for durability and performance."}
            </div>

            {/* Google SEO Tags / Product Keywords */}
            {product.meta_keywords && (
              <div className="mb-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1 mr-1">
                    <Tag className="w-3 h-3 text-zinc-400" />
                    Keywords:
                  </span>
                  {product.meta_keywords
                    .split(',')
                    .map((k) => k.trim())
                    .filter(Boolean)
                    .map((kw, i) => (
                      <span
                        key={i}
                        className="inline-block text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded-md border border-zinc-200 transition-colors"
                      >
                        #{kw}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Reassurance points */}
            <div className="space-y-2 text-xs text-zinc-700 bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/60 mb-4">
              <div className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                <span>Cash on Delivery available inside & outside Dhaka</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                <span>7 days return & exchange policy</span>
              </div>
            </div>

            {/* Share & Copy Link */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-zinc-50 rounded-xl border border-zinc-200/80 mb-6">
              <button
                type="button"
                onClick={handleCopyLink}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Product link copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Copy Product Link</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-zinc-500">Share:</span>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${product.name} - ${productUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  title="Share on WhatsApp"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  title="Share on Facebook"
                >
                  Facebook
                </a>
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="p-1 rounded-lg text-xs bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 transition-colors"
                  title="Share via device"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div>
            {/* Color Variants Selection */}
            {Array.isArray(product.colors) && product.colors.length > 0 && (
              <div className="mb-4 p-3 bg-purple-50/70 rounded-2xl border border-purple-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-purple-950">
                    Select Color (কালার পছন্দ করুন):
                  </span>
                  {selectedColor && (
                    <span className="text-xs font-extrabold text-purple-700">
                      {selectedColor.name} {selectedColor.stock !== undefined && `(${selectedColor.stock} in stock)`}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.colors.map((col, idx) => {
                    const isSelected = selectedColor?.name === col.name;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectColor(col)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-purple-700 text-white border-purple-700 shadow-xs scale-102'
                            : 'bg-white text-zinc-800 border-zinc-200 hover:border-purple-300'
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded-full inline-block border ${
                            isSelected ? 'border-white' : 'border-zinc-300'
                          }`}
                          style={{ backgroundColor: col.code || '#71717a' }}
                        />
                        <span>{col.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold text-zinc-700">Quantity:</span>
                <div className="flex items-center border border-zinc-300 rounded-xl overflow-hidden bg-white shadow-xs">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 font-bold"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-zinc-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(Number(selectedColor?.stock ?? product.stock ?? 99), quantity + 1))}
                    className="w-9 h-9 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 font-bold"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-zinc-600">
                  ({selectedColor?.stock !== undefined ? selectedColor.stock : product.stock} available)
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={isOutOfStock}
                onClick={() => {
                  onAddToCart(
                    product,
                    quantity,
                    selectedColor ? { name: selectedColor.name, code: selectedColor.code, image_url: selectedColor.image_url } : undefined
                  );
                  onClose();
                }}
                className="py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-300 flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Cart
              </button>

              <button
                disabled={isOutOfStock}
                onClick={() => {
                  onBuyNow(
                    product,
                    quantity,
                    selectedColor ? { name: selectedColor.name, code: selectedColor.code, image_url: selectedColor.image_url } : undefined
                  );
                  onClose();
                }}
                className="py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-zinc-950 hover:bg-zinc-800 text-white flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md disabled:opacity-50"
              >
                Buy Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
