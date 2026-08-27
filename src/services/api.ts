import { 
  User, 
  Store, 
  Product, 
  Order, 
  Debt, 
  Sale, 
  SaleItem, 
  Subscription, 
  ActivationCode, 
  PlatformStats,
  OrderStatus
} from '../types';
import { syncService } from './localStorageSync';

class ApiClient {
  private userId: string | null = null;

  constructor() {
    this.userId = localStorage.getItem('aswaq_user_id');
    // Run initial auto-sync with localStorage
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        syncService.syncWithServer();
      }, 500);
    }
  }

  public setUserId(id: string | null) {
    this.userId = id;
    if (id) {
      localStorage.setItem('aswaq_user_id', id);
    } else {
      localStorage.removeItem('aswaq_user_id');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.userId) {
      headers['x-user-id'] = this.userId;
      headers['Authorization'] = `Bearer ${this.userId}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'حدث خطأ غير متوقع أثناء معالجة الطلب.');
    }

    // Automatically queue local storage sync after modifying actions
    if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
      syncService.queueAutoSync(500);
    }

    return data as T;
  }

  // --- Auth ---
  public async getAdminStatus() {
    return this.request<{ isSuperAdminInitialized: boolean }>('/api/auth/admin-status');
  }

  public async setupInitialSuperAdmin(payload: { name?: string; phone?: string; email: string; password: string }) {
    const res = await this.request<{ message: string; user: User }>('/api/auth/setup-initial-admin', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.user) {
      this.setUserId(res.user.id);
    }
    return res;
  }

  public async registerCustomer(payload: { name: string; phone: string; email: string; password: string }) {
    return this.request<{ message: string; user: User }>('/api/auth/register-customer', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async registerStoreOwner(payload: {
    name: string;
    phone: string;
    email: string;
    password: string;
    storeName: string;
    category?: string;
    address?: string;
    activationCode: string;
  }) {
    return this.request<{ message: string; user: User; store: Store }>('/api/auth/register-store-owner', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async login(payload: { email: string; password: string }) {
    const res = await this.request<{ message: string; user: User; store: Store | null }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.user) {
      this.setUserId(res.user.id);
    }
    return res;
  }

  public async requestPasswordReset(email: string) {
    return this.request<{ message: string; resetToken: string; resetLink: string; email: string }>('/api/auth/request-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  public async resetPassword(payload: { token: string; newPassword: string }) {
    return this.request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Customer / Public ---
  public async getStores() {
    return this.request<{ stores: Store[] }>('/api/stores');
  }

  public async getStore(id: string) {
    return this.request<{ store: Store; products: Product[] }>(`/api/stores/${id}`);
  }

  public async searchProducts(query?: string, category?: string) {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (category) params.append('category', category);
    return this.request<{ products: Product[]; total: number }>(`/api/products/search?${params.toString()}`);
  }

  public async createOrder(payload: { storeId: string; items: { productId: string; quantity: number }[]; notes?: string }) {
    return this.request<{ message: string; order: Order }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getCustomerOrders() {
    return this.request<{ orders: Order[] }>('/api/customer/orders');
  }

  public async getOrders() {
    return this.getCustomerOrders();
  }

  // --- Store Owner ---
  public async getOwnerStore() {
    return this.request<{ store: Store; subscription?: Subscription }>('/api/owner/store');
  }

  public async updateOwnerStore(payload: Partial<Store>) {
    return this.request<{ message: string; store: Store }>('/api/owner/store', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public async updateMyStore(payload: Partial<Store>) {
    return this.updateOwnerStore(payload);
  }

  public async getOwnerProducts() {
    return this.request<{ products: Product[] }>('/api/owner/products');
  }

  public async getMyProducts() {
    return this.getOwnerProducts();
  }

  public async addProduct(payload: Partial<Product>) {
    return this.request<{ message: string; product: Product }>('/api/owner/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async createProduct(payload: Partial<Product>) {
    return this.addProduct(payload);
  }

  public async updateProduct(id: string, payload: Partial<Product>) {
    return this.request<{ message: string; product: Product }>(`/api/owner/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public async deleteProduct(id: string) {
    return this.request<{ message: string }>(`/api/owner/products/${id}`, {
      method: 'DELETE',
    });
  }

  public async getOwnerOrders() {
    return this.request<{ orders: Order[] }>('/api/owner/orders');
  }

  public async getMyOrders() {
    return this.getOwnerOrders();
  }

  public async updateOrderStatus(orderId: string, status: OrderStatus, note?: string) {
    return this.request<{ message: string; order: Order }>(`/api/owner/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    });
  }

  public async getOwnerDebts() {
    return this.request<{ debts: Debt[] }>('/api/owner/debts');
  }

  public async getMyDebts() {
    return this.getOwnerDebts();
  }

  public async addDebt(payload: {
    customerName?: string;
    customerPhone?: string;
    debtorName?: string;
    debtorPhone?: string;
    amount?: number;
    itemDescription?: string;
    details?: string;
    notes?: string;
    dueDate?: string;
    date?: string;
    time?: string;
  }) {
    return this.request<{ message: string; debt: Debt }>('/api/owner/debts', {
      method: 'POST',
      body: JSON.stringify({
        debtorName: (payload.customerName || payload.debtorName || '').trim(),
        debtorPhone: (payload.customerPhone || payload.debtorPhone || '').trim(),
        amount: Number(payload.amount) || 0,
        itemDescription: payload.itemDescription || payload.notes || payload.details || '',
        details: payload.details || payload.notes || '',
        notes: payload.notes || '',
        date: payload.dueDate || payload.date || new Date().toISOString().split('T')[0],
        time: payload.time,
      }),
    });
  }

  public async createDebt(payload: {
    customerName?: string;
    customerPhone?: string;
    debtorName?: string;
    debtorPhone?: string;
    amount?: number;
    itemDescription?: string;
    details?: string;
    notes?: string;
    dueDate?: string;
    date?: string;
    time?: string;
  }) {
    return this.addDebt(payload);
  }

  public async addDebtItem(
    debtId: string,
    payload: {
      itemDescription: string;
      amount: number;
      date?: string;
      time?: string;
      notes?: string;
    }
  ) {
    return this.request<{ message: string; debt: Debt }>(`/api/owner/debts/${debtId}/items`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async deleteDebtItem(debtId: string, itemId: string) {
    return this.request<{ message: string; debt: Debt }>(`/api/owner/debts/${debtId}/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  public async payDebt(debtId: string, payload: { amount: number; note?: string; date?: string }) {
    return this.request<{ message: string; debt: Debt }>(`/api/owner/debts/${debtId}/pay`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async recordDebtPayment(debtId: string, amount: number, note?: string, date?: string) {
    return this.payDebt(debtId, { amount, note, date });
  }

  public async settleDebtFull(debtId: string, payload?: { note?: string }) {
    return this.request<{ message: string; debt: Debt }>(`/api/owner/debts/${debtId}/settle`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  }

  public async deleteDebt(debtId: string) {
    return this.request<{ message: string }>(`/api/owner/debts/${debtId}`, {
      method: 'DELETE',
    });
  }

  public async getOwnerSales() {
    return this.request<{ sales: Sale[] }>('/api/owner/sales');
  }

  public async getMySales() {
    return this.getOwnerSales();
  }

  public async addSale(payload: { 
    items: SaleItem[];
    subtotalAmount?: number;
    discountAmount?: number;
    totalAmount: number;
    paymentType?: 'cash' | 'debt' | 'electronic';
    customerName?: string;
    customerPhone?: string;
    notes?: string;
    date?: string;
    description?: string;
    amount?: number;
  }) {
    const finalItems = payload.items && payload.items.length > 0 
      ? payload.items 
      : [{ name: payload.description || 'مبيعات مباشرة', price: payload.amount || payload.totalAmount || 0, quantity: 1, subtotal: payload.amount || payload.totalAmount || 0 }];
    
    const finalTotal = payload.totalAmount || payload.amount || 0;

    return this.request<{ message: string; sale: Sale; products?: Product[] }>('/api/owner/sales', {
      method: 'POST',
      body: JSON.stringify({
        items: finalItems,
        subtotalAmount: payload.subtotalAmount || finalTotal,
        discountAmount: payload.discountAmount || 0,
        totalAmount: finalTotal,
        paymentType: payload.paymentType || 'cash',
        customerName: payload.customerName || 'زبون نقدي عام',
        customerPhone: payload.customerPhone || '',
        notes: payload.notes || payload.description || '',
        date: payload.date || new Date().toISOString().split('T')[0],
      }),
    });
  }

  public async recordSale(payload: any) {
    return this.addSale(payload);
  }

  // --- Super Admin ---
  public async getAdminStats() {
    return this.request<{ stats: PlatformStats }>('/api/admin/stats');
  }

  public async getAdminStores() {
    return this.request<{ stores: Store[] }>('/api/admin/stores');
  }

  public async getAllStoresAdmin() {
    return this.getAdminStores();
  }

  public async updateStoreAdmin(storeId: string, payload: Partial<Store>) {
    return this.request<{ message: string; store: Store }>(`/api/admin/stores/${storeId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public async toggleStoreStatus(storeId: string, status: 'active' | 'inactive') {
    return this.request<{ message: string; store: Store }>(`/api/admin/stores/${storeId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  public async updateStoreStatus(storeId: string, status: string) {
    const s = status === 'active' ? 'active' : 'inactive';
    return this.toggleStoreStatus(storeId, s);
  }

  public async updateStoreLocationAdmin(storeId: string, payload: { lat: number; lng: number; addressName?: string }) {
    return this.request<{ message: string; store: Store }>(`/api/admin/stores/${storeId}/location`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public async deleteStorePermanent(storeId: string, confirmText: string = 'حذف') {
    return this.request<{ message: string }>(`/api/admin/stores/${storeId}`, {
      method: 'DELETE',
      body: JSON.stringify({ confirmText }),
    });
  }

  public async deleteStorePermanently(storeId: string, confirmText: string = 'حذف') {
    return this.deleteStorePermanent(storeId, confirmText);
  }

  public async getAdminOwners() {
    return this.request<{ owners: (User & { store?: Store })[] }>('/api/admin/owners');
  }

  public async getAdminUsers() {
    return this.request<{ users: User[] }>('/api/admin/users');
  }

  public async getAllUsersAdmin() {
    return this.getAdminUsers();
  }

  public async toggleUserStatus(userId: string, status: 'active' | 'disabled' | 'banned') {
    return this.request<{ message: string; user: User }>(`/api/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  public async getAdminProducts(storeId?: string) {
    const query = storeId ? `?storeId=${encodeURIComponent(storeId)}` : '';
    return this.request<{ products: Product[] }>(`/api/admin/products${query}`);
  }

  public async updateAdminProduct(id: string, payload: Partial<Product>) {
    return this.request<{ message: string; product: Product }>(`/api/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public async deleteAdminProduct(id: string) {
    return this.request<{ message: string }>(`/api/admin/products/${id}`, {
      method: 'DELETE',
    });
  }

  public async getAdminOrders() {
    return this.request<{ orders: Order[] }>('/api/admin/orders');
  }

  public async updateAdminOrderStatus(orderId: string, status: OrderStatus, note?: string) {
    return this.request<{ message: string; order: Order }>(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    });
  }

  public async getAdminSubscriptions() {
    return this.request<{ subscriptions: Subscription[] }>('/api/admin/subscriptions');
  }

  public async getAllSubscriptionsAdmin() {
    return this.getAdminSubscriptions();
  }

  public async addAdminSubscription(payload: { storeId: string; planName?: string; price?: number; durationMonths?: number; status?: string }) {
    return this.request<{ message: string; subscription: Subscription }>('/api/admin/subscriptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async extendSubscriptionAdmin(id: string, months: number) {
    return this.request<{ message: string; subscription: Subscription }>(`/api/admin/subscriptions/${id}/extend`, {
      method: 'POST',
      body: JSON.stringify({ months }),
    });
  }

  public async renewSubscription(storeId: string, plan: 'monthly' | 'yearly' = 'monthly') {
    return this.addAdminSubscription({
      storeId,
      planName: plan === 'monthly' ? 'شهري' : 'سنوي',
      durationMonths: plan === 'monthly' ? 1 : 12,
      price: plan === 'monthly' ? 25000 : 250000,
      status: 'active',
    });
  }

  public async getAdminActivationCodes() {
    return this.request<{ codes?: ActivationCode[]; activationCodes?: ActivationCode[] }>('/api/admin/activation-codes');
  }

  public async getAllActivationCodesAdmin() {
    return this.getAdminActivationCodes();
  }

  public async createActivationCode(payload: { code: string; maxUses?: number; expiryDays?: number; expiresAt?: string; note?: string; storeCategory?: string; notes?: string }) {
    const expiresAt = payload.expiresAt || new Date(Date.now() + (payload.expiryDays || 30) * 86400000).toISOString().split('T')[0];
    const note = payload.note || payload.notes || payload.storeCategory || '';
    return this.request<{ message: string; code?: ActivationCode; activationCode?: ActivationCode }>('/api/admin/activation-codes', {
      method: 'POST',
      body: JSON.stringify({
        code: payload.code,
        maxUses: payload.maxUses || 1,
        expiresAt,
        note,
      }),
    });
  }

  public async toggleActivationCodeStatus(id: string, status: 'active' | 'disabled') {
    return this.request<{ message: string; activationCode: ActivationCode }>(`/api/admin/activation-codes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  public async deleteActivationCode(id: string) {
    return this.request<{ message: string }>(`/api/admin/activation-codes/${id}`, {
      method: 'DELETE',
    });
  }

  public async resetDemoData() {
    return this.request<{ message: string }>('/api/admin/reset-demo-data', {
      method: 'POST',
    });
  }

  // --- Synchronization & LocalStorage Backup ---
  public async getDatabaseSnapshot() {
    return this.request<{ timestamp: string; snapshot: any }>('/api/sync/snapshot');
  }

  public async autoSyncWithServer(snapshot?: any) {
    return this.request<{ message: string; snapshot: any; timestamp: string }>('/api/sync/auto-sync', {
      method: 'POST',
      body: JSON.stringify({ snapshot }),
    });
  }

  public async restoreDatabaseSnapshot(snapshot: any) {
    return this.request<{ message: string; snapshot: any; timestamp: string }>('/api/sync/restore', {
      method: 'POST',
      body: JSON.stringify({ snapshot }),
    });
  }
}

export const api = new ApiClient();
