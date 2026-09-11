import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Package,
  Layers,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { Brand, Product } from '../types';
import { storeService } from '../services/storeService';
import { generateSlug } from '../utils/seo';

interface AdminBrandsProps {
  password?: string;
  products?: Product[];
  onUpdated?: () => void;
  onFilterByBrand?: (brandName: string) => void;
}

export const AdminBrands: React.FC<AdminBrandsProps> = ({
  password = '',
  products = [],
  onUpdated,
  onFilterByBrand,
}) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Partial<Brand> | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    setLoading(true);
    try {
      const data = await storeService.getBrands(false);
      setBrands(data);
    } catch (err: any) {
      showToast(err?.message || 'Failed to load brands', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calculate product counts per brand
  const brandProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const bName = (p.brand || 'Other').trim();
      const bSlug = (p.brand_slug || generateSlug(bName)).toLowerCase();
      const bId = p.brand_id || '';
      
      counts[bName.toLowerCase()] = (counts[bName.toLowerCase()] || 0) + 1;
      if (bSlug) counts[bSlug] = (counts[bSlug] || 0) + 1;
      if (bId) counts[bId] = (counts[bId] || 0) + 1;
    });
    return counts;
  }, [products]);

  const getCountForBrand = (brand: Brand) => {
    const byName = brandProductCounts[brand.name.toLowerCase()] || 0;
    const bySlug = brandProductCounts[brand.slug.toLowerCase()] || 0;
    const byId = brandProductCounts[brand.id] || 0;
    return Math.max(byName, bySlug, byId);
  };

  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      const matchesSearch =
        !searchQuery ||
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const isActive = b.active !== 0 && b.active !== false && String(b.active) !== '0';
      const matchesStatus =
        statusFilter === 'all' ? true : statusFilter === 'active' ? isActive : !isActive;

      return matchesSearch && matchesStatus;
    });
  }, [brands, searchQuery, statusFilter]);

  const totalActive = useMemo(
    () => brands.filter((b) => b.active !== 0 && b.active !== false && String(b.active) !== '0').length,
    [brands]
  );
  const totalInactive = brands.length - totalActive;

  const handleOpenAddModal = () => {
    setEditingBrand({
      id: '',
      name: '',
      slug: '',
      logo_url: '',
      description: '',
      display_order: (brands.length + 1) * 10,
      active: 1,
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (brand: Brand) => {
    setEditingBrand({ ...brand });
    setIsModalOpen(true);
  };

  const handleLogoUpload = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP)', 'error');
      return;
    }

    setIsUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/webp', 0.85);
          setEditingBrand((prev) => (prev ? { ...prev, logo_url: compressed } : prev));
          showToast('Brand logo uploaded and optimized!', 'success');
        } else {
          setEditingBrand((prev) => (prev ? { ...prev, logo_url: e.target?.result as string } : prev));
        }
        setIsUploadingLogo(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand || !editingBrand.name?.trim()) {
      showToast('Brand name is required.', 'error');
      return;
    }

    try {
      const rawName = editingBrand.name.trim();
      const slug = editingBrand.slug?.trim() ? generateSlug(editingBrand.slug) : generateSlug(rawName);

      const brandToSave: Partial<Brand> = {
        ...editingBrand,
        name: rawName,
        slug: slug || 'brand',
        display_order: Number(editingBrand.display_order ?? 99),
        active: editingBrand.active !== undefined ? (editingBrand.active ? 1 : 0) : 1,
      };

      const result = await storeService.saveBrand(brandToSave, password);
      if (result.success) {
        showToast(`Brand "${result.brand.name}" saved successfully!`, 'success');
        setIsModalOpen(false);
        setEditingBrand(null);
        await loadBrands();
        if (onUpdated) onUpdated();
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to save brand', 'error');
    }
  };

  const handleToggleStatus = async (brand: Brand) => {
    const currentActive = brand.active !== 0 && brand.active !== false && String(brand.active) !== '0';
    const newStatus = currentActive ? 0 : 1;
    try {
      const result = await storeService.saveBrand({ ...brand, active: newStatus }, password);
      if (result.success) {
        showToast(`"${brand.name}" marked as ${newStatus ? 'Active' : 'Inactive'}`, 'info');
        await loadBrands();
        if (onUpdated) onUpdated();
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update status', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await storeService.deleteBrand(deleteTarget.id, password);
      if (res.success) {
        showToast(
          `Brand "${deleteTarget.name}" deleted. ${res.affectedProductsCount > 0 ? `${res.affectedProductsCount} associated products re-assigned to "Other".` : ''}`,
          'success'
        );
        setDeleteTarget(null);
        await loadBrands();
        if (onUpdated) onUpdated();
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete brand', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900/90 border-emerald-700 text-emerald-100'
              : toastMessage.type === 'error'
              ? 'bg-rose-900/90 border-rose-700 text-rose-100'
              : 'bg-slate-900/90 border-slate-700 text-slate-100'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
          {toastMessage.type === 'info' && <Sparkles className="w-4 h-4 text-amber-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                <Tag className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">Brand Management</h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {brands.length} Brands
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Manage product brands, logos, display orders, and filterable store catalogs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadBrands}
              disabled={loading}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition flex items-center justify-center disabled:opacity-50"
              title="Refresh Brands"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-950/30 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Brand</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Brands</div>
            <div className="text-lg font-bold text-white mt-0.5">{brands.length}</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Active Brands</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">{totalActive}</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Inactive Brands</div>
            <div className="text-lg font-bold text-slate-400 mt-0.5">{totalInactive}</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <div className="text-xs font-medium text-amber-400 uppercase tracking-wider">Total Catalog Products</div>
            <div className="text-lg font-bold text-amber-400 mt-0.5">{products.length}</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search brand by name, slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md transition ${
                statusFilter === 'all' ? 'bg-amber-500 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({brands.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-md transition ${
                statusFilter === 'active' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Active ({totalActive})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 rounded-md transition ${
                statusFilter === 'inactive' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Inactive ({totalInactive})
            </button>
          </div>
        </div>
      </div>

      {/* Brands Grid / List */}
      {filteredBrands.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4 border border-slate-700/50">
            <Tag className="w-8 h-8 opacity-60" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">No brands found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            {searchQuery
              ? `No brand matched "${searchQuery}". Try a different keyword.`
              : 'Start by adding your first brand to organize your products.'}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Brand</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBrands.map((brand) => {
            const isActive = brand.active !== 0 && brand.active !== false && String(brand.active) !== '0';
            const prodCount = getCountForBrand(brand);

            return (
              <div
                key={brand.id}
                className={`bg-slate-900/80 border rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between ${
                  isActive
                    ? 'border-slate-800 hover:border-slate-700 hover:shadow-lg'
                    : 'border-slate-800/40 opacity-70 bg-slate-950/40'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                        {brand.logo_url ? (
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-base font-bold text-amber-400">
                            {brand.name.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-100 truncate text-base">{brand.name}</h3>
                          {brand.name.toLowerCase() === 'maxora' && (
                            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded">
                              OFFICIAL
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <span>/brand/{brand.slug}</span>
                        </div>
                      </div>
                    </div>

                    {/* Active/Inactive Switch */}
                    <button
                      onClick={() => handleToggleStatus(brand)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isActive ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                      title={isActive ? 'Click to deactivate' : 'Click to activate'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {brand.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3 bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
                      {brand.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span
                      onClick={() => onFilterByBrand && onFilterByBrand(brand.name)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                        prodCount > 0
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                      title="Filter products by this brand in admin product list"
                    >
                      <Package className="w-3 h-3" />
                      <span>{prodCount} products</span>
                    </span>
                    <span className="text-[11px] text-slate-500">Order: #{brand.display_order ?? 99}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(brand)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                      title="Edit Brand"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {brand.name.toLowerCase() !== 'other' && (
                      <button
                        onClick={() => setDeleteTarget(brand)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                        title="Delete Brand"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && editingBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingBrand.id ? 'Edit Brand' : 'Add New Brand'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingBrand.id ? `Modifying "${editingBrand.name}"` : 'Create a new brand for product catalog'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingBrand(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="p-5 space-y-4">
              {/* Brand Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Brand Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sokany, Miyako, Xiaomi, Philips"
                  value={editingBrand.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = generateSlug(name);
                    setEditingBrand((prev) => ({
                      ...prev,
                      name,
                      slug: prev?.id ? prev.slug : autoSlug,
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* Brand Slug */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Brand URL Slug <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center">
                  <span className="bg-slate-800/80 border border-r-0 border-slate-700 rounded-l-xl px-3 py-2.5 text-xs text-slate-400 font-mono">
                    /brand/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="sokany"
                    value={editingBrand.slug || ''}
                    onChange={(e) => {
                      const slug = generateSlug(e.target.value);
                      setEditingBrand((prev) => (prev ? { ...prev, slug } : prev));
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-r-xl px-3 py-2.5 text-sm text-slate-100 font-mono placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Brand Logo Upload or URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Brand Logo / Image <span className="text-slate-500">(Optional)</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {editingBrand.logo_url ? (
                      <img
                        src={editingBrand.logo_url}
                        alt="Logo preview"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Paste logo image URL..."
                      value={editingBrand.logo_url || ''}
                      onChange={(e) =>
                        setEditingBrand((prev) => (prev ? { ...prev, logo_url: e.target.value } : prev))
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer border border-slate-700 transition">
                      <Upload className="w-3 h-3 text-amber-400" />
                      <span>{isUploadingLogo ? 'Processing...' : 'Upload Logo File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleLogoUpload(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Brand Description / Tagline
                </label>
                <textarea
                  rows={2}
                  placeholder="Short description of the brand and warranty guarantee..."
                  value={editingBrand.description || ''}
                  onChange={(e) =>
                    setEditingBrand((prev) => (prev ? { ...prev, description: e.target.value } : prev))
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition resize-none"
                />
              </div>

              {/* Display Order & Active status in row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingBrand.display_order ?? 99}
                    onChange={(e) =>
                      setEditingBrand((prev) =>
                        prev ? { ...prev, display_order: Number(e.target.value) } : prev
                      )
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Status
                  </label>
                  <select
                    value={editingBrand.active !== 0 && editingBrand.active !== false ? '1' : '0'}
                    onChange={(e) =>
                      setEditingBrand((prev) =>
                        prev ? { ...prev, active: Number(e.target.value) } : prev
                      )
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="1">Active (Visible)</option>
                    <option value="0">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* SEO Meta Details (Collapsible/Optional) */}
              <div className="pt-2 border-t border-slate-800">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
                  SEO & Meta Information (Optional)
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Meta Title (e.g. Sokany Appliances in BD | Maxora)"
                    value={editingBrand.meta_title || ''}
                    onChange={(e) =>
                      setEditingBrand((prev) => (prev ? { ...prev, meta_title: e.target.value } : prev))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="Meta Description..."
                    value={editingBrand.meta_description || ''}
                    onChange={(e) =>
                      setEditingBrand((prev) => (prev ? { ...prev, meta_description: e.target.value } : prev))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingBrand(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-950/40 transition active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingBrand.id ? 'Update Brand' : 'Create Brand'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-900/50 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Delete Brand "{deleteTarget.name}"?</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Are you sure you want to delete this brand? Products linked to this brand will automatically be safely re-assigned to <span className="font-semibold text-amber-400">"Other / Unbranded"</span> so that no product data or order history is lost.
            </p>
            {getCountForBrand(deleteTarget) > 0 && (
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 mb-5">
                <span className="text-amber-400 font-bold">{getCountForBrand(deleteTarget)} products</span> will be updated to "Other".
              </div>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-950/40 transition disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
