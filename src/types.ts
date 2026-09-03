export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  sku?: string;
  image_url: string;
  images?: string[];
  product_link?: string;
  buying_price: number;
  selling_price: number;
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
  og_image?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  alt_phone?: string;
  email?: string;
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
  area: string;
  address: string;
  delivery_area: 'inside_dhaka' | 'sub_dhaka' | 'outside_dhaka' | string;
  delivery_charge: number;
  subtotal: number;
  total: number;
  status: OrderStatus;
  payment_method: string;
  note?: string;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
}

export interface StoreSettings {
  store_name: string;
  store_tagline: string;
  delivery_inside_dhaka: string | number;
  delivery_sub_dhaka: string | number;
  delivery_outside_dhaka: string | number;
  currency: string;
  phone: string;
  whatsapp?: string;
  facebook?: string;
  logo_url?: string;
  hero_title: string;
  hero_subtitle: string;
  promo_text: string;
  footer_text: string;
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
  daily_sales?: DailySalesMetric[];
  monthly_sales_history?: MonthlySalesMetric[];
  status_distribution?: StatusDistribution[];
  best_products?: BestSellingProduct[];
}

export interface CartItem {
  product_id: string;
  name: string;
  image_url: string;
  unit_price: number;
  quantity: number;
  stock: number;
  sku?: string;
}
