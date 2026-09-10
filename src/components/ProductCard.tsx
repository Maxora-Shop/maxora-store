import React from 'react';
import { ShoppingBag, Eye, Check, Star, Heart, ExternalLink } from 'lucide-react';
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
  const sellingPrice = Number(product.selling_price || 0);
  const discount = Number(product.discount || 0);
  const finalPrice = Math.max(0, sellingPrice - discount);
  const hasDiscount = discount > 0;
  const isOutOfStock = Number(product.stock || 0) <= 0;
  const isLowStock = Number(product.stock || 0) > 0 && Number(product.stock || 0) <= 5;

  const productSlug = getProductSlug(product);
  const productPath = `/product/${productSlug}`;
  const imageAlt = `${product.name}${product.sku ? ` - ${product.sku}` : ''}`;

  const displayImage = product.image_url || (product.images && product.images[0]) || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80";

  return (
    <div className="group bg-white rounded-2xl border border-zinc-200/90 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
      {/* Product Image Area */}
      <a
        href={productPath}
        target="_blank"
        rel="noopener noreferrer"
        className="relative aspect-square bg-zinc-100 overflow-hidden cursor-pointer block"
        aria-label={`View details for ${product.name}`}
        title={`Open ${product.name} in separate tab`}
      >
        <img
          src={displayImage}
          alt={imageAlt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80";
          }}
        />

        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
          {product.badge && (
            <span className="bg-zinc-950/90 text-emerald-400 font-extrabold text-[9px] sm:text-[10px] uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md shadow-sm backdrop-blur-xs">
              {product.badge}
            </span>
          )}
          {hasDiscount && (
            <span className="bg-rose-600 text-white font-extrabold text-[9px] sm:text-[10px] tracking-wide px-2 py-0.5 rounded-md shadow-sm">
              SAVE ৳{discount.toLocaleString('en-BD')}
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
          className={`absolute top-2.5 right-2.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full shadow-md flex items-center justify-center z-20 transition-all cursor-pointer ${
            isWishlisted
              ? 'bg-white text-rose-500 scale-105 border border-rose-200'
              : 'bg-white/90 hover:bg-white text-zinc-500 hover:text-rose-500 hover:scale-105 border border-zinc-200/70'
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

        {/* Mobile Quick Action Buttons (visible on mobile, positioned below heart) */}
        <div className="sm:hidden absolute top-12 right-2.5 flex flex-col gap-1.5 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onQuickView(product);
            }}
            className="w-8 h-8 rounded-full bg-white/95 shadow-md flex items-center justify-center text-zinc-800 active:scale-90 transition-transform cursor-pointer border border-zinc-200/80"
            aria-label="Quick View in modal"
            title="Quick View"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Quick View & Open in Tab Buttons overlay (Desktop hover) */}
        <div className="hidden sm:flex absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center gap-2 p-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onQuickView(product);
            }}
            className="bg-white/95 hover:bg-white text-zinc-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 hover:scale-105 transition-all cursor-pointer"
            title="Quick View in preview modal"
          >
            <Eye className="w-3.5 h-3.5 text-zinc-700" />
            <span>Quick View</span>
          </button>
          <span
            className="bg-zinc-950/90 hover:bg-zinc-950 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 hover:scale-105 transition-all"
            title="Click card to open in separate tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            <span>New Tab</span>
          </span>
        </div>

        {/* Out of stock overlay banner */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-zinc-950 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-zinc-700">
              Sold Out
            </span>
          </div>
        )}
      </a>

      {/* Product Content Area */}
      <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & SKU */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            <span className="truncate">{product.category || "Essentials"}</span>
            {product.sku && <span className="text-zinc-400 font-mono hidden sm:inline">{product.sku}</span>}
          </div>

          {/* Average Rating Display */}
          <div className="flex items-center gap-1.5 mb-1.5">
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
              href={productPath}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-zinc-900 text-xs sm:text-base line-clamp-2 hover:text-emerald-700 transition-colors cursor-pointer block"
              title={`Open ${product.name} in separate tab`}
            >
              {product.name}
            </a>
          </h3>

          {/* Stock Indicator */}
          <div className="mb-2">
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
        <div>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mb-2.5 sm:mb-3.5">
            <span className="text-base sm:text-xl font-black text-zinc-950">
              ৳{finalPrice.toLocaleString('en-BD')}
            </span>
            {hasDiscount && (
              <span className="text-[11px] sm:text-sm font-semibold text-zinc-400 line-through">
                ৳{sellingPrice.toLocaleString('en-BD')}
              </span>
            )}
          </div>

          <button
            disabled={isOutOfStock}
            onClick={() => onAddToCart(product)}
            className={`w-full min-h-[42px] sm:min-h-[44px] py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
              isOutOfStock
                ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                : isAdded
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-zinc-950 hover:bg-zinc-800 text-white active:scale-95 shadow-sm"
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
