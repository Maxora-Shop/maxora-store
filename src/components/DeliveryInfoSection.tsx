import React from 'react';
import { MapPin, Clock, Banknote, ShieldAlert, CheckCircle, Package } from 'lucide-react';

export const DeliveryInfoSection: React.FC = () => {
  return (
    <section className="my-8 sm:my-12 w-full bg-zinc-950 text-white rounded-3xl p-5 sm:p-8 lg:p-10 relative overflow-hidden shadow-lg">
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold mb-3">
            <Package className="w-3.5 h-3.5" />
            <span>Fast & Transparent Shipping</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Delivery & Shipping Rates
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
            Affordable flat delivery charges with doorstep parcel checking and Cash on Delivery across 64 districts.
          </p>
        </div>

        {/* 3 Columns / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Inside Dhaka */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-emerald-500/50 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-md">
                  Inside Dhaka
                </span>
                <span className="text-2xl font-black text-white">৳70</span>
              </div>
              <h3 className="text-base font-black text-white mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Dhaka City Corporation</span>
              </h3>
              <div className="flex items-center gap-2 text-xs text-zinc-300 font-semibold mb-3">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>24 - 48 Hours Delivery</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Fast courier delivery to all areas within Dhaka metropolitan area directly to your address.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Same Day Handover Available</span>
            </div>
          </div>

          {/* Card 2: Outside Dhaka */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-amber-500/50 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 rounded-md">
                  Outside Dhaka
                </span>
                <span className="text-2xl font-black text-white">৳130</span>
              </div>
              <h3 className="text-base font-black text-white mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>All 64 Districts</span>
              </h3>
              <div className="flex items-center gap-2 text-xs text-zinc-300 font-semibold mb-3">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>48 - 72 Hours Delivery</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Reliable doorstep delivery via top tier courier services to any Upazila or District across Bangladesh.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Doorstep Delivery Guaranteed</span>
            </div>
          </div>

          {/* Card 3: Payment Method */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-blue-500/50 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2.5 py-1 rounded-md">
                  Payment Method
                </span>
                <span className="text-xs font-black text-emerald-400 bg-emerald-900/40 px-2 py-1 rounded">100% COD</span>
              </div>
              <h3 className="text-base font-black text-white mb-2 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-blue-400" />
                <span>Cash on Delivery</span>
              </h3>
              <div className="flex items-center gap-2 text-xs text-zinc-300 font-semibold mb-3">
                <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Pay After Receiving Product</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                No advance payment required. Open, verify the product in front of the delivery agent, then make payment.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center gap-1.5 text-[11px] font-bold text-blue-400">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Zero Advance Risk</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
