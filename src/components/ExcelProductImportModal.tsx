import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Tag,
  Layers,
  Search,
  Check,
  Globe,
  Sparkles,
  Info,
  Package,
  Eye,
} from 'lucide-react';
import { Product, Category } from '../types';
import { generateSlug } from '../utils/seo';
import { storeService } from '../services/storeService';

interface ExcelProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (importedCount: number) => void;
  categories: Category[];
  adminPassword?: string;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

interface ParsedImportProduct {
  id?: string;
  name: string;
  category: string;
  sub_category?: string;
  product_type?: string;
  child_category?: string;
  selling_price: number;
  regular_price?: number;
  buying_price?: number;
  discount?: number;
  stock: number;
  sku?: string;
  image_url: string;
  gallery_images?: string[];
  colors?: string[];
  description?: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  slug: string;
  brand?: string;
  isValid: boolean;
  validationError?: string;
}

export const ExcelProductImportModal: React.FC<ExcelProductImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categories,
  adminPassword,
  showToast,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedProducts, setParsedProducts] = useState<ParsedImportProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [activeTab, setActiveTab] = useState<'preview' | 'seo'>('preview');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Download Sample Excel Template
  const handleDownloadSampleTemplate = () => {
    try {
      const sampleData = [
        {
          name: 'T900 Ultra 2 Smartwatch With Bluetooth Calling',
          category: 'Smart Gadgets',
          sub_category: 'Smart Watch',
          product_type: 'T900 Ultra Series',
          selling_price: 1350,
          regular_price: 1850,
          buying_price: 950,
          stock: 45,
          sku: 'MX-SW-T900U',
          image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
          gallery_images: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80, https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80',
          colors: 'Black, Orange, Silver',
          description: 'High quality HD display smartwatch with bluetooth calling, fitness tracking, long battery life and waterproof build.',
          meta_title: 'T900 Ultra 2 Smartwatch Price in Bangladesh | Maxora Shop',
          meta_description: 'Buy original T900 Ultra 2 Smartwatch at best price in BD with fast cash on delivery all over Bangladesh.',
          meta_keywords: 't900 ultra, smartwatch bd, bluetooth calling watch, smart gadgets',
          slug: 't900-ultra-2-smartwatch-with-bluetooth-calling',
          brand: 'Maxora',
        },
        {
          name: 'M10 TWS Wireless Gaming Earbuds With Powerbank Case',
          category: 'Audio',
          sub_category: 'Wireless Earbuds',
          product_type: 'TWS Gaming Series',
          selling_price: 590,
          regular_price: 950,
          buying_price: 320,
          stock: 80,
          sku: 'MX-TWS-M10',
          image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
          gallery_images: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
          colors: 'Black',
          description: 'Stereo Hi-Fi sound quality TWS with digital LED display, touch controls, low latency gaming and emergency charging case.',
          meta_title: 'M10 TWS Wireless Earbuds Price in BD | Maxora Shop',
          meta_description: 'Order M10 TWS Wireless Gaming Earbuds with 2000mAh battery case. 100% authentic with cash on delivery.',
          meta_keywords: 'm10 tws, earbuds bangladesh, wireless headphones, gaming earbuds',
          slug: 'm10-tws-wireless-gaming-earbuds',
          brand: 'Maxora',
        },
        {
          name: 'Portable Mini High Speed USB Rechargeable Desk Fan',
          category: 'Home & Living',
          sub_category: 'Mini Gadgets',
          product_type: 'Rechargeable Fans',
          selling_price: 750,
          regular_price: 1100,
          buying_price: 450,
          stock: 60,
          sku: 'MX-FAN-001',
          image_url: 'https://images.unsplash.com/photo-1618941716939-553df3c6c278?w=800&auto=format&fit=crop&q=80',
          gallery_images: '',
          colors: 'White, Pink, Sky Blue',
          description: 'Silent motor USB rechargeable table fan with 3 speed levels and 2000mAh lithium battery for indoor and travel use.',
          meta_title: '',
          meta_description: '',
          meta_keywords: '',
          slug: '',
          brand: 'Maxora',
        },
      ];

      const ws = XLSX.utils.json_to_sheet(sampleData);

      // Set optimal column widths
      ws['!cols'] = [
        { wch: 45 }, // name
        { wch: 18 }, // category
        { wch: 20 }, // sub_category
        { wch: 22 }, // product_type
        { wch: 14 }, // selling_price
        { wch: 14 }, // regular_price
        { wch: 14 }, // buying_price
        { wch: 10 }, // stock
        { wch: 16 }, // sku
        { wch: 45 }, // image_url
        { wch: 45 }, // gallery_images
        { wch: 22 }, // colors
        { wch: 50 }, // description
        { wch: 35 }, // meta_title
        { wch: 45 }, // meta_description
        { wch: 30 }, // meta_keywords
        { wch: 35 }, // slug
        { wch: 15 }, // brand
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Products_Template');

      XLSX.writeFile(wb, 'Maxora_Products_Import_Template.xlsx');
      showToast('নমুনা এক্সেল ফাইল ডাউনলোড সফল হয়েছে!', 'success');
    } catch (e: any) {
      console.error(e);
      showToast('টেমপ্লেট ডাউনলোড ব্যর্থ হয়েছে', 'error');
    }
  };

  // 2. Parse Excel/CSV File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processSelectedFile(selectedFile);
    }
  };

  const processSelectedFile = (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessingFile(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          showToast('এক্সেল ফাইলে কোনো ডাটা পাওয়া যায়নি!', 'error');
          setIsProcessingFile(false);
          return;
        }

        const parsed: ParsedImportProduct[] = rawRows.map((row, index) => {
          // Normalize column names (support case insensitive & aliases)
          const getVal = (...keys: string[]) => {
            for (const k of keys) {
              for (const rowKey of Object.keys(row)) {
                if (rowKey.trim().toLowerCase() === k.toLowerCase()) {
                  return row[rowKey];
                }
              }
            }
            return '';
          };

          const name = String(getVal('name', 'product_name', 'title', 'product name') || '').trim();
          const category = String(getVal('category', 'category_name', 'cat') || 'Smart Gadgets').trim();
          const subCategory = String(getVal('sub_category', 'subcategory', 'sub category', 'sub-category') || '').trim();
          const productType = String(getVal('product_type', 'type', 'product type') || '').trim();
          const childCategory = String(getVal('child_category', 'child category') || '').trim();
          const brand = String(getVal('brand', 'brand_name') || 'Maxora').trim();

          const sellingPriceRaw = getVal('selling_price', 'price', 'selling price', 'sale_price', 'offer_price');
          const sellingPrice = Math.max(0, Number(String(sellingPriceRaw).replace(/[^0-9.]/g, '') || 0));

          const regularPriceRaw = getVal('regular_price', 'regular price', 'original_price', 'mrp', 'old_price');
          const regularPrice = Math.max(0, Number(String(regularPriceRaw).replace(/[^0-9.]/g, '') || 0));

          const buyingPriceRaw = getVal('buying_price', 'cost_price', 'buying price');
          const buyingPrice = Math.max(0, Number(String(buyingPriceRaw).replace(/[^0-9.]/g, '') || 0));

          const discount = regularPrice > sellingPrice ? regularPrice - sellingPrice : 0;

          const stockRaw = getVal('stock', 'quantity', 'qty', 'inventory');
          const stock = Math.max(0, Number(String(stockRaw).replace(/[^0-9]/g, '') || 50));

          const skuRaw = String(getVal('sku', 'code', 'product_code') || '').trim();
          const sku = skuRaw || `MX-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

          const imageUrlRaw = String(getVal('image_url', 'image', 'photo', 'picture', 'main_image') || '').trim();
          const imageUrl = imageUrlRaw || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';

          const galleryRaw = String(getVal('gallery_images', 'gallery', 'more_images', 'images') || '').trim();
          const galleryImages = galleryRaw
            ? galleryRaw.split(/[,;\n]/).map((u) => u.trim()).filter(Boolean)
            : [];

          const colorsRaw = String(getVal('colors', 'color', 'variants') || '').trim();
          const colors = colorsRaw
            ? colorsRaw.split(/[,;\n]/).map((c) => c.trim()).filter(Boolean)
            : [];

          const description = String(getVal('description', 'details', 'desc') || '').trim();

          // SEO HANDLING (Automated Smart SEO or explicit custom SEO from Excel)
          const customSlug = String(getVal('slug', 'url_slug', 'url') || '').trim();
          const cleanSlug = customSlug ? generateSlug(customSlug) : generateSlug(name || `item-${index + 1}`);

          const customMetaTitle = String(getVal('meta_title', 'seo_title', 'meta title') || '').trim();
          const metaTitle = customMetaTitle || `${name} Price in Bangladesh | Maxora Shop`;

          const customMetaDesc = String(getVal('meta_description', 'seo_description', 'meta description') || '').trim();
          const metaDescription = customMetaDesc || (description
            ? description.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim().slice(0, 160)
            : `Buy ${name} at the best price in Bangladesh with fast Cash on Delivery and authentic warranty at Maxora Shop.`);

          const customKeywords = String(getVal('meta_keywords', 'keywords', 'tags') || '').trim();
          const metaKeywords = customKeywords || [
            name.toLowerCase(),
            category.toLowerCase(),
            subCategory ? subCategory.toLowerCase() : '',
            'online shopping bangladesh',
            'cash on delivery bd',
          ].filter(Boolean).join(', ');

          let isValid = true;
          let validationError = '';

          if (!name) {
            isValid = false;
            validationError = 'পণ্যের নাম নেই (Name missing)';
          } else if (sellingPrice <= 0) {
            isValid = false;
            validationError = 'সঠিক বিক্রয় মূল্য দিন (Invalid selling price)';
          }

          return {
            name,
            category,
            sub_category: subCategory,
            product_type: productType,
            child_category: childCategory,
            selling_price: sellingPrice,
            regular_price: regularPrice || sellingPrice,
            buying_price: buyingPrice,
            discount,
            stock,
            sku,
            image_url: imageUrl,
            gallery_images: galleryImages,
            colors,
            description,
            meta_title: metaTitle,
            meta_description: metaDescription,
            meta_keywords: metaKeywords,
            slug: cleanSlug,
            brand,
            isValid,
            validationError,
          };
        });

        setParsedProducts(parsed);
        showToast(`${parsed.length}টি প্রোডাক্ট এক্সেল থেকে সফলভাবে লোড হয়েছে!`, 'success');
      } catch (err: any) {
        console.error(err);
        showToast('ফাইল রিড করতে সমস্যা হয়েছে: ' + (err.message || 'Unknown format'), 'error');
      } finally {
        setIsProcessingFile(false);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  // 3. Confirm & Execute Bulk Import to Firestore
  const handleExecuteImport = async () => {
    const validOnes = parsedProducts.filter((p) => p.isValid);
    if (validOnes.length === 0) {
      showToast('আপলোড করার মতো কোনো ভ্যালিড প্রোডাক্ট পাওয়া যায়নি!', 'error');
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: validOnes.length });

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < validOnes.length; i++) {
      const p = validOnes[i];
      try {
        const productPayload: Partial<Product> = {
          name: p.name,
          category: p.category || 'Smart Gadgets',
          sub_category: p.sub_category || '',
          product_type: p.product_type || 'Standard Product',
          child_category: p.child_category || '',
          brand: p.brand || 'Maxora',
          selling_price: p.selling_price,
          discount: p.discount || 0,
          buying_price: p.buying_price || 0,
          stock: p.stock,
          sku: p.sku,
          image_url: p.image_url,
          images: p.gallery_images && p.gallery_images.length > 0 ? [p.image_url, ...p.gallery_images] : [p.image_url],
          colors: (p.colors || []).map((c) => ({ name: c, code: '#18181b', stock: Math.floor(p.stock / (p.colors?.length || 1)) })),
          description: p.description || '',
          slug: p.slug,
          meta_title: p.meta_title,
          meta_description: p.meta_description,
          meta_keywords: p.meta_keywords,
          featured: 0,
          active: 1,
        };

        const result = await storeService.addProduct(productPayload, adminPassword);
        if (result.success) {
          successCount++;
        }
      } catch (err: any) {
        errors.push(`${p.name}: ${err?.message || 'Failed'}`);
      }

      setImportProgress({ current: i + 1, total: validOnes.length });
    }

    setIsImporting(false);

    if (successCount > 0) {
      showToast(`🎉 অভিনন্দন! ${successCount}টি প্রোডাক্ট সফলভাবে আপলোড ও ক্যাটাগরাইজ হয়েছে!`, 'success');
      onSuccess(successCount);
      onClose();
    } else {
      showToast(`প্রোডাক্ট আপলোড ব্যর্থ হয়েছে: ${errors[0] || 'Unknown error'}`, 'error');
    }
  };

  const filteredPreview = parsedProducts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.sub_category && p.sub_category.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      p.slug.toLowerCase().includes(q)
    );
  });

  const validCount = parsedProducts.filter((p) => p.isValid).length;
  const invalidCount = parsedProducts.filter((p) => !p.isValid).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-600/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg sm:text-xl text-zinc-900 tracking-tight flex items-center gap-2">
                <span>Excel / CSV Bulk Product Import</span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Auto Category & SEO
                </span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                এক্সেলে প্রোডাক্ট যোগ করে এক ক্লিকে শত শত প্রোডাক্ট লাইভ করুন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSampleTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="নমুনা এক্সেল ফাইল ডাউনলোড করুন"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Download Sample Template</span>
              <span className="sm:hidden">Template</span>
            </button>
            <button
              onClick={onClose}
              disabled={isImporting}
              className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* SEO & Category Explanation Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-950">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-extrabold text-sm text-indigo-950">
                  💡 প্রোডাক্ট SEO এবং ক্যাটাগরি যেভাবে স্বয়ংক্রিয়ভাবে কাজ করে:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-zinc-700">
                  <li>
                    <strong className="text-zinc-900">অটোমেটিক ক্যাটাগরি শো:</strong> এক্সেলে আপনি যে ক্যাটাগরি ও সাব-ক্যাটাগরি দেবেন, আপলোড করার সাথে সাথে ওয়েবসাইট এবং অ্যাডমিন প্যানেলে সেই ক্যাটাগরি অনুযায়ী প্রোডাক্ট ফিল্টার হয়ে সাজিয়ে যাবে।
                  </li>
                  <li>
                    <strong className="text-zinc-900">স্মার্ট এসইও (Auto-SEO Generation):</strong> এক্সেলে <code className="bg-white px-1 rounded text-indigo-700">meta_title</code>, <code className="bg-white px-1 rounded text-indigo-700">meta_description</code>, এবং <code className="bg-white px-1 rounded text-indigo-700">slug</code> কলামগুলো ফাঁকা রাখলে সিস্টেম স্বয়ংক্রিয়ভাবে গুগলের জন্য সর্বোচ্চ র‍্যাঙ্কিং উপযোগী টাইটেল, ডেসক্রিপশন এবং পারফেক্ট ক্লিন ইউআরএল তৈরি করে দেবে!
                  </li>
                  <li>
                    <strong className="text-zinc-900">কাস্টম এসইও:</strong> আপনি চাইলে এক্সেল ফাইলে নিজের মতো করে মেটা টাইটেল ও মেটা ডেসক্রিপশন লিখেও আপলোড করতে পারেন।
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Upload Dropzone */}
          {!file && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const droppedFile = e.dataTransfer.files?.[0];
                if (droppedFile) processSelectedFile(droppedFile);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
                  : 'border-zinc-300 hover:border-emerald-500 bg-zinc-50/60 hover:bg-emerald-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3.5 shadow-sm">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-base sm:text-lg text-zinc-900">
                এক্সেল বা সিএসভি ফাইল ড্রপ করুন অথবা ক্লিক করে সিলেক্ট করুন
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-md">
                সাপোর্টেড ফরম্যাট: <span className="font-bold text-zinc-700">.xlsx, .xls, .csv</span>। ফাইল সিলেক্ট করার সাথে সাথে নিচে ইন্টারেক্টিভ প্রিভিউ তৈরি হবে।
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20">
                <FileSpreadsheet className="w-4 h-4" />
                <span>ফাইল সিলেক্ট করুন</span>
              </div>
            </div>
          )}

          {/* Loading File Indicator */}
          {isProcessingFile && (
            <div className="p-8 text-center bg-zinc-50 rounded-2xl border border-zinc-200">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-zinc-800">এক্সেল ফাইল প্রসেস ও এসইও এনালাইজ করা হচ্ছে...</p>
            </div>
          )}

          {/* Parsed Results Screen */}
          {file && !isProcessingFile && parsedProducts.length > 0 && (
            <div className="space-y-4">
              {/* File Info & Stats Strip */}
              <div className="bg-zinc-100 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 border border-zinc-200">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-xs sm:text-sm text-zinc-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {(file.size / 1024).toFixed(1)} KB • {parsedProducts.length}টি সারি সনাক্ত হয়েছে
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{validCount} ভ্যালিড</span>
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 font-extrabold text-xs flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>{invalidCount} ত্রুটিপূর্ণ</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setParsedProducts([]);
                    }}
                    className="px-2.5 py-1 text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                  >
                    ফাইল পরিবর্তন
                  </button>
                </div>
              </div>

              {/* View Switcher & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200 w-fit">
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'preview'
                        ? 'bg-white text-zinc-950 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    প্রোডাক্ট তালিকা ও স্টক ({parsedProducts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('seo')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'seo'
                        ? 'bg-white text-zinc-950 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Globe className="w-3 h-3 text-indigo-600" />
                    <span>গুগল এসইও ও মেটা প্রিভিউ</span>
                  </button>
                </div>

                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="নাম বা ক্যাটাগরি দিয়ে ফিল্টার করুন..."
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left text-xs text-zinc-600">
                    <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-800 font-extrabold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                      <tr>
                        <th className="p-3 w-12 text-center">#</th>
                        {activeTab === 'preview' ? (
                          <>
                            <th className="p-3">প্রোডাক্ট ও ছবি</th>
                            <th className="p-3">ক্যাটাগরি / সাব-ক্যাটাগরি</th>
                            <th className="p-3 text-right">বিক্রয় মূল্য</th>
                            <th className="p-3 text-right">আসল মূল্য</th>
                            <th className="p-3 text-center">স্টক</th>
                            <th className="p-3">SKU</th>
                            <th className="p-3 text-center">স্ট্যাটাস</th>
                          </>
                        ) : (
                          <>
                            <th className="p-3">প্রোডাক্ট</th>
                            <th className="p-3">গুগল এসইও স্লাগ (Clean URL)</th>
                            <th className="p-3">এসইও মেটা টাইটেল (Title)</th>
                            <th className="p-3">মেটা ডেসক্রিপশন (Description)</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 bg-white">
                      {filteredPreview.map((item, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-zinc-50/80 transition-colors ${
                            !item.isValid ? 'bg-rose-50/40' : ''
                          }`}
                        >
                          <td className="p-3 text-center font-bold text-zinc-400">
                            {idx + 1}
                          </td>

                          {activeTab === 'preview' ? (
                            <>
                              <td className="p-3">
                                <div className="flex items-center gap-2.5 min-w-[220px]">
                                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200">
                                    <img
                                      src={item.image_url}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
                                      }}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-extrabold text-zinc-900 truncate">
                                      {item.name}
                                    </p>
                                    {item.colors && item.colors.length > 0 && (
                                      <p className="text-[10px] text-zinc-500 truncate">
                                        কালার: {item.colors.join(', ')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="p-3 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                                  <Tag className="w-2.5 h-2.5" />
                                  <span>{item.category}</span>
                                </span>
                                {item.sub_category && (
                                  <span className="block text-[10px] text-zinc-500 font-semibold mt-0.5">
                                    ↳ {item.sub_category}
                                  </span>
                                )}
                              </td>

                              <td className="p-3 text-right font-black text-zinc-900 whitespace-nowrap">
                                ৳{item.selling_price.toLocaleString('en-BD')}
                              </td>

                              <td className="p-3 text-right text-zinc-400 line-through whitespace-nowrap">
                                {item.regular_price && item.regular_price > item.selling_price
                                  ? `৳${item.regular_price.toLocaleString('en-BD')}`
                                  : '—'}
                              </td>

                              <td className="p-3 text-center whitespace-nowrap">
                                <span className="font-extrabold text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded-md">
                                  {item.stock}
                                </span>
                              </td>

                              <td className="p-3 font-mono text-[10px] text-zinc-600 whitespace-nowrap">
                                {item.sku}
                              </td>

                              <td className="p-3 text-center whitespace-nowrap">
                                {item.isValid ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    <Check className="w-2.5 h-2.5" />
                                    <span>রেডি</span>
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full"
                                    title={item.validationError}
                                  >
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    <span>ত্রুটি</span>
                                  </span>
                                )}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 font-bold text-zinc-900 min-w-[180px]">
                                {item.name}
                              </td>

                              <td className="p-3 min-w-[200px]">
                                <div className="flex items-center gap-1 font-mono text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-1 rounded-lg">
                                  <Globe className="w-3 h-3 shrink-0" />
                                  <span className="truncate">maxorabd.com/product/{item.slug}</span>
                                </div>
                              </td>

                              <td className="p-3 min-w-[220px]">
                                <p className="font-extrabold text-zinc-900 text-xs truncate">
                                  {item.meta_title}
                                </p>
                              </td>

                              <td className="p-3 min-w-[260px]">
                                <p className="text-[11px] text-zinc-600 line-clamp-2">
                                  {item.meta_description}
                                </p>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar during Import */}
          {isImporting && (
            <div className="p-6 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              <div>
                <p className="font-black text-base text-emerald-950">
                  প্রোডাক্টগুলো ফায়ারবেস ডেটাবেজে আপলোড করা হচ্ছে...
                </p>
                <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                  {importProgress.current} / {importProgress.total}টি প্রোডাক্ট সম্পন্ন হয়েছে
                </p>
              </div>
              <div className="w-full bg-emerald-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round((importProgress.current / Math.max(1, importProgress.total)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3 bg-zinc-50 shrink-0">
          <div className="text-xs text-zinc-500 font-medium">
            {parsedProducts.length > 0 ? (
              <span>
                মোট <strong className="text-zinc-900 font-bold">{validCount}টি</strong> প্রোডাক্ট প্রস্তুত
              </span>
            ) : (
              <span>প্রথমে এক্সেল ফাইল আপলোড করুন</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              বাতিল (Cancel)
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isImporting || validCount === 0 || isProcessingFile}
              className={`px-5 py-2 rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                validCount > 0 && !isImporting
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-emerald-600/20'
                  : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>আপলোড হচ্ছে ({importProgress.current}/{importProgress.total})...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>নিশ্চিত করুন ও আপলোড করুন ({validCount}টি প্রোডাক্ট)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
