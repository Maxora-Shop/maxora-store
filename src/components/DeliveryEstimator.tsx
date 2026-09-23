import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Truck, Calendar, Clock, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';
import { StoreSettings } from '../types';

interface DeliveryEstimatorProps {
  settings: StoreSettings;
  productPrice: number;
}

interface LocationOption {
  id: string;
  name: string;
  bnName: string;
  region: 'dhaka' | 'sub_dhaka' | 'outside';
}

const POPULAR_LOCATIONS: LocationOption[] = [
  { id: 'dhaka-city', name: 'Dhaka (City Corporation)', bnName: 'ঢাকা সিটি কর্পোরেশন', region: 'dhaka' },
  { id: 'gazipur', name: 'Gazipur', bnName: 'গাজীপুর', region: 'sub_dhaka' },
  { id: 'narayanganj', name: 'Narayanganj', bnName: 'নারায়ণগঞ্জ', region: 'sub_dhaka' },
  { id: 'savar', name: 'Savar', bnName: 'সাভার', region: 'sub_dhaka' },
  { id: 'keraniganj', name: 'Keraniganj', bnName: 'কেরানীগঞ্জ', region: 'sub_dhaka' },
  { id: 'chattogram', name: 'Chattogram (Chittagong)', bnName: 'চট্টগ্রাম', region: 'outside' },
  { id: 'sylhet', name: 'Sylhet', bnName: 'সিলেট', region: 'outside' },
  { id: 'rajshahi', name: 'Rajshahi', bnName: 'রাজশাহী', region: 'outside' },
  { id: 'khulna', name: 'Khulna', bnName: 'খুলনা', region: 'outside' },
  { id: 'barishal', name: 'Barishal', bnName: 'বরিশাল', region: 'outside' },
  { id: 'rangpur', name: 'Rangpur', bnName: 'রংপুর', region: 'outside' },
  { id: 'mymensingh', name: 'Mymensingh', bnName: 'ময়মনসিংহ', region: 'outside' },
  { id: 'cumilla', name: 'Cumilla', bnName: 'কুমিল্লা', region: 'outside' },
  { id: 'other-bd', name: 'Other 64 Districts', bnName: 'অন্যান্য সব জেলা', region: 'outside' },
];

export const DeliveryEstimator: React.FC<DeliveryEstimatorProps> = ({
  settings,
  productPrice,
}) => {
  const [selectedLocId, setSelectedLocId] = useState<string>('dhaka-city');
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 4,
    minutes: 30,
    seconds: 0,
  });

  // Calculate live countdown until next batch cut-off (e.g., 6:00 PM dispatch)
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(18, 0, 0, 0); // 6:00 PM dispatch cut-off

      if (now > cutoff) {
        cutoff.setDate(cutoff.getDate() + 1);
      }

      const diff = Math.max(0, cutoff.getTime() - now.getTime());
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeLocation = useMemo(() => {
    return POPULAR_LOCATIONS.find((l) => l.id === selectedLocId) || POPULAR_LOCATIONS[0];
  }, [selectedLocId]);

  const isFreeDelivery = useMemo(() => {
    if (!settings.free_delivery_enabled) return false;
    const threshold = Number(settings.free_delivery_threshold || 0);
    return threshold > 0 && productPrice >= threshold;
  }, [settings.free_delivery_enabled, settings.free_delivery_threshold, productPrice]);

  const deliveryCost = useMemo(() => {
    if (isFreeDelivery) return 0;
    if (activeLocation.region === 'dhaka') {
      return Number(settings.delivery_inside_dhaka || 70);
    }
    if (activeLocation.region === 'sub_dhaka') {
      return Number(settings.delivery_sub_dhaka || 100);
    }
    return Number(settings.delivery_outside_dhaka || 130);
  }, [activeLocation.region, isFreeDelivery, settings]);

  // Calculate delivery date ranges
  const deliveryDates = useMemo(() => {
    const now = new Date();
    const formatBanglaDate = (date: Date) => {
      const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
      return date.toLocaleDateString('en-GB', options);
    };

    if (activeLocation.region === 'dhaka') {
      const start = new Date(now);
      start.setDate(now.getDate() + 1);
      const end = new Date(now);
      end.setDate(now.getDate() + 2);
      return {
        range: `${formatBanglaDate(start)} – ${formatBanglaDate(end)}`,
        durationText: '২৪ থেকে ৪৮ ঘণ্টার মধ্যে ডেলিভারি',
        speedBadge: 'সুপার ফাস্ট ডেলিভারি',
      };
    } else if (activeLocation.region === 'sub_dhaka') {
      const start = new Date(now);
      start.setDate(now.getDate() + 1);
      const end = new Date(now);
      end.setDate(now.getDate() + 2);
      return {
        range: `${formatBanglaDate(start)} – ${formatBanglaDate(end)}`,
        durationText: '৩৬ থেকে ৪৮ ঘণ্টার মধ্যে ডেলিভারি',
        speedBadge: 'দ্রুত হোম ডেলিভারি',
      };
    } else {
      const start = new Date(now);
      start.setDate(now.getDate() + 2);
      const end = new Date(now);
      end.setDate(now.getDate() + 3);
      return {
        range: `${formatBanglaDate(start)} – ${formatBanglaDate(end)}`,
        durationText: '২ থেকে ৩ কার্যদিবসের মধ্যে ডেলিভারি',
        speedBadge: 'সারাদেশে হোম ডেলিভারি',
      };
    }
  }, [activeLocation.region]);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-zinc-50 via-white to-zinc-50 border border-zinc-200 shadow-xs p-4 sm:p-5 space-y-4">
      {/* Header & Title */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-zinc-900 flex items-center gap-1.5">
              <span>ডেলিভারি চার্জ ও সময় ক্যালকুলেটর</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800">
                Live
              </span>
            </h4>
            <p className="text-[10px] text-zinc-500">আপনার জেলা নির্বাচন করে সময় ও খরচ দেখে নিন</p>
          </div>
        </div>

        {/* Dispatch Countdown Timer */}
        <div className="flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span>
            আজ ডিসপ্যাচ হতে আর বাকি:{' '}
            <span className="font-black text-amber-950 font-mono">
              {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
            </span>
          </span>
        </div>
      </div>

      {/* Location Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <label className="sm:col-span-4 text-xs font-bold text-zinc-700 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>ডেলিভারি এরিয়া / জেলা:</span>
        </label>
        <div className="sm:col-span-8">
          <select
            value={selectedLocId}
            onChange={(e) => setSelectedLocId(e.target.value)}
            className="w-full bg-white text-zinc-900 text-xs font-bold p-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:border-emerald-600 shadow-2xs cursor-pointer hover:border-zinc-400 transition-colors"
          >
            <optgroup label="ঢাকা অঞ্চল">
              {POPULAR_LOCATIONS.filter((l) => l.region === 'dhaka' || l.region === 'sub_dhaka').map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.bnName} ({loc.name})
                </option>
              ))}
            </optgroup>
            <optgroup label="বিভাগ ও অন্যান্য জেলাসমূহ">
              {POPULAR_LOCATIONS.filter((l) => l.region === 'outside').map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.bnName} ({loc.name})
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Delivery Details Result Box */}
      <div className="p-3.5 rounded-xl bg-zinc-100/70 border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Estimated Date */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-700" />
            <span className="text-[11px] font-medium text-zinc-600">সম্ভাব্য ডেলিভারি তারিখ:</span>
          </div>
          <p className="text-sm font-black text-zinc-950 flex items-center gap-2">
            <span>{deliveryDates.range}</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
              {deliveryDates.speedBadge}
            </span>
          </p>
          <p className="text-[10px] text-zinc-500">{deliveryDates.durationText}</p>
        </div>

        {/* Cost & Free Shipping Status */}
        <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-200">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
            ডেলিভারি চার্জ:
          </span>
          {isFreeDelivery ? (
            <div className="flex sm:justify-end items-center gap-1.5 mt-0.5">
              <span className="text-xs font-semibold text-zinc-400 line-through">
                ৳{activeLocation.region === 'dhaka' ? 70 : 130}
              </span>
              <span className="text-sm font-black text-emerald-700 bg-emerald-100/80 border border-emerald-300/80 px-2 py-0.5 rounded-md">
                FREE (ফ্রি ডেলিভারি 🎉)
              </span>
            </div>
          ) : (
            <div className="text-base sm:text-lg font-black text-zinc-950 mt-0.5">
              ৳{deliveryCost.toLocaleString('en-BD')}
            </div>
          )}
          {settings.free_delivery_enabled && !isFreeDelivery && Number(settings.free_delivery_threshold || 0) > 0 && (
            <p className="text-[10px] text-amber-800 font-bold mt-0.5">
              💡 ৳{Number(settings.free_delivery_threshold).toLocaleString('en-BD')} টাকার অর্ডারে ফ্রি ডেলিভারি!
            </p>
          )}
        </div>
      </div>

      {/* Trust & Guarantee Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
        <div className="flex items-center gap-1.5 text-zinc-700 bg-white p-2 rounded-lg border border-zinc-200/70">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-bold">১০০% ক্যাশ অন ডেলিভারি</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-700 bg-white p-2 rounded-lg border border-zinc-200/70">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="font-bold">পণ্য চেক করে গ্রহণ</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-700 bg-white p-2 rounded-lg border border-zinc-200/70">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="font-bold">১০০% অথেনটিক আসল পণ্য</span>
        </div>
      </div>
    </div>
  );
};
