import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Save,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MessageCircle,
  ToggleLeft,
  ToggleRight,
  RotateCcw,
  ArrowUpDown,
  Phone,
  Eye,
  X,
} from 'lucide-react';
import {
  StoreSettings,
  AiSuggestedQuestion,
  AiFaqItem,
} from '../types';
import {
  DEFAULT_AI_SUGGESTED_QUESTIONS,
  DEFAULT_AI_FAQS,
} from '../data/initialData';

interface AdminAiAssistantProps {
  settings: StoreSettings;
  onSaveSettings: (updatedSettings: Partial<StoreSettings>) => Promise<boolean>;
}

export const AdminAiAssistant: React.FC<AdminAiAssistantProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(
    settings.ai_assistant_enabled !== false
  );
  const [welcomeMessage, setWelcomeMessage] = useState<string>(
    settings.ai_welcome_message ||
      'হ্যালো! 👋 আমি Maxora AI Assistant। পণ্যের দাম, স্পেসিফিকেশন, স্টক, ডেলিভারি বা আপনার প্রয়োজন অনুযায়ী পণ্য খুঁজে দিতে আমি সাহায্য করতে পারি। কীভাবে আপনাকে সাহায্য করতে পারি?'
  );
  const [whatsappNumber, setWhatsappNumber] = useState<string>(
    settings.ai_whatsapp_number ||
      settings.whatsapp ||
      settings.phone ||
      '+8801635451746'
  );

  // Suggested questions state
  const [suggestedQuestions, setSuggestedQuestions] = useState<
    AiSuggestedQuestion[]
  >(() => {
    if (
      Array.isArray(settings.ai_suggested_questions) &&
      settings.ai_suggested_questions.length > 0
    ) {
      return [...settings.ai_suggested_questions];
    }
    return [...DEFAULT_AI_SUGGESTED_QUESTIONS];
  });

  // FAQs / Knowledge base state
  const [faqs, setFaqs] = useState<AiFaqItem[]>(() => {
    if (Array.isArray(settings.ai_faqs) && settings.ai_faqs.length > 0) {
      return [...settings.ai_faqs];
    }
    return [...DEFAULT_AI_FAQS];
  });

  // Saving status
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modals state
  const [editingQuestion, setEditingQuestion] = useState<{
    index: number | null;
    question: string;
    active: boolean;
    order: number;
  } | null>(null);

  const [editingFaq, setEditingFaq] = useState<{
    index: number | null;
    question: string;
    answer: string;
    category: string;
    active: boolean;
    order: number;
  } | null>(null);

  // Active sub-tab in AI management
  const [activeTab, setActiveTab] = useState<'general' | 'questions' | 'faqs'>(
    'general'
  );

  // Handle Save
  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      const payload: Partial<StoreSettings> = {
        ai_assistant_enabled: isEnabled,
        ai_welcome_message: welcomeMessage.trim(),
        ai_whatsapp_number: whatsappNumber.trim(),
        ai_suggested_questions: suggestedQuestions,
        ai_faqs: faqs,
      };

      const success = await onSaveSettings(payload);
      if (success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setErrorMessage('সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      }
    } catch (err: any) {
      console.error('Error saving AI settings:', err);
      setErrorMessage(err.message || 'সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset Welcome Message
  const handleResetWelcome = () => {
    setWelcomeMessage(
      'হ্যালো! 👋 আমি Maxora AI Assistant। পণ্যের দাম, স্পেসিফিকেশন, স্টক, ডেলিভারি বা আপনার প্রয়োজন অনুযায়ী পণ্য খুঁজে দিতে আমি সাহায্য করতে পারি। কীভাবে আপনাকে সাহায্য করতে পারি?'
    );
  };

  // Save / Update Suggested Question
  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !editingQuestion.question.trim()) return;

    if (editingQuestion.index !== null) {
      // Edit existing
      const updated = [...suggestedQuestions];
      updated[editingQuestion.index] = {
        ...updated[editingQuestion.index],
        question: editingQuestion.question.trim(),
        active: editingQuestion.active,
        order: Number(editingQuestion.order) || 1,
      };
      setSuggestedQuestions(updated);
    } else {
      // Add new
      const newQ: AiSuggestedQuestion = {
        id: `sq-${Date.now()}`,
        question: editingQuestion.question.trim(),
        active: editingQuestion.active,
        order: Number(editingQuestion.order) || suggestedQuestions.length + 1,
      };
      setSuggestedQuestions([...suggestedQuestions, newQ]);
    }
    setEditingQuestion(null);
  };

  // Delete Question
  const handleDeleteQuestion = (index: number) => {
    if (confirm('আপনি কি এই সাজেস্টিভ প্রশ্নটি মুছে ফেলতে চান?')) {
      const updated = suggestedQuestions.filter((_, i) => i !== index);
      setSuggestedQuestions(updated);
    }
  };

  // Toggle Question Active
  const handleToggleQuestion = (index: number) => {
    const updated = [...suggestedQuestions];
    updated[index].active = !updated[index].active;
    setSuggestedQuestions(updated);
  };

  // Save / Update FAQ
  const handleSaveFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !editingFaq ||
      !editingFaq.question.trim() ||
      !editingFaq.answer.trim()
    ) {
      return;
    }

    if (editingFaq.index !== null) {
      // Edit existing
      const updated = [...faqs];
      updated[editingFaq.index] = {
        ...updated[editingFaq.index],
        question: editingFaq.question.trim(),
        answer: editingFaq.answer.trim(),
        category: editingFaq.category.trim() || 'সাধারণ',
        active: editingFaq.active,
        order: Number(editingFaq.order) || 1,
      };
      setFaqs(updated);
    } else {
      // Add new
      const newFaq: AiFaqItem = {
        id: `faq-${Date.now()}`,
        question: editingFaq.question.trim(),
        answer: editingFaq.answer.trim(),
        category: editingFaq.category.trim() || 'সাধারণ',
        active: editingFaq.active,
        order: Number(editingFaq.order) || faqs.length + 1,
      };
      setFaqs([...faqs, newFaq]);
    }
    setEditingFaq(null);
  };

  // Delete FAQ
  const handleDeleteFaq = (index: number) => {
    if (confirm('আপনি কি এই FAQ প্রশ্নটি মুছে ফেলতে চান?')) {
      const updated = faqs.filter((_, i) => i !== index);
      setFaqs(updated);
    }
  };

  // Toggle FAQ Active
  const handleToggleFaq = (index: number) => {
    const updated = [...faqs];
    updated[index].active = !updated[index].active;
    setFaqs(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-emerald-400 flex items-center justify-center font-bold shadow-sm">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-zinc-950">
                AI Shopping Assistant
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-bold">
                বাংলা এআই
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500">
              কাস্টমারদের জন্য এআই কেনাকাটা সহায়ক, সাজেস্টিভ প্রশ্ন ও নলেজবেজ নিয়ন্ত্রণ করুন।
            </p>
          </div>
        </div>

        {/* Master ON/OFF Switch & Save Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsEnabled(!isEnabled)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isEnabled
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-zinc-100 text-zinc-500 border-zinc-300'
            }`}
          >
            {isEnabled ? (
              <>
                <ToggleRight className="w-5 h-5 text-emerald-600" />
                <span>AI চালু আছে</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5 text-zinc-400" />
                <span>AI বন্ধ আছে</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সেভ করুন'}</span>
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in-50">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>AI Assistant সেটিংস সফলভাবে সংরক্ষিত ও আপডেট হয়েছে!</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-300 text-rose-900 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-bold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'general'
              ? 'bg-zinc-950 text-white'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
          }`}
        >
          সাধারণ সেটিংস ও ওয়েলকাম মেসেজ
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'questions'
              ? 'bg-zinc-950 text-white'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
          }`}
        >
          <span>সাজেস্টিভ প্রশ্নাবলী</span>
          <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
            {suggestedQuestions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('faqs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'faqs'
              ? 'bg-zinc-950 text-white'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
          }`}
        >
          <span>AI Knowledge Base & FAQs</span>
          <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
            {faqs.length}
          </span>
        </button>
      </div>

      {/* TAB 1: General & Welcome Message */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Welcome Message Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-950">
                  AI Welcome Message (প্রাথমিক বার্তা)
                </h3>
                <p className="text-xs text-zinc-500">
                  গ্রাহক যখন AI চ্যাট উইন্ডো ওপেন করবেন, এই বার্তাটি সর্বপ্রথম প্রদর্শিত হবে।
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetWelcome}
                title="Reset to default"
                className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1 p-1 rounded hover:bg-zinc-100 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>রিসেট</span>
              </button>
            </div>

            <textarea
              rows={4}
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="AI এর প্রাথমিক বার্তা লিখুন..."
              className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-emerald-500 rounded-xl p-3 text-xs sm:text-sm text-zinc-900 leading-relaxed outline-none"
            />

            {/* Live Preview of Welcome Message */}
            <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                  <Bot className="w-3 h-3" />
                </div>
                <span className="text-[11px] font-bold text-zinc-700">
                  গ্রাহকের কাছে যেভাবে দেখাবে:
                </span>
              </div>
              <p className="text-xs text-zinc-800 bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs leading-relaxed">
                {welcomeMessage || 'কোনো বার্তা সেট করা হয়নি।'}
              </p>
            </div>
          </div>

          {/* WhatsApp Support & Escalation Settings */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-950">
                WhatsApp Support নম্বর ও এস্কেলেশন
              </h3>
              <p className="text-xs text-zinc-500">
                যদি AI কোনো প্রশ্নের নিশ্চিত তথ্য না জানে বা গ্রাহক প্রতিনিধি চান, গ্রাহককে এই WhatsApp নম্বরে পাঠানোর অপশন দেওয়া হবে।
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>অফিসিয়াল WhatsApp নম্বর</span>
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+8801635451746"
                className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-emerald-500 rounded-xl p-3 text-xs sm:text-sm text-zinc-900 outline-none"
              />
              <p className="text-[11px] text-zinc-500">
                ফরম্যাট: +8801700000000 বা 01635451746 (বাংলাদেশি নম্বর)
              </p>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-emerald-950 text-xs space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>AI নিরাপত্তা ও ফলব্যাক নীতি:</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-emerald-900 text-[11px]">
                <li>AI কখনোই মনগড়া বা অনুমান করা তথ্য বা ভুল দাম বলবে না।</li>
                <li>নির্দিষ্ট তথ্য না থাকলে স্বয়ংক্রিয়ভাবে WhatsApp বাটন দেখাবে।</li>
                <li>গ্রাহকের প্রশ্নসহ প্রি-ফিল্ড মেসেজ লিংক তৈরি করা হবে।</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Suggested Questions Management */}
      {activeTab === 'questions' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-950">
                সাজেস্টিভ প্রশ্নসমূহ (Suggested Questions)
              </h3>
              <p className="text-xs text-zinc-500">
                চ্যাট উইন্ডোর নিচে গ্রাহকদের সুবিধার্থে এই প্রশ্নগুলো চিপস হিসেবে প্রদর্শিত হয়।
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setEditingQuestion({
                  index: null,
                  question: '',
                  active: true,
                  order: suggestedQuestions.length + 1,
                })
              }
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-950 hover:bg-zinc-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন প্রশ্ন যোগ করুন</span>
            </button>
          </div>

          {/* Table / List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 font-bold">
                  <th className="py-2.5 px-3 w-12">অর্ডার</th>
                  <th className="py-2.5 px-3">প্রশ্ন</th>
                  <th className="py-2.5 px-3 w-24">স্ট্যাটাস</th>
                  <th className="py-2.5 px-3 w-28 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {suggestedQuestions.map((q, idx) => (
                  <tr key={q.id || idx} className="hover:bg-zinc-50/80">
                    <td className="py-3 px-3 font-bold text-zinc-400">
                      {q.order || idx + 1}
                    </td>
                    <td className="py-3 px-3 font-medium text-zinc-900">
                      {q.question}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleQuestion(idx)}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full cursor-pointer ${
                          q.active !== false
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-zinc-100 text-zinc-500'
                        }`}
                      >
                        {q.active !== false ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingQuestion({
                            index: idx,
                            question: q.question,
                            active: q.active !== false,
                            order: q.order || idx + 1,
                          })
                        }
                        className="p-1 text-zinc-600 hover:text-emerald-600 cursor-pointer"
                        title="সম্পাদনা করুন"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(idx)}
                        className="p-1 text-zinc-400 hover:text-rose-600 cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AI Knowledge Base & Custom FAQs */}
      {activeTab === 'faqs' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-950">
                AI Knowledge Base & Custom FAQs
              </h3>
              <p className="text-xs text-zinc-500">
                স্টোরের পলিসি, ডেলিভারি নিয়ম বা সাধারণ প্রশ্নের উত্তর এখানে যোগ করুন। AI এই উত্তরগুলো বিশ্বস্ত উৎস হিসেবে ব্যবহার করবে।
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setEditingFaq({
                  index: null,
                  question: '',
                  answer: '',
                  category: 'সাধারণ',
                  active: true,
                  order: faqs.length + 1,
                })
              }
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-950 hover:bg-zinc-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন FAQ যোগ করুন</span>
            </button>
          </div>

          {/* FAQ Cards */}
          <div className="grid grid-cols-1 gap-3">
            {faqs.map((faq, idx) => (
              <div
                key={faq.id || idx}
                className="bg-zinc-50/60 p-4 rounded-2xl border border-zinc-200/80 hover:border-zinc-300 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-zinc-200/80 text-zinc-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {faq.category || 'সাধারণ'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleFaq(idx)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer ${
                        faq.active !== false
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-zinc-200 text-zinc-500'
                      }`}
                    >
                      {faq.active !== false ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </button>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900">
                    {faq.question}
                  </h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingFaq({
                        index: idx,
                        question: faq.question,
                        answer: faq.answer,
                        category: faq.category || 'সাধারণ',
                        active: faq.active !== false,
                        order: faq.order || idx + 1,
                      })
                    }
                    className="p-1.5 rounded-lg text-zinc-600 hover:text-emerald-600 hover:bg-white border border-transparent hover:border-zinc-200 transition-colors cursor-pointer"
                    title="সম্পাদনা"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFaq(idx)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-zinc-200 transition-colors cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Add / Edit Suggested Question */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-zinc-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-950">
                {editingQuestion.index !== null
                  ? 'প্রশ্ন সম্পাদনা করুন'
                  : 'নতুন সাজেস্টিভ প্রশ্ন যোগ করুন'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="p-1 text-zinc-400 hover:text-zinc-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">
                  প্রশ্নটির টেক্সট
                </label>
                <input
                  type="text"
                  required
                  value={editingQuestion.question}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      question: e.target.value,
                    })
                  }
                  placeholder="যেমন: এই পণ্যের ডেলিভারি চার্জ কত?"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">
                    ডিসপ্লে অর্ডার
                  </label>
                  <input
                    type="number"
                    value={editingQuestion.order}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        order: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-900 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">
                    স্ট্যাটাস
                  </label>
                  <select
                    value={editingQuestion.active ? 'active' : 'inactive'}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        active: e.target.value === 'active',
                      })
                    }
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-900 outline-none"
                  >
                    <option value="active">সক্রিয় (Active)</option>
                    <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add / Edit FAQ */}
      {editingFaq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-zinc-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-950">
                {editingFaq.index !== null
                  ? 'FAQ সম্পাদনা করুন'
                  : 'নতুন FAQ / নলেজ এন্ট্রি যোগ করুন'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingFaq(null)}
                className="p-1 text-zinc-400 hover:text-zinc-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">
                  প্রশ্ন (Question)
                </label>
                <input
                  type="text"
                  required
                  value={editingFaq.question}
                  onChange={(e) =>
                    setEditingFaq({ ...editingFaq, question: e.target.value })
                  }
                  placeholder="যেমন: পণ্য হাতে পাওয়ার পর চেক করার সুযোগ আছে কি?"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">
                  উত্তর (Answer)
                </label>
                <textarea
                  rows={4}
                  required
                  value={editingFaq.answer}
                  onChange={(e) =>
                    setEditingFaq({ ...editingFaq, answer: e.target.value })
                  }
                  placeholder="AI এই উত্তরের ওপর ভিত্তি করে গ্রাহককে উত্তর দেবে..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-900 outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">
                    ক্যাটাগরি
                  </label>
                  <input
                    type="text"
                    value={editingFaq.category}
                    onChange={(e) =>
                      setEditingFaq({ ...editingFaq, category: e.target.value })
                    }
                    placeholder="অর্ডার / পেমেন্ট / ডেলিভারি"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-900 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">
                    ডিসপ্লে অর্ডার
                  </label>
                  <input
                    type="number"
                    value={editingFaq.order}
                    onChange={(e) =>
                      setEditingFaq({
                        ...editingFaq,
                        order: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-900 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">
                    স্ট্যাটাস
                  </label>
                  <select
                    value={editingFaq.active ? 'active' : 'inactive'}
                    onChange={(e) =>
                      setEditingFaq({
                        ...editingFaq,
                        active: e.target.value === 'active',
                      })
                    }
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-900 outline-none"
                  >
                    <option value="active">সক্রিয় (Active)</option>
                    <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFaq(null)}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
