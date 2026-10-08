import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
  PackageCheck,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  Flame,
  HelpCircle,
  FileText,
  Music2,
} from 'lucide-react';

const Facebook = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Instagram = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Youtube = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);
import { StoreSettings } from '../types';

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
      <footer className="mt-auto bg-zinc-950 text-white pt-14 pb-28 sm:pb-12 border-t border-zinc-800 w-full">
        <div className="w-full max-w-[1720px] 2xl:max-w-[1840px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          {/* Main Balanced 12-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 pb-12 border-b border-zinc-800/80">
            {/* Column 1: About Maxora Shop BD (Spans 4 columns) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-2.5">
                {settings.logo_url ? (
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-white p-0.5 flex items-center justify-center shadow-xs shrink-0">
                    <img
                      src={settings.logo_url}
                      alt={settings.store_name || 'Logo'}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-white text-zinc-950 font-black text-xl flex items-center justify-center shadow-xs shrink-0">
                    {(settings.store_name?.trim() || 'M').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-2xl font-black tracking-tight text-white">
                  {settings.store_name || 'Maxora Shop BD'}
                  <span className="text-emerald-500">.</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed pr-2">
                {settings.footer_about ||
                  settings.footer_text ||
                  'Maxora Shop BD is your trusted online shopping partner in Bangladesh for premium lifestyle gadgets, audio, and electronics. Cash on delivery available across all 64 districts.'}
              </p>

              <div className="pt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800 text-[11px] font-semibold text-emerald-400">
                  {settings.footer_badge_1 || '🇧🇩 64 Districts Delivery'}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800 text-[11px] font-semibold text-zinc-300">
                  {settings.footer_badge_2 || '💵 100% Cash on Delivery'}
                </span>
              </div>
            </div>

            {/* Column 2: Quick Links (Spans 2 columns) */}
            <div className="lg:col-span-2 space-y-4 lg:pl-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Quick Links
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-400 font-medium">
                <li>
                  <button
                    type="button"
                    onClick={onScrollToProducts}
                    className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Home</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onScrollToProducts}
                    className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Browse All</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onScrollToHotDeals || onScrollToProducts}
                    className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    <span>🔥 Hot Deals</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenTracker}
                    className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Track Order</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Customer Service (Spans 3 columns) */}
            <div className="lg:col-span-3 space-y-4 lg:pl-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Customer Service
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-400 font-medium">
                <li>
                  <button
                    type="button"
                    onClick={() => openPolicyModal('faq')}
                    className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-left"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                    <span>Frequently Asked Questions</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openPolicyModal('return')}
                    className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-left"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                    <span>Return & Exchange Policy</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openPolicyModal('privacy')}
                    className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-left"
                  >
                    <FileText className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                    <span>Privacy Policy</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openPolicyModal('terms')}
                    className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-left"
                  >
                    <FileText className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                    <span>Terms of Service</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact Info & Support (Spans 3 columns - right boundary aligned) */}
            <div className="lg:col-span-3 space-y-4 lg:pl-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Contact & Support
              </h4>
              <div className="space-y-3 text-xs sm:text-sm text-zinc-400 font-medium">
                {settings.phone && (
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-[11px] text-zinc-500 uppercase font-bold">Helpline</span>
                      <a
                        href={`tel:${settings.phone}`}
                        className="text-white hover:text-emerald-400 transition-colors font-bold text-sm"
                      >
                        {settings.phone}
                      </a>
                    </div>
                  </div>
                )}

                {settings.email && (
                  <div className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-[11px] text-zinc-500 uppercase font-bold">Email</span>
                      <a
                        href={`mailto:${settings.email}`}
                        className="hover:text-white transition-colors"
                      >
                        {settings.email}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[11px] text-zinc-500 uppercase font-bold">Address</span>
                    <span className="text-white text-xs">{settings.address || 'Dhaka, Bangladesh'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[11px] text-zinc-500 uppercase font-bold">Support Hours</span>
                    <span className="text-zinc-300 text-xs">{settings.support_hours || '10:00 AM – 10:00 PM (Daily)'}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Middle Row: Payment Methods & Security Guarantees */}
          <div className="py-6 border-b border-zinc-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left: We Accept + Payment Badges */}
            <div className="flex items-center flex-wrap justify-center md:justify-start gap-x-3 gap-y-2">
              <span className="text-zinc-400 font-semibold text-xs tracking-tight">
                {settings.footer_we_accept_text || "We Accept"}
              </span>

              {/* Nagad Official Logo Badge */}
              {settings.show_nagad_badge !== false && (
                <div
                  className="inline-flex items-center px-2 py-1 bg-white rounded-lg border border-zinc-200/90 shadow-2xs hover:border-[#EC1C24]/60 transition-colors select-none"
                  title="Nagad (নগদ)"
                  aria-label="Nagad"
                >
                  <img
                    src="/images/payments/nagad.svg"
                    alt="Nagad"
                    className="h-5 sm:h-5.5 w-auto object-contain max-w-[68px]"
                    loading="lazy"
                  />
                </div>
              )}

              {/* bKash Official Logo Badge */}
              {settings.show_bkash_badge !== false && (
                <div
                  className="inline-flex items-center px-2 py-1 bg-white rounded-lg border border-zinc-200/90 shadow-2xs hover:border-[#E2136E]/60 transition-colors select-none"
                  title="bKash"
                  aria-label="bKash"
                >
                  <img
                    src="/images/payments/bkash.svg"
                    alt="bKash"
                    className="h-5 sm:h-5.5 w-auto object-contain max-w-[72px]"
                    loading="lazy"
                  />
                </div>
              )}
            </div>

            {/* Right: Security & Delivery Guarantees */}
            <div className="flex items-center flex-wrap justify-center md:justify-end gap-x-4 gap-y-2 text-xs">
              {/* SSL Encrypted Checkout */}
              <span className="flex items-center gap-1.5 text-zinc-400 font-semibold whitespace-nowrap">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{settings.footer_ssl_text || "SSL Encrypted Checkout"}</span>
              </span>

              <span className="text-zinc-700 select-none hidden sm:inline">|</span>

              {/* Cash on Delivery */}
              <span className="flex items-center gap-1.5 text-zinc-400 font-semibold whitespace-nowrap">
                <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{settings.footer_cod_text || "Cash on Delivery"}</span>
              </span>
            </div>
          </div>

          {/* Bottom Bar: Copyright on Left & Social Media Icons on Bottom Right */}
          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            {/* Left: Copyright & Admin link */}
            <div className="flex items-center gap-2 order-2 md:order-1 text-center md:text-left">
              <p className="font-medium text-zinc-400">
                {settings.footer_text || "© 2026 Maxora Shop BD. All Rights Reserved."}
              </p>
              <a
                href="#admin"
                title="Admin Control Panel"
                className="opacity-40 hover:opacity-100 transition-opacity text-[10px] text-zinc-500 hover:text-emerald-400 select-none"
              >
                • Admin
              </a>
            </div>

            {/* Right: Social Media Icons (দান পাশের নিচে) */}
            <div className="order-1 md:order-2 flex items-center gap-3 flex-wrap justify-center md:justify-end">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Follow Us:
              </span>
              <div className="flex items-center gap-2">
                {/* Facebook */}
                <a
                  href={settings.facebook || 'https://facebook.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Follow us on Facebook"
                  aria-label="Facebook"
                  className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-[#1877F2] text-zinc-400 hover:text-white border border-zinc-800 hover:border-[#1877F2]/50 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-2xs cursor-pointer"
                >
                  <Facebook className="w-4 h-4" />
                </a>

                {/* Instagram */}
                <a
                  href={settings.instagram || 'https://instagram.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Follow us on Instagram"
                  aria-label="Instagram"
                  className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-[#E4405F] text-zinc-400 hover:text-white border border-zinc-800 hover:border-[#E4405F]/50 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-2xs cursor-pointer"
                >
                  <Instagram className="w-4 h-4" />
                </a>

                {/* YouTube */}
                <a
                  href={settings.youtube || 'https://youtube.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Subscribe on YouTube"
                  aria-label="YouTube"
                  className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-[#FF0000] text-zinc-400 hover:text-white border border-zinc-800 hover:border-[#FF0000]/50 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-2xs cursor-pointer"
                >
                  <Youtube className="w-4 h-4" />
                </a>

                {/* TikTok */}
                <a
                  href={settings.tiktok || 'https://tiktok.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Follow us on TikTok"
                  aria-label="TikTok"
                  className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-black text-zinc-400 hover:text-pink-400 border border-zinc-800 hover:border-pink-500/40 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-2xs cursor-pointer"
                >
                  <Music2 className="w-4 h-4" />
                </a>

                {/* WhatsApp */}
                {settings.whatsapp && (
                  <a
                    href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Chat on WhatsApp"
                    aria-label="WhatsApp"
                    className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-[#25D366] text-zinc-400 hover:text-white border border-zinc-800 hover:border-[#25D366]/50 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-2xs cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
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
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white text-zinc-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <h3 className="text-xl font-black text-zinc-950 mb-3 pb-2 border-b border-zinc-100">
              {modalContent.title}
            </h3>

            <div className="overflow-y-auto flex-1 text-xs sm:text-sm text-zinc-700 whitespace-pre-line leading-relaxed pr-2">
              {modalContent.content}
            </div>

            <div className="mt-5 pt-3 border-t border-zinc-100 flex justify-end">
              <button
                type="button"
                onClick={() => setModalContent(null)}
                className="px-5 py-2 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
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
