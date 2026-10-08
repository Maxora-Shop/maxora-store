import React from 'react';
import { Truck, ShieldCheck, RefreshCw, Headphones, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { StoreSettings } from '../types';

interface TrustBenefitsSectionProps {
  settings?: StoreSettings;
}

export const TrustBenefitsSection: React.FC<TrustBenefitsSectionProps> = ({ settings }) => {
  const isFreeDeliveryEnabled = settings?.free_delivery_enabled === true;
  const threshold = Number(settings?.free_delivery_threshold || 2000);

  const benefits = [
    {
      icon: Truck,
      badgeText: 'FAST & SAFE',
      iconGlow: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white',
      title: settings?.trust_badge_1_title || (isFreeDeliveryEnabled ? 'Free & Fast Delivery' : 'Fast Delivery Across BD'),
      subtitle: settings?.trust_badge_1_subtitle || (isFreeDeliveryEnabled ? `৳${threshold.toLocaleString('en-BD')} এর অর্ডারে ফ্রি ডেলিভারি` : 'সারা দেশে দ্রুত ও নিরাপদ হোম ডেলিভারি'),
    },
    {
      icon: ShieldCheck,
      badgeText: 'VERIFIED COD',
      iconGlow: 'bg-amber-500/10 text-amber-600 border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white',
      title: settings?.trust_badge_2_title || '100% Cash on Delivery',
      subtitle: settings?.trust_badge_2_subtitle || 'পণ্য হাতে পেয়ে পুরোপুরি নিশ্চিত হয়ে মূল্য পরিশোধ',
    },
    {
      icon: RefreshCw,
      badgeText: 'INSPECTION FIRST',
      iconGlow: 'bg-blue-500/10 text-blue-600 border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white',
      title: settings?.trust_badge_3_title || 'Check Before You Accept',
      subtitle: settings?.trust_badge_3_subtitle || 'ডেলিভারিম্যানের সামনে পার্সেল খুলে চেক করার সুবিধা',
    },
    {
      icon: Headphones,
      badgeText: 'SUPPORT 24/7',
      iconGlow: 'bg-purple-500/10 text-purple-600 border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white',
      title: settings?.trust_badge_4_title || 'Dedicated VIP Support',
      subtitle: settings?.trust_badge_4_subtitle || (settings?.phone ? `হটলাইন: ${settings.phone}` : 'অর্ডার ও বিক্রয়োত্তর সার্বক্ষণিক কাস্টমার কেয়ার'),
    },
  ];

  return (
    <section className="my-8 sm:my-10 w-full" aria-label="Customer Guarantees">
      <div className="relative rounded-3xl bg-gradient-to-b from-white to-zinc-50/70 border border-zinc-200/90 shadow-sm p-5 sm:p-7 md:p-8 overflow-hidden transition-all duration-300">
        {/* Subtle decorative top metallic gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-600 opacity-90" />

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="group relative flex flex-col justify-between p-4.5 sm:p-5 rounded-2xl bg-white border border-zinc-200/80 hover:border-zinc-300 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-300 shadow-xs ${b.iconGlow}`}
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-600 transition-colors">
                      {b.badgeText}
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-black text-zinc-950 leading-snug tracking-tight">
                    {b.title}
                  </h4>
                  <p className="text-xs text-zinc-600 font-medium mt-1 leading-relaxed">
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
