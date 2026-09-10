import React, { useState } from 'react';
import { ShoppingBag, Eye, Check, Star, Heart, ExternalLink, Package } from 'lucide-react';
import { Product, ProductRatingStats } from '../types';
import { getProductSlug } from '../utils/seo';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product, initialTab?: 'details' | 'reviews') => void;
  isAdded?: boolean;
  ratingStats?: ProductRatingStats;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onQuickView,
  isAdded = false,
  ratingStats,
  isWishlisted = false,
  onToggleWishlist,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  const sellingPrice = Number(product.selling_price || 0);
  const discount = Number(product.discount || 0);
  const finalPrice = Math.max(0, sellingPrice - discount);
  const hasDiscount = discount > 0;
  const isOutOfStock = Number(product.stock || 0) <= 0;
  const isLowStock = Number(product.stock || 0) > 0 && Number(product.stock || 0) <= 5;

  const productSlug = getProductSlug(product);
  const fullProductUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/product/${productSlug}`
    : `/product/${productSlug}`;
  const imageAlt = `${product.name}${product.sku ? ` - ${product.sku}` : ''}`;

  const rawImage = product.image_url || (product.images && product.images[0]) || '';

  // Calculate discount percentage if applicable
  const discountPercent = sellingPrice > 0 && discount > 0 ? Math.round((discount / sellingPrice) * 100) : 0;

  const handleProductLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If user clicked with Ctrl/Cmd or middle mouse, let browser open new tab natively
    if (e.metaKey || e.ctrlKey || e.button === 1) {
      return;
    }
    // Attempt window.open for separate tab
    let opened: Window | null = null;
    try {
      opened = window.open(fullProductUrl, '_blank', 'noopener,noreferrer');
    } catch {
      opened = null;
    }
    // If popup was blocked by browser or sandboxed iframe preview, smoothly open details modal
    if (!opened || opened.closed || typeof opened.closed === 'undefined') {
      onQuickView(product);
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-zinc-200/90 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between hover:-translate-y-0.5 h-full">
      {/* Product Image Area */}
      <div className="relative aspect-square bg-zinc-50/50 border-b border-zinc-100 flex items-center justify-center p-3 sm:p-4 overflow-hidden group/image">
        <a
          href={fullProductUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleProductLinkClick}
          className="w-full h-full flex items-center justify-center cursor-pointer"
          aria-label={`View details for ${product.name}`}
          title={`Open ${product.name} in separate tab`}
        >
          {!imageFailed && rawImage ? (
            <img
              src={rawImage}
              alt={imageAlt}
              className="max-w-full max-h-full w-auto h-auto object-contain group-hover/image:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-50 rounded-xl text-zinc-400 p-2 text-center">
              <Package className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-300 mb-1" />
              <span className="text-[10px] sm:text-xs font-semibold text-zinc-400">Maxora Product</span>
            </div>
          )}
        </a>

        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none max-w-[65%]">
          {product.badge && (
            <span className="bg-zinc-950/90 text-emerald-400 font-extrabold text-[9px] sm:text-[10px] uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md shadow-xs backdrop-blur-xs truncate">
              {product.badge}
            </span>
          )}
          {hasDiscount && (
            <span className="bg-rose-600 text-white font-extrabold text-[9px] sm:text-[10px] tracking-wide px-2 py-0.5 rounded-md shadow-xs">
              {discountPercent > 0 ? `-${discountPercent}%` : `SAVE ৳${discount.toLocaleString('en-BD')}`}
            </span>
          )}
        </div>

        {/* Wishlist Heart Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (onToggleWishlist) {
              onToggleWishlist(product);
            }
          }}
          className={`absolute top-2.5 right-2.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full shadow-xs flex items-center justify-center z-20 transition-all cursor-pointer ${
            isWishlisted
              ? 'bg-white text-rose-500 scale-105 border border-rose-200'
              : 'bg-white/90 hover:bg-white text-zinc-500 hover:text-rose-500 hover:scale-105 border border-zinc-200/80'
          }`}
          aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
          title={isWishlisted ? "Remove from Saved Items" : "Save to Wishlist"}
        >
          <Heart
            className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-all ${
              isWishlisted
                ? 'fill-rose-500 text-rose-500 scale-110'
                : 'stroke-[2]'
            }`}
          />
        </button>

        {/* Desktop Quick View & Open in Tab Overlay (on hover) */}
        <div className="hidden sm:flex absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center gap-2 p-3 pointer-events-none">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onQuickView(product);
            }}
            className="pointer-events-auto bg-white hover:bg-zinc-100 text-zinc-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 hover:scale-105 transition-all cursor-pointer"
            title="Quick View product details"
          >
            <Eye className="w-3.5 h-3.5 text-zinc-700" />
            <span>Quick View</span>
          </button>
          <a
            href={fullProductUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleProductLinkClick}
            className="pointer-events-auto bg-zinc-950 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 hover:scale-105 transition-all cursor-pointer"
            title="Open product in separate browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            <span>New Tab</span>
          </a>
        </div>

        {/* Mobile Quick Action Buttons */}
        <div className="sm:hidden absolute bottom-2 right-2 z-20 flex items-center gap-1">
          <a
            href={fullProductUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleProductLinkClick}
            className="w-7 h-7 rounded-full bg-zinc-950 text-white shadow-xs flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
            title="Open in new tab"
            aria-label="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
          </a>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onQuickView(product);
            }}
            className="w-7 h-7 rounded-full bg-white/95 shadow-xs flex items-center justify-center text-zinc-800 active:scale-90 transition-transform cursor-pointer border border-zinc-200/80"
            aria-label="Quick View in modal"
            title="Quick View"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Out of stock overlay banner */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center pointer-events-none">
            <span className="bg-zinc-950 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border border-zinc-700">
              Stock Out
            </span>
          </div>
        )}
      </div>

      {/* Product Content Area */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & SKU */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            <span className="truncate">{product.category || "Essentials"}</span>
            {product.sku && <span className="text-zinc-400 font-mono hidden sm:inline">{product.sku}</span>}
          </div>

          {/* Average Rating Display */}
          <div className="flex items-center gap-1.5 mb-1.5 min-h-[20px]">
            {ratingStats && ratingStats.count > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onQuickView(product, 'reviews');
                }}
                className="inline-flex items-center gap-1 hover:opacity-85 transition-opacity cursor-pointer group/rating text-left"
                title={`${ratingStats.average.toFixed(1)} out of 5 stars (${ratingStats.count} review${ratingStats.count > 1 ? 's' : ''})`}
              >
                <div className="flex items-center">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                </div>
                <span className="text-xs font-black text-zinc-900">
                  {ratingStats.average.toFixed(1)}
                </span>
                <span className="text-[10px] sm:text-[11px] text-zinc-500 font-medium group-hover/rating:text-amber-700">
                  ({ratingStats.count})
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onQuickView(product, 'reviews');
                }}
                className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-zinc-400 hover:text-amber-600 transition-colors cursor-pointer text-left"
                title="No reviews yet. Be the first to review!"
              >
                <Star className="w-3 h-3 text-zinc-300" />
                <span>No reviews yet</span>
              </button>
            )}
          </div>

          {/* Product Name */}
          <h3 className="mb-1.5 leading-snug">
            <a
              href={fullProductUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleProductLinkClick}
              className="font-bold text-zinc-900 text-xs sm:text-sm line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] hover:text-emerald-700 transition-colors cursor-pointer block"
              title={`Open ${product.name} in separate tab`}
            >
              {product.name}
            </a>
          </h3>

          {/* Stock Indicator */}
          <div className="mb-2 min-h-[18px]">
            {isOutOfStock ? (
              <span className="text-[10px] sm:text-[11px] font-semibold text-rose-600">
                Stock Out
              </span>
            ) : isLowStock ? (
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                Only {product.stock} left!
              </span>
            ) : (
              <span className="text-[10px] sm:text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                In Stock ({product.stock})
              </span>
            )}
          </div>

          {/* Color Variants Swatches */}
          {Array.isArray(product.colors) && product.colors.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="flex items-center -space-x-1">
                {product.colors.slice(0, 5).map((c, i) => (
                  <span
                    key={i}
                    title={c.name}
                    className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs inline-block"
                    style={{ backgroundColor: c.code || '#52525b' }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-zinc-500 font-semibold">
                {product.colors.length} {product.colors.length === 1 ? 'color' : 'colors'}
              </span>
            </div>
          )}
        </div>

        {/* Pricing & Add to Cart button */}
        <div className="pt-2">
          <div className="flex items-baseline gap-1.5 sm:gap-2 mb-2.5 sm:mb-3 min-h-[26px]">
            <span className="text-base sm:text-lg font-black text-zinc-950">
              ৳{finalPrice.toLocaleString('en-BD')}
            </span>
            {hasDiscount && (
              <span className="text-[11px] sm:text-xs font-semibold text-zinc-400 line-through">
                ৳{sellingPrice.toLocaleString('en-BD')}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => onAddToCart(product)}
            className={`w-full min-h-[40px] sm:min-h-[44px] py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
              isOutOfStock
                ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                : isAdded
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-zinc-950 hover:bg-zinc-800 text-white active:scale-98 shadow-xs"
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>Added</span>
              </>
            ) : isOutOfStock ? (
              <span>Out of Stock</span>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
