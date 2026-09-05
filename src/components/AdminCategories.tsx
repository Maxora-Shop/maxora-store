import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  FolderTree,
  Image as ImageIcon,
  Tag,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
import { Category, SubCategory, Product } from '../types';
import { storeService } from '../services/storeService';
import { generateSlug } from '../utils/seo';

interface AdminCategoriesProps {
  password?: string;
  products?: Product[];
  onUpdated?: () => void;
}

export const AdminCategories: React.FC<AdminCategoriesProps> = ({
  password = '',
  products = [],
  onUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'subcategories'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParentFilter, setSelectedParentFilter] = useState('');

  // Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  const [isSubCategoryModalOpen, setIsSubCategoryModalOpen] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<Partial<SubCategory> | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, subs] = await Promise.all([
        storeService.getCategories(),
        storeService.getSubCategories(),
      ]);
      setCategories(cats);
      setSubCategories(subs);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
      showToast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CATEGORY ACTIONS
  // ============================================
  const handleOpenAddCategory = () => {
    setEditingCategory({
      name: '',
      slug: '',
      image_url: '',
      display_order: categories.length + 1,
      active: 1,
    });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory({ ...cat });
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
      const categoryToSave: Partial<Category> = {
        ...editingCategory,
        name: editingCategory.name.trim(),
        slug: slug,
        display_order: Number(editingCategory.display_order) || 1,
        active: editingCategory.active !== 0 && editingCategory.active !== false ? 1 : 0,
      };

      await storeService.saveCategory(categoryToSave, password);
      showToast('Category saved successfully!', 'success');
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to save category', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"? Existing products with this category will retain their category name.`)) {
      return;
    }

    try {
      setLoading(true);
      await storeService.deleteCategory(id, password);
      showToast(`Category "${name}" deleted`, 'success');
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete category', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SUBCATEGORY ACTIONS
  // ============================================
  const handleOpenAddSubCategory = () => {
    const defaultCat = categories[0];
    setEditingSubCategory({
      category_id: defaultCat?.id || '',
      category_slug: defaultCat?.slug || '',
      name: '',
      slug: '',
      display_order: subCategories.length + 1,
      active: 1,
    });
    setIsSubCategoryModalOpen(true);
  };

  const handleOpenEditSubCategory = (sub: SubCategory) => {
    setEditingSubCategory({ ...sub });
    setIsSubCategoryModalOpen(true);
  };

  const handleSaveSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubCategory?.name?.trim()) {
      showToast('Subcategory name is required', 'error');
      return;
    }
    if (!editingSubCategory?.category_id) {
      showToast('Please select a parent category', 'error');
      return;
    }

    try {
      setLoading(true);
      const parentCat = categories.find((c) => c.id === editingSubCategory.category_id);
      const slug = editingSubCategory.slug?.trim() || generateSlug(editingSubCategory.name);

      const subToSave: Partial<SubCategory> = {
        ...editingSubCategory,
        name: editingSubCategory.name.trim(),
        slug: slug,
        category_slug: parentCat?.slug || editingSubCategory.category_slug || '',
        display_order: Number(editingSubCategory.display_order) || 1,
        active: editingSubCategory.active !== 0 && editingSubCategory.active !== false ? 1 : 0,
      };

      await storeService.saveSubCategory(subToSave, password);
      showToast('Subcategory saved successfully!', 'success');
      setIsSubCategoryModalOpen(false);
      setEditingSubCategory(null);
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to save subcategory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete subcategory "${name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await storeService.deleteSubCategory(id, password);
      showToast(`Subcategory "${name}" deleted`, 'success');
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete subcategory', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Product counts helper
  const getProductCountForCategory = (cat: Category) => {
    return products.filter(
      (p) =>
        p.category_id === cat.id ||
        (p.category && p.category.toLowerCase().trim() === cat.name.toLowerCase().trim()) ||
        (p.category && generateSlug(p.category) === cat.slug)
    ).length;
  };

  const getProductCountForSubCategory = (sub: SubCategory) => {
    return products.filter(
      (p) =>
        p.subcategory_id === sub.id ||
        (p.sub_category && p.sub_category.toLowerCase().trim() === sub.name.toLowerCase().trim()) ||
        (p.sub_category && generateSlug(p.sub_category) === sub.slug)
    ).length;
  };

  // Filtered lists
  const filteredCategories = categories.filter((c) =>
    !searchQuery ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubCategories = subCategories.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesParent =
      !selectedParentFilter ||
      s.category_id === selectedParentFilter ||
      s.category_slug === selectedParentFilter;
    return matchesSearch && matchesParent;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all ${
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

      {/* Header Bar with Tab Switches & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 uppercase tracking-wider mb-0.5">
            <FolderTree className="w-3.5 h-3.5" />
            <span>Taxonomy & Navigation</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
            Categories & Subcategories
          </h2>
          <p className="text-xs text-zinc-500">
            Organize products for search, filter ribbons, and marketplace browsing
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Tab Switcher */}
          <div className="bg-zinc-100 p-1 rounded-xl flex items-center border border-zinc-200">
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Categories ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab('subcategories')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'subcategories'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Subcategories ({subCategories.length})
            </button>
          </div>

          <button
            onClick={() => loadData()}
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer border border-zinc-200"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {activeTab === 'categories' ? (
            <button
              onClick={handleOpenAddCategory}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-black text-xs transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAddSubCategory}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-black text-xs transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subcategory</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900"
          />
        </div>

        {activeTab === 'subcategories' && (
          <div className="w-full sm:w-64">
            <select
              value={selectedParentFilter}
              onChange={(e) => setSelectedParentFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900"
            >
              <option value="">All Parent Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ============================================
          TAB 1: CATEGORIES TABLE
      ============================================ */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-extrabold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Products</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => {
                    const prodCount = getProductCountForCategory(cat);
                    const isActive = cat.active !== 0 && cat.active !== false;

                    return (
                      <tr key={cat.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-zinc-500 font-bold">
                          #{cat.display_order ?? 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {cat.image_url ? (
                              <img
                                src={cat.image_url}
                                alt={cat.name}
                                className="w-9 h-9 rounded-xl object-cover bg-zinc-100 border border-zinc-200"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                <Layers className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-zinc-900">{cat.name}</div>
                              {cat.meta_title && (
                                <div className="text-[10px] text-zinc-400 truncate max-w-[200px]">
                                  {cat.meta_title}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-zinc-600">
                          {cat.slug}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-800">
                            {prodCount} products
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-zinc-100 text-zinc-500'
                            }`}
                          >
                            {isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            <span>{isActive ? 'Active' : 'Hidden'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditCategory(cat)}
                              className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-400 text-xs">
                      No categories found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================
          TAB 2: SUBCATEGORIES TABLE
      ============================================ */}
      {activeTab === 'subcategories' && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-extrabold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Subcategory</th>
                  <th className="py-3 px-4">Parent Category</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Products</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredSubCategories.length > 0 ? (
                  filteredSubCategories.map((sub) => {
                    const parentCat = categories.find(
                      (c) => c.id === sub.category_id || c.slug === sub.category_slug
                    );
                    const prodCount = getProductCountForSubCategory(sub);
                    const isActive = sub.active !== 0 && sub.active !== false;

                    return (
                      <tr key={sub.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-zinc-500 font-bold">
                          #{sub.display_order ?? 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-zinc-900">{sub.name}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Tag className="w-3 h-3 text-emerald-600" />
                            <span>{parentCat?.name || sub.category_slug || 'Unknown'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-zinc-600">
                          {sub.slug}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-800">
                            {prodCount} products
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-zinc-100 text-zinc-500'
                            }`}
                          >
                            {isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            <span>{isActive ? 'Active' : 'Hidden'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditSubCategory(sub)}
                              className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                              title="Edit Subcategory"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubCategory(sub.id, sub.name)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Subcategory"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400 text-xs">
                      No subcategories found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================
          MODAL: ADD / EDIT CATEGORY
      ============================================ */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-lg font-black text-zinc-900">
                {editingCategory?.id ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 cursor-pointer"
              >
                ✕
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
                  value={editingCategory?.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    setEditingCategory((prev) => ({
                      ...prev,
                      name,
                      slug: prev?.id ? prev.slug : generateSlug(name),
                    }));
                  }}
                  className="w-full bg-zinc-50 text-zinc-900 text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. smart-gadgets"
                  value={editingCategory?.slug || ''}
                  onChange={(e) => setEditingCategory((prev) => ({ ...prev, slug: generateSlug(e.target.value) }))}
                  className="w-full bg-zinc-50 text-zinc-900 text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Image or Icon URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={editingCategory?.image_url || ''}
                  onChange={(e) => setEditingCategory((prev) => ({ ...prev, image_url: e.target.value }))}
                  className="w-full bg-zinc-50 text-zinc-900 text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={editingCategory?.display_order ?? 1}
                    onChange={(e) =>
                      setEditingCategory((prev) => ({ ...prev, display_order: Number(e.target.value) }))
                    }
                    className="w-full bg-zinc-50 text-zinc-900 text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingCategory?.active !== 0 && editingCategory?.active !== false}
                      onChange={(e) =>
                        setEditingCategory((prev) => ({ ...prev, active: e.target.checked ? 1 : 0 }))
                      }
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                    />
                    <span className="text-xs font-bold text-zinc-800">Active in Store</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-bold hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-black transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================
          MODAL: ADD / EDIT SUBCATEGORY
      ============================================ */}
      {isSubCategoryModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-lg font-black text-zinc-900">
                {editingSubCategory?.id ? 'Edit Subcategory' : 'Add New Subcategory'}
              </h3>
              <button
                onClick={() => setIsSubCategoryModalOpen(false)}
                className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSubCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Parent Category *
                </label>
                <select
                  required
                  value={editingSubCategory?.category_id || ''}
                  onChange={(e) => {
                    const catId = e.target.value;
                    const parent = categories.find((c) => c.id === catId);
                    setEditingSubCategory((prev) => ({
                      ...prev,
                      category_id: catId,
                      category_slug: parent?.slug || '',
                    }));
                  }}
                  className="w-full bg-zinc-50 text-zinc-900 text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                >
                  <option value="" disabled>
                    Select parent category...
                  </option>
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
                  placeholder="e.g. Smartwatches"
                  value={editingSubCategory?.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    setEditingSubCategory((prev) => ({
                      ...prev,
                      name,
                      slug: prev?.id ? prev.slug : generateSlug(name),
                    }));
                  }}
                  className="w-full bg-zinc-50 text-zinc-900 text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. smartwatches"
                  value={editingSubCategory?.slug || ''}
                  onChange={(e) =>
                    setEditingSubCategory((prev) => ({ ...prev, slug: generateSlug(e.target.value) }))
                  }
                  className="w-full bg-zinc-50 text-zinc-900 text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={editingSubCategory?.display_order ?? 1}
                    onChange={(e) =>
                      setEditingSubCategory((prev) => ({ ...prev, display_order: Number(e.target.value) }))
                    }
                    className="w-full bg-zinc-50 text-zinc-900 text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingSubCategory?.active !== 0 && editingSubCategory?.active !== false}
                      onChange={(e) =>
                        setEditingSubCategory((prev) => ({ ...prev, active: e.target.checked ? 1 : 0 }))
                      }
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                    />
                    <span className="text-xs font-bold text-zinc-800">Active in Store</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubCategoryModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-bold hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-black transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
