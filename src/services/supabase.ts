import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Store, Product, Debt, Order, User, Subscription, ActivationCode } from '../types';

// Supabase Cloud Configuration with Safe Fallbacks
export const DEFAULT_SUPABASE_URL = 'https://wibzacmmwgehqjhokmhn.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_KBbaO9WWeWSl9-tEpD5zHQ_vPq_KQr5';

export const getSupabaseUrl = (): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const url = (import.meta as any).env.VITE_SUPABASE_URL;
      if (url && typeof url === 'string' && url.trim().length > 0) return url.trim();
    }
  } catch (e) {}
  try {
    if (typeof process !== 'undefined' && process.env) {
      const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      if (url && typeof url === 'string' && url.trim().length > 0) return url.trim();
    }
  } catch (e) {}
  return DEFAULT_SUPABASE_URL;
};

export const getSupabaseAnonKey = (): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const key = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
      if (key && typeof key === 'string' && key.trim().length > 0) return key.trim();
    }
  } catch (e) {}
  try {
    if (typeof process !== 'undefined' && process.env) {
      const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
      if (key && typeof key === 'string' && key.trim().length > 0) return key.trim();
    }
  } catch (e) {}
  return DEFAULT_SUPABASE_ANON_KEY;
};

export const SUPABASE_URL = getSupabaseUrl();
export const SUPABASE_ANON_KEY = getSupabaseAnonKey();

// Initialize Supabase Client Safely
function initSupabaseClient(): SupabaseClient {
  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: typeof window !== 'undefined',
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        }
      }
    });
  } catch (err) {
    console.warn('[Supabase] Warning initializing main client, falling back:', err);
    return createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
  }
}

export const supabase: SupabaseClient = initSupabaseClient();

// SQL Schema for manual initialization in Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `
-- =========================================================================
-- SQL Schema for Aswaq Qalat Sukkar Cloud Database (Supabase PostgreSQL)
-- =========================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'customer',
  store_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  password_hash TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Stores Table
CREATE TABLE IF NOT EXISTS public.stores (
  id TEXT PRIMARY KEY,
  owner_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  owner_name TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  address TEXT,
  working_hours TEXT,
  logo TEXT,
  banner TEXT,
  location JSONB,
  subscription_status TEXT DEFAULT 'active',
  status TEXT DEFAULT 'active',
  products_count INT DEFAULT 0,
  orders_count INT DEFAULT 0,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
  store_name TEXT,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  discount_price NUMERIC,
  category TEXT NOT NULL,
  stock_quantity INT DEFAULT 0,
  min_stock_alert INT DEFAULT 2,
  is_available BOOLEAN DEFAULT TRUE,
  is_offer BOOLEAN DEFAULT FALSE,
  description TEXT,
  image TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Debts Table (دفتر ديون التجار)
CREATE TABLE IF NOT EXISTS public.debts (
  id TEXT PRIMARY KEY,
  store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
  debtor_name TEXT NOT NULL,
  debtor_phone TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  remaining_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid',
  details TEXT,
  date TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  payments JSONB DEFAULT '[]'::jsonb,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT,
  store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
  store_name TEXT,
  customer_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  customer_location JSONB,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new',
  status_history JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Activation Codes Table (أكواد تفعيل اشتراكات التجار)
CREATE TABLE IF NOT EXISTS public.activation_codes (
  code TEXT PRIMARY KEY,
  plan_name TEXT NOT NULL,
  duration_months INT NOT NULL DEFAULT 1,
  is_used BOOLEAN DEFAULT FALSE,
  used_by_store_id TEXT,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY,
  store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  duration_months INT NOT NULL DEFAULT 1,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  activation_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) & Public Policies for seamless API and anon key access
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow Public / Anon access for app operation
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public access for users" ON public.users;
  CREATE POLICY "Public access for users" ON public.users FOR ALL USING (true) WITH CHECK (true);
  
  DROP POLICY IF EXISTS "Public access for stores" ON public.stores;
  CREATE POLICY "Public access for stores" ON public.stores FOR ALL USING (true) WITH CHECK (true);
  
  DROP POLICY IF EXISTS "Public access for products" ON public.products;
  CREATE POLICY "Public access for products" ON public.products FOR ALL USING (true) WITH CHECK (true);
  
  DROP POLICY IF EXISTS "Public access for debts" ON public.debts;
  CREATE POLICY "Public access for debts" ON public.debts FOR ALL USING (true) WITH CHECK (true);
  
  DROP POLICY IF EXISTS "Public access for orders" ON public.orders;
  CREATE POLICY "Public access for orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
  
  DROP POLICY IF EXISTS "Public access for activation_codes" ON public.activation_codes;
  CREATE POLICY "Public access for activation_codes" ON public.activation_codes FOR ALL USING (true) WITH CHECK (true);
  
  DROP POLICY IF EXISTS "Public access for subscriptions" ON public.subscriptions;
  CREATE POLICY "Public access for subscriptions" ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);
END $$;

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.stores, public.products, public.debts, public.orders, public.users;
`;

// Helper: Transformers between App Models and Supabase Rows

export const mapStoreFromRow = (row: any): Store => {
  if (!row) return row;
  return {
    id: row.id,
    ownerId: row.owner_id || row.ownerId || '',
    ownerName: row.owner_name || row.ownerName || '',
    name: row.name || '',
    category: row.category || 'عام',
    description: row.description || '',
    phone: row.phone || '',
    address: row.address || '',
    workingHours: row.working_hours || row.workingHours || '',
    logo: row.logo || '',
    banner: row.banner || '',
    location: row.location || { lat: 31.8596, lng: 46.0683, addressName: row.address || 'قلعة سكر' },
    subscriptionStatus: row.subscription_status || row.subscriptionStatus || 'active',
    status: row.status || 'active',
    productsCount: row.products_count ?? row.productsCount ?? 0,
    ordersCount: row.orders_count ?? row.ordersCount ?? 0,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    ...(row.raw_data || {})
  };
};

export const mapStoreToRow = (store: Store): any => {
  return {
    id: store.id,
    owner_id: store.ownerId,
    owner_name: store.ownerName,
    name: store.name,
    category: store.category,
    description: store.description || '',
    phone: store.phone || '',
    address: store.address || '',
    working_hours: store.workingHours || '',
    logo: store.logo || '',
    banner: store.banner || '',
    location: store.location,
    subscription_status: store.subscriptionStatus || 'active',
    status: store.status || 'active',
    products_count: store.productsCount || 0,
    orders_count: store.ordersCount || 0,
    raw_data: store,
    updated_at: new Date().toISOString(),
    created_at: store.createdAt || new Date().toISOString()
  };
};

export const mapProductFromRow = (row: any): Product => {
  if (!row) return row;
  return {
    id: row.id,
    storeId: row.store_id || row.storeId || '',
    storeName: row.store_name || row.storeName || '',
    name: row.name || '',
    price: Number(row.price) || 0,
    discountPrice: row.discount_price ? Number(row.discount_price) : (row.discountPrice ? Number(row.discountPrice) : undefined),
    category: row.category || '',
    stockQuantity: Number(row.stock_quantity ?? row.stockQuantity ?? 0),
    minStockAlert: Number(row.min_stock_alert ?? row.minStockAlert ?? 2),
    isAvailable: row.is_available ?? row.isAvailable ?? true,
    isOffer: row.is_offer ?? row.isOffer ?? false,
    description: row.description || '',
    image: row.image || '',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    ...(row.raw_data || {})
  };
};

export const mapProductToRow = (product: Product): any => {
  return {
    id: product.id,
    store_id: product.storeId,
    store_name: product.storeName || '',
    name: product.name,
    price: product.price,
    discount_price: product.discountPrice || null,
    category: product.category,
    stock_quantity: product.stockQuantity ?? 0,
    min_stock_alert: product.minStockAlert ?? 2,
    is_available: product.isAvailable ?? true,
    is_offer: product.isOffer ?? false,
    description: product.description || '',
    image: product.image || '',
    raw_data: product,
    updated_at: new Date().toISOString(),
    created_at: product.createdAt || new Date().toISOString()
  };
};

export const mapDebtFromRow = (row: any): Debt => {
  if (!row) return row;
  return {
    id: row.id,
    storeId: row.store_id || row.storeId || '',
    debtorName: row.debtor_name || row.debtorName || '',
    debtorPhone: row.debtor_phone || row.debtorPhone || '',
    amount: Number(row.amount) || 0,
    paidAmount: Number(row.paid_amount ?? row.paidAmount ?? 0),
    remainingAmount: Number(row.remaining_amount ?? row.remainingAmount ?? 0),
    status: row.status || 'unpaid',
    details: row.details || '',
    date: row.date || new Date().toISOString().split('T')[0],
    items: Array.isArray(row.items) ? row.items : [],
    payments: Array.isArray(row.payments) ? row.payments : [],
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    ...(row.raw_data || {})
  };
};

export const mapDebtToRow = (debt: Debt): any => {
  return {
    id: debt.id,
    store_id: debt.storeId,
    debtor_name: debt.debtorName,
    debtor_phone: debt.debtorPhone || '',
    amount: debt.amount,
    paid_amount: debt.paidAmount,
    remaining_amount: debt.remainingAmount,
    status: debt.status,
    details: debt.details || '',
    date: debt.date || new Date().toISOString().split('T')[0],
    items: debt.items || [],
    payments: debt.payments || [],
    raw_data: debt,
    updated_at: new Date().toISOString(),
    created_at: debt.createdAt || new Date().toISOString()
  };
};

export const mapOrderFromRow = (row: any): Order => {
  if (!row) return row;
  return {
    id: row.id,
    orderNumber: row.order_number || row.orderNumber || 'QS-' + row.id.slice(-4),
    storeId: row.store_id || row.storeId || '',
    storeName: row.store_name || row.storeName || '',
    customerId: row.customer_id || row.customerId || '',
    customerName: row.customer_name || row.customerName || '',
    customerPhone: row.customer_phone || row.customerPhone || '',
    customerAddress: row.customer_address || row.customerAddress || '',
    customerLocation: row.customer_location || row.customerLocation,
    items: Array.isArray(row.items) ? row.items : [],
    totalAmount: Number(row.total_amount ?? row.totalAmount ?? 0),
    status: row.status || 'new',
    statusHistory: Array.isArray(row.status_history) ? row.status_history : (Array.isArray(row.statusHistory) ? row.statusHistory : []),
    notes: row.notes || '',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
    ...(row.raw_data || {})
  };
};

export const mapOrderToRow = (order: Order): any => {
  return {
    id: order.id,
    order_number: order.orderNumber,
    store_id: order.storeId,
    store_name: order.storeName || '',
    customer_id: order.customerId || '',
    customer_name: order.customerName || '',
    customer_phone: order.customerPhone || '',
    items: order.items || [],
    total_amount: order.totalAmount,
    status: order.status,
    status_history: order.statusHistory || [],
    notes: order.notes || '',
    raw_data: order,
    updated_at: order.updatedAt || new Date().toISOString(),
    created_at: order.createdAt || new Date().toISOString()
  };
};

export const mapUserFromRow = (row: any): User => {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name || '',
    phone: row.phone || '',
    email: row.email || '',
    role: row.role || 'customer',
    storeId: row.store_id || row.storeId,
    status: row.status || 'active',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    ...(row.raw_data || {})
  };
};

export const mapUserToRow = (user: User, passwordHash?: string): any => {
  const row: any = {
    id: user.id,
    name: user.name,
    phone: user.phone || '',
    email: user.email ? user.email.toLowerCase().trim() : '',
    role: user.role,
    store_id: user.storeId || null,
    status: user.status || 'active',
    raw_data: user,
    updated_at: new Date().toISOString(),
    created_at: user.createdAt || new Date().toISOString()
  };
  if (passwordHash) {
    row.password_hash = passwordHash;
  }
  return row;
};

// =========================================================================
// Supabase Cloud Data Services
// =========================================================================

export const supabaseService = {
  // Test Connection
  async testConnection(): Promise<{ ok: boolean; message: string; latencyMs: number; tablesCount: Record<string, number> }> {
    const startTime = Date.now();
    const counts: Record<string, number> = { stores: 0, products: 0, debts: 0, orders: 0, users: 0 };
    
    try {
      const [storesRes, prodsRes, debtsRes, ordersRes, usersRes] = await Promise.allSettled([
        supabase.from('stores').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('debts').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
      ]);

      if (storesRes.status === 'fulfilled' && storesRes.value.count !== null) counts.stores = storesRes.value.count || 0;
      if (prodsRes.status === 'fulfilled' && prodsRes.value.count !== null) counts.products = prodsRes.value.count || 0;
      if (debtsRes.status === 'fulfilled' && debtsRes.value.count !== null) counts.debts = debtsRes.value.count || 0;
      if (ordersRes.status === 'fulfilled' && ordersRes.value.count !== null) counts.orders = ordersRes.value.count || 0;
      if (usersRes.status === 'fulfilled' && usersRes.value.count !== null) counts.users = usersRes.value.count || 0;

      const latencyMs = Date.now() - startTime;
      return {
        ok: true,
        message: 'تم الاتصال بقاعدة بيانات Supabase السحابية بنجاح!',
        latencyMs,
        tablesCount: counts
      };
    } catch (err: any) {
      return {
        ok: false,
        message: err.message || 'فشل الاتصال بـ Supabase',
        latencyMs: Date.now() - startTime,
        tablesCount: counts
      };
    }
  },

  // Stores
  async getStores(): Promise<Store[]> {
    try {
      const { data, error } = await supabase.from('stores').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapStoreFromRow);
    } catch (e) {
      console.warn('Supabase getStores error:', e);
      return [];
    }
  },

  async getStoreById(id: string): Promise<Store | null> {
    try {
      const { data, error } = await supabase.from('stores').select('*').eq('id', id).single();
      if (error || !data) return null;
      return mapStoreFromRow(data);
    } catch (e) {
      return null;
    }
  },

  async upsertStore(store: Store): Promise<Store> {
    const row = mapStoreToRow(store);
    const { data, error } = await supabase.from('stores').upsert(row).select().single();
    if (error) {
      console.error('Supabase upsertStore error:', error);
      throw error;
    }
    return mapStoreFromRow(data);
  },

  async deleteStore(id: string): Promise<boolean> {
    try {
      // First delete products and debts of store
      await supabase.from('products').delete().eq('store_id', id);
      await supabase.from('debts').delete().eq('store_id', id);
      const { error } = await supabase.from('stores').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Supabase deleteStore error:', e);
      throw e;
    }
  },

  // Products
  async getProducts(storeId?: string): Promise<Product[]> {
    try {
      let query = supabase.from('products').select('*').order('created_at', { ascending: false });
      if (storeId) {
        query = query.eq('store_id', storeId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapProductFromRow);
    } catch (e) {
      console.warn('Supabase getProducts error:', e);
      return [];
    }
  },

  async upsertProduct(product: Product): Promise<Product> {
    const row = mapProductToRow(product);
    const { data, error } = await supabase.from('products').upsert(row).select().single();
    if (error) throw error;
    return mapProductFromRow(data);
  },

  async deleteProduct(id: string): Promise<boolean> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // Debts
  async getDebts(storeId?: string): Promise<Debt[]> {
    try {
      let query = supabase.from('debts').select('*').order('created_at', { ascending: false });
      if (storeId) {
        query = query.eq('store_id', storeId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapDebtFromRow);
    } catch (e) {
      console.warn('Supabase getDebts error:', e);
      return [];
    }
  },

  async upsertDebt(debt: Debt): Promise<Debt> {
    const row = mapDebtToRow(debt);
    const { data, error } = await supabase.from('debts').upsert(row).select().single();
    if (error) throw error;
    return mapDebtFromRow(data);
  },

  async deleteDebt(id: string): Promise<boolean> {
    const { error } = await supabase.from('debts').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // Orders
  async getOrders(customerId?: string, storeId?: string): Promise<Order[]> {
    try {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (customerId) query = query.eq('customer_id', customerId);
      if (storeId) query = query.eq('store_id', storeId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapOrderFromRow);
    } catch (e) {
      console.warn('Supabase getOrders error:', e);
      return [];
    }
  },

  async upsertOrder(order: Order): Promise<Order> {
    const row = mapOrderToRow(order);
    const { data, error } = await supabase.from('orders').upsert(row).select().single();
    if (error) throw error;
    return mapOrderFromRow(data);
  },

  // Users
  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapUserFromRow);
    } catch (e) {
      console.warn('Supabase getUsers error:', e);
      return [];
    }
  },

  async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
      if (error || !data) return null;
      return mapUserFromRow(data);
    } catch (e) {
      return null;
    }
  },

  async upsertUser(user: User, passwordHash?: string): Promise<User> {
    const row = mapUserToRow(user, passwordHash);
    const { data, error } = await supabase.from('users').upsert(row).select().single();
    if (error) throw error;
    return mapUserFromRow(data);
  },

  // Codes
  async getActivationCodes(): Promise<ActivationCode[]> {
    try {
      const { data, error } = await supabase.from('activation_codes').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id || row.code,
        code: row.code,
        maxUses: row.max_uses || 1,
        usedCount: row.used_count || 0,
        usedByStoreIds: row.used_by_store_ids || [],
        usedByStoreNames: row.used_by_store_names || [],
        expiresAt: row.expires_at || new Date(Date.now() + 30 * 86400000).toISOString(),
        status: row.status || (row.is_used ? 'disabled' : 'active'),
        note: row.note || '',
        createdAt: row.created_at || new Date().toISOString()
      }));
    } catch (e) {
      return [];
    }
  },

  async upsertActivationCode(code: ActivationCode): Promise<void> {
    await supabase.from('activation_codes').upsert({
      id: code.id || code.code,
      code: code.code,
      max_uses: code.maxUses || 1,
      used_count: code.usedCount || 0,
      used_by_store_ids: code.usedByStoreIds || [],
      used_by_store_names: code.usedByStoreNames || [],
      expires_at: code.expiresAt,
      status: code.status,
      note: code.note || '',
      created_at: code.createdAt || new Date().toISOString()
    });
  },

  // Subscriptions
  async getSubscriptions(): Promise<Subscription[]> {
    try {
      const { data, error } = await supabase.from('subscriptions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        storeId: row.store_id,
        storeName: row.store_name || '',
        ownerName: row.owner_name || '',
        planName: row.plan_name || 'باقة التجار',
        price: Number(row.price || 0),
        durationMonths: Number(row.duration_months || 1),
        startDate: row.start_date || new Date().toISOString(),
        endDate: row.end_date || new Date(Date.now() + 30 * 86400000).toISOString(),
        status: row.status || 'active',
        createdAt: row.created_at || new Date().toISOString()
      }));
    } catch (e) {
      return [];
    }
  },

  async upsertSubscription(sub: Subscription): Promise<void> {
    await supabase.from('subscriptions').upsert({
      id: sub.id,
      store_id: sub.storeId,
      store_name: sub.storeName || '',
      owner_name: sub.ownerName || '',
      plan_name: sub.planName,
      price: sub.price || 0,
      duration_months: sub.durationMonths,
      start_date: sub.startDate,
      end_date: sub.endDate,
      status: sub.status,
      created_at: sub.createdAt || new Date().toISOString()
    });
  },

  // Realtime Live Subscription helper
  subscribeToChanges(table: 'stores' | 'products' | 'debts' | 'orders' | 'users', callback: (payload: any) => void) {
    try {
      if (!supabase || typeof supabase.channel !== 'function') return null;
      return supabase
        .channel(`public:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          try {
            callback(payload);
          } catch (err) {
            console.warn(`[Supabase Realtime] error in listener for ${table}:`, err);
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // connection established
          }
        });
    } catch (e) {
      console.warn(`[Supabase Realtime] Subscribe error for ${table}:`, e);
      return null;
    }
  },

  // Full Cloud Sync: Syncs an entire dataset to Supabase in one operation
  async syncDatasetToSupabase(dataset: {
    stores?: Store[];
    products?: Product[];
    debts?: Debt[];
    orders?: Order[];
    users?: User[];
    subscriptions?: Subscription[];
    activationCodes?: ActivationCode[];
  }): Promise<{ success: boolean; stats: Record<string, number>; errors: string[] }> {
    const stats: Record<string, number> = { stores: 0, products: 0, debts: 0, orders: 0, users: 0, codes: 0, subs: 0 };
    const errors: string[] = [];

    // 1. Users
    if (dataset.users && dataset.users.length > 0) {
      try {
        const rows = dataset.users.map(u => mapUserToRow(u));
        const { error } = await supabase.from('users').upsert(rows);
        if (error) errors.push(`Users sync error: ${error.message}`);
        else stats.users = rows.length;
      } catch (e: any) {
        errors.push(`Users error: ${e.message}`);
      }
    }

    // 2. Stores
    if (dataset.stores && dataset.stores.length > 0) {
      try {
        const rows = dataset.stores.map(s => mapStoreToRow(s));
        const { error } = await supabase.from('stores').upsert(rows);
        if (error) errors.push(`Stores sync error: ${error.message}`);
        else stats.stores = rows.length;
      } catch (e: any) {
        errors.push(`Stores error: ${e.message}`);
      }
    }

    // 3. Products
    if (dataset.products && dataset.products.length > 0) {
      try {
        const rows = dataset.products.map(p => mapProductToRow(p));
        const { error } = await supabase.from('products').upsert(rows);
        if (error) errors.push(`Products sync error: ${error.message}`);
        else stats.products = rows.length;
      } catch (e: any) {
        errors.push(`Products error: ${e.message}`);
      }
    }

    // 4. Debts
    if (dataset.debts && dataset.debts.length > 0) {
      try {
        const rows = dataset.debts.map(d => mapDebtToRow(d));
        const { error } = await supabase.from('debts').upsert(rows);
        if (error) errors.push(`Debts sync error: ${error.message}`);
        else stats.debts = rows.length;
      } catch (e: any) {
        errors.push(`Debts error: ${e.message}`);
      }
    }

    // 5. Orders
    if (dataset.orders && dataset.orders.length > 0) {
      try {
        const rows = dataset.orders.map(o => mapOrderToRow(o));
        const { error } = await supabase.from('orders').upsert(rows);
        if (error) errors.push(`Orders sync error: ${error.message}`);
        else stats.orders = rows.length;
      } catch (e: any) {
        errors.push(`Orders error: ${e.message}`);
      }
    }

    // 6. Activation Codes
    if (dataset.activationCodes && dataset.activationCodes.length > 0) {
      try {
        const rows = dataset.activationCodes.map(c => ({
          id: c.id || c.code,
          code: c.code,
          max_uses: c.maxUses || 1,
          used_count: c.usedCount || 0,
          used_by_store_ids: c.usedByStoreIds || [],
          used_by_store_names: c.usedByStoreNames || [],
          expires_at: c.expiresAt,
          status: c.status,
          note: c.note || '',
          created_at: c.createdAt || new Date().toISOString()
        }));
        const { error } = await supabase.from('activation_codes').upsert(rows);
        if (error) errors.push(`Codes sync error: ${error.message}`);
        else stats.codes = rows.length;
      } catch (e: any) {
        errors.push(`Codes error: ${e.message}`);
      }
    }

    return {
      success: errors.length === 0,
      stats,
      errors
    };
  },

  async syncFullSnapshotToCloud(dataset: {
    stores?: Store[];
    products?: Product[];
    debts?: Debt[];
    orders?: Order[];
    users?: User[];
    subscriptions?: Subscription[];
    activationCodes?: ActivationCode[];
  }): Promise<{
    syncedStores: number;
    syncedProducts: number;
    syncedDebts: number;
    syncedOrders: number;
    syncedUsers: number;
    errors: string[];
  }> {
    const res = await this.syncDatasetToSupabase(dataset);
    return {
      syncedStores: res.stats.stores || 0,
      syncedProducts: res.stats.products || 0,
      syncedDebts: res.stats.debts || 0,
      syncedOrders: res.stats.orders || 0,
      syncedUsers: res.stats.users || 0,
      errors: res.errors
    };
  }
};
