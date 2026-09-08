import { Category, SubCategory, Product } from '../types';
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
  const categoryMap = new Map<string, Category>();

  // 1. Add explicitly registered categories
  existingCategories.forEach((cat) => {
    const key = cat.slug || generateSlug(cat.name);
    categoryMap.set(key, { ...cat, slug: key });
  });

  // 2. Discover any category names on products not yet in the map
  products.forEach((prod) => {
    if (!prod.category) return;
    const catName = prod.category.trim();
    if (!catName) return;
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
  const subCategoryMap = new Map<string, SubCategory>();

  // 1. Add explicitly registered subcategories
  existingSubCategories.forEach((sub) => {
    const key = `${sub.category_slug || ''}:::${sub.slug || generateSlug(sub.name)}`;
    subCategoryMap.set(key, sub);
  });

  // 2. Discover any subcategories on products
  products.forEach((prod) => {
    if (!prod.sub_category) return;
    const subName = prod.sub_category.trim();
    if (!subName) return;

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
