const WISHLIST_STORAGE_KEY = 'maxora_wishlist_v1';

export function getStoredWishlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to load wishlist from localStorage:', err);
    return [];
  }
}

export function saveStoredWishlist(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent('maxora_wishlist_updated', { detail: ids }));
  } catch (err) {
    console.warn('Failed to save wishlist to localStorage:', err);
  }
}

export function toggleWishlistProduct(productId: string): { ids: string[]; added: boolean } {
  const current = getStoredWishlist();
  const exists = current.includes(productId);
  let updated: string[];
  if (exists) {
    updated = current.filter((id) => id !== productId);
  } else {
    updated = [...current, productId];
  }
  saveStoredWishlist(updated);
  return { ids: updated, added: !exists };
}

export function clearStoredWishlist(): void {
  saveStoredWishlist([]);
}
