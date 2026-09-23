const RECENTLY_VIEWED_KEY = 'maxora_recently_viewed';
const MAX_RECENT = 12;

interface RecentViewItem {
  id: string;
  viewedAt: number;
}

export function recordProductView(productId: string): void {
  if (typeof window === 'undefined' || !productId) return;
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const existing: RecentViewItem[] = raw ? JSON.parse(raw) : [];
    // Remove if already exists
    const filtered = existing.filter((item) => item.id !== productId);
    // Prepend new view
    const updated = [{ id: productId, viewedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('maxora_recently_viewed_updated'));
  } catch (e) {
    console.warn('Failed to record product view:', e);
  }
}

export function getRecentlyViewedIds(excludeId?: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!raw) return [];
    const list: RecentViewItem[] = JSON.parse(raw);
    return list
      .map((item) => item.id)
      .filter((id) => (excludeId ? id !== excludeId : true));
  } catch (e) {
    return [];
  }
}

export function clearRecentlyViewed(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
    window.dispatchEvent(new CustomEvent('maxora_recently_viewed_updated'));
  } catch (e) {}
}
