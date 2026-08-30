// Pixel & Ads Tracking Engine for Facebook / Meta Ads, Google Ads / GA4, and TikTok Ads
import { Product, CartItem, Order, StoreSettings } from '../types';

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    gtag?: any;
    dataLayer?: any[];
    ttq?: any;
  }
}

class PixelService {
  private initializedPixels = {
    meta: false,
    google: false,
    tiktok: false,
  };

  /**
   * Initialize Tracking Pixels based on Store Settings
   */
  public initPixels(settings: StoreSettings) {
    if (typeof window === 'undefined') return;

    // 1. Initialize Meta / Facebook Pixel
    if (settings.meta_pixel_id && settings.meta_pixel_id.trim() !== '') {
      const pixelId = settings.meta_pixel_id.trim();
      if (!this.initializedPixels.meta) {
        this.loadMetaPixel(pixelId);
        this.initializedPixels.meta = true;
      }
    }

    // 2. Initialize Google Tag / Google Ads / GA4
    if (settings.google_tag_id && settings.google_tag_id.trim() !== '') {
      const tagId = settings.google_tag_id.trim();
      if (!this.initializedPixels.google) {
        this.loadGoogleTag(tagId);
        this.initializedPixels.google = true;
      }
    }

    // 3. Initialize TikTok Pixel
    if (settings.tiktok_pixel_id && settings.tiktok_pixel_id.trim() !== '') {
      const ttId = settings.tiktok_pixel_id.trim();
      if (!this.initializedPixels.tiktok) {
        this.loadTikTokPixel(ttId);
        this.initializedPixels.tiktok = true;
      }
    }

    // 4. Custom Head Injection (Safe script/tag injection)
    if (settings.custom_head_code && settings.custom_head_code.trim()) {
      try {
        const headScriptId = 'maxora-custom-head';
        if (!document.getElementById(headScriptId)) {
          const container = document.createElement('div');
          container.id = headScriptId;
          container.innerHTML = settings.custom_head_code;
          document.head.appendChild(container);
        }
      } catch (e) {
        console.warn('Custom head script error:', e);
      }
    }
  }

  private loadMetaPixel(pixelId: string) {
    if (window.fbq) return;
    /* eslint-disable */
    (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    if (window.fbq) {
      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
    }
  }

  private loadGoogleTag(tagId: string) {
    if (window.gtag) return;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${tagId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer?.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', tagId);
  }

  private loadTikTokPixel(pixelId: string) {
    if (window.ttq) return;
    /* eslint-disable */
    (function (w: any, d: any, t: any) {
      w.TiktokAnalyticsObject = t;
      var ttq = (w[t] = w[t] || []);
      ttq.methods = [
        'page',
        'track',
        'identify',
        'instances',
        'debug',
        'on',
        'off',
        'once',
        'ready',
        'alias',
        'group',
        'enableCookie',
        'disableCookie',
      ];
      ttq.setAndDefer = function (t: any, e: any) {
        t[e] = function () {
          t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
        };
      };
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.instance = function (t: any) {
        for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
        return e;
      };
      ttq.load = function (e: any, n: any) {
        var i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
        ttq._i = ttq._i || {};
        ttq._i[e] = [];
        ttq._i[e]._u = i;
        ttq._t = ttq._t || {};
        ttq._t[e] = +new Date();
        ttq._o = ttq._o || {};
        ttq._o[e] = n || {};
        var o = d.createElement('script');
        o.type = 'text/javascript';
        o.async = !0;
        o.src = i + '?sdkid=' + e + '&lib=' + t;
        var a = d.getElementsByTagName('script')[0];
        a.parentNode.insertBefore(o, a);
      };
      ttq.load(pixelId);
      ttq.page();
    })(window, document, 'ttq');
    /* eslint-enable */
  }

  /**
   * Trigger ViewContent Event when a visitor views a product details
   */
  public trackViewContent(product: Product) {
    const price = Math.max(0, Number(product.selling_price || 0) - Number(product.discount || 0));

    // 1. Meta Pixel
    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: product.name,
        content_category: product.category,
        content_ids: [product.id],
        content_type: 'product',
        value: price,
        currency: 'BDT',
      });
    }

    // 2. Google Analytics 4 / Google Ads
    if (window.gtag) {
      window.gtag('event', 'view_item', {
        currency: 'BDT',
        value: price,
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            item_category: product.category,
            price: price,
            quantity: 1,
          },
        ],
      });
    }

    // 3. TikTok Pixel
    if (window.ttq) {
      window.ttq.track('ViewContent', {
        content_id: product.id,
        content_type: 'product',
        content_name: product.name,
        quantity: 1,
        price: price,
        value: price,
        currency: 'BDT',
      });
    }
  }

  /**
   * Trigger AddToCart Event when item added to shopping bag
   */
  public trackAddToCart(product: Product | CartItem, quantity: number = 1) {
    const id = 'id' in product ? product.id : product.product_id;
    const name = product.name;
    const price =
      'selling_price' in product
        ? Math.max(0, Number(product.selling_price || 0) - Number(product.discount || 0))
        : product.unit_price;

    // 1. Meta Pixel
    if (window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_name: name,
        content_ids: [id],
        content_type: 'product',
        value: price * quantity,
        currency: 'BDT',
      });
    }

    // 2. Google Tag
    if (window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: 'BDT',
        value: price * quantity,
        items: [
          {
            item_id: id,
            item_name: name,
            price: price,
            quantity: quantity,
          },
        ],
      });
    }

    // 3. TikTok Pixel
    if (window.ttq) {
      window.ttq.track('AddToCart', {
        content_id: id,
        content_type: 'product',
        content_name: name,
        quantity: quantity,
        price: price,
        value: price * quantity,
        currency: 'BDT',
      });
    }
  }

  /**
   * Trigger InitiateCheckout Event when user opens Checkout modal or clicks Order Now
   */
  public trackInitiateCheckout(items: CartItem[], total: number) {
    const productIds = items.map((i) => i.product_id);

    // 1. Meta Pixel
    if (window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_ids: productIds,
        content_type: 'product',
        value: total,
        currency: 'BDT',
        num_items: items.reduce((acc, curr) => acc + curr.quantity, 0),
      });
    }

    // 2. Google Tag
    if (window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: 'BDT',
        value: total,
        items: items.map((i) => ({
          item_id: i.product_id,
          item_name: i.name,
          price: i.unit_price,
          quantity: i.quantity,
        })),
      });
    }

    // 3. TikTok Pixel
    if (window.ttq) {
      window.ttq.track('InitiateCheckout', {
        contents: items.map((i) => ({
          content_id: i.product_id,
          content_name: i.name,
          quantity: i.quantity,
          price: i.unit_price,
        })),
        value: total,
        currency: 'BDT',
      });
    }
  }

  /**
   * Trigger Purchase Event when order is successfully placed (Cash on Delivery)
   */
  public trackPurchase(order: Order) {
    const items = order.items || [];
    const productIds = items.map((i) => i.product_id);

    // 1. Meta Pixel
    if (window.fbq) {
      window.fbq('track', 'Purchase', {
        content_ids: productIds,
        content_type: 'product',
        value: order.total,
        currency: 'BDT',
        num_items: items.reduce((acc, curr) => acc + curr.quantity, 0),
        order_id: order.order_number || order.id,
      });
    }

    // 2. Google Tag / Google Ads Conversion
    if (window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: order.order_number || order.id,
        value: order.total,
        currency: 'BDT',
        tax: 0,
        shipping: order.delivery_charge,
        items: items.map((i) => ({
          item_id: i.product_id,
          item_name: i.product_name,
          price: i.unit_price,
          quantity: i.quantity,
        })),
      });
    }

    // 3. TikTok Pixel
    if (window.ttq) {
      window.ttq.track('CompletePayment', {
        content_id: order.order_number || order.id,
        content_type: 'product',
        value: order.total,
        currency: 'BDT',
        quantity: items.reduce((acc, curr) => acc + curr.quantity, 0),
      });
    }
  }
}

export const pixelService = new PixelService();
