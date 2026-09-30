import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Palette,
  Highlighter,
  RotateCcw,
  RotateCw,
  Maximize2,
  Minimize2,
  Code,
  Eye,
  Eraser,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Flame,
  Zap,
  Star,
  Diamond,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Minus,
  Layers,
  X,
  Plus,
  HelpCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { sanitizeSafeHtml } from '../utils/sanitizeHtml';
import { compressImageToBlob, uploadProductImageToStorage } from '../utils/imageStorage';

export interface RichTextDescriptionEditorProps {
  value: string;
  onChange: (html: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  productId?: string;
  existingImages?: string[];
}

// Curated high-converting bold colors for product hooks & highlights
const BOLD_TEXT_COLORS = [
  { label: 'Dark Charcoal', value: '#18181b', bg: 'bg-zinc-900', text: 'text-zinc-900' },
  { label: 'Hot Crimson Red', value: '#dc2626', bg: 'bg-red-600', text: 'text-red-600' },
  { label: 'Emerald Green', value: '#059669', bg: 'bg-emerald-600', text: 'text-emerald-600' },
  { label: 'Electric Blue', value: '#2563eb', bg: 'bg-blue-600', text: 'text-blue-600' },
  { label: 'Royal Violet', value: '#7c3aed', bg: 'bg-purple-600', text: 'text-purple-600' },
  { label: 'Sunset Amber', value: '#d97706', bg: 'bg-amber-600', text: 'text-amber-600' },
  { label: 'Vivid Rose', value: '#db2777', bg: 'bg-pink-600', text: 'text-pink-600' },
  { label: 'Deep Cyan', value: '#0891b2', bg: 'bg-cyan-600', text: 'text-cyan-600' },
];

// Highlight background tints
const HIGHLIGHT_COLORS = [
  { label: 'None', value: 'transparent', bg: 'bg-transparent border border-zinc-300' },
  { label: 'Soft Yellow', value: '#fef08a', bg: 'bg-yellow-200' },
  { label: 'Soft Green', value: '#bbf7d0', bg: 'bg-green-200' },
  { label: 'Soft Blue', value: '#bfdbfe', bg: 'bg-blue-200' },
  { label: 'Soft Pink', value: '#fbcfe8', bg: 'bg-pink-200' },
  { label: 'Soft Orange', value: '#fed7aa', bg: 'bg-orange-200' },
  { label: 'Soft Purple', value: '#e9d5ff', bg: 'bg-purple-200' },
];

// Predefined high-converting hook callouts
const PRESET_HOOKS = [
  {
    id: 'hot-offer',
    title: 'স্পেশাল অফার ও হট ডিল',
    badge: '🔥 HOT OFFER',
    icon: '🔥',
    borderColor: '#dc2626',
    bgColor: '#fef2f2',
    textColor: '#dc2626',
    bodyColor: '#7f1d1d',
    defaultTitle: '🔥 স্পেশাল অফার ও সীমিত সময়ের হট ডিল!',
    defaultBody: 'আজই অর্ডার করুন এবং বিশেষ ডিসকাউন্ট মূল্যে আপনার পছন্দের পণ্যটি বুঝে নিন। স্টক সীমিত!',
  },
  {
    id: 'original-quality',
    title: '১০০% অরিজিনাল ও অথেনটিক',
    badge: '⭐ 100% ORIGINAL',
    icon: '⭐',
    borderColor: '#059669',
    bgColor: '#ecfdf5',
    textColor: '#059669',
    bodyColor: '#065f46',
    defaultTitle: '⭐ ১০০% আসল ও প্রিমিয়াম কোয়ালিটি নিশ্চিত',
    defaultBody: 'আমরা সরাসরি অফিশিয়াল সোর্স থেকে সংগৃহীত সেরা মানের অরিজিনাল পণ্য সরবরাহ করি। কোনো নকল বা কপি নেই।',
  },
  {
    id: 'super-speed',
    title: 'হাই পারফরম্যান্স ও সুপার পাওয়ার',
    badge: '⚡ FAST SPEED',
    icon: '⚡',
    borderColor: '#2563eb',
    bgColor: '#eff6ff',
    textColor: '#2563eb',
    bodyColor: '#1e40af',
    defaultTitle: '⚡ সুপার ফাস্ট কার্যক্ষমতা ও লং-লাস্টিং পারফরম্যান্স',
    defaultBody: 'আধুনিক প্রযুক্তিতে তৈরি দীর্ঘস্থায়ী ও নির্ভরযোগ্য পারফরম্যান্স যা আপনার দৈনন্দিন ব্যবহারে অসাধারণ স্বাচ্ছন্দ্য দিবে।',
  },
  {
    id: 'official-warranty',
    title: 'ওয়ারেন্টি ও রিপ্লেসমেন্ট গ্যারান্টি',
    badge: '🛡️ WARRANTY',
    icon: '🛡️',
    borderColor: '#d97706',
    bgColor: '#fffbeb',
    textColor: '#b45309',
    bodyColor: '#78350f',
    defaultTitle: '🛡️ অফিসিয়াল সার্ভিস ওয়ারেন্টি ও দ্রুত রিপ্লেসমেন্ট পলিসি',
    defaultBody: 'পণ্য হাতে পেয়ে চেক করে নেওয়ার সুবিধা এবং যেকোনো অনাকাঙ্ক্ষিত সমস্যায় সার্বক্ষণিক কাস্টমার সাপোর্ট।',
  },
  {
    id: 'exclusive-features',
    title: 'প্রিমিয়াম ডিজাইন ও এক্সক্লুসিভ লুক',
    badge: '💎 PREMIUM LUXURY',
    icon: '💎',
    borderColor: '#7c3aed',
    bgColor: '#faf5ff',
    textColor: '#7c3aed',
    bodyColor: '#581c87',
    defaultTitle: '💎 এক্সক্লুসিভ লাক্সারি ডিজাইন ও প্রিমিয়াম ফিনিশিং',
    defaultBody: 'অভিজাত ফিনিশিং ও শক্তিশালী বিল্ড কোয়ালিটি যা সহজেই নজর কাড়বে এবং দীর্ঘস্থায়ী ব্যবহার নিশ্চিত করবে।',
  },
  {
    id: 'cash-on-delivery',
    title: 'ক্যাশ অন ডেলিভারি ও দ্রুত শিপিং',
    badge: '🚚 FAST DELIVERY',
    icon: '🚚',
    borderColor: '#16a34a',
    bgColor: '#f0fdf4',
    textColor: '#15803d',
    bodyColor: '#14532d',
    defaultTitle: '🚚 সারাদেশে দ্রুত হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি সুবিধা',
    defaultBody: 'পণ্য দেখে ও বুঝে মূল্য পরিশোধ করার পূর্ণ নিশ্চয়তা। কোনো প্রকার অগ্রিম পেমেন্টের ঝুঁকি নেই।',
  },
];

export const RichTextDescriptionEditor: React.FC<RichTextDescriptionEditorProps> = ({
  value,
  onChange,
  label = 'Product Description (পণ্যের বিস্তারিত বিবরণ ও স্পেসিফিকেশন)',
  placeholder = 'পণ্যটির আকর্ষণীয় বিবরণ, মূল হুক ও স্পেসিফিকেশন লিখুন...',
  className = '',
  productId,
  existingImages = [],
}) => {
  const [editorMode, setEditorMode] = useState<'visual' | 'html' | 'preview'>('visual');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Pickers & Modals
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showHookMenu, setShowHookMenu] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Custom colors
  const [customColor, setCustomColor] = useState('#dc2626');
  const [customHighlight, setCustomHighlight] = useState('#fef08a');

  // Image Modal state
  const [imageModalTab, setImageModalTab] = useState<'upload' | 'existing' | 'url'>('upload');
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [imageWidth, setImageWidth] = useState<'100%' | '80%' | '60%' | '40%'>('100%');
  const [imageAlignment, setImageAlignment] = useState<'center' | 'left' | 'right'>('center');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Custom Hook Builder state
  const [showCustomHookModal, setShowCustomHookModal] = useState(false);
  const [customHookEmoji, setCustomHookEmoji] = useState('🔥');
  const [customHookTitle, setCustomHookTitle] = useState('');
  const [customHookBody, setCustomHookBody] = useState('');
  const [customHookColor, setCustomHookColor] = useState('#dc2626');

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastHtmlRef = useRef<string>(value || '');

  // Convert plain text with newlines to HTML if needed
  const formatInitialHtml = useCallback((raw: string) => {
    if (!raw) return '';
    if (!/<[a-z][\s\S]*>/i.test(raw)) {
      return raw
        .split(/\r?\n\r?\n/)
        .map((para) => `<p>${para.replace(/\r?\n/g, '<br>')}</p>`)
        .join('');
    }
    return raw;
  }, []);

  // Sync value from outside if changed externally
  useEffect(() => {
    if (editorRef.current && editorMode === 'visual') {
      const currentInner = editorRef.current.innerHTML;
      const formatted = formatInitialHtml(value || '');
      if (formatted !== currentInner && value !== lastHtmlRef.current) {
        editorRef.current.innerHTML = formatted;
        lastHtmlRef.current = value;
      }
    }
  }, [value, editorMode, formatInitialHtml]);

  // Handle content change in visual editor
  const handleVisualInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      lastHtmlRef.current = html;
      onChange(html);
    }
  };

  // Helper to execute document commands safely
  const execCmd = (cmd: string, val: string | undefined = undefined) => {
    if (editorMode !== 'visual') return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(cmd, false, val);
    handleVisualInput();
  };

  // Insert arbitrary HTML at cursor or append
  const insertHtmlAtCursor = (htmlToInsert: string) => {
    if (editorMode === 'html') {
      onChange((value || '') + '\n' + htmlToInsert);
      return;
    }

    if (!editorRef.current) return;
    editorRef.current.focus();

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        const tempEl = document.createElement('div');
        tempEl.innerHTML = htmlToInsert;
        const frag = document.createDocumentFragment();
        let node: Node | null;
        let lastNode: Node | null = null;
        while ((node = tempEl.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        range.insertNode(frag);
        if (lastNode) {
          range.setStartAfter(lastNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
        handleVisualInput();
        return;
      }
    }

    // Fallback: append to bottom of editor
    editorRef.current.insertAdjacentHTML('beforeend', htmlToInsert);
    handleVisualInput();
  };

  // Format block (H2, H3, P)
  const handleFormatBlock = (tag: string) => {
    execCmd('formatBlock', tag);
  };

  // Apply bold color directly to selected text (or prompt)
  const applyBoldColor = (color: string) => {
    execCmd('bold');
    execCmd('foreColor', color);
    setShowTextColorPicker(false);
  };

  // Apply highlight background color
  const applyHighlight = (color: string) => {
    if (color === 'transparent') {
      execCmd('removeFormat');
    } else {
      try {
        if (!document.execCommand('hiliteColor', false, color)) {
          document.execCommand('backColor', false, color);
        }
      } catch {
        document.execCommand('backColor', false, color);
      }
    }
    handleVisualInput();
    setShowHighlightPicker(false);
  };

  // Insert a ready-made preset hook callout box
  const insertPresetHook = (hookId: string) => {
    const hook = PRESET_HOOKS.find((h) => h.id === hookId);
    if (!hook) return;

    const hookHtml = `
<div style="background-color: ${hook.bgColor}; border-left: 4px solid ${hook.borderColor}; border-radius: 14px; padding: 14px 18px; margin: 16px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
  <div style="color: ${hook.textColor}; font-weight: 800; font-size: 15px; margin-bottom: 5px; display: flex; align-items: center; gap: 8px;">
    <span>${hook.icon}</span>
    <span>${hook.defaultTitle}</span>
  </div>
  <div style="color: ${hook.bodyColor}; font-size: 13px; line-height: 1.7; font-weight: 500;">
    ${hook.defaultBody}
  </div>
</div>
<p><br></p>
    `.trim();

    insertHtmlAtCursor(hookHtml);
    setShowHookMenu(false);
  };

  // Insert custom built hook
  const handleInsertCustomHook = () => {
    if (!customHookTitle.trim()) return;

    // Soft background based on color
    const hookHtml = `
<div style="background-color: #fafafa; border-left: 4px solid ${customHookColor}; border-radius: 14px; padding: 14px 18px; margin: 16px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
  <div style="color: ${customHookColor}; font-weight: 800; font-size: 15px; margin-bottom: 5px; display: flex; align-items: center; gap: 8px;">
    <span>${customHookEmoji || '🔥'}</span>
    <span>${customHookTitle.trim()}</span>
  </div>
  ${
    customHookBody.trim()
      ? `<div style="color: #27272a; font-size: 13px; line-height: 1.7; font-weight: 500;">${customHookBody.trim()}</div>`
      : ''
  }
</div>
<p><br></p>
    `.trim();

    insertHtmlAtCursor(hookHtml);
    setShowCustomHookModal(false);
    setCustomHookTitle('');
    setCustomHookBody('');
  };

  // Insert image into description
  const handleInsertImage = () => {
    if (!selectedImageUrl.trim()) {
      setUploadError('অনুগ্রহ করে একটি ছবি নির্বাচন করুন বা ইমেজ লিঙ্ক দিন');
      return;
    }

    const alignmentStyle =
      imageAlignment === 'center'
        ? 'margin: 18px auto; text-align: center;'
        : imageAlignment === 'left'
        ? 'margin: 14px 18px 14px 0; float: left;'
        : 'margin: 14px 0 14px 18px; float: right;';

    const imageHtml = `
<figure style="${alignmentStyle} max-width: 100%; display: block; clear: both;">
  <img src="${selectedImageUrl.trim()}" alt="${
      imageCaption.trim() || 'Product feature image'
    }" style="max-width: ${imageWidth}; width: ${imageWidth}; height: auto; border-radius: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.07); display: inline-block; object-fit: cover;" />
  ${
    imageCaption.trim()
      ? `<figcaption style="text-align: center; font-size: 12px; color: #71717a; margin-top: 8px; font-weight: 600;">${imageCaption.trim()}</figcaption>`
      : ''
  }
</figure>
<p><br></p>
    `.trim();

    insertHtmlAtCursor(imageHtml);
    setShowImageModal(false);
    setSelectedImageUrl('');
    setImageCaption('');
    setUploadError(null);
  };

  // Handle local file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setUploadError(null);

    try {
      if (productId) {
        // Full storage or server upload
        const uploadedUrl = await uploadProductImageToStorage(file, productId, {
          customName: `desc-img-${Date.now()}`,
        });
        setSelectedImageUrl(uploadedUrl);
      } else {
        // Fast in-browser WebP compression with fallback Data URL
        const compressed = await compressImageToBlob(file, 1200, 1200, 0.85);
        setSelectedImageUrl(compressed.dataUrl);
      }
    } catch (err: any) {
      console.error('Image compression/upload failed:', err);
      // Fallback to FileReader Data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImageUrl(event.target?.result as string);
        setIsUploadingImage(false);
      };
      reader.onerror = () => {
        setUploadError('ছবি আপলোড করা সম্ভব হয়নি। অন্য একটি ছবি চেষ্টা করুন।');
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
      return;
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Ready-made layouts
  const insertLayoutTemplate = (type: 'complete' | 'features' | 'tech') => {
    let tpl = '';
    if (type === 'complete') {
      tpl = `
<div style="background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 14px; padding: 14px 18px; margin: 16px 0;">
  <div style="color: #dc2626; font-weight: 800; font-size: 16px; margin-bottom: 4px;">
    🔥 স্পেশাল অফার ও ১০০% অরিজিনাল পণ্য গ্যারান্টি!
  </div>
  <div style="color: #7f1d1d; font-size: 13px; line-height: 1.6;">
    সেরা কোয়ালিটি এবং সরাসরি অথেনটিক ব্র্যান্ডের নিশ্চয়তা। আজই অর্ডার করুন বিশেষ ডিসকাউন্টে।
  </div>
</div>

<h3 style="color: #18181b; font-weight: 800; font-size: 18px; margin: 18px 0 8px 0;">পণ্য পরিচিতি (Overview)</h3>
<p>এই পণ্যটি আধুনিক ডিজাইন ও প্রিমিয়াম কোয়ালিটির উপাদানে তৈরি। দৈনন্দিন ব্যবহারে এটি অত্যন্ত দীর্ঘস্থায়ী, টেকসই এবং কার্যক্ষম। এর স্মার্ট ফিনিশিং আপনার ব্যক্তিত্বকে আরও উজ্জ্বল করবে।</p>

<h3 style="color: #059669; font-weight: 800; font-size: 17px; margin: 18px 0 8px 0;">মূল আকর্ষণ ও বিশেষ বৈশিষ্ট্যসমূহ</h3>
<ul>
  <li><strong style="color: #dc2626;">প্রিমিয়াম বিল্ড:</strong> টেকসই মেটেরিয়াল এবং প্রিমিয়াম লুক।</li>
  <li><strong style="color: #059669;">উন্নত পারফরম্যান্স:</strong> দ্রুত কার্যকর এবং ঝামেলাহীন ব্যবহার।</li>
  <li><strong style="color: #2563eb;">সহজ পরিচালনা:</strong> যে কেউ খুব সহজে ব্যবহার করতে পারবেন।</li>
  <li><strong style="color: #7c3aed;">লং-লাস্টিং ডিউরেবিলিটি:</strong> দীর্ঘমেয়াদী ব্যবহারের জন্য নির্ভরযোগ্য।</li>
</ul>

<h3 style="color: #2563eb; font-weight: 800; font-size: 17px; margin: 18px 0 8px 0;">টেকনিক্যাল স্পেসিফিকেশন (Specifications)</h3>
<p><strong>মডেল:</strong> অফিসিয়াল এডিশন<br><strong>কালার অপশন:</strong> ব্ল্যাক / হোয়াইট / সিলভার<br><strong>ওয়ারেন্টি:</strong> অফিসিয়াল সার্ভিস ও রিপ্লেসমেন্ট সাপোর্ট</p>

<div style="background-color: #ecfdf5; border-left: 4px solid #059669; border-radius: 14px; padding: 14px 18px; margin: 16px 0;">
  <div style="color: #059669; font-weight: 800; font-size: 15px; margin-bottom: 4px;">
    🚚 ক্যাশ অন ডেলিভারি ও ওয়ারেন্টি পলিসি
  </div>
  <div style="color: #065f46; font-size: 13px; line-height: 1.6;">
    পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধ করার সুবিধা। যেকোনো সমস্যায় দ্রুত কাস্টমার কেয়ার সার্ভিস।
  </div>
</div>
      `.trim();
    } else if (type === 'features') {
      tpl = `
<div style="background-color: #faf5ff; border-left: 4px solid #7c3aed; border-radius: 14px; padding: 14px 18px; margin: 16px 0;">
  <div style="color: #7c3aed; font-weight: 800; font-size: 16px; margin-bottom: 4px;">
    💎 কেন এই পণ্যটি অন্যদের চেয়ে সেরা?
  </div>
  <div style="color: #581c87; font-size: 13px; line-height: 1.6;">
    বাজারে প্রচলিত সাধারণ পণ্যের তুলনায় এটি অনেক বেশি শক্তিশালী, আকর্ষণীয় এবং দীর্ঘস্থায়ী।
  </div>
</div>

<h3 style="color: #dc2626; font-weight: 800; font-size: 17px;">প্রধান হাইলাইটস (Key Highlights):</h3>
<ul>
  <li><strong style="color: #dc2626;">হাই স্পিড পারফরম্যান্স:</strong> কোনো ল্যাগ বা সমস্যা ছাড়া নির্বিঘ্ন সেবা।</li>
  <li><strong style="color: #059669;">১০০% অথেনটিক কোয়ালিটি:</strong> আসল পণ্যের গ্যারান্টি।</li>
  <li><strong style="color: #2563eb;">সুপার ফাস্ট হোম ডেলিভারি:</strong> দ্রুততম সময়ে আপনার ঠিকানায় পৌঁছাবে।</li>
</ul>
      `.trim();
    } else {
      tpl = `
<h3 style="color: #2563eb; font-weight: 800; font-size: 18px; margin: 16px 0 8px 0;">টেকনিক্যাল স্পেসিফিকেশন ও ফিচার তালিকা</h3>
<p><strong>প্রোডাক্ট ক্যাটাগরি:</strong> প্রিমিয়াম গ্যাজেট / এক্সেসরিজ<br>
<strong>কানেক্টিভিটি:</strong> আধুনিক ফাস্ট কানেকশন<br>
<strong>ব্যাটারি লাইফ / ব্যাকআপ:</strong> দীর্ঘস্থায়ী ব্যাকআপ সাপোর্ট<br>
<strong>বক্সে যা যা থাকছে:</strong> মূল পণ্য, ইউজার ম্যানুয়াল, ক্যাবল এবং ওয়ারেন্টি কার্ড</p>
      `.trim();
    }

    insertHtmlAtCursor(tpl);
    setShowTemplateMenu(false);
  };

  // Word and character counts & embedded images count
  const plainText = (value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const charCount = plainText.length;
  const embeddedImagesCount = ((value || '').match(/<img\b[^>]*>/gi) || []).length;

  return (
    <div
      className={`space-y-2 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-white p-4 sm:p-6 flex flex-col justify-between overflow-hidden shadow-2xl'
          : 'relative'
      } ${className}`}
    >
      {/* 1. TOP HEADER & PRIMARY ACTION CONTROLS */}
      <div className="flex items-center justify-between gap-2.5 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs sm:text-sm font-black text-zinc-800 flex items-center gap-1.5">
            <span>{label}</span>
          </label>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>প্রিমিয়াম হুক ও ইমেজ এডিটর</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Hook Presets Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowHookMenu(!showHookMenu);
                setShowTemplateMenu(false);
                setShowTextColorPicker(false);
                setShowHighlightPicker(false);
              }}
              className="flex items-center gap-1.5 text-xs font-black text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-200 transition-all shadow-2xs cursor-pointer active:scale-95"
              title="বোল্ড কালার হুক যুক্ত করুন"
            >
              <Flame className="w-3.5 h-3.5 text-red-600 fill-red-500" />
              <span>🔥 মূল হুক যোগ করুন</span>
            </button>

            {/* Hook Dropdown Menu */}
            {showHookMenu && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-40 p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-zinc-900">
                    <Flame className="w-4 h-4 text-red-600" />
                    <span>প্রিমিয়াম হুক ও হাইলাইট বক্স</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHookMenu(false)}
                    className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[11px] text-zinc-500 font-medium">
                  পণ্য বিক্রির মূল আকর্ষণ (Hook) হাইলাইট করতে যেকোনো একটি প্রিসেট হুক নির্বাচন করুন:
                </p>

                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {PRESET_HOOKS.map((hook) => (
                    <button
                      key={hook.id}
                      type="button"
                      onClick={() => insertPresetHook(hook.id)}
                      className="w-full text-left p-2.5 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all flex items-start gap-2.5 cursor-pointer group"
                      style={{ backgroundColor: hook.bgColor }}
                    >
                      <span className="text-lg shrink-0 mt-0.5">{hook.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span
                            className="text-xs font-black tracking-wide"
                            style={{ color: hook.textColor }}
                          >
                            {hook.title}
                          </span>
                          <span
                            className="text-[9px] font-black px-1.5 py-0.5 rounded-md"
                            style={{
                              backgroundColor: hook.borderColor,
                              color: '#fff',
                            }}
                          >
                            {hook.badge}
                          </span>
                        </div>
                        <p
                          className="text-[11px] line-clamp-2 leading-relaxed"
                          style={{ color: hook.bodyColor }}
                        >
                          {hook.defaultBody}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom Hook Button */}
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setShowHookMenu(false);
                      setShowCustomHookModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-zinc-600" />
                    <span>নিজস্ব কাস্টম হুক বক্স তৈরি করুন</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add Image Button */}
          <button
            type="button"
            onClick={() => {
              setShowImageModal(true);
              setShowHookMenu(false);
              setShowTemplateMenu(false);
            }}
            className="flex items-center gap-1.5 text-xs font-black text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-all shadow-2xs cursor-pointer active:scale-95"
            title="ডেসক্রিপশনে আলাদা প্রোডাক্টের ছবি যুক্ত করুন"
          >
            <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>📷 ছবি যোগ করুন</span>
          </button>

          {/* Templates Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowTemplateMenu(!showTemplateMenu);
                setShowHookMenu(false);
                setShowTextColorPicker(false);
                setShowHighlightPicker(false);
              }}
              className="flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-xl border border-purple-200 transition-all shadow-2xs cursor-pointer"
              title="রেডিমেড প্রফেশনাল ডেসক্রিপশন ফরম্যাট"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>টেমপ্লেট</span>
            </button>

            {showTemplateMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-40 p-2.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 px-2 py-1">
                  রেডিমেড ফরম্যাট নির্বাচন করুন
                </div>
                <button
                  type="button"
                  onClick={() => insertLayoutTemplate('complete')}
                  className="w-full text-left p-2 rounded-xl hover:bg-purple-50 transition-colors flex items-start gap-2 cursor-pointer"
                >
                  <span className="text-base">🌟</span>
                  <div>
                    <p className="text-xs font-black text-zinc-900">সম্পূর্ণ প্রিমিয়াম ডেসক্রিপশন</p>
                    <p className="text-[10px] text-zinc-500">
                      হুক + পণ্য পরিচিতি + মূল ফিচার + স্পেসিফিকেশন
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => insertLayoutTemplate('features')}
                  className="w-full text-left p-2 rounded-xl hover:bg-purple-50 transition-colors flex items-start gap-2 cursor-pointer"
                >
                  <span className="text-base">💎</span>
                  <div>
                    <p className="text-xs font-black text-zinc-900">ফিচার ও আকর্ষণীয় হাইলাইটস</p>
                    <p className="text-[10px] text-zinc-500">বোল্ড কালার পয়েন্ট এবং এক্সক্লুসিভ বেনিফিট</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => insertLayoutTemplate('tech')}
                  className="w-full text-left p-2 rounded-xl hover:bg-purple-50 transition-colors flex items-start gap-2 cursor-pointer"
                >
                  <span className="text-base">⚡</span>
                  <div>
                    <p className="text-xs font-black text-zinc-900">স্পেসিফিকেশন ও টেকনিক্যাল চার্ট</p>
                    <p className="text-[10px] text-zinc-500">মডেল, ব্যাটারি ব্যাকআপ, বক্স কনটেন্ট</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* View Modes: Visual vs HTML vs Live Storefront Preview */}
          <div className="flex items-center bg-zinc-100 rounded-xl p-0.5 border border-zinc-200">
            <button
              type="button"
              onClick={() => setEditorMode('visual')}
              className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                editorMode === 'visual'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>ভিজ্যুয়াল</span>
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('html')}
              className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                editorMode === 'html'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>HTML</span>
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('preview')}
              className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                editorMode === 'preview'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
              title="কাস্টমার যেভাবে পেজে দেখবে তা লাইভ দেখুন"
            >
              <ExternalLink className="w-3 h-3" />
              <span>প্রিভিউ</span>
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
            title={isFullscreen ? 'ফুলস্ক্রিন বন্ধ করুন' : 'ফুলস্ক্রিনে বড় করুন'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. MAIN TOOLBAR (Only shown in Visual Mode) */}
      {editorMode === 'visual' && (
        <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl p-2 flex items-center gap-1.5 flex-wrap shadow-2xs text-zinc-700">
          {/* Heading Tags: Title, Sub, Paragraph */}
          <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-zinc-200 shadow-2xs">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormatBlock('<h2>');
              }}
              className="px-2 py-1 text-xs font-black hover:bg-zinc-100 rounded-lg text-zinc-800 transition-colors flex items-center gap-0.5 cursor-pointer"
              title="প্রধান টাইটেল (বড় হেডিং)"
            >
              <Heading2 className="w-3.5 h-3.5 text-zinc-700" />
              <span className="text-[11px]">Title</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormatBlock('<h3>');
              }}
              className="px-2 py-1 text-xs font-bold hover:bg-zinc-100 rounded-lg text-zinc-800 transition-colors flex items-center gap-0.5 cursor-pointer"
              title="সাব-টাইটেল (মাঝারি হেডিং)"
            >
              <Heading3 className="w-3.5 h-3.5 text-zinc-700" />
              <span className="text-[11px]">Sub</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormatBlock('<p>');
              }}
              className="px-2 py-1 text-[11px] font-semibold hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors cursor-pointer"
              title="স্বাভাবিক প্যারাগ্রাফ"
            >
              P
            </button>
          </div>

          <div className="w-px h-5 bg-zinc-200 mx-0.5" />

          {/* Typography Styles: Bold, Italic, Underline */}
          <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-zinc-200 shadow-2xs">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('bold');
              }}
              className="p-1.5 hover:bg-zinc-100 rounded-lg font-black text-xs text-zinc-950 transition-colors cursor-pointer"
              title="Bold (বোল্ড / গাঢ় লেখা)"
            >
              <Bold className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('italic');
              }}
              className="p-1.5 hover:bg-zinc-100 rounded-lg italic text-xs text-zinc-800 transition-colors cursor-pointer"
              title="Italic (বাঁকা লেখা)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('underline');
              }}
              className="p-1.5 hover:bg-zinc-100 rounded-lg underline text-xs text-zinc-800 transition-colors cursor-pointer"
              title="Underline (নিচে দাগ)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('strikeThrough');
              }}
              className="p-1.5 hover:bg-zinc-100 rounded-lg text-xs text-zinc-800 transition-colors cursor-pointer"
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-5 bg-zinc-200 mx-0.5" />

          {/* BOLD COLOR PICKER (মেইন হুক কালার বাটন) */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowTextColorPicker(!showTextColorPicker);
                setShowHighlightPicker(false);
                setShowHookMenu(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                showTextColorPicker
                  ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                  : 'bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-800 shadow-2xs'
              }`}
              title="লেখাকে বোল্ড ও কালারফুল করুন (Bold Hook Color)"
            >
              <Palette className="w-3.5 h-3.5 text-rose-600" />
              <span className="text-[11px] font-black">বোল্ড কালার</span>
              <span
                className="w-2.5 h-2.5 rounded-full border border-zinc-300"
                style={{ backgroundColor: customColor }}
              />
            </button>

            {/* Bold Color Dropdown */}
            {showTextColorPicker && (
              <div className="absolute top-full left-0 mt-1.5 p-3 bg-white border border-zinc-200 rounded-2xl shadow-xl z-40 min-w-[240px] animate-in fade-in zoom-in-95 duration-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    হুক কালার নির্বাচন করুন (Bold + Color)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTextColorPicker(false)}
                    className="text-zinc-400 hover:text-zinc-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {BOLD_TEXT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setCustomColor(c.value);
                        applyBoldColor(c.value);
                      }}
                      className="group flex flex-col items-center gap-1 p-1.5 rounded-xl hover:bg-zinc-100 transition-all cursor-pointer text-center"
                      title={c.label}
                    >
                      <span
                        className="w-6 h-6 rounded-full shadow-xs group-hover:scale-110 transition-transform border border-black/10"
                        style={{ backgroundColor: c.value }}
                      />
                      <span className="text-[9px] font-bold text-zinc-600 line-clamp-1">
                        {c.label.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-zinc-700">কাস্টম কালার:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value);
                        applyBoldColor(e.target.value);
                      }}
                      className="w-7 h-7 rounded-lg border border-zinc-300 cursor-pointer p-0.5"
                      title="Choose Custom Color"
                    />
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">
                      {customColor}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* HIGHLIGHT BACKGROUND PICKER */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowHighlightPicker(!showHighlightPicker);
                setShowTextColorPicker(false);
                setShowHookMenu(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                showHighlightPicker
                  ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-xs'
                  : 'bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-800 shadow-2xs'
              }`}
              title="লেখা হাইলাইট করুন (Highlight Background)"
            >
              <Highlighter className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[11px] font-black">হাইলাইটার</span>
              <span
                className="w-2.5 h-2.5 rounded-full border border-zinc-300"
                style={{ backgroundColor: customHighlight }}
              />
            </button>

            {showHighlightPicker && (
              <div className="absolute top-full left-0 mt-1.5 p-3 bg-white border border-zinc-200 rounded-2xl shadow-xl z-40 min-w-[220px] animate-in fade-in zoom-in-95 duration-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    হাইলাইটার ব্যাকগ্রাউন্ড
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowHighlightPicker(false)}
                    className="text-zinc-400 hover:text-zinc-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {HIGHLIGHT_COLORS.map((h) => (
                    <button
                      key={h.value}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setCustomHighlight(h.value);
                        applyHighlight(h.value);
                      }}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-2xs cursor-pointer ${
                        h.value === 'transparent'
                          ? 'border border-zinc-300 bg-white text-zinc-400 text-xs font-bold'
                          : ''
                      }`}
                      style={{ backgroundColor: h.value }}
                      title={h.label}
                    >
                      {h.value === 'transparent' ? '✕' : ''}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-zinc-700">কাস্টম হাইলাইট:</span>
                  <input
                    type="color"
                    value={customHighlight}
                    onChange={(e) => {
                      setCustomHighlight(e.target.value);
                      applyHighlight(e.target.value);
                    }}
                    className="w-7 h-7 rounded-lg border border-zinc-300 cursor-pointer p-0.5"
                    title="Choose Custom Highlight Color"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-zinc-200 mx-0.5" />

          {/* List Options: Bullet, Numbered */}
          <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-zinc-200 shadow-2xs">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('insertUnorderedList');
              }}
              className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-800 transition-colors cursor-pointer"
              title="বুলেট পয়েন্ট তালিকা (Bullet List)"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('insertOrderedList');
              }}
              className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-800 transition-colors cursor-pointer"
              title="নাম্বারযুক্ত পয়েন্ট তালিকা (Numbered List)"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-5 bg-zinc-200 mx-0.5" />

          {/* Alignment */}
          <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-zinc-200 shadow-2xs">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('justifyLeft');
              }}
              className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-800 transition-colors cursor-pointer"
              title="বামে সাজান (Align Left)"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('justifyCenter');
              }}
              className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-800 transition-colors cursor-pointer"
              title="মাঝখানে সাজান (Align Center)"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('justifyRight');
              }}
              className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-800 transition-colors cursor-pointer"
              title="ডানে সাজান (Align Right)"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-5 bg-zinc-200 mx-0.5" />

          {/* Divider Line */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              insertHtmlAtCursor(
                '<hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 20px 0;" /><p><br></p>'
              );
            }}
            className="p-1.5 hover:bg-zinc-100 rounded-xl text-zinc-700 transition-colors cursor-pointer bg-white border border-zinc-200 shadow-2xs"
            title="বিভাজক রেখা যোগ করুন (Divider Line)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 ml-auto">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('undo');
              }}
              className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors cursor-pointer"
              title="পূর্বাবস্থায় ফেরান (Undo)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('redo');
              }}
              className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors cursor-pointer"
              title="পুনরায় করুন (Redo)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Clear Formatting */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('removeFormat');
              }}
              className="p-1.5 hover:bg-zinc-200/80 rounded-xl text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer ml-1"
              title="ফরম্যাট মুছুন (Clear Formatting)"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. CONTENT AREA ACCORDING TO ACTIVE MODE */}
      <div className="border border-zinc-300 rounded-2xl overflow-hidden bg-white shadow-xs focus-within:border-zinc-900 focus-within:ring-2 focus-within:ring-zinc-900/10 transition-all flex flex-col">
        {editorMode === 'html' ? (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter or paste raw HTML code here..."
            className={`w-full font-mono text-xs sm:text-sm p-4 bg-zinc-900 text-emerald-400 focus:outline-none resize-y ${
              isFullscreen ? 'h-[calc(100vh-220px)]' : 'min-h-[320px] max-h-[640px]'
            }`}
          />
        ) : editorMode === 'preview' ? (
          <div
            className={`w-full p-4 sm:p-6 bg-zinc-50/70 overflow-y-auto ${
              isFullscreen ? 'h-[calc(100vh-220px)]' : 'min-h-[320px] max-h-[640px]'
            }`}
          >
            {/* Live Storefront Mock Preview */}
            <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 sm:p-7 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-black text-zinc-800 uppercase tracking-wider">
                    Storefront Live Preview (গ্রাহক যেভাবে দেখবে)
                  </span>
                </div>
                <span className="text-[11px] font-bold text-zinc-400">
                  {embeddedImagesCount} টি ছবি এম্বেড করা আছে
                </span>
              </div>

              {value ? (
                <div
                  className="product-rich-description text-zinc-800 text-xs sm:text-sm leading-[1.8] font-normal space-y-3 [&_h2]:text-lg sm:[&_h2]:text-xl [&_h2]:font-black [&_h2]:my-3 [&_h2]:text-zinc-950 [&_h3]:text-sm sm:[&_h3]:text-base [&_h3]:font-black [&_h3]:my-2.5 [&_h3]:text-zinc-900 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2.5 [&_li]:my-1 [&_p]:my-2 [&_mark]:px-1.5 [&_mark]:py-0.5 [&_mark]:rounded-md [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-2xl [&_img]:my-3.5 [&_img]:shadow-xs [&_img]:mx-auto [&_img]:block [&_figure]:my-4 [&_figure]:mx-auto [&_figure]:max-w-full [&_figcaption]:text-center [&_figcaption]:text-xs [&_figcaption]:text-zinc-500 [&_figcaption]:mt-1.5 [&_figcaption]:font-medium"
                  style={{
                    fontFamily:
                      "'Hind Siliguri', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizeSafeHtml(value) }}
                />
              ) : (
                <div className="text-center py-12 text-zinc-400 text-xs font-medium">
                  এখনও কোনো বিবরণ লেখা হয়নি। ভিজ্যুয়াল মোডে গিয়ে বিবরণ ও হুক লিখুন।
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleVisualInput}
            onBlur={handleVisualInput}
            data-placeholder={placeholder}
            dangerouslySetInnerHTML={{ __html: formatInitialHtml(value || '') }}
            style={{
              fontFamily:
                "'Hind Siliguri', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
            className={`w-full p-4 sm:p-5 text-xs sm:text-sm text-zinc-900 bg-white focus:outline-none overflow-y-auto leading-[1.8] resize-y ${
              isFullscreen ? 'h-[calc(100vh-220px)]' : 'min-h-[320px] max-h-[640px]'
            } [&_h2]:text-lg sm:[&_h2]:text-xl [&_h2]:font-black [&_h2]:my-2.5 [&_h2]:text-zinc-950 [&_h3]:text-sm sm:[&_h3]:text-base [&_h3]:font-black [&_h3]:my-2 [&_h3]:text-zinc-900 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-1 [&_p]:my-1.5 [&_mark]:px-1.5 [&_mark]:py-0.5 [&_mark]:rounded-md [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-2xl [&_img]:my-3.5 [&_img]:shadow-xs [&_img]:mx-auto [&_img]:block [&_figure]:my-4 [&_figure]:mx-auto [&_figure]:max-w-full [&_figcaption]:text-center [&_figcaption]:text-xs [&_figcaption]:text-zinc-500 [&_figcaption]:mt-1.5 [&_figcaption]:font-medium`}
          />
        )}

        {/* 4. FOOTER STATUS BAR */}
        <div className="bg-zinc-50 border-t border-zinc-200 px-4 py-2 flex items-center justify-between text-[11px] text-zinc-500 font-medium flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span>
              শব্দ সংখ্যা: <strong className="text-zinc-800">{wordCount}</strong>
            </span>
            <span>
              অক্ষর: <strong className="text-zinc-800">{charCount}</strong>
            </span>
            <span>
              ছবি সংখ্যা: <strong className="text-blue-700">{embeddedImagesCount}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-zinc-500">
            <span className="hidden sm:inline text-zinc-400">
              💡 টিপস: গুরুত্বপূর্ণ টেক্সট সিলেক্ট করে ‘বোল্ড কালার’ বা ‘🔥 মূল হুক’ বাটনে চাপুন।
            </span>
            {isFullscreen && (
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="text-emerald-700 font-black hover:underline cursor-pointer"
              >
                ফুলস্ক্রিন বন্ধ করুন
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. IMAGE INSERTION MODAL */}
      {showImageModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-900">
                    বিবরণের ভেতর প্রোডাক্টের ছবি যোগ করুন
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    আপলোড করুন, বিদ্যমান ছবি বাছুন অথবা সরাসরি লিঙ্ক দিন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImageModal(false);
                  setUploadError(null);
                }}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center border-b border-zinc-100 bg-zinc-100/60 p-1 mx-4 sm:mx-5 mt-4 rounded-xl">
              <button
                type="button"
                onClick={() => setImageModalTab('upload')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  imageModalTab === 'upload'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>ফাইল আপলোড</span>
              </button>

              {existingImages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setImageModalTab('existing')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    imageModalTab === 'existing'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>প্রোডাক্টের ছবিসমূহ ({existingImages.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setImageModalTab('url')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  imageModalTab === 'url'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>ইমেজ লিঙ্ক (URL)</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Error Alert */}
              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center justify-between">
                  <span>{uploadError}</span>
                  <button
                    type="button"
                    onClick={() => setUploadError(null)}
                    className="text-red-500 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Tab 1: Upload from device */}
              {imageModalTab === 'upload' && (
                <div className="space-y-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      isUploadingImage
                        ? 'border-blue-400 bg-blue-50/50'
                        : selectedImageUrl
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50/60'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    {isUploadingImage ? (
                      <div className="flex flex-col items-center gap-2 py-4">
                        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-bold text-blue-700">ছবি প্রসেস ও অপ্টিমাইজ হচ্ছে...</p>
                      </div>
                    ) : selectedImageUrl ? (
                      <div className="space-y-2">
                        <img
                          src={selectedImageUrl}
                          alt="Uploaded Preview"
                          className="w-full max-h-48 object-contain rounded-xl mx-auto border border-zinc-200"
                        />
                        <p className="text-xs font-bold text-emerald-700">
                          ✓ ছবি সফলভাবে প্রস্তুত হয়েছে! ক্লিক করে পরিবর্তন করতে পারেন।
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 py-4">
                        <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-black text-zinc-800">
                          কম্পিউটার বা মোবাইল থেকে ছবি সিলেক্ট করুন
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          JPEG, PNG, WebP ইত্যাদি (স্বয়ংক্রিয়ভাবে কম্প্রেস হবে)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Existing Product Images */}
              {imageModalTab === 'existing' && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-zinc-600">
                    এই প্রোডাক্টে ইতোমধ্যে যুক্ত করা ছবি থেকে সিলেক্ট করুন:
                  </p>
                  <div className="grid grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                    {existingImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageUrl(img)}
                        className={`group relative rounded-xl overflow-hidden border-2 transition-all aspect-square bg-zinc-100 cursor-pointer ${
                          selectedImageUrl === img
                            ? 'border-blue-600 ring-2 ring-blue-500/30'
                            : 'border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Gallery ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {selectedImageUrl === img && (
                          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shadow-sm">
                            ✓
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Paste Image URL */}
              {imageModalTab === 'url' && (
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-zinc-700">
                    ইমেজ লিঙ্ক বা অনলাইন URL পেস্ট করুন:
                  </label>
                  <input
                    type="url"
                    value={selectedImageUrl}
                    onChange={(e) => setSelectedImageUrl(e.target.value)}
                    placeholder="https://example.com/product-shot.jpg"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  {selectedImageUrl && (
                    <div className="p-2 border border-zinc-200 rounded-xl bg-zinc-50 flex items-center gap-3">
                      <img
                        src={selectedImageUrl}
                        alt="URL Preview"
                        className="w-14 h-14 object-cover rounded-lg border border-zinc-200 shrink-0"
                        onError={() => setUploadError('ইমেজ লিঙ্কটি সঠিক নয় বা লোড হচ্ছে না')}
                      />
                      <div className="min-w-0 flex-1 text-[11px] text-zinc-500 truncate">
                        {selectedImageUrl}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Image Customization Controls */}
              {selectedImageUrl && (
                <div className="pt-3 border-t border-zinc-100 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Width sizing */}
                    <div>
                      <label className="block text-[11px] font-black text-zinc-700 mb-1">
                        ছবির সাইজ (Width):
                      </label>
                      <select
                        value={imageWidth}
                        onChange={(e) => setImageWidth(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-300 bg-white font-medium focus:outline-none"
                      >
                        <option value="100%">বড় (100% Full Width)</option>
                        <option value="80%">মাঝারি (80% Width)</option>
                        <option value="60%">কমপ্যাক্ট (60% Width)</option>
                        <option value="40%">ছোট (40% Width)</option>
                      </select>
                    </div>

                    {/* Alignment */}
                    <div>
                      <label className="block text-[11px] font-black text-zinc-700 mb-1">
                        পজিশন (Alignment):
                      </label>
                      <select
                        value={imageAlignment}
                        onChange={(e) => setImageAlignment(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-300 bg-white font-medium focus:outline-none"
                      >
                        <option value="center">মাঝখানে (Center)</option>
                        <option value="left">বামে (Left Float)</option>
                        <option value="right">ডানে (Right Float)</option>
                      </select>
                    </div>
                  </div>

                  {/* Caption Input */}
                  <div>
                    <label className="block text-[11px] font-black text-zinc-700 mb-1">
                      ছবির ক্যাপশন / বিবরণ (ঐচ্ছিক):
                    </label>
                    <input
                      type="text"
                      value={imageCaption}
                      onChange={(e) => setImageCaption(e.target.value)}
                      placeholder="যেমন: পণ্যটির আসল লুক ও প্যাকেজিং ভিউ"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowImageModal(false);
                  setUploadError(null);
                }}
                className="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                বাতিল করুন
              </button>

              <button
                type="button"
                disabled={!selectedImageUrl || isUploadingImage}
                onClick={handleInsertImage}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ইনসার্ট করুন (Insert Image)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. CUSTOM HOOK CREATOR MODAL */}
      {showCustomHookModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full border border-zinc-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">{customHookEmoji}</span>
                <div>
                  <h3 className="text-sm font-black text-zinc-900">কাস্টম হুক বক্স তৈরি করুন</h3>
                  <p className="text-[11px] text-zinc-500">
                    আকর্ষণীয় হুক পয়েন্ট তৈরি করে গ্রাহকের দৃষ্টি আকর্ষণ করুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomHookModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5">
              {/* Emoji Selector */}
              <div>
                <label className="block text-[11px] font-black text-zinc-700 mb-1">
                  আইকন / ইমোজি:
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {['🔥', '⭐', '⚡', '💎', '🎯', '🚀', '💡', '🛡️', '🚚', '✅'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setCustomHookEmoji(em)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-base transition-transform cursor-pointer ${
                        customHookEmoji === em
                          ? 'bg-zinc-900 text-white scale-110 shadow-xs'
                          : 'bg-zinc-100 hover:bg-zinc-200'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hook Color */}
              <div>
                <label className="block text-[11px] font-black text-zinc-700 mb-1">
                  হুক সাইড বর্ডার কালার:
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {BOLD_TEXT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCustomHookColor(c.value)}
                      className={`w-7 h-7 rounded-full shadow-2xs transition-transform cursor-pointer ${
                        customHookColor === c.value
                          ? 'ring-2 ring-zinc-900 ring-offset-2 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Hook Title */}
              <div>
                <label className="block text-[11px] font-black text-zinc-700 mb-1">
                  হুক টাইটেল (Main Hook Title): <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customHookTitle}
                  onChange={(e) => setCustomHookTitle(e.target.value)}
                  placeholder="যেমন: ৭ দিনের মধ্যে কোনো সন্তুষ্টি না হলে মানিব্যাক গ্যারান্টি!"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 font-black"
                />
              </div>

              {/* Hook Body */}
              <div>
                <label className="block text-[11px] font-black text-zinc-700 mb-1">
                  বিস্তারিত বিবরণ (ঐচ্ছিক):
                </label>
                <textarea
                  value={customHookBody}
                  onChange={(e) => setCustomHookBody(e.target.value)}
                  placeholder="সংক্ষেপে মূল কারণ বা গ্রাহকের বাড়তি সুবিধা ব্যাখ্যা করুন..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 font-sans leading-relaxed resize-none"
                />
              </div>

              {/* Live Preview of Hook */}
              {customHookTitle && (
                <div
                  className="p-3.5 rounded-xl border border-zinc-200 text-xs"
                  style={{
                    backgroundColor: '#fafafa',
                    borderLeft: `4px solid ${customHookColor}`,
                  }}
                >
                  <div
                    className="font-black flex items-center gap-2 mb-1"
                    style={{ color: customHookColor }}
                  >
                    <span>{customHookEmoji}</span>
                    <span>{customHookTitle}</span>
                  </div>
                  {customHookBody && (
                    <div className="text-zinc-700 text-[11px] leading-relaxed">
                      {customHookBody}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowCustomHookModal(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-zinc-900"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={!customHookTitle.trim()}
                onClick={handleInsertCustomHook}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-black text-white bg-zinc-900 hover:bg-black disabled:opacity-50 rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>হুক যোগ করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
