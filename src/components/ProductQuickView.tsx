import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Check,
  ArrowRight,
  Share2,
  Star,
  MessageSquare,
  CheckCircle2,
  User,
  Sparkles,
  Send,
  Heart,
  ExternalLink,
} from 'lucide-react';
import { Product, Review } from '../types';
import { getProductSlug, SITE_URL } from '../utils/seo';
import { storeService } from '../services/storeService';
import { ProductDescriptionSection } from './ProductDescriptionSection';

interface ProductQuickViewProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, selectedColor?: { name: string; code?: string; image_url?: string }) => void;
  onBuyNow: (product: Product, quantity: number, selectedColor?: { name: string; code?: string; image_url?: string }) => void;
  initialTab?: 'details' | 'reviews';
  onReviewSubmitted?: () => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor (খারাপ)',
  2: 'Fair (মোটামুটি)',
  3: 'Good (ভালো)',
  4: 'Very Good (খুব ভালো)',
  5: 'Excellent (চমৎকার)',
};

export const ProductQuickView: React.FC<ProductQuickViewProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
  initialTab = 'details',
  onReviewSubmitted,
  isWishlisted = false,
  onToggleWishlist,
}) => {
  if (!product) return null;

  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>(initialTab);
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const [selectedColor, setSelectedColor] = useState<{ name: string; code?: string; stock?: number; image_url?: string } | null>(
    product.colors && product.colors.length > 0 ? product.colors[0] : null
  );
  const [selectedImage, setSelectedImage] = useState<string>(
    (product.colors && product.colors[0]?.image_url) || product.image_url || (product.images && product.images[0]) || ""
  );

  // Review System State
  const [productReviews, setProductReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState<string>('');
  const [reviewErrorMessage, setReviewErrorMessage] = useState<string>('');

  // Sync tab if initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      if (initialTab === 'reviews') {
        setShowReviewForm(false);
      }
    }
  }, [initialTab, product.id]);

  // Load reviews for this product
  const loadReviews = async () => {
    if (!product.id) return;
    setLoadingReviews(true);
    try {
      const revs = await storeService.getReviews(product.id);
      setProductReviews(revs);
    } catch (err) {
      console.warn('Error loading product reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [product.id]);

  // Listen to external review changes
  useEffect(() => {
    const handleUpdate = () => {
      loadReviews();
    };
    window.addEventListener('maxora_reviews_updated', handleUpdate);
    return () => window.removeEventListener('maxora_reviews_updated', handleUpdate);
  }, [product.id]);

  // Compute average rating & total reviews
  const { averageRating, reviewCount } = useMemo(() => {
    if (!productReviews.length) return { averageRating: 0, reviewCount: 0 };
    const sum = productReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return {
      averageRating: Number((sum / productReviews.length).toFixed(1)),
      reviewCount: productReviews.length,
    };
  }, [productReviews]);

  // Handle Review Submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.id) return;

    const cleanComment = comment.trim();
    if (!cleanComment) {
      setReviewErrorMessage('Please write a short comment about this product.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewErrorMessage('');
    try {
      const res = await storeService.addReview({
        product_id: product.id,
        rating,
        comment: cleanComment,
        user_name: userName.trim() || 'Verified Customer',
      });

      if (res.success) {
        setReviewSuccessMessage('Thank you! Your review has been posted successfully.');
        setComment('');
        setRating(5);
        setUserName('');
        setShowReviewForm(false);
        loadReviews();
        if (onReviewSubmitted) {
          onReviewSubmitted();
        }
        setTimeout(() => {
          setReviewSuccessMessage('');
        }, 4000);
      } else {
        setReviewErrorMessage(res.error || 'Failed to submit review. Please try again.');
      }
    } catch (err: any) {
      setReviewErrorMessage(err?.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

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
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl overflow-y-auto md:overflow-hidden shadow-2xl border border-zinc-200 max-h-[94vh] flex flex-col md:flex-row"
      >
        {/* Header Action Buttons */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 sm:gap-2">
          <a
            href={`/product/${getProductSlug(product)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-full bg-white/95 border border-zinc-200 hover:bg-zinc-100 flex items-center gap-1.5 text-zinc-700 hover:text-emerald-700 transition-colors shadow-sm text-xs font-bold"
            title="Open in separate tab (আলাদা ট্যাবে খুলুন)"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Open in Tab</span>
          </a>

          <button
            type="button"
            onClick={() => onToggleWishlist?.(product)}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border transition-all flex items-center justify-center shadow-sm cursor-pointer ${
              isWishlisted
                ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                : 'bg-white/95 border-zinc-200 text-zinc-600 hover:text-rose-600 hover:bg-zinc-100'
            }`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            title={isWishlisted ? 'Remove from Saved Items' : 'Save to Wishlist'}
          >
            <Heart
              className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform ${
                isWishlisted ? 'fill-rose-500 text-rose-500 scale-110' : ''
              }`}
            />
          </button>

          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-700 transition-colors shadow-sm cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Product Media Column */}
        <div className="w-full md:w-1/2 p-3.5 sm:p-6 bg-zinc-50 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-200 shrink-0">
          <div>
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
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
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

          {/* Quick Rating badge in media column */}
          <div className="mt-4 pt-3 border-t border-zinc-200/80 flex items-center justify-between text-xs text-zinc-600">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span className="font-bold text-zinc-900">
                {reviewCount > 0 ? `${averageRating} / 5` : 'No reviews yet'}
              </span>
              <span className="text-zinc-500">
                ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('reviews');
                setShowReviewForm(true);
              }}
              className="text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              + Write Review
            </button>
          </div>
        </div>

        {/* Product Info & Reviews Column */}
        <div className="w-full md:w-1/2 flex flex-col justify-between overflow-hidden">
          {/* Header Segmented Tabs */}
          <div className="flex border-b border-zinc-200 bg-zinc-50/70 p-1.5 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'details'
                  ? 'bg-white text-zinc-950 shadow-xs border border-zinc-200/80'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-600" />
              <span>Product Details</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'reviews'
                  ? 'bg-white text-zinc-950 shadow-xs border border-zinc-200/80'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>Reviews & Ratings ({reviewCount})</span>
            </button>
          </div>

          {/* TAB 1: PRODUCT DETAILS */}
          {activeTab === 'details' && (
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col justify-between">
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

                <h2 className="text-xl sm:text-2xl font-black text-zinc-900 leading-snug mb-1.5">
                  {product.name}
                </h2>

                {/* Rating Bar with Direct Click to Reviews */}
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className="flex items-center gap-2 mb-3 group/rev cursor-pointer"
                  title="View reviews and customer feedback"
                >
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= Math.round(averageRating)
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-zinc-200 fill-zinc-100'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-extrabold text-zinc-900">
                    {reviewCount > 0 ? averageRating.toFixed(1) : 'No reviews'}
                  </span>
                  <span className="text-xs text-zinc-500 font-medium group-hover/rev:text-emerald-700 underline underline-offset-2">
                    ({reviewCount} customer review{reviewCount === 1 ? '' : 's'})
                  </span>
                </button>

                {product.sku && (
                  <div className="text-xs text-zinc-500 font-mono mb-3">
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
                      <span className="text-sm font-semibold text-zinc-500 line-through">
                        ৳{sellingPrice.toLocaleString('en-BD')}
                      </span>
                      <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                        Save ৳{discount.toLocaleString('en-BD')}
                      </span>
                    </>
                  )}
                </div>

                {/* Professional Product Description & Details */}
                <div className="mb-5">
                  <ProductDescriptionSection product={product} />
                </div>

                {/* Reassurance points */}
                <div className="space-y-2 text-xs text-zinc-700 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/60 mb-4">
                  <div className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                    <span>Cash on Delivery available inside & outside Dhaka</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                    <span>7 days easy return & replacement warranty</span>
                  </div>
                </div>

                {/* Share Links */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-zinc-50 rounded-xl border border-zinc-200/80 mb-4">
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
                        <span>Link copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Copy Link</span>
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
                    >
                      WhatsApp
                    </a>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                      Facebook
                    </a>
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      className="p-1 rounded-lg text-xs bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action buttons (Add to Cart, Buy Now) */}
              <div>
                {/* Color Variants Selection */}
                {Array.isArray(product.colors) && product.colors.length > 0 && (
                  <div className="mb-3.5 p-3 bg-purple-50/70 rounded-2xl border border-purple-200/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-purple-950">
                        Select Color:
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
                  <div className="flex items-center gap-3 mb-3.5">
                    <span className="text-xs font-bold text-zinc-700">Quantity:</span>
                    <div className="flex items-center border border-zinc-300 rounded-xl overflow-hidden bg-white shadow-xs">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-9 h-9 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 font-bold cursor-pointer"
                      >
                        −
                      </button>
                      <span className="w-10 text-center font-bold text-sm text-zinc-900">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(Number(selectedColor?.stock ?? product.stock ?? 99), quantity + 1))}
                        className="w-9 h-9 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-zinc-600">
                      ({selectedColor?.stock !== undefined ? selectedColor.stock : product.stock} in stock)
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onToggleWishlist?.(product)}
                    className={`p-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer ${
                      isWishlisted
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 shadow-2xs'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200'
                    }`}
                    title={isWishlisted ? "Remove from Saved Items" : "Save to Wishlist"}
                    aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart className={`w-5 h-5 transition-transform ${isWishlisted ? 'fill-rose-500 text-rose-500 scale-110' : ''}`} />
                  </button>

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
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-300 flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
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
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-zinc-950 hover:bg-zinc-800 text-white flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md disabled:opacity-50"
                  >
                    Buy Now
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOMER REVIEWS & WRITE A REVIEW */}
          {activeTab === 'reviews' && (
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col justify-between">
              <div>
                {/* Rating Summary Header Banner */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-zinc-950">
                          {reviewCount > 0 ? averageRating.toFixed(1) : '0.0'}
                        </span>
                        <span className="text-xs font-semibold text-zinc-500">out of 5</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= Math.round(averageRating)
                                ? 'fill-amber-400 text-amber-500'
                                : 'text-amber-200 fill-amber-100'
                            }`}
                          />
                        ))}
                        <span className="text-xs font-bold text-amber-950 ml-1.5">
                          {reviewCount} Verified {reviewCount === 1 ? 'Review' : 'Reviews'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="px-4 py-2.5 rounded-xl font-bold text-xs bg-zinc-950 hover:bg-zinc-800 text-white transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-auto"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{showReviewForm ? 'Cancel Review' : 'Write a Review'}</span>
                    </button>
                  </div>
                </div>

                {/* Review Success Banner */}
                {reviewSuccessMessage && (
                  <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{reviewSuccessMessage}</span>
                  </div>
                )}

                {/* Review Error Banner */}
                {reviewErrorMessage && (
                  <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-medium flex items-center gap-2 animate-fade-in">
                    <X className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{reviewErrorMessage}</span>
                  </div>
                )}

                {/* WRITE A REVIEW FORM */}
                {showReviewForm && (
                  <form
                    onSubmit={handleSubmitReview}
                    className="bg-white border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 mb-5 shadow-sm space-y-3.5 animate-fade-in"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                      <h3 className="font-extrabold text-sm text-zinc-900 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                        Write a Customer Review
                      </h3>
                      <span className="text-[11px] text-zinc-500 font-medium">1-5 Star Rating</span>
                    </div>

                    {/* 1-5 Star Selector */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                        Rating (রেটিং নির্বাচন করুন): <span className="text-amber-600 font-extrabold">{RATING_LABELS[hoverRating || rating]}</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled = star <= (hoverRating || rating);
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="p-1 rounded-lg hover:scale-115 transition-transform cursor-pointer focus:outline-none"
                              aria-label={`Rate ${star} star`}
                            >
                              <Star
                                className={`w-6 h-6 transition-colors ${
                                  isFilled
                                    ? 'fill-amber-400 text-amber-500 drop-shadow-xs'
                                    : 'text-zinc-300 hover:text-amber-400'
                                }`}
                              />
                            </button>
                          );
                        })}
                        <span className="text-xs font-bold text-zinc-600 ml-2">
                          ({hoverRating || rating} / 5)
                        </span>
                      </div>
                    </div>

                    {/* Customer Name */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Your Name (আপনার নাম):
                      </label>
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="e.g. Tanvir Ahmed (or leave empty for Verified Customer)"
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all"
                        maxLength={50}
                      />
                    </div>

                    {/* Short Text Comment */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Short Review Comment (সংক্ষিপ্ত মন্তব্য): <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your honest feedback about display quality, durability, delivery, or experience..."
                        className="w-full text-xs px-3.5 py-2 rounded-xl border border-zinc-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all resize-none"
                        maxLength={400}
                      />
                      <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                        <span>Be helpful to other customers</span>
                        <span>{comment.length}/400 chars</span>
                      </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingReview || !comment.trim()}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmittingReview ? (
                          <span>Posting...</span>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Review</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* REVIEWS LIST */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
                    <span className="text-xs font-extrabold text-zinc-800">
                      Customer Feedback ({productReviews.length})
                    </span>
                    <span className="text-[11px] text-zinc-500">Most recent</span>
                  </div>

                  {loadingReviews ? (
                    <div className="py-8 text-center text-xs text-zinc-400">
                      Loading customer reviews...
                    </div>
                  ) : productReviews.length > 0 ? (
                    productReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition-colors space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                              {rev.user_name ? rev.user_name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-xs text-zinc-900">
                                  {rev.user_name || 'Verified Customer'}
                                </span>
                                {rev.verified_purchase !== false && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                                    Verified
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-zinc-600">
                                {rev.created_at
                                  ? new Date(rev.created_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })
                                  : 'Recent'}
                              </span>
                            </div>
                          </div>

                          {/* Review Stars */}
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= (rev.rating || 5)
                                    ? 'fill-amber-400 text-amber-500'
                                    : 'text-zinc-200 fill-zinc-100'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Review Comment Text */}
                        <p className="text-xs text-zinc-700 leading-relaxed pl-9">
                          {rev.comment}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center px-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-300">
                      <MessageSquare className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-zinc-800 mb-1">
                        No reviews yet for this product
                      </p>
                      <p className="text-[11px] text-zinc-500 mb-3">
                        Have you used this product? Be the first customer to share your thoughts!
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(true)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>Write the First Review</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom bar inside reviews tab */}
              <div className="pt-3 border-t border-zinc-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className="text-xs font-bold text-zinc-700 hover:text-zinc-950 flex items-center gap-1 cursor-pointer"
                >
                  ← Back to Details
                </button>

                <button
                  disabled={isOutOfStock}
                  onClick={() => {
                    onAddToCart(product, quantity, selectedColor ? { name: selectedColor.name, code: selectedColor.code, image_url: selectedColor.image_url } : undefined);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-950 hover:bg-zinc-800 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add to Cart (৳{finalPrice.toLocaleString('en-BD')})</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
