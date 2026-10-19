export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  image_url?: string;
  description?: string;
  display_order?: number;
  active: boolean | number;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductColor {
  name: string;
  code?: string;
  image_url?: string;
  stock?: number;
  price?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image_url?: string;
  display_order: number;
  active: boolean | number;
  meta_title?: string;
  meta_description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SubCategory {
  id: string;
  category_id: string;
  category_slug: string;
  name: string;
  slug: string;
  display_order: number;
  active: boolean | number;
  meta_title?: string;
  meta_description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductType {
  id: string;
  category_id?: string;
  category_slug?: string;
  subcategory_id?: string;
  subcategory_slug?: string;
  name: string;
  slug: string;
  image_url?: string;
  meta_title?: string;
  meta_description?: string;
  display_order?: number;
  active: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface ChildCategory {
  id: string;
  category_id?: string;
  category_slug?: string;
  subcategory_id?: string;
  subcategory_slug?: string;
  product_type_id?: string;
  product_type_slug?: string;
  product_type_name?: string;
  name: string;
  slug: string;
  image_url?: string;
  meta_title?: string;
  meta_description?: string;
  display_order?: number;
  active: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  category_id?: string;
  category_slug?: string;
  sub_category?: string;
  subcategory_id?: string;
  subcategory_slug?: string;
  child_category?: string;
  childcategory_id?: string;
  child_category_id?: string;
  childcategory_slug?: string;
  child_category_slug?: string;
  product_type?: string;
  product_type_id?: string;
  product_type_slug?: string;
  colors?: ProductColor[];
  sku?: string;
  image_url: string;
  images?: string[];
  product_link?: string;
  buying_price: number;
  selling_price: number;
  regular_price?: number;
  discount: number;
  final_price?: number;
  stock: number;
  badge?: string;
  featured?: number | boolean;
  active?: number | boolean;
  created_at?: string;
  updated_at?: string;
  // SEO & Marketing Fields for Google & Meta Ads
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  slug?: string;
  brand?: string;
  brand_id?: string;
  brand_slug?: string;
  og_image?: string;
  // Homepage Special Sections (backward-compatible)
  is_hot_deal?: boolean | number;
  is_flash_sale?: boolean | number;
  is_new_arrival?: boolean | number;
  is_best_seller?: boolean | number;
  flash_sale_price?: number;
  flash_sale_start?: string;
  flash_sale_end?: string;
  sold_count?: number;
  video_url?: string;
  rating?: number;
  rating_count?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  alt_phone?: string;
  email?: string;
  password?: string;
  avatar?: string;
  district?: string;
  area?: string;
  address?: string;
  total_orders: number;
  total_spent: number;
  created_at?: string;
  updated_at?: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Completed'
  | 'Cancelled'
  | 'Returned';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  buying_price?: number;
  line_total: number;
  image_url?: string;
  selected_color?: string;
  selected_color_code?: string;
  slug?: string;
}

export interface OrderTimelineEvent {
  status: OrderStatus | string;
  timestamp: string;
  note?: string;
  by?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  phone: string;
  alt_phone?: string;
  email?: string;
  district: string;
  thana?: string;
  area: string;
  address: string;
  delivery_area: 'inside_dhaka' | 'sub_dhaka' | 'outside_dhaka' | string;
  delivery_charge: number;
  subtotal: number;
  discount?: number;
  total: number;
  total_amount?: number;
  status: OrderStatus;
  order_status?: string;
  customer_phone?: string;
  payment_method: string;
  payment_status?: 'Pending' | 'Paid' | 'Failed' | 'Refunded' | string;
  transaction_id?: string;
  payment_gateway?: 'cod' | 'uddoktapay' | string;
  payment_details?: any;
  note?: string;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
  timeline?: OrderTimelineEvent[];
  // Courier Delivery & Auto-Booking Integration
  courier_name?: string;
  courier_tracking_code?: string;
  courier_tracking_url?: string;
  courier_consignment_id?: string | number;
  courier_status?: string;
  courier_assigned_at?: string;
  courier_response?: any;
}

export interface HeroBanner {
  id: string;
  bannerType?: 'full' | 'collage' | 'single';
  singleBannerImage?: string;
  mobileBannerImage?: string;
  pill?: string;
  titlePrimary: string;
  titleAccent?: string;
  subtitle?: string;
  cta?: string;
  ctaLink?: string;
  badgeNote?: string;
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  bgGradient?: string;
  active: boolean;
  display_order?: number;
}

export interface AiCustomCommand {
  id: string;
  title: string;
  command: string;
  active: boolean;
  order: number;
}

export interface AiSuggestedQuestion {
  id: string;
  question: string;
  active: boolean;
  order: number;
}

export interface AiFaqItem {
  id: string;
  question: string;
  answer: string;
  active: boolean;
  order: number;
  category?: string;
}

export interface AiAssistantSettings {
  enabled: boolean;
  welcomeMessage: string;
  whatsappNumber?: string;
  suggestedQuestions: AiSuggestedQuestion[];
  faqs: AiFaqItem[];
  customCommands?: AiCustomCommand[];
  systemInstructions?: string;
}

export interface StoreSettings {
  store_name: string;
  store_tagline: string;
  admin_password?: string;
  delivery_inside_dhaka: string | number;
  delivery_sub_dhaka: string | number;
  delivery_outside_dhaka: string | number;
  free_delivery_enabled?: boolean;
  free_delivery_threshold?: number;
  currency: string;
  phone: string;
  email?: string;
  address?: string;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  logo_url?: string;
  favicon_url?: string;
  hero_title: string;
  hero_subtitle: string;
  promo_text: string;
  footer_text: string;
  // Hero Banners & Slider Configuration
  hero_banners?: HeroBanner[];
  banner_slide_speed?: number;
  // Ads Tracking & Marketing Pixels
  meta_pixel_id?: string;
  google_tag_id?: string;
  google_ads_id?: string;
  tiktok_pixel_id?: string;
  // Global Site SEO
  site_meta_title?: string;
  site_meta_description?: string;
  site_meta_keywords?: string;
  canonical_url?: string;
  custom_head_code?: string;
  custom_body_code?: string;
  custom_product_types?: string[];
  // AI Shopping Assistant Configuration
  ai_assistant_enabled?: boolean;
  ai_welcome_message?: string;
  ai_whatsapp_number?: string;
  ai_suggested_questions?: AiSuggestedQuestion[];
  ai_faqs?: AiFaqItem[];
  ai_custom_commands?: AiCustomCommand[];
  ai_system_instructions?: string;
  // Social Proof & Live Sales Notification
  live_sales_popup_enabled?: boolean;
  live_sales_popup_interval?: number;
  // Trust Benefits Customization
  trust_badge_1_title?: string;
  trust_badge_1_subtitle?: string;
  trust_badge_2_title?: string;
  trust_badge_2_subtitle?: string;
  trust_badge_3_title?: string;
  trust_badge_3_subtitle?: string;
  trust_badge_4_title?: string;
  trust_badge_4_subtitle?: string;
  // Hero Promo Highlight Cards
  hero_promo_card_1_badge?: string;
  hero_promo_card_1_title?: string;
  hero_promo_card_1_subtitle?: string;
  hero_promo_card_2_badge?: string;
  hero_promo_card_2_title?: string;
  hero_promo_card_2_subtitle?: string;
  hero_promo_card_3_badge?: string;
  hero_promo_card_3_title?: string;
  hero_promo_card_3_subtitle?: string;
  deleted_product_ids?: string[];
  // Customer Storefront Footer & Bottom System Customization
  footer_about?: string;
  support_hours?: string;
  footer_badge_1?: string;
  footer_badge_2?: string;
  faq_content?: string;
  return_policy_content?: string;
  privacy_policy_content?: string;
  terms_policy_content?: string;
  footer_we_accept_text?: string;
  footer_ssl_text?: string;
  footer_cod_text?: string;
  show_nagad_badge?: boolean;
  show_bkash_badge?: boolean;
  // Courier API & Delivery Configuration
  courier_default?: string;
  courier_custom_list?: string[];
  steadfast_enabled?: boolean;
  steadfast_api_key?: string;
  steadfast_secret_key?: string;
  pathao_enabled?: boolean;
  pathao_client_id?: string;
  pathao_client_secret?: string;
  pathao_username?: string;
  pathao_password?: string;
  pathao_store_id?: string;
  redx_enabled?: boolean;
  // Online Payment Gateway (UddoktaPay / bKash, Nagad, Rocket)
  uddoktapay_enabled?: boolean;
  uddoktapay_api_key?: string;
  uddoktapay_api_url?: string;
  // Direct Manual Payment Options (bKash, Nagad, Bank Transfer)
  manual_bkash_enabled?: boolean;
  manual_bkash_number?: string;
  manual_bkash_type?: 'Personal' | 'Merchant' | 'Agent' | string;
  manual_bkash_instructions?: string;
  manual_nagad_enabled?: boolean;
  manual_nagad_number?: string;
  manual_nagad_type?: 'Personal' | 'Merchant' | string;
  manual_nagad_instructions?: string;
  manual_bank_enabled?: boolean;
  manual_bank_name?: string;
  manual_bank_account_name?: string;
  manual_bank_account_number?: string;
  manual_bank_branch?: string;
  manual_bank_routing?: string;
  manual_bank_instructions?: string;
  updated_at?: string;
}

export interface DailySalesMetric {
  date: string;
  label: string;
  sales: number;
  orders: number;
  profit: number;
}

export interface MonthlySalesMetric {
  month: string;
  label: string;
  sales: number;
  orders: number;
  profit: number;
}

export interface StatusDistribution {
  status: OrderStatus;
  count: number;
  total: number;
}

export interface BestSellingProduct {
  product_id: string;
  product_name: string;
  sku?: string;
  image_url?: string;
  quantity: number;
  sales: number;
  profit?: number;
}

export interface LiveTrafficAnalytics {
  live_now: number;
  today_visitors: number;
  today_page_views: number;
  yesterday_visitors?: number;
  active_pages?: Array<{ path: string; title: string; count: number }>;
  device_breakdown?: { mobile: number; desktop: number; tablet: number; mobile_percent: number; desktop_percent: number };
  traffic_sources?: Array<{ source: string; count: number; percentage: number }>;
  daily_history?: Array<{ date: string; label: string; visitors: number; views: number }>;
  top_pages?: Array<{ path: string; title: string; views: number }>;
  last_updated?: string;
}

export interface DashboardTotals {
  today_sales: number;
  today_orders: number;
  monthly_sales: number;
  monthly_orders: number;
  total_sales: number;
  total_orders: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  returned: number;
  products: number;
  customers: number;
  total_stock: number;
  total_expenses: number;
  profit: number;
  estimated_profit?: number;
  daily_sales?: DailySalesMetric[];
  daily_sales_history?: DailySalesMetric[];
  monthly_sales_history?: MonthlySalesMetric[];
  status_distribution?: any;
  best_products?: BestSellingProduct[];
  traffic?: LiveTrafficAnalytics;
}

export interface CartItem {
  product_id: string;
  name: string;
  image_url: string;
  unit_price: number;
  quantity: number;
  stock: number;
  sku?: string;
  selected_color?: string;
  selected_color_code?: string;
}

export interface Review {
  id: string;
  product_id: string;
  rating: number; // 1 to 5
  comment: string;
  user_name: string;
  created_at: string;
  verified_purchase?: boolean;
  images?: string[];
}

export interface ProductRatingStats {
  average: number;
  count: number;
}

export type ProductSortOption = 'newest' | 'best_selling' | 'price_asc' | 'price_desc';
