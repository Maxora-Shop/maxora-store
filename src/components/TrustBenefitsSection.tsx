import React from 'react';
import { Truck, ShieldCheck, RefreshCw, Headphones } from 'lucide-react';

export const TrustBenefitsSection: React.FC = () => {
  const benefits = [
    {
      icon: Truck,
      title: 'Free Shipping',
      subtitle: 'On orders over ৳1,000',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Payment',
      subtitle: '100% secure payment',
    },
    {
      icon: RefreshCw,
      title: '7-Day Returns',
      subtitle: 'Hassle-free return policy',
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      subtitle: 'Dedicated customer support',
    },
  ];

  return (
    <section className="my-6 sm:my-8 w-full">
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 divide-y lg:divide-y-0 lg:divide-x divide-zinc-100">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className={`flex items-center gap-3.5 ${
                  idx > 0 && idx % 2 === 0 ? 'pt-4 lg:pt-0' : ''
                } ${idx % 2 === 1 ? 'pt-4 sm:pt-0' : ''} ${idx > 0 ? 'lg:pl-6' : ''}`}
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-zinc-100/90 text-zinc-900 flex items-center justify-center shrink-0 border border-zinc-200/60">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-zinc-950 leading-tight">
                    {b.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-zinc-500 font-medium mt-0.5">
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
