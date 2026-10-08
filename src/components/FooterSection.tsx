import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  PackageCheck,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  Flame,
  HelpCircle,
  FileText,
  CheckCircle2,
  Lock,
  Headphones,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { StoreSettings } from '../types';

/* Premium Custom Vector SVG Icons */
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-.88-.06A6.34 6.34 0 0 0 3.14 15.7 6.34 6.34 0 0 0 9.48 22a6.34 6.34 0 0 0 6.34-6.33V9.22a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.65z" />
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

interface FooterSectionProps {
  settings: StoreSettings;
  onOpenTracker: () => void;
  onScrollToProducts: () => void;
  onSelectCategory?: (cat: string) => void;
  onScrollToHotDeals?: () => void;
}

export const FooterSection: React.FC<FooterSectionProps> = ({
  settings,
  onOpenTracker,
  onScrollToProducts,
  onSelectCategory,
  onScrollToHotDeals,
}) => {
  const [modalContent, setModalContent] = useState<{ title: string; content: string } | null>(null);

  const openPolicyModal = (type: 'faq' | 'return' | 'privacy' | 'terms') => {
    if (type === 'faq') {
      setModalContent({
        title: 'Frequently Asked Questions (FAQ)',
        content: settings.faq_content || `
**Q: How do I place an order?**
A: Select any product, click "Add to Cart" or "Buy Now", fill in your name, phone number, and delivery address. Your order will be confirmed immediately!

**Q: Do I need to make any advance payment?**
A: No! Maxora Shop BD provides 100% Cash on Delivery across all 64 districts in Bangladesh. You pay only after receiving and checking your parcel.

**Q: What is the delivery time?**
A: Inside Dhaka City: 24 - 48 Hours. Outside Dhaka: 48 - 72 Hours.

**Q: Can I check the product before receiving?**
A: Yes! You can inspect the package in front of the courier delivery agent before completing payment.
        `,
      });
    } else if (type === 'return') {
      setModalContent({
        title: 'Return & Exchange Policy',
        content: settings.return_policy_content || `
At Maxora Shop BD, customer satisfaction is our top priority:

1. **Delivery Inspection & Return**: Please check the product thoroughly in front of the courier delivery agent. If any defect or issue is noticed upon delivery, you can return it directly with the delivery agent or contact our hotline immediately.
2. **Authenticity Guarantee**: All products on Maxora are 100% brand new, authentic, and inspected prior to shipping.
3. **Condition**: If returned at delivery, the item must be in its original packaging with all included accessories intact.
        `,
      });
    } else if (type === 'privacy') {
      setModalContent({
        title: 'Privacy Policy',
        content: settings.privacy_policy_content || `
Maxora Shop BD respects your personal privacy:
- Your name, phone number, and delivery address are strictly used to fulfill and deliver your orders safely.
- We do not sell, rent, or share your private customer data with any third-party advertisers.
- All order records and customer communications are encrypted and kept confidential.
        `,
      });
    } else if (type === 'terms') {
      setModalContent({
        title: 'Terms of Service',
        content: settings.terms_policy_content || `
1. All prices displayed on Maxora Shop BD are in Bangladeshi Taka (BDT) and include all applicable taxes.
2. Delivery charges: ৳70 within Dhaka City, ৳100 Dhaka sub-areas, ৳130 outside Dhaka.
3. Orders are verified by phone call or SMS before dispatch to ensure genuine delivery details.
4. Maxora Shop BD reserves the right to cancel orders with unverified or unreachable contact details.
        `,
      });
    }
  };

  return (
    <>
      <footer className="mt-auto relative bg-[#07080c] text-white pt-16 pb-28 sm:pb-14 border-t border-zinc-800/90 w-full overflow-hidden">
        {/* Subtle Luxury Ambient Glow Effect on Top Border */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[220px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative w-full max-w-[1720px] 2xl:max-w-[1840px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          {/* Main 12-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-zinc-800/80">
            {/* Column 1: Brand Identity & Story (Spans 4 columns) */}
            <div className="lg:col-span-4 space-y-5">
              <div className="flex items-center gap-3">
                {settings.logo_url ? (
                  <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white p-1 flex items-center justify-center shadow-lg ring-1 ring-white/10 shrink-0">
                    <img
                      src={settings.logo_url}
                      alt={settings.store_name || 'Logo'}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-black text-xl flex items-center justify-center shadow-lg ring-1 ring-white/20 shrink-0">
                    {(settings.store_name?.trim() || 'M').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-2xl font-black tracking-tight text-white flex items-center">
                    {settings.store_name || 'Maxora Shop BD'}
                    <span className="text-emerald-400 font-extrabold ml-0.5">.</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
                    Premium Lifestyle & Tech
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed pr-2">
                {settings.footer_about ||
                  settings.footer_text ||
                  'Maxora Shop BD is your trusted online shopping partner in Bangladesh for premium lifestyle gadgets, audio, and electronics. Cash on delivery available across all 64 districts.'}
              </p>

              {/* Trust Badges */}
              <div className="pt-1 flex flex-wrap gap-2.5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900/90 rounded-full border border-zinc-800/90 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-[11px] font-semibold text-zinc-300">
                    {settings.footer_badge_1 || '64 Districts Express Delivery'}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900/90 rounded-full border border-zinc-800/90 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-[11px] font-semibold text-zinc-300">
                    {settings.footer_badge_2 || '100% Cash on Delivery'}
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Quick Links (Spans 2 columns) */}
            <div className="lg:col-span-2 space-y-4 lg:pl-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Quick Links
              </h4>
              <ul className="space-y-3 text-xs sm:text-sm font-medium">
                <li>
                  <button
                    type="button"
                    onClick={onScrollToProducts}
                    className="group text-zinc-400 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                    <span>Home</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onScrollToProducts}
                    className="group text-zinc-400 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                    <span>Browse All</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onScrollToHotDeals || onScrollToProducts}
                    className="group text-zinc-400 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Flame className="w-3.5 h-3.5 text-rose-500 group-hover:scale-110 transition-transform" />
                    <span className="text-rose-400/90 group-hover:text-rose-300 font-semibold">Hot Deals</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenTracker}
                    className="group text-zinc-400 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <PackageCheck className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>Track Order</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Customer Service & Policies (Spans 3 columns) */}
            <div className="lg:col-span-3 space-y-4 lg:pl-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Customer Care
              </h4>
              <ul className="space-y-3 text-xs sm:text-sm font-medium">
                <li>
                  <button
                    type="button"
                    onClick={() => openPolicyModal('faq')}
                    className="group text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-2 text-left"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400 transition-colors shrink-0" />
                    <span>Frequently Asked Questions</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openPolicyModal('return')}
                    className="group text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-2 text-left"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400 transition-colors shrink-0" />
                    <span>Return & Exchange Policy</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openPolicyModal('privacy')}
                    className="group text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-2 text-left"
                  >
                    <FileText className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400 transition-colors shrink-0" />
                    <span>Privacy Policy</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openPolicyModal('terms')}
                    className="group text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-2 text-left"
                  >
                    <FileText className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400 transition-colors shrink-0" />
                    <span>Terms of Service</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact & Support (Spans 3 columns) */}
            <div className="lg:col-span-3 space-y-4 lg:pl-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Support Concierge
              </h4>

              {/* Luxury Contact Card */}
              <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4 space-y-3.5 shadow-md">
                {settings.phone && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Helpline</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] text-emerald-400 font-semibold">Active</span>
                      </div>
                      <a
                        href={`tel:${settings.phone}`}
                        className="text-white hover:text-emerald-400 transition-colors font-black text-sm tracking-wide block"
                      >
                        {settings.phone}
                      </a>
                    </div>
                  </div>
                )}

                {settings.email && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Email</span>
                      <a
                        href={`mailto:${settings.email}`}
                        className="text-zinc-300 hover:text-white transition-colors text-xs font-medium truncate block"
                      >
                        {settings.email}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Showroom / Hub</span>
                    <span className="text-zinc-300 text-xs font-medium leading-tight block">
                      {settings.address || 'Dhaka, Bangladesh'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Support Hours</span>
                    <span className="text-zinc-300 text-xs font-medium leading-tight block">
                      {settings.support_hours || '10:00 AM – 10:00 PM (Daily)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Ribbon: Verified Payment Methods & Security Guarantees */}
          <div className="py-6 border-b border-zinc-800/80 flex flex-col md:flex-row items-center justify-between gap-5">
            {/* Left: Verified Payment Partners */}
            <div className="flex items-center flex-wrap justify-center md:justify-start gap-x-3 gap-y-2">
              <span className="text-zinc-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                {settings.footer_we_accept_text || 'Payment Partners:'}
              </span>

              {/* Nagad Official Logo Badge */}
              {settings.show_nagad_badge !== false && (
                <div
                  className="inline-flex items-center px-2.5 py-1.5 bg-white rounded-xl border border-zinc-200/90 shadow-sm hover:border-[#EC1C24] transition-all duration-300 hover:scale-105 select-none"
                  title="Nagad (নগদ)"
                  aria-label="Nagad"
                >
                  <img
                    src="/images/payments/nagad.svg"
                    alt="Nagad"
                    className="h-5 sm:h-5.5 w-auto object-contain max-w-[70px]"
                    loading="lazy"
                  />
                </div>
              )}

              {/* bKash Official Logo Badge */}
              {settings.show_bkash_badge !== false && (
                <div
                  className="inline-flex items-center px-2.5 py-1.5 bg-white rounded-xl border border-zinc-200/90 shadow-sm hover:border-[#E2136E] transition-all duration-300 hover:scale-105 select-none"
                  title="bKash (বিকাশ)"
                  aria-label="bKash"
                >
                  <img
                    src="/images/payments/bkash.svg"
                    alt="bKash"
                    className="h-5 sm:h-5.5 w-auto object-contain max-w-[74px]"
                    loading="lazy"
                  />
                </div>
              )}
            </div>

            {/* Right: Security & Delivery Trustmarks */}
            <div className="flex items-center flex-wrap justify-center md:justify-end gap-x-5 gap-y-2 text-xs">
              <span className="flex items-center gap-1.5 text-zinc-300 font-semibold whitespace-nowrap">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{settings.footer_ssl_text || '256-Bit SSL Encrypted'}</span>
              </span>

              <span className="text-zinc-700 select-none hidden sm:inline">•</span>

              <span className="flex items-center gap-1.5 text-zinc-300 font-semibold whitespace-nowrap">
                <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{settings.footer_cod_text || '100% Cash on Delivery'}</span>
              </span>

              <span className="text-zinc-700 select-none hidden sm:inline">•</span>

              <span className="flex items-center gap-1.5 text-zinc-300 font-semibold whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Check Parcel Before Pay</span>
              </span>
            </div>
          </div>

          {/* Bottom Bar: Copyright on Left & Social Media Icons on Bottom Right (দান পাশের নিচে) */}
          <div className="pt-7 flex flex-col md:flex-row items-center justify-between gap-5 text-xs">
            {/* Left: Copyright & Brand Guarantee */}
            <div className="order-2 md:order-1 text-center md:text-left space-y-1">
              <p className="font-semibold text-zinc-300 tracking-wide">
                {settings.footer_text || `© ${new Date().getFullYear()} ${settings.store_name || 'Maxora Shop BD'}. All Rights Reserved.`}
              </p>
              <p className="text-[11px] text-zinc-400">
                Crafted for genuine gadgets, electronics & lifestyle accessories in Bangladesh.
              </p>
            </div>

            {/* Right: Social Media Icons (দান পাশের নিচে) */}
            <div className="order-1 md:order-2 flex items-center gap-3.5 flex-wrap justify-center md:justify-end">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Follow Us:
              </span>
              <div className="flex items-center gap-2 sm:gap-2.5">
                {/* Facebook */}
                <a
                  href={settings.facebook || 'https://facebook.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Follow on Facebook"
                  aria-label="Facebook"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-900/90 text-zinc-400 hover:text-white border border-zinc-800 hover:border-[#1877F2]/80 hover:bg-[#1877F2] flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 shadow-sm hover:shadow-[0_0_15px_rgba(24,119,242,0.4)] cursor-pointer"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>

                {/* Instagram */}
                <a
                  href={settings.instagram || 'https://instagram.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Follow on Instagram"
                  aria-label="Instagram"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-900/90 text-zinc-400 hover:text-white border border-zinc-800 hover:border-pink-500/80 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 shadow-sm hover:shadow-[0_0_15px_rgba(225,48,108,0.4)] cursor-pointer"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>

                {/* YouTube */}
                <a
                  href={settings.youtube || 'https://youtube.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Subscribe on YouTube"
                  aria-label="YouTube"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-900/90 text-zinc-400 hover:text-white border border-zinc-800 hover:border-[#FF0000]/80 hover:bg-[#FF0000] flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 shadow-sm hover:shadow-[0_0_15px_rgba(255,0,0,0.4)] cursor-pointer"
                >
                  <YoutubeIcon className="w-4 h-4" />
                </a>

                {/* TikTok */}
                <a
                  href={settings.tiktok || 'https://tiktok.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Follow on TikTok"
                  aria-label="TikTok"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-900/90 text-zinc-400 hover:text-white border border-zinc-800 hover:border-pink-500/60 hover:bg-zinc-950 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 shadow-sm hover:shadow-[0_0_15px_rgba(254,44,85,0.4)] cursor-pointer"
                >
                  <TikTokIcon className="w-4 h-4 text-white group-hover:text-pink-400" />
                </a>

                {/* WhatsApp */}
                {settings.whatsapp && (
                  <a
                    href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Chat on WhatsApp"
                    aria-label="WhatsApp"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-900/90 text-zinc-400 hover:text-white border border-zinc-800 hover:border-[#25D366]/80 hover:bg-[#25D366] flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 shadow-sm hover:shadow-[0_0_15px_rgba(37,211,102,0.4)] cursor-pointer"
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Policy / FAQ Modal */}
      {modalContent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 transition-all"
        >
          <div className="bg-zinc-900 text-white border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative max-h-[85vh] flex flex-col">
            <h3 className="text-lg sm:text-xl font-black text-white mb-3 pb-3 border-b border-zinc-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {modalContent.title}
            </h3>

            <div className="overflow-y-auto flex-1 text-xs sm:text-sm text-zinc-300 whitespace-pre-line leading-relaxed pr-2">
              {modalContent.content}
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setModalContent(null)}
                className="px-6 py-2.5 rounded-xl bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
