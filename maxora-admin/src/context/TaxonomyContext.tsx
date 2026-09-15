import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Category, SubCategory, ProductType, ChildCategory, Product } from '../types';
import {
  TaxonomyCategory,
  TaxonomySubCategory,
  TaxonomyProductType,
  TaxonomyChildCategory,
  TaxonomyFilterState,
  buildTaxonomyTree,
  matchesTaxonomyField,
  normalizeKey,
  filterProductsByTaxonomy,
} from '../utils/taxonomy';
import {
  reconcileCategories,
  reconcileSubCategories,
  reconcileProductTypes,
  reconcileChildCategories,
  isProductInCategory,
} from '../utils/categoryCompatibility';
import { storeService, initRealtimeFirestoreListeners } from '../services/storeService';
import {
  INITIAL_CATEGORIES,
  INITIAL_SUBCATEGORIES,
  INITIAL_PRODUCT_TYPES,
  INITIAL_CHILD_CATEGORIES,
} from '../data/initialData';

export interface TaxonomyContextValue {
  // Raw registered lists
  categories: Category[];
  subCategories: SubCategory[];
  productTypes: ProductType[];
  childCategories: ChildCategory[];
  products: Product[];

  // Reconciled lists (registered records + dynamic product tags)
  reconciledCategories: Category[];
  reconciledSubCategories: SubCategory[];
  reconciledProductTypes: ProductType[];
  reconciledChildCategories: ChildCategory[];

  // 4-Tier Hierarchical Tree Structure
  taxonomyTree: TaxonomyCategory[];

  // Live product counts mapped by category slug
  categoryProductCountMap: Record<string, number>;

  // Loading & Initialization Status
  loading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions & Mutators
  refreshTaxonomy: () => Promise<void>;
  updateProductsState: (newProducts: Product[]) => void;

  saveCategory: (catData: Partial<Category>, adminPassword?: string) => Promise<{ success: boolean; category: Category }>;
  deleteCategory: (categoryId: string, adminPassword?: string) => Promise<{ success: boolean }>;

  saveSubCategory: (subData: Partial<SubCategory>, adminPassword?: string) => Promise<{ success: boolean; subCategory: SubCategory }>;
  deleteSubCategory: (subCategoryId: string, adminPassword?: string) => Promise<{ success: boolean }>;

  saveProductType: (typeData: Partial<ProductType>, adminPassword?: string) => Promise<{ success: boolean; productType: ProductType }>;
  deleteProductType: (productTypeId: string, adminPassword?: string) => Promise<{ success: boolean }>;

  saveChildCategory: (childData: Partial<ChildCategory>, adminPassword?: string) => Promise<{ success: boolean; childCategory: ChildCategory }>;
  deleteChildCategory: (childCategoryId: string, adminPassword?: string) => Promise<{ success: boolean }>;

  // Quick Traversal & Lookup Helpers
  getCategoryByIdOrSlug: (idOrSlug?: string) => Category | undefined;
  getSubCategoryByIdOrSlug: (idOrSlug?: string) => SubCategory | undefined;
  getProductTypeByIdOrSlug: (idOrSlug?: string) => ProductType | undefined;
  getChildCategoryByIdOrSlug: (idOrSlug?: string) => ChildCategory | undefined;

  getSubCategoriesForCategory: (categoryIdOrSlug?: string) => SubCategory[];
  getProductTypesForSubCategory: (subCategoryIdOrSlug?: string) => ProductType[];
  getChildCategoriesForProductType: (productTypeIdOrSlug?: string) => ChildCategory[];

  filterProducts: (filter: Partial<TaxonomyFilterState>) => Product[];
}

const TaxonomyContext = createContext<TaxonomyContextValue | null>(null);

export interface TaxonomyProviderProps {
  children: React.ReactNode;
  initialProducts?: Product[];
}

export const TaxonomyProvider: React.FC<TaxonomyProviderProps> = ({
  children,
  initialProducts,
}) => {
  // 1. Initialize states SYNCHRONOUSLY from local cache / fallback defaults so UI is never blank
  const [categories, setCategories] = useState<Category[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = storeService.getCachedCategories();
      if (cached && cached.length > 0) return cached;
    }
    return INITIAL_CATEGORIES;
  });

  const [subCategories, setSubCategories] = useState<SubCategory[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = storeService.getCachedSubCategories();
      if (cached && cached.length > 0) return cached;
    }
    return INITIAL_SUBCATEGORIES;
  });

  const [productTypes, setProductTypes] = useState<ProductType[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = storeService.getCachedProductTypes();
      if (cached && cached.length > 0) return cached;
    }
    return INITIAL_PRODUCT_TYPES;
  });

  const [childCategories, setChildCategories] = useState<ChildCategory[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = storeService.getCachedChildCategories();
      if (cached && cached.length > 0) return cached;
    }
    return INITIAL_CHILD_CATEGORIES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    if (initialProducts && initialProducts.length > 0) return initialProducts;
    if (typeof window !== 'undefined') {
      const cached = storeService.getCachedProducts();
      if (cached && cached.length > 0) return cached;
    }
    return [];
  });

  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync external initialProducts if prop updates
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
    }
  }, [initialProducts]);

  const updateProductsState = useCallback((newProducts: Product[]) => {
    setProducts(newProducts);
  }, []);

  // 2. Refresh taxonomy from Firestore + local cache
  const refreshTaxonomy = useCallback(async () => {
    try {
      setError(null);
      const [cats, subs, types, childs] = await Promise.all([
        storeService.getCategories(),
        storeService.getSubCategories(),
        storeService.getProductTypes(),
        storeService.getChildCategories(),
      ]);

      if (Array.isArray(cats) && cats.length > 0) setCategories(cats);
      if (Array.isArray(subs) && subs.length > 0) setSubCategories(subs);
      if (Array.isArray(types) && types.length > 0) setProductTypes(types);
      if (Array.isArray(childs) && childs.length > 0) setChildCategories(childs);

      // Also update products if local cached products exist
      const prods = storeService.getCachedProducts();
      if (prods && prods.length > 0) {
        setProducts(prods);
      }
    } catch (err: any) {
      console.warn('TaxonomyContext: refresh error:', err);
      setError(err?.message || 'Failed to sync taxonomy');
    } finally {
      setIsInitialized(true);
      setLoading(false);
    }
  }, []);

  // 3. Mount: start Firestore real-time listeners and subscribe to sync channels
  useEffect(() => {
    // Start global real-time cloud sync listeners
    initRealtimeFirestoreListeners();

    // Initial fetch from cloud/store
    refreshTaxonomy();

    // Sync from local cache immediately on any event
    const syncFromCache = () => {
      if (typeof window === 'undefined') return;
      const c = storeService.getCachedCategories();
      const s = storeService.getCachedSubCategories();
      const t = storeService.getCachedProductTypes();
      const ch = storeService.getCachedChildCategories();
      const p = storeService.getCachedProducts();

      if (c && c.length > 0) setCategories(c);
      if (s && s.length > 0) setSubCategories(s);
      if (t && t.length > 0) setProductTypes(t);
      if (ch && ch.length > 0) setChildCategories(ch);
      if (p && p.length > 0) setProducts(p);
    };

    const handleTaxonomyEvent = () => {
      syncFromCache();
    };

    const handleProductsEvent = () => {
      if (typeof window === 'undefined') return;
      const p = storeService.getCachedProducts();
      if (p && p.length > 0) setProducts(p);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncFromCache();
        refreshTaxonomy();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || e.key.includes('categor') || e.key.includes('product') || e.key.includes('type')) {
        syncFromCache();
      }
    };

    window.addEventListener('maxora_categories_updated', handleTaxonomyEvent);
    window.addEventListener('maxora_subcategories_updated', handleTaxonomyEvent);
    window.addEventListener('maxora_product_types_updated', handleTaxonomyEvent);
    window.addEventListener('maxora_child_categories_updated', handleTaxonomyEvent);
    window.addEventListener('maxora_products_updated', handleProductsEvent);
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cross-tab broadcast channel sync
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('maxora_sync_bus_v1');
        channel.onmessage = (event) => {
          if (event.data?.type === 'categories' || event.data?.type === 'products') {
            syncFromCache();
          }
        };
      }
    } catch {}

    return () => {
      window.removeEventListener('maxora_categories_updated', handleTaxonomyEvent);
      window.removeEventListener('maxora_subcategories_updated', handleTaxonomyEvent);
      window.removeEventListener('maxora_product_types_updated', handleTaxonomyEvent);
      window.removeEventListener('maxora_child_categories_updated', handleTaxonomyEvent);
      window.removeEventListener('maxora_products_updated', handleProductsEvent);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      try {
        channel?.close();
      } catch {}
    };
  }, [refreshTaxonomy]);

  // 4. Memoized Reconciled Hierarchy
  const reconciledCategories = useMemo(
    () => reconcileCategories(categories, products),
    [categories, products]
  );

  const reconciledSubCategories = useMemo(
    () => reconcileSubCategories(subCategories, reconciledCategories, products),
    [subCategories, reconciledCategories, products]
  );

  const reconciledProductTypes = useMemo(
    () => reconcileProductTypes(productTypes, reconciledCategories, reconciledSubCategories, products),
    [productTypes, reconciledCategories, reconciledSubCategories, products]
  );

  const reconciledChildCategories = useMemo(
    () => reconcileChildCategories(childCategories, reconciledCategories, reconciledSubCategories, reconciledProductTypes, products),
    [childCategories, reconciledCategories, reconciledSubCategories, reconciledProductTypes, products]
  );

  // 5. Build Dynamic 4-Tier Hierarchy Tree
  const taxonomyTree = useMemo(() => {
    return buildTaxonomyTree(
      products,
      reconciledCategories,
      reconciledSubCategories,
      reconciledProductTypes,
      reconciledChildCategories
    );
  }, [products, reconciledCategories, reconciledSubCategories, reconciledProductTypes, reconciledChildCategories]);

  // 6. Live product counts per category
  const categoryProductCountMap = useMemo(() => {
    const countMap: Record<string, number> = {};
    const activeProds = products.filter(
      (p) => p.active !== 0 && p.active !== false && String(p.active) !== '0'
    );
    reconciledCategories.forEach((cat) => {
      countMap[cat.slug] = activeProds.filter((p) => isProductInCategory(p, cat)).length;
    });
    return countMap;
  }, [products, reconciledCategories]);

  // 7. Mutators with Optimistic UI & Firestore Sync
  const saveCategory = useCallback(async (catData: Partial<Category>, adminPassword?: string) => {
    const res = await storeService.saveCategory(catData, adminPassword);
    if (res.success && res.category) {
      setCategories((prev) => {
        const idx = prev.findIndex((c) => c.id === res.category.id || c.slug === res.category.slug);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = res.category;
          return next;
        }
        return [...prev, res.category];
      });
    }
    return res;
  }, []);

  const deleteCategory = useCallback(async (categoryId: string, adminPassword?: string) => {
    const res = await storeService.deleteCategory(categoryId, adminPassword);
    if (res.success) {
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    }
    return res;
  }, []);

  const saveSubCategory = useCallback(async (subData: Partial<SubCategory>, adminPassword?: string) => {
    const res = await storeService.saveSubCategory(subData, adminPassword);
    if (res.success && res.subCategory) {
      setSubCategories((prev) => {
        const idx = prev.findIndex((s) => s.id === res.subCategory.id || s.slug === res.subCategory.slug);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = res.subCategory;
          return next;
        }
        return [...prev, res.subCategory];
      });
    }
    return res;
  }, []);

  const deleteSubCategory = useCallback(async (subCategoryId: string, adminPassword?: string) => {
    const res = await storeService.deleteSubCategory(subCategoryId, adminPassword);
    if (res.success) {
      setSubCategories((prev) => prev.filter((s) => s.id !== subCategoryId));
    }
    return res;
  }, []);

  const saveProductType = useCallback(async (typeData: Partial<ProductType>, adminPassword?: string) => {
    const res = await storeService.saveProductType(typeData, adminPassword);
    if (res.success && res.productType) {
      setProductTypes((prev) => {
        const idx = prev.findIndex((t) => t.id === res.productType.id || t.slug === res.productType.slug);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = res.productType;
          return next;
        }
        return [...prev, res.productType];
      });
    }
    return res;
  }, []);

  const deleteProductType = useCallback(async (productTypeId: string, adminPassword?: string) => {
    const res = await storeService.deleteProductType(productTypeId, adminPassword);
    if (res.success) {
      setProductTypes((prev) => prev.filter((t) => t.id !== productTypeId));
    }
    return res;
  }, []);

  const saveChildCategory = useCallback(async (childData: Partial<ChildCategory>, adminPassword?: string) => {
    const res = await storeService.saveChildCategory(childData, adminPassword);
    if (res.success && res.childCategory) {
      setChildCategories((prev) => {
        const idx = prev.findIndex((c) => c.id === res.childCategory.id || c.slug === res.childCategory.slug);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = res.childCategory;
          return next;
        }
        return [...prev, res.childCategory];
      });
    }
    return res;
  }, []);

  const deleteChildCategory = useCallback(async (childCategoryId: string, adminPassword?: string) => {
    const res = await storeService.deleteChildCategory(childCategoryId, adminPassword);
    if (res.success) {
      setChildCategories((prev) => prev.filter((c) => c.id !== childCategoryId));
    }
    return res;
  }, []);

  // 8. Lookup & Traversal Helpers
  const getCategoryByIdOrSlug = useCallback((idOrSlug?: string): Category | undefined => {
    if (!idOrSlug) return undefined;
    const target = idOrSlug.toLowerCase().trim();
    return reconciledCategories.find(
      (c) => c.id.toLowerCase() === target || c.slug.toLowerCase() === target || matchesTaxonomyField(c.slug, target) || matchesTaxonomyField(c.name, target)
    );
  }, [reconciledCategories]);

  const getSubCategoryByIdOrSlug = useCallback((idOrSlug?: string): SubCategory | undefined => {
    if (!idOrSlug) return undefined;
    const target = idOrSlug.toLowerCase().trim();
    return reconciledSubCategories.find(
      (s) => s.id.toLowerCase() === target || s.slug.toLowerCase() === target || matchesTaxonomyField(s.slug, target) || matchesTaxonomyField(s.name, target)
    );
  }, [reconciledSubCategories]);

  const getProductTypeByIdOrSlug = useCallback((idOrSlug?: string): ProductType | undefined => {
    if (!idOrSlug) return undefined;
    const target = idOrSlug.toLowerCase().trim();
    return reconciledProductTypes.find(
      (t) => t.id.toLowerCase() === target || t.slug.toLowerCase() === target || matchesTaxonomyField(t.slug, target) || matchesTaxonomyField(t.name, target)
    );
  }, [reconciledProductTypes]);

  const getChildCategoryByIdOrSlug = useCallback((idOrSlug?: string): ChildCategory | undefined => {
    if (!idOrSlug) return undefined;
    const target = idOrSlug.toLowerCase().trim();
    return reconciledChildCategories.find(
      (c) => c.id.toLowerCase() === target || c.slug.toLowerCase() === target || matchesTaxonomyField(c.slug, target) || matchesTaxonomyField(c.name, target)
    );
  }, [reconciledChildCategories]);

  const getSubCategoriesForCategory = useCallback((categoryIdOrSlug?: string): SubCategory[] => {
    if (!categoryIdOrSlug) return reconciledSubCategories;
    const cat = getCategoryByIdOrSlug(categoryIdOrSlug);
    if (!cat) return [];
    return reconciledSubCategories.filter(
      (s) => s.category_id === cat.id || s.category_slug === cat.slug || matchesTaxonomyField(s.category_slug, cat.slug)
    );
  }, [reconciledSubCategories, getCategoryByIdOrSlug]);

  const getProductTypesForSubCategory = useCallback((subCategoryIdOrSlug?: string): ProductType[] => {
    if (!subCategoryIdOrSlug) return reconciledProductTypes;
    const sub = getSubCategoryByIdOrSlug(subCategoryIdOrSlug);
    if (!sub) return [];
    return reconciledProductTypes.filter(
      (t) => t.subcategory_id === sub.id || t.subcategory_slug === sub.slug || matchesTaxonomyField(t.subcategory_slug, sub.slug)
    );
  }, [reconciledProductTypes, getSubCategoryByIdOrSlug]);

  const getChildCategoriesForProductType = useCallback((productTypeIdOrSlug?: string): ChildCategory[] => {
    if (!productTypeIdOrSlug) return reconciledChildCategories;
    const type = getProductTypeByIdOrSlug(productTypeIdOrSlug);
    if (!type) return [];
    return reconciledChildCategories.filter(
      (c) => c.product_type_id === type.id || c.product_type_slug === type.slug || matchesTaxonomyField(c.product_type_slug, type.slug)
    );
  }, [reconciledChildCategories, getProductTypeByIdOrSlug]);

  const filterProducts = useCallback(
    (filter: Partial<TaxonomyFilterState>): Product[] => {
      return filterProductsByTaxonomy(products, filter);
    },
    [products]
  );

  const contextValue: TaxonomyContextValue = {
    categories,
    subCategories,
    productTypes,
    childCategories,
    products,

    reconciledCategories,
    reconciledSubCategories,
    reconciledProductTypes,
    reconciledChildCategories,

    taxonomyTree,
    categoryProductCountMap,

    loading,
    isInitialized,
    error,

    refreshTaxonomy,
    updateProductsState,

    saveCategory,
    deleteCategory,

    saveSubCategory,
    deleteSubCategory,

    saveProductType,
    deleteProductType,

    saveChildCategory,
    deleteChildCategory,

    getCategoryByIdOrSlug,
    getSubCategoryByIdOrSlug,
    getProductTypeByIdOrSlug,
    getChildCategoryByIdOrSlug,

    getSubCategoriesForCategory,
    getProductTypesForSubCategory,
    getChildCategoriesForProductType,

    filterProducts,
  };

  return (
    <TaxonomyContext.Provider value={contextValue}>
      {children}
    </TaxonomyContext.Provider>
  );
};

export function useTaxonomy(): TaxonomyContextValue {
  const context = useContext(TaxonomyContext);
  if (!context) {
    throw new Error('useTaxonomy must be used within a TaxonomyProvider');
  }
  return context;
}
