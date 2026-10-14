/**
 * Maxora Bangladesh - About Us Page Database Schema & Types
 * Target Database: PostgreSQL / MySQL / MongoDB / JSON Store / Firestore
 * Table/Collection: `about_page` or `site_settings`
 */

export interface FeatureCard {
  id?: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name: 'ShieldCheck' | 'Truck' | 'Headphones' | 'Sparkles' | 'HeartHandshake' | 'Award'
  image_url?: string;
  badge?: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  whatsapp?: string;
  facebook?: string;
  working_hours?: string;
}

export interface AboutPageData {
  title: string;
  subtitle: string;
  brand_story: string; // Bangla Text
  mission?: string;
  vision?: string;
  features: FeatureCard[]; // 3 core feature value cards
  contact_info: ContactInfo;
  ceo_name: string;
  ceo_title: string;
  ceo_message: string;
  ceo_image_url: string;
  established_year?: string;
  happy_customers_count?: string;
  total_deliveries?: string;
  updated_at?: string;
}

export const defaultAboutPageData: AboutPageData = {
  title: "আমাদের সম্পর্কে - ম্যাক্সোরা বাংলাদেশ | বিশ্বস্ত অনলাইন শপিং",
  subtitle: "১০০% প্রিমিয়াম কোয়ালিটি লাইফস্টাইল পণ্য, দ্রুততম হোম ডেলিভারি ও শতভাগ গ্রাহক আস্থার অঙ্গীকার।",
  brand_story: `ম্যাক্সোরা বাংলাদেশ (maxorabd.com) এর যাত্রা শুরু হয়েছে বাংলাদেশের স্মার্ট ক্রেতাদের জন্য খাঁটি, আধুনিক এবং প্রিমিয়াম কোয়ালিটি লাইফস্টাইল ও ইলেকট্রনিক্স গ্যাজেট সহজলভ্য করার প্রত্যয় নিয়ে।\n\nআমরা বিশ্বাস করি, একটি সফল ইকমার্স কেবল পণ্য বিক্রয় নয়—এটি গ্রাহকের সাথে দীর্ঘমেয়াদী বিশ্বাস ও আস্থার সেতুবন্ধন। তাই প্রতিটি পণ্য আমরা সরাসরি ভেরিফায়েড ম্যানুফ্যাকচারার ও বিশ্বস্ত আমদানিকারকদের কাছ থেকে সংগ্রহ করি এবং আমাদের নিজস্ব টিম দ্বারা ইনস্পেকশন শেষে ডেলিভারি নিশ্চিত করি।\n\nক্যাশ অন ডেলিভারি, সাশ্রয়ী কুরিয়ার চার্জ এবং বিক্রয়োত্তর নির্ভরযোগ্য সেবা দিয়ে আমরা দেশের প্রতিটি প্রান্তে গ্রাহকের সর্বোচ্চ সন্তুষ্টি অর্জনে অবিরাম কাজ করে যাচ্ছি।`,
  mission: "বাংলাদেশের প্রতিটি ঘরে সেরা কোয়ালিটির গ্যাজেট ও লাইফস্টাইল পণ্য সাশ্রয়ী মূল্যে নিরাপদে পৌঁছে দেওয়া।",
  vision: "সততা, প্রিমিয়াম গ্রাহক সেবা ও আধুনিক প্রযুক্তির সমন্বয়ে দেশের শীর্ষস্থানীয় নির্ভরযোগ্য ই-কমার্স ব্র্যান্ড হওয়া।",
  features: [
    {
      id: "feature-1",
      title: "১০০% অরিজিনাল ও অথেন্টিক পণ্য",
      description: "কোনো নকল বা নিম্নমানের পণ্য নয়; প্রতিটি গ্যাজেটের নিখুঁত গুণগত মান ও কার্যকারিতা সরাসরি যাচাইকৃত।",
      icon: "ShieldCheck",
      badge: "গুণগত মান নিশ্চিত"
    },
    {
      id: "feature-2",
      title: "সারাদেশে সুপার ফাস্ট হোম ডেলিভারি",
      description: "ঢাকায় ২৪-৪৮ ঘণ্টায় এবং ঢাকার বাইরে সর্বোচ্চ ৩-৫ দিনে নির্ভরযোগ্য কুরিয়ারের মাধ্যমে ক্যাশ অন ডেলিভারি।",
      icon: "Truck",
      badge: "ক্যাশ অন ডেলিভারি"
    },
    {
      id: "feature-3",
      title: "২৪/৭ আন্তরিক কাস্টমার সাপোর্ট",
      description: "অর্ডার ট্র্যাকিং, প্রোডাক্ট গাইডেন্স কিংবা যেকোনো প্রয়োজনে আমাদের এক্সপার্ট টিম কল ও হোয়াটসঅ্যাপে সদা প্রস্তুত।",
      icon: "Headphones",
      badge: "দ্রুত সমাধান"
    }
  ],
  contact_info: {
    phone: "01700-123456",
    email: "support@maxorabd.com",
    address: "বাড়ি #১২, রোড #০৪, সেক্টর #১১, উত্তরা, ঢাকা-১২৩০, বাংলাদেশ",
    whatsapp: "+8801700123456",
    facebook: "https://facebook.com/maxora.store",
    working_hours: "সকাল ১০:০০ টা - রাত ১০:০০ টা (প্রতিদিন)"
  },
  ceo_name: "মোঃ আরিফুল ইসলাম (Md. Ariful Islam)",
  ceo_title: "প্রতিষ্ঠাতা ও প্রধান নির্বাহী কর্মকর্তা (Founder & CEO)",
  ceo_message: `ম্যাক্সোরা-তে আমাদের প্রতিটি কাজের কেন্দ্রবিন্দুতে রয়েছেন আপনি—আমাদের সম্মানিত গ্রাহক। অনলাইন কেনাকাটায় প্রতারণা ও নিম্নমানের পণ্যের ভিড়ে আমরা সততা ও কোয়ালিটির একটি স্বচ্ছ মানদণ্ড প্রতিষ্ঠা করতে চাই।\n\nআমরা প্রতিটি প্রোডাক্টের পেছনে দাঁড়িয়ে গ্রাহককে বিক্রয়োত্তর নির্ভরযোগ্য সহায়তার গ্যারান্টি দিই। আমাদের সাথে আপনার এই আস্থার পথচলাই আমাদের সবচেয়ে বড় অর্জন।`,
  ceo_image_url: "",
  established_year: "2023",
  happy_customers_count: "২৫,০০০+",
  total_deliveries: "৩৫,০০০+",
  updated_at: new Date().toISOString()
};
