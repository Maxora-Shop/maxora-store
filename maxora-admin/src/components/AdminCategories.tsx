import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  RefreshCw,
  FolderTree,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Folder,
  FolderPlus,
  Sparkles,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import { Category, SubCategory, ProductType, ChildCategory, Product } from '../types';
import { storeService } from '../services/storeService';
import { generateSlug } from '../utils/seo';

interface AdminCategoriesProps {
  password?: string;
  products?: Product[];
  onUpdated?: () => void;
}

type TabType = 'tree' | 'categories' | 'subcategories' | 'product_types' | 'child_categories';

interface DeleteTarget {
  tier: 'category' | 'subcategory' | 'product_type' | 'child_category';
  id: string;
  name: string;
  childItemsCount: number;
  productCount: number;
}

export const AdminCategories: React.FC<AdminCategoriesProps> = ({
  password = '',
  products = [],
  onUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('tree');
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [childCategories, setChildCategories] = useState<ChildCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Hierarchy Tree expand/collapse state
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Filters for individual tab tables
  const [filterCatId, setFilterCatId] = useState('');
  const [filterSubId, setFilterSubId] = useState('');
  const [filterTypeId, setFilterTypeId] = useState('');

  // Modals for CRUD
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Partial<SubCategory> | null>(null);

  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<Partial<ProductType> | null>(null);

  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Partial<ChildCategory> | null>(null);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3200);
  };

  useEffect(() => {
    loadAllTaxonomy();
  }, []);

  const loadAllTaxonomy = async () => {
    setLoading(true);
    try {
      const [cats, subs, types, childs] = await Promise.all([
        storeService.getCategories(),
        storeService.getSubCategories(),
        storeService.getProductTypes(),
        storeService.getChildCategories(),
      ]);
      setCategories(cats);
      setSubCategories(subs);
      setProductTypes(types);
      setChildCategories(childs);

      // Auto-expand all top-level categories by default
      const defaultExpanded: Record<string, boolean> = {};
      cats.forEach((c) => {
        defaultExpanded[`cat-${c.id}`] = true;
      });
      subs.forEach((s) => {
        defaultExpanded[`sub-${s.id}`] = true;
      });
      setExpandedNodes((prev) => ({ ...defaultExpanded, ...prev }));
    } catch (err: any) {
      console.error('Failed to load taxonomy:', err);
      showToast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeKey: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeKey]: !prev[nodeKey],
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    categories.forEach((c) => (next[`cat-${c.id}`] = true));
    subCategories.forEach((s) => (next[`sub-${s.id}`] = true));
    productTypes.forEach((t) => (next[`type-${t.id}`] = true));
    setExpandedNodes(next);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  // ============================================
  // PRODUCT COUNT HELPERS
  // ============================================
  const getProductCountForCat = (cat: Category) => {
    return products.filter((p) => {
      if (p.category_id && p.category_id === cat.id) return true;
      if (p.category && (p.category.toLowerCase().trim() === cat.name.toLowerCase().trim() || generateSlug(p.category) === cat.slug)) return true;
      return false;
    }).length;
  };

  const getProductCountForSub = (sub: SubCategory) => {
    return products.filter((p) => {
      if (p.subcategory_id && p.subcategory_id === sub.id) return true;
      if (p.sub_category && (p.sub_category.toLowerCase().trim() === sub.name.toLowerCase().trim() || generateSlug(p.sub_category) === sub.slug)) return true;
      return false;
    }).length;
  };

  const getProductCountForType = (type: ProductType) => {
    return products.filter((p) => {
      if (p.product_type && (p.product_type.toLowerCase().trim() === type.name.toLowerCase().trim() || generateSlug(p.product_type) === type.slug)) return true;
      return false;
    }).length;
  };

  const getProductCountForChild = (child: ChildCategory) => {
    return products.filter((p) => {
      if (!p.child_category) return false;
      const raw = p.child_category.toLowerCase();
      const target = child.name.toLowerCase().trim();
      return raw.includes(target) || generateSlug(raw) === child.slug;
    }).length;
  };

  // ============================================
  // TIER 1: CATEGORY CRUD
  // ============================================
  const handleOpenAddCategory = () => {
    setEditingCategory({
      name: '',
      slug: '',
      image_url: '',
      icon: 'Watch',
      display_order: categories.length + 1,
      active: 1,
    });
    setIsCategoryModalOpen(true);
  };

  // Quick Toggle Status Handlers
  const handleToggleCategoryStatus = async (cat: Category) => {
    try {
      const newActive = (cat.active === 0 || cat.active === false) ? 1 : 0;
      await storeService.saveCategory({ ...cat, active: newActive }, password);
      showToast(`Category "${cat.name}" is now ${newActive ? 'Active' : 'Hidden'}!`, 'success');
      await loadAllTaxonomy();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to update category status', 'error');
    }
  };

  const handleToggleSubStatus = async (sub: SubCategory) => {
    try {
      const newActive = (sub.active === 0 || sub.active === false) ? 1 : 0;
      await storeService.saveSubCategory({ ...sub, active: newActive }, password);
      showToast(`Subcategory "${sub.name}" is now ${newActive ? 'Active' : 'Hidden'}!`, 'success');
      await loadAllTaxonomy();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to update subcategory status', 'error');
    }
  };

  const handleToggleTypeStatus = async (type: ProductType) => {
    try {
      const newActive = (type.active === 0 || type.active === false) ? 1 : 0;
      await storeService.saveProductType({ ...type, active: newActive }, password);
      showToast(`Product Type "${type.name}" is now ${newActive ? 'Active' : 'Hidden'}!`, 'success');
      await loadAllTaxonomy();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to update product type status', 'error');
    }
  };

  const handleToggleChildStatus = async (child: ChildCategory) => {
    try {
      const newActive = (child.active === 0 || child.active === false) ? 1 : 0;
      await storeService.saveChildCategory({ ...child, active: newActive }, password);
      showToast(`Child Category "${child.name}" is now ${newActive ? 'Active' : 'Hidden'}!`, 'success');
      await loadAllTaxonomy();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to update child category status', 'error');
    }
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory({
      ...cat,
      active: cat.active !== undefined ? (cat.active !== 0 && cat.active !== false ? 1 : 0) : 1,
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name?.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    try {
      setLoading(true);
      const slug = editingCategory.slug?.trim() || generateSlug(editingCategory.name);
      const catToSave: Partial<Category> = {
        ...editingCategory,
        name: editingCategory.name.trim(),
        slug,
        display_order: Number(editingCategory.display_order) || 1,
        active: editingCategory.active !== 0 && editingCategory.active !== false ? 1 : 0,
      };

      await storeService.saveCategory(catToSave, password);
      showToast('Category saved successfully!', 'success');
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      await loadAllTaxonomy();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to save category', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // TIER 2: SUBCATEGORY CRUD
  // ============================================
  const handleOpenAddSub = (parentCatId?: string) => {
    const selectedCat = parentCatId
      ? categories.find((c) => c.id === parentCatId)
      : categories[0];

    setEditingSub({
      category_id: selectedCat?.id || '',
      category_slug: selectedCat?.slug || '',
      name: '',
      slug: '',
      display_order: subCategories.length + 1,
      active: 1,
    });
    setIsSubModalOpen(true);
  };

  const handleOpenEditSub = (sub: SubCategory) => {
    const parentCat = categories.find((c) => c.id === sub.category_id || c.slug === sub.category_slug);
    setEditingSub({
      ...sub,
      category_id: parentCat?.id || sub.category_id || '',
      category_slug: parentCat?.slug || sub.category_slug || '',
      active: sub.active !== undefined ? (sub.active !== 0 && sub.active !== false ? 1 : 0) : 1,
    });
    setIsSubModalOpen(true);
  };

  const handleSaveSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub?.name?.trim()) {
      showToast('Subcategory name is required', 'error');
      return;
    }
    if (!editingSub?.category_id) {
      showToast('Please select a parent category', 'error');
      return;
    }

    try {
      setLoading(true);
      const parentCat = categories.find((c) => c.id === editingSub.category_id);
      const slug = editingSub.slug?.trim() || generateSlug(editingSub.name);
      const subToSave: Partial<SubCategory> = {
        ...editingSub,
        name: editingSub.name.trim(),
        slug,
        category_slug: parentCat?.slug || editingSub.category_slug || '',
        display_order: Number(editingSub.display_order) || 1,
        active: editingSub.active !== 0 && editingSub.active !== false ? 1 : 0,
      };

      await storeService.saveSubCategory(subToSave, password);
      showToast('Subcategory saved successfully!', 'success');
      setIsSubModalOpen(false);
      setEditingSub(null);
      await loadAllTaxonomy();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to save subcategory', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // TIER 3: PRODUCT TYPE CRUD
  // ============================================
  const handleOpenAddType = (parentSubId?: string) => {
    const selectedSub = parentSubId
      ? subCategories.find((s) => s.id === parentSubId)
      : subCategories[0];
    const parentCat = selectedSub
      ? categories.find((c) => c.id === selectedSub.category_id || c.slug === selectedSub.category_slug)
      : categories[0];

    setEditingType({
      category_id: parentCat?.id || '',
      category_slug: parentCat?.slug || '',
      subcategory_id: selectedSub?.id || '',
      subcategory_slug: selectedSub?.slug || '',
      name: '',
      slug: '',
      display_order: productTypes.length + 1,
      active: 1,
    });
    setIsTypeModalOpen(true);
  };

  const handleOpenEditType = (pt: ProductType) => {
    const parentSub = subCategories.find((s) => s.id === pt.subcategory_id || s.slug === pt.subcategory_slug);
    const parentCat = categories.find((c) => c.id === (parentSub?.category_id || pt.category_id) || c.slug === (parentSub?.category_slug || pt.category_slug));
    setEditingType({
      ...pt,
      subcategory_id: parentSub?.id || pt.subcategory_id || '',
      subcategory_slug: parentSub?.slug || pt.subcategory_slug || '',
      category_id: parentCat?.id || pt.category_id || '',
      category_slug: parentCat?.slug || pt.category_slug || '',
      active: pt.active !== undefined ? (pt.active !== 0 && pt.active !== false ? 1 : 0) : 1,
    });
    setIsTypeModalOpen(true);
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType?.name?.trim()) {
      showToast('Product Type name is required', 'error');
      return;
    }
    if (!editingType?.subcategory_id) {
      showToast('Please select a parent Subcategory', 'error');
      return;
    }

    try {
      setLoading(true);
      const parentSub = subCategories.find((s) => s.id === editingType.subcategory_id);
      const parentCat = categories.find((c) => c.id === parentSub?.category_id || c.slug === parentSub?.category_slug);
      const slug = editingType.slug?.trim() || generateSlug(editingType.name);

      const typeToSave: Partial<ProductType> = {
        ...editingType,
        name: editingType.name.trim(),
        slug,
        subcategory_slug: parentSub?.slug || editingType.subcategory_slug || '',
        category_id: parentCat?.id || editingType.category_id || '',
        category_slug: parentCat?.slug || editingType.category_slug || '',
        display_order: Number(editingType.display_order) || 1,
        active: editingType.active !== 0 && editingType.active !== false ? 1 : 0,
      };

      await storeService.saveProductType(typeToSave, password);
      showToast('Product Type saved successfully!', 'success');
      setIsTypeModalOpen(false);
      setEditingType(null);
      await loadAllTaxonomy();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to save product type', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // TIER 4: CHILD CATEGORY CRUD
  // ============================================
  const handleOpenAddChild = (parentTypeId?: string) => {
    const selectedType = parentTypeId
      ? productTypes.find((t) => t.id === parentTypeId)
      : productTypes[0];
    const parentSub = selectedType
      ? subCategories.find((s) => s.id === selectedType.subcategory_id || s.slug === selectedType.subcategory_slug)
      : subCategories[0];
    const parentCat = parentSub
      ? categories.find((c) => c.id === parentSub.category_id || c.slug === parentSub.category_slug)
      : categories[0];

    setEditingChild({
      category_id: parentCat?.id || '',
      category_slug: parentCat?.slug || '',
      subcategory_id: parentSub?.id || '',
      subcategory_slug: parentSub?.slug || '',
      product_type_id: selectedType?.id || '',
      product_type_slug: selectedType?.slug || '',
      product_type_name: selectedType?.name || '',
      name: '',
      slug: '',
      display_order: childCategories.length + 1,
      active: 1,
    });
    setIsChildModalOpen(true);
  };

  const handleOpenEditChild = (ch: ChildCategory) => {
    const parentType = productTypes.find(
      (t) =>
        t.id === ch.product_type_id ||
        t.slug === ch.product_type_slug ||
        (ch.product_type_name && t.name.toLowerCase() === ch.product_type_name.toLowerCase())
    );
    const parentSub = subCategories.find(
      (s) =>
        s.id === (parentType?.subcategory_id || ch.subcategory_id) ||
        s.slug === (parentType?.subcategory_slug || ch.subcategory_slug)
    );
    const parentCat = categories.find(
      (c) =>
        c.id === (parentSub?.category_id || ch.category_id) ||
        c.slug === (parentSub?.category_slug || ch.category_slug)
    );

    setEditingChild({
      ...ch,
      product_type_id: parentType?.id || ch.product_type_id || '',
      product_type_slug: parentType?.slug || ch.product_type_slug || '',
      product_type_name: parentType?.name || ch.product_type_name || '',
      subcategory_id: parentSub?.id || ch.subcategory_id || '',
      subcategory_slug: parentSub?.slug || ch.subcategory_slug || '',
      category_id: parentCat?.id || ch.category_id || '',
      category_slug: parentCat?.slug || ch.category_slug || '',
      active: ch.active !== undefined ? (ch.active !== 0 && ch.active !== false ? 1 : 0) : 1,
    });
    setIsChildModalOpen(true);
  };

  const handleSaveChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChild?.name?.trim()) {
      showToast('Child Category name is required', 'error');
      return;
    }
    if (!editingChild?.product_type_id) {
      showToast('Please select a parent Product Type', 'error');
      return;
    }

    try {
      setLoading(true);
      const parentType = productTypes.find((t) => t.id === editingChild.product_type_id);
      const parentSub = subCategories.find((s) => s.id === parentType?.subcategory_id || s.slug === parentType?.subcategory_slug);
      const parentCat = categories.find((c) => c.id === parentSub?.category_id || c.slug === parentSub?.category_slug);
      const slug = editingChild.slug?.trim() || generateSlug(editingChild.name);

      const childToSave: Partial<ChildCategory> = {
        ...editingChild,
        name: editingChild.name.trim(),
        slug,
        product_type_slug: parentType?.slug || editingChild.product_type_slug || '',
        product_type_name: parentType?.name || editingChild.product_type_name || '',
        subcategory_id: parentSub?.id || editingChild.subcategory_id || '',
        subcategory_slug: parentSub?.slug || editingChild.subcategory_slug || '',
        category_id: parentCat?.id || editingChild.category_id || '',
        category_slug: parentCat?.slug || editingChild.category_slug || '',
        display_order: Number(editingChild.display_order) || 1,
        active: editingChild.active !== 0 && editingChild.active !== false ? 1 : 0,
      };

      await storeService.saveChildCategory(childToSave, password);
      showToast('Child Category saved successfully!', 'success');
      setIsChildModalOpen(false);
      setEditingChild(null);
      await loadAllTaxonomy();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to save child category', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // DELETE CONFIRMATION & EXECUTION
  // ============================================
  const initiateDelete = (
    tier: 'category' | 'subcategory' | 'product_type' | 'child_category',
    item: Category | SubCategory | ProductType | ChildCategory
  ) => {
    let childItemsCount = 0;
    let productCount = 0;

    if (tier === 'category') {
      const cat = item as Category;
      const directSubs = subCategories.filter((s) => s.category_id === cat.id || s.category_slug === cat.slug);
      const directSubIds = new Set(directSubs.map((s) => s.id));
      const directTypes = productTypes.filter((t) => directSubIds.has(t.subcategory_id || ''));
      const directTypeIds = new Set(directTypes.map((t) => t.id));
      const directChilds = childCategories.filter((ch) => directTypeIds.has(ch.product_type_id || ''));
      childItemsCount = directSubs.length + directTypes.length + directChilds.length;
      productCount = getProductCountForCat(cat);
    } else if (tier === 'subcategory') {
      const sub = item as SubCategory;
      const directTypes = productTypes.filter((t) => t.subcategory_id === sub.id || t.subcategory_slug === sub.slug);
      const directTypeIds = new Set(directTypes.map((t) => t.id));
      const directChilds = childCategories.filter((ch) => directTypeIds.has(ch.product_type_id || ''));
      childItemsCount = directTypes.length + directChilds.length;
      productCount = getProductCountForSub(sub);
    } else if (tier === 'product_type') {
      const type = item as ProductType;
      const directChilds = childCategories.filter((ch) => ch.product_type_id === type.id || ch.product_type_slug === type.slug);
      childItemsCount = directChilds.length;
      productCount = getProductCountForType(type);
    } else {
      const child = item as ChildCategory;
      childItemsCount = 0;
      productCount = getProductCountForChild(child);
    }

    setDeleteTarget({
      tier,
      id: item.id,
      name: item.name,
      childItemsCount,
      productCount,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      if (deleteTarget.tier === 'category') {
        await storeService.deleteCategory(deleteTarget.id, password);
      } else if (deleteTarget.tier === 'subcategory') {
        await storeService.deleteSubCategory(deleteTarget.id, password);
      } else if (deleteTarget.tier === 'product_type') {
        await storeService.deleteProductType(deleteTarget.id, password);
      } else if (deleteTarget.tier === 'child_category') {
        await storeService.deleteChildCategory(deleteTarget.id, password);
      }

      showToast(`Deleted ${deleteTarget.name} permanently`, 'success');
      setDeleteTarget(null);
      await loadAllTaxonomy();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete item', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // ============================================
  // FILTERED LISTS FOR TABS
  // ============================================
  const filteredCategories = useMemo(() => {
    return categories.filter((c) =>
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  const filteredSubCategories = useMemo(() => {
    return subCategories.filter((s) => {
      const matchesSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesParent = !filterCatId || s.category_id === filterCatId || s.category_slug === filterCatId;
      return matchesSearch && matchesParent;
    });
  }, [subCategories, searchQuery, filterCatId]);

  const filteredProductTypes = useMemo(() => {
    return productTypes.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesParent = !filterSubId || t.subcategory_id === filterSubId || t.subcategory_slug === filterSubId;
      return matchesSearch && matchesParent;
    });
  }, [productTypes, searchQuery, filterSubId]);

  const filteredChildCategories = useMemo(() => {
    return childCategories.filter((ch) => {
      const matchesSearch =
        !searchQuery ||
        ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesParent = !filterTypeId || ch.product_type_id === filterTypeId || ch.product_type_slug === filterTypeId;
      return matchesSearch && matchesParent;
    });
  }, [childCategories, searchQuery, filterTypeId]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold transition-all ${
            toastMessage.type === 'success'
              ? 'bg-zinc-950 text-white border border-emerald-500/40'
              : 'bg-rose-600 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <Sparkles className="w-4 h-4 text-emerald-400" />
          ) : (
            <X className="w-4 h-4 text-white" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700 uppercase tracking-wider mb-1">
            <FolderTree className="w-4 h-4" />
            <span>Multi-Tier Taxonomy Architecture</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
            Category Hierarchy & Navigation
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Category → Sub Category → Product Type → Child Category (Realtime sync with Firestore & Store Navigation)
          </p>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadAllTaxonomy()}
            className="p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer border border-zinc-200 flex items-center gap-1 text-xs font-bold"
            title="Refresh All"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleOpenAddCategory}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-black transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Category</span>
          </button>

          <button
            onClick={() => handleOpenAddSub()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Sub Category</span>
          </button>

          <button
            onClick={() => handleOpenAddType()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 text-xs font-black transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Type</span>
          </button>

          <button
            onClick={() => handleOpenAddChild()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 text-xs font-black transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Child</span>
          </button>
        </div>
      </div>

      {/* Tabs & Counts Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200">
        <div className="flex items-center flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('tree')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tree'
                ? 'bg-white text-zinc-950 shadow-xs font-black'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hierarchy Tree</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'categories'
                ? 'bg-white text-zinc-950 shadow-xs font-black'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>Tier 1: Categories</span>
            <span className="px-1.5 py-0.2 bg-zinc-200 text-zinc-800 rounded-md text-[10px] font-black">
              {categories.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('subcategories')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'subcategories'
                ? 'bg-white text-zinc-950 shadow-xs font-black'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>Tier 2: Subcategories</span>
            <span className="px-1.5 py-0.2 bg-zinc-200 text-zinc-800 rounded-md text-[10px] font-black">
              {subCategories.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('product_types')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'product_types'
                ? 'bg-white text-zinc-950 shadow-xs font-black'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>Tier 3: Product Types</span>
            <span className="px-1.5 py-0.2 bg-zinc-200 text-zinc-800 rounded-md text-[10px] font-black">
              {productTypes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('child_categories')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'child_categories'
                ? 'bg-white text-zinc-950 shadow-xs font-black'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>Tier 4: Child Categories</span>
            <span className="px-1.5 py-0.2 bg-zinc-200 text-zinc-800 rounded-md text-[10px] font-black">
              {childCategories.length}
            </span>
          </button>
        </div>

        {/* Search input in tab strip */}
        <div className="relative min-w-[200px] px-1 sm:px-0">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search hierarchy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-zinc-900 text-xs pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-900 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ====================================================
          TAB 1: INTERACTIVE HIERARCHY TREE VIEW
      ==================================================== */}
      {activeTab === 'tree' && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="text-xs font-bold text-zinc-500">
              Showing tree view for {categories.length} Categories, {subCategories.length} Subcategories, {productTypes.length} Types, {childCategories.length} Child Categories
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={expandAll}
                className="px-2.5 py-1 text-[11px] font-bold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-2.5 py-1 text-[11px] font-bold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          <div className="space-y-3 font-sans">
            {categories.map((cat) => {
              const catKey = `cat-${cat.id}`;
              const isCatExpanded = expandedNodes[catKey] ?? true;
              const catSubs = subCategories.filter(
                (s) => s.category_id === cat.id || s.category_slug === cat.slug
              );
              const catProdCount = getProductCountForCat(cat);

              return (
                <div key={cat.id} className="border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50/50">
                  {/* Category Tier 1 Header */}
                  <div className="flex items-center justify-between p-3 bg-white hover:bg-zinc-50/80 transition-colors border-b border-zinc-100">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <button
                        onClick={() => toggleNode(catKey)}
                        className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                      >
                        {isCatExpanded ? (
                          <ChevronDown className="w-4 h-4 text-zinc-700" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-zinc-700" />
                        )}
                      </button>

                      <span className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center text-xs font-black text-zinc-800 shrink-0">
                        1
                      </span>

                      <div className="truncate">
                        <span className="font-black text-sm text-zinc-950">{cat.name}</span>
                        <span className="ml-2 text-[11px] font-mono text-zinc-400">/{cat.slug}</span>
                      </div>

                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-bold">
                        {catProdCount} products
                      </span>

                      <button
                        type="button"
                        onClick={() => handleToggleCategoryStatus(cat)}
                        title={cat.active !== 0 && cat.active !== false ? 'Click to hide category from website' : 'Click to show category on website'}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                          cat.active !== 0 && cat.active !== false
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-300'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cat.active !== 0 && cat.active !== false ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                        {cat.active !== 0 && cat.active !== false ? 'Active' : 'Hidden'}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenAddSub(cat.id)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        title="Add Subcategory inside this category"
                      >
                        <Plus className="w-3 h-3" />
                        <span className="hidden sm:inline">Add Sub</span>
                      </button>
                      <button
                        onClick={() => handleOpenEditCategory(cat)}
                        className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => initiateDelete('category', cat)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories (Tier 2) */}
                  {isCatExpanded && (
                    <div className="p-3 pl-6 sm:pl-8 space-y-2.5">
                      {catSubs.length === 0 ? (
                        <div className="text-xs text-zinc-400 italic py-1">
                          No subcategories registered yet.{' '}
                          <button
                            onClick={() => handleOpenAddSub(cat.id)}
                            className="text-emerald-700 font-bold hover:underline cursor-pointer"
                          >
                            + Add one now
                          </button>
                        </div>
                      ) : (
                        catSubs.map((sub) => {
                          const subKey = `sub-${sub.id}`;
                          const isSubExpanded = expandedNodes[subKey] ?? true;
                          const subTypes = productTypes.filter(
                            (t) => t.subcategory_id === sub.id || t.subcategory_slug === sub.slug
                          );
                          const subProdCount = getProductCountForSub(sub);

                          return (
                            <div
                              key={sub.id}
                              className="border border-zinc-200/80 rounded-xl overflow-hidden bg-white shadow-2xs"
                            >
                              {/* Subcategory Tier 2 Header */}
                              <div className="flex items-center justify-between p-2.5 bg-zinc-50 hover:bg-zinc-100/80 transition-colors">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <button
                                    onClick={() => toggleNode(subKey)}
                                    className="p-0.5 rounded text-zinc-400 hover:text-zinc-800"
                                  >
                                    {isSubExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                                    )}
                                  </button>

                                  <span className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center text-[10px] font-black text-emerald-800 shrink-0">
                                    2
                                  </span>

                                  <div className="truncate">
                                    <span className="font-bold text-xs sm:text-sm text-zinc-900">
                                      {sub.name}
                                    </span>
                                    <span className="ml-1.5 text-[10px] font-mono text-zinc-400">
                                      /{sub.slug}
                                    </span>
                                  </div>

                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200/70 text-zinc-700 font-bold">
                                    {subProdCount} prods
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleSubStatus(sub)}
                                    title={sub.active !== 0 && sub.active !== false ? 'Click to hide subcategory from website' : 'Click to show subcategory on website'}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                                      sub.active !== 0 && sub.active !== false
                                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-300'
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${sub.active !== 0 && sub.active !== false ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                                    {sub.active !== 0 && sub.active !== false ? 'Active' : 'Hidden'}
                                  </button>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleOpenAddType(sub.id)}
                                    className="px-2 py-0.5 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded-md text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-0.5"
                                    title="Add Product Type inside this subcategory"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Type</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditSub(sub)}
                                    className="p-1 text-zinc-400 hover:text-zinc-800 rounded transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => initiateDelete('subcategory', sub)}
                                    className="p-1 text-rose-500 hover:text-rose-700 rounded transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Product Types (Tier 3) */}
                              {isSubExpanded && (
                                <div className="p-2.5 pl-6 sm:pl-8 space-y-2 bg-zinc-50/40">
                                  {subTypes.length === 0 ? (
                                    <div className="text-[11px] text-zinc-400 italic">
                                      No product types yet.{' '}
                                      <button
                                        onClick={() => handleOpenAddType(sub.id)}
                                        className="text-emerald-700 font-bold hover:underline cursor-pointer"
                                      >
                                        + Add type
                                      </button>
                                    </div>
                                  ) : (
                                    subTypes.map((type) => {
                                      const typeKey = `type-${type.id}`;
                                      const isTypeExpanded = expandedNodes[typeKey] ?? true;
                                      const typeChilds = childCategories.filter(
                                        (ch) =>
                                          ch.product_type_id === type.id ||
                                          ch.product_type_slug === type.slug ||
                                          ch.product_type_name?.toLowerCase() === type.name.toLowerCase()
                                      );
                                      const typeProdCount = getProductCountForType(type);

                                      return (
                                        <div
                                          key={type.id}
                                          className="border border-zinc-200/70 rounded-lg overflow-hidden bg-white"
                                        >
                                          {/* Product Type Tier 3 Header */}
                                          <div className="flex items-center justify-between p-2 bg-zinc-100/60 hover:bg-zinc-100 transition-colors">
                                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                              <button
                                                onClick={() => toggleNode(typeKey)}
                                                className="p-0.5 rounded text-zinc-400 hover:text-zinc-800"
                                              >
                                                {isTypeExpanded ? (
                                                  <ChevronDown className="w-3 h-3 text-zinc-600" />
                                                ) : (
                                                  <ChevronRight className="w-3 h-3 text-zinc-600" />
                                                )}
                                              </button>

                                              <span className="w-4 h-4 rounded bg-amber-100 flex items-center justify-center text-[9px] font-black text-amber-800 shrink-0">
                                                3
                                              </span>

                                              <span className="font-bold text-xs text-zinc-900 truncate">
                                                {type.name}
                                              </span>

                                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-zinc-200 text-zinc-700 font-bold">
                                                {typeProdCount} prods
                                              </span>

                                              <button
                                                type="button"
                                                onClick={() => handleToggleTypeStatus(type)}
                                                title={type.active !== 0 && type.active !== false ? 'Click to hide product type from website' : 'Click to show product type on website'}
                                                className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold border transition-all cursor-pointer ${
                                                  type.active !== 0 && type.active !== false
                                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-300'
                                                }`}
                                              >
                                                <span className={`w-1 h-1 rounded-full ${type.active !== 0 && type.active !== false ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                                                {type.active !== 0 && type.active !== false ? 'Active' : 'Hidden'}
                                              </button>
                                            </div>

                                            <div className="flex items-center gap-1">
                                              <button
                                                onClick={() => handleOpenAddChild(type.id)}
                                                className="px-1.5 py-0.5 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-0.5"
                                                title="Add Child Category"
                                              >
                                                <Plus className="w-2.5 h-2.5" />
                                                <span>Child</span>
                                              </button>
                                              <button
                                                onClick={() => handleOpenEditType(type)}
                                                className="p-1 text-zinc-400 hover:text-zinc-800 rounded transition-colors cursor-pointer"
                                              >
                                                <Edit2 className="w-2.5 h-2.5" />
                                              </button>
                                              <button
                                                onClick={() => initiateDelete('product_type', type)}
                                                className="p-1 text-rose-500 hover:text-rose-700 rounded transition-colors cursor-pointer"
                                              >
                                                <Trash2 className="w-2.5 h-2.5" />
                                              </button>
                                            </div>
                                          </div>

                                          {/* Child Categories (Tier 4) */}
                                          {isTypeExpanded && (
                                            <div className="p-2 pl-6 sm:pl-7 flex flex-wrap gap-1.5 bg-zinc-50/20">
                                              {typeChilds.length === 0 ? (
                                                <span className="text-[11px] text-zinc-400 italic">
                                                  No child categories.{' '}
                                                  <button
                                                    onClick={() => handleOpenAddChild(type.id)}
                                                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                                                  >
                                                    + Add child
                                                  </button>
                                                </span>
                                              ) : (
                                                typeChilds.map((child) => (
                                                  <div
                                                    key={child.id}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-zinc-200 text-xs shadow-2xs group hover:border-zinc-300"
                                                  >
                                                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[9px] font-black">
                                                      4
                                                    </span>
                                                    <span className="font-bold text-zinc-800">{child.name}</span>
                                                    <span className="text-[10px] text-zinc-400">
                                                      ({getProductCountForChild(child)})
                                                    </span>
                                                    <button
                                                      type="button"
                                                      onClick={() => handleToggleChildStatus(child)}
                                                      title={child.active !== 0 && child.active !== false ? 'Click to hide child category' : 'Click to activate child category'}
                                                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border transition-colors cursor-pointer ${
                                                        child.active !== 0 && child.active !== false
                                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                          : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200'
                                                      }`}
                                                    >
                                                      {child.active !== 0 && child.active !== false ? 'Active' : 'Hidden'}
                                                    </button>
                                                    <button
                                                      onClick={() => handleOpenEditChild(child)}
                                                      className="text-zinc-400 hover:text-zinc-800 ml-1"
                                                      title="Edit"
                                                    >
                                                      <Edit2 className="w-2.5 h-2.5" />
                                                    </button>
                                                    <button
                                                      onClick={() => initiateDelete('child_category', child)}
                                                      className="text-rose-400 hover:text-rose-700"
                                                      title="Delete"
                                                    >
                                                      <Trash2 className="w-2.5 h-2.5" />
                                                    </button>
                                                  </div>
                                                ))
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================
          TAB 2: CATEGORIES (TIER 1) TABLE
      ==================================================== */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider">
              Registered Categories (Tier 1)
            </h3>
            <button
              onClick={handleOpenAddCategory}
              className="px-3 py-1.5 bg-zinc-950 text-white rounded-xl text-xs font-black hover:bg-zinc-800 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Order</th>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Slug</th>
                  <th className="p-3.5">Subcategories</th>
                  <th className="p-3.5">Products</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {filteredCategories.map((cat) => {
                  const subsCount = subCategories.filter(
                    (s) => s.category_id === cat.id || s.category_slug === cat.slug
                  ).length;
                  const prodsCount = getProductCountForCat(cat);

                  return (
                    <tr key={cat.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-zinc-500">{cat.display_order ?? 1}</td>
                      <td className="p-3.5">
                        <div className="font-black text-zinc-900 text-sm">{cat.name}</div>
                      </td>
                      <td className="p-3.5 font-mono text-zinc-500">{cat.slug}</td>
                      <td className="p-3.5 font-bold text-emerald-700">{subsCount} subs</td>
                      <td className="p-3.5 font-bold text-zinc-700">{prodsCount} products</td>
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleCategoryStatus(cat)}
                          title={cat.active !== 0 && cat.active !== false ? 'Click to hide category from website' : 'Click to show category on website'}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                            cat.active !== 0 && cat.active !== false
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cat.active !== 0 && cat.active !== false ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                          {cat.active !== 0 && cat.active !== false ? 'Active' : 'Hidden'}
                        </button>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenAddSub(cat.id)}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold"
                          >
                            + Sub
                          </button>
                          <button
                            onClick={() => handleOpenEditCategory(cat)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => initiateDelete('category', cat)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================
          TAB 3: SUBCATEGORIES (TIER 2) TABLE
      ==================================================== */}
      {activeTab === 'subcategories' && (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs space-y-3">
          <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider">
                Subcategories (Tier 2)
              </h3>
              <p className="text-xs text-zinc-500">Each subcategory belongs to a parent Category</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterCatId}
                onChange={(e) => setFilterCatId(e.target.value)}
                className="text-xs font-bold bg-zinc-100 text-zinc-800 p-2 rounded-xl border border-zinc-200"
              >
                <option value="">All Parent Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleOpenAddSub(filterCatId || undefined)}
                className="px-3 py-2 bg-emerald-700 text-white rounded-xl text-xs font-black hover:bg-emerald-800 transition-colors flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subcategory</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Order</th>
                  <th className="p-3.5">Subcategory Name</th>
                  <th className="p-3.5">Parent Category</th>
                  <th className="p-3.5">Product Types</th>
                  <th className="p-3.5">Products</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {filteredSubCategories.map((sub) => {
                  const parentCat = categories.find(
                    (c) => c.id === sub.category_id || c.slug === sub.category_slug
                  );
                  const typesCount = productTypes.filter(
                    (t) => t.subcategory_id === sub.id || t.subcategory_slug === sub.slug
                  ).length;
                  const prodsCount = getProductCountForSub(sub);

                  return (
                    <tr key={sub.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-zinc-500">{sub.display_order ?? 1}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-zinc-900 text-sm">{sub.name}</div>
                        <div className="text-[10px] font-mono text-zinc-400">/{sub.slug}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md">
                          {parentCat?.name || sub.category_slug || 'Unknown'}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-amber-700">{typesCount} types</td>
                      <td className="p-3.5 font-bold text-zinc-700">{prodsCount} products</td>
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleSubStatus(sub)}
                          title={sub.active !== 0 && sub.active !== false ? 'Click to hide subcategory from website' : 'Click to show subcategory on website'}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                            sub.active !== 0 && sub.active !== false
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${sub.active !== 0 && sub.active !== false ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                          {sub.active !== 0 && sub.active !== false ? 'Active' : 'Hidden'}
                        </button>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenAddType(sub.id)}
                            className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-[11px] font-bold"
                          >
                            + Type
                          </button>
                          <button
                            onClick={() => handleOpenEditSub(sub)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => initiateDelete('subcategory', sub)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================
          TAB 4: PRODUCT TYPES (TIER 3) TABLE
      ==================================================== */}
      {activeTab === 'product_types' && (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs space-y-3">
          <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider">
                Product Types (Tier 3)
              </h3>
              <p className="text-xs text-zinc-500">
                Each product type belongs to a parent Subcategory (e.g. AMOLED, ANC, Mechanical)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterSubId}
                onChange={(e) => setFilterSubId(e.target.value)}
                className="text-xs font-bold bg-zinc-100 text-zinc-800 p-2 rounded-xl border border-zinc-200"
              >
                <option value="">All Subcategories</option>
                {subCategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleOpenAddType(filterSubId || undefined)}
                className="px-3 py-2 bg-zinc-950 text-white rounded-xl text-xs font-black hover:bg-zinc-800 transition-colors flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product Type</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Order</th>
                  <th className="p-3.5">Product Type Name</th>
                  <th className="p-3.5">Parent Subcategory</th>
                  <th className="p-3.5">Child Categories</th>
                  <th className="p-3.5">Products</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {filteredProductTypes.map((pt) => {
                  const parentSub = subCategories.find(
                    (s) => s.id === pt.subcategory_id || s.slug === pt.subcategory_slug
                  );
                  const childsCount = childCategories.filter(
                    (ch) =>
                      ch.product_type_id === pt.id ||
                      ch.product_type_slug === pt.slug ||
                      ch.product_type_name?.toLowerCase() === pt.name.toLowerCase()
                  ).length;
                  const prodsCount = getProductCountForType(pt);

                  return (
                    <tr key={pt.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-zinc-500">{pt.display_order ?? 1}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-zinc-900 text-sm">{pt.name}</div>
                        <div className="text-[10px] font-mono text-zinc-400">/{pt.slug}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {parentSub?.name || pt.subcategory_slug || 'Unknown'}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-zinc-700">{childsCount} children</td>
                      <td className="p-3.5 font-bold text-zinc-700">{prodsCount} products</td>
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleTypeStatus(pt)}
                          title={pt.active !== 0 && pt.active !== false ? 'Click to hide product type from website' : 'Click to show product type on website'}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                            pt.active !== 0 && pt.active !== false
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${pt.active !== 0 && pt.active !== false ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                          {pt.active !== 0 && pt.active !== false ? 'Active' : 'Hidden'}
                        </button>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenAddChild(pt.id)}
                            className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-[11px] font-bold"
                          >
                            + Child
                          </button>
                          <button
                            onClick={() => handleOpenEditType(pt)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => initiateDelete('product_type', pt)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================
          TAB 5: CHILD CATEGORIES (TIER 4) TABLE
      ==================================================== */}
      {activeTab === 'child_categories' && (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs space-y-3">
          <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider">
                Child Categories (Tier 4)
              </h3>
              <p className="text-xs text-zinc-500">
                Finest granular classification (e.g. Series 9, Waterproof IP68, 65W GaN)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterTypeId}
                onChange={(e) => setFilterTypeId(e.target.value)}
                className="text-xs font-bold bg-zinc-100 text-zinc-800 p-2 rounded-xl border border-zinc-200"
              >
                <option value="">All Product Types</option>
                {productTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleOpenAddChild(filterTypeId || undefined)}
                className="px-3 py-2 bg-emerald-700 text-white rounded-xl text-xs font-black hover:bg-emerald-800 transition-colors flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Child Category</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Order</th>
                  <th className="p-3.5">Child Category Name</th>
                  <th className="p-3.5">Parent Product Type</th>
                  <th className="p-3.5">Products</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {filteredChildCategories.map((ch) => {
                  const parentType = productTypes.find(
                    (t) =>
                      t.id === ch.product_type_id ||
                      t.slug === ch.product_type_slug ||
                      t.name.toLowerCase() === ch.product_type_name?.toLowerCase()
                  );
                  const prodsCount = getProductCountForChild(ch);

                  return (
                    <tr key={ch.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-zinc-500">{ch.display_order ?? 1}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-zinc-900 text-sm">{ch.name}</div>
                        <div className="text-[10px] font-mono text-zinc-400">/{ch.slug}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                          {parentType?.name || ch.product_type_name || 'Unknown'}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-zinc-700">{prodsCount} products</td>
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleChildStatus(ch)}
                          title={ch.active !== 0 && ch.active !== false ? 'Click to hide child category from website' : 'Click to show child category on website'}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                            ch.active !== 0 && ch.active !== false
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${ch.active !== 0 && ch.active !== false ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                          {ch.active !== 0 && ch.active !== false ? 'Active' : 'Hidden'}
                        </button>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditChild(ch)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => initiateDelete('child_category', ch)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL 1: ADD / EDIT CATEGORY (TIER 1)
      ==================================================== */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-black text-lg text-zinc-950">
                {editingCategory.id ? 'Edit Category (Tier 1)' : 'Add Category (Tier 1)'}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Gadgets"
                  value={editingCategory.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    setEditingCategory({
                      ...editingCategory,
                      name,
                      slug: editingCategory.slug ? editingCategory.slug : generateSlug(name),
                    });
                  }}
                  className="w-full text-sm font-bold p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  URL Slug (Auto-generated or custom)
                </label>
                <input
                  type="text"
                  placeholder="e.g. smart-gadgets"
                  value={editingCategory.slug || ''}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, slug: e.target.value })
                  }
                  className="w-full text-xs font-mono p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={editingCategory.display_order ?? 1}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        display_order: Number(e.target.value),
                      })
                    }
                    className="w-full text-xs font-bold p-3 rounded-xl border border-zinc-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Icon Name
                  </label>
                  <input
                    type="text"
                    placeholder="Watch, Headphones, Bag"
                    value={editingCategory.icon || ''}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, icon: e.target.value })
                    }
                    className="w-full text-xs font-medium p-3 rounded-xl border border-zinc-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={editingCategory.image_url || ''}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, image_url: e.target.value })
                  }
                  className="w-full text-xs p-3 rounded-xl border border-zinc-300"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="cat-active-checkbox"
                  checked={editingCategory.active !== 0 && editingCategory.active !== false}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      active: e.target.checked ? 1 : 0,
                    })
                  }
                  className="w-4 h-4 rounded text-zinc-900 focus:ring-0 cursor-pointer"
                />
                <label
                  htmlFor="cat-active-checkbox"
                  className="text-xs font-bold text-zinc-700 cursor-pointer"
                >
                  Active & Visible on Customer Website
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-zinc-950 text-white text-xs font-black hover:bg-zinc-800 transition-colors shadow-xs cursor-pointer"
                >
                  {loading ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL 2: ADD / EDIT SUBCATEGORY (TIER 2)
      ==================================================== */}
      {isSubModalOpen && editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-black text-lg text-zinc-950">
                {editingSub.id ? 'Edit Subcategory (Tier 2)' : 'Add Subcategory (Tier 2)'}
              </h3>
              <button
                onClick={() => setIsSubModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSub} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Parent Category *
                </label>
                <select
                  required
                  value={editingSub.category_id || ''}
                  onChange={(e) => {
                    const catId = e.target.value;
                    const cat = categories.find((c) => c.id === catId);
                    setEditingSub({
                      ...editingSub,
                      category_id: catId,
                      category_slug: cat?.slug || '',
                    });
                  }}
                  className="w-full text-xs font-bold p-3 rounded-xl border border-zinc-300 bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Subcategory Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Watch, Earbuds"
                  value={editingSub.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    setEditingSub({
                      ...editingSub,
                      name,
                      slug: editingSub.slug ? editingSub.slug : generateSlug(name),
                    });
                  }}
                  className="w-full text-sm font-bold p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  placeholder="e.g. smart-watch"
                  value={editingSub.slug || ''}
                  onChange={(e) => setEditingSub({ ...editingSub, slug: e.target.value })}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-zinc-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={editingSub.display_order ?? 1}
                  onChange={(e) =>
                    setEditingSub({ ...editingSub, display_order: Number(e.target.value) })
                  }
                  className="w-full text-xs font-bold p-3 rounded-xl border border-zinc-300"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sub-active-checkbox"
                  checked={editingSub.active !== 0 && editingSub.active !== false}
                  onChange={(e) =>
                    setEditingSub({
                      ...editingSub,
                      active: e.target.checked ? 1 : 0,
                    })
                  }
                  className="w-4 h-4 rounded text-zinc-900 cursor-pointer"
                />
                <label
                  htmlFor="sub-active-checkbox"
                  className="text-xs font-bold text-zinc-700 cursor-pointer"
                >
                  Active & Visible
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-black hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
                >
                  {loading ? 'Saving...' : 'Save Subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL 3: ADD / EDIT PRODUCT TYPE (TIER 3)
      ==================================================== */}
      {isTypeModalOpen && editingType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-black text-lg text-zinc-950">
                {editingType.id ? 'Edit Product Type (Tier 3)' : 'Add Product Type (Tier 3)'}
              </h3>
              <button
                onClick={() => setIsTypeModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveType} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Parent Subcategory *
                </label>
                <select
                  required
                  value={editingType.subcategory_id || ''}
                  onChange={(e) => {
                    const subId = e.target.value;
                    const sub = subCategories.find((s) => s.id === subId);
                    setEditingType({
                      ...editingType,
                      subcategory_id: subId,
                      subcategory_slug: sub?.slug || '',
                      category_id: sub?.category_id || '',
                      category_slug: sub?.category_slug || '',
                    });
                  }}
                  className="w-full text-xs font-bold p-3 rounded-xl border border-zinc-300 bg-white"
                >
                  <option value="">Select Parent Subcategory</option>
                  {subCategories.map((s) => {
                    const parentCat = categories.find((c) => c.id === s.category_id);
                    return (
                      <option key={s.id} value={s.id}>
                        {parentCat ? `${parentCat.name} › ` : ''}
                        {s.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Product Type Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AMOLED, Bluetooth, Mechanical"
                  value={editingType.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    setEditingType({
                      ...editingType,
                      name,
                      slug: editingType.slug ? editingType.slug : generateSlug(name),
                    });
                  }}
                  className="w-full text-sm font-bold p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  placeholder="e.g. amoled"
                  value={editingType.slug || ''}
                  onChange={(e) => setEditingType({ ...editingType, slug: e.target.value })}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-zinc-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={editingType.display_order ?? 1}
                  onChange={(e) =>
                    setEditingType({ ...editingType, display_order: Number(e.target.value) })
                  }
                  className="w-full text-xs font-bold p-3 rounded-xl border border-zinc-300"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="type-active-checkbox"
                  checked={editingType.active !== 0 && editingType.active !== false}
                  onChange={(e) =>
                    setEditingType({
                      ...editingType,
                      active: e.target.checked ? 1 : 0,
                    })
                  }
                  className="w-4 h-4 rounded text-zinc-900 cursor-pointer"
                />
                <label
                  htmlFor="type-active-checkbox"
                  className="text-xs font-bold text-zinc-700 cursor-pointer"
                >
                  Active & Visible
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsTypeModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-zinc-950 text-white text-xs font-black hover:bg-zinc-800 transition-colors shadow-xs cursor-pointer"
                >
                  {loading ? 'Saving...' : 'Save Product Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL 4: ADD / EDIT CHILD CATEGORY (TIER 4)
      ==================================================== */}
      {isChildModalOpen && editingChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-black text-lg text-zinc-950">
                {editingChild.id ? 'Edit Child Category (Tier 4)' : 'Add Child Category (Tier 4)'}
              </h3>
              <button
                onClick={() => setIsChildModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChild} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Parent Product Type *
                </label>
                <select
                  required
                  value={editingChild.product_type_id || ''}
                  onChange={(e) => {
                    const typeId = e.target.value;
                    const type = productTypes.find((t) => t.id === typeId);
                    setEditingChild({
                      ...editingChild,
                      product_type_id: typeId,
                      product_type_slug: type?.slug || '',
                      product_type_name: type?.name || '',
                      subcategory_id: type?.subcategory_id || '',
                      subcategory_slug: type?.subcategory_slug || '',
                      category_id: type?.category_id || '',
                      category_slug: type?.category_slug || '',
                    });
                  }}
                  className="w-full text-xs font-bold p-3 rounded-xl border border-zinc-300 bg-white"
                >
                  <option value="">Select Parent Product Type</option>
                  {productTypes.map((t) => {
                    const sub = subCategories.find((s) => s.id === t.subcategory_id);
                    return (
                      <option key={t.id} value={t.id}>
                        {sub ? `${sub.name} › ` : ''}
                        {t.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Child Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Series 9, Waterproof IP68, 65W GaN"
                  value={editingChild.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    setEditingChild({
                      ...editingChild,
                      name,
                      slug: editingChild.slug ? editingChild.slug : generateSlug(name),
                    });
                  }}
                  className="w-full text-sm font-bold p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  placeholder="e.g. series-9"
                  value={editingChild.slug || ''}
                  onChange={(e) => setEditingChild({ ...editingChild, slug: e.target.value })}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-zinc-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={editingChild.display_order ?? 1}
                  onChange={(e) =>
                    setEditingChild({ ...editingChild, display_order: Number(e.target.value) })
                  }
                  className="w-full text-xs font-bold p-3 rounded-xl border border-zinc-300"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="child-active-checkbox"
                  checked={editingChild.active !== 0 && editingChild.active !== false}
                  onChange={(e) =>
                    setEditingChild({
                      ...editingChild,
                      active: e.target.checked ? 1 : 0,
                    })
                  }
                  className="w-4 h-4 rounded text-zinc-900 cursor-pointer"
                />
                <label
                  htmlFor="child-active-checkbox"
                  className="text-xs font-bold text-zinc-700 cursor-pointer"
                >
                  Active & Visible
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsChildModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-black hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
                >
                  {loading ? 'Saving...' : 'Save Child Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          CONFIRM DELETE DIALOG (WITH DEPENDENCY WARNINGS)
      ==================================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up border border-rose-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-black text-base text-zinc-950">
                  Delete {deleteTarget.name}?
                </h3>
                <p className="text-xs text-zinc-500 capitalize">
                  Permanent removal from {deleteTarget.tier.replace('_', ' ')} tier
                </p>
              </div>
            </div>

            <div className="space-y-2 bg-rose-50/50 p-3.5 rounded-2xl border border-rose-200/60 text-xs text-zinc-700">
              {deleteTarget.childItemsCount > 0 && (
                <p className="font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>
                    Warning: This will also unassign or delete {deleteTarget.childItemsCount} child
                    subcategories/types/items.
                  </span>
                </p>
              )}

              {deleteTarget.productCount > 0 && (
                <p className="font-bold text-zinc-900 flex items-center gap-1.5">
                  <span>
                    This category tier contains {deleteTarget.productCount} active product
                    {deleteTarget.productCount === 1 ? '' : 's'}. Products will retain their product
                    details but lose this category tag.
                  </span>
                </p>
              )}

              <p className="text-[11px] text-zinc-500 pt-1">
                This deletion is permanent and cannot be undone. Are you sure you want to proceed?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
