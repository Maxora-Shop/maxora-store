import { Product, Category, SubCategory } from '../types';
import { generateSlug } from './seo';

export interface TaxonomyChildCategory {
  name: string;
  slug: string;
  count: number;
}

export interface TaxonomyProductType {
  name: string;
  slug: string;
  count: number;
  childCategories: TaxonomyChildCategory[];
}

export interface TaxonomySubCategory {
  id?: string;
  name: string;
  slug: string;
  count: number;
  productTypes: TaxonomyProductType[];
}

export interface TaxonomyCategory {
  id?: string;
  name: string;
  slug: string;
  icon?: string;
  image_url?: string;
  display_order?: number;
  count: number;
  subCategories: TaxonomySubCategory[];
}

export interface TaxonomyFilterState {
  category: string;
  subCategory: string;
  productType: string;
  childCategory: string;
}

/**
 * Normalizes string comparison (case-insensitive, trims, and slug-friendly)
 */
export function normalizeKey(val?: string): string {
  if (!val) return '';
  return val.toLowerCase().trim().replace(/[\s_]+/g, '-');
}

/**
 * Check if a product's field matches a target filter
 */
export function matchesTaxonomyField(actual?: string, target?: string): boolean {
  if (!target || !target.trim()) return true;
  if (!actual || !actual.trim()) return false;
  
  const normActual = normalizeKey(actual);
  const normTarget = normalizeKey(target);

  if (normActual === normTarget) return true;

  // If actual is comma or slash separated list of tags (e.g. "AMOLED, Calling")
  if (actual.includes(',') || actual.includes('/')) {
    const parts = actual.split(/[,/]+/).map(p => normalizeKey(p));
    return parts.includes(normTarget);
  }

  return false;
}

/**
 * Builds a dynamic 4-tier taxonomy tree directly from product fields and category registry:
 * 1. Category (product.category)
 *    2. Subcategory (product.sub_category)
 *       3. Product Type (product.product_type)
 *          4. Child Category (product.child_category)
 *
 * NOTE: Products are NOT a separate menu level. Products are displayed
 * automatically upon selection of any node.
 */
export function buildTaxonomyTree(
  products: Product[] = [],
  registeredCategories: Category[] = [],
  registeredSubCategories: SubCategory[] = []
): TaxonomyCategory[] {
  const activeProducts = products.filter((p) => p.active !== 0 && p.active !== false);

  // Map of registered category metadata by normalized name or slug
  const regCatMap = new Map<string, Category>();
  registeredCategories.forEach((cat) => {
    if (cat.name) regCatMap.set(normalizeKey(cat.name), cat);
    if (cat.slug) regCatMap.set(normalizeKey(cat.slug), cat);
  });

  // Map of registered subcategory metadata
  const regSubMap = new Map<string, SubCategory>();
  registeredSubCategories.forEach((sub) => {
    if (sub.name) regSubMap.set(normalizeKey(sub.name), sub);
    if (sub.slug) regSubMap.set(normalizeKey(sub.slug), sub);
  });

  // Intermediate nested structure
  interface RawChild {
    name: string;
    slug: string;
    count: number;
  }
  interface RawType {
    name: string;
    slug: string;
    count: number;
    children: Map<string, RawChild>;
  }
  interface RawSub {
    name: string;
    slug: string;
    id?: string;
    count: number;
    types: Map<string, RawType>;
  }
  interface RawCat {
    name: string;
    slug: string;
    id?: string;
    icon?: string;
    image_url?: string;
    display_order?: number;
    count: number;
    subs: Map<string, RawSub>;
  }

  const categoryMap = new Map<string, RawCat>();

  // 1. Seed registered categories first to preserve curated order and metadata
  registeredCategories.forEach((cat) => {
    if (!cat.name || cat.active === 0 || cat.active === false) return;
    const catKey = normalizeKey(cat.name);
    if (!categoryMap.has(catKey)) {
      categoryMap.set(catKey, {
        name: cat.name.trim(),
        slug: cat.slug || generateSlug(cat.name),
        id: cat.id,
        icon: cat.icon,
        image_url: cat.image_url,
        display_order: cat.display_order ?? 99,
        count: 0,
        subs: new Map(),
      });
    }
  });

  // 2. Seed registered subcategories
  registeredSubCategories.forEach((sub) => {
    if (!sub.name || sub.active === 0 || sub.active === false) return;
    // Find matching category
    let matchedCatKey: string | null = null;
    if (sub.category_slug && categoryMap.has(normalizeKey(sub.category_slug))) {
      matchedCatKey = normalizeKey(sub.category_slug);
    } else if (sub.category_id) {
      for (const [key, c] of categoryMap.entries()) {
        if (c.id === sub.category_id) {
          matchedCatKey = key;
          break;
        }
      }
    }

    if (matchedCatKey) {
      const catObj = categoryMap.get(matchedCatKey)!;
      const subKey = normalizeKey(sub.name);
      if (!catObj.subs.has(subKey)) {
        catObj.subs.set(subKey, {
          name: sub.name.trim(),
          slug: sub.slug || generateSlug(sub.name),
          id: sub.id,
          count: 0,
          types: new Map(),
        });
      }
    }
  });

  // 3. Populate and enrich dynamically from existing product fields
  activeProducts.forEach((p) => {
    const rawCatName = (p.category || '').trim();
    if (!rawCatName) return;

    const catKey = normalizeKey(rawCatName);
    let catNode = categoryMap.get(catKey);

    if (!catNode) {
      const regMatch = regCatMap.get(catKey);
      catNode = {
        name: regMatch ? regMatch.name : rawCatName,
        slug: regMatch?.slug || generateSlug(rawCatName),
        id: regMatch?.id,
        icon: regMatch?.icon,
        image_url: regMatch?.image_url,
        display_order: regMatch?.display_order ?? 100,
        count: 0,
        subs: new Map(),
      };
      categoryMap.set(catKey, catNode);
    }
    catNode.count += 1;

    // Subcategory tier (product.sub_category)
    const rawSubName = (p.sub_category || '').trim();
    if (rawSubName) {
      const subKey = normalizeKey(rawSubName);
      let subNode = catNode.subs.get(subKey);
      if (!subNode) {
        const regSub = regSubMap.get(subKey);
        subNode = {
          name: regSub ? regSub.name : rawSubName,
          slug: regSub?.slug || generateSlug(rawSubName),
          id: regSub?.id,
          count: 0,
          types: new Map(),
        };
        catNode.subs.set(subKey, subNode);
      }
      subNode.count += 1;

      // Product Type tier (product.product_type)
      const rawTypeName = (p.product_type || '').trim();
      if (rawTypeName) {
        const typeKey = normalizeKey(rawTypeName);
        let typeNode = subNode.types.get(typeKey);
        if (!typeNode) {
          typeNode = {
            name: rawTypeName,
            slug: generateSlug(rawTypeName),
            count: 0,
            children: new Map(),
          };
          subNode.types.set(typeKey, typeNode);
        }
        typeNode.count += 1;

        // Child Category tier (product.child_category)
        const rawChildName = (p.child_category || '').trim();
        if (rawChildName) {
          // If multiple tags are comma-delimited, e.g. "AMOLED, Calling"
          const childParts = rawChildName.includes(',') || rawChildName.includes('/')
            ? rawChildName.split(/[,/]+/).map((s) => s.trim()).filter(Boolean)
            : [rawChildName];

          childParts.forEach((cpName) => {
            const childKey = normalizeKey(cpName);
            let childNode = typeNode!.children.get(childKey);
            if (!childNode) {
              childNode = {
                name: cpName,
                slug: generateSlug(cpName),
                count: 0,
              };
              typeNode!.children.set(childKey, childNode);
            }
            childNode.count += 1;
          });
        }
      }
    }
  });

  // Convert map to sorted arrays
  const categoriesList: TaxonomyCategory[] = Array.from(categoryMap.values())
    .map((c) => {
      const subCategories: TaxonomySubCategory[] = Array.from(c.subs.values())
        .map((s) => {
          const productTypes: TaxonomyProductType[] = Array.from(s.types.values())
            .map((t) => {
              const childCategories: TaxonomyChildCategory[] = Array.from(t.children.values())
                .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
              return {
                name: t.name,
                slug: t.slug,
                count: t.count,
                childCategories,
              };
            })
            .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

          return {
            id: s.id,
            name: s.name,
            slug: s.slug,
            count: s.count,
            productTypes,
          };
        })
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        image_url: c.image_url,
        display_order: c.display_order ?? 99,
        count: c.count,
        subCategories,
      };
    })
    .sort((a, b) => {
      // Products count first or display_order
      if (a.display_order !== b.display_order) {
        return (a.display_order ?? 99) - (b.display_order ?? 99);
      }
      return b.count - a.count || a.name.localeCompare(b.name);
    });

  return categoriesList;
}

/**
 * Filter products according to the active 4-tier taxonomy filter
 */
export function filterProductsByTaxonomy(
  products: Product[],
  filter: Partial<TaxonomyFilterState>
): Product[] {
  const { category = '', subCategory = '', productType = '', childCategory = '' } = filter;

  return products.filter((p) => {
    // 1. Category check
    if (category && category !== 'all' && category !== 'All') {
      if (!matchesTaxonomyField(p.category, category)) {
        return false;
      }
    }

    // 2. Subcategory check
    if (subCategory && subCategory !== 'all' && subCategory !== 'All') {
      if (!matchesTaxonomyField(p.sub_category, subCategory)) {
        return false;
      }
    }

    // 3. Product Type check
    if (productType && productType !== 'all' && productType !== 'All') {
      if (!matchesTaxonomyField(p.product_type, productType)) {
        return false;
      }
    }

    // 4. Child Category check
    if (childCategory && childCategory !== 'all' && childCategory !== 'All') {
      if (!matchesTaxonomyField(p.child_category, childCategory)) {
        return false;
      }
    }

    return true;
  });
}
