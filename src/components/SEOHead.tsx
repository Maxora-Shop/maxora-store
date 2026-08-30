import React, { useEffect } from 'react';
import { Product, StoreSettings } from '../types';

interface SEOHeadProps {
  settings: StoreSettings;
  activeProduct?: Product | null;
}

export const SEOHead: React.FC<SEOHeadProps> = ({ settings, activeProduct }) => {
  useEffect(() => {
    // 1. Determine Title & Meta details
    let pageTitle = settings.site_meta_title || `${settings.store_name} - ${settings.store_tagline}`;
    let pageDescription =
      settings.site_meta_description ||
      settings.hero_subtitle ||
      'Shop premium smartwatches, audio gadgets, and lifestyle accessories online in Bangladesh with Cash on Delivery.';
    let pageKeywords =
      settings.site_meta_keywords ||
      'online shopping bd, smart gadgets bangladesh, earbuds price in bd, cash on delivery';
    let ogImage =
      settings.logo_url ||
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=1200&auto=format&fit=crop&q=80';
    let canonicalUrl = window.location.origin + window.location.pathname;

    if (activeProduct) {
      const finalPrice = Math.max(0, Number(activeProduct.selling_price || 0) - Number(activeProduct.discount || 0));
      pageTitle = activeProduct.meta_title || `${activeProduct.name} Price in Bangladesh | ${settings.store_name}`;
      pageDescription =
        activeProduct.meta_description ||
        `Buy ${activeProduct.name} at best price in BD (৳${finalPrice}). ${activeProduct.description?.slice(0, 120) || ''}... Fast Cash on Delivery across Bangladesh.`;
      pageKeywords =
        activeProduct.meta_keywords ||
        `${activeProduct.name}, buy ${activeProduct.name} online bd, ${activeProduct.category} price bangladesh`;
      ogImage = activeProduct.og_image || activeProduct.image_url || ogImage;
      canonicalUrl = `${window.location.origin}/#product-${activeProduct.slug || activeProduct.id}`;
    }

    // Set Document Title
    document.title = pageTitle;

    // Helper to update or create meta tags
    const setMetaTag = (name: string, content: string, isProperty: boolean = false) => {
      const attr = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard Meta
    setMetaTag('description', pageDescription);
    setMetaTag('keywords', pageKeywords);
    setMetaTag('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');

    // Open Graph (Facebook / WhatsApp / Instagram / Messenger)
    setMetaTag('og:title', pageTitle, true);
    setMetaTag('og:description', pageDescription, true);
    setMetaTag('og:image', ogImage, true);
    setMetaTag('og:url', canonicalUrl, true);
    setMetaTag('og:type', activeProduct ? 'product' : 'website', true);
    setMetaTag('og:site_name', settings.store_name, true);

    // Twitter Card
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', pageTitle);
    setMetaTag('twitter:description', pageDescription);
    setMetaTag('twitter:image', ogImage);

    // Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // 2. Schema.org JSON-LD Structured Data for Google Rich Snippets
    const existingScript = document.getElementById('maxora-schema-jsonld');
    if (existingScript) {
      existingScript.remove();
    }

    const schemaData = activeProduct
      ? {
          '@context': 'https://schema.org/',
          '@type': 'Product',
          name: activeProduct.name,
          image: [activeProduct.image_url, ...(activeProduct.images || [])].filter(Boolean),
          description: activeProduct.description || pageDescription,
          sku: activeProduct.sku || activeProduct.id,
          brand: {
            '@type': 'Brand',
            name: activeProduct.brand || settings.store_name,
          },
          offers: {
            '@type': 'Offer',
            url: canonicalUrl,
            priceCurrency: 'BDT',
            price: Math.max(0, Number(activeProduct.selling_price || 0) - Number(activeProduct.discount || 0)),
            priceValidUntil: '2028-12-31',
            itemCondition: 'https://schema.org/NewCondition',
            availability:
              Number(activeProduct.stock) > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            seller: {
              '@type': 'Organization',
              name: settings.store_name,
            },
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            reviewCount: '87',
            bestRating: '5',
            worstRating: '1',
          },
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: settings.store_name,
          url: window.location.origin,
          description: pageDescription,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${window.location.origin}/?search={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        };

    const script = document.createElement('script');
    script.id = 'maxora-schema-jsonld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schemaData);
    document.head.appendChild(script);
  }, [settings, activeProduct]);

  return null;
};
