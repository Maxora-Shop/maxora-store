export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  sku?: string;
  image_url: string;
  images?: string[];
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
}

export interface DashboardTotals {
  today_sales: number;
  today_orders: number;
  monthly_sales: number;
  monthly_orders: number;
  delivered: number;
  pending: number;
  processing: number;
  cancelled: number;
  returned: number;
  products: number;
  customers: number;
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
