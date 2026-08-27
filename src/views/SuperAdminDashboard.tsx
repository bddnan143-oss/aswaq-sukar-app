import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Store, 
  Users, 
  CreditCard, 
  KeyRound, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  Check, 
  Calendar, 
  Sparkles,
  MapPin,
  Package,
  ShoppingCart,
  Search,
  Filter,
  Edit,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Phone,
  Mail,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { Store as StoreType, User, Subscription, ActivationCode, Product, Order, OrderStatus, PlatformStats } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ImageUploadField } from '../components/ImageUploadField';
import { SyncStatusBadge } from '../components/SyncStatusBadge';
import { syncService } from '../services/localStorageSync';

export const SuperAdminDashboard: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'stores' | 'owners' | 'products' | 'users' | 'subscriptions' | 'orders' | 'locations'>('overview');
  
  // Data States
  const [stores, setStores] = useState<StoreType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [owners, setOwners] = useState<(User & { store?: StoreType })[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Search & Filters
  const [storeSearch, setStoreSearch] = useState('');
  const [storeStatusFilter, setStoreStatusFilter] = useState<string>('all');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [productSearch, setProductSearch] = useState('');
  const [productStoreFilter, setProductStoreFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Modals State
  const [showCreateCodeModal, setShowCreateCodeModal] = useState(false);
  const [newCodeForm, setNewCodeForm] = useState({
    code: '',
    storeCategory: 'عام ومواد غذائية',
    maxUses: 1,
    expiryDays: 30,
    notes: 'رمز تفعيل مخصص لمتجر جديد بقلعة سكر',
  });

  // Store Edit Modal
  const [editingStore, setEditingStore] = useState<StoreType | null>(null);
  const [storeForm, setStoreForm] = useState<Partial<StoreType>>({});

  // Store Location Edit Modal
  const [editingLocationStore, setEditingLocationStore] = useState<StoreType | null>(null);
  const [locationForm, setLocationForm] = useState<{ lat: number; lng: number; addressName: string }>({
    lat: 31.8596,
    lng: 46.0683,
    addressName: 'قلعة سكر'
  });

  // Safe Permanent Store Deletion Modal
  const [storeToDelete, setStoreToDelete] = useState<StoreType | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingStore, setIsDeletingStore] = useState(false);

  // Product Edit Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({});

  // Order Status Modal
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState<Order | null>(null);
  const [newOrderStatus, setNewOrderStatus] = useState<OrderStatus>('new');
  const [orderStatusNote, setOrderStatusNote] = useState('');

  // Subscription Extend Modal
  const [extendingSubscription, setExtendingSubscription] = useState<Subscription | null>(null);
  const [extendMonths, setExtendMonths] = useState<number>(1);

  // Copied code feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading) {
      if (user && user.role === 'super_admin') {
        loadAdminData();
      } else {
        setIsLoading(false);
      }
    }
  }, [user?.id, user?.role, isAuthLoading]);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(null), 4000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(null), 3500);
    }
  };

  const loadAdminData = async () => {
    if (!user || user.role !== 'super_admin') {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [storesRes, usersRes, ownersRes, productsRes, ordersRes, subsRes, codesRes, statsRes] = await Promise.all([
        api.getAllStoresAdmin(),
        api.getAllUsersAdmin(),
        api.getAdminOwners(),
        api.getAdminProducts(),
        api.getAdminOrders(),
        api.getAllSubscriptionsAdmin(),
        api.getAllActivationCodesAdmin(),
        api.getAdminStats(),
      ]);
      setStores(storesRes.stores || []);
      setUsers(usersRes.users || []);
      setOwners(ownersRes.owners || []);
      setProducts(productsRes.products || []);
      setOrders(ordersRes.orders || []);
      setSubscriptions(subsRes.subscriptions || []);
      setCodes(codesRes.activationCodes || codesRes.codes || []);
      setStats(statsRes.stats || null);
    } catch (e: any) {
      console.error('Error loading super admin data:', e);
      showNotification(e.message || 'حدث خطأ أثناء تحميل بيانات الإدارة.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // --- Store Actions ---
  const handleToggleStoreStatus = async (storeId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.updateStoreStatus(storeId, newStatus);
      setStores(stores.map((s) => (s.id === storeId ? { ...s, status: newStatus as any } : s)));
      showNotification(newStatus === 'active' ? 'تم تفعيل المتجر بنجاح.' : 'تم إيقاف/تعليق المتجر.');
    } catch (err: any) {
      showNotification(err.message || 'فشل تحديث حالة المتجر.', true);
    }
  };

  const handleOpenEditStore = (st: StoreType) => {
    setEditingStore(st);
    setStoreForm({
      name: st.name,
      category: st.category,
      phone: st.phone,
      address: st.address,
      workingHours: st.workingHours,
      description: st.description,
      status: st.status
    });
  };

  const handleSaveStoreEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;
    try {
      const res = await api.updateStoreAdmin(editingStore.id, storeForm);
      setStores(stores.map((s) => (s.id === editingStore.id ? res.store : s)));
      setEditingStore(null);
      showNotification('تم تحديث بيانات المتجر بنجاح.');
    } catch (err: any) {
      showNotification(err.message || 'فشل تعديل المتجر.', true);
    }
  };

  const handleOpenLocationEdit = (st: StoreType) => {
    setEditingLocationStore(st);
    setLocationForm({
      lat: st.location?.lat || 31.8596,
      lng: st.location?.lng || 46.0683,
      addressName: st.location?.addressName || st.address || 'قلعة سكر'
    });
  };

  const handleSaveLocationEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocationStore) return;
    try {
      const res = await api.updateStoreLocationAdmin(editingLocationStore.id, locationForm);
      setStores(stores.map((s) => (s.id === editingLocationStore.id ? res.store : s)));
      setEditingLocationStore(null);
      showNotification('تم تحديث موقع المتجر بنجاح.');
    } catch (err: any) {
      showNotification(err.message || 'فشل تحديث موقع المتجر.', true);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!storeToDelete) return;
    const deletedStoreId = storeToDelete.id;
    const deletedStoreName = storeToDelete.name;
    const confirm = deleteConfirmationText.trim();
    if (confirm !== deletedStoreName && confirm !== 'حذف' && confirm !== 'delete') {
      showNotification('يرجى كتابة اسم المتجر بدقة أو كلمة "حذف" لتأكيد الحذف النهائي.', true);
      return;
    }

    setIsDeletingStore(true);
    try {
      // 1. Send delete request to backend
      await api.deleteStorePermanently(deletedStoreId, confirm);

      // 2. Immediately purge deleted store and associated products from local component state
      setStores((prevStores) => prevStores.filter((s) => s.id !== deletedStoreId));
      setProducts((prevProducts) => prevProducts.filter((p) => p.storeId !== deletedStoreId));
      setOwners((prevOwners) => prevOwners.filter((o) => o.storeId !== deletedStoreId && o.store?.id !== deletedStoreId));
      setSubscriptions((prevSubs) => prevSubs.filter((sub) => sub.storeId !== deletedStoreId));

      // 3. Immediately purge from browser localStorage snapshot so UI reflects it everywhere
      try {
        const localSnapshot = syncService.getLocalSnapshot();
        if (localSnapshot) {
          if (Array.isArray(localSnapshot.stores)) {
            localSnapshot.stores = localSnapshot.stores.filter((s: any) => s.id !== deletedStoreId);
          }
          if (Array.isArray(localSnapshot.products)) {
            localSnapshot.products = localSnapshot.products.filter((p: any) => p.storeId !== deletedStoreId);
          }
          if (Array.isArray(localSnapshot.subscriptions)) {
            localSnapshot.subscriptions = localSnapshot.subscriptions.filter((sub: any) => sub.storeId !== deletedStoreId);
          }
          syncService.saveSnapshotLocally(localSnapshot);
        }
      } catch (storageErr) {
        console.warn('LocalStorage cleanup warning:', storageErr);
      }

      setStoreToDelete(null);
      setDeleteConfirmationText('');
      showNotification(`تم حذف متجر (${deletedStoreName}) وكافة بياناته المرتبطة نهائياً.`);
      await loadAdminData();
    } catch (err: any) {
      showNotification(err.message || 'فشل حذف المتجر.', true);
    } finally {
      setIsDeletingStore(false);
    }
  };

  // --- User Actions ---
  const handleToggleUserStatus = async (userId: string, targetStatus: 'active' | 'disabled' | 'banned') => {
    try {
      const res = await api.toggleUserStatus(userId, targetStatus);
      setUsers(users.map((u) => (u.id === userId ? res.user : u)));
      showNotification(`تم تغيير حالة المستخدم إلى (${targetStatus === 'active' ? 'نشط' : targetStatus === 'disabled' ? 'معطل' : 'محظور'}).`);
    } catch (err: any) {
      showNotification(err.message || 'فشل تحديث حالة المستخدم.', true);
    }
  };

  // --- Product Actions ---
  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      price: p.price,
      discountPrice: p.discountPrice,
      stockQuantity: p.stockQuantity,
      category: p.category,
      isAvailable: p.isAvailable,
      description: p.description,
    });
  };

  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const res = await api.updateAdminProduct(editingProduct.id, {
        ...productForm,
        price: Number(productForm.price),
        discountPrice: productForm.discountPrice ? Number(productForm.discountPrice) : undefined,
        stockQuantity: productForm.stockQuantity !== undefined ? Number(productForm.stockQuantity) : undefined,
      });
      setProducts(products.map((p) => (p.id === editingProduct.id ? res.product : p)));
      setEditingProduct(null);
      showNotification('تم تحديث بيانات المنتج بنجاح.');
    } catch (err: any) {
      showNotification(err.message || 'فشل تعديل المنتج.', true);
    }
  };

  const handleToggleProductAvailability = async (p: Product) => {
    try {
      const res = await api.updateAdminProduct(p.id, { isAvailable: !p.isAvailable });
      setProducts(products.map((item) => (item.id === p.id ? res.product : item)));
      showNotification(p.isAvailable ? 'تم إخفاء المنتج من العرض.' : 'تم إظهار المنتج للزبائن.');
    } catch (err: any) {
      showNotification(err.message || 'فشل تحديث توفر المنتج.', true);
    }
  };

  const handleDeleteProduct = async (prodId: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف المنتج (${name}) نهائياً؟`)) return;
    try {
      await api.deleteAdminProduct(prodId);
      setProducts(products.filter((p) => p.id !== prodId));
      showNotification('تم حذف المنتج بنجاح.');
    } catch (err: any) {
      showNotification(err.message || 'فشل حذف المنتج.', true);
    }
  };

  // --- Order Actions ---
  const handleUpdateOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForStatus) return;
    try {
      const res = await api.updateAdminOrderStatus(selectedOrderForStatus.id, newOrderStatus, orderStatusNote);
      setOrders(orders.map((o) => (o.id === selectedOrderForStatus.id ? res.order : o)));
      setSelectedOrderForStatus(null);
      setOrderStatusNote('');
      showNotification('تم تحديث حالة الطلب بنجاح.');
    } catch (err: any) {
      showNotification(err.message || 'فشل تحديث الطلب.', true);
    }
  };

  // --- Subscription Actions ---
  const handleExtendSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendingSubscription) return;
    try {
      const res = await api.extendSubscriptionAdmin(extendingSubscription.id, extendMonths);
      setSubscriptions(subscriptions.map((s) => (s.id === extendingSubscription.id ? res.subscription : s)));
      setExtendingSubscription(null);
      showNotification(`تم تمديد اشتراك المتجر لمدة ${extendMonths} شهر بنجاح.`);
      // Refresh stores subscription dates
      await loadAdminData();
    } catch (err: any) {
      showNotification(err.message || 'فشل تمديد الاشتراك.', true);
    }
  };

  // --- Activation Code Actions ---
  const handleGenerateRandomCode = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setNewCodeForm({ ...newCodeForm, code: `SUKKAR-2026-${rand}` });
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createActivationCode({
        code: newCodeForm.code.trim().toUpperCase(),
        storeCategory: newCodeForm.storeCategory,
        maxUses: Number(newCodeForm.maxUses),
        expiryDays: Number(newCodeForm.expiryDays),
        notes: newCodeForm.notes,
      });
      const created = res.activationCode || res.code;
      if (created) {
        setCodes([created, ...codes]);
      }
      setShowCreateCodeModal(false);
      setNewCodeForm({
        code: '',
        storeCategory: 'عام ومواد غذائية',
        maxUses: 1,
        expiryDays: 30,
        notes: '',
      });
      showNotification('تم إنشاء وتفعيل رمز التفعيل بنجاح.');
    } catch (err: any) {
      showNotification(err.message || 'فشل إنشاء رمز التفعيل.', true);
    }
  };

  const handleToggleCodeStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      const res = await api.toggleActivationCodeStatus(id, nextStatus as any);
      setCodes(codes.map((c) => (c.id === id ? res.activationCode : c)));
      showNotification(nextStatus === 'active' ? 'تم تنشيط الرمز.' : 'تم تعطيل الرمز.');
    } catch (err: any) {
      showNotification(err.message || 'فشل تحديث حالة الرمز.', true);
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!window.confirm('هل تريد حذف رمز التفعيل هذا نهائياً؟')) return;
    try {
      await api.deleteActivationCode(id);
      setCodes(codes.filter((c) => c.id !== id));
      showNotification('تم حذف رمز التفعيل.');
    } catch (err: any) {
      showNotification(err.message || 'فشل حذف الرمز.', true);
    }
  };

  // Reset Demo Data
  const handleResetDemoData = async () => {
    if (!window.confirm('تحذير: هل أنت متأكد من إعادة تهيئة كافة بيانات المنصة إلى الوضع التجريبي الأولي؟ سيتم استعادة المتاجر والحسابات والمنتجات الافتراضية.')) return;
    try {
      await api.resetDemoData();
      showNotification('تمت إعادة ضبط بيانات المنصة بنجاح.');
      await loadAdminData();
    } catch (err: any) {
      showNotification(err.message || 'فشل إعادة التهيئة.', true);
    }
  };

  // Filtered Lists
  const filteredStores = useMemo(() => {
    return stores.filter((st) => {
      const matchesSearch = st.name.toLowerCase().includes(storeSearch.toLowerCase()) || 
                            st.category.toLowerCase().includes(storeSearch.toLowerCase()) ||
                            st.phone.includes(storeSearch) ||
                            (st.ownerName && st.ownerName.includes(storeSearch));
      const matchesStatus = storeStatusFilter === 'all' || st.status === storeStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [stores, storeSearch, storeStatusFilter]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                            u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                            (u.phone && u.phone.includes(userSearch));
      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, userRoleFilter]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                            (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase()));
      const matchesStore = productStoreFilter === 'all' || p.storeId === productStoreFilter;
      return matchesSearch && matchesStore;
    });
  }, [products, productSearch, productStoreFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch = o.id.includes(orderSearch) ||
                            o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
                            o.customerPhone.includes(orderSearch) ||
                            o.storeName.toLowerCase().includes(orderSearch.toLowerCase());
      const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 pb-28 text-slate-800" dir="rtl">
      
      {/* Toast Feedback */}
      {actionSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Super Admin Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-3xl bg-slate-900 text-white p-6 shadow-xl border border-purple-900/40">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600/30 text-purple-400 border border-purple-500/40 shadow-inner">
            <Shield className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">لوحة تحكم المدير الرئيسي للمنصة</h1>
              <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[11px] font-bold text-purple-300 border border-purple-500/40">
                Super Admin
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-300">
              إدارة شاملة لأسواق قلعة سكر: المتاجر، أصحاب المحلات، المنتجات، الاشتراكات، الطلبات، والخرائط
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={loadAdminData}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/20 active:scale-95 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>تحديث البيانات</span>
          </button>

          <button
            type="button"
            onClick={handleResetDemoData}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-2 text-xs font-bold hover:bg-rose-500/30 active:scale-95 transition"
            title="إعادة ضبط بيانات النظام للوضع التجريبي"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>إعادة تهيئة المنصة</span>
          </button>
        </div>
      </div>

      {/* LocalStorage Auto-Sync Status Bar */}
      <div className="mt-4">
        <SyncStatusBadge />
      </div>

      {/* Tabs Navigation */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-200 pb-2">
        {[
          { id: 'overview', label: 'نظرة عامة', icon: Shield },
          { id: 'stores', label: `المتاجر (${stores.length})`, icon: Store },
          { id: 'owners', label: `أصحاب المتاجر (${owners.length})`, icon: Users },
          { id: 'products', label: `المنتجات (${products.length})`, icon: Package },
          { id: 'users', label: `كافة المستخدمين (${users.length})`, icon: UserCheck },
          { id: 'subscriptions', label: `الاشتراكات ورموز التفعيل (${subscriptions.length})`, icon: CreditCard },
          { id: 'orders', label: `الطلبات (${orders.length})`, icon: ShoppingCart },
          { id: 'locations', label: `إدارة المواقع والخرائط (${stores.length})`, icon: MapPin },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-purple-700 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. OVERVIEW TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="mt-6 space-y-6">
          {/* Main Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-3xl bg-white p-5 shadow-xs border border-slate-200 hover:border-emerald-300 transition">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Store className="h-5 w-5" />
                </span>
                <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  {stores.filter((s) => s.status === 'active').length} نشط
                </span>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">إجمالي المتاجر</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stores.length}</p>
              <p className="mt-2 text-[11px] text-slate-400">
                {stores.filter((s) => s.status !== 'active').length} متجر متوقف أو معلق
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-xs border border-slate-200 hover:border-blue-300 transition">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <Users className="h-5 w-5" />
                </span>
                <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  {users.length} مستخدم
                </span>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">الزبائن وأصحاب المتاجر</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {users.filter((u) => u.role === 'customer').length} زبون
              </p>
              <p className="mt-2 text-[11px] text-slate-500">
                {users.filter((u) => u.role === 'store_owner').length} صاحب متجر موثق
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-xs border border-slate-200 hover:border-purple-300 transition">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                  <CreditCard className="h-5 w-5" />
                </span>
                <span className="rounded-lg bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                  {subscriptions.filter((s) => s.status === 'active').length} ساري
                </span>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">الاشتراكات الفعالة</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {subscriptions.filter((s) => s.status === 'active').length}
              </p>
              <p className="mt-2 text-[11px] text-slate-500">
                {codes.filter((c) => c.status === 'active' && c.usedCount < c.maxUses).length} رمز تفعيل جاهز
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-xs border border-slate-200 hover:border-amber-300 transition">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <ShoppingCart className="h-5 w-5" />
                </span>
                <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  {orders.length} طلب
                </span>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">إجمالي طلبات المنصة</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {orders.reduce((acc, o) => acc + o.totalAmount, 0).toLocaleString()} د.ع
              </p>
              <p className="mt-2 text-[11px] text-slate-500">
                {products.length} منتج مسجل في الأسواق
              </p>
            </div>
          </div>

          {/* Quick Hub Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-3xl bg-gradient-to-br from-purple-900 to-slate-900 text-white p-6 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-3">
                  <KeyRound className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold">توليد رمز تفعيل متجر جديد</h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  أنشئ رمزاً فورياً يتيح لأصحاب المحلات في قلعة سكر تفعيل متجرهم فوراً.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleGenerateRandomCode();
                  setShowCreateCodeModal(true);
                }}
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 transition"
              >
                <Plus className="h-4 w-4" />
                <span>توليد رمز جديد الآن</span>
              </button>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-xs border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-3">
                  <Store className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">إدارة متاجر قلعة سكر</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  تعديل بيانات المحلات، إيقاف/تفعيل المتجر، تعديل الموقع، أو الحذف النهائي الآمن.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('stores')}
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-emerald-800 px-4 py-2 text-xs font-bold hover:bg-emerald-100 transition"
              >
                <span>الانتقال لإدارة المتاجر</span>
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-xs border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 mb-3">
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">مواقع المتاجر والخرائط</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  مراجعة وتعديل إحداثيات GPS لجميع المحلات بدقة لتسهيل وصول الزبائن إليها.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('locations')}
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-50 text-blue-800 px-4 py-2 text-xs font-bold hover:bg-blue-100 transition"
              >
                <span>مراجعة وتعديل المواقع</span>
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. STORES MANAGEMENT TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'stores' && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900">إدارة متاجر قلعة سكر</h2>
              <p className="text-xs text-slate-500">تعديل المتاجر، تفعيلها، توقيفها، وتعديل إحداثياتها وحذفها</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 w-full">
              <Search className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                placeholder="ابحث باسم المتجر، التصنيف، الهاتف، أو اسم المالك..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pr-10 pl-4 text-xs text-slate-800 focus:border-purple-600 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={storeStatusFilter}
                onChange={(e) => setStoreStatusFilter(e.target.value)}
                className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50/60 py-2 px-3 text-xs font-bold text-slate-700 focus:outline-hidden"
              >
                <option value="all">كافة الحالات</option>
                <option value="active">نشط وفعال فقط</option>
                <option value="inactive">معلق / متوقف</option>
              </select>
            </div>
          </div>

          {/* Stores Table */}
          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-right text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3.5">المتجر والمالك</th>
                  <th className="p-3.5">التصنيف</th>
                  <th className="p-3.5">الهاتف</th>
                  <th className="p-3.5">العنوان وساعات العمل</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5">الاشتراك</th>
                  <th className="p-3.5 text-center">إجراءات الإدارة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStores.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      لا توجد متاجر مطابقة لبحثك.
                    </td>
                  </tr>
                ) : (
                  filteredStores.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={st.logo}
                            alt={st.name}
                            className="h-10 w-10 rounded-xl object-cover border border-slate-100"
                          />
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{st.name}</p>
                            <p className="text-[11px] text-slate-500">المالك: {st.ownerName || 'صاحب المتجر'}</p>
                            <p className="font-mono text-[10px] text-slate-400">ID: {st.id.slice(0, 10)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-medium">{st.category}</td>
                      <td className="p-3.5 text-slate-600 font-mono" dir="ltr">{st.phone}</td>
                      <td className="p-3.5 text-slate-500 max-w-xs">
                        <p className="truncate font-medium text-slate-700">{st.address}</p>
                        <p className="text-[10px] text-slate-400">{st.workingHours}</p>
                      </td>
                      <td className="p-3.5">
                        {st.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            <CheckCircle className="h-3 w-3" />
                            <span>نشط</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                            <XCircle className="h-3 w-3" />
                            <span>معلّق / موقوف</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700">
                          ينتهي: {st.subscriptionEndDate || 'ساري'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Edit Details */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditStore(st)}
                            className="rounded-xl bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 transition"
                            title="تعديل بيانات المتجر"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          {/* Edit Location */}
                          <button
                            type="button"
                            onClick={() => handleOpenLocationEdit(st)}
                            className="rounded-xl bg-blue-50 p-2 text-blue-700 hover:bg-blue-100 transition"
                            title="تعديل موقع المتجر على الخريطة"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                          </button>

                          {/* Toggle Active/Suspend */}
                          <button
                            type="button"
                            onClick={() => handleToggleStoreStatus(st.id, st.status)}
                            className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition ${
                              st.status === 'active'
                                ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            }`}
                          >
                            {st.status === 'active' ? 'تعليق' : 'تفعيل'}
                          </button>

                          {/* Permanent Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              setStoreToDelete(st);
                              setDeleteConfirmationText('');
                            }}
                            className="rounded-xl bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition"
                            title="حذف نهائي للمتجر"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. STORE OWNERS MANAGEMENT TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'owners' && (
        <div className="mt-6 space-y-4">
          <div>
            <h2 className="text-base font-black text-slate-900">حسابات أصحاب المتاجر في قلعة سكر</h2>
            <p className="text-xs text-slate-500">إدارة أصحاب المحلات والربط مع متاجرهم وحالة نشاطهم</p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-right text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3.5">صاحب المتجر</th>
                  <th className="p-3.5">البريد الإلكتروني</th>
                  <th className="p-3.5">رقم الهاتف</th>
                  <th className="p-3.5">المتجر المرتبط</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5">تاريخ التسجيل</th>
                  <th className="p-3.5 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {owners.map((owner) => (
                  <tr key={owner.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3.5 font-bold text-slate-900">{owner.name}</td>
                    <td className="p-3.5 text-slate-600">{owner.email}</td>
                    <td className="p-3.5 text-slate-600 font-mono" dir="ltr">{owner.phone || '-'}</td>
                    <td className="p-3.5">
                      {owner.store ? (
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {owner.store.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">غير مرتبط</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {owner.status === 'active' ? (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">نشط</span>
                      ) : (
                        <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">معطل</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {new Date(owner.createdAt).toLocaleDateString('ar-IQ')}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleUserStatus(owner.id, owner.status === 'active' ? 'disabled' : 'active')}
                        className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                          owner.status === 'active'
                            ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        {owner.status === 'active' ? 'تعطيل الحساب' : 'تنشيط الحساب'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. PRODUCTS MANAGEMENT TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'products' && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">إدارة كافة منتجات المنصة</h2>
              <p className="text-xs text-slate-500">تعديل الأسعار والمخزون، إخفاء أو إظهار المنتجات، والحذف</p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200">
              إجمالي المنتجات: {products.length}
            </span>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 w-full">
              <Search className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="ابحث باسم المنتج أو التصنيف..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pr-10 pl-4 text-xs text-slate-800 focus:border-purple-600 focus:bg-white focus:outline-hidden"
              />
            </div>

            <select
              value={productStoreFilter}
              onChange={(e) => setProductStoreFilter(e.target.value)}
              className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50/60 py-2 px-3 text-xs font-bold text-slate-700 focus:outline-hidden"
            >
              <option value="all">كافة المتاجر</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-right text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3.5">المنتج</th>
                  <th className="p-3.5">المتجر</th>
                  <th className="p-3.5">السعر</th>
                  <th className="p-3.5">المخزون والوحدة</th>
                  <th className="p-3.5">الحالة والظهور</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      لا توجد منتجات مطابقة للبحث.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => {
                    const st = stores.find((s) => s.id === prod.storeId);
                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="h-10 w-10 rounded-xl object-cover border border-slate-100"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{prod.name}</p>
                              <p className="text-[10px] text-slate-400">{prod.category || 'عام'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800">{st?.name || 'متجر'}</td>
                        <td className="p-3.5">
                          <span className="font-black text-slate-900">{prod.price.toLocaleString()} د.ع</span>
                          {prod.discountPrice && (
                            <span className="block text-[10px] text-slate-400 line-through">
                              {prod.discountPrice.toLocaleString()} د.ع
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-medium">
                          {prod.stockQuantity !== undefined ? `${prod.stockQuantity} قطعة` : 'متوفر دائماً'}
                        </td>
                        <td className="p-3.5">
                          {prod.isAvailable !== false ? (
                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">معروض للزبائن</span>
                          ) : (
                            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">مخفي مؤقتاً</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditProduct(prod)}
                              className="rounded-xl bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 transition"
                              title="تعديل المنتج"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleProductAvailability(prod)}
                              className="rounded-xl bg-blue-50 p-2 text-blue-700 hover:bg-blue-100 transition"
                              title={prod.isAvailable !== false ? 'إخفاء المنتج' : 'إظهار المنتج'}
                            >
                              {prod.isAvailable !== false ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              className="rounded-xl bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition"
                              title="حذف المنتج"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. ALL USERS MANAGEMENT TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'users' && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900">كافة مستخدمي المنصة</h2>
            <span className="text-xs text-slate-500">{users.length} مستخدم مسجل</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 w-full">
              <Search className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="ابحث بالاسم، البريد، أو رقم الهاتف..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pr-10 pl-4 text-xs text-slate-800 focus:border-purple-600 focus:bg-white focus:outline-hidden"
              />
            </div>

            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50/60 py-2 px-3 text-xs font-bold text-slate-700 focus:outline-hidden"
            >
              <option value="all">كافة الأدوار</option>
              <option value="customer">الزبائن</option>
              <option value="store_owner">أصحاب المتاجر</option>
              <option value="super_admin">المدير الرئيسي</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-right text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3.5">الاسم</th>
                  <th className="p-3.5">البريد الإلكتروني</th>
                  <th className="p-3.5">رقم الهاتف</th>
                  <th className="p-3.5">نوع الحساب (Role)</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5">تاريخ التسجيل</th>
                  <th className="p-3.5 text-center">إدارة الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3.5 font-bold text-slate-900">{u.name}</td>
                    <td className="p-3.5 text-slate-600">{u.email}</td>
                    <td className="p-3.5 text-slate-600 font-mono" dir="ltr">{u.phone || '-'}</td>
                    <td className="p-3.5">
                      {u.role === 'super_admin' ? (
                        <span className="rounded-md bg-purple-100 px-2 py-0.5 font-black text-purple-900 text-[11px]">المدير الرئيسي</span>
                      ) : u.role === 'store_owner' ? (
                        <span className="rounded-md bg-blue-100 px-2 py-0.5 font-bold text-blue-800 text-[11px]">صاحب متجر</span>
                      ) : (
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 text-[11px]">زبون</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {u.status === 'active' ? (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">نشط</span>
                      ) : u.status === 'banned' ? (
                        <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">محظور</span>
                      ) : (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">معطل</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-500">{new Date(u.createdAt).toLocaleDateString('ar-IQ')}</td>
                    <td className="p-3.5 text-center">
                      {u.role !== 'super_admin' ? (
                        <div className="inline-flex items-center gap-1">
                          {u.status !== 'active' && (
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(u.id, 'active')}
                              className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                            >
                              تنشيط
                            </button>
                          )}
                          {u.status !== 'disabled' && (
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(u.id, 'disabled')}
                              className="rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100"
                            >
                              تعطيل
                            </button>
                          )}
                          {u.status !== 'banned' && (
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(u.id, 'banned')}
                              className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100"
                            >
                              حظر
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">حساب محمي</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. SUBSCRIPTIONS & CODES TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'subscriptions' && (
        <div className="mt-6 space-y-8">
          {/* Subscriptions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">سجل اشتراكات المتاجر</h2>
                <p className="text-xs text-slate-500">تمديد الاشتراكات ومتابعة فترات الصلاحية</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-right text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">المتجر</th>
                    <th className="p-3.5">الخطة</th>
                    <th className="p-3.5">تاريخ البدء</th>
                    <th className="p-3.5">تاريخ الانتهاء</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5 text-center">تمديد الاشتراك</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3.5 font-bold text-slate-900">{sub.storeName}</td>
                      <td className="p-3.5">{sub.planName || 'باقة معتمدة'}</td>
                      <td className="p-3.5 text-slate-500">{sub.startDate}</td>
                      <td className="p-3.5 font-bold text-purple-900">{sub.endDate}</td>
                      <td className="p-3.5">
                        {sub.status === 'active' ? (
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">ساري</span>
                        ) : (
                          <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">منتهي</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setExtendingSubscription(sub);
                            setExtendMonths(1);
                          }}
                          className="rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition"
                        >
                          تمديد الصلاحية
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activation Codes Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">رموز تفعيل المتاجر (Activation Codes)</h2>
                <p className="text-xs text-slate-500">تستخدم عند تسجيل أي متجر جديد</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleGenerateRandomCode();
                  setShowCreateCodeModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-purple-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-800 transition"
              >
                <Plus className="h-4 w-4" />
                <span>توليد رمز جديد</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-right text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">الرمز</th>
                    <th className="p-3.5">الاستخدام</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5">المتاجر المستخدمة</th>
                    <th className="p-3.5">الصلاحية</th>
                    <th className="p-3.5">ملاحظات</th>
                    <th className="p-3.5 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {codes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3.5">
                        <span className="font-mono text-xs font-black text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                          {c.code}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold">{c.usedCount} من {c.maxUses}</td>
                      <td className="p-3.5">
                        {c.status === 'active' && c.usedCount < c.maxUses ? (
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">متاح</span>
                        ) : (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">مستنفذ / معطل</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {c.usedByStoreNames && c.usedByStoreNames.length > 0 ? c.usedByStoreNames.join('، ') : '-'}
                      </td>
                      <td className="p-3.5 text-slate-500">{c.expiresAt ? c.expiresAt.split('T')[0] : 'دائم'}</td>
                      <td className="p-3.5 text-slate-500 truncate max-w-xs">{c.note || '-'}</td>
                      <td className="p-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => copyCode(c.code)}
                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold hover:bg-slate-100 transition"
                          >
                            {copiedCode === c.code ? <span className="text-emerald-600 font-bold">تم النسخ!</span> : 'نسخ'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleCodeStatus(c.id, c.status)}
                            className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                          >
                            {c.status === 'active' ? 'تعطيل' : 'تفعيل'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCode(c.id)}
                            className="rounded-lg bg-rose-50 p-1 text-rose-600 hover:bg-rose-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. ORDERS MANAGEMENT TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'orders' && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">كافة طلبات المنصة الموحدة</h2>
              <p className="text-xs text-slate-500">متابعة طلبات الزبائن وتحديث الحالات لكافة المتاجر</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
              إجمالي الطلبات: {orders.length}
            </span>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 w-full">
              <Search className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="ابحث برقم الطلب، اسم الزبون، الهاتف، أو المتجر..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pr-10 pl-4 text-xs text-slate-800 focus:border-purple-600 focus:bg-white focus:outline-hidden"
              />
            </div>

            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50/60 py-2 px-3 text-xs font-bold text-slate-700 focus:outline-hidden"
            >
              <option value="all">كافة الحالات</option>
              <option value="new">جديد</option>
              <option value="preparing">قيد التحضير</option>
              <option value="ready_for_pickup">جاهز للاستلام</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-right text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3.5">رقم الطلب</th>
                  <th className="p-3.5">الزبون</th>
                  <th className="p-3.5">المتجر</th>
                  <th className="p-3.5">العناصر</th>
                  <th className="p-3.5">المبلغ</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5">التاريخ</th>
                  <th className="p-3.5 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      لا توجد طلبات مطابقة للبحث.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        #{ord.id.slice(-6)}
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900">{ord.customerName}</p>
                        <p className="font-mono text-[10px] text-slate-400" dir="ltr">{ord.customerPhone}</p>
                      </td>
                      <td className="p-3.5 font-semibold text-purple-900">{ord.storeName}</td>
                      <td className="p-3.5 text-slate-600">
                        {ord.items.map((i) => `${i.productName} (${i.quantity})`).join('، ')}
                      </td>
                      <td className="p-3.5 font-black text-slate-900">
                        {ord.totalAmount.toLocaleString()} د.ع
                      </td>
                      <td className="p-3.5">
                        {ord.status === 'new' && <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">جديد</span>}
                        {ord.status === 'preparing' && <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">قيد التحضير</span>}
                        {ord.status === 'ready_for_pickup' && <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700">جاهز للاستلام</span>}
                        {ord.status === 'completed' && <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">مكتمل</span>}
                        {ord.status === 'cancelled' && <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">ملغي</span>}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {new Date(ord.createdAt).toLocaleDateString('ar-IQ')}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderForStatus(ord);
                            setNewOrderStatus(ord.status);
                            setOrderStatusNote(ord.notes || '');
                          }}
                          className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                        >
                          تحديث الحالة
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 8. LOCATIONS & MAP MANAGEMENT TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'locations' && (
        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">إدارة وتدقيق مواقع المتاجر في قلعة سكر</h2>
              <p className="text-xs text-slate-500">تعديل الإحداثيات الجغرافية بدقة لكل متجر ومراجعة تموضع المحلات</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map((st) => (
              <div key={st.id} className="rounded-3xl bg-white p-5 shadow-xs border border-slate-200 flex flex-col justify-between hover:border-purple-300 transition">
                <div>
                  <div className="flex items-center gap-3">
                    <img src={st.logo} alt={st.name} className="h-10 w-10 rounded-xl object-cover" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{st.name}</h4>
                      <p className="text-[11px] text-slate-500">{st.category}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-3 border border-slate-100 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="font-bold">{st.location?.addressName || st.address}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>خط العرض: {st.location?.lat.toFixed(5)}</span>
                      <span>خط الطول: {st.location?.lng.toFixed(5)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${st.location?.lat},${st.location?.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    <span>فتح في خرائط جوجل</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleOpenLocationEdit(st)}
                    className="rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition"
                  >
                    تعديل الإحداثيات
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODALS */}
      {/* ============================================================= */}

      {/* 1. EDIT STORE MODAL */}
      {editingStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-4">تعديل بيانات متجر ({editingStore.name})</h3>
            <form onSubmit={handleSaveStoreEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المتجر</label>
                <input
                  type="text"
                  required
                  value={storeForm.name || ''}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف</label>
                  <input
                    type="text"
                    value={storeForm.category || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={storeForm.phone || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:outline-hidden"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">العنوان التفصيلي بقلعة سكر</label>
                <input
                  type="text"
                  value={storeForm.address || ''}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ساعات العمل</label>
                <input
                  type="text"
                  value={storeForm.workingHours || ''}
                  onChange={(e) => setStoreForm({ ...storeForm, workingHours: e.target.value })}
                  placeholder="مثال: 8:00 ص - 10:00 م"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الوصف والنبذة</label>
                <textarea
                  rows={2}
                  value={storeForm.description || ''}
                  onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:outline-hidden"
                />
              </div>

              <ImageUploadField
                id="admin-store-logo-upload"
                label="شعار المتجر (اللوجو)"
                value={storeForm.logo || ''}
                onChange={(val) => setStoreForm({ ...storeForm, logo: val })}
                aspectRatio="avatar"
                helperText="رفع أو التقاط شعار المتجر"
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">حالة المتجر</label>
                <select
                  value={storeForm.status || 'active'}
                  onChange={(e) => setStoreForm({ ...storeForm, status: e.target.value as any })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-bold text-slate-800 focus:outline-hidden"
                >
                  <option value="active">نشط وفعال</option>
                  <option value="inactive">معلق / موقوف مؤقتاً</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingStore(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-purple-700 py-2.5 text-xs font-bold text-white hover:bg-purple-800 shadow-md"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. EDIT STORE LOCATION MODAL */}
      {editingLocationStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">تعديل موقع ({editingLocationStore.name}) على الخريطة</h3>
            <p className="text-xs text-slate-500 mb-4">مدينة قلعة سكر (خط العرض: 31.8596، خط الطول: 46.0683)</p>

            <form onSubmit={handleSaveLocationEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المنطقة / الحي</label>
                <input
                  type="text"
                  required
                  value={locationForm.addressName}
                  onChange={(e) => setLocationForm({ ...locationForm, addressName: e.target.value })}
                  placeholder="مثال: قلعة سكر - السوق الداخلي"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">خط العرض (Latitude)</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={locationForm.lat}
                    onChange={(e) => setLocationForm({ ...locationForm, lat: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-mono text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">خط الطول (Longitude)</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={locationForm.lng}
                    onChange={(e) => setLocationForm({ ...locationForm, lng: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-mono text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Quick Presets in Qalat Sukkar */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">أماكن سريعة بقلعة سكر:</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'السوق الكبير', lat: 31.8596, lng: 46.0683, address: 'قلعة سكر - السوق الكبير' },
                    { label: 'شارع الأطباء', lat: 31.8612, lng: 46.0691, address: 'قلعة سكر - شارع الأطباء' },
                    { label: 'الحي العسكري', lat: 31.8550, lng: 46.0720, address: 'قلعة سكر - الحي العسكري' },
                    { label: 'حي المعلمين', lat: 31.8650, lng: 46.0640, address: 'قلعة سكر - حي المعلمين' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setLocationForm({ lat: preset.lat, lng: preset.lng, addressName: preset.address })}
                      className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingLocationStore(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-purple-700 py-2.5 text-xs font-bold text-white hover:bg-purple-800 shadow-md"
                >
                  حفظ الموقع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-4">تعديل المنتج ({editingProduct.name})</h3>
            <form onSubmit={handleSaveProductEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المنتج</label>
                <input
                  type="text"
                  required
                  value={productForm.name || ''}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السعر الحالي (د.ع)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price || ''}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السعر المخفض (اختياري)</label>
                  <input
                    type="number"
                    value={productForm.discountPrice || ''}
                    onChange={(e) => setProductForm({ ...productForm, discountPrice: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الكمية بالمخزون</label>
                <input
                  type="number"
                  value={productForm.stockQuantity !== undefined ? productForm.stockQuantity : ''}
                  onChange={(e) => setProductForm({ ...productForm, stockQuantity: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف</label>
                <input
                  type="text"
                  value={productForm.category || ''}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:outline-hidden"
                />
              </div>

              <ImageUploadField
                id="admin-product-image-upload"
                label="صورة المنتج"
                value={productForm.image || ''}
                onChange={(val) => setProductForm({ ...productForm, image: val })}
                aspectRatio="square"
                helperText="التقط صورة للمنتج أو اختر من استوديو الصور"
              />

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isAvailCheck"
                  checked={productForm.isAvailable !== false}
                  onChange={(e) => setProductForm({ ...productForm, isAvailable: e.target.checked })}
                  className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="isAvailCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  متاح ومعروض للزبائن داخل المتجر
                </label>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-purple-700 py-2.5 text-xs font-bold text-white hover:bg-purple-800 shadow-md"
                >
                  حفظ المنتج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. UPDATE ORDER STATUS MODAL */}
      {selectedOrderForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">تحديث حالة الطلب #{selectedOrderForStatus.id.slice(-6)}</h3>
            <p className="text-xs text-slate-500 mb-4">الزبون: {selectedOrderForStatus.customerName} | المتجر: {selectedOrderForStatus.storeName}</p>

            <form onSubmit={handleUpdateOrderStatus} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الحالة الجديدة</label>
                <select
                  value={newOrderStatus}
                  onChange={(e) => setNewOrderStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-bold text-slate-800 focus:outline-hidden"
                >
                  <option value="new">جديد (بانتظار الموافقة)</option>
                  <option value="preparing">قيد التحضير والتجهيز</option>
                  <option value="ready_for_pickup">جاهز للاستلام أو التوصيل</option>
                  <option value="completed">مكتمل وتم التسليم</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات الإدارة</label>
                <input
                  type="text"
                  value={orderStatusNote}
                  onChange={(e) => setOrderStatusNote(e.target.value)}
                  placeholder="ملاحظة للزبون أو صاحب المتجر..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForStatus(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-purple-700 py-2.5 text-xs font-bold text-white hover:bg-purple-800 shadow-md"
                >
                  تحديث الحالة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. EXTEND SUBSCRIPTION MODAL */}
      {extendingSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">تمديد اشتراك متجر ({extendingSubscription.storeName})</h3>
            <p className="text-xs text-slate-500 mb-4">تاريخ الانتهاء الحالي: <span className="font-bold text-purple-800">{extendingSubscription.endDate}</span></p>

            <form onSubmit={handleExtendSubscription} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">فترة التمديد</label>
                <select
                  value={extendMonths}
                  onChange={(e) => setExtendMonths(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-bold text-slate-800 focus:outline-hidden"
                >
                  <option value={1}>شهر واحد إضافي</option>
                  <option value={3}>3 أشهر (ربع سنوي)</option>
                  <option value={6}>6 أشهر (نصف سنوي)</option>
                  <option value={12}>12 شهر (سنة كاملة)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setExtendingSubscription(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-purple-700 py-2.5 text-xs font-bold text-white hover:bg-purple-800 shadow-md"
                >
                  تأكيد التمديد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. CREATE ACTIVATION CODE MODAL */}
      {showCreateCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-4">توليد رمز تفعيل متجر جديد</h3>
            <form onSubmit={handleCreateCode} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رمز التفعيل</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={newCodeForm.code}
                    onChange={(e) => setNewCodeForm({ ...newCodeForm, code: e.target.value.toUpperCase() })}
                    placeholder="مثال: SUKKAR-2026-99"
                    className="flex-1 rounded-xl border border-purple-200 bg-purple-50/30 p-2.5 text-xs font-mono font-bold text-purple-950 uppercase focus:border-purple-600 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateRandomCode}
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    توليد عشوائي
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف المخصص</label>
                <input
                  type="text"
                  value={newCodeForm.storeCategory}
                  onChange={(e) => setNewCodeForm({ ...newCodeForm, storeCategory: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">عدد مرات الاستخدام</label>
                  <input
                    type="number"
                    min={1}
                    value={newCodeForm.maxUses}
                    onChange={(e) => setNewCodeForm({ ...newCodeForm, maxUses: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الصلاحية (بالأيام)</label>
                  <input
                    type="number"
                    min={1}
                    value={newCodeForm.expiryDays}
                    onChange={(e) => setNewCodeForm({ ...newCodeForm, expiryDays: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات داخلية</label>
                <input
                  type="text"
                  value={newCodeForm.notes}
                  onChange={(e) => setNewCodeForm({ ...newCodeForm, notes: e.target.value })}
                  placeholder="مثال: لمتجر أسواق الفرات الجديد"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateCodeModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-purple-700 py-2.5 text-xs font-bold text-white hover:bg-purple-800 shadow-md"
                >
                  حفظ وتفعيل الرمز
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. SAFE PERMANENT DELETION CONFIRMATION MODAL */}
      {storeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-rose-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-lg font-black text-slate-900">تأكيد الحذف النهائي للمتجر</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                أنت على وشك حذف متجر <span className="font-black text-rose-600">«{storeToDelete.name}»</span> نهائياً من منصة أسواق قلعة سكر.
                سيؤدي هذا الإجراء إلى حذف جميع منتجات المتجر، الديون، المبيعات، سجل الاشتراكات، وحساب صاحب المتجر المرتبط به ولا يمكن التراجع عن ذلك!
              </p>
            </div>

            <div className="mt-4 rounded-2xl bg-rose-50/70 p-3.5 border border-rose-200 text-right">
              <label className="block text-xs font-bold text-rose-950 mb-1">
                لتأكيد الحذف النهائي، اكتب اسم المتجر «<span className="text-rose-700 font-black">{storeToDelete.name}</span>» أو كلمة «<span className="text-rose-700 underline font-black">حذف</span>»:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="اكتب اسم المتجر أو حذف"
                className="w-full rounded-xl border border-rose-300 bg-white p-2.5 text-xs font-bold text-slate-900 text-center focus:border-rose-600 focus:outline-hidden"
              />
            </div>

            <div className="mt-6 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setStoreToDelete(null)}
                disabled={isDeletingStore}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmPermanentDelete}
                disabled={isDeletingStore || (deleteConfirmationText.trim() !== storeToDelete.name && deleteConfirmationText.trim() !== 'حذف' && deleteConfirmationText.trim() !== 'delete')}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-rose-700 transition disabled:opacity-40"
              >
                {isDeletingStore ? 'جاري الحذف...' : 'حذف المتجر نهائياً'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
