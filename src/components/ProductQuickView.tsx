import React, { useState } from 'react';
import { X, ShoppingBag, Truck, ShieldCheck, Check, ArrowRight } from 'lucide-react';
import { Product } from '../types';

interface ProductQuickViewProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
}

export const ProductQuickView: React.FC<ProductQuickViewProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
}) => {
  if (!product) return null;

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string>(
    product.image_url || (product.images && product.images[0]) || ""
  );

  const allImages = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image_url].filter(Boolean);

  const sellingPrice = Number(product.selling_price || 0);
  const discount = Number(product.discount || 0);
  const finalPrice = Math.max(0, sellingPrice - discount);
  const hasDiscount = discount > 0;
  const isOutOfStock = Number(product.stock || 0) <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 max-h-[90vh] flex flex-col md:flex-row">
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
              alt={product.name}
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
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
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
            <div className="text-xs sm:text-sm text-zinc-700 leading-relaxed mb-6">
              {product.description || "High quality guaranteed. Designed for durability and performance."}
            </div>

            {/* Reassurance points */}
            <div className="space-y-2 text-xs text-zinc-700 bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/60 mb-6">
              <div className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                <span>Cash on Delivery available inside & outside Dhaka</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                <span>7 days return & exchange policy</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div>
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
                    onClick={() => setQuantity(Math.min(Number(product.stock || 99), quantity + 1))}
                    className="w-9 h-9 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 font-bold"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-zinc-600">
                  ({product.stock} available)
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={isOutOfStock}
                onClick={() => {
                  onAddToCart(product, quantity);
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
                  onBuyNow(product, quantity);
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
