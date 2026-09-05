import React, { useEffect } from 'react';
import { Product, StoreSettings, Category, SubCategory } from '../types';
import {
  SITE_URL,
  STORE_NAME,
  getProductSlug,
  getProductCanonicalUrl,
  getHomepageCanonicalUrl,
  getCategoryCanonicalUrl,
  getSubCategoryCanonicalUrl,
  cleanSeoText,
} from '../utils/seo';

interface SEOHeadProps {
  settings: StoreSettings;
  activeProduct?: Product | null;
  activeCategory?: Category | null;
  activeSubCategory?: SubCategory | null;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  settings,
  activeProduct,
  activeCategory,
  activeSubCategory,
}) => {
  useEffect(() => {
    const storeBrand = settings.store_name?.trim() || STORE_NAME;
    const defaultOgImage =
      settings.logo_url ||
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=1200&auto=format&fit=crop&q=80';

    let pageTitle = '';
    let pageDescription = '';
    let pageKeywords = '';
    let ogImage = defaultOgImage;
    let canonicalUrl = getHomepageCanonicalUrl(SITE_URL);
    let isProductPage = false;
    let finalPrice = 0;
    let isOutOfStock = false;

    if (activeProduct) {
      isProductPage = true;
      finalPrice = Math.max(
        0,
        Number(activeProduct.selling_price || 0) - Number(activeProduct.discount || 0)
      );
      isOutOfStock = Number(activeProduct.stock || 0) <= 0;

      // Phase 5 Title format: {Product Name} Price in Bangladesh | Maxora Shop
      pageTitle =
        activeProduct.meta_title?.trim() ||
        `${activeProduct.name} Price in Bangladesh | ${storeBrand}`;

      // Clean, natural product meta description without keyword stuffing
      const descSnippet = cleanSeoText(activeProduct.description, 110);
      pageDescription =
        activeProduct.meta_description?.trim() ||
        `Buy ${activeProduct.name} at best price in Bangladesh (৳${finalPrice.toLocaleString('en-BD')}). ${descSnippet ? `${descSnippet} ` : ''}100% Cash on Delivery across Bangladesh.`;

      pageKeywords =
        activeProduct.meta_keywords?.trim() ||
        `${activeProduct.name}, buy ${activeProduct.name} online bd, ${activeProduct.category} price bangladesh, cash on delivery`;

      ogImage = activeProduct.og_image || activeProduct.image_url || defaultOgImage;

      // Phase 6 Canonical URL: https://maxora-store-ruby.vercel.app/product/{slug}
      canonicalUrl = getProductCanonicalUrl(activeProduct, SITE_URL);
    } else if (activeCategory) {
      // Category & Subcategory SEO
      const catTitle = activeSubCategory
        ? `${activeSubCategory.name} - ${activeCategory.name}`
        : activeCategory.name;

      pageTitle = activeCategory.meta_title?.trim() || `${catTitle} Price in Bangladesh | ${storeBrand}`;

      pageDescription =
        activeCategory.meta_description?.trim() ||
        `Shop authentic ${catTitle} at competitive prices in Bangladesh. Enjoy 100% Cash on Delivery and verified quality from ${storeBrand}.`;

      pageKeywords = `${catTitle.toLowerCase()}, buy ${activeCategory.name.toLowerCase()} bangladesh, cash on delivery, ${storeBrand.toLowerCase()}`;

      ogImage = activeCategory.image_url || defaultOgImage;

      canonicalUrl = activeSubCategory
        ? getSubCategoryCanonicalUrl(activeCategory, activeSubCategory, SITE_URL)
        : getCategoryCanonicalUrl(activeCategory, SITE_URL);
    } else {
      // Homepage metadata
      pageTitle =
        settings.site_meta_title?.trim() ||
        `${storeBrand} - ${settings.store_tagline || 'Premium Online Store in Bangladesh'}`;

      pageDescription =
        settings.site_meta_description?.trim() ||
        settings.hero_subtitle?.trim() ||
        'Shop premium smartwatches, earbuds, mobile gadgets, and lifestyle accessories online in Bangladesh with 100% Cash on Delivery across all 64 districts.';

      pageKeywords =
        settings.site_meta_keywords?.trim() ||
        'online shopping bd, smart gadgets bangladesh, earbuds price in bd, cash on delivery, maxora store';

      ogImage = defaultOgImage;
      canonicalUrl = getHomepageCanonicalUrl(SITE_URL);
    }

    // 1. Document Title
    document.title = pageTitle;

    // Helper to update, create or delete meta tags
    const setMetaTag = (attrName: string, attrValue: string, content: string) => {
      // Remove any duplicate matching tags first
      const elements = document.querySelectorAll(`meta[${attrName}="${attrValue}"]`);
      if (elements.length > 1) {
        for (let i = 1; i < elements.length; i++) {
          elements[i].remove();
        }
      }

      let element = elements[0] as HTMLMetaElement | undefined;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    const removeMetaTag = (attrName: string, attrValue: string) => {
      const elements = document.querySelectorAll(`meta[${attrName}="${attrValue}"]`);
      elements.forEach((el) => el.remove());
    };

    // 2. Standard Search Engine Meta
    setMetaTag('name', 'description', pageDescription);
    if (pageKeywords) {
      setMetaTag('name', 'keywords', pageKeywords);
    }
    setMetaTag(
      'name',
      'robots',
      'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
    );

    // 3. Open Graph Tags
    setMetaTag('property', 'og:title', pageTitle);
    setMetaTag('property', 'og:description', pageDescription);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:type', isProductPage ? 'product' : 'website');
    setMetaTag('property', 'og:site_name', storeBrand);

    if (isProductPage) {
      setMetaTag('property', 'product:price:amount', String(finalPrice));
      setMetaTag('property', 'product:price:currency', 'BDT');
      setMetaTag('property', 'product:availability', isOutOfStock ? 'out of stock' : 'in stock');
      setMetaTag('property', 'product:condition', 'new');
    } else {
      removeMetaTag('property', 'product:price:amount');
      removeMetaTag('property', 'product:price:currency');
      removeMetaTag('property', 'product:availability');
      removeMetaTag('property', 'product:condition');
    }

    // 4. Twitter Card
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', pageTitle);
    setMetaTag('name', 'twitter:description', pageDescription);
    setMetaTag('name', 'twitter:image', ogImage);

    // 5. Canonical URL - Guarantee exactly ONE canonical tag
    const existingCanonicals = document.querySelectorAll('link[rel="canonical"]');
    if (existingCanonicals.length > 1) {
      for (let i = 1; i < existingCanonicals.length; i++) {
        existingCanonicals[i].remove();
      }
    }
    let canonicalLink = existingCanonicals[0] as HTMLLinkElement | undefined;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // 6. Schema.org JSON-LD Structured Data
    // Remove previous script to guarantee no duplicate JSON-LD
    const SCRIPT_ID = 'maxora-structured-data';
    const oldScript = document.getElementById(SCRIPT_ID);
    if (oldScript) {
      oldScript.remove();
    }

    let schemaData: any;

    if (activeProduct) {
      // Phase 7: Product Schema. NO fake ratings/reviews!
      const productImages = [
        activeProduct.image_url,
        ...(Array.isArray(activeProduct.images) ? activeProduct.images : []),
      ].filter(Boolean);

      schemaData = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: activeProduct.name,
        image: productImages.length > 0 ? productImages : [ogImage],
        description: cleanSeoText(activeProduct.description || pageDescription, 200),
        sku: activeProduct.sku || String(activeProduct.id),
        brand: {
          '@type': 'Brand',
          name: activeProduct.brand?.trim() || storeBrand,
        },
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          priceCurrency: 'BDT',
          price: finalPrice,
          priceValidUntil: '2028-12-31',
          itemCondition: 'https://schema.org/NewCondition',
          availability: isOutOfStock
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock',
          seller: {
            '@type': 'Organization',
            name: storeBrand,
            url: getHomepageCanonicalUrl(SITE_URL),
          },
        },
      };
    } else {
      // Phase 8: Organization + WebSite Schema
      const homeUrl = getHomepageCanonicalUrl(SITE_URL);
      const contactPhone = settings.phone?.trim();

      schemaData = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': `${homeUrl}#organization`,
            name: storeBrand,
            url: homeUrl,
            logo: settings.logo_url || `${SITE_URL}/logo.png`,
            description: settings.hero_subtitle || 'Quality lifestyle gadgets & accessories delivered across Bangladesh.',
            ...(contactPhone
              ? {
                  telephone: contactPhone,
                  contactPoint: {
                    '@type': 'ContactPoint',
                    telephone: contactPhone,
                    contactType: 'customer service',
                    areaServed: 'BD',
                    availableLanguage: ['en', 'bn'],
                  },
                }
              : {}),
            sameAs: [settings.facebook].filter(Boolean),
          },
          {
            '@type': 'WebSite',
            '@id': `${homeUrl}#website`,
            url: homeUrl,
            name: storeBrand,
            description: pageDescription,
            publisher: {
              '@id': `${homeUrl}#organization`,
            },
            potentialAction: {
              '@type': 'SearchAction',
              target: `${homeUrl}?search={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          },
        ],
      };
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schemaData);
    document.head.appendChild(script);
  }, [settings, activeProduct, activeCategory, activeSubCategory]);

  return null;
};

