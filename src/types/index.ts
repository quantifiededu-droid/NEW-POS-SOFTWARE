export interface Business {
  id: string;
  name: string;
  address: string;
  phone: string;
  plan: 'basic' | 'medium' | 'ai';
  created_at: string;
}

export interface User {
  id: string;
  business_id: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier';
  full_name: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  category_id?: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  min_stock_level: number;
  barcode?: string;
  image_url?: string;
  is_active: boolean;
  updated_at: string;
}

export interface Category {
  id: string;
  business_id: string;
  name: string;
}

export interface Sale {
  id: string;
  business_id: string;
  user_id: string;
  total_amount: number;
  payment_method: 'cash' | 'momo';
  status: 'completed' | 'pending' | 'cancelled';
  created_at: string;
  synced: boolean; // For offline tracking
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface SyncQueueItem {
  id?: number;
  type: 'sale' | 'product_update' | 'product_delete' | 'expense';
  data: any;
  created_at: number;
}
