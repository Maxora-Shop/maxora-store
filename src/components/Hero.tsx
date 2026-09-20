import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Check,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Banknote,
  ShieldCheck,
} from 'lucide-react';
import { Product, StoreSettings, HeroBanner } from '../types';
import { DEFAULT_HERO_BANNERS } from '../data/initialData';

interface HeroProps {
  settings: StoreSettings;
  products?: Product[];
  onExploreClick: () => void;
  onOpenProduct?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export const Hero: React.FC<HeroProps> = ({
  settings,
  products = [],
  onExploreClick,
  onOpenProduct,
  onAddToCart,
}) => {
  // Use banners configured by admin, or fall back to default banners
  const rawBanners: HeroBanner[] = Array.isArray(settings.hero_banners) && settings.hero_banners.length > 0
    ? settings.hero_banners
    : DEFAULT_HERO_BANNERS;

  const activeBanners = rawBanners
    .filter((b) => b.active !== false && String(b.active) !== '0')
    .sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));

  const slides = activeBanners.length > 0 ? activeBanners : DEFAULT_HERO_BANNERS;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({});

  const handleImageError = async (imgSrc: string) => {
    if (!imgSrc || resolvedImages[imgSrc]) return;
    const match = imgSrc.match(/img-[a-z0-9_-]+/i);
    if (match) {
      const imgId = match[0];
      try {
        // If image URL wasn't using relative /api/product-image/, switch to it immediately
        const relUrl = `/api/product-image/${imgId}`;
        if (imgSrc !== relUrl && !imgSrc.endsWith(relUrl)) {
          setResolvedImages((prev) => ({ ...prev, [imgSrc]: relUrl }));
          return;
        }
        // Direct Firestore fallback if available
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        const snap = await getDoc(doc(db, 'uploaded_images', imgId));
        if (snap.exists() && snap.data()?.data_url) {
          setResolvedImages((prev) => ({ ...prev, [imgSrc]: snap.data().data_url }));
        }
      } catch (err) {
        console.warn('Fallback banner image fetch error:', err);
      }
    }
  };

  const sanitizeImg = (url?: string) => {
    if (!url) return '';
    let clean = url;
    if (clean.includes('/api/product-image/')) {
      clean = clean.substring(clean.indexOf('/api/product-image/'));
    } else if (clean.includes('localhost:3000')) {
      clean = clean.replace(/^https?:\/\/localhost:3000/i, '');
    }
    return resolvedImages[clean] || clean;
  };

  // Auto-rotation interval: settings.banner_slide_speed or 4500ms
  const slideInterval = settings.banner_slide_speed && settings.banner_slide_speed >= 2000
    ? settings.banner_slide_speed
    : 4500;

  useEffect(() => {
    if (slides.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, slideInterval);
    return () => clearInterval(timer);
  }, [isHovered, slides.length, slideInterval]);

  // Keep current slide within bounds if slides array changes
  useEffect(() => {
    if (currentSlide >= slides.length) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  const slide = slides[currentSlide] || slides[0] || DEFAULT_HERO_BANNERS[0];

  const handleCtaClick = () => {
    if (slide.ctaLink) {
      if (slide.ctaLink.startsWith('#')) {
        const el = document.querySelector(slide.ctaLink);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      } else if (slide.ctaLink.startsWith('/')) {
        window.history.pushState({}, '', slide.ctaLink);
        window.dispatchEvent(new PopStateEvent('popstate'));
        return;
      } else if (slide.ctaLink.startsWith('http')) {
        window.location.href = slide.ctaLink;
        return;
      }
    }
    onExploreClick();
  };

  // Background gradient class: custom or default clean sky
  const bgClass = slide.bgGradient || 'from-[#e0f2fe] via-[#e8f4fc] to-[#f0f7fd]';

  // Check if current slide is a full graphic banner uploaded by the user
  const isFullGraphicBanner =
    slide.bannerType === 'full' ||
    slide.bannerType === 'single' ||
    Boolean(slide.singleBannerImage) ||
    Boolean(slide.mobileBannerImage) ||
    (!slide.image2 && !slide.image3 && !slide.image4 && Boolean(slide.image1));

  const rawBannerImg =
    slide.singleBannerImage ||
    slide.image1 ||
    slide.mobileBannerImage ||
    '';
  const bannerImgSrc = sanitizeImg(rawBannerImg);
  const mobileBannerImgSrc = sanitizeImg(slide.mobileBannerImage);

  return (
    <section className="my-3 sm:my-5 w-full">
      {isFullGraphicBanner ? (
        /* ========================================================================= */
        /* FULL GRAPHIC BANNER: Direct User Upload / Canva / Photoshop Designed      */
        /* Displays full-width edge-to-edge without forcing product box or side text */
        /* ========================================================================= */
        <div
          className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs cursor-pointer group select-none bg-zinc-950 border border-zinc-200/80 transition-all duration-500"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleCtaClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCtaClick();
            }
          }}
        >
          {/* Responsive picture tag supporting separate mobile banner if uploaded */}
          <picture className="block w-full">
            {mobileBannerImgSrc && (
              <source media="(max-width: 640px)" srcSet={mobileBannerImgSrc} />
            )}
            <img
              src={bannerImgSrc}
              alt={slide.titlePrimary || 'Maxora Promotional Banner'}
              className="w-full h-auto max-h-[550px] min-h-[160px] sm:min-h-[260px] md:min-h-[340px] lg:min-h-[400px] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
              fetchPriority={currentSlide === 0 ? "high" : "auto"}
              decoding="async"
              onError={() => handleImageError(bannerImgSrc)}
            />
          </picture>

          {/* Floating Navigation Controls over Full Banner */}
          {slides.length > 1 && (
            <>
              {/* Carousel Arrows */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
                }}
                className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/45 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center cursor-pointer transition-all z-20 shadow-md border border-white/20 active:scale-95"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide((prev) => (prev + 1) % slides.length);
                }}
                className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/45 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center cursor-pointer transition-all z-20 shadow-md border border-white/20 active:scale-95"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Bottom Pagination Dots */}
              <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md z-20 border border-white/10">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide(idx);
                    }}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      currentSlide === idx ? 'w-6 bg-white shadow-xs' : 'w-2 bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* COLLAGE / TEXT BANNER: 2-Column Headline + 4-Gadget Collage Layout        */
        /* ========================================================================= */
        <div
          className={`relative bg-gradient-to-r ${bgClass} border border-sky-200/70 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xs overflow-hidden transition-all duration-700`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* LEFT SIDE: Hero Typography, Benefits & Shop Now CTA */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-5 sm:space-y-6">
            {/* Top Pill Badge */}
            {slide.pill && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0284c7]/10 text-[#0369a1] text-xs sm:text-sm font-bold w-fit">
                <span>{slide.pill}</span>
              </div>
            )}

            {/* Main Headline */}
            <div>
              <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-black text-zinc-950 tracking-tight leading-[1.12]">
                {slide.titlePrimary}{' '}
                {slide.titleAccent && (
                  <>
                    <br className="hidden sm:inline" />
                    <span className="text-[#2563eb]">{slide.titleAccent}</span>
                  </>
                )}
              </h1>
            </div>

            {/* Subtitle */}
            {slide.subtitle && (
              <p className="text-zinc-600 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
                {slide.subtitle}
              </p>
            )}

            {/* Key Benefits Checklist with Dividers */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm font-bold text-zinc-700">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Quality Products</span>
              </div>
              <span className="text-zinc-300 font-light">|</span>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#2563eb] shrink-0" />
                <span>Fast Delivery</span>
              </div>
              <span className="text-zinc-300 font-light">|</span>
              <div className="flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Cash on Delivery</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2 flex items-center gap-4">
              <button
                type="button"
                onClick={handleCtaClick}
                className="px-7 sm:px-9 py-3 sm:py-3.5 rounded-full bg-[#0f172a] hover:bg-zinc-800 text-white font-bold text-sm sm:text-base flex items-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
              >
                <span>{slide.cta || 'Shop Now'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RIGHT SIDE: Banner Display (Single Image or 4-Item Collage) */}
          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[260px] sm:min-h-[320px]">
            {/* Ambient circular backdrop */}
            <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-white/70 blur-2xl pointer-events-none" />

            {slide.singleBannerImage ? (
              /* Single Full Banner Image Mode */
              <div className="relative w-full max-w-lg aspect-16/10 rounded-2xl overflow-hidden shadow-xl border border-white/60">
                <img
                  src={sanitizeImg(slide.singleBannerImage)}
                  alt={slide.titlePrimary}
                  className="w-full h-full object-cover"
                  fetchPriority={currentSlide === 0 ? "high" : "auto"}
                  decoding="async"
                  onError={() => handleImageError(sanitizeImg(slide.singleBannerImage))}
                />
              </div>
            ) : (
              /* Gadget Collage Layout */
              <div className="relative w-full max-w-lg aspect-4/3 flex items-center justify-center">
                {/* Main Gadget 1 (Left-Center) */}
                <div className="absolute left-2 sm:left-4 top-2 sm:top-4 w-36 sm:w-52 h-36 sm:h-52 z-20 drop-shadow-xl hover:scale-105 transition-transform">
                  <img
                    src={sanitizeImg(slide.image1) || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'}
                    alt="Gadget 1"
                    className="w-full h-full object-contain filter drop-shadow-lg"
                    fetchPriority={currentSlide === 0 ? "high" : "auto"}
                    decoding="async"
                    onError={() => handleImageError(sanitizeImg(slide.image1))}
                  />
                </div>

                {/* Main Gadget 2 (Center-Right) */}
                <div className="absolute right-12 sm:right-20 top-0 sm:top-2 w-32 sm:w-44 h-44 sm:h-60 z-30 drop-shadow-2xl hover:scale-105 transition-transform rotate-6">
                  <img
                    src={sanitizeImg(slide.image2) || 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&auto=format&fit=crop&q=80'}
                    alt="Gadget 2"
                    className="w-full h-full object-contain filter drop-shadow-xl"
                    fetchPriority={currentSlide === 0 ? "high" : "auto"}
                    decoding="async"
                    onError={() => handleImageError(sanitizeImg(slide.image2))}
                  />
                </div>

                {/* Main Gadget 3 (Bottom-Left) */}
                <div className="absolute left-16 sm:left-24 bottom-2 sm:bottom-4 w-24 sm:w-36 h-24 sm:h-36 z-30 drop-shadow-xl hover:scale-105 transition-transform -rotate-12">
                  <img
                    src={sanitizeImg(slide.image3) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80'}
                    alt="Gadget 3"
                    className="w-full h-full object-contain filter drop-shadow-lg"
                    decoding="async"
                    onError={() => handleImageError(sanitizeImg(slide.image3))}
                  />
                </div>

                {/* Main Gadget 4 (Bottom-Right) */}
                <div className="absolute right-4 sm:right-6 bottom-4 sm:bottom-6 w-24 sm:w-36 h-24 sm:h-36 z-20 drop-shadow-lg hover:scale-105 transition-transform">
                  <img
                    src={sanitizeImg(slide.image4) || 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80'}
                    alt="Gadget 4"
                    className="w-full h-full object-contain filter drop-shadow-md"
                    decoding="async"
                    onError={() => handleImageError(sanitizeImg(slide.image4))}
                  />
                </div>

                {/* Cursive Handwriting Note: "Better Products ~ Better Life" */}
                {slide.badgeNote && (
                  <div className="absolute -bottom-2 right-12 sm:right-16 z-30 pointer-events-none select-none">
                    <span className="font-serif italic text-xs sm:text-sm text-zinc-500/90 tracking-wide font-medium">
                      {slide.badgeNote}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Carousel Navigation Arrows */}
            {slides.length > 1 && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-40">
                <button
                  type="button"
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                  className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-zinc-800 shadow-sm border border-zinc-200 flex items-center justify-center cursor-pointer transition-colors"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                  className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-zinc-800 shadow-sm border border-zinc-200 flex items-center justify-center cursor-pointer transition-colors"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Carousel Pagination Dots at Bottom */}
        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-4 sm:mt-6">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentSlide === idx ? 'w-6 bg-zinc-900' : 'w-2 bg-zinc-300 hover:bg-zinc-400'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
        </div>
      )}
    </section>
  );
};
