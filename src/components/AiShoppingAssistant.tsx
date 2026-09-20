import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  MessageCircle,
  ShoppingBag,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Flame,
} from 'lucide-react';
import { Product, StoreSettings, AiSuggestedQuestion } from '../types';
import {
  ChatMessage,
  sendAiChatMessage,
} from '../services/aiChatClient';

interface AiShoppingAssistantProps {
  settings: StoreSettings;
  currentProduct?: Product | null;
  allProducts?: Product[];
  onNavigateToProduct?: (product: Product) => void;
}

export const AiShoppingAssistant: React.FC<AiShoppingAssistantProps> = ({
  settings,
  currentProduct,
  allProducts = [],
  onNavigateToProduct,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // If AI Assistant is disabled by Admin, completely hide from customer
  const isEnabled = settings.ai_assistant_enabled !== false;

  const defaultWelcome =
    settings.ai_welcome_message ||
    'হ্যালো! 👋 আমি Maxora AI Assistant। বাংলা, Banglish বা English—যেকোনো ভাষায় আমাদের ওয়েবসাইট, পণ্যের দাম, স্পেক্স, স্টক, ডেলিভারি বা অর্ডার সম্পর্কে প্রশ্ন করতে পারেন। কীভাবে সাহায্য করতে পারি?';

  // Initialize messages with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-1',
          sender: 'ai',
          text: defaultWelcome,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [defaultWelcome]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus input when opened on desktop
      if (typeof window !== 'undefined' && window.innerWidth > 640) {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    }
  }, [isOpen, messages, isLoading]);

  if (!isEnabled) {
    return null;
  }

  // Active suggested questions sorted by order
  const suggestedQuestions: AiSuggestedQuestion[] = (
    settings.ai_suggested_questions || []
  )
    .filter((q) => q.active !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // WhatsApp number calculation
  const rawPhone =
    settings.ai_whatsapp_number ||
    settings.whatsapp ||
    settings.phone ||
    '+8801635451746';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
  const waNumber = cleanPhone.startsWith('88')
    ? cleanPhone
    : `88${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}`;

  const openWhatsApp = (customText?: string) => {
    const text = encodeURIComponent(
      customText ||
        `হ্যালো ${settings.store_name || 'Maxora'}, আমি AI Assistant থেকে আসছি। একটি পণ্য সম্পর্কে তথ্য জানতে চাই।`
    );
    window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      const result = await sendAiChatMessage({
        message: text,
        history: newHistory,
        currentProduct,
        allProducts,
        settings,
      });

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: result.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendedProducts: result.recommendedProducts,
        needsWhatsApp: result.needsWhatsApp,
        whatsappPrefilledText: result.whatsappPrefilledText,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI assistant error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'দুঃখিত, উত্তর পেতে একটু বিলম্ব হচ্ছে। সরাসরি আমাদের WhatsApp সাপোর্টে মেসেজ দিতে পারেন।',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          needsWhatsApp: true,
          whatsappPrefilledText: `হ্যালো Maxora, আমি জানতে চাই: ${text}`,
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'ai',
        text: defaultWelcome,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Simple Markdown-like formatter for bold text and lists
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed text-zinc-800">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }

          // Format bold **text**
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          const formattedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-bold text-zinc-950">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });

          if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-emerald-500 font-bold shrink-0">•</span>
                <span>{formattedLine}</span>
              </div>
            );
          }

          return <p key={idx}>{formattedLine}</p>;
        })}
      </div>
    );
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div
        id="floating-ai-assistant-container"
        className="fixed bottom-[74px] sm:bottom-6 right-3 sm:right-6 z-40 flex flex-col items-end pointer-events-auto"
      >
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open Maxora AI Shopping Assistant"
            className="group relative flex items-center gap-2.5 bg-zinc-950 hover:bg-zinc-900 text-white pl-3.5 pr-4 py-3 rounded-full shadow-2xl border border-zinc-800 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            {/* Pulsing online badge */}
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center font-bold shadow-xs group-hover:rotate-12 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-zinc-950 rounded-full animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-zinc-950 rounded-full" />
            </div>

            <div className="text-left hidden xs:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-wide text-white">
                  Maxora AI
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold border border-emerald-500/30">
                  সহায়িকা
                </span>
              </div>
              <p className="text-[10px] text-zinc-400">যেকোনো প্রশ্ন করুন</p>
            </div>

            {/* Mobile-only compact pill */}
            <span className="xs:hidden text-xs font-bold text-white">AI</span>
          </button>
        )}
      </div>

      {/* Floating Chat Modal Window */}
      {isOpen && (
        <div
          id="ai-assistant-modal"
          className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 flex items-end justify-center sm:block p-2 sm:p-0 bg-black/40 sm:bg-transparent backdrop-blur-xs sm:backdrop-blur-none animate-in fade-in-50 duration-200"
        >
          <div className="w-full sm:w-[380px] max-w-[400px] h-[82vh] sm:h-[600px] max-h-[660px] bg-white rounded-3xl shadow-2xl border border-zinc-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-zinc-950 text-white p-3.5 sm:p-4 flex items-center justify-between gap-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-zinc-950 flex items-center justify-center font-bold shadow-md">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-zinc-950 rounded-full" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-white truncate">
                      {settings.store_name || 'Maxora'} AI
                    </h3>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      অনলাইন
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate">
                    স্মার্ট সহকারী (Bangla / Banglish / English)
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Direct WhatsApp button in header */}
                <button
                  type="button"
                  onClick={() => openWhatsApp()}
                  title="WhatsApp-এ সরাসরি কথা বলুন"
                  className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors cursor-pointer text-xs font-bold"
                >
                  <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] font-bold">WhatsApp</span>
                </button>

                {/* Reset chat button */}
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Clear & Reset Conversation"
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close Assistant"
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Current Product Context Bar (If viewing product details page) */}
            {currentProduct && (
              <div className="bg-emerald-50/80 border-b border-emerald-100 px-3 py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm shrink-0">🛍️</span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-emerald-950 font-bold truncate">
                      {currentProduct.name}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-medium">
                      ৳
                      {Math.max(
                        0,
                        Number(currentProduct.selling_price || 0) -
                          Number(currentProduct.discount || 0)
                      ).toLocaleString('en-BD')}{' '}
                      • {Number(currentProduct.stock || 0) > 0 ? 'স্টকে আছে' : 'স্টক শেষ'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage(
                      `এই "${currentProduct.name}" পণ্যের বিস্তারিত স্পেসিফিকেশন ও দাম বলুন`
                    )
                  }
                  className="shrink-0 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  বিস্তারিত
                </button>
              </div>
            )}

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-zinc-50/40">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-xs'
                        : 'bg-white text-zinc-900 border border-zinc-200/80 rounded-bl-xs'
                    }`}
                  >
                    {msg.sender === 'ai' ? (
                      renderFormattedText(msg.text)
                    ) : (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.text}
                      </p>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="text-[10px] text-zinc-400 mt-1 px-1">
                    {msg.timestamp}
                  </span>

                  {/* Recommended Product Cards from AI */}
                  {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                    <div className="w-full mt-2 space-y-2 max-w-[90%]">
                      <div className="text-[11px] font-bold text-zinc-500 flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3 text-emerald-600" />
                        <span>সাজেস্টেড প্রোডাক্ট:</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {msg.recommendedProducts.map((prod) => {
                          const netPrice = Math.max(
                            0,
                            Number(prod.selling_price || 0) - Number(prod.discount || 0)
                          );
                          return (
                            <div
                              key={prod.id}
                              className="bg-white p-2.5 rounded-xl border border-zinc-200 shadow-xs flex items-center gap-3 hover:border-emerald-500/50 transition-all"
                            >
                              {prod.image_url ? (
                                <img
                                  src={prod.image_url}
                                  alt={prod.name}
                                  className="w-12 h-12 rounded-lg object-cover bg-zinc-100 shrink-0 border border-zinc-100"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center shrink-0">
                                  <ShoppingBag className="w-5 h-5" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-zinc-900 truncate">
                                  {prod.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs font-black text-emerald-600">
                                    ৳{netPrice.toLocaleString('en-BD')}
                                  </span>
                                  {Number(prod.stock || 0) > 0 ? (
                                    <span className="text-[10px] text-emerald-700 bg-emerald-50 font-bold px-1.5 py-0.2 rounded">
                                      ইন স্টক
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-rose-700 bg-rose-50 font-bold px-1.5 py-0.2 rounded">
                                      স্টক শেষ
                                    </span>
                                  )}
                                </div>
                              </div>
                              {onNavigateToProduct && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onNavigateToProduct(prod);
                                    setIsOpen(false);
                                  }}
                                  className="shrink-0 p-1.5 bg-zinc-900 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <span>দেখুন</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* WhatsApp Fallback Escalation Button */}
                  {msg.needsWhatsApp && (
                    <div className="mt-2 w-full max-w-[90%] bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                      <p className="text-[11px] text-emerald-900 font-medium mb-2">
                        সরাসরি আমাদের অফিসিয়াল প্রতিনিধির সাথে WhatsApp-এ কথা বলতে নিচের বাটনে ট্যাপ করুন:
                      </p>
                      <button
                        type="button"
                        onClick={() => openWhatsApp(msg.whatsappPrefilledText)}
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>💬 WhatsApp-এ যোগাযোগ করুন</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-zinc-900 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-zinc-200 px-3.5 py-2.5 rounded-2xl rounded-bl-xs shadow-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                    <span className="text-[11px] text-zinc-500 font-medium pl-1">
                      উত্তর তৈরি হচ্ছে...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Question Chips (Managed by Admin) */}
            {suggestedQuestions.length > 0 && !isLoading && (
              <div className="bg-white px-3 py-2 border-t border-zinc-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-zinc-400 font-bold shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>প্রশ্ন:</span>
                </span>
                {suggestedQuestions.slice(0, 6).map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleSendMessage(q.question)}
                    className="shrink-0 text-[11px] font-medium bg-zinc-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-zinc-700 px-2.5 py-1 rounded-full border border-zinc-200 transition-colors cursor-pointer"
                  >
                    {q.question}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white border-t border-zinc-200 flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="যেকোনো ভাষায় প্রশ্ন করুন (Bangla, Banglish, English)..."
                disabled={isLoading}
                className="flex-1 bg-zinc-100 text-zinc-900 placeholder:text-zinc-400 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                aria-label="Send message"
                className={`p-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                  inputText.trim() && !isLoading
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
