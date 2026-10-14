import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Upload,
  Image as ImageIcon,
  ShieldCheck,
  Truck,
  Headphones,
  Sparkles,
  Award,
  HeartHandshake,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Clock,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  Trash2,
  Info,
  Layers,
  Building2,
  FileText
} from 'lucide-react';
import { AboutPageData, defaultAboutPageData, FeatureCard } from '../models/aboutPageSchema';

interface AboutPageEditorProps {
  adminPassword?: string;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AboutPageEditor: React.FC<AboutPageEditorProps> = ({
  adminPassword,
  showToast,
}) => {
  const [formData, setFormData] = useState<AboutPageData>(defaultAboutPageData);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingCeo, setUploadingCeo] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'content' | 'features' | 'ceo' | 'contact'>('content');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to get effective admin token
  const getAdminAuthHeader = (): Record<string, string> => {
    const token =
      adminPassword ||
      (typeof window !== 'undefined'
        ? sessionStorage.getItem('maxora_admin_token') ||
          sessionStorage.getItem('maxora_admin_password') ||
          localStorage.getItem('maxora_admin_password')
        : '') ||
      '123456';
    return {
      'x-admin-password': token,
      'x-admin-token': token,
      Authorization: `Bearer ${token}`,
    };
  };

  // Load existing data from backend API
  useEffect(() => {
    let isMounted = true;
    const loadAboutData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/about', {
          headers: getAdminAuthHeader(),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            setFormData({
              ...defaultAboutPageData,
              ...json.data,
              features:
                Array.isArray(json.data.features) && json.data.features.length >= 3
                  ? json.data.features.slice(0, 3)
                  : defaultAboutPageData.features,
              contact_info: {
                ...defaultAboutPageData.contact_info,
                ...(json.data.contact_info || {}),
              },
            });
          }
        }
      } catch (err: any) {
        console.warn('Could not fetch about data from backend, using defaults:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAboutData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save changes to backend database
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/admin/about', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader(),
        },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast('About Us page content saved and published successfully!', 'success');
        if (json.data) {
          setFormData(json.data);
        }
      } else {
        throw new Error(json.error || 'Failed to save changes');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      showToast('Error saving About Us page: ' + (err.message || 'Server error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle CEO Image file selection & upload
  const handleCeoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP).', 'error');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast('Image size exceeds 8MB limit.', 'error');
      return;
    }

    try {
      setUploadingCeo(true);
      const reader = new FileReader();

      reader.onload = async () => {
        const dataUrl = reader.result as string;

        // Upload to dedicated server endpoint
        try {
          const res = await fetch('/api/admin/about/upload-ceo', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAdminAuthHeader(),
            },
            body: JSON.stringify({
              data_url: dataUrl,
              filename: file.name,
            }),
          });

          const json = await res.json();
          if (res.ok && json.success && json.url) {
            setFormData((prev) => ({
              ...prev,
              ceo_image_url: json.url,
            }));
            showToast('CEO image uploaded successfully!', 'success');
          } else {
            // Fallback to storing base64 directly
            setFormData((prev) => ({
              ...prev,
              ceo_image_url: dataUrl,
            }));
            showToast('CEO image loaded and ready to save!', 'info');
          }
        } catch (apiErr) {
          // If network failed, save data URL in state
          setFormData((prev) => ({
            ...prev,
            ceo_image_url: dataUrl,
          }));
          showToast('CEO image loaded locally. Click Save to persist.', 'info');
        } finally {
          setUploadingCeo(false);
        }
      };

      reader.onerror = () => {
        showToast('Failed to read image file.', 'error');
        setUploadingCeo(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      showToast('Error uploading CEO image: ' + err.message, 'error');
      setUploadingCeo(false);
    }
  };

  // Update specific feature card
  const handleFeatureChange = (index: number, field: keyof FeatureCard, value: string) => {
    setFormData((prev) => {
      const updated = [...(prev.features || defaultAboutPageData.features)];
      if (!updated[index]) {
        updated[index] = {
          title: '',
          description: '',
          icon: 'ShieldCheck',
          badge: '',
        };
      }
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return {
        ...prev,
        features: updated,
      };
    });
  };

  const availableIcons = [
    { name: 'ShieldCheck', label: 'Shield / Security' },
    { name: 'Truck', label: 'Delivery Truck' },
    { name: 'Headphones', label: 'Customer Support' },
    { name: 'Sparkles', label: 'Premium Sparkles' },
    { name: 'Award', label: 'Quality Award' },
    { name: 'HeartHandshake', label: 'Trust & Partner' },
  ];

  if (loading) {
    return (
      <div className="p-12 text-center space-y-3 bg-white rounded-3xl border border-zinc-200">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <p className="text-xs font-bold text-zinc-600">Loading About Us page configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
              Frontend Customization
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
            About Us Page Management (আমাদের সম্পর্কে পেজ)
          </h2>
          <p className="text-xs text-zinc-500">
            Edit brand story, 3 value features, CEO profile card, photo upload, and corporate contact details.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/#about"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-all cursor-pointer border border-zinc-300"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>লাইভ ভিউ দেখুন</span>
          </a>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন (Save)'}</span>
          </button>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'content'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>১. ব্র্যান্ড পরিচিতি ও গল্প</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('features')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'features'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>২. ৩টি মূল ফিচার কার্ড</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ceo')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'ceo'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>৩. সিইও প্রোফাইল ও ফটো আপলোড</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'contact'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>৪. কর্পোরেট ঠিকানা ও সাপোর্ট</span>
        </button>
      </div>

      {/* ====================================================
          TAB 1: Brand Story & Titles
      ==================================================== */}
      {activeTab === 'content' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-6 animate-fade-in">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                পেজ শিরোনাম (Page Title)
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="যেমন: আমাদের সম্পর্কে - ম্যাক্সোরা বাংলাদেশ"
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-emerald-600 focus:bg-white text-zinc-900 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                উপ-শিরোনাম / ট্যাগলাইন (Subtitle)
              </label>
              <input
                type="text"
                value={formData.subtitle || ''}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="১০০% প্রিমিয়াম কোয়ালিটি লাইফস্টাইল পণ্য..."
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-emerald-600 focus:bg-white text-zinc-900 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>ব্র্যান্ডের গল্প (Brand Story - Bangla Text)</span>
                <span className="text-[11px] text-zinc-400 font-normal">
                  প্যারাগ্রাফের মাঝে দুটি নতুন লাইন দিন
                </span>
              </label>
              <textarea
                rows={7}
                value={formData.brand_story || ''}
                onChange={(e) => setFormData({ ...formData, brand_story: e.target.value })}
                placeholder="ম্যাক্সোরা বাংলাদেশ এর ব্র্যান্ডের লক্ষ্য ও শুরুর ইতিহাস..."
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-emerald-600 focus:bg-white text-zinc-900 rounded-xl p-4 text-xs sm:text-sm leading-relaxed focus:outline-none transition-all font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  আমাদের লক্ষ্য (Our Mission)
                </label>
                <textarea
                  rows={3}
                  value={formData.mission || ''}
                  onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                  placeholder="আমাদের মূল লক্ষ্য..."
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-emerald-600 focus:bg-white text-zinc-900 rounded-xl p-3 text-xs focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  ভবিষ্যৎ পরিকল্পনা (Our Vision)
                </label>
                <textarea
                  rows={3}
                  value={formData.vision || ''}
                  onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                  placeholder="আমাদের ভবিষ্যৎ ভাবনা..."
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-emerald-600 focus:bg-white text-zinc-900 rounded-xl p-3 text-xs focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  প্রতিষ্ঠার সাল (Established Year)
                </label>
                <input
                  type="text"
                  value={formData.established_year || ''}
                  onChange={(e) => setFormData({ ...formData, established_year: e.target.value })}
                  placeholder="2023"
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-emerald-600 focus:bg-white text-zinc-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  মোট গ্রাহক সংখ্যা কাউন্ট
                </label>
                <input
                  type="text"
                  value={formData.happy_customers_count || ''}
                  onChange={(e) => setFormData({ ...formData, happy_customers_count: e.target.value })}
                  placeholder="২৫,০০০+"
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-emerald-600 focus:bg-white text-zinc-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  মোট ডেলিভারি সংখ্যা
                </label>
                <input
                  type="text"
                  value={formData.total_deliveries || ''}
                  onChange={(e) => setFormData({ ...formData, total_deliveries: e.target.value })}
                  placeholder="৩৫,০০০+"
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-emerald-600 focus:bg-white text-zinc-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          TAB 2: Three Feature Cards
      ==================================================== */}
      {activeTab === 'features' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 flex items-start gap-3">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">৩টি মূল ফিচার কার্ড কনফিগারেশন</p>
              <p className="text-emerald-900/80">
                এই তিনটি কার্ড গ্রাহকদের সামনে আপনার ব্র্যান্ডের বিশ্বস্ততার মূল স্তম্ভ হিসেবে প্রদর্শিত হবে। প্রতিটি কার্ডের জন্য শিরোনাম, বিবরণ এবং আইকন নির্বাচন করুন।
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((idx) => {
              const card = (formData.features && formData.features[idx]) || {
                title: `ফিচার #${idx + 1}`,
                description: '',
                icon: 'ShieldCheck',
                badge: '',
              };

              return (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs space-y-4 relative"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                    <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">
                      ফিচার কার্ড #{idx + 1}
                    </span>
                    <span className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center text-xs font-bold font-mono">
                      {idx + 1}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 uppercase mb-1">
                      আইকন নির্বাচন (Icon)
                    </label>
                    <select
                      value={card.icon || 'ShieldCheck'}
                      onChange={(e) => handleFeatureChange(idx, 'icon', e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-600"
                    >
                      {availableIcons.map((ic) => (
                        <option key={ic.name} value={ic.name}>
                          {ic.label} ({ic.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 uppercase mb-1">
                      ট্যাগ / ব্যাজ (Badge)
                    </label>
                    <input
                      type="text"
                      value={card.badge || ''}
                      onChange={(e) => handleFeatureChange(idx, 'badge', e.target.value)}
                      placeholder="যেমন: গুণগত মান নিশ্চিত"
                      className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 uppercase mb-1">
                      ফিচার শিরোনাম (Title)
                    </label>
                    <input
                      type="text"
                      value={card.title || ''}
                      onChange={(e) => handleFeatureChange(idx, 'title', e.target.value)}
                      placeholder="১০০% অরিজিনাল পণ্য"
                      className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 uppercase mb-1">
                      বিস্তারিত বিবরণ (Description)
                    </label>
                    <textarea
                      rows={4}
                      value={card.description || ''}
                      onChange={(e) => handleFeatureChange(idx, 'description', e.target.value)}
                      placeholder="আমরা প্রতিটি পণ্যের নিখুঁত মান যাচাই করি..."
                      className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================
          TAB 3: CEO Profile & Image Upload
      ==================================================== */}
      {activeTab === 'ceo' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* CEO Image Upload Box */}
            <div className="w-full md:w-64 shrink-0 space-y-3">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                সিইও এর ছবি (CEO Photo Upload)
              </label>

              <div className="relative w-full aspect-square rounded-3xl border-2 border-dashed border-zinc-300 hover:border-emerald-500 bg-zinc-50 overflow-hidden flex flex-col items-center justify-center p-3 text-center transition-colors group">
                {formData.ceo_image_url ? (
                  <>
                    <img
                      src={formData.ceo_image_url}
                      alt="CEO Preview"
                      className="w-full h-full object-cover rounded-2xl"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-xl bg-white text-zinc-900 text-xs font-bold hover:scale-105 transition-transform"
                        title="নতুন ছবি পরিবর্তন করুন"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, ceo_image_url: '' })}
                        className="p-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:scale-105 transition-transform"
                        title="ছবি মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer space-y-2 flex flex-col items-center justify-center w-full h-full p-4"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-800">ছবি সিলেক্ট করুন</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">PNG, JPG বা WebP (সর্বোচ্চ ৮MB)</p>
                    </div>
                  </div>
                )}

                {uploadingCeo && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
                    <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                    <span className="text-xs font-bold text-zinc-800">আপলোড হচ্ছে...</span>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCeoFileSelect}
                className="hidden"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingCeo}
                  className="flex-1 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>ছবি আপলোড</span>
                </button>
                {formData.ceo_image_url && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ceo_image_url: '' })}
                    className="p-2 rounded-xl border border-zinc-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                    title="রিমুভ করুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Direct image path input */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                  অথবা ছবির লিঙ্ক (Direct Image URL)
                </label>
                <input
                  type="text"
                  value={formData.ceo_image_url || ''}
                  onChange={(e) => setFormData({ ...formData, ceo_image_url: e.target.value })}
                  placeholder="/uploads/ceo.jpg বা https://..."
                  className="w-full bg-zinc-50 border border-zinc-200 text-zinc-800 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* CEO Information Inputs */}
            <div className="flex-1 space-y-4 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    প্রতিষ্ঠাতা / সিইও এর পুরো নাম (CEO Name)
                  </label>
                  <input
                    type="text"
                    value={formData.ceo_name || ''}
                    onChange={(e) => setFormData({ ...formData, ceo_name: e.target.value })}
                    placeholder="মোঃ আরিফুল ইসলাম"
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-emerald-600 focus:bg-white text-zinc-900 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    পদবী ও উপাধি (Designation / Title)
                  </label>
                  <input
                    type="text"
                    value={formData.ceo_title || ''}
                    onChange={(e) => setFormData({ ...formData, ceo_title: e.target.value })}
                    placeholder="প্রতিষ্ঠাতা ও প্রধান নির্বাহী কর্মকর্তা (Founder & CEO)"
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-emerald-600 focus:bg-white text-zinc-900 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  প্রতিষ্ঠাতার বিশেষ বার্তা (CEO Message / Quote)
                </label>
                <textarea
                  rows={6}
                  value={formData.ceo_message || ''}
                  onChange={(e) => setFormData({ ...formData, ceo_message: e.target.value })}
                  placeholder="গ্রাহকদের উদ্দেশে সিইও এর মূল্যবান বক্তব্য..."
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-emerald-600 focus:bg-white text-zinc-900 rounded-xl p-4 text-xs sm:text-sm leading-relaxed focus:outline-none font-sans"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          TAB 4: Corporate Contact Details
      ==================================================== */}
      {activeTab === 'contact' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>হটলাইন / মোবাইল ফোন (Contact Phone)</span>
              </label>
              <input
                type="text"
                value={formData.contact_info?.phone || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact_info: { ...formData.contact_info, phone: e.target.value },
                  })
                }
                placeholder="01700-123456"
                className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold font-mono focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-teal-600" />
                <span>অফিসিয়াল ইমেইল (Official Email)</span>
              </label>
              <input
                type="email"
                value={formData.contact_info?.email || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact_info: { ...formData.contact_info, email: e.target.value },
                  })
                }
                placeholder="support@maxorabd.com"
                className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                <span>হোয়াটসঅ্যাপ নম্বর (WhatsApp Support)</span>
              </label>
              <input
                type="text"
                value={formData.contact_info?.whatsapp || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact_info: { ...formData.contact_info, whatsapp: e.target.value },
                  })
                }
                placeholder="+8801700123456"
                className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold font-mono focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>অফিস ও সেবার সময় (Working Hours)</span>
              </label>
              <input
                type="text"
                value={formData.contact_info?.working_hours || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact_info: { ...formData.contact_info, working_hours: e.target.value },
                  })
                }
                placeholder="সকাল ১০:০০ টা - রাত ১০:০০ টা (প্রতিদিন)"
                className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>কর্পোরেট অফিসের ঠিকানা (Address)</span>
              </label>
              <textarea
                rows={3}
                value={formData.contact_info?.address || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact_info: { ...formData.contact_info, address: e.target.value },
                  })
                }
                placeholder="বাড়ি #১২, রোড #০৪, সেক্টর #১১, উত্তরা, ঢাকা-১২৩০, বাংলাদেশ"
                className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl p-3 text-xs sm:text-sm leading-relaxed focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Save Action Bar */}
      <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            if (window.confirm('আপনি কি পূর্বনির্ধারিত ডিফল্ট বাংলা কন্টেন্টে ফিরে যেতে চান?')) {
              setFormData({ ...defaultAboutPageData });
              showToast('Default Bangla content loaded. Click Save to publish.', 'info');
            }
          }}
          className="text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
        >
          ডিফল্ট বাংলা কন্টেন্টে রিসেট করুন
        </button>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-black text-xs sm:text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          ) : (
            <Save className="w-4 h-4 text-emerald-400" />
          )}
          <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন (Save All Changes)'}</span>
        </button>
      </div>
    </div>
  );
};

export default AboutPageEditor;
