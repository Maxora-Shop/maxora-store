import React, { useRef, useState } from 'react';
import { Upload, Trash2, RefreshCw, AlertCircle, CheckCircle2, ImageIcon } from 'lucide-react';
import { uploadCategoryImageToStorage } from '../utils/imageStorage';

interface CategoryImageUploaderProps {
  imageUrl?: string;
  categoryId?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export const CategoryImageUploader: React.FC<CategoryImageUploaderProps> = ({
  imageUrl = '',
  categoryId = '',
  onChange,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const SUPPORTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
  const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const validateFile = (file: File): boolean => {
    setErrorMessage(null);
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const mime = (file.type || '').toLowerCase();

    const isExtValid = SUPPORTED_EXTENSIONS.includes(ext);
    const isMimeValid = SUPPORTED_MIME_TYPES.includes(mime) || mime.startsWith('image/');

    if (!isExtValid && !isMimeValid) {
      setErrorMessage('Please select a JPG, JPEG, PNG, or WEBP image file.');
      return false;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Image file is too large. Please select an image under 15MB.');
      return false;
    }

    return true;
  };

  const handleFileSelect = async (file?: File | null) => {
    if (!file || disabled) return;
    if (!validateFile(file)) return;

    try {
      setIsUploading(true);
      setErrorMessage(null);
      const publicUrl = await uploadCategoryImageToStorage(file, categoryId);
      onChange(publicUrl);
    } catch (err: any) {
      console.error('Category image upload error:', err);
      setErrorMessage(err.message || 'Failed to upload category image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isUploading) return;
    onChange('');
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasImage = Boolean(imageUrl && imageUrl.trim().length > 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-zinc-700">
          Category Image
        </label>
        <span className="text-[11px] text-zinc-400 font-medium">
          JPG, JPEG, PNG, WEBP
        </span>
      </div>

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          handleFileSelect(file);
        }}
      />

      {/* PREVIEW STATE: When an image exists */}
      {hasImage ? (
        <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-all">
          <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
            {/* Circular Preview Container matching customer website styling */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-full bg-white border border-emerald-200/80 shadow-xs flex items-center justify-center shrink-0 overflow-hidden group">
              <img
                src={imageUrl}
                alt="Category Preview"
                className="w-full h-full object-contain p-1.5 transition-transform duration-200 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center text-white">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold mb-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Image Attached</span>
              </div>
              <p className="text-[11px] text-zinc-500 truncate max-w-[200px] sm:max-w-xs font-mono">
                {imageUrl.startsWith('data:') ? 'Uploaded directly from device' : imageUrl}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Displays in &quot;Shop by Category&quot; &amp; menus on customer website
              </p>
            </div>
          </div>

          {/* Actions: Change Image & Remove Image */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200">
            <button
              type="button"
              disabled={disabled || isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 text-xs font-bold border border-zinc-300 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUploading ? 'animate-spin' : ''}`} />
              <span>{isUploading ? 'Uploading...' : 'Change Image'}</span>
            </button>

            <button
              type="button"
              disabled={disabled || isUploading}
              onClick={handleRemoveImage}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
              title="Remove category image"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      ) : (
        /* UPLOAD STATE: When no image is selected yet */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !isUploading) {
              fileInputRef.current?.click();
            }
          }}
          className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer select-none ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/60 ring-4 ring-emerald-500/10'
              : 'border-zinc-300 hover:border-emerald-500 bg-zinc-50/70 hover:bg-emerald-50/20'
          } ${disabled || isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform ${
                isDragging ? 'scale-110 bg-emerald-100 text-emerald-700' : 'bg-white border border-zinc-200 text-zinc-600 shadow-2xs'
              }`}
            >
              {isUploading ? (
                <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
              ) : (
                <Upload className="w-5 h-5 text-emerald-600" />
              )}
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition-colors mb-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Uploading Image...' : 'Upload Image'}</span>
              </div>
              <p className="text-xs text-zinc-600 font-medium">
                Click to browse from your computer or drag &amp; drop
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Supports JPG, JPEG, PNG, WEBP (Saved directly to category)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 text-rose-600 text-xs bg-rose-50 border border-rose-200 p-2.5 rounded-xl font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
