export type UserRole = 'customer' | 'store_owner' | 'super_admin';

export type UserStatus = 'active' | 'disabled' | 'banned';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  storeId?: string;
  storeName?: string;
  status: UserStatus;
  createdAt: string;
}

export type SubscriptionStatus = 'active' | 'expired' | 'suspended';

export interface StoreLocation {
  lat: number;
  lng: number;
  addressName?: string;
}

export interface Store {
  id: string;
  ownerId: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  name: string;
  logo: string;
  banner: string;
  category: string;
  description: string;
  phone: string;
  workingHours: string;
  address: string;
  location: StoreLocation | null;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndDate?: string;
  status: 'active' | 'inactive';
  productsCount?: number;
  ordersCount?: number;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  storeId: string;
  storeName?: string;
  name: string;
  description: string;
  price: number; // in IQD (د.ع)
  image: string;
  category: string;
  stockQuantity: number;
  minStockAlert: number;
  isAvailable: boolean;
  isOffer?: boolean;
  discountPrice?: number;
  createdAt: string;
  updatedAt?: string;
}

export type OrderStatus = 'new' | 'preparing' | 'ready_for_pickup' | 'completed' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. QS-1024
  customerId: string;
  customerName: string;
  customerPhone: string;
  storeId: string;
  storeName: string;
  storePhone?: string;
  items: OrderItem[];
  totalAmount: number;
  notes?: string;
  status: OrderStatus;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export type DebtStatus = 'unpaid' | 'partially_paid' | 'paid';

export interface DebtItemEntry {
  id: string;
  itemDescription: string; // بيان المادة / التفاصيل (e.g. كارتون شاي، مسواك مخضر...)
  amount: number;          // المبلغ بالدينار العراقي
  date: string;            // التاريخ
  time?: string;           // الوقت
  notes?: string;          // ملاحظات إضافية
  createdAt: string;
}

export interface DebtPayment {
  id: string;
  amount: number;
  date: string;
  note?: string;
  createdAt?: string;
}

export interface Debt {
  id: string;
  storeId: string;
  debtorName: string;
  debtorPhone: string;
  amount: number;            // إجمالي مبلغ الديون (مجموع المواد)
  paidAmount: number;        // إجمالي المبالغ المسددة
  remainingAmount: number;   // المتبقي الصافي المطلوب
  details?: string;          // بيان أو ملاحظات عامة
  date?: string;             // تاريخ الإنشاء / آخر حركة
  status: DebtStatus;
  items: DebtItemEntry[];    // سجل الحركات والمشتريات المفصلة
  payments: DebtPayment[];   // سجل الدفعات والتسديدات
  createdAt: string;
  updatedAt?: string;
}

export interface SaleItem {
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  subtotal?: number;
}

export interface Sale {
  id: string;
  storeId: string;
  orderId?: string;
  items: SaleItem[];
  subtotalAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  paymentType: 'cash' | 'debt' | 'electronic';
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  storeId: string;
  storeName: string;
  ownerName: string;
  planName: string;
  price: number;
  durationMonths: number;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  createdAt: string;
}

export interface ActivationCode {
  id: string;
  code: string;
  maxUses: number;
  usedCount: number;
  usedByStoreIds: string[];
  usedByStoreNames: string[];
  expiresAt: string;
  status: 'active' | 'disabled';
  note?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartState {
  storeId: string | null;
  storeName: string | null;
  items: CartItem[];
}

export interface PlatformStats {
  totalStores: number;
  activeStores: number;
  pausedStores: number;
  totalCustomers: number;
  totalStoreOwners: number;
  totalProducts: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  totalOrders: number;
  totalPlatformSales: number;
}
