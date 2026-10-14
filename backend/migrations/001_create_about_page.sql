-- ====================================================================
-- MAXORA BANGLADESH (maxorabd.com) - ABOUT US DATABASE MIGRATION
-- Table: `about_page` (Compatible with PostgreSQL, MySQL 8+, SQLite, Supabase)
-- ====================================================================

CREATE TABLE IF NOT EXISTS about_page (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'default',
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500),
    brand_story TEXT NOT NULL,
    mission TEXT,
    vision TEXT,
    
    -- Feature Card 1
    feature_1_title VARCHAR(255) NOT NULL,
    feature_1_desc TEXT NOT NULL,
    feature_1_icon VARCHAR(100) DEFAULT 'ShieldCheck',
    feature_1_badge VARCHAR(100),
    
    -- Feature Card 2
    feature_2_title VARCHAR(255) NOT NULL,
    feature_2_desc TEXT NOT NULL,
    feature_2_icon VARCHAR(100) DEFAULT 'Truck',
    feature_2_badge VARCHAR(100),
    
    -- Feature Card 3
    feature_3_title VARCHAR(255) NOT NULL,
    feature_3_desc TEXT NOT NULL,
    feature_3_icon VARCHAR(100) DEFAULT 'Headphones',
    feature_3_badge VARCHAR(100),
    
    -- Contact Information
    contact_phone VARCHAR(50) NOT NULL,
    contact_email VARCHAR(100) NOT NULL,
    contact_address TEXT NOT NULL,
    contact_whatsapp VARCHAR(50),
    contact_facebook VARCHAR(255),
    working_hours VARCHAR(100),
    
    -- CEO Profile & Image Upload
    ceo_name VARCHAR(150) NOT NULL,
    ceo_title VARCHAR(150) NOT NULL,
    ceo_message TEXT NOT NULL,
    ceo_image_url TEXT,
    
    -- Meta stats
    established_year VARCHAR(20) DEFAULT '2023',
    happy_customers_count VARCHAR(50) DEFAULT '২৫,০০০+',
    total_deliveries VARCHAR(50) DEFAULT '৩৫,০০০+',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initial Seed Data with Professional Bangla Content
INSERT INTO about_page (
    id,
    title,
    subtitle,
    brand_story,
    mission,
    vision,
    feature_1_title,
    feature_1_desc,
    feature_1_icon,
    feature_1_badge,
    feature_2_title,
    feature_2_desc,
    feature_2_icon,
    feature_2_badge,
    feature_3_title,
    feature_3_desc,
    feature_3_icon,
    feature_3_badge,
    contact_phone,
    contact_email,
    contact_address,
    contact_whatsapp,
    contact_facebook,
    working_hours,
    ceo_name,
    ceo_title,
    ceo_message,
    ceo_image_url
) VALUES (
    'default',
    'আমাদের সম্পর্কে - ম্যাক্সোরা বাংলাদেশ | বিশ্বস্ত অনলাইন শপিং',
    '১০০% প্রিমিয়াম কোয়ালিটি লাইফস্টাইল পণ্য, দ্রুততম হোম ডেলিভারি ও শতভাগ গ্রাহক আস্থার অঙ্গীকার।',
    'ম্যাক্সোরা বাংলাদেশ (maxorabd.com) এর যাত্রা শুরু হয়েছে বাংলাদেশের স্মার্ট ক্রেতাদের জন্য খাঁটি, আধুনিক এবং প্রিমিয়াম কোয়ালিটি লাইফস্টাইল ও ইলেকট্রনিক্স গ্যাজেট সহজলভ্য করার প্রত্যয় নিয়ে। আমরা বিশ্বাস করি, একটি সফল ইকমার্স কেবল পণ্য বিক্রয় নয়—এটি গ্রাহকের সাথে দীর্ঘমেয়াদী বিশ্বাস ও আস্থার সেতুবন্ধন। প্রতিটি পণ্য আমরা সরাসরি ভেরিফায়েড ম্যানুফ্যাকচারার ও বিশ্বস্ত আমদানিকারকদের কাছ থেকে সংগ্রহ করি এবং আমাদের নিজস্ব টিম দ্বারা ইনস্পেকশন শেষে ডেলিভারি নিশ্চিত করি। ক্যাশ অন ডেলিভারি, সাশ্রয়ী কুরিয়ার চার্জ এবং বিক্রয়োত্তর নির্ভরযোগ্য সেবা দিয়ে আমরা দেশের প্রতিটি প্রান্তে গ্রাহকের সর্বোচ্চ সন্তুষ্টি অর্জনে অবিরাম কাজ করে যাচ্ছি।',
    'বাংলাদেশের প্রতিটি ঘরে সেরা কোয়ালিটির গ্যাজেট ও লাইফস্টাইল পণ্য সাশ্রয়ী মূল্যে নিরাপদে পৌঁছে দেওয়া।',
    'সততা, প্রিমিয়াম গ্রাহক সেবা ও আধুনিক প্রযুক্তির সমন্বয়ে দেশের শীর্ষস্থানীয় নির্ভরযোগ্য ই-কমার্স ব্র্যান্ড হওয়া।',
    '১০০% অরিজিনাল ও অথেন্টিক পণ্য',
    'কোনো নকল বা নিম্নমানের পণ্য নয়; প্রতিটি গ্যাজেটের নিখুঁত গুণগত মান ও কার্যকারিতা সরাসরি যাচাইকৃত।',
    'ShieldCheck',
    'গুণগত মান নিশ্চিত',
    'সারাদেশে সুপার ফাস্ট হোম ডেলিভারি',
    'ঢাকায় ২৪-৪৮ ঘণ্টায় এবং ঢাকার বাইরে সর্বোচ্চ ৩-৫ দিনে নির্ভরযোগ্য কুরিয়ারের মাধ্যমে ক্যাশ অন ডেলিভারি।',
    'Truck',
    'ক্যাশ অন ডেলিভারি',
    '২৪/৭ আন্তরিক কাস্টমার সাপোর্ট',
    'অর্ডার ট্র্যাকিং, প্রোডাক্ট গাইডেন্স কিংবা যেকোনো প্রয়োজনে আমাদের এক্সপার্ট টিম কল ও হোয়াটসঅ্যাপে সদা প্রস্তুত।',
    'Headphones',
    'দ্রুত সমাধান',
    '01700-123456',
    'support@maxorabd.com',
    'বাড়ি #১২, রোড #০৪, সেক্টর #১১, উত্তরা, ঢাকা-১২৩০, বাংলাদেশ',
    '+8801700123456',
    'https://facebook.com/maxora.store',
    'সকাল ১০:০০ টা - রাত ১০:০০ টা (প্রতিদিন)',
    'মোঃ আরিফুল ইসলাম (Md. Ariful Islam)',
    'প্রতিষ্ঠাতা ও প্রধান নির্বাহী কর্মকর্তা (Founder & CEO)',
    'ম্যাক্সোরা-তে আমাদের প্রতিটি কাজের কেন্দ্রবিন্দুতে রয়েছেন আপনি—আমাদের সম্মানিত গ্রাহক। অনলাইন কেনাকাটায় প্রতারণা ও নিম্নমানের পণ্যের ভিড়ে আমরা সততা ও কোয়ালিটির একটি স্বচ্ছ মানদণ্ড প্রতিষ্ঠা করতে চাই। কোনো আপোষহীন সততা এবং সর্বোচ্চ সেবা দিয়েই আমরা একটি স্থায়ী আস্থার ঠিকানা গড়ে তুলছি।',
    '/uploads/ceo-portrait.png'
) ON CONFLICT (id) DO NOTHING;
