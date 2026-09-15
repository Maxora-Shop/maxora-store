import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Image as ImageIcon,
  Check,
  X,
  Upload,
  Sparkles,
  Sliders,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { HeroBanner, StoreSettings } from '../types';
import { DEFAULT_HERO_BANNERS } from '../data/initialData';
import { storeService } from '../services/storeService';
import { compressAndReadImage } from '../utils/imageCompressor';

interface AdminBannersProps {
  settings: StoreSettings;
  adminPassword?: string;
  onSettingsUpdated: () => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const GRADIENT_PRESETS = [
  { label: 'Sky Blue (Default)', value: 'from-[#e0f2fe] via-[#e8f4fc] to-[#f0f7fd]' },
  { label: 'Royal Amber / Gold', value: 'from-[#fef3c7] via-[#fffbeb] to-[#fef9c3]' },
  { label: 'Emerald Mint', value: 'from-[#dcfce7] via-[#f0fdf4] to-[#ecfdf5]' },
  { label: 'Sunset Rose', value: 'from-[#ffe4e6] via-[#fff1f2] to-[#fdf2f8]' },
  { label: 'Lavender Purple', value: 'from-[#f3e8ff] via-[#faf5ff] to-[#f5f3ff]' },
  { label: 'Deep Dark / Slate', value: 'from-zinc-900 via-zinc-800 to-zinc-950 text-white' },
];

export const AdminBanners: React.FC<AdminBannersProps> = ({
  settings,
  adminPassword,
  onSettingsUpdated,
  showToast,
}) => {
  const banners: HeroBanner[] = Array.isArray(settings.hero_banners) && settings.hero_banners.length > 0
    ? settings.hero_banners
    : DEFAULT_HERO_BANNERS;

  const [slideSpeed, setSlideSpeed] = useState<number>(settings.banner_slide_speed || 4500);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [bannerMode, setBannerMode] = useState<'collage' | 'single'>('collage');
  const [previewSlideIdx, setPreviewSlideIdx] = useState(0);

  // Save all banners array back to settings
  const saveBanners = async (updatedBanners: HeroBanner[], newSpeed?: number) => {
    try {
      const speedToSave = newSpeed !== undefined ? newSpeed : slideSpeed;
      const newSettings: Partial<StoreSettings> = {
        ...settings,
        hero_banners: updatedBanners,
        banner_slide_speed: speedToSave,
      };
      await storeService.updateSettings(newSettings, adminPassword);
      onSettingsUpdated();
      showToast('ব্যানার সফলভাবে আপডেট হয়েছে! (Banners updated successfully)', 'success');
    } catch (err: any) {
      showToast('ব্যানার সংরক্ষণ করতে সমস্যা হয়েছে: ' + err.message, 'error');
    }
  };

  const handleSpeedChange = async (speed: number) => {
    setSlideSpeed(speed);
    await saveBanners(banners, speed);
  };

  const handleToggleActive = async (bannerId: string) => {
    const updated = banners.map((b) =>
      b.id === bannerId ? { ...b, active: !b.active } : b
    );
    await saveBanners(updated);
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= banners.length) return;

    const copy = [...banners];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    // Update display_order property
    const reordered = copy.map((b, idx) => ({ ...b, display_order: idx + 1 }));
    await saveBanners(reordered);
  };

  const handleDelete = async (bannerId: string) => {
    if (banners.length <= 1) {
      showToast('অন্তত একটি ব্যানার থাকা আবশ্যক (At least one banner must remain)', 'error');
      return;
    }
    if (!confirm('আপনি কি এই ব্যানারটি মুছে ফেলতে চান? (Are you sure you want to delete this banner?)')) return;

    const updated = banners.filter((b) => b.id !== bannerId);
    await saveBanners(updated);
  };

  const handleOpenAdd = () => {
    const newBanner: HeroBanner = {
      id: `banner-${Date.now()}`,
      pill: 'হট ডিল ও নতুন অফার',
      titlePrimary: 'স্মার্ট গ্যাজেট,',
      titleAccent: 'সেরা অফারে',
      subtitle: '১০০% ক্যাশ অন ডেলিভারি সুবিধা ও দ্রুত ডেলিভারির সাথে সারা বাংলাদেশে কেনাকাটা করুন।',
      cta: 'অর্ডার করুন',
      ctaLink: '#products-catalog-section',
      badgeNote: 'Better Products ~ Better Life',
      image1: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
      image2: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&auto=format&fit=crop&q=80',
      image3: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80',
      image4: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80',
      bgGradient: 'from-[#e0f2fe] via-[#e8f4fc] to-[#f0f7fd]',
      active: true,
      display_order: banners.length + 1,
    };
    setEditingBanner(newBanner);
    setBannerMode('collage');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner: HeroBanner) => {
    setEditingBanner({ ...banner });
    setBannerMode(banner.singleBannerImage ? 'single' : 'collage');
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    if (!editingBanner.titlePrimary.trim()) {
      showToast('ব্যানারের মূল শিরোনাম লিখুন (Please enter primary headline)', 'error');
      return;
    }

    const exists = banners.some((b) => b.id === editingBanner.id);
    let updated: HeroBanner[];
    if (exists) {
      updated = banners.map((b) => (b.id === editingBanner.id ? editingBanner : b));
    } else {
      updated = [...banners, editingBanner];
    }

    await saveBanners(updated);
    setIsModalOpen(false);
    setEditingBanner(null);
  };

  const handleFileUpload = async (field: 'image1' | 'image2' | 'image3' | 'image4' | 'singleBannerImage', file?: File | null) => {
    if (!file) return;
    try {
      setIsUploading(true);
      const dataUrl = await compressAndReadImage(file);
      setEditingBanner((prev) => (prev ? { ...prev, [field]: dataUrl } : prev));
      showToast('ছবি সফলভাবে আপলোড হয়েছে!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const activeCount = banners.filter((b) => b.active !== false).length;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <Sliders className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">
              হোমপেজ ব্যানার ম্যানেজমেন্ট (Hero Banners & Slider)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            ব্যানার যোগ, সম্পাদনা ও পরিবর্তন করুন। ব্যানারগুলো হোমপেজে স্বয়ংক্রিয়ভাবে একের পর এক ঘুরবে।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Slide Speed Selector */}
          <div className="flex items-center gap-2 bg-zinc-50 px-3 py-2 rounded-xl border border-zinc-200 text-xs font-semibold">
            <span className="text-zinc-600">পরিবর্তন গতি:</span>
            <select
              value={slideSpeed}
              onChange={(e) => handleSpeedChange(Number(e.target.value))}
              className="bg-transparent font-bold text-zinc-900 outline-hidden cursor-pointer"
            >
              <option value={3000}>৩ সেকেন্ড (Fast)</option>
              <option value={4500}>৪.৫ সেকেন্ড (Default)</option>
              <option value={6000}>৬ সেকেন্ড (Medium)</option>
              <option value={8000}>৮ সেকেন্ড (Slow)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ব্যানার যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Live Carousel Quick Preview Bar */}
      <div className="bg-gradient-to-r from-sky-50/50 via-white to-sky-50/30 rounded-2xl p-4 border border-sky-100 flex items-center justify-between text-xs text-zinc-700">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-bold text-zinc-800">মোট ব্যানার: {banners.length} টি</span>
          <span className="text-zinc-400">|</span>
          <span className="text-emerald-700 font-semibold">সক্রিয় রয়েছে: {activeCount} টি</span>
        </div>
        <span className="text-[11px] text-zinc-500 hidden sm:inline font-medium">
          কাস্টমার সাইটে প্রতি {slideSpeed / 1000} সেকেন্ড পরপর ব্যানার নিজে থেকেই ঘুরবে
        </span>
      </div>

      {/* Banners List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {banners.map((banner, index) => {
          const isActive = banner.active !== false && String(banner.active) !== '0';
          const bgClass = banner.bgGradient || 'from-[#e0f2fe] via-[#e8f4fc] to-[#f0f7fd]';

          return (
            <div
              key={banner.id}
              className={`relative rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                isActive
                  ? 'bg-white border-zinc-200/90 shadow-sm hover:shadow-md'
                  : 'bg-zinc-50/80 border-zinc-200 opacity-60'
              }`}
            >
              {/* Mini Preview Box */}
              <div className={`p-4 bg-gradient-to-r ${bgClass} border-b border-zinc-100 relative min-h-[140px] flex flex-col justify-between`}>
                <div className="flex items-center justify-between gap-2">
                  {banner.pill ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/10 text-zinc-800 truncate max-w-[170px]">
                      {banner.pill}
                    </span>
                  ) : <span />}
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-zinc-700 shadow-2xs">
                    #{index + 1}
                  </span>
                </div>

                <div className="my-2">
                  <h4 className="text-sm font-black text-zinc-950 leading-tight">
                    {banner.titlePrimary}{' '}
                    <span className="text-blue-600">{banner.titleAccent}</span>
                  </h4>
                  {banner.subtitle && (
                    <p className="text-[11px] text-zinc-600 line-clamp-2 mt-1">
                      {banner.subtitle}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-zinc-900 text-white shadow-xs">
                    {banner.cta || 'Shop Now'}
                  </span>
                  {banner.singleBannerImage ? (
                    <span className="text-[10px] font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                      Full Banner Image
                    </span>
                  ) : (
                    <div className="flex items-center -space-x-1.5 overflow-hidden">
                      {[banner.image1, banner.image2, banner.image3, banner.image4].filter(Boolean).map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt=""
                          className="w-5 h-5 rounded-full object-cover border border-white bg-white"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="p-3 bg-white flex items-center justify-between gap-2 border-t border-zinc-100">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                    title="Move Up"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === banners.length - 1}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                    title="Move Down"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(banner.id)}
                    className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                    }`}
                    title={isActive ? 'Active (Click to hide)' : 'Hidden (Click to show)'}
                  >
                    {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span className="text-[10px]">{isActive ? 'সক্রিয়' : 'লুকানো'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(banner)}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>এডিট</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(banner.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer transition-colors"
                    title="Delete Banner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && editingBanner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-zinc-900">
                  {editingBanner.titlePrimary ? 'ব্যানার সম্পাদনা করুন' : 'নতুন ব্যানার তৈরি করুন'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Top Pill / Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    ব্যানার পিল / ছোট ব্যাজ (Pill Badge)
                  </label>
                  <input
                    type="text"
                    value={editingBanner.pill || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, pill: e.target.value })}
                    placeholder="যেমন: Your Trusted Shopping Partner"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    স্ট্যাটাস (Status)
                  </label>
                  <select
                    value={editingBanner.active ? '1' : '0'}
                    onChange={(e) => setEditingBanner({ ...editingBanner, active: e.target.value === '1' })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:border-emerald-500 outline-hidden"
                  >
                    <option value="1">সক্রিয় (Active)</option>
                    <option value="0">লুকানো (Inactive)</option>
                  </select>
                </div>
              </div>

              {/* Headlines */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    প্রধান শিরোনাম (Primary Headline) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingBanner.titlePrimary}
                    onChange={(e) => setEditingBanner({ ...editingBanner, titlePrimary: e.target.value })}
                    placeholder="যেমন: Shop Smart,"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    হাইলাইট শব্দ (Accent Headline)
                  </label>
                  <input
                    type="text"
                    value={editingBanner.titleAccent || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, titleAccent: e.target.value })}
                    placeholder="যেমন: Live Better"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden text-blue-600 font-bold"
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  বিস্তারিত বর্ণনা (Subtitle / Description)
                </label>
                <textarea
                  rows={2}
                  value={editingBanner.subtitle || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                  placeholder="ব্যানারের নিচের আকর্ষণীয় বর্ণনা লিখুন..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              {/* Button Text & Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    বাটনের লেখা (Button Text)
                  </label>
                  <input
                    type="text"
                    value={editingBanner.cta || 'Shop Now'}
                    onChange={(e) => setEditingBanner({ ...editingBanner, cta: e.target.value })}
                    placeholder="Shop Now"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:border-emerald-500 outline-hidden font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    বাটন লিঙ্ক (Target Link)
                  </label>
                  <input
                    type="text"
                    value={editingBanner.ctaLink || '#products-catalog-section'}
                    onChange={(e) => setEditingBanner({ ...editingBanner, ctaLink: e.target.value })}
                    placeholder="#products-catalog-section"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:border-emerald-500 outline-hidden text-zinc-600"
                  />
                </div>
              </div>

              {/* Background Theme Preset */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  ব্যাকগ্রাউন্ড কালার থিম (Background Theme)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GRADIENT_PRESETS.map((p) => {
                    const isSelected = editingBanner.bgGradient === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setEditingBanner({ ...editingBanner, bgGradient: p.value })}
                        className={`px-3 py-2 rounded-xl text-left text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs ring-1 ring-emerald-500'
                            : 'border-zinc-200 hover:border-zinc-300 text-zinc-700 bg-white'
                        }`}
                      >
                        <span className="truncate">{p.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Banner Layout Mode Selector */}
              <div className="pt-2 border-t border-zinc-200">
                <label className="block text-xs font-bold text-zinc-700 mb-2">
                  ব্যানার ছবি প্রদর্শনের ধরন (Image Mode)
                </label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setBannerMode('collage');
                      setEditingBanner({ ...editingBanner, singleBannerImage: '' });
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      bannerMode === 'collage'
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900'
                        : 'border-zinc-200 hover:border-zinc-300 text-zinc-600 bg-white'
                    }`}
                  >
                    <span>৪-টি প্রডাক্ট কোলাজ (4-Gadget Collage)</span>
                    <span className="text-[10px] font-normal text-zinc-500">মূল হেডফোন, ঘড়ি ও মোবাইল স্টাইল</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBannerMode('single')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      bannerMode === 'single'
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900'
                        : 'border-zinc-200 hover:border-zinc-300 text-zinc-600 bg-white'
                    }`}
                  >
                    <span>একটি একক ব্যানার ছবি (Single Full Banner)</span>
                    <span className="text-[10px] font-normal text-zinc-500">ব্যানার বা পোস্টারের সম্পূর্ণ ছবি</span>
                  </button>
                </div>

                {bannerMode === 'single' ? (
                  /* Single Banner Image Uploader */
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                    <label className="block text-xs font-bold text-zinc-800">
                      একক ব্যানার ছবি URL অথবা আপলোড করুন
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={editingBanner.singleBannerImage || ''}
                        onChange={(e) => setEditingBanner({ ...editingBanner, singleBannerImage: e.target.value })}
                        placeholder="https://... ব্যানার ছবির লিংক"
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-zinc-300 bg-white focus:border-emerald-500 outline-hidden"
                      />
                      <label className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>আপলোড</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload('singleBannerImage', e.target.files?.[0])}
                        />
                      </label>
                    </div>
                    {editingBanner.singleBannerImage && (
                      <div className="w-full aspect-16/9 rounded-xl overflow-hidden border border-zinc-200 max-h-40 bg-white">
                        <img src={editingBanner.singleBannerImage} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                ) : (
                  /* 4 Images Collage Inputs */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                    {(['image1', 'image2', 'image3', 'image4'] as const).map((field, idx) => {
                      const labels = ['প্রধান প্রডাক্ট ১ (হেডফোন)', 'প্রডাক্ট ২ (স্মার্টফোন)', 'প্রডাক্ট ৩ (স্মার্টওয়াচ)', 'প্রডাক্ট ৪ (ইয়ারবাডস)'];
                      return (
                        <div key={field} className="space-y-1">
                          <label className="block text-[11px] font-bold text-zinc-700">
                            {labels[idx]}
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="url"
                              value={editingBanner[field] || ''}
                              onChange={(e) => setEditingBanner({ ...editingBanner, [field]: e.target.value })}
                              placeholder="Image URL"
                              className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 bg-white outline-hidden"
                            />
                            <label className="p-1.5 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800 cursor-pointer shrink-0" title="Upload Image">
                              <Upload className="w-3.5 h-3.5" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(field, e.target.files?.[0])}
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Cursive Note */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  নিচের হ্যান্ডরাইটিং স্লোগান (Badge Cursive Note)
                </label>
                <input
                  type="text"
                  value={editingBanner.badgeNote || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, badgeNote: e.target.value })}
                  placeholder="Better Products ~ Better Life"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:border-emerald-500 outline-hidden font-serif italic"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  সংরক্ষণ করুন (Save Banner)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
