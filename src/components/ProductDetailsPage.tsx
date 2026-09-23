import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShoppingBag,
  ShoppingCart,
  Zap,
  Heart,
  Share2,
  Check,
  Truck,
  ShieldCheck,
  RotateCcw,
  Star,
  ChevronRight,
  Home,
  Copy,
  ExternalLink,
  MessageCircle,
  SlidersHorizontal,
  FileText,
  Package,
  Info,
  Maximize2,
  X,
  ChevronLeft,
  AlertCircle,
  ArrowRight,
  Phone,
  Sparkles,
  Send,
  User,
  Tag,
  Flame,
  Camera,
  Image as ImageIcon,
  Play,
  Film,
} from 'lucide-react';
import { Product, StoreSettings, Review, ProductRatingStats } from '../types';
import { getProductSlug } from '../utils/seo';
import { parseProductDescription } from '../utils/productDescriptionParser';
import { sanitizeSafeHtml } from '../utils/sanitizeHtml';
import { storeService } from '../services/storeService';
import { ProductCard } from './ProductCard';
import { recordProductView } from '../utils/recentViews';
import { RecentlyViewedSection } from './RecentlyViewedSection';
import { DeliveryEstimator } from './DeliveryEstimator';
import { ProductVideoModal, getEmbedUrl } from './ProductVideoModal';
import { FrequentlyBoughtTogether } from './FrequentlyBoughtTogether';

interface ProductDetailsPageProps {
  product: Product;
  settings: StoreSettings;
  allProducts: Product[];
  onAddToCart: (
    product: Product,
    quantity: number,
    selectedColor?: { name: string; code?: string; image_url?: string }
  ) => void;
  onBuyNow: (
    product: Product,
    quantity: number,
    selectedColor?: { name: string; code?: string; image_url?: string }
  ) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
  ratingStats?: ProductRatingStats;
  ratingStatsMap?: Record<string, ProductRatingStats>;
  wishlistIds?: string[];
  onBackToHome: () => void;
  onSelectProduct: (product: Product) => void;
  initialTab?: 'details' | 'reviews';
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor (খারাপ)',
  2: 'Fair (মোটামুটি)',
  3: 'Good (ভালো)',
  4: 'Very Good (খুব ভালো)',
  5: 'Excellent (চমৎকার)',
};

export const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
  product,
  settings,
  allProducts,
  onAddToCart,
  onBuyNow,
  isWishlisted = false,
  onToggleWishlist,
  ratingStats,
  ratingStatsMap = {},
  wishlistIds = [],
  onBackToHome,
  onSelectProduct,
  initialTab = 'details',
}) => {
  // Description parser
  const parsedDescription = useMemo(() => {
    return parseProductDescription(product.description, product);
  }, [product]);

  // Gallery images resolution
  const galleryImages = useMemo(() => {
    const list: string[] = [];
    if (product.image_url) list.push(product.image_url);
    if (Array.isArray(product.images)) {
      product.images.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    if (Array.isArray(product.colors)) {
      product.colors.forEach((col) => {
        if (col.image_url && !list.includes(col.image_url)) {
          list.push(col.image_url);
        }
      });
    }
    return list.length > 0
      ? list
      : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'];
  }, [product]);

  // State
  const [selectedImage, setSelectedImage] = useState<string>(galleryImages[0]);
  const [selectedColor, setSelectedColor] = useState<{
    name: string;
    code?: string;
    stock?: number;
    image_url?: string;
  } | null>(product.colors && product.colors.length > 0 ? product.colors[0] : null);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSkuCopied, setIsSkuCopied] = useState<boolean>(false);
  const [showShareMenu, setShowShareMenu] = useState<boolean>(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [isAddedFeedback, setIsAddedFeedback] = useState<boolean>(false);

  // Zoom magnifier states
  const [isZooming, setIsZooming] = useState<boolean>(false);
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewHoverRating, setReviewHoverRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewerName, setReviewerName] = useState<string>('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string>('');
  const [reviewErrorMsg, setReviewErrorMsg] = useState<string>('');

  // Customer photo lightbox modal state
  const [activePhotoModal, setActivePhotoModal] = useState<{
    isOpen: boolean;
    photoIndex: number;
  }>({ isOpen: false, photoIndex: 0 });

  const descriptionSectionRef = useRef<HTMLDivElement>(null);
  const reviewsSectionRef = useRef<HTMLDivElement>(null);

  // Record this product view in user's recent history
  useEffect(() => {
    if (product.id) {
      recordProductView(product.id);
    }
  }, [product.id]);

  // Synchronize initial image & color when product changes
  useEffect(() => {
    const firstImg =
      (product.colors && product.colors[0]?.image_url) ||
      product.image_url ||
      (product.images && product.images[0]) ||
      galleryImages[0];
    setSelectedImage(firstImg);
    setSelectedColor(product.colors && product.colors.length > 0 ? product.colors[0] : null);
    setQuantity(1);
    setIsAddedFeedback(false);
    setShowShareMenu(false);
  }, [product.id, galleryImages]);

  // Load reviews from service
  const loadProductReviews = async () => {
    if (!product.id) return;
    setLoadingReviews(true);
    try {
      const data = await storeService.getReviews(product.id);
      setReviews(data);
    } catch (e) {
      console.warn('Could not load reviews:', e);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadProductReviews();
  }, [product.id]);

  useEffect(() => {
    const handleReviewsUpdated = () => {
      loadProductReviews();
    };
    window.addEventListener('maxora_reviews_updated', handleReviewsUpdated);
    return () => window.removeEventListener('maxora_reviews_updated', handleReviewsUpdated);
  }, [product.id]);

  // Handle initial tab request (e.g. user clicked rating from card)
  useEffect(() => {
    if (initialTab === 'reviews') {
      setActiveTab('reviews');
      setTimeout(() => {
        reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [initialTab]);

  // Pricing calculations
  const sellingPrice = Number(product.selling_price || 0);
  const discount = Number(product.discount || 0);
  const finalPrice = Math.max(0, sellingPrice - discount);
  const hasDiscount = discount > 0;
  const discountPercent =
    sellingPrice > 0 && discount > 0 ? Math.round((discount / sellingPrice) * 100) : 0;

  // Stock calculations
  const effectiveStock = selectedColor?.stock !== undefined ? selectedColor.stock : Number(product.stock || 0);
  const isOutOfStock = effectiveStock <= 0;
  const isLowStock = effectiveStock > 0 && effectiveStock <= 5;

  // Product URL for sharing
  const productSlug = getProductSlug(product);
  const fullProductUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/product/${productSlug}`
      : `https://maxorashopbd.com/product/${productSlug}`;

  // Average Rating
  const effectiveRating = useMemo(() => {
    if (ratingStats && ratingStats.count > 0) {
      return { average: ratingStats.average, count: ratingStats.count };
    }
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
      return {
        average: Number((sum / reviews.length).toFixed(1)),
        count: reviews.length,
      };
    }
    return { average: 5.0, count: 0 };
  }, [ratingStats, reviews]);

  // Handle quantity changes
  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (effectiveStock > 0 && next > effectiveStock) return effectiveStock;
      return next;
    });
  };

  // Color selection
  const handleColorSelect = (color: { name: string; code?: string; stock?: number; image_url?: string }) => {
    setSelectedColor(color);
    if (color.image_url) {
      setSelectedImage(color.image_url);
    }
  };

  // Magnifier zoom handler on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setZoomPos({ x, y });
  };

  // Add to cart click
  const handleAddToCartClick = () => {
    if (isOutOfStock) return;
    onAddToCart(product, quantity, selectedColor || undefined);
    setIsAddedFeedback(true);
    setTimeout(() => {
      setIsAddedFeedback(false);
    }, 2000);
  };

  // Buy now click
  const handleBuyNowClick = () => {
    if (isOutOfStock) return;
    onBuyNow(product, quantity, selectedColor || undefined);
  };

  // Copy link
  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(fullProductUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  // Copy SKU
  const handleCopySku = () => {
    if (!product.sku) return;
    try {
      navigator.clipboard.writeText(product.sku);
      setIsSkuCopied(true);
      setTimeout(() => setIsSkuCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // WhatsApp deep link for mobile product inquiry
  const whatsappUrl = useMemo(() => {
    const rawWaNum = (settings.whatsapp || settings.ai_whatsapp_number || settings.phone || '').replace(/[^0-9]/g, '');
    if (!rawWaNum) return null;
    const formattedNum = rawWaNum.startsWith('88') ? rawWaNum : `88${rawWaNum}`;
    const text = `হ্যালো Maxora, আমি "${product.name}" (৳${finalPrice}) প্রোডাক্টটি সম্পর্কে জানতে চাচ্ছি। লিংক: ${fullProductUrl}`;
    return `https://wa.me/${formattedNum}?text=${encodeURIComponent(text)}`;
  }, [settings.whatsapp, settings.ai_whatsapp_number, settings.phone, product.name, finalPrice, fullProductUrl]);

  // Native share or copy fallback
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on Maxora Bangladesh!`,
          url: fullProductUrl,
        });
      } catch {
        // User cancelled or not supported
      }
    } else {
      setShowShareMenu((prev) => !prev);
    }
  };

  // Flatten all photos submitted in reviews for this product
  const allBuyerPhotos = useMemo(() => {
    const list: {
      url: string;
      reviewerName: string;
      rating: number;
      comment: string;
      date: string;
    }[] = [];

    reviews.forEach((r) => {
      if (r.images && Array.isArray(r.images)) {
        r.images.forEach((imgUrl) => {
          if (imgUrl) {
            list.push({
              url: imgUrl,
              reviewerName: r.user_name || 'Verified Customer',
              rating: Number(r.rating) || 5,
              comment: r.comment || '',
              date: r.created_at || '',
            });
          }
        });
      }
    });

    return list;
  }, [reviews]);

  // Customer photo file selection & canvas compression
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingPhotos(true);
    setReviewErrorMsg('');
    const maxPhotos = 4;
    const remainingSlots = maxPhotos - reviewImages.length;
    if (remainingSlots <= 0) {
      setReviewErrorMsg('Maximum 4 photos allowed per review.');
      setIsProcessingPhotos(false);
      return;
    }

    const filesToProcess: File[] = (Array.from(files) as File[]).slice(0, remainingSlots);
    let completed = 0;
    const newPhotos: string[] = [];

    filesToProcess.forEach((file: File) => {
      if (!file.type.startsWith('image/')) {
        completed++;
        if (completed === filesToProcess.length) setIsProcessingPhotos(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDimension = 900;
            let width = img.width;
            let height = img.height;

            if (width > height && width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              newPhotos.push(canvas.toDataURL('image/jpeg', 0.8));
            } else {
              newPhotos.push(result);
            }

            completed++;
            if (completed === filesToProcess.length) {
              setReviewImages((prev) => [...prev, ...newPhotos]);
              setIsProcessingPhotos(false);
            }
          };
          img.onerror = () => {
            completed++;
            if (completed === filesToProcess.length) setIsProcessingPhotos(false);
          };
          img.src = result;
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveReviewPhoto = (indexToRemove: number) => {
    setReviewImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Review submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanComment = reviewComment.trim();
    if (!cleanComment) {
      setReviewErrorMsg('Please write a comment about your experience with this product.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewErrorMsg('');
    try {
      const res = await storeService.addReview({
        product_id: product.id,
        rating: reviewRating,
        comment: cleanComment,
        user_name: reviewerName.trim() || 'Verified Customer',
        images: reviewImages.length > 0 ? reviewImages : undefined,
      });

      if (res.success) {
        setReviewSuccessMsg('Thank you! Your verified review and photo(s) have been submitted.');
        setReviewComment('');
        setReviewerName('');
        setReviewImages([]);
        setShowReviewForm(false);
        loadProductReviews();
        setTimeout(() => setReviewSuccessMsg(''), 5000);
      } else {
        setReviewErrorMsg('Could not submit review. Please try again.');
      }
    } catch (err) {
      console.error('Submit review error:', err);
      setReviewErrorMsg('An error occurred. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Related products from the same category
  const relatedProducts = useMemo(() => {
    const categoryMatches = allProducts.filter(
      (p) =>
        p.id !== product.id &&
        (p.category === product.category ||
          (product.sub_category && p.sub_category === product.sub_category))
    );
    if (categoryMatches.length >= 4) {
      return categoryMatches.slice(0, 4);
    }
    // Fill remaining with other active products
    const otherProducts = allProducts.filter(
      (p) => p.id !== product.id && !categoryMatches.includes(p)
    );
    return [...categoryMatches, ...otherProducts].slice(0, 4);
  }, [allProducts, product]);

  // Section tabs availability check
  const hasOverview = parsedDescription.overviewParagraphs.length > 0;
  const hasFeatures = parsedDescription.features.length > 0;
  const hasSpecs = parsedDescription.specifications.length > 0;
  const hasPackageContents = parsedDescription.packageContents.length > 0;
  const hasDelivery = !!settings.delivery_inside_dhaka || !!parsedDescription.deliveryInfo;
  const hasPolicy = true; // Always available store guarantee
  const hasReviews = true;

  // Available tabs list
  const tabs = useMemo(() => {
    const list: Array<{ id: string; label: string; icon: React.ReactNode; count?: number }> = [];
    if (hasOverview) {
      list.push({ id: 'overview', label: 'Product Details', icon: <FileText className="w-4 h-4" /> });
    }
    if (hasFeatures) {
      list.push({ id: 'features', label: 'Key Features', icon: <Sparkles className="w-4 h-4" />, count: parsedDescription.features.length });
    }
    if (hasSpecs) {
      list.push({ id: 'specs', label: 'Specifications', icon: <SlidersHorizontal className="w-4 h-4" />, count: parsedDescription.specifications.length });
    }
    if (hasPackageContents) {
      list.push({ id: 'package', label: "What's in the Box", icon: <Package className="w-4 h-4" /> });
    }
    if (hasDelivery) {
      list.push({ id: 'delivery', label: 'Delivery & Shipping', icon: <Truck className="w-4 h-4" /> });
    }
    if (hasPolicy) {
      list.push({ id: 'policy', label: 'Return & Warranty', icon: <ShieldCheck className="w-4 h-4" /> });
    }
    list.push({
      id: 'video',
      label: 'Video & Unboxing',
      icon: <Film className="w-4 h-4 text-rose-500" />,
    });
    list.push({
      id: 'reviews',
      label: 'Verified Reviews',
      icon: <Star className="w-4 h-4" />,
      count: effectiveRating.count,
    });
    return list;
  }, [hasOverview, hasFeatures, hasSpecs, hasPackageContents, hasDelivery, hasPolicy, parsedDescription, effectiveRating.count]);

  // Ensure activeTab is valid
  useEffect(() => {
    if (!tabs.some((t) => t.id === activeTab)) {
      if (tabs.length > 0) setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  return (
    <div className="py-4 sm:py-6 pb-24 sm:pb-6 space-y-8 animate-fade-in">
      {/* 1. BREADCRUMBS NAVIGATION */}
      <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 text-xs text-zinc-500 font-medium">
        <button
          type="button"
          onClick={onBackToHome}
          className="flex items-center gap-1 text-zinc-600 hover:text-emerald-700 transition-colors cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-zinc-300 shrink-0" />

        {product.category && (
          <>
            <button
              type="button"
              onClick={onBackToHome}
              className="text-zinc-600 hover:text-emerald-700 transition-colors cursor-pointer truncate max-w-[140px] sm:max-w-[200px]"
            >
              {product.category}
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
          </>
        )}

        {product.sub_category && (
          <>
            <span className="text-zinc-600 truncate max-w-[140px] sm:max-w-[200px]">
              {product.sub_category}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
          </>
        )}

        <span className="text-zinc-950 font-bold truncate max-w-[180px] sm:max-w-[300px]">
          {product.name}
        </span>
      </nav>

      {/* 2. TOP TWO-COLUMN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* LEFT COLUMN: PRODUCT IMAGE / GALLERY */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Showcase Image Container */}
          <div
            ref={imageContainerRef}
            onMouseEnter={() => setIsZooming(true)}
            onMouseLeave={() => setIsZooming(false)}
            onMouseMove={handleMouseMove}
            className="relative bg-white rounded-3xl border border-zinc-200/90 shadow-xs overflow-hidden flex items-center justify-center aspect-square select-none group/showcase"
          >
            {/* Main Product Image with zoom effect */}
            <div className="w-full h-full p-4 sm:p-6 flex items-center justify-center overflow-hidden">
              <img
                src={selectedImage}
                alt={product.name}
                className={`max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-200 ease-out ${
                  isZooming ? 'scale-150 cursor-crosshair' : 'scale-100'
                }`}
                style={
                  isZooming
                    ? {
                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                      }
                    : undefined
                }
              />
            </div>

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10 pointer-events-none">
              {product.badge && (
                <span className="bg-zinc-950/90 text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm backdrop-blur-xs">
                  {product.badge}
                </span>
              )}
              {hasDiscount && (
                <span className="bg-rose-600 text-white font-extrabold text-[10px] tracking-wide px-2.5 py-1 rounded-lg shadow-sm">
                  {discountPercent > 0 ? `-${discountPercent}% OFF` : `SAVE ৳${discount.toLocaleString('en-BD')}`}
                </span>
              )}
            </div>

            {/* Lightbox / Zoom Action Buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-rose-600/95 hover:bg-rose-600 text-white font-black text-[11px] shadow-sm flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 backdrop-blur-xs"
                title="Watch Product Video & Unboxing Demo"
                aria-label="Watch Video Demo"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span className="hidden sm:inline">ভিডিও ডেমো</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const idx = galleryImages.indexOf(selectedImage);
                  setLightboxIndex(idx >= 0 ? idx : 0);
                  setIsLightboxOpen(true);
                }}
                className="w-9 h-9 rounded-xl bg-white/95 hover:bg-white text-zinc-700 hover:text-zinc-950 border border-zinc-200/80 shadow-xs flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Fullscreen Image View"
                aria-label="View Fullscreen Image"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Stock Out Overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center z-20">
                <span className="bg-zinc-900 text-white text-xs sm:text-sm font-black uppercase tracking-wider px-4 py-1.5 rounded-full border border-zinc-700 shadow-xl">
                  Stock Out
                </span>
              </div>
            )}
          </div>

          {/* Gallery Thumbnails List */}
          {galleryImages.length > 1 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
                <span>Product Photos ({galleryImages.length})</span>
                <span className="text-[11px] text-zinc-400">Click thumbnail to view</span>
              </div>
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
                {galleryImages.map((img, idx) => {
                  const isActive = selectedImage === img;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 border shrink-0 transition-all cursor-pointer flex items-center justify-center overflow-hidden ${
                        isActive
                          ? 'border-zinc-950 ring-2 ring-zinc-950/15 shadow-sm scale-102'
                          : 'border-zinc-200 hover:border-zinc-400 hover:scale-102'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} - image ${idx + 1}`}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: PRODUCT INFORMATION & PURCHASE OPTIONS */}
        <div className="lg:col-span-6 space-y-6">
          {/* Top Info Bar: Brand + Category + SKU */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-semibold text-zinc-500 border-b border-zinc-100 pb-3">
            <div className="flex items-center flex-wrap gap-2">
              {product.brand && (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/20 text-[10px] font-extrabold flex items-center gap-1">
                  <Tag className="w-3 h-3 text-amber-600" />
                  <span>Brand: {product.brand}</span>
                </span>
              )}
              <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-800 uppercase tracking-wider text-[10px] font-bold">
                {product.category || 'General'}
              </span>
              {product.product_type && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                  {product.product_type}
                </span>
              )}
            </div>

            {product.sku && (
              <button
                type="button"
                onClick={handleCopySku}
                className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 transition-colors font-mono text-[11px] cursor-pointer"
                title="Click to copy SKU"
              >
                <span>SKU: {product.sku}</span>
                {isSkuCopied ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3 text-zinc-400" />
                )}
              </button>
            )}
          </div>

          {/* Product Title */}
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-zinc-950 tracking-tight leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Reviews Rating & Fast Review Trigger */}
          <div className="flex items-center flex-wrap gap-3 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab('reviews');
                reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 hover:opacity-85 transition-opacity cursor-pointer group/rating"
            >
              <div className="flex items-center gap-0.5 text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(effectiveRating.average)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-zinc-200'
                    }`}
                  />
                ))}
              </div>
              <span className="font-extrabold text-zinc-950 text-sm">
                {effectiveRating.average.toFixed(1)}
              </span>
              <span className="text-zinc-500 font-medium group-hover/rating:text-emerald-700">
                ({effectiveRating.count} {effectiveRating.count === 1 ? 'verified review' : 'verified reviews'})
              </span>
            </button>

            <span className="text-zinc-300">•</span>

            <button
              type="button"
              onClick={() => {
                setActiveTab('reviews');
                setShowReviewForm(true);
                reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
            >
              + Write a Review
            </button>

            {Number(product.sold_count || 0) > 0 && (
              <>
                <span className="text-zinc-300">•</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-900 border border-amber-500/20 text-xs font-bold">
                  <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span>{Number(product.sold_count).toLocaleString('en-BD')}+ Sold (বিক্রি হয়েছে)</span>
                </span>
              </>
            )}
          </div>

          {/* Pricing Box */}
          <div className="bg-zinc-50/90 rounded-2xl p-4 sm:p-5 border border-zinc-200/90 space-y-1">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
                ৳{finalPrice.toLocaleString('en-BD')}
              </span>
              {hasDiscount && (
                <span className="text-sm sm:text-base font-semibold text-zinc-400 line-through">
                  ৳{sellingPrice.toLocaleString('en-BD')}
                </span>
              )}
              {hasDiscount && (
                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-black rounded-md">
                  Save ৳{discount.toLocaleString('en-BD')} ({discountPercent}% OFF)
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 font-medium">
              Tax included. Cash on Delivery available across all 64 districts.
            </p>
          </div>

          {/* Stock Status Indicator */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Currently Out of Stock (অনুপলব্ধ)</span>
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Only {effectiveStock} items left in stock - Order Soon!</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>In Stock ({effectiveStock} items available)</span>
              </span>
            )}
          </div>

          {/* Social Proof & Orders Progress Callout */}
          {Number(product.sold_count || 0) > 0 && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950 font-medium">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-700">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-600" />
              </div>
              <div className="leading-snug">
                <span className="font-extrabold text-amber-900">জনপ্রিয় চয়েস!</span> এ পর্যন্ত{' '}
                <strong className="font-black text-amber-950">
                  {Number(product.sold_count).toLocaleString('en-BD')}+ পিস
                </strong>{' '}
                সফলভাবে বিক্রি ও ডেলিভারি হয়েছে।
              </div>
            </div>
          )}

          {/* Color Variants (if configured) */}
          {Array.isArray(product.colors) && product.colors.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider">
                  Color:{' '}
                  <span className="text-emerald-700 font-black normal-case">
                    {selectedColor?.name || 'Default'}
                  </span>
                </label>
                {selectedColor?.stock !== undefined && (
                  <span className="text-[11px] text-zinc-500 font-medium">
                    {selectedColor.stock > 0 ? `${selectedColor.stock} available` : 'Out of Stock'}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {product.colors.map((color, idx) => {
                  const isSelected = selectedColor?.name === color.name;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleColorSelect(color)}
                      className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                          : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-400'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-xs shrink-0"
                        style={{ backgroundColor: color.code || '#18181b' }}
                      />
                      <span>{color.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector & Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              {/* Quantity Box */}
              <div className="flex items-center border border-zinc-300 bg-white rounded-2xl p-1 shadow-2xs shrink-0">
                <button
                  type="button"
                  disabled={quantity <= 1 || isOutOfStock}
                  onClick={() => handleQuantityChange(-1)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer text-base font-bold"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={effectiveStock || 99}
                  value={quantity}
                  disabled={isOutOfStock}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      if (val < 1) setQuantity(1);
                      else if (effectiveStock > 0 && val > effectiveStock) setQuantity(effectiveStock);
                      else setQuantity(val);
                    }
                  }}
                  className="w-12 text-center text-sm font-extrabold text-zinc-950 focus:outline-none bg-transparent"
                />
                <button
                  type="button"
                  disabled={isOutOfStock || (effectiveStock > 0 && quantity >= effectiveStock)}
                  onClick={() => handleQuantityChange(1)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer text-base font-bold"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => onToggleWishlist && onToggleWishlist(product)}
                className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  isWishlisted
                    ? 'border-rose-300 bg-rose-50 text-rose-600 shadow-xs'
                    : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-rose-500'
                }`}
                title={isWishlisted ? 'Remove from Saved' : 'Save to Wishlist'}
                aria-label="Wishlist"
              >
                <Heart
                  className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'stroke-[2]'}`}
                />
              </button>

              {/* Share Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-11 h-11 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-950 flex items-center justify-center transition-all cursor-pointer shrink-0"
                  title="Share product"
                  aria-label="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>

                {/* Share Dropdown */}
                {showShareMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl border border-zinc-200 shadow-xl p-2 z-30 space-y-1 animate-scale-up">
                    <button
                      type="button"
                      onClick={() => {
                        handleCopyLink();
                        setShowShareMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-zinc-800 hover:bg-zinc-100 rounded-xl flex items-center gap-2 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Check out ${product.name} on Maxora: ${fullProductUrl}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowShareMenu(false)}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-xl flex items-center gap-2 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                        fullProductUrl
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowShareMenu(false)}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-blue-700 hover:bg-blue-50 rounded-xl flex items-center gap-2 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Facebook</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Main Conversion Buttons: BUY NOW + ADD TO CART */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* PRIMARY: BUY NOW */}
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleBuyNowClick}
                className="w-full py-4 px-6 rounded-2xl bg-zinc-950 hover:bg-emerald-600 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed group"
              >
                <Zap className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform fill-amber-400" />
                <span>Buy Now (অর্ডার করুন)</span>
              </button>

              {/* SECONDARY: ADD TO CART */}
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddToCartClick}
                className={`w-full py-4 px-6 rounded-2xl border-2 font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed ${
                  isAddedFeedback
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-yellow-400 bg-yellow-400 hover:bg-yellow-500 text-zinc-950 shadow-sm'
                }`}
              >
                {isAddedFeedback ? (
                  <>
                    <Check className="w-5 h-5 text-white stroke-[3]" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 stroke-[2.5] text-zinc-950" />
                    <span className="font-black text-zinc-950">Add to Cart</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Dynamic Delivery Calculator & Shipping Estimator */}
          <DeliveryEstimator settings={settings} productPrice={finalPrice} />

          {/* Hotline Quick Call (if available in settings) */}
          {settings.phone && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-100/70 border border-zinc-200 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-700" />
                <span className="text-zinc-600">Have questions before ordering?</span>
              </div>
              <a
                href={`tel:${settings.phone}`}
                className="font-extrabold text-zinc-950 hover:text-emerald-700 transition-colors"
              >
                Call: {settings.phone}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* FREQUENTLY BOUGHT TOGETHER / COMBO BUNDLE OFFER */}
      <FrequentlyBoughtTogether
        mainProduct={product}
        allProducts={allProducts}
        onAddBundleToCart={(bundle) => {
          bundle.forEach((p) => {
            onAddToCart(p, 1);
          });
        }}
        onSelectProduct={(p) => {
          if (onSelectProduct) {
            onSelectProduct(p);
          }
        }}
      />

      {/* 3. FULL-WIDTH PRODUCT DETAILS / DESCRIPTION SECTION */}
      <section
        ref={descriptionSectionRef}
        className="mt-12 pt-8 border-t border-zinc-200 space-y-6"
      >
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-200">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-zinc-800 text-emerald-400' : 'bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-8 shadow-2xs">
          {/* TAB 1: PRODUCT DETAILS / OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4 max-w-4xl">
              <h3 className="text-base sm:text-lg font-black text-zinc-950 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span>Product Overview</span>
              </h3>
              {parsedDescription.isRichHtml && parsedDescription.rawRichHtml ? (
                <div
                  className="product-rich-description text-zinc-800 text-xs sm:text-sm leading-[1.8] space-y-3 font-normal [&_h2]:text-lg sm:[&_h2]:text-xl [&_h2]:font-black [&_h2]:my-3 [&_h2]:text-zinc-950 [&_h3]:text-sm sm:[&_h3]:text-base [&_h3]:font-black [&_h3]:my-2.5 [&_h3]:text-zinc-900 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2.5 [&_li]:my-1 [&_p]:my-2 [&_mark]:px-1.5 [&_mark]:py-0.5 [&_mark]:rounded-md"
                  dangerouslySetInnerHTML={{ __html: parsedDescription.rawRichHtml }}
                />
              ) : parsedDescription.overviewParagraphs.length > 0 ? (
                <div className="space-y-3 text-zinc-700 text-xs sm:text-sm leading-relaxed font-normal">
                  {parsedDescription.overviewParagraphs.map((para, i) => (
                    <div
                      key={i}
                      dangerouslySetInnerHTML={{ __html: sanitizeSafeHtml(para) }}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-xs sm:text-sm">
                  {product.name} is a guaranteed authentic product offering premium quality, durability, and reliable performance.
                </p>
              )}
            </div>
          )}

          {/* TAB 2: KEY FEATURES */}
          {activeTab === 'features' && (
            <div className="space-y-4 max-w-4xl">
              <h3 className="text-base sm:text-lg font-black text-zinc-950 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>Key Features & Highlights</span>
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {parsedDescription.features.map((feat, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs sm:text-sm text-zinc-800 leading-relaxed font-medium"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                    <span dangerouslySetInnerHTML={{ __html: sanitizeSafeHtml(feat) }} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* TAB 3: SPECIFICATIONS */}
          {activeTab === 'specs' && (
            <div className="space-y-4 max-w-4xl">
              <h3 className="text-base sm:text-lg font-black text-zinc-950 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-emerald-600" />
                <span>Technical Specifications</span>
              </h3>
              <div className="rounded-2xl border border-zinc-200 overflow-hidden divide-y divide-zinc-150">
                {parsedDescription.specifications.map((spec, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-5 text-xs sm:text-sm ${
                      idx % 2 === 0 ? 'bg-zinc-50/60' : 'bg-white'
                    }`}
                  >
                    <span className="font-semibold text-zinc-500 sm:w-1/3 mb-1 sm:mb-0">
                      {spec.label}
                    </span>
                    <span className="font-extrabold text-zinc-900 sm:w-2/3 sm:text-right">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: WHAT'S IN THE BOX */}
          {activeTab === 'package' && (
            <div className="space-y-4 max-w-4xl">
              <h3 className="text-base sm:text-lg font-black text-zinc-950 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span>Package Contents (বক্সের ভেতর যা থাকছে)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {parsedDescription.packageContents.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-blue-50/50 border border-blue-100 text-xs sm:text-sm font-semibold text-zinc-800"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: DELIVERY INFORMATION */}
          {activeTab === 'delivery' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base sm:text-lg font-black text-zinc-950">
                  Delivery & Shipping Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-center space-y-1">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase">Inside Dhaka</span>
                  <div className="text-xl font-black text-zinc-950">
                    ৳{settings.delivery_inside_dhaka || '70'}
                  </div>
                  <p className="text-[11px] text-emerald-700 font-bold">24-48 Hours</p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-center space-y-1">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase">Sub-Dhaka (Gazipur/Savar)</span>
                  <div className="text-xl font-black text-zinc-950">
                    ৳{settings.delivery_sub_dhaka || '100'}
                  </div>
                  <p className="text-[11px] text-emerald-700 font-bold">48 Hours</p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-center space-y-1">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase">Outside Dhaka (All BD)</span>
                  <div className="text-xl font-black text-zinc-950">
                    ৳{settings.delivery_outside_dhaka || '130'}
                  </div>
                  <p className="text-[11px] text-emerald-700 font-bold">48-72 Hours</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2 text-xs sm:text-sm text-emerald-950">
                <p className="font-extrabold">💵 Cash on Delivery Available:</p>
                <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                  ডেলিভারিম্যানের সামনে পার্সেলটি খুলে চেক করে মূল্য পরিশোধ করতে পারবেন। কোনো সমস্যা থাকলে ডেলিভারিম্যানের কাছে সরাসরি ফেরত দেওয়া যাবে।
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: RETURN & WARRANTY */}
          {activeTab === 'policy' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <h3 className="text-base sm:text-lg font-black text-zinc-950">
                  Return & Warranty Policy
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                  <h4 className="font-extrabold text-amber-950 text-xs sm:text-sm flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>Inspection on Delivery (পণ্য দেখে গ্রহণের সুযোগ)</span>
                  </h4>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    ডেলিভারি ম্যানের সামনে পার্সেলটি খুলে পণ্য সম্পূর্ণ চেক করে নিশ্চিত হয়ে মূল্য পরিশোধ করুন। কোনো সমস্যা থাকলে তাৎক্ষণিক রিটার্ন করার সুযোগ রয়েছে।
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                  <h4 className="font-extrabold text-zinc-950 text-xs sm:text-sm flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Conditions for Return</span>
                  </h4>
                  <ul className="text-xs text-zinc-600 space-y-1 list-disc list-inside font-medium">
                    <li>প্রোডাক্টের আসল বক্স ও এক্সেসরিজ অক্ষত থাকতে হবে।</li>
                    <li>ফিজিক্যাল ড্যামেজ বা পানিতে ভেজার ক্ষেত্রে রিটার্ন প্রযোজ্য নয়।</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB: VIDEO & LIVE UNBOXING DEMO */}
          {activeTab === 'video' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-zinc-150">
                <div className="flex items-center gap-2">
                  <Film className="w-5 h-5 text-rose-600" />
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-zinc-950">
                      Product Video & Live Unboxing Demo (ভিডিও ডেমো)
                    </h3>
                    <p className="text-xs text-zinc-500">
                      প্রোডাক্টটির আসল লুক, ফিনিশিং ও কাজের লাইভ ভিডিও ডেমোস্ট্রেশন
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>ফুলস্ক্রিন দেখুন</span>
                </button>
              </div>

              {/* Embedded Video Showcase Player */}
              <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-black border border-zinc-200 shadow-md">
                <iframe
                  src={getEmbedUrl(product.video_url).url}
                  title={`${product.name} Video Showcase`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>

              {/* Feature inspection cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center gap-2.5 text-xs text-zinc-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">১০০% অথেনটিক রিয়েল ডিভাইস</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center gap-2.5 text-xs text-zinc-800">
                  <Package className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-bold">অরিজিনাল ইন-বক্স এক্সেসরিজ</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center gap-2.5 text-xs text-zinc-800">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="font-bold">টেস্টেড ও ভেরিফাইড পারফরম্যান্স</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: VERIFIED REVIEWS & RATINGS */}
          {activeTab === 'reviews' && (
            <div ref={reviewsSectionRef} className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-zinc-150">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-zinc-950 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                    <span>Customer Reviews & Ratings</span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {effectiveRating.count} verified customer {effectiveRating.count === 1 ? 'review' : 'reviews'} for this product
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReviewForm((prev) => !prev)}
                  className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span>{showReviewForm ? 'Close Form' : 'Write a Review'}</span>
                </button>
              </div>

              {/* Review Submission Form */}
              {showReviewForm && (
                <form
                  onSubmit={handleSubmitReview}
                  className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4 animate-fade-in"
                >
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900">
                    Write Your Review
                  </h4>

                  {reviewSuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700" />
                      <span>{reviewSuccessMsg}</span>
                    </div>
                  )}

                  {reviewErrorMsg && (
                    <div className="p-3 rounded-xl bg-rose-100 text-rose-900 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-700" />
                      <span>{reviewErrorMsg}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      Your Rating:
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setReviewHoverRating(star)}
                          onMouseLeave={() => setReviewHoverRating(0)}
                          onClick={() => setReviewRating(star)}
                          className="p-1 text-zinc-300 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= (reviewHoverRating || reviewRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-zinc-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-zinc-600 ml-2">
                        {RATING_LABELS[reviewHoverRating || reviewRating]}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Your Name (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Tanvir Ahmed"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        className="w-full bg-white text-xs p-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Your Comment / Experience *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Share your experience with this product..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full bg-white text-xs p-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900 resize-none"
                    />
                  </div>

                  {/* Photo Upload Section */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-zinc-600" />
                        <span>Add Unboxing / Product Photos (ছবি যুক্ত করুন)</span>
                      </span>
                      <span className="text-[10px] text-zinc-400 font-normal">Max 4 photos</span>
                    </label>

                    {reviewImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2.5">
                        {reviewImages.map((img, index) => (
                          <div key={index} className="relative w-16 h-16 rounded-xl border border-zinc-200 overflow-hidden group">
                            <img src={img} alt="review preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveReviewPhoto(index)}
                              className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 transition-colors cursor-pointer shadow-xs"
                              title="Remove photo"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {reviewImages.length < 4 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessingPhotos}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-zinc-300 hover:border-zinc-500 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition-all cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{isProcessingPhotos ? 'প্রসেসিং হচ্ছে...' : 'ছবি আপলোড করুন (Upload Photo)'}</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingReview ? 'Submitting...' : 'Post Review'}</span>
                  </button>
                </form>
              )}

              {/* Customer Photos & Unboxing Gallery */}
              {allBuyerPhotos.length > 0 && (
                <div className="p-4 rounded-2xl bg-zinc-50/80 border border-zinc-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-zinc-700" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                        Customer Photos & Unboxing (ক্রেতাদের পাঠানো ছবি)
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700 shadow-2xs">
                      📸 {allBuyerPhotos.length} {allBuyerPhotos.length === 1 ? 'Photo' : 'Photos'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                    {allBuyerPhotos.map((photo, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setActivePhotoModal({ isOpen: true, photoIndex: pIdx })}
                        className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-zinc-200 hover:border-zinc-900 shadow-2xs group cursor-pointer transition-all hover:scale-105"
                      >
                        <img src={photo.url} alt={`Buyer photo by ${photo.reviewerName}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews List */}
              {loadingReviews ? (
                <div className="py-8 text-center text-xs text-zinc-400 font-medium">
                  Loading verified customer reviews...
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-3 divide-y divide-zinc-100">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="pt-3 first:pt-0 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center text-xs font-bold">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-zinc-900">
                            {rev.user_name || 'Verified Customer'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                            Verified Purchase
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400">
                          {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 text-amber-400 pl-9">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= Number(rev.rating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'
                            }`}
                          />
                        ))}
                      </div>

                      <p className="text-xs text-zinc-700 pl-9 leading-relaxed">
                        {rev.comment}
                      </p>

                      {/* Attached Customer Photos */}
                      {rev.images && rev.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 pl-9 pt-1">
                          {rev.images.map((imgUrl, imgIdx) => {
                            const globalIdx = allBuyerPhotos.findIndex((p) => p.url === imgUrl);
                            return (
                              <button
                                key={imgIdx}
                                type="button"
                                onClick={() =>
                                  setActivePhotoModal({
                                    isOpen: true,
                                    photoIndex: globalIdx >= 0 ? globalIdx : 0,
                                  })
                                }
                                className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-zinc-200 hover:border-zinc-900 shadow-2xs cursor-pointer group transition-transform hover:scale-105"
                              >
                                <img src={imgUrl} alt="Customer review photo" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <Maximize2 className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 drop-shadow" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <Star className="w-8 h-8 text-zinc-300 mx-auto" />
                  <p className="text-xs font-bold text-zinc-700">No reviews yet for this product</p>
                  <p className="text-[11px] text-zinc-400">
                    Be the first to share your experience with other customers!
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(true)}
                    className="mt-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold cursor-pointer"
                  >
                    Write First Review
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 4. RELATED PRODUCTS SECTION */}
      {relatedProducts.length > 0 && (
        <section className="mt-12 pt-8 border-t border-zinc-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-zinc-950 tracking-tight">
                You May Also Like
              </h3>
              <p className="text-xs text-zinc-500">
                Recommended products in {product.category || 'Maxora Collection'}
              </p>
            </div>
            <button
              type="button"
              onClick={onBackToHome}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2.5 sm:gap-3.5 lg:gap-4">
            {relatedProducts.map((relProduct) => (
              <ProductCard
                key={relProduct.id}
                product={relProduct}
                onAddToCart={(p) => onAddToCart(p, 1)}
                onQuickView={(p) => onSelectProduct(p)}
                isWishlisted={false}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        </section>
      )}

      {/* 5. RECENTLY VIEWED PRODUCTS */}
      <RecentlyViewedSection
        products={allProducts}
        currentProductId={product.id}
        onAddToCart={(p) => onAddToCart(p, 1)}
        onBuyNow={(p) => onBuyNow(p, 1)}
        onQuickView={(p) => onSelectProduct(p)}
        ratingStatsMap={ratingStatsMap}
        wishlistIds={wishlistIds}
        onToggleWishlist={onToggleWishlist}
      />

      {/* 6. FULLSCREEN LIGHTBOX MODAL */}
      {isLightboxOpen && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-50"
            title="Close Lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          {galleryImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-50"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center p-4"
          >
            <img
              src={galleryImages[lightboxIndex] || selectedImage}
              alt={product.name}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            />
          </div>

          {galleryImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-50"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900/80 px-4 py-1.5 rounded-full text-white text-xs font-bold">
            {lightboxIndex + 1} / {galleryImages.length}
          </div>
        </div>
      )}

      {/* 7. CUSTOMER PHOTO REVIEWS LIGHTBOX MODAL */}
      {activePhotoModal.isOpen && allBuyerPhotos.length > 0 && (
        <div
          onClick={() => setActivePhotoModal({ isOpen: false, photoIndex: 0 })}
          className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setActivePhotoModal({ isOpen: false, photoIndex: 0 })}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-50"
            title="Close photo viewer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Navigation Arrows */}
          {allBuyerPhotos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActivePhotoModal((prev) => ({
                  ...prev,
                  photoIndex: prev.photoIndex > 0 ? prev.photoIndex - 1 : allBuyerPhotos.length - 1,
                }));
              }}
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-50"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl w-full bg-zinc-900/90 rounded-2xl sm:rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
          >
            {/* Image viewer */}
            <div className="flex-1 bg-black flex items-center justify-center p-2 sm:p-4 min-h-[300px] md:min-h-[450px]">
              <img
                src={allBuyerPhotos[activePhotoModal.photoIndex]?.url}
                alt="Buyer photo"
                className="max-w-full max-h-[70vh] object-contain rounded-xl"
              />
            </div>

            {/* Buyer review details */}
            <div className="w-full md:w-80 p-5 bg-zinc-900 border-t md:border-t-0 md:border-l border-zinc-800 text-white flex flex-col justify-between shrink-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                    Verified Buyer Photo
                  </span>
                  <span className="text-xs text-zinc-400">
                    {activePhotoModal.photoIndex + 1} / {allBuyerPhotos.length}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-zinc-100">
                    {allBuyerPhotos[activePhotoModal.photoIndex]?.reviewerName}
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    {allBuyerPhotos[activePhotoModal.photoIndex]?.date
                      ? new Date(allBuyerPhotos[activePhotoModal.photoIndex]?.date).toLocaleDateString()
                      : 'Recent Buyer'}
                  </p>
                </div>

                <div className="flex items-center gap-0.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= (allBuyerPhotos[activePhotoModal.photoIndex]?.rating || 5)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-600'
                      }`}
                    />
                  ))}
                </div>

                {allBuyerPhotos[activePhotoModal.photoIndex]?.comment && (
                  <p className="text-xs text-zinc-300 leading-relaxed italic border-l-2 border-amber-400/60 pl-3 py-1">
                    "{allBuyerPhotos[activePhotoModal.photoIndex]?.comment}"
                  </p>
                )}
              </div>

              {/* Thumbnails rail in modal */}
              {allBuyerPhotos.length > 1 && (
                <div className="pt-4 mt-4 border-t border-zinc-800/80">
                  <p className="text-[10px] font-bold text-zinc-400 mb-2">All Buyer Photos ({allBuyerPhotos.length})</p>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {allBuyerPhotos.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePhotoModal((prev) => ({ ...prev, photoIndex: idx }))}
                        className={`w-12 h-12 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer ${
                          idx === activePhotoModal.photoIndex
                            ? 'border-amber-400 ring-2 ring-amber-400/30 scale-105'
                            : 'border-zinc-700 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={p.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {allBuyerPhotos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActivePhotoModal((prev) => ({
                  ...prev,
                  photoIndex: prev.photoIndex < allBuyerPhotos.length - 1 ? prev.photoIndex + 1 : 0,
                }));
              }}
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-50"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}

      {/* PRODUCT VIDEO / UNBOXING MODAL */}
      <ProductVideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoUrl={product.video_url}
        productName={product.name}
      />

      {/* 8. MOBILE STICKY BOTTOM PURCHASE BAR */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200/90 px-3.5 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-2.5">
        {/* Left: Live Price & Cash On Delivery Note */}
        <div className="flex items-center gap-2 min-w-0 pr-1">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-zinc-950 leading-tight">
                ৳{finalPrice.toLocaleString('en-BD')}
              </span>
              {hasDiscount && (
                <span className="text-[11px] text-zinc-400 line-through">
                  ৳{sellingPrice.toLocaleString('en-BD')}
                </span>
              )}
            </div>
            <p className="text-[10px] font-bold text-emerald-700 leading-none mt-0.5">
              ক্যাশ অন ডেলিভারি
            </p>
          </div>
        </div>

        {/* Right: Actions (WhatsApp Inquiry + Add to Cart + Buy Now) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer shadow-2xs"
              title="WhatsApp-এ মেসেজ দিন"
              aria-label="WhatsApp Support"
            >
              <MessageCircle className="w-5 h-5 fill-emerald-500 text-emerald-600" />
            </a>
          )}

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCartClick}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer shadow-2xs ${
              isAddedFeedback
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'bg-yellow-400 hover:bg-yellow-500 border-yellow-500/50 text-zinc-950'
            }`}
            title="Add to Cart"
            aria-label="Add to Cart"
          >
            {isAddedFeedback ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : (
              <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleBuyNowClick}
            className="py-2.5 px-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed"
          >
            {isOutOfStock ? (
              <span>স্টক নেই</span>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                <span className="whitespace-nowrap">অর্ডার করুন</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
