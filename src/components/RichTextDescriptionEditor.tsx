import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Palette,
  Highlighter,
  RotateCcw,
  Maximize2,
  Minimize2,
  Code,
  Eye,
  Eraser,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { sanitizeSafeHtml } from '../utils/sanitizeHtml';

interface RichTextDescriptionEditorProps {
  value: string;
  onChange: (html: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

const TEXT_COLORS = [
  { label: 'Default', value: '#18181b', bg: 'bg-zinc-900' },
  { label: 'Crimson Red', value: '#dc2626', bg: 'bg-red-600' },
  { label: 'Emerald Green', value: '#059669', bg: 'bg-emerald-600' },
  { label: 'Royal Blue', value: '#2563eb', bg: 'bg-blue-600' },
  { label: 'Purple Violet', value: '#7c3aed', bg: 'bg-purple-600' },
  { label: 'Amber Orange', value: '#d97706', bg: 'bg-amber-600' },
  { label: 'Rose Pink', value: '#db2777', bg: 'bg-pink-600' },
];

const HIGHLIGHT_COLORS = [
  { label: 'None', value: 'transparent', bg: 'bg-transparent border border-zinc-300' },
  { label: 'Yellow', value: '#fef08a', bg: 'bg-yellow-200' },
  { label: 'Green', value: '#bbf7d0', bg: 'bg-green-200' },
  { label: 'Blue', value: '#bfdbfe', bg: 'bg-blue-200' },
  { label: 'Pink', value: '#fbcfe8', bg: 'bg-pink-200' },
  { label: 'Orange', value: '#fed7aa', bg: 'bg-orange-200' },
];

export const RichTextDescriptionEditor: React.FC<RichTextDescriptionEditorProps> = ({
  value,
  onChange,
  label = 'Product Description',
  placeholder = 'পণ্যটির বিস্তারিত বিবরণ লিখুন...',
  className = '',
}) => {
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [customColor, setCustomColor] = useState('#dc2626');
  const [customHighlight, setCustomHighlight] = useState('#fef08a');

  const editorRef = useRef<HTMLDivElement>(null);
  const lastHtmlRef = useRef<string>(value || '');

  // Convert plain text with newlines to HTML if needed
  const formatInitialHtml = useCallback((raw: string) => {
    if (!raw) return '';
    // If it doesn't look like HTML, convert newlines to paragraphs/breaks
    if (!/<[a-z][\s\S]*>/i.test(raw)) {
      return raw
        .split(/\r?\n\r?\n/)
        .map((para) => `<p>${para.replace(/\r?\n/g, '<br>')}</p>`)
        .join('');
    }
    return raw;
  }, []);

  // Sync value from outside if changed externally and not currently focused
  useEffect(() => {
    if (editorRef.current && !isHtmlMode) {
      const currentInner = editorRef.current.innerHTML;
      const formatted = formatInitialHtml(value || '');
      if (formatted !== currentInner && value !== lastHtmlRef.current) {
        editorRef.current.innerHTML = formatted;
        lastHtmlRef.current = value;
      }
    }
  }, [value, isHtmlMode, formatInitialHtml]);

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
    if (isHtmlMode) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(cmd, false, val);
    handleVisualInput();
  };

  // Format block (H2, H3, P, etc.)
  const handleFormatBlock = (tag: string) => {
    execCmd('formatBlock', tag);
  };

  // Apply text color
  const applyTextColor = (color: string) => {
    execCmd('foreColor', color);
    setShowTextColorPicker(false);
  };

  // Apply background highlight
  const applyHighlight = (color: string) => {
    if (color === 'transparent') {
      execCmd('removeFormat');
    } else {
      // HiliteColor is standard across webkit, backColor is fallback
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

  // Insert structured BD e-commerce description template
  const insertTemplate = () => {
    const templateHtml = `
<h3 style="color: #2563eb; font-weight: bold;">পণ্য পরিচিতি (Overview)</h3>
<p>এই পণ্যটি ১০০% আসল এবং প্রিমিয়াম কোয়ালিটির উপাদান দিয়ে তৈরি। দৈনন্দিন ব্যবহারে এটি অত্যন্ত দীর্ঘস্থায়ী ও কার্যক্ষম।</p>

<h3 style="color: #059669; font-weight: bold;">মূল বৈশিষ্ট্যসমূহ (Key Features)</h3>
<ul>
  <li><span style="color: #dc2626; font-weight: bold;">প্রিমিয়াম ডিজাইন:</span> আকর্ষণীয় লুক এবং আধুনিক ফিনিশিং।</li>
  <li><span style="color: #059669; font-weight: bold;">উন্নত পারফরম্যান্স:</span> বিদ্যুৎ সাশ্রয়ী ও দ্রুত কার্যকর।</li>
  <li><span style="color: #2563eb; font-weight: bold;">সহজ পরিচালনা:</span> সহজে ব্যবহারযোগ্য এবং বহনযোগ্য।</li>
</ul>

<h3 style="color: #7c3aed; font-weight: bold;">স্পেসিফিকেশন (Specifications)</h3>
<p><strong>মডেল:</strong> অফিসিয়াল সংস্করণ<br><strong>কালার:</strong> ব্ল্যাক / হোয়াইট<br><strong>ওয়ারেন্টি:</strong> অফিসিয়াল সার্ভিস ওয়ারেন্টি ও অথেনটিক পণ্য গ্যারান্টি</p>
    `.trim();

    if (isHtmlMode) {
      onChange((value ? value + '\n\n' : '') + templateHtml);
    } else if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertHTML', false, templateHtml);
      handleVisualInput();
    }
  };

  // Word and character counts
  const plainText = (value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const charCount = plainText.length;

  return (
    <div
      className={`space-y-1.5 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-white p-6 flex flex-col justify-between overflow-hidden shadow-2xl'
          : 'relative'
      } ${className}`}
    >
      {/* Top Header & Mode Badges */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="block text-xs font-bold text-zinc-700 flex items-center gap-1.5">
          <span>{label}</span>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Rich Color Editor (রং ও টাইটেল টুলস)
          </span>
        </label>

        <div className="flex items-center gap-2">
          {/* Quick Template Button */}
          <button
            type="button"
            onClick={insertTemplate}
            className="flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 transition-colors cursor-pointer"
            title="Insert ready-made description structure"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>টেমপ্লেট যোগ করুন</span>
          </button>

          {/* Mode Switch: Visual vs Code */}
          <div className="flex items-center bg-zinc-100 rounded-lg p-0.5 border border-zinc-200">
            <button
              type="button"
              onClick={() => setIsHtmlMode(false)}
              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                !isHtmlMode
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Visual</span>
            </button>
            <button
              type="button"
              onClick={() => setIsHtmlMode(true)}
              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                isHtmlMode
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>HTML</span>
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Editor Frame */}
      <div className="border border-zinc-300 rounded-2xl overflow-hidden bg-white shadow-xs focus-within:border-zinc-900 focus-within:ring-2 focus-within:ring-zinc-900/10 transition-all flex flex-col">
        {/* Formatting Toolbar */}
        {!isHtmlMode && (
          <div className="bg-zinc-50 border-b border-zinc-200 p-2 flex items-center gap-1.5 flex-wrap text-zinc-700">
            {/* Heading / Titles Selector */}
            <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-zinc-200 shadow-2xs">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleFormatBlock('<h2>');
                }}
                className="px-2 py-1 text-xs font-black hover:bg-zinc-100 rounded-lg text-zinc-800 transition-colors flex items-center gap-0.5 cursor-pointer"
                title="Heading 2 (বড় টাইটেল)"
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
                title="Heading 3 (সাব-টাইটেল)"
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
                className="px-2 py-1 text-[11px] font-medium hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors cursor-pointer"
                title="Normal Paragraph (স্বাভাবিক প্যারাগ্রাফ)"
              >
                P
              </button>
            </div>

            <div className="w-px h-5 bg-zinc-200 mx-0.5" />

            {/* Basic Formatting: Bold, Italic, Underline, Strikethrough */}
            <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-zinc-200 shadow-2xs">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  execCmd('bold');
                }}
                className="p-1.5 hover:bg-zinc-100 rounded-lg font-black text-xs text-zinc-900 transition-colors cursor-pointer"
                title="Bold (বোল্ড / মোটা লেখা)"
              >
                <Bold className="w-3.5 h-3.5" />
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

            {/* TEXT COLOR PICKER (রং করার অপশন) */}
            <div className="relative">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setShowTextColorPicker(!showTextColorPicker);
                  setShowHighlightPicker(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  showTextColorPicker
                    ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                    : 'bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-800 shadow-2xs'
                }`}
                title="Text Color (লেখার রং পরিবর্তন করুন)"
              >
                <Palette className="w-3.5 h-3.5 text-rose-600" />
                <span className="text-[11px]">Text Color</span>
                <span className="w-2.5 h-2.5 rounded-full border border-zinc-300" style={{ backgroundColor: customColor }} />
              </button>

              {/* Text Color Dropdown Palette */}
              {showTextColorPicker && (
                <div className="absolute top-full left-0 mt-1.5 p-2.5 bg-white border border-zinc-200 rounded-2xl shadow-xl z-30 min-w-[200px] animate-fade-in space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    Quick Text Colors
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {TEXT_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setCustomColor(c.value);
                          applyTextColor(c.value);
                        }}
                        className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-115 transition-transform shadow-2xs cursor-pointer"
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>
                  <div className="pt-1.5 border-t border-zinc-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-zinc-600">Custom:</span>
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value);
                        applyTextColor(e.target.value);
                      }}
                      className="w-7 h-7 rounded-lg border border-zinc-300 cursor-pointer p-0.5"
                      title="Choose Custom Color"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* HIGHLIGHT COLOR PICKER (হাইলাইটার অপশন) */}
            <div className="relative">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setShowHighlightPicker(!showHighlightPicker);
                  setShowTextColorPicker(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  showHighlightPicker
                    ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-xs'
                    : 'bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-800 shadow-2xs'
                }`}
                title="Highlight Background (লেখা হাইলাইট করুন)"
              >
                <Highlighter className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[11px]">Highlight</span>
                <span className="w-2.5 h-2.5 rounded-full border border-zinc-300" style={{ backgroundColor: customHighlight }} />
              </button>

              {/* Highlight Dropdown Palette */}
              {showHighlightPicker && (
                <div className="absolute top-full left-0 mt-1.5 p-2.5 bg-white border border-zinc-200 rounded-2xl shadow-xl z-30 min-w-[200px] animate-fade-in space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    Highlighter Colors
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {HIGHLIGHT_COLORS.map((h) => (
                      <button
                        key={h.value}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setCustomHighlight(h.value);
                          applyHighlight(h.value);
                        }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center hover:scale-115 transition-transform shadow-2xs cursor-pointer ${
                          h.value === 'transparent' ? 'border border-zinc-300 bg-white text-zinc-400 text-[10px]' : ''
                        }`}
                        style={{ backgroundColor: h.value }}
                        title={h.label}
                      >
                        {h.value === 'transparent' && '✕'}
                      </button>
                    ))}
                  </div>
                  <div className="pt-1.5 border-t border-zinc-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-zinc-600">Custom:</span>
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

            {/* Lists: Bullets & Numbered */}
            <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-zinc-200 shadow-2xs">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  execCmd('insertUnorderedList');
                }}
                className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-800 transition-colors cursor-pointer"
                title="Bullet List (বুলেট পয়েন্ট)"
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
                title="Numbered List (নাম্বার পয়েন্ট)"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Clear Formatting */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('removeFormat');
              }}
              className="p-1.5 hover:bg-zinc-200/70 rounded-xl text-zinc-500 hover:text-zinc-900 transition-colors ml-auto cursor-pointer"
              title="Clear Formatting (ফরম্যাট মুছুন)"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="relative flex-1">
          {isHtmlMode ? (
            <textarea
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Enter or paste raw HTML code here..."
              className={`w-full font-mono text-xs sm:text-sm p-4 bg-zinc-900 text-emerald-400 focus:outline-none resize-y ${
                isFullscreen ? 'h-[calc(100vh-180px)]' : 'min-h-[280px] max-h-[600px]'
              }`}
            />
          ) : (
            <div
              ref={editorRef}
              contentEditable
              onInput={handleVisualInput}
              onBlur={handleVisualInput}
              placeholder={placeholder}
              dangerouslySetInnerHTML={{ __html: formatInitialHtml(value || '') }}
              style={{
                fontFamily:
                  "'Hind Siliguri', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              }}
              className={`w-full p-4 sm:p-5 text-xs sm:text-sm text-zinc-900 bg-white focus:outline-none overflow-y-auto leading-[1.8] resize-y ${
                isFullscreen ? 'h-[calc(100vh-180px)]' : 'min-h-[280px] max-h-[600px]'
              } [&_h2]:text-lg sm:[&_h2]:text-xl [&_h2]:font-black [&_h2]:my-2 [&_h2]:text-zinc-950 [&_h3]:text-sm sm:[&_h3]:text-base [&_h3]:font-black [&_h3]:my-2 [&_h3]:text-zinc-900 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-1 [&_p]:my-1.5 [&_mark]:px-1 [&_mark]:py-0.5 [&_mark]:rounded-md`}
            />
          )}
        </div>

        {/* Status Bar */}
        <div className="bg-zinc-50 border-t border-zinc-200 px-4 py-2 flex items-center justify-between text-[11px] text-zinc-500 font-medium">
          <div className="flex items-center gap-3">
            <span>
              শব্দ সংখ্যা: <strong className="text-zinc-800">{wordCount}</strong>
            </span>
            <span>
              অক্ষর: <strong className="text-zinc-800">{charCount}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-zinc-400">
            <span>টিপস: যেকোনো লেখা সিলেক্ট করে Text Color বা Title বাটনে চাপুন।</span>
            {isFullscreen && (
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="text-emerald-700 font-bold hover:underline cursor-pointer"
              >
                Close Fullscreen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
