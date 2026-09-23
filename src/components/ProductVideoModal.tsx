import React, { useMemo } from 'react';
import { X, Play, ShieldCheck, Film, ExternalLink } from 'lucide-react';

interface ProductVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  productName: string;
}

// Convert various video URLs into an embeddable URL
export function getEmbedUrl(rawUrl?: string): { type: 'youtube' | 'video' | 'empty'; url: string } {
  if (!rawUrl || !rawUrl.trim()) {
    // Default fallback unboxing/demo video (Tech gadget demonstration)
    return {
      type: 'youtube',
      url: 'https://www.youtube-nocookie.com/embed/6stn33i_p2M?autoplay=1&rel=0&modestbranding=1',
    };
  }

  const url = rawUrl.trim();

  // YouTube matchers
  const youtubeRegExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/;
  const ytMatch = url.match(youtubeRegExp);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      url: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`,
    };
  }

  // Check if direct mp4/webm file
  if (url.match(/\.(mp4|webm|ogg)($|\?)/i)) {
    return {
      type: 'video',
      url: url,
    };
  }

  // Default iframe attempt
  return {
    type: 'youtube',
    url: url,
  };
}

export const ProductVideoModal: React.FC<ProductVideoModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  productName,
}) => {
  const embedInfo = useMemo(() => getEmbedUrl(videoUrl), [videoUrl]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-zinc-950 text-white rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/90">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <div className="w-8 h-8 rounded-xl bg-rose-600/20 text-rose-500 border border-rose-500/30 flex items-center justify-center shrink-0">
              <Film className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="video-modal-title" className="text-xs sm:text-sm font-black text-white truncate">
                {productName}
              </h3>
              <p className="text-[10px] sm:text-xs text-zinc-400 font-medium">
                Product Video & Live Unboxing Demo (প্রোডাক্ট ভিডিও ডেমো)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
            aria-label="Close Video"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center">
          {embedInfo.type === 'youtube' ? (
            <iframe
              src={embedInfo.url}
              title={`${productName} Video Demo`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <video
              src={embedInfo.url}
              controls
              autoPlay
              className="w-full h-full object-contain"
            >
              Your browser does not support HTML5 video.
            </video>
          )}
        </div>

        {/* Modal Footer with Verification Badges */}
        <div className="p-4 sm:p-5 bg-zinc-900/80 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-zinc-300">
              ১০০% আসল পণ্যের আনবক্সিং এবং কার্যকারিতা প্রদর্শনী
            </span>
          </div>

          {videoUrl && (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span>Open in new tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
