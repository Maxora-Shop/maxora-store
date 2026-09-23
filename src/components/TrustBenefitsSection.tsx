import React from 'react';
import { Truck, ShieldCheck, RefreshCw, Headphones, Sparkles, CheckCircle2 } from 'lucide-react';
import { StoreSettings } from '../types';

interface TrustBenefitsSectionProps {
  settings?: StoreSettings;
}

export const TrustBenefitsSection: React.FC<TrustBenefitsSectionProps> = ({ settings }) => {
  const isFreeDeliveryEnabled = settings?.free_delivery_enabled !== false;
  const threshold = Number(settings?.free_delivery_threshold || 2000);

  const benefits = [
    {
      icon: Truck,
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      title: settings?.trust_badge_1_title || (isFreeDeliveryEnabled ? 'Free & Fast Delivery' : 'Fast Delivery'),
      subtitle: settings?.trust_badge_1_subtitle || (isFreeDeliveryEnabled ? `৳${threshold.toLocaleString('en-BD')} এর অর্ডারে ফ্রি ডেলিভারি` : 'সারা দেশে দ্রুত ডেলিভারি'),
    },
    {
      icon: ShieldCheck,
      iconBg: 'bg-amber-50 text-amber-700 border-amber-200/80',
      title: settings?.trust_badge_2_title || 'Cash on Delivery',
      subtitle: settings?.trust_badge_2_subtitle || 'পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন',
    },
    {
      icon: RefreshCw,
      iconBg: 'bg-blue-50 text-blue-700 border-blue-200/80',
      title: settings?.trust_badge_3_title || 'Check Before Accept',
      subtitle: settings?.trust_badge_3_subtitle || 'ডেলিভারিম্যানের সামনে যাচাইয়ের সুবিধা',
    },
    {
      icon: Headphones,
      iconBg: 'bg-purple-50 text-purple-700 border-purple-200/80',
      title: settings?.trust_badge_4_title || '24/7 Dedicated Support',
      subtitle: settings?.trust_badge_4_subtitle || (settings?.phone ? `হেল্পলাইন: ${settings.phone}` : 'অর্ডার ও বিক্রয়োত্তর সার্বক্ষণিক সেবা'),
    },
  ];

  return (
    <section className="my-6 sm:my-8 w-full">
      <div className="bg-white rounded-3xl border border-zinc-200/90 p-4 sm:p-6 shadow-xs relative overflow-hidden">
        {/* Subtle decorative top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-600 opacity-90" />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 divide-y lg:divide-y-0 lg:divide-x divide-zinc-100">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className={`flex items-center gap-3.5 ${
                  idx > 0 && idx % 2 === 0 ? 'pt-4 lg:pt-0' : ''
                } ${idx % 2 === 1 ? 'pt-4 sm:pt-0' : ''} ${idx > 0 ? 'lg:pl-6' : ''}`}
              >
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-300 hover:scale-105 shadow-2xs ${b.iconBg}`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-black text-zinc-950 leading-tight truncate">
                    {b.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-zinc-500 font-medium mt-0.5 line-clamp-2">
                    {b.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

