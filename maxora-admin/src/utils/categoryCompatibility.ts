import { Category, SubCategory, ProductType, ChildCategory, Product } from '../types';
import { generateSlug } from './seo';
import { matchesTaxonomyField } from './taxonomy';

/**
 * Checks whether a product belongs to a given category.
 * Supports:
 * 1. Matching by category_id
 * 2. Matching by category name (case-insensitive)
 * 3. Matching by slug & taxonomy variations (e.g. "Home & Living" vs "home-living")
 */
export function isProductInCategory(product: Product, category: Category): boolean {
  if (!product || !category) return false;
  if (product.category_id && (product.category_id === category.id || matchesTaxonomyField(product.category_id, category.id))) return true;
  if (matchesTaxonomyField(product.category, category.name)) return true;
  if (matchesTaxonomyField(product.category, category.slug)) return true;
  if (product.category_slug && matchesTaxonomyField(product.category_slug, category.slug)) return true;
  return false;
}

/**
 * Checks whether a product belongs to a given subcategory.
 * Supports:
 * 1. Matching by subcategory_id
 * 2. Matching by sub_category name (case-insensitive)
 * 3. Matching by slug & taxonomy variations
 */
export function isProductInSubCategory(product: Product, subCategory: SubCategory): boolean {
  if (!product || !subCategory) return false;
  if (product.subcategory_id && (product.subcategory_id === subCategory.id || matchesTaxonomyField(product.subcategory_id, subCategory.id))) return true;
  if (matchesTaxonomyField(product.sub_category, subCategory.name)) return true;
  if (matchesTaxonomyField(product.sub_category, subCategory.slug)) return true;
  if (product.subcategory_slug && matchesTaxonomyField(product.subcategory_slug, subCategory.slug)) return true;
  return false;
}

/**
 * Checks whether a product belongs to a given product type.
 */
export function isProductInProductType(product: Product, productType: ProductType): boolean {
  if (!product || !productType) return false;
  if (product.product_type_id && (product.product_type_id === productType.id || matchesTaxonomyField(product.product_type_id, productType.id))) return true;
  if (matchesTaxonomyField(product.product_type, productType.name)) return true;
  if (matchesTaxonomyField(product.product_type, productType.slug)) return true;
  if (product.product_type_slug && matchesTaxonomyField(product.product_type_slug, productType.slug)) return true;
  return false;
}

/**
 * Checks whether a product belongs to a given child category.
 */
export function isProductInChildCategory(product: Product, childCategory: ChildCategory): boolean {
  if (!product || !childCategory) return false;
  const pChildId = product.childcategory_id || product.child_category_id;
  if (pChildId && (pChildId === childCategory.id || matchesTaxonomyField(pChildId, childCategory.id))) return true;
  if (matchesTaxonomyField(product.child_category, childCategory.name)) return true;
  if (matchesTaxonomyField(product.child_category, childCategory.slug)) return true;
  const pChildSlug = product.childcategory_slug || product.child_category_slug;
  if (pChildSlug && matchesTaxonomyField(pChildSlug, childCategory.slug)) return true;
  return false;
}

/**
 * Merges explicit categories with any distinct categories discovered on products,
 * ensuring 100% backward compatibility with legacy and newly added product records.
 */
export function reconcileCategories(
  existingCategories: Category[] = [],
  products: Product[] = []
): Category[] {
  const categoryMap = new Map<string, Category>();

  // 1. Add existing registered categories
  (existingCategories || []).forEach((cat) => {
    if (!cat || !cat.name) return;
    const slug = cat.slug || generateSlug(cat.name);
    categoryMap.set(slug, {
      ...cat,
      slug,
    });
  });

  // 2. Discover categories from active products not yet in the map
  (products || []).forEach((prod) => {
    if (!prod.category) return;
    const catName = prod.category.trim();
    if (!catName || catName.toLowerCase() === 'uncategorized') return;
    const slug = generateSlug(catName);

    if (!categoryMap.has(slug)) {
      categoryMap.set(slug, {
        id: prod.category_id || `cat-auto-${slug}`,
        name: catName,
        slug: slug,
        display_order: categoryMap.size + 1,
        active: 1,
        created_at: new Date().toISOString(),
      });
    }
  });

  return Array.from(categoryMap.values()).sort((a, b) => {
    const orderA = a.display_order ?? 999;
    const orderB = b.display_order ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Merges explicit subcategories with any distinct sub_categories discovered on products.
 */
export function reconcileSubCategories(
  existingSubCategories: SubCategory[] = [],
  categories: Category[] = [],
  products: Product[] = []
): SubCategory[] {
  const subCategoryMap = new Map<string, SubCategory>();

  // 1. Add existing registered subcategories
  (existingSubCategories || []).forEach((sub) => {
    if (!sub || !sub.name) return;
    const subSlug = sub.slug || generateSlug(sub.name);
    const parentSlug = sub.category_slug || '';
    const key = `${parentSlug}:::${subSlug}`;
    subCategoryMap.set(key, {
      ...sub,
      slug: subSlug,
    });
  });

  // 2. Discover subcategories from active products
  (products || []).forEach((prod) => {
    if (!prod.sub_category) return;
    const subName = prod.sub_category.trim();
    if (!subName || subName.toLowerCase() === 'general') return;

    const parentCatName = (prod.category || '').trim();
    const parentCatSlug = generateSlug(parentCatName);
    const matchedCat = categories.find(
      (c) => matchesTaxonomyField(c.slug, parentCatSlug) || matchesTaxonomyField(c.name, parentCatName)
    );

    const subSlug = generateSlug(subName);
    const key = `${parentCatSlug}:::${subSlug}`;

    if (!subCategoryMap.has(key)) {
      subCategoryMap.set(key, {
        id: prod.subcategory_id || `subcat-auto-${subSlug}`,
        category_id: matchedCat?.id || `cat-auto-${parentCatSlug}`,
        category_slug: parentCatSlug,
        name: subName,
        slug: subSlug,
        display_order: subCategoryMap.size + 1,
        active: 1,
        created_at: new Date().toISOString(),
      });
    }
  });

  return Array.from(subCategoryMap.values()).sort((a, b) => {
    const orderA = a.display_order ?? 999;
    const orderB = b.display_order ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Merges explicit product types with any distinct product_types discovered on products.
 */
export function reconcileProductTypes(
  existingProductTypes: ProductType[] = [],
  categories: Category[] = [],
  subCategories: SubCategory[] = [],
  products: Product[] = []
): ProductType[] {
  const typeMap = new Map<string, ProductType>();

  // 1. Add existing registered product types
  (existingProductTypes || []).forEach((pt) => {
    if (!pt || !pt.name) return;
    const slug = pt.slug || generateSlug(pt.name);
    const key = `${pt.subcategory_slug || ''}:::${slug}`;
    typeMap.set(key, {
      ...pt,
      slug,
    });
  });

  // 2. Discover product types from active products
  (products || []).forEach((prod) => {
    if (!prod.product_type) return;
    const typeName = prod.product_type.trim();
    if (!typeName || typeName.toLowerCase() === 'standard product') return;

    const subName = (prod.sub_category || '').trim();
    const subSlug = generateSlug(subName);
    const typeSlug = generateSlug(typeName);
    const key = `${subSlug}:::${typeSlug}`;

    if (!typeMap.has(key)) {
      typeMap.set(key, {
        id: prod.product_type_id || `pt-auto-${typeSlug}`,
        category_id: prod.category_id || '',
        category_slug: generateSlug(prod.category || ''),
        subcategory_id: prod.subcategory_id || '',
        subcategory_slug: subSlug,
        name: typeName,
        slug: typeSlug,
        display_order: typeMap.size + 1,
        active: 1,
        created_at: new Date().toISOString(),
      });
    }
  });

  return Array.from(typeMap.values()).sort((a, b) => {
    const orderA = a.display_order ?? 999;
    const orderB = b.display_order ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Merges explicit child categories with any distinct child_categories discovered on products.
 */
export function reconcileChildCategories(
  existingChildCategories: ChildCategory[] = [],
  categories: Category[] = [],
  subCategories: SubCategory[] = [],
  productTypes: ProductType[] = [],
  products: Product[] = []
): ChildCategory[] {
  const childMap = new Map<string, ChildCategory>();

  // 1. Add existing registered child categories
  (existingChildCategories || []).forEach((ch) => {
    if (!ch || !ch.name) return;
    const slug = ch.slug || generateSlug(ch.name);
    const key = `${ch.product_type_slug || ''}:::${slug}`;
    childMap.set(key, {
      ...ch,
      slug,
    });
  });

  // 2. Discover child categories from active products
  (products || []).forEach((prod) => {
    if (!prod.child_category) return;
    const rawChild = prod.child_category.trim();
    if (!rawChild) return;

    const parts = rawChild.includes(',') || rawChild.includes('/')
      ? rawChild.split(/[,/]+/).map((s) => s.trim()).filter(Boolean)
      : [rawChild];

    const typeSlug = generateSlug(prod.product_type || '');
    const subSlug = generateSlug(prod.sub_category || '');
    const catSlug = generateSlug(prod.category || '');

    parts.forEach((childName) => {
      const childSlug = generateSlug(childName);
      const key = `${typeSlug}:::${childSlug}`;

      if (!childMap.has(key)) {
        childMap.set(key, {
          id: (prod.childcategory_id || prod.child_category_id) || `child-auto-${childSlug}`,
          category_id: prod.category_id || '',
          category_slug: catSlug,
          subcategory_id: prod.subcategory_id || '',
          subcategory_slug: subSlug,
          product_type_id: prod.product_type_id || '',
          product_type_slug: typeSlug,
          product_type_name: prod.product_type || '',
          name: childName,
          slug: childSlug,
          display_order: childMap.size + 1,
          active: 1,
          created_at: new Date().toISOString(),
        });
      }
    });
  });

  return Array.from(childMap.values()).sort((a, b) => {
    const orderA = a.display_order ?? 999;
    const orderB = b.display_order ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });
}
