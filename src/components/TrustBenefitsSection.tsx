import React from 'react';
import { Banknote, ShieldCheck, Truck, RefreshCw, CheckCircle2 } from 'lucide-react';

export const TrustBenefitsSection: React.FC = () => {
  const benefits = [
    {
      icon: Banknote,
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'Cash on Delivery',
      subtitle: 'Pay after receiving your product',
      badge: '100% Secure',
      highlight: 'text-emerald-700',
    },
    {
      icon: ShieldCheck,
      iconBg: 'bg-blue-50 text-blue-700 border-blue-200',
      title: '100% Quality Checked',
      subtitle: 'Verified products before shipping',
      badge: 'Zero Defect',
      highlight: 'text-blue-700',
    },
    {
      icon: Truck,
      iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
      title: 'Fast Delivery',
      subtitle: 'Nationwide shipping in Bangladesh',
      badge: '64 Districts',
      highlight: 'text-amber-700',
    },
    {
      icon: RefreshCw,
      iconBg: 'bg-purple-50 text-purple-700 border-purple-200',
      title: 'Easy Exchange',
      subtitle: 'Customer friendly support & exchange policy',
      badge: 'Hassle-Free',
      highlight: 'text-purple-700',
    },
  ];

  return (
    <section className="my-8 sm:my-12 w-full">
      <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 mb-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Shop with Total Confidence</span>
        </div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-zinc-950 tracking-tight">
          Why Shop with Maxora?
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-medium">
          We guarantee authentic products and seamless doorstep shopping everywhere in Bangladesh.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {benefits.map((b, idx) => {
          const Icon = b.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs ${b.iconBg}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 ${b.highlight}`}>
                  {b.badge}
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-black text-zinc-950 mb-1 leading-snug">
                  {b.title}
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  {b.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
