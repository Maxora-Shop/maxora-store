/**
 * Maxora Real-Time Customer Visitor Tracking Engine
 * Accurately tracks active live shoppers, daily unique visitors, page views,
 * referral sources (Facebook Ads, Google, etc.), and devices in real time.
 */

class VisitorTrackingService {
  private visitorId: string = '';
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastPingTime: number = 0;
  private currentPath: string = '';
  private isInitialized: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initVisitorId();
    }
  }

  private initVisitorId(): string {
    try {
      let id = localStorage.getItem('maxora_vid');
      if (!id || id.length < 8) {
        id = `v_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem('maxora_vid', id);
      }
      this.visitorId = id;
      return id;
    } catch {
      this.visitorId = `v_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
      return this.visitorId;
    }
  }

  private getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    if (typeof window === 'undefined') return 'desktop';
    const ua = navigator.userAgent.toLowerCase();
    const width = window.innerWidth;

    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua) || (width >= 768 && width <= 1024)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua) || width < 768) {
      return 'mobile';
    }
    return 'desktop';
  }

  private detectReferrer(): string {
    if (typeof window === 'undefined') return 'Direct / Organic';

    const url = new URL(window.location.href);
    const search = url.searchParams;

    // 1. UTM Campaign & Ad Tags
    const utmSource = search.get('utm_source')?.toLowerCase();
    const fbclid = search.get('fbclid');
    const gclid = search.get('gclid');
    const ttclid = search.get('ttclid');

    if (fbclid || utmSource === 'facebook' || utmSource === 'fb' || utmSource === 'meta') {
      return 'Facebook Ads';
    }
    if (gclid || utmSource === 'google' || utmSource === 'google_ads') {
      return 'Google Ads';
    }
    if (ttclid || utmSource === 'tiktok') {
      return 'TikTok Ads';
    }
    if (utmSource === 'instagram' || utmSource === 'ig') {
      return 'Instagram Ads';
    }
    if (utmSource === 'youtube') {
      return 'YouTube Ads';
    }
    if (utmSource) {
      return `${utmSource.charAt(0).toUpperCase() + utmSource.slice(1)} Campaign`;
    }

    // 2. Document Referrer inspection
    const ref = document.referrer.toLowerCase();
    if (!ref) {
      return 'Direct / Organic';
    }
    if (ref.includes('facebook.com') || ref.includes('fb.me') || ref.includes('m.facebook.com')) {
      return 'Facebook';
    }
    if (ref.includes('instagram.com')) {
      return 'Instagram';
    }
    if (ref.includes('google.')) {
      return 'Google Search';
    }
    if (ref.includes('youtube.com') || ref.includes('youtu.be')) {
      return 'YouTube';
    }
    if (ref.includes('whatsapp') || ref.includes('api.whatsapp.com')) {
      return 'WhatsApp Share';
    }
    if (ref.includes('tiktok.com')) {
      return 'TikTok';
    }

    try {
      const refUrl = new URL(document.referrer);
      return refUrl.hostname.replace(/^www\./, '');
    } catch {
      return 'Referral';
    }
  }

  private isIgnoredPath(): boolean {
    if (typeof window === 'undefined') return true;
    const path = window.location.pathname;
    const hash = window.location.hash;
    const search = window.location.search;

    // Do not track admin users as customer traffic
    if (
      path.startsWith('/admin') ||
      hash.startsWith('#admin') ||
      search.includes('admin=true') ||
      localStorage.getItem('maxora_admin_token')
    ) {
      return true;
    }
    return false;
  }

  /**
   * Send heartbeat or page view ping to server
   */
  public async ping(customPath?: string, customTitle?: string): Promise<void> {
    if (typeof window === 'undefined' || this.isIgnoredPath()) return;

    const path = customPath || window.location.pathname;
    const title = customTitle || document.title || 'Maxora Storefront';

    this.currentPath = path;
    this.lastPingTime = Date.now();

    const payload = {
      visitorId: this.visitorId || this.initVisitorId(),
      path,
      pageTitle: title,
      referrer: this.detectReferrer(),
      device: this.getDeviceType(),
    };

    try {
      // Use sendBeacon if available for non-blocking unload, or standard fetch
      const endpoint = '/api/track/ping';
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function' && document.visibilityState === 'hidden') {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(endpoint, blob);
      } else {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      }
    } catch {
      // Graceful silence: tracking is non-blocking
    }
  }

  /**
   * Initialize automatic heartbeat and navigation listener
   */
  public init(): void {
    if (typeof window === 'undefined' || this.isInitialized) return;
    this.isInitialized = true;

    // 1. Initial page view ping
    this.ping();

    // 2. Heartbeat ping every 30 seconds if tab is active
    this.heartbeatInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        this.ping(this.currentPath);
      }
    }, 30000);

    // 3. Tab visibility change listener: ping immediately when user returns to tab
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLast = Date.now() - this.lastPingTime;
        if (timeSinceLast > 25000) {
          this.ping(this.currentPath);
        }
      }
    });

    // 4. History state listener for SPA navigation
    const originalPushState = window.history.pushState;
    window.history.pushState = (...args: any[]) => {
      const res = originalPushState.apply(window.history, args as any);
      setTimeout(() => this.ping(), 50);
      return res;
    };

    const originalReplaceState = window.history.replaceState;
    window.history.replaceState = (...args: any[]) => {
      const res = originalReplaceState.apply(window.history, args as any);
      setTimeout(() => this.ping(), 50);
      return res;
    };

    window.addEventListener('popstate', () => {
      setTimeout(() => this.ping(), 50);
    });
  }

  public destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.isInitialized = false;
  }
}

export const visitorTrackingService = new VisitorTrackingService();
