import { Category, SubCategory, ProductType, ChildCategory, Product } from '../types';
import { generateSlug } from './seo';

/**
 * Checks whether a product belongs to a given category.
 * Supports:
 * 1. Matching by category_id
 * 2. Matching by category name (case-insensitive)
 * 3. Matching by slug
 */
export function isProductInCategory(product: Product, category: Category): boolean {
  if (!product || !category) return false;
  if (product.category_id && product.category_id === category.id) return true;
  if (product.category && product.category.toLowerCase().trim() === category.name.toLowerCase().trim()) return true;
  if (product.category && generateSlug(product.category) === category.slug) return true;
  if (product.category_slug && product.category_slug === category.slug) return true;
  return false;
}

/**
 * Checks whether a product belongs to a given subcategory.
 * Supports:
 * 1. Matching by subcategory_id
 * 2. Matching by sub_category name (case-insensitive)
 * 3. Matching by slug
 */
export function isProductInSubCategory(product: Product, subCategory: SubCategory): boolean {
  if (!product || !subCategory) return false;
  if (product.subcategory_id && product.subcategory_id === subCategory.id) return true;
  if (product.sub_category && product.sub_category.toLowerCase().trim() === subCategory.name.toLowerCase().trim()) return true;
  if (product.sub_category && generateSlug(product.sub_category) === subCategory.slug) return true;
  if (product.subcategory_slug && product.subcategory_slug === subCategory.slug) return true;
  return false;
}

/**
 * Checks whether a product belongs to a given product type.
 */
export function isProductInProductType(product: Product, productType: ProductType): boolean {
  if (!product || !productType) return false;
  if (product.product_type_id && product.product_type_id === productType.id) return true;
  if (product.product_type && product.product_type.toLowerCase().trim() === productType.name.toLowerCase().trim()) return true;
  if (product.product_type && generateSlug(product.product_type) === productType.slug) return true;
  if (product.product_type_slug && product.product_type_slug === productType.slug) return true;
  return false;
}

/**
 * Checks whether a product belongs to a given child category.
 */
export function isProductInChildCategory(product: Product, childCategory: ChildCategory): boolean {
  if (!product || !childCategory) return false;
  const pChildId = product.childcategory_id || product.child_category_id;
  if (pChildId && pChildId === childCategory.id) return true;

  const targetName = childCategory.name.toLowerCase().trim();
  const targetSlug = childCategory.slug;

  const pChild = (product.child_category || '').toLowerCase().trim();
  if (pChild) {
    if (pChild === targetName || generateSlug(pChild) === targetSlug) return true;
    if (pChild.includes(',') || pChild.includes('/')) {
      const parts = pChild.split(/[,/]+/).map((s) => s.trim());
      if (parts.some((part) => part.toLowerCase() === targetName || generateSlug(part) === targetSlug)) {
        return true;
      }
    }
  }

  const pChildSlug = product.childcategory_slug || product.child_category_slug;
  if (pChildSlug && pChildSlug === targetSlug) return true;

  return false;
}

/**
 * Merges explicit categories with any distinct categories discovered on products,
 * ensuring 100% backward compatibility with legacy product records.
 */
export function reconcileCategories(
  existingCategories: Category[],
  products: Product[]
): Category[] {
  if (existingCategories && existingCategories.length > 0) {
    // If the store already has defined categories, respect them directly!
    return [...existingCategories].sort((a, b) => {
      const orderA = a.display_order ?? 999;
      const orderB = b.display_order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
  }

  // Only if no categories are registered at all, discover them from products
  const categoryMap = new Map<string, Category>();
  products.forEach((prod) => {
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
  existingSubCategories: SubCategory[],
  categories: Category[],
  products: Product[]
): SubCategory[] {
  if (existingSubCategories && existingSubCategories.length > 0) {
    return [...existingSubCategories].sort((a, b) => {
      const orderA = a.display_order ?? 999;
      const orderB = b.display_order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
  }

  const subCategoryMap = new Map<string, SubCategory>();
  products.forEach((prod) => {
    if (!prod.sub_category) return;
    const subName = prod.sub_category.trim();
    if (!subName || subName.toLowerCase() === 'general') return;

    const parentCatName = (prod.category || '').trim();
    const parentCatSlug = generateSlug(parentCatName);
    const matchedCat = categories.find(
      (c) => c.slug === parentCatSlug || c.name.toLowerCase() === parentCatName.toLowerCase()
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
