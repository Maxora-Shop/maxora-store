import React, { useMemo } from 'react';
import {
  Check,
  Package,
  ShieldCheck,
  Truck,
  SlidersHorizontal,
  Info,
  Sparkles,
  FileText,
} from 'lucide-react';
import { Product } from '../types';
import { parseProductDescription } from '../utils/productDescriptionParser';

interface ProductDescriptionSectionProps {
  product: Product;
  className?: string;
}

export const ProductDescriptionSection: React.FC<ProductDescriptionSectionProps> = ({
  product,
  className = '',
}) => {
  const parsed = useMemo(() => {
    return parseProductDescription(product.description, product);
  }, [product]);

  // Detect if description or product contains Bengali script
  const isBengali = useMemo(() => {
    const combined = `${product.description || ''} ${product.name || ''}`;
    return /[\u0980-\u09FF]/.test(combined);
  }, [product]);

  const hasOverview = parsed.overviewParagraphs.length > 0;
  const hasFeatures = parsed.features.length > 0;
  const hasSpecifications = parsed.specifications.length > 0;
  const hasPackageContents = parsed.packageContents.length > 0;
  const hasWarrantyOrDelivery = !!parsed.warrantyInfo || !!parsed.deliveryInfo;
  const hasAdditionalInfo = !!parsed.additionalInfo && parsed.additionalInfo.paragraphs.length > 0;

  return (
    <div
      className={`space-y-4 sm:space-y-5 text-zinc-800 font-sans ${className}`}
      style={{
        fontFamily:
          "'Hind Siliguri', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* 1. PRODUCT OVERVIEW */}
      {hasOverview && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 rounded-full bg-emerald-600" />
            <h3 className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isBengali ? 'পণ্য পরিচিতি (Overview)' : 'Product Overview'}</span>
            </h3>
          </div>
          <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50/90 border border-zinc-200/80 space-y-2.5">
            {parsed.overviewParagraphs.map((para, idx) => (
              <p
                key={idx}
                className="text-xs sm:text-[13px] text-zinc-700 leading-[1.8] font-normal"
              >
                {para}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* 2. KEY FEATURES */}
      {hasFeatures && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 rounded-full bg-emerald-600" />
            <h3 className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isBengali ? 'মূল বৈশিষ্ট্যসমূহ (Key Features)' : 'Key Features'}</span>
            </h3>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs">
            <ul className="space-y-2 sm:space-y-2.5">
              {parsed.features.map((feature, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs sm:text-[13px] text-zinc-800 leading-[1.75]"
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                  <span className="font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 3. SPECIFICATIONS TABLE */}
      {hasSpecifications && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 rounded-full bg-emerald-600" />
            <h3 className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isBengali ? 'স্পেসিফিকেশন (Specifications)' : 'Specifications'}</span>
            </h3>
          </div>

          <div className="rounded-2xl border border-zinc-200 overflow-hidden bg-white shadow-2xs">
            <div className="divide-y divide-zinc-150">
              {parsed.specifications.map((spec, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:py-2.5 sm:px-4 text-xs transition-colors ${
                    idx % 2 === 0 ? 'bg-zinc-50/60' : 'bg-white'
                  }`}
                >
                  <span className="font-semibold text-zinc-600 sm:w-2/5 shrink-0 mb-0.5 sm:mb-0">
                    {spec.label}
                  </span>
                  <span className="font-bold text-zinc-900 sm:w-3/5 break-words sm:text-right">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. PACKAGE CONTENTS */}
      {hasPackageContents && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 rounded-full bg-blue-600" />
            <h3 className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-blue-600" />
              <span>{isBengali ? "বক্সের ভেতর যা থাকছে (What's in the Box)" : "What's in the Box"}</span>
            </h3>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50/40 border border-blue-100 shadow-2xs">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {parsed.packageContents.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 text-xs sm:text-[13px] text-zinc-800 font-medium bg-white/85 p-2 rounded-xl border border-blue-100/70"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 5. WARRANTY / DELIVERY */}
      {hasWarrantyOrDelivery && (
        <section className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {parsed.warrantyInfo && (
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5 shadow-2xs">
                <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-900 mb-0.5">
                    {isBengali ? 'ওয়ারেন্টি সুবিধা' : 'Warranty Protection'}
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    {parsed.warrantyInfo}
                  </p>
                </div>
              </div>
            )}

            {parsed.deliveryInfo && (
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5 shadow-2xs">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-emerald-900 mb-0.5">
                    {isBengali ? 'ডেলিভারি তথ্য' : 'Fast Delivery'}
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                    {parsed.deliveryInfo}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 6. ADDITIONAL INFORMATION */}
      {hasAdditionalInfo && parsed.additionalInfo && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 rounded-full bg-zinc-600" />
            <h3 className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-zinc-600" />
              <span>{parsed.additionalInfo.title || (isBengali ? 'অতিরিক্ত তথ্য' : 'Additional Information')}</span>
            </h3>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
            {parsed.additionalInfo.paragraphs.map((para, idx) => (
              <p
                key={idx}
                className="text-xs sm:text-[13px] text-zinc-700 leading-[1.8] font-normal"
              >
                {para}
              </p>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
