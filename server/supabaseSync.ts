import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseSchema } from './db';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://wibzacmmwgehqjhokmhn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_KBbaO9WWeWSl9-tEpD5zHQ_vPq_KQr5';

let supabaseClient: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
      }
    });
  }
  return supabaseClient;
};

export class ServerSupabaseSync {
  private isSyncing = false;

  public async loadFromSupabase(): Promise<Partial<DatabaseSchema> | null> {
    try {
      const client = getSupabase();
      
      const [usersRes, storesRes, prodsRes, debtsRes, ordersRes, subsRes, codesRes] = await Promise.allSettled([
        client.from('users').select('*'),
        client.from('stores').select('*'),
        client.from('products').select('*'),
        client.from('debts').select('*'),
        client.from('orders').select('*'),
        client.from('subscriptions').select('*'),
        client.from('activation_codes').select('*'),
      ]);

      const result: Partial<DatabaseSchema> = {};

      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value.data) && usersRes.value.data.length > 0) {
        result.users = usersRes.value.data.map((r: any) => ({
          id: r.id,
          name: r.name,
          phone: r.phone || '',
          email: r.email || '',
          role: r.role,
          storeId: r.store_id,
          status: r.status,
          passwordHash: r.password_hash,
          createdAt: r.created_at,
          ...(r.raw_data || {})
        }));
      }

      if (storesRes.status === 'fulfilled' && Array.isArray(storesRes.value.data) && storesRes.value.data.length > 0) {
        result.stores = storesRes.value.data.map((r: any) => ({
          id: r.id,
          ownerId: r.owner_id,
          ownerName: r.owner_name,
          name: r.name,
          category: r.category,
          description: r.description,
          phone: r.phone,
          address: r.address,
          workingHours: r.working_hours,
          logo: r.logo,
          banner: r.banner,
          location: r.location,
          subscriptionStatus: r.subscription_status,
          status: r.status,
          productsCount: r.products_count,
          ordersCount: r.orders_count,
          createdAt: r.created_at,
          ...(r.raw_data || {})
        }));
      }

      if (prodsRes.status === 'fulfilled' && Array.isArray(prodsRes.value.data) && prodsRes.value.data.length > 0) {
        result.products = prodsRes.value.data.map((r: any) => ({
          id: r.id,
          storeId: r.store_id,
          storeName: r.store_name,
          name: r.name,
          price: Number(r.price) || 0,
          discountPrice: r.discount_price ? Number(r.discount_price) : undefined,
          category: r.category,
          stockQuantity: r.stock_quantity ?? 0,
          minStockAlert: r.min_stock_alert ?? 2,
          isAvailable: r.is_available ?? true,
          isOffer: r.is_offer ?? false,
          description: r.description || '',
          image: r.image || '',
          createdAt: r.created_at,
          ...(r.raw_data || {})
        }));
      }

      if (debtsRes.status === 'fulfilled' && Array.isArray(debtsRes.value.data) && debtsRes.value.data.length > 0) {
        result.debts = debtsRes.value.data.map((r: any) => ({
          id: r.id,
          storeId: r.store_id,
          debtorName: r.debtor_name,
          debtorPhone: r.debtor_phone,
          amount: Number(r.amount) || 0,
          paidAmount: Number(r.paid_amount) || 0,
          remainingAmount: Number(r.remaining_amount) || 0,
          status: r.status,
          details: r.details,
          date: r.date,
          items: Array.isArray(r.items) ? r.items : [],
          payments: Array.isArray(r.payments) ? r.payments : [],
          createdAt: r.created_at,
          ...(r.raw_data || {})
        }));
      }

      if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value.data) && ordersRes.value.data.length > 0) {
        result.orders = ordersRes.value.data.map((r: any) => ({
          id: r.id,
          orderNumber: r.order_number,
          storeId: r.store_id,
          storeName: r.store_name,
          customerId: r.customer_id,
          customerName: r.customer_name,
          customerPhone: r.customer_phone,
          customerAddress: r.customer_address,
          customerLocation: r.customer_location,
          items: Array.isArray(r.items) ? r.items : [],
          totalAmount: Number(r.total_amount) || 0,
          status: r.status,
          statusHistory: Array.isArray(r.status_history) ? r.status_history : [],
          notes: r.notes || '',
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          ...(r.raw_data || {})
        }));
      }

      return Object.keys(result).length > 0 ? result : null;
    } catch (e) {
      console.warn('[Supabase Server Sync] Could not load from Supabase:', e);
      return null;
    }
  }

  public async syncToSupabase(data: DatabaseSchema): Promise<boolean> {
    if (this.isSyncing) return false;
    this.isSyncing = true;

    try {
      const client = getSupabase();

      // Upsert Users
      if (data.users && data.users.length > 0) {
        const userRows = data.users.map(u => ({
          id: u.id,
          name: u.name,
          phone: u.phone,
          email: u.email ? u.email.toLowerCase().trim() : null,
          role: u.role,
          store_id: u.storeId || null,
          status: u.status,
          password_hash: (u as any).passwordHash || null,
          raw_data: u,
          created_at: u.createdAt || new Date().toISOString()
        }));
        await client.from('users').upsert(userRows, { onConflict: 'id' });
      }

      // Upsert Stores
      if (data.stores && data.stores.length > 0) {
        const storeRows = data.stores.map(s => ({
          id: s.id,
          owner_id: s.ownerId,
          owner_name: s.ownerName,
          name: s.name,
          category: s.category,
          description: s.description,
          phone: s.phone,
          address: s.address,
          working_hours: s.workingHours,
          logo: s.logo,
          banner: s.banner,
          location: s.location,
          subscription_status: s.subscriptionStatus,
          status: s.status,
          products_count: s.productsCount || 0,
          orders_count: s.ordersCount || 0,
          raw_data: s,
          created_at: s.createdAt || new Date().toISOString()
        }));
        await client.from('stores').upsert(storeRows, { onConflict: 'id' });
      }

      // Upsert Products
      if (data.products && data.products.length > 0) {
        const prodRows = data.products.map(p => ({
          id: p.id,
          store_id: p.storeId,
          store_name: p.storeName,
          name: p.name,
          price: p.price,
          discount_price: p.discountPrice || null,
          category: p.category,
          stock_quantity: p.stockQuantity ?? 0,
          min_stock_alert: p.minStockAlert ?? 2,
          is_available: p.isAvailable ?? true,
          is_offer: p.isOffer ?? false,
          description: p.description || '',
          image: p.image || '',
          raw_data: p,
          created_at: p.createdAt || new Date().toISOString()
        }));
        await client.from('products').upsert(prodRows, { onConflict: 'id' });
      }

      // Upsert Debts
      if (data.debts && data.debts.length > 0) {
        const debtRows = data.debts.map(d => ({
          id: d.id,
          store_id: d.storeId,
          debtor_name: d.debtorName,
          debtor_phone: d.debtorPhone,
          amount: d.amount,
          paid_amount: d.paidAmount,
          remaining_amount: d.remainingAmount,
          status: d.status,
          details: d.details,
          date: d.date,
          items: d.items,
          payments: d.payments,
          raw_data: d,
          created_at: d.createdAt || new Date().toISOString()
        }));
        await client.from('debts').upsert(debtRows, { onConflict: 'id' });
      }

      // Upsert Orders
      if (data.orders && data.orders.length > 0) {
        const orderRows = data.orders.map(o => ({
          id: o.id,
          order_number: o.orderNumber,
          store_id: o.storeId,
          store_name: o.storeName,
          customer_id: o.customerId,
          customer_name: o.customerName,
          customer_phone: o.customerPhone,
          items: o.items,
          total_amount: o.totalAmount,
          status: o.status,
          status_history: o.statusHistory,
          notes: o.notes,
          raw_data: o,
          created_at: o.createdAt || new Date().toISOString()
        }));
        await client.from('orders').upsert(orderRows, { onConflict: 'id' });
      }

      // Upsert Activation Codes
      if (data.activationCodes && data.activationCodes.length > 0) {
        const codeRows = data.activationCodes.map(c => ({
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
        await client.from('activation_codes').upsert(codeRows, { onConflict: 'id' });
      }

      return true;
    } catch (err) {
      console.warn('[Supabase Server Sync] Error during sync to Supabase:', err);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  public async deleteStoreCascade(storeId: string): Promise<void> {
    try {
      const client = getSupabase();
      await client.from('products').delete().eq('store_id', storeId);
      await client.from('debts').delete().eq('store_id', storeId);
      await client.from('orders').delete().eq('store_id', storeId);
      await client.from('stores').delete().eq('id', storeId);
    } catch (e) {
      console.warn('[Supabase Server Sync] deleteStoreCascade error:', e);
    }
  }
}

export const serverSupabase = new ServerSupabaseSync();
