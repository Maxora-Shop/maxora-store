import React, { useState } from 'react';
import { MessageCircle, Phone, X, Send, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { StoreSettings } from '../types';

interface FloatingSupportButtonProps {
  settings: StoreSettings;
}

export const FloatingSupportButton: React.FC<FloatingSupportButtonProps> = ({ settings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const phone = settings.phone || '+8801700000000';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  // Bangladesh WhatsApp format: standard BD numbers start with 01... or 8801...
  const waNumber = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}`;

  const handleOpenWhatsApp = (customMsg?: string) => {
    const text = encodeURIComponent(
      customMsg || `Hello ${settings.store_name || 'Maxora'}, I have a question about an order or product on your store.`
    );
    const waUrl = `https://wa.me/${waNumber}?text=${text}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    handleOpenWhatsApp(message);
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setMessage('');
    }, 3000);
  };

  return (
    <div id="floating-support-container" className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
      {/* Support Popup Card */}
      {isOpen && (
        <div
          id="floating-support-modal"
          className="mb-3 w-[320px] sm:w-[360px] bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="bg-zinc-950 text-white p-4 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Close support chat"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-md">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-zinc-950 rounded-full animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <span>{settings.store_name || 'Maxora'} Support</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </h4>
                <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3" />
                  <span>Online • Typically replies in 5 mins</span>
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3 bg-zinc-50/50">
            {/* Direct WhatsApp Callout */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-emerald-900">Direct WhatsApp Chat</span>
                <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                  Instant
                </span>
              </div>
              <p className="text-xs text-emerald-800 mb-2.5">
                Chat directly with our customer service team on WhatsApp for order questions, delivery updates, or product advice.
              </p>
              <button
                type="button"
                onClick={() => handleOpenWhatsApp()}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Open WhatsApp Chat</span>
              </button>
            </div>

            {/* Quick Helpline Option */}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-2xl text-xs text-zinc-800 hover:bg-zinc-100 transition-colors font-semibold"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-500 font-normal">Direct Helpline</div>
                    <div className="font-bold text-zinc-950">{phone}</div>
                  </div>
                </div>
                <span className="text-[11px] text-emerald-600 font-bold">Call Now</span>
              </a>
            )}

            {/* Quick message form */}
            <form onSubmit={handleSendMessage} className="pt-1">
              <label htmlFor="quick-message-input" className="block text-[11px] font-bold text-zinc-600 mb-1.5">
                Or type your query:
              </label>
              <div className="relative">
                <input
                  id="quick-message-input"
                  type="text"
                  placeholder="e.g. Need delivery status for order..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full text-xs bg-white border border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 rounded-xl py-2.5 pl-3 pr-10 outline-none"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-2 bg-zinc-950 text-white disabled:bg-zinc-300 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                  title="Send via WhatsApp"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              {sentSuccess && (
                <div className="mt-2 text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Connecting you to WhatsApp...</span>
                </div>
              )}
            </form>
          </div>

          {/* Footer note */}
          <div className="px-4 py-2 bg-zinc-100/70 border-t border-zinc-200 text-[10px] text-zinc-500 text-center">
            Maxora Customer Desk • 100% Verified Bangladesh Support
          </div>
        </div>
      )}

      {/* Main Floating WhatsApp / Chat Button */}
      <button
        id="floating-support-button"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer active:scale-95"
        title="Live Chat Support"
        aria-label="Open support chat"
      >
        <span className="relative flex items-center justify-center">
          <MessageCircle className="w-5 h-5 fill-white/20" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full" />
        </span>
        <span className="text-xs font-black tracking-tight pr-1">Support</span>

        {/* Pulse beacon */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
        </span>
      </button>
    </div>
  );
};
