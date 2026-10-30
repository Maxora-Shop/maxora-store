import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Truck,
  Headphones,
  Sparkles,
  HeartHandshake,
  Award,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Clock,
  ArrowLeft,
  ShoppingBag,
  CheckCircle2,
  Users,
  Building2,
  Quote,
  ExternalLink,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { AboutPageData, defaultAboutPageData, FeatureCard } from '../../backend/models/aboutPageSchema';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AboutUsPageProps {
  onBackToStore?: () => void;
  onNavigateHome?: () => void;
  onExploreProducts?: () => void;
  storeName?: string;
  storePhone?: string;
  storeEmail?: string;
}

export const AboutUsPage: React.FC<AboutUsPageProps> = ({
  onBackToStore,
  onNavigateHome,
  onExploreProducts,
  storeName = 'Maxora',
  storePhone,
  storeEmail
}) => {
  const [data, setData] = useState<AboutPageData>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('maxora_about_page_v1');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.title) return parsed;
        }
      } catch {}
    }
    return defaultAboutPageData;
  });
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch dynamic About Us data from backend API and Firestore
  useEffect(() => {
    let isMounted = true;

    const fetchAboutData = async () => {
      try {
        let fetchedData: any = null;

        // 1. Try backend REST API first with safe response parsing
        try {
          const response = await fetch('/api/about');
          const text = await response.text();
          let json: any = null;
          try {
            json = text ? JSON.parse(text) : null;
          } catch {}

          if (response.ok && json && json.data) {
            fetchedData = json.data;
          }
        } catch (apiErr) {
          console.warn('REST API about fetch warning:', apiErr);
        }

        // 2. If REST API did not return data, query Firestore directly
        if (!fetchedData && db) {
          try {
            const snap = await getDoc(doc(db, 'settings', 'about_page'));
            if (snap.exists()) {
              fetchedData = snap.data();
            } else {
              const snap2 = await getDoc(doc(db, 'site_settings', 'about_page'));
              if (snap2.exists()) {
                fetchedData = snap2.data();
              }
            }
          } catch (fsErr) {
            console.warn('Firestore about fetch note:', fsErr);
          }
        }

        if (fetchedData && isMounted) {
          setData(fetchedData);
          try {
            localStorage.setItem('maxora_about_page_v1', JSON.stringify(fetchedData));
          } catch {}
        }
      } catch (err) {
        console.warn('Could not fetch dynamic About Us data, using defaults:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAboutData();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      isMounted = false;
    };
  }, []);

  // Icon mapping helper
  const renderFeatureIcon = (iconName: string) => {
    const className = "w-6 h-6 text-emerald-600";
    switch ((iconName || '').toLowerCase()) {
      case 'truck':
        return <Truck className={className} />;
      case 'headphones':
      case 'support':
        return <Headphones className={className} />;
      case 'sparkles':
        return <Sparkles className={className} />;
      case 'hearthandshake':
      case 'heart':
        return <HeartHandshake className={className} />;
      case 'award':
        return <Award className={className} />;
      case 'shieldcheck':
      case 'shield':
      default:
        return <ShieldCheck className={className} />;
    }
  };

  const handleReturn = () => {
    if (onBackToStore) {
      onBackToStore();
    } else if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.location.hash = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Merge contact info with props if missing
  const activePhone = data.contact_info?.phone || storePhone || '01635451746';
  const activeEmail = data.contact_info?.email || storeEmail || 'support@maxorabd.com';
  const activeAddress = data.contact_info?.address || 'বাড়ি #১২, রোড #০৪, সেক্টর #১১, উত্তরা, ঢাকা-১২৩০, বাংলাদেশ';
  const activeWhatsApp = data.contact_info?.whatsapp || activePhone;

  return (
    <div className="min-h-screen bg-slate-50/60 text-zinc-900 selection:bg-emerald-600 selection:text-white pb-24">
      {/* 1. Top Breadcrumb & Return Bar */}
      <div className="bg-white border-b border-zinc-200/80 sticky top-0 z-30 shadow-2xs backdrop-blur-md bg-white/95">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-500 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={handleReturn}
              className="text-zinc-600 hover:text-emerald-700 font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0"
            >
              <span>হোম</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="font-bold text-zinc-900 shrink-0">আমাদের সম্পর্কে (About Us)</span>
          </div>

          <button
            type="button"
            onClick={handleReturn}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200/90 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>স্টোরে ফিরে যান</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-12 sm:space-y-16">
        {/* 2. Hero Header Section */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white p-6 sm:p-12 lg:p-14 overflow-hidden shadow-xl border border-slate-800">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs sm:text-sm font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{storeName} বাংলাদেশ · বিশ্বস্ত অনলাইন শপিং পরিবার</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight sm:leading-tight text-white">
              {data.title || "আমাদের সম্পর্কে - ম্যাক্সোরা বাংলাদেশ"}
            </h1>

            <p className="text-sm sm:text-lg text-slate-300 font-normal leading-relaxed">
              {data.subtitle || "১০০% প্রিমিয়াম কোয়ালিটি লাইফস্টাইল পণ্য, দ্রুততম হোম ডেলিভারি ও শতভাগ গ্রাহক আস্থার অঙ্গীকার।"}
            </p>

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 sm:pt-4 border-t border-slate-700/60">
              <div className="bg-slate-800/60 backdrop-blur-xs p-3 sm:p-4 rounded-2xl border border-slate-700/80">
                <div className="text-lg sm:text-2xl font-black text-emerald-400">
                  {data.happy_customers_count || "২৫,০০০+"}
                </div>
                <div className="text-[11px] sm:text-xs text-slate-300 font-medium mt-0.5">
                  সন্তুষ্ট গ্রাহক
                </div>
              </div>
              <div className="bg-slate-800/60 backdrop-blur-xs p-3 sm:p-4 rounded-2xl border border-slate-700/80">
                <div className="text-lg sm:text-2xl font-black text-teal-400">
                  {data.total_deliveries || "৩৫,০০০+"}
                </div>
                <div className="text-[11px] sm:text-xs text-slate-300 font-medium mt-0.5">
                  সফল ডেলিভারি
                </div>
              </div>
              <div className="bg-slate-800/60 backdrop-blur-xs p-3 sm:p-4 rounded-2xl border border-slate-700/80">
                <div className="text-lg sm:text-2xl font-black text-amber-400">
                  ১০০%
                </div>
                <div className="text-[11px] sm:text-xs text-slate-300 font-medium mt-0.5">
                  অরিজিনাল পণ্য
                </div>
              </div>
              <div className="bg-slate-800/60 backdrop-blur-xs p-3 sm:p-4 rounded-2xl border border-slate-700/80">
                <div className="text-lg sm:text-2xl font-black text-sky-400">
                  ৬৪ জেলা
                </div>
                <div className="text-[11px] sm:text-xs text-slate-300 font-medium mt-0.5">
                  হোম ডেলিভারি
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Brand Story & Mission Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 bg-white p-6 sm:p-10 rounded-3xl border border-zinc-200/90 shadow-xs space-y-6">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-6 bg-emerald-600 rounded-full" />
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                আমাদের ব্র্যান্ডের গল্প (Our Story)
              </h2>
            </div>

            <div className="prose prose-zinc max-w-none text-zinc-700 text-sm sm:text-base leading-relaxed space-y-4">
              {data.brand_story ? (
                data.brand_story.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="whitespace-pre-line leading-relaxed text-zinc-700">
                    {paragraph}
                  </p>
                ))
              ) : (
                <p>ম্যাক্সোরা বাংলাদেশ খাঁটি ও প্রিমিয়াম গ্যাজেট সরবরাহের একটি বিশ্বস্ত প্ল্যাটফর্ম।</p>
              )}
            </div>

            {/* Mission & Vision Mini Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-150">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>আমাদের মূল লক্ষ্য (Our Mission)</span>
                </div>
                <p className="text-xs sm:text-[13px] text-emerald-950/80 leading-relaxed">
                  {data.mission || "বাংলাদেশের প্রতিটি প্রান্তে সেরা কোয়ালিটির গ্যাজেট ও লাইফস্টাইল পণ্য সাশ্রয়ী মূল্যে নিরাপদে পৌঁছে দেওয়া।"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-1.5">
                <div className="flex items-center gap-2 text-teal-900 font-black text-xs sm:text-sm">
                  <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>ভবিষ্যৎ ভাবনা (Our Vision)</span>
                </div>
                <p className="text-xs sm:text-[13px] text-teal-950/80 leading-relaxed">
                  {data.vision || "সততা, প্রিমিয়াম গ্রাহক সেবা ও আধুনিক প্রযুক্তির সমন্বয়ে দেশের শীর্ষস্থানীয় নির্ভরযোগ্য ই-কমার্স ব্র্যান্ড হওয়া।"}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Contact & Working Hours Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-zinc-200/90 shadow-xs space-y-5">
              <h3 className="font-black text-base text-zinc-900 pb-3 border-b border-zinc-150 flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>যোগাযোগ ও কাস্টমার কেয়ার</span>
              </h3>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">হটলাইন / মোবাইল</div>
                    <a
                      href={`tel:${activePhone}`}
                      className="font-bold text-zinc-900 hover:text-emerald-700 transition-colors font-mono"
                    >
                      {activePhone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">অফিসিয়াল ইমেইল</div>
                    <a
                      href={`mailto:${activeEmail}`}
                      className="font-bold text-zinc-900 hover:text-emerald-700 transition-colors truncate block"
                    >
                      {activeEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">কর্পোরেট ঠিকানা</div>
                    <div className="text-zinc-700 font-medium leading-relaxed">
                      {activeAddress}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">সেবা দেওয়ার সময়</div>
                    <div className="text-zinc-700 font-medium">
                      {data.contact_info?.working_hours || "সকাল ১০:০০ টা - রাত ১০:০০ টা (প্রতিদিন)"}
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp direct chat link */}
              {activeWhatsApp && (
                <a
                  href={`https://wa.me/${activeWhatsApp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs sm:text-sm py-3 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                  <span>হোয়াটসঅ্যাপে সরাসরি কথা বলুন</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* 4. Three Feature Cards Section */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
              <Award className="w-3.5 h-3.5" />
              <span>আমাদের ৩টি মূল অঙ্গীকার</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              কেন ম্যাক্সোরা বাংলাদেশ অন্যদের চেয়ে আলাদা?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500">
              আমরা কোনো সাধারণ অনলাইন শপ নই, প্রতিটি অর্ডারে কোয়ালিটি ও বিশ্বস্ততার নিশ্চয়তা দিই।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(data.features || defaultAboutPageData.features).slice(0, 3).map((feature: FeatureCard, idx: number) => (
              <div
                key={feature.id || idx}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200/90 hover:border-emerald-500 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-6 -mt-6 transition-all group-hover:scale-125 group-hover:bg-emerald-100/60" />

                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      {renderFeatureIcon(feature.icon)}
                    </div>
                    {feature.badge && (
                      <span className="text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-full bg-zinc-100 group-hover:bg-emerald-50 text-zinc-700 group-hover:text-emerald-800 border border-zinc-200/80 transition-colors">
                        {feature.badge}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-black text-base sm:text-lg text-zinc-900 group-hover:text-emerald-800 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-100 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>যাচাইকৃত গ্রাহক প্রতিশ্রুতি</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Dynamic CEO Profile Section */}
        <div className="bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 rounded-3xl border border-emerald-200/80 p-6 sm:p-10 lg:p-12 shadow-sm space-y-8">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* CEO Image Card */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-zinc-100 flex items-center justify-center group">
                {data.ceo_image_url ? (
                  <img
                    src={data.ceo_image_url}
                    alt={data.ceo_name || "CEO"}
                    width={208}
                    height={208}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      // Fallback if local image not found
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center space-y-2 bg-gradient-to-tr from-emerald-100 to-teal-50 w-full h-full text-emerald-800">
                    <UserCheck className="w-16 h-16 text-emerald-600" />
                    <span className="text-xs font-black tracking-wide uppercase">প্রতিষ্ঠাতা ও সিইও</span>
                  </div>
                )}
                {/* Verified Ribbon */}
                <div className="absolute bottom-2 inset-x-2 bg-zinc-950/80 backdrop-blur-xs text-white text-[10px] font-bold py-1 px-2 rounded-xl text-center border border-white/20">
                  ভেরিফায়েড লিডারশিপ
                </div>
              </div>
            </div>

            {/* CEO Message & Details */}
            <div className="flex-1 space-y-5 text-center lg:text-left">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                  <Quote className="w-3.5 h-3.5" />
                  <span>প্রতিষ্ঠাতার বিশেষ বার্তা</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-zinc-900">
                  {data.ceo_name || "Lutas Biswas"}
                </h3>
                <p className="text-xs sm:text-sm font-bold text-emerald-700">
                  {data.ceo_title || "প্রতিষ্ঠাতা ও প্রধান নির্বাহী কর্মকর্তা (Founder & CEO)"}
                </p>
              </div>

              <div className="relative bg-white/80 backdrop-blur-xs p-5 sm:p-6 rounded-2xl border border-emerald-100 shadow-2xs">
                <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed whitespace-pre-line italic">
                  "{data.ceo_message || defaultAboutPageData.ceo_message}"
                </p>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-4 text-xs text-zinc-500">
                <span className="font-semibold text-zinc-700">ম্যাক্সোরা বাংলাদেশ পরিবার</span>
                <span>•</span>
                <span>প্রতিষ্ঠিত: {data.established_year || "২০২৩"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Bottom Reassurance Call to Action */}
        <div className="bg-[#0f172a] rounded-3xl p-6 sm:p-10 text-white text-center space-y-4 shadow-xl border border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              আজই উপভোগ করুন নিরাপদ ও প্রিমিয়াম অনলাইন শপিং
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              ক্যাশ অন ডেলিভারি এবং দ্রুততম কুরিয়ার সুবিধাসহ আমাদের হাজারো গ্যাজেট ও লাইফস্টাইল কালেকশন ব্রাউজ করুন।
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (onExploreProducts) {
                  onExploreProducts();
                } else {
                  handleReturn();
                }
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black text-xs sm:text-sm px-6 py-3 rounded-xl transition-all cursor-pointer shadow-md hover:scale-105"
            >
              প্রোডাক্ট ক্যাটালগ দেখুন
            </button>
            <button
              type="button"
              onClick={handleReturn}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all cursor-pointer border border-slate-700"
            >
              হোমপেজে ফিরে যান
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;
