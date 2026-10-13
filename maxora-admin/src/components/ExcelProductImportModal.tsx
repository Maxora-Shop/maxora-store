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
  ExternalLink,
  Zap,
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
  selling_price: number; // Regular / Base price (1850)
  regular_price?: number; // 1850
  final_price: number;   // Selling price customer pays (1350)
  buying_price?: number; // Exact cost price (950)
  discount?: number;     // Discount amount (500)
  stock: number;
  sku?: string;
  image_url: string;
  gallery_images?: string[];
  colors?: string[];
  description?: string;
  // Automated Google SEO fields
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  slug: string;
  brand?: string;
  isValid: boolean;
  validationError?: string;
  isAutoSeoGenerated?: boolean;
}

/**
 * Advanced Google Rank SEO Keyword Generator for Bangladesh Market.
 * Automatically derives high-intent commercial keywords that real Bangladeshi users search on Google.
 */
export function generateGoogleRankKeywords(
  title: string,
  category: string,
  subCategory?: string,
  childCategory?: string,
  productType?: string,
  brand?: string,
  customKeywordsRaw?: string
): string {
  const cleanTitle = (title || '').trim();
  if (!cleanTitle) return 'online shopping bangladesh, cash on delivery bd';

  // 1. If user provided keywords in Excel, clean and preserve them!
  const userKeywords = (customKeywordsRaw || '')
    .split(/[,;\n|]/)
    .map((k) => k.trim())
    .filter(Boolean);

  // 2. Extract core short name / model from title
  // Strip out promotional marketing buzzwords
  const stripped = cleanTitle
    .replace(/\b(high quality|premium quality|best quality|top quality|100% original|original|genuine|authentic|new arrival|hot deal|best seller|exclusive|official)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = stripped.split(' ').filter(Boolean);
  // Core title is first 2-4 keywords (e.g. "T900 Ultra 2 Smartwatch" -> "T900 Ultra 2")
  const coreShortTitle = words.slice(0, Math.min(words.length, 3)).join(' ');

  // Extract model/series token if present (e.g. T900, M10, SK-03067, Ultra 2, Pro)
  const modelMatch = stripped.match(/([a-zA-Z]{1,4}[-_\s]?[0-9]{2,5}|ultra\s*[0-9]?|pro\s*[0-9]?|series\s*[0-9]?)/i);
  const modelToken = modelMatch ? modelMatch[0].trim() : '';

  const cat = (category || '').trim();
  const subCat = (subCategory || '').trim();
  const childCat = (childCategory || '').trim();
  const pType = (productType || '').trim();
  const brandName = (brand || 'Maxora').trim();

  // 3. Bangla Search Terms (গুগল বাংলাদেশে সবচেয়ে বেশি সার্চ হওয়া বাংলা কি-ওয়ার্ড)
  const banglaKeywords: string[] = [];
  const lowerTitle = cleanTitle.toLowerCase();

  if (lowerTitle.includes('watch') || lowerTitle.includes('smartwatch')) {
    banglaKeywords.push('স্মার্টওয়াচ এর দাম', 'স্মার্ট ওয়াচ প্রাইস ইন বাংলাদেশ', 'স্মার্টওয়াচ বিডি');
  } else if (lowerTitle.includes('earbud') || lowerTitle.includes('tws') || lowerTitle.includes('airpod') || lowerTitle.includes('headphone')) {
    banglaKeywords.push('ইয়ারবাডস এর দাম', 'ব্লুটুথ হেডফোন প্রাইস ইন বিডি', 'টিডব্লিউএস ইয়ারবাডস');
  } else if (lowerTitle.includes('fan')) {
    banglaKeywords.push('রিচার্জেবল ফ্যান এর দাম', 'টেবিল ফ্যান প্রাইস ইন বাংলাদেশ', 'মিনি ফ্যান');
  } else if (lowerTitle.includes('speaker')) {
    banglaKeywords.push('ব্লুটুথ স্পিকার এর দাম', 'সাউন্ড বক্স বাংলাদেশ');
  } else if (lowerTitle.includes('power bank') || lowerTitle.includes('powerbank')) {
    banglaKeywords.push('পাওয়ার ব্যাংক এর দাম', 'পাওয়ার ব্যাংক প্রাইস ইন বিডি');
  } else if (lowerTitle.includes('blender') || lowerTitle.includes('grinder')) {
    banglaKeywords.push('ব্লেন্ডার মেশিন এর দাম', 'গ্রাইন্ডার প্রাইস');
  }

  // Bangla commercial queries
  if (coreShortTitle) {
    banglaKeywords.push(`${coreShortTitle} এর দাম`, `অরিজিনাল ${coreShortTitle}`);
  }
  banglaKeywords.push('অনলাইন শপিং বাংলাদেশ', 'ক্যাশ অন ডেলিভারি বাংলাদেশ');

  // 4. Commercial Search Phrases for Google BD (High CTR & Purchase Intent)
  const commercialKeywords: string[] = [
    cleanTitle.toLowerCase(),
    coreShortTitle.toLowerCase(),
    modelToken ? modelToken.toLowerCase() : '',
    `${coreShortTitle.toLowerCase()} price in bd`,
    `${coreShortTitle.toLowerCase()} price in bangladesh`,
    modelToken ? `${modelToken.toLowerCase()} price in bd` : '',
    subCat ? `${subCat.toLowerCase()} price in bd` : '',
    subCat ? `${subCat.toLowerCase()} price in bangladesh` : '',
    childCat ? childCat.toLowerCase() : '',
    pType ? pType.toLowerCase() : '',
    `buy ${coreShortTitle.toLowerCase()} online`,
    `authentic ${coreShortTitle.toLowerCase()}`,
    `${coreShortTitle.toLowerCase()} review bd`,
    `${brandName.toLowerCase()} ${coreShortTitle.toLowerCase()}`,
    'cash on delivery bd',
    'maxora shop bd',
  ];

  // 5. Merge user-provided keywords first, followed by commercial and Bengali queries
  const merged = Array.from(
    new Set([
      ...userKeywords.map((k) => k.toLowerCase()),
      ...commercialKeywords.filter(Boolean),
      ...banglaKeywords.filter(Boolean),
    ])
  );

  return merged.slice(0, 16).join(', ');
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

  // 1. Download Simplified 10-Column Smart Excel Template (Recommended)
  const handleDownloadSimpleTemplate = () => {
    try {
      const sampleData = [
        {
          title: 'T900 Ultra 2 Smartwatch With Bluetooth Calling',
          description: 'High quality HD full touch display smartwatch with bluetooth calling, sports tracking, heart rate monitor, long battery life and waterproof build.',
          cost_price: 950,
          regular_price: 1850,
          discount_price: 1350,
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
          category: 'Smart Gadgets',
          sub_category: 'Smart Watch',
          child_category: 'Calling Watch',
          product_type: 'T900 Series',
        },
        {
          title: 'M10 TWS Wireless Gaming Earbuds With Powerbank Case',
          description: 'Stereo Hi-Fi 9D sound quality TWS with digital LED display, touch controls, low latency gaming, waterproof and emergency phone charging case.',
          cost_price: 320,
          regular_price: 950,
          discount_price: 590,
          image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
          category: 'Audio',
          sub_category: 'Wireless Earbuds',
          child_category: 'Noise Cancelling',
          product_type: 'TWS Gaming',
        },
        {
          title: 'Portable Mini High Speed USB Rechargeable Table Fan',
          description: 'Silent motor USB rechargeable desk fan with 3 adjustable speed levels and 2000mAh lithium battery for home, kitchen and travel use.',
          cost_price: 450,
          regular_price: 1200,
          discount_price: 750,
          image: 'https://images.unsplash.com/photo-1618941716939-553df3c6c278?w=800&auto=format&fit=crop&q=80',
          category: 'Home & Living',
          sub_category: 'Home Appliances',
          child_category: 'Desk Fan',
          product_type: 'Portable Fans',
        },
      ];

      const ws = XLSX.utils.json_to_sheet(sampleData);

      // Set optimal column widths
      ws['!cols'] = [
        { wch: 45 }, // title
        { wch: 55 }, // description
        { wch: 14 }, // cost_price
        { wch: 14 }, // regular_price
        { wch: 14 }, // discount_price
        { wch: 45 }, // image
        { wch: 20 }, // category
        { wch: 20 }, // sub_category
        { wch: 20 }, // child_category
        { wch: 20 }, // product_type
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Products');

      XLSX.writeFile(wb, 'Maxora_Simple_Products_Template.xlsx');
      showToast('⭐ সহজ ১০-কলামের এক্সেল টেমপ্লেট ডাউনলোড সফল হয়েছে!', 'success');
    } catch (e: any) {
      console.error(e);
      showToast('টেমপ্লেট ডাউনলোড ব্যর্থ হয়েছে', 'error');
    }
  };

  // 1b. Download Full Advanced Template (with manual SEO override columns)
  const handleDownloadAdvancedTemplate = () => {
    try {
      const advancedData = [
        {
          title: 'T900 Ultra 2 Smartwatch With Bluetooth Calling',
          description: 'HD display smartwatch with bluetooth calling, sports tracking, and waterproof build.',
          cost_price: 950,
          regular_price: 1850,
          discount_price: 1350,
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
          category: 'Smart Gadgets',
          sub_category: 'Smart Watch',
          product_type: 'T900 Series',
          child_category: 'Calling Watch',
          brand: 'Maxora',
          stock: 60,
          sku: 'MX-SW-T900U',
          meta_title: 'T900 Ultra 2 Smartwatch Price in Bangladesh | Maxora Shop',
          meta_description: 'Buy original T900 Ultra 2 Smartwatch at best price in BD with fast cash on delivery across Bangladesh.',
          meta_keywords: 't900 ultra, smartwatch bd, bluetooth calling watch, smart gadgets bd',
          slug: 't900-ultra-2-smartwatch-with-bluetooth-calling',
        },
      ];

      const ws = XLSX.utils.json_to_sheet(advancedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Advanced_Products');
      XLSX.writeFile(wb, 'Maxora_Advanced_Products_Template.xlsx');
      showToast('অ্যাডভান্সড এক্সেল টেমপ্লেট ডাউনলোড সফল হয়েছে!', 'success');
    } catch (e: any) {
      console.error(e);
      showToast('টেমপ্লেট ডাউনলোড ব্যর্থ হয়েছে', 'error');
    }
  };

  // 2. Parse Excel/CSV File with Flexible Aliases & Google SEO Generator
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
          // Normalize column names (support case-insensitive & bilingual aliases)
          const getVal = (...keys: string[]) => {
            for (const k of keys) {
              const kClean = k.trim().toLowerCase().replace(/[\s_-]+/g, '');
              for (const rowKey of Object.keys(row)) {
                const rowKeyClean = rowKey.trim().toLowerCase().replace(/[\s_-]+/g, '');
                if (rowKeyClean === kClean) {
                  return row[rowKey];
                }
              }
            }
            return '';
          };

          // 1. Title / Name (supports 'title', 'titel', 'produter titel', 'name', etc.)
          const title = String(
            getVal('title', 'titel', 'produter titel', 'produter title', 'name', 'product_name', 'product_title', 'product name', 'product title', 'item', 'item_name', 'পণ্যের নাম', 'নাম') || ''
          ).trim();

          // 2. Description
          const description = String(
            getVal('description', 'details', 'desc', 'product_description', 'বিবরণ', 'প্রোডাক্ট বিবরণ') || ''
          ).trim();

          // 3. Hierarchy: Category, Sub Category, Child Category, Product Type
          const category = String(
            getVal('category', 'catagory', 'category_name', 'catagory_name', 'cat', 'ক্যাটাগরি') || 'Smart Gadgets'
          ).trim();

          const subCategory = String(
            getVal('sub_category', 'sub_catagory', 'subcategory', 'subcatagory', 'sub category', 'sub catagory', 'sub-category', 'সাব ক্যাটাগরি') || ''
          ).trim();

          const childCategory = String(
            getVal('child_category', 'child_catagory', 'childcategory', 'childcatagory', 'child category', 'child catagory', 'চাইল্ড ক্যাটাগরি') || ''
          ).trim();

          const productType = String(
            getVal('product_type', 'type', 'product type', 'producttype', 'প্রোডাক্ট টাইপ') || ''
          ).trim();

          const brand = String(
            getVal('brand', 'brand_name', 'ব্র্যান্ড') || 'Maxora'
          ).trim();

          // 4. Exact Prices & Discounts (Never alter, fake markup, or corrupt user prices!)
          // Column 'cost_price' -> exact buying price
          // Column 'regular_price' -> base / regular price (e.g. 1850)
          // Column 'discount_price' -> final selling price customer pays (e.g. 1350)
          const costPriceRaw = getVal('cost_price', 'cost price', 'costprice', 'cost', 'buying_price', 'buying price', 'purchase_price', 'ক্রয়মূল্য', 'কেনা দাম', 'কেনা মূল্য');
          const regularPriceRaw = getVal('regular_price', 'regular price', 'regularprice', 'mrp', 'original_price', 'original price', 'old_price', 'নিয়মিত মূল্য', 'পূর্বের মূল্য', 'আসল মূল্য');
          const discountPriceRaw = getVal('discount_price', 'discount price', 'discountprice', 'selling_price', 'selling price', 'sale_price', 'offer_price', 'offer price', 'price', 'বিক্রয় মূল্য', 'ডিসকাউন্ট মূল্য', 'অফার মূল্য', 'কাস্টমার মূল্য');

          const inputCost = Math.max(0, Number(String(costPriceRaw).replace(/[^0-9.]/g, '') || 0));
          const inputRegular = Math.max(0, Number(String(regularPriceRaw).replace(/[^0-9.]/g, '') || 0));
          const inputDiscount = Math.max(0, Number(String(discountPriceRaw).replace(/[^0-9.]/g, '') || 0));

          let basePrice = 0;   // The regular / base price stored in database selling_price
          let finalPrice = 0;  // The actual selling price customer pays
          let discount = 0;    // Discount amount in ৳ stored in database discount
          const buyingPrice = inputCost; // Exact cost price (never fake 70%!)

          if (inputRegular > 0 && inputDiscount > 0) {
            if (inputRegular >= inputDiscount) {
              // Standard: Regular 1850, Discount price 1350 -> customer pays 1350, save 500
              basePrice = inputRegular;
              finalPrice = inputDiscount;
              discount = inputRegular - inputDiscount;
            } else {
              // User put smaller in regular, larger in discount price -> normalize
              basePrice = inputDiscount;
              finalPrice = inputRegular;
              discount = inputDiscount - inputRegular;
            }
          } else if (inputRegular > 0 && inputDiscount === 0) {
            // Only regular price provided: no discount
            basePrice = inputRegular;
            finalPrice = inputRegular;
            discount = 0;
          } else if (inputDiscount > 0 && inputRegular === 0) {
            // Only discount/selling price provided: keep exact price (never fake 1.25 multiplier!)
            basePrice = inputDiscount;
            finalPrice = inputDiscount;
            discount = 0;
          } else {
            basePrice = 0;
            finalPrice = 0;
            discount = 0;
          }

          // 5. Stock & Inventory
          const stockRaw = getVal('stock', 'quantity', 'qty', 'inventory', 'স্টক');
          const stock = Math.max(0, Number(String(stockRaw).replace(/[^0-9]/g, '') || 50));

          // 6. Image & Gallery Images (supports 'image', 'image link', 'immage', 'photo', etc.)
          const imageRaw = String(
            getVal('image', 'immage', 'image_url', 'image link', 'image_link', 'image link ba immage', 'img', 'photo', 'picture', 'main_image', 'ছবি', 'ইমেজ', 'ইমেজ লিংক') || ''
          ).trim();

          let imageUrl = imageRaw;
          let galleryImages: string[] = [];

          // If user provided multiple comma/line separated images in image column
          if (imageRaw.includes(',') || imageRaw.includes('\n')) {
            const splitImgs = imageRaw.split(/[,;\n]/).map((u) => u.trim()).filter(Boolean);
            imageUrl = splitImgs[0] || '';
            galleryImages = splitImgs.slice(1);
          }

          // Fallback image if empty
          if (!imageUrl) {
            imageUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
          }

          // Also check explicit gallery column
          const galleryRaw = String(getVal('gallery_images', 'gallery', 'more_images', 'images') || '').trim();
          if (galleryRaw) {
            const extraImgs = galleryRaw.split(/[,;\n]/).map((u) => u.trim()).filter(Boolean);
            galleryImages = Array.from(new Set([...galleryImages, ...extraImgs]));
          }

          // 7. Colors
          const colorsRaw = String(getVal('colors', 'color', 'variants') || '').trim();
          const colors = colorsRaw
            ? colorsRaw.split(/[,;\n]/).map((c) => c.trim()).filter(Boolean)
            : [];

          // 8. Auto SKU
          const customSku = String(getVal('sku', 'code', 'product_code') || '').trim();
          const catPrefix = category.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'ITM';
          const sku = customSku || `MX-${catPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

          // =====================================================================
          // 🚀 HIGH-PERFORMANCE GOOGLE RANKING & SEO ENGINE (AUTO-GENERATED)
          // =====================================================================
          const cleanTitle = title || `Item-${index + 1}`;

          // A. Clean SEO URL Slug
          const customSlug = String(getVal('slug', 'url_slug', 'url slug', 'url', 'স্লাগ') || '').trim();
          const cleanSlug = customSlug ? generateSlug(customSlug) : generateSlug(cleanTitle);

          // B. High-CTR Google Search Meta Title (Optimized for Bangladesh Market)
          // Format: "[Title] Price in BD ৳[FinalPrice] | Maxora BD" (Matches top Google BD search queries)
          const customMetaTitle = String(getVal('meta_title', 'seo_title', 'meta title', 'meta titel', 'মেটা টাইটেল') || '').trim();
          const autoMetaTitle = finalPrice > 0
            ? `${cleanTitle} Price in BD ৳${finalPrice.toLocaleString('en-BD')} | Maxora BD`
            : `${cleanTitle} Price in Bangladesh | 100% Original | Maxora BD`;
          const metaTitle = customMetaTitle || autoMetaTitle;

          // C. Google SERP Snippet Meta Description (150-160 characters action-oriented)
          const customMetaDesc = String(getVal('meta_description', 'seo_description', 'meta description', 'মেটা ডেসক্রিপশন') || '').trim();
          let autoMetaDescription = '';
          if (description) {
            const cleanDesc = description.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
            const descIntro = cleanDesc.slice(0, 85);
            autoMetaDescription = `${descIntro}... Buy ${cleanTitle} at best price in BD (৳${finalPrice.toLocaleString('en-BD')}) with Cash on Delivery at Maxora.`;
          } else {
            autoMetaDescription = `Buy original ${cleanTitle} at best price in Bangladesh (৳${finalPrice.toLocaleString('en-BD')}). 100% genuine quality, Cash on Delivery across 64 districts & express delivery at Maxora.`;
          }
          const metaDescription = customMetaDesc || autoMetaDescription;

          // D. Google High-Search-Intent Keywords (LSI & Target Search Phrases)
          const customKeywords = String(
            getVal(
              'product keyword',
              'product keywords',
              'product_keyword',
              'product_keywords',
              'product key word',
              'product key words',
              'keyword',
              'keywords',
              'key words',
              'key word',
              'meta_keywords',
              'meta keywords',
              'tags',
              'কিওয়ার্ড',
              'কি-ওয়ার্ড',
              'গুগল কিওয়ার্ড'
            ) || ''
          ).trim();

          const metaKeywords = generateGoogleRankKeywords(
            cleanTitle,
            category,
            subCategory,
            childCategory,
            productType,
            brand,
            customKeywords
          );

          const isAutoSeoGenerated = !customMetaTitle || !customMetaDesc || !customKeywords || !customSlug;

          // Validation
          let isValid = true;
          let validationError = '';

          if (!title) {
            isValid = false;
            validationError = 'পণ্যের নাম নেই (Product title is required)';
          } else if (finalPrice <= 0) {
            isValid = false;
            validationError = 'সঠিক বিক্রয় মূল্য দিন (Invalid price)';
          }

          return {
            name: cleanTitle,
            category,
            sub_category: subCategory,
            product_type: productType,
            child_category: childCategory,
            selling_price: basePrice, // Regular / Base price (1850)
            regular_price: basePrice, // 1850
            final_price: finalPrice,  // Customer price (1350)
            buying_price: buyingPrice, // Cost price (950)
            discount,                  // Discount amount (500)
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
            isAutoSeoGenerated,
          };
        });

        setParsedProducts(parsed);
        showToast(`🎉 ${parsed.length}টি প্রোডাক্ট এক্সেল থেকে সফলভাবে লোড হয়েছে! গুগল এসইও অটো-জেনারেট সম্পন্ন।`, 'success');
      } catch (err: any) {
        console.error(err);
        showToast('ফাইল রিড করতে সমস্যা হয়েছে: ' + (err.message || 'Unknown format'), 'error');
      } finally {
        setIsProcessingFile(false);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  // 3. Confirm & Execute Bulk Import to Firestore & Database
  const handleExecuteImport = async () => {
    const validOnes = parsedProducts.filter((p) => p.isValid);
    if (validOnes.length === 0) {
      showToast('আপলোড করার মতো কোনো ভ্যালিড প্রোডাক্ট পাওয়া যায়নি!', 'error');
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: validOnes.length });

    const effectivePass = adminPassword || (typeof window !== 'undefined' ? (sessionStorage.getItem('maxora_admin_token') || sessionStorage.getItem('maxora_admin_password') || localStorage.getItem('maxora_admin_password')) : null) || undefined;
    const storefrontBase = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://maxorashop.com';

    // Map existing categories and auto-create any new categories mentioned in the Excel file
    const knownCatMap = new Map<string, Category>();
    (categories || []).forEach((c) => {
      if (c.name) knownCatMap.set(c.name.toLowerCase().trim(), c);
      if (c.slug) knownCatMap.set(c.slug.toLowerCase().trim(), c);
    });

    for (const p of validOnes) {
      const rawCat = (p.category || 'Smart Gadgets').trim();
      const catKey = rawCat.toLowerCase();
      if (!knownCatMap.has(catKey)) {
        try {
          const newSlug = generateSlug(rawCat);
          const catRes = await storeService.saveCategory(
            {
              name: rawCat,
              slug: newSlug,
              display_order: knownCatMap.size + 1,
              active: 1,
            },
            effectivePass
          );
          if (catRes.success && catRes.category) {
            knownCatMap.set(catKey, catRes.category);
            knownCatMap.set(catRes.category.slug.toLowerCase(), catRes.category);
          }
        } catch (catErr) {
          console.warn('Auto create category notice:', catErr);
        }
      }
    }

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < validOnes.length; i++) {
      const p = validOnes[i];
      try {
        const rawCat = (p.category || 'Smart Gadgets').trim();
        const matchedCat = knownCatMap.get(rawCat.toLowerCase());
        const catId = matchedCat?.id || `cat-${generateSlug(rawCat)}`;
        const catSlug = matchedCat?.slug || generateSlug(rawCat);

        const subCatName = (p.sub_category || '').trim();
        const subCatSlug = subCatName ? generateSlug(subCatName) : '';
        const subCatId = subCatSlug ? `sub-${subCatSlug}` : '';

        const typeName = (p.product_type || '').trim();
        const typeSlug = typeName ? generateSlug(typeName) : '';
        const typeId = typeSlug ? `pt-${typeSlug}` : '';

        const childName = (p.child_category || '').trim();
        const childSlug = childName ? generateSlug(childName) : '';
        const childId = childSlug ? `child-${childSlug}` : '';

        const brandName = (p.brand || 'Maxora').trim();
        const brandSlug = generateSlug(brandName);

        const cleanSlug = p.slug ? generateSlug(p.slug) : generateSlug(p.name || `prod-${Date.now().toString(36)}-${i}`);

        const productPayload: Partial<Product> = {
          name: p.name,
          category: rawCat,
          category_id: catId,
          category_slug: catSlug,
          sub_category: subCatName,
          subcategory_id: subCatId,
          subcategory_slug: subCatSlug,
          product_type: typeName,
          product_type_id: typeId,
          product_type_slug: typeSlug,
          child_category: childName,
          child_category_id: childId,
          child_category_slug: childSlug,
          brand: brandName,
          brand_slug: brandSlug,
          selling_price: p.selling_price,
          regular_price: p.regular_price || p.selling_price,
          discount: p.discount || 0,
          final_price: p.final_price,
          buying_price: p.buying_price || 0,
          stock: p.stock,
          sku: p.sku,
          image_url: p.image_url,
          images: p.gallery_images && p.gallery_images.length > 0 ? [p.image_url, ...p.gallery_images] : [p.image_url],
          colors: (p.colors || []).map((c) => ({ name: c, code: '#18181b', stock: Math.floor(p.stock / (p.colors?.length || 1)) })),
          description: p.description || '',
          slug: cleanSlug,
          product_link: `${storefrontBase}/product/${cleanSlug}`,
          meta_title: p.meta_title,
          meta_description: p.meta_description,
          meta_keywords: p.meta_keywords,
          featured: 0,
          active: 1,
        };

        const result = await storeService.addProduct(productPayload, effectivePass);
        if (result.success) {
          successCount++;
        }
      } catch (err: any) {
        errors.push(`${p.name}: ${err?.message || 'Failed'}`);
      }

      setImportProgress({ current: i + 1, total: validOnes.length });
    }

    setIsImporting(false);

    // Dispatch global events so storefront & admin immediately re-render category collections
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('maxora_categories_updated'));
      window.dispatchEvent(new CustomEvent('maxora_products_updated'));
    }

    if (successCount > 0) {
      showToast(`🎉 অভিনন্দন! ${successCount}টি প্রোডাক্ট সফলভাবে আপলোড হয়েছে এবং গুগলের জন্য অটো এসইও কনফিগার করা হয়েছে!`, 'success');
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
                <span>Excel Bulk Product Import</span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Auto Google Rank SEO
                </span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                শুধু টাইটেল, দাম, ছবি ও ক্যাটাগরি লিখুন — বাকি Google SEO, মেটা টাইটেল ও URL অটো জেনারেট হবে!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Simple 10-Col Template (Recommended) */}
            <button
              type="button"
              onClick={handleDownloadSimpleTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-black shadow-xs transition-all cursor-pointer"
              title="সহজ ১০-কলামের এক্সেল টেমপ্লেট ডাউনলোড করুন"
            >
              <Download className="w-3.5 h-3.5" />
              <span>সহজ টেমপ্লেট (১০ কলাম)</span>
            </button>

            {/* Advanced Template */}
            <button
              type="button"
              onClick={handleDownloadAdvancedTemplate}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-100 text-xs font-bold transition-all cursor-pointer"
              title="অ্যাডভান্সড এক্সেল টেমপ্লেট ডাউনলোড করুন"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span>অ্যাডভান্সড টেমপ্লেট</span>
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
          {/* Smart SEO & Google Ranking Banner */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-2xl p-4 text-xs text-zinc-900 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Zap className="w-4 h-4" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-black text-sm text-emerald-950 flex items-center gap-1.5">
                    <span>🚀 গুগল র‍্যাঙ্কিং অটোমেটিক সিস্টেম (Google Rank Engine)</span>
                  </p>
                  <span className="text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Zero Manual SEO Effort
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  আপনাকে আর কষ্ট করে মেটা টাইটেল, কি-ওয়ার্ড বা স্লাগ লিখতে হবে না! এক্সেলে শুধু নিচের <strong>১০টি তথ্য</strong> দেবেন:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1 font-mono text-[11px]">
                  <span className="bg-white/80 p-1.5 rounded-lg border border-emerald-200 text-emerald-900">1. title</span>
                  <span className="bg-white/80 p-1.5 rounded-lg border border-emerald-200 text-emerald-900">2. description</span>
                  <span className="bg-white/80 p-1.5 rounded-lg border border-emerald-200 text-emerald-900">3. cost_price</span>
                  <span className="bg-white/80 p-1.5 rounded-lg border border-emerald-200 text-emerald-900">4. regular_price</span>
                  <span className="bg-white/80 p-1.5 rounded-lg border border-emerald-200 text-emerald-900">5. discount_price</span>
                  <span className="bg-white/80 p-1.5 rounded-lg border border-emerald-200 text-emerald-900">6. image</span>
                  <span className="bg-white/80 p-1.5 rounded-lg border border-emerald-200 text-emerald-900">7. category</span>
                  <span className="bg-white/80 p-1.5 rounded-lg border border-emerald-200 text-emerald-900">8. sub_category</span>
                  <span className="bg-white/80 p-1.5 rounded-lg border border-emerald-200 text-emerald-900">9. child_category</span>
                  <span className="bg-white/80 p-1.5 rounded-lg border border-emerald-200 text-emerald-900">10. product_type</span>
                </div>
                <div className="text-[11px] text-zinc-600 pt-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      <strong>সিস্টেম অটো করবে:</strong> SEO URL Slug, হাই-র‍্যাঙ্কিং Google Keywords (মডেল + Price in BD + বাংলা সার্চ কি-ওয়ার্ড), Google SERP Snippet এবং ক্যাটাগরি লিঙ্কিং।
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-100/60 p-2 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>
                      <strong>দামের সঠিক নিয়ম:</strong> <code>regular_price</code> হলো মূল দাম (যেমন: ১৮৫০) এবং <code>discount_price</code> হলো কাস্টমার বিক্রয় মূল্য (যেমন: ১৩৫০)। কোনো ছাড় না থাকলে শুধু <code>regular_price</code> লিখুন। সিস্টেম আপনার দেওয়া দামের কোনো পরিবর্তন করবে না!
                    </span>
                  </div>
                </div>
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
                এক্সেল (.xlsx, .xls) বা সিএসভি (.csv) ফাইল এখানে ড্রপ করুন
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-md">
                ১০টি সাধারণ কলাম সহ আপনার এক্সেল ফাইলটি আপলোড করলেই স্বয়ংক্রিয়ভাবে গুগল র‍্যাঙ্কিং প্রিভিউ তৈরি হবে।
              </p>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadSimpleTemplate();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold text-xs shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>নমুনা এক্সেল ডাউনলোড করুন</span>
                </button>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>ফাইল ব্রাউজ করুন</span>
                </div>
              </div>
            </div>
          )}

          {/* Loading File Indicator */}
          {isProcessingFile && (
            <div className="p-8 text-center bg-zinc-50 rounded-2xl border border-zinc-200">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-zinc-800">
                এক্সেল ফাইল প্রসেস ও গুগল এসইও (Google Rank SEO) অটো-জেনারেট করা হচ্ছে...
              </p>
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
                      {(file.size / 1024).toFixed(1)} KB • {parsedProducts.length}টি প্রোডাক্ট প্রসেস সম্পন্ন
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{validCount} প্রস্তুত</span>
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
                    নতুন ফাইল
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
                    পণ্য ও মূল্য তালিকা ({parsedProducts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('seo')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'seo'
                        ? 'bg-white text-zinc-950 shadow-xs font-black'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    <span>🔍 গুগল সার্চ প্রিভিউ (Google Rank Preview)</span>
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

              {/* Table / Preview Area */}
              {activeTab === 'preview' ? (
                /* Tab 1: Product Specs & Pricing Table */
                <div className="border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto max-h-[380px]">
                    <table className="w-full text-left text-xs text-zinc-600">
                      <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-800 font-extrabold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                        <tr>
                          <th className="p-3 w-12 text-center">#</th>
                          <th className="p-3">প্রোডাক্ট ও ছবি</th>
                          <th className="p-3">ক্যাটাগরি হায়ারার্কি</th>
                          <th className="p-3 text-right">বিক্রয় মূল্য (Customer Price)</th>
                          <th className="p-3 text-right">রেগুলার মূল্য (MRP)</th>
                          <th className="p-3 text-right">ছাড় (Discount)</th>
                          <th className="p-3 text-right">ক্রয়মূল্য (Cost)</th>
                          <th className="p-3 text-center">স্টক</th>
                          <th className="p-3">SKU</th>
                          <th className="p-3 text-center">স্ট্যাটাস</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 bg-white font-medium">
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
                                  {item.description && (
                                    <p className="text-[10px] text-zinc-400 truncate">
                                      {item.description}
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
                                  ↳ {item.sub_category} {item.product_type ? `> ${item.product_type}` : ''}
                                </span>
                              )}
                            </td>

                            <td className="p-3 text-right font-black text-emerald-700 whitespace-nowrap text-sm">
                              ৳{item.final_price.toLocaleString('en-BD')}
                            </td>

                            <td className="p-3 text-right text-zinc-500 font-semibold whitespace-nowrap">
                              ৳{item.selling_price.toLocaleString('en-BD')}
                            </td>

                            <td className="p-3 text-right whitespace-nowrap">
                              {item.discount && item.discount > 0 ? (
                                <span className="inline-block bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                  -৳{item.discount.toLocaleString('en-BD')}
                                </span>
                              ) : (
                                <span className="text-zinc-400 text-xs">—</span>
                              )}
                            </td>

                            <td className="p-3 text-right text-zinc-600 whitespace-nowrap font-medium">
                              {item.buying_price && item.buying_price > 0 ? `৳${item.buying_price.toLocaleString('en-BD')}` : '—'}
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Tab 2: Google SERP Ranking Simulator (Interactive Snippet Preview) */
                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                  <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-2xl text-xs text-blue-950 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span className="font-bold">
                        গুগল সার্চে আপনার প্রোডাক্ট ঠিক যেভাবে দেখতে পাবেন (Google Desktop & Mobile SERP Snippet)
                      </span>
                    </div>
                    <span className="text-[11px] font-extrabold text-blue-800 bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                      Auto SEO Engine Active
                    </span>
                  </div>

                  {filteredPreview.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-2xs space-y-2 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-400">
                          #{idx + 1} • {item.category} {item.sub_category ? `› ${item.sub_category}` : ''}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>Google Rank Optimized</span>
                        </span>
                      </div>

                      {/* Google Search Mockup Snippet */}
                      <div className="bg-zinc-50/70 p-3.5 rounded-xl border border-zinc-200/80 space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#202124]">
                          <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-[9px]">
                            M
                          </div>
                          <span className="font-semibold text-zinc-800">Maxora BD</span>
                          <span className="text-zinc-400">›</span>
                          <span className="text-zinc-500 font-mono text-[10px] truncate">
                            product › {item.slug}
                          </span>
                        </div>

                        {/* Blue Google Result Link */}
                        <h4 className="text-sm font-semibold text-[#1a0dab] hover:underline cursor-pointer leading-snug">
                          {item.meta_title}
                        </h4>

                        {/* Snippet Description */}
                        <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-2">
                          {item.meta_description}
                        </p>
                      </div>

                      {/* Keywords Badges */}
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <span className="text-[10px] font-bold text-zinc-400 mr-1">গুগল সার্চ ট্যাগ:</span>
                        {item.meta_keywords.split(',').slice(0, 6).map((kw, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-medium border border-zinc-200"
                          >
                            #{kw.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                মোট <strong className="text-zinc-900 font-bold">{validCount}টি</strong> প্রোডাক্ট প্রস্তুত (Auto SEO Ready)
              </span>
            ) : (
              <span>১০টি সাধারণ কলাম সহ এক্সেল ফাইল আপলোড করুন</span>
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
