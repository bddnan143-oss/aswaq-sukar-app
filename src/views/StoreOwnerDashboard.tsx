import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Wallet, 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Phone, 
  MapPin, 
  Save, 
  DollarSign, 
  UserCheck, 
  ArrowDownRight, 
  RefreshCw,
  Sparkles,
  Tag,
  FileText,
  UserPlus,
  Receipt,
  MessageCircle,
  Filter,
  Check,
  Eye,
  Calendar,
  AlertCircle,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import { Store, Product, Order, Debt, Sale, StoreLocation, OrderStatus } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LocationMap } from '../components/LocationMap';
import { DebtorLedgerModal } from '../components/DebtorLedgerModal';
import { AddDebtorModal } from '../components/AddDebtorModal';
import { CashSaleModal } from '../components/CashSaleModal';
import { ImageUploadField } from '../components/ImageUploadField';
import { PrintReportModal } from '../components/PrintReportModal';
import { SyncStatusBadge } from '../components/SyncStatusBadge';
import { sendFullStatementWhatsAppNotification } from '../utils/whatsapp';
import { 
  printIndividualDebtStatement, 
  printFullDebtsReport,
  generateFullDebtsReportHtml,
  generateIndividualStatementHtml
} from '../utils/printPdf';

export const StoreOwnerDashboard: React.FC = () => {
  const { user, store: authStore, isLoading: isAuthLoading, refreshProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'debts' | 'settings'>('overview');
  const [store, setStore] = useState<Store | null>(authStore);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Print & PDF Preview Modal
  const [printModalData, setPrintModalData] = useState<{
    title: string;
    filename: string;
    htmlContent: string;
  } | null>(null);

  // Modals / forms states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'مواد غذائية',
    price: 1000,
    discountPrice: 0,
    isOffer: false,
    stockQuantity: 10,
    minStockAlert: 3,
    image: '',
    description: '',
  });

  const [showAddDebtorModal, setShowAddDebtorModal] = useState(false);
  const [selectedDebtorLedger, setSelectedDebtorLedger] = useState<Debt | null>(null);
  const [debtSearchQuery, setDebtSearchQuery] = useState('');
  const [debtStatusFilter, setDebtStatusFilter] = useState<'all' | 'unpaid' | 'partially_paid' | 'paid'>('all');

  const [showSaleModal, setShowSaleModal] = useState(false);

  // Store Settings Form
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    phone: '',
    address: '',
    workingHours: '',
    category: '',
    description: '',
    logo: '',
    banner: '',
    location: null as StoreLocation | null,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthLoading) {
      if (user && user.role === 'store_owner') {
        loadAllStoreData();
      } else {
        setIsLoading(false);
      }
    }
  }, [user?.id, user?.role, isAuthLoading]);

  const loadAllStoreData = async () => {
    if (!user || user.role !== 'store_owner') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [prodsRes, ordsRes, debtsRes, salesRes] = await Promise.all([
        api.getMyProducts(),
        api.getMyOrders(),
        api.getMyDebts(),
        api.getMySales(),
      ]);
      setProducts(prodsRes.products);
      setOrders(ordsRes.orders);
      setDebts(debtsRes.debts);
      setSales(salesRes.sales);

      if (authStore) {
        setStore(authStore);
        setSettingsForm({
          name: authStore.name,
          phone: authStore.phone,
          address: authStore.address,
          workingHours: authStore.workingHours,
          category: authStore.category,
          description: authStore.description,
          logo: authStore.logo,
          banner: authStore.banner,
          location: authStore.location,
        });
      }
    } catch (e) {
      console.error('Error loading store data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. PRODUCT HANDLERS
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: store?.category || 'مواد غذائية',
      price: 1000,
      discountPrice: 0,
      isOffer: false,
      stockQuantity: 20,
      minStockAlert: 3,
      image: '',
      description: '',
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      category: prod.category,
      price: prod.price,
      discountPrice: prod.discountPrice || 0,
      isOffer: Boolean(prod.isOffer),
      stockQuantity: prod.stockQuantity,
      minStockAlert: prod.minStockAlert,
      image: prod.image,
      description: prod.description || '',
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const res = await api.updateProduct(editingProduct.id, {
          ...productForm,
          price: Number(productForm.price),
          discountPrice: productForm.isOffer ? Number(productForm.discountPrice) : undefined,
          stockQuantity: Number(productForm.stockQuantity),
          minStockAlert: Number(productForm.minStockAlert),
        });
        setProducts(products.map((p) => (p.id === res.product.id ? res.product : p)));
      } else {
        const res = await api.createProduct({
          ...productForm,
          price: Number(productForm.price),
          discountPrice: productForm.isOffer ? Number(productForm.discountPrice) : undefined,
          stockQuantity: Number(productForm.stockQuantity),
          minStockAlert: Number(productForm.minStockAlert),
        });
        setProducts([res.product, ...products]);
      }
      setShowProductModal(false);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حفظ المنتج.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      await api.deleteProduct(id);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حذف المنتج.');
    }
  };

  // 2. ORDER STATUS HANDLER
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await api.updateOrderStatus(orderId, newStatus);
      setOrders(orders.map((o) => (o.id === res.order.id ? res.order : o)));
    } catch (err: any) {
      alert(err.message || 'فشل تحديث حالة الطلب.');
    }
  };

  // 3. DEBT & LEDGER HANDLERS
  const handleDebtorCreated = (newDebt: Debt) => {
    setDebts((prev) => [newDebt, ...prev]);
    setSelectedDebtorLedger(newDebt);
  };

  const handleDebtUpdated = (updatedDebt: Debt) => {
    setDebts((prev) => prev.map((d) => (d.id === updatedDebt.id ? updatedDebt : d)));
    setSelectedDebtorLedger(updatedDebt);
  };

  const handleDebtDeleted = (debtId: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== debtId));
    if (selectedDebtorLedger?.id === debtId) {
      setSelectedDebtorLedger(null);
    }
  };

  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      const q = debtSearchQuery.trim().toLowerCase();
      const matchSearch = !q ||
        d.debtorName.toLowerCase().includes(q) ||
        (d.debtorPhone && d.debtorPhone.includes(q)) ||
        (d.items && d.items.some((it) => it.itemDescription.toLowerCase().includes(q)));
      
      const matchStatus =
        debtStatusFilter === 'all' ? true : d.status === debtStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [debts, debtSearchQuery, debtStatusFilter]);

  // 3.5 PRINT & EXPORT PDF HANDLERS
  const handleExportFullDebts = () => {
    console.log('[StoreOwnerDashboard] handleExportFullDebts clicked. Debts count:', debts.length);
    try {
      const html = generateFullDebtsReportHtml({
        storeName: store?.name || 'متجري',
        storePhone: store?.phone,
        debts: debts,
      });
      const filename = `تقرير_الديون_الكلي_${store?.name || 'متجري'}`;
      setPrintModalData({
        title: 'التقرير العام لكافة ديون وحسابات المتجر',
        filename,
        htmlContent: html,
      });
    } catch (err) {
      console.error('[StoreOwnerDashboard] Error creating full debts report:', err);
      printFullDebtsReport({
        storeName: store?.name || 'متجري',
        storePhone: store?.phone,
        debts: debts,
      });
    }
  };

  const handleExportIndividualDebt = (d: Debt) => {
    console.log('[StoreOwnerDashboard] handleExportIndividualDebt clicked for:', d.debtorName);
    try {
      const html = generateIndividualStatementHtml({
        storeName: store?.name || 'المتجر',
        storePhone: store?.phone,
        storeAddress: (store as any)?.locationName || store?.address || store?.location?.addressName,
        debt: d,
      });
      const filename = `كشف_حساب_${d.debtorName}_${store?.name || 'المتجر'}`;
      setPrintModalData({
        title: `كشف حساب الزبون: ${d.debtorName}`,
        filename,
        htmlContent: html,
      });
    } catch (err) {
      console.error('[StoreOwnerDashboard] Error creating individual statement:', err);
      printIndividualDebtStatement({
        storeName: store?.name || 'المتجر',
        storePhone: store?.phone,
        storeAddress: (store as any)?.locationName || store?.address || store?.location?.addressName,
        debt: d,
      });
    }
  };

  // 4. STORE SETTINGS SAVE
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSavedSuccess(false);
    try {
      const res = await api.updateMyStore(settingsForm);
      setStore(res.store);
      await refreshProfile();
      setSettingsSavedSuccess(true);
      setTimeout(() => setSettingsSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'فشل حفظ الإعدادات.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Calculations for Overview
  const totalSalesAmount = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalActiveDebts = debts
    .filter((d) => d.status !== 'paid')
    .reduce((sum, d) => sum + d.remainingAmount, 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'new' || o.status === 'preparing').length;
  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStockAlert).length;

  if (isAuthLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="text-sm font-bold text-slate-600">جاري تحميل بيانات المتجر...</span>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'store_owner') {
    return (
      <div className="mx-auto max-w-md p-8 text-center my-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-3" />
        <h3 className="text-lg font-black text-slate-900 mb-2">يرجى تسجيل الدخول كصاحب متجر</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          يجب تسجيل الدخول بحساب صاحب متجر مسجل للوصول إلى لوحة التحكم وإدارة المنتجات والمبيعات والديون.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 pb-24">
      {/* Top Welcome Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-3xl bg-slate-900 text-white p-6 shadow-md">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 overflow-hidden rounded-2xl border-2 border-emerald-500 bg-white shadow-md shrink-0">
            <img
              src={store?.logo || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}
              alt={store?.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black">{store?.name || 'لوحة تحكم المتجر'}</h1>
              <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/40">
                {store?.category}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-300">
              صاحب المتجر: <span className="font-bold text-white">{user?.name}</span> • قلعة سكر
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAllStoreData}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>تحديث البيانات</span>
          </button>
        </div>
      </div>

      {/* LocalStorage Auto-Sync Status Bar */}
      <div className="mt-4">
        <SyncStatusBadge />
      </div>

      {/* Tabs Navigation */}
      <div className="mt-6 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-200 pb-2">
        {[
          { id: 'overview', label: 'نظرة عامة وإحصائيات', icon: LayoutDashboard },
          { id: 'products', label: `المنتجات (${products.length})`, icon: Package },
          { id: 'orders', label: `الطلبات الواردة (${orders.length})`, icon: ShoppingBag, badge: pendingOrdersCount },
          { id: 'debts', label: 'الديون والمبيعات', icon: Wallet },
          { id: 'settings', label: 'إعدادات المتجر والموقع', icon: Settings },
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
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge ? (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-black text-white">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="mt-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-3xl bg-white p-5 shadow-xs border border-slate-200">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-3">
                <Package className="h-5 w-5" />
              </span>
              <p className="text-xs font-semibold text-slate-500">إجمالي المنتجات</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{products.length}</p>
              {lowStockCount > 0 && (
                <p className="mt-2 text-[11px] font-bold text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{lowStockCount} منتجات قيد النفاد</span>
                </p>
              )}
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-xs border border-slate-200">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 mb-3">
                <ShoppingBag className="h-5 w-5" />
              </span>
              <p className="text-xs font-semibold text-slate-500">الطلبات الواردة</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{orders.length}</p>
              <p className="mt-2 text-[11px] font-bold text-blue-600">
                {pendingOrdersCount} طلبات قيد التجهيز
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-xs border border-slate-200">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100 text-green-700 mb-3">
                <DollarSign className="h-5 w-5" />
              </span>
              <p className="text-xs font-semibold text-slate-500">إجمالي المبيعات المسجلة</p>
              <p className="text-xl font-black text-slate-900 mt-1">
                {totalSalesAmount.toLocaleString('ar-IQ')} <span className="text-xs">د.ع</span>
              </p>
              <p className="mt-2 text-[11px] text-slate-500">{sales.length} عمليات بيع</p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-xs border border-slate-200">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 mb-3">
                <Wallet className="h-5 w-5" />
              </span>
              <p className="text-xs font-semibold text-slate-500">الديون النشطة للمتجر</p>
              <p className="text-xl font-black text-rose-700 mt-1">
                {totalActiveDebts.toLocaleString('ar-IQ')} <span className="text-xs">د.ع</span>
              </p>
              <p className="mt-2 text-[11px] text-slate-500">
                {debts.filter((d) => d.status !== 'paid').length} عملاء عليهم ديون
              </p>
            </div>
          </div>

          {/* Quick Actions & Recent Orders Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-3xl bg-white p-6 shadow-xs border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span>أحدث الطلبات الواردة</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  عرض جميع الطلبات
                </button>
              </div>

              {orders.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">لا توجد طلبات جديدة حالياً.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {orders.slice(0, 4).map((ord) => (
                    <div key={ord.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{ord.customerName}</p>
                        <p className="text-[11px] text-slate-400">
                          {ord.items.length} أصناف • {new Date(ord.createdAt).toLocaleDateString('ar-IQ')}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black text-emerald-700">
                          {ord.totalAmount.toLocaleString('ar-IQ')} د.ع
                        </p>
                        <span className="text-[10px] font-bold text-slate-500">
                          حالة: {ord.status === 'ready_for_pickup' ? 'جاهز' : ord.status === 'preparing' ? 'تجهيز' : 'مراجعة'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Record Box */}
            <div className="rounded-3xl bg-emerald-50/60 p-6 border border-emerald-100 space-y-3">
              <h3 className="text-sm font-black text-emerald-950">إجراءات سريعة</h3>
              <button
                type="button"
                onClick={handleOpenAddProduct}
                className="w-full flex items-center justify-between rounded-2xl bg-white p-3 text-xs font-bold text-slate-800 shadow-2xs hover:bg-emerald-600 hover:text-white transition"
              >
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>إضافة منتج جديد</span>
                </span>
                <span className="text-[11px]">→</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('debts'); setShowSaleModal(true); }}
                className="w-full flex items-center justify-between rounded-2xl bg-white p-3 text-xs font-bold text-slate-800 shadow-2xs hover:bg-emerald-600 hover:text-white transition"
              >
                <span className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>تسجيل عملية بيع نقدية</span>
                </span>
                <span className="text-[11px]">→</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('debts'); setShowAddDebtorModal(true); }}
                className="w-full flex items-center justify-between rounded-2xl bg-white p-3 text-xs font-bold text-slate-800 shadow-2xs hover:bg-emerald-600 hover:text-white transition"
              >
                <span className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <span>تسجيل دين لزبون</span>
                </span>
                <span className="text-[11px]">→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">إدارة منتجات المتجر والأسعار</h2>
              <p className="text-xs text-slate-500">إضافة وتعديل المنتجات، تحديد الأسعار، العروض، ومراقبة المخزون</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddProduct}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة منتج</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-right text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3.5">المنتج</th>
                  <th className="p-3.5">التصنيف</th>
                  <th className="p-3.5">السعر العادي</th>
                  <th className="p-3.5">عرض خاص</th>
                  <th className="p-3.5">الكمية بالمخزن</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((prod) => (
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
                          <p className="text-[10px] text-slate-400 truncate max-w-xs">{prod.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">{prod.category}</td>
                    <td className="p-3.5 font-bold text-slate-900">{prod.price.toLocaleString('ar-IQ')} د.ع</td>
                    <td className="p-3.5">
                      {prod.isOffer ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 font-bold text-rose-700 border border-rose-200">
                          {prod.discountPrice?.toLocaleString('ar-IQ')} د.ع
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`font-bold ${prod.stockQuantity <= prod.minStockAlert ? 'text-amber-600' : 'text-slate-700'}`}>
                        {prod.stockQuantity} قطعة
                      </span>
                    </td>
                    <td className="p-3.5">
                      {prod.isAvailable ? (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">متوفر</span>
                      ) : (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">غير متوفر</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditProduct(prod)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                          title="تعديل"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS */}
      {activeTab === 'orders' && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">إدارة الطلبات الواردة من الزبائن</h2>
              <p className="text-xs text-slate-500">تحديث حالة الطلب وإشعار الزبون بالجاهزية للاستلام</p>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-700">لا توجد طلبات واردة حتى الآن.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div key={ord.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-900">طلب من: {ord.customerName}</h3>
                        <span className="font-mono text-[10px] text-slate-400">#{ord.orderNumber || ord.id.slice(0, 8)}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-emerald-600" />
                          <span dir="ltr">{ord.customerPhone}</span>
                        </span>
                        <span>•</span>
                        <span>{new Date(ord.createdAt).toLocaleDateString('ar-IQ')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-emerald-700">
                        {ord.totalAmount.toLocaleString('ar-IQ')} د.ع
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="my-3 space-y-1.5">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-slate-700">
                        <span>• {it.productName} ({it.quantity} × {it.price.toLocaleString('ar-IQ')} د.ع)</span>
                        <span className="font-bold">{it.subtotal.toLocaleString('ar-IQ')} د.ع</span>
                      </div>
                    ))}
                  </div>

                  {ord.notes && (
                    <div className="rounded-xl bg-amber-50/60 p-2 text-xs text-amber-900 mb-3 border border-amber-200">
                      <span className="font-bold">ملاحظات الزبون: </span>
                      <span>{ord.notes}</span>
                    </div>
                  )}

                  {/* Status Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <div className="text-xs text-slate-500">
                      الحالة الحالية: <span className="font-bold text-slate-800">{ord.status}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {ord.status === 'new' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(ord.id, 'preparing')}
                          className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                        >
                          بدء التجهيز بالمحل
                        </button>
                      )}

                      {ord.status === 'preparing' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(ord.id, 'ready_for_pickup')}
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                        >
                          جاهز للاستلام الآن ✓
                        </button>
                      )}

                      {ord.status === 'ready_for_pickup' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(ord.id, 'completed')}
                          className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-900 transition"
                        >
                          تم تسليم الطلب والمحاسبة
                        </button>
                      )}

                      {ord.status !== 'completed' && ord.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(ord.id, 'cancelled')}
                          className="rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                        >
                          إلغاء الطلب
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DEBTS & SALES (STRICT DATA ISOLATION & ITEMIZED LEDGER) */}
      {activeTab === 'debts' && (
        <div className="mt-6 space-y-6">
          {/* Header Banner */}
          <div className="rounded-3xl bg-slate-900 text-white p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                  <Wallet className="h-4 w-4" />
                </span>
                <h2 className="text-base font-black text-white">نظام سجل الديون والمبيعات المعزول</h2>
              </div>
              <p className="text-xs text-slate-300">
                سجل تفصيلي بحركات المشتريات والدفعات لكل زبون على حدة • بيانات معزولة ومحمية بالكامل لمتجرك
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleExportFullDebts}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition shadow-xs border border-slate-700 active:scale-95"
                title="تصدير وطباعة تقرير شامل بكافة ديون المتجر والزبائن بصيغة PDF"
              >
                <Printer className="h-4 w-4 text-blue-400" />
                <span>تصدير كشف الديون الكلي PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSaleModal(true)}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
              >
                <Plus className="h-4 w-4" />
                <span>تسجيل بيع مباشر</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddDebtorModal(true)}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs"
              >
                <UserPlus className="h-4 w-4" />
                <span>+ فتح سجل مدين جديد</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-4 shadow-2xs">
              <span className="text-[11px] font-bold text-rose-700 block mb-1">إجمالي الديون المطلوبة</span>
              <p className="text-xl sm:text-2xl font-black text-rose-700">
                {totalActiveDebts.toLocaleString('ar-IQ')} <span className="text-xs font-semibold">د.ع</span>
              </p>
              <span className="text-[10px] text-rose-600 mt-1 block">
                {debts.filter((d) => d.status !== 'paid').length} حسابات غير مسددة
              </span>
            </div>

            <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-4 shadow-2xs">
              <span className="text-[11px] font-bold text-blue-700 block mb-1">إجمالي المشتريات المسجلة</span>
              <p className="text-xl sm:text-2xl font-black text-blue-900">
                {debts.reduce((sum, d) => sum + d.amount, 0).toLocaleString('ar-IQ')} <span className="text-xs font-semibold text-slate-500">د.ع</span>
              </p>
              <span className="text-[10px] text-blue-600 mt-1 block">
                {debts.reduce((sum, d) => sum + (d.items?.length || 0), 0)} حركة مشتريات
              </span>
            </div>

            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-700 block mb-1">المبالغ المسددة فعلياً</span>
              <p className="text-xl sm:text-2xl font-black text-emerald-700">
                {debts.reduce((sum, d) => sum + (d.paidAmount || 0), 0).toLocaleString('ar-IQ')} <span className="text-xs font-semibold text-emerald-600">د.ع</span>
              </p>
              <span className="text-[10px] text-emerald-600 mt-1 block">
                {debts.reduce((sum, d) => sum + (d.payments?.length || 0), 0)} دفعات سداد
              </span>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 block mb-1">عدد سجلات المدينين</span>
              <p className="text-xl sm:text-2xl font-black text-slate-900">
                {debts.length} <span className="text-xs font-semibold text-slate-500">زبائن</span>
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {debts.filter((d) => d.status === 'paid').length} حسابات مسددة بالكامل ✓
              </span>
            </div>
          </div>

          {/* Search, Filter & Debtor Directory */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">دليل وسجلات المدينين</h3>
                <p className="text-xs text-slate-500 mt-0.5">اضغط على أي زبون لعرض كشف الحساب وتفاصيل المواد وإضافة الحركات</p>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: `الكل (${debts.length})` },
                  { id: 'unpaid', label: `غير مسدد (${debts.filter((d) => d.status === 'unpaid').length})` },
                  { id: 'partially_paid', label: `مسدد جزئياً (${debts.filter((d) => d.status === 'partially_paid').length})` },
                  { id: 'paid', label: `مسدد بالكامل (${debts.filter((d) => d.status === 'paid').length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setDebtStatusFilter(f.id as any)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                      debtStatusFilter === f.id
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={debtSearchQuery}
                onChange={(e) => setDebtSearchQuery(e.target.value)}
                placeholder="ابحث باسم الزبون، رقم الهاتف، أو اسم أي مادة مشتراة..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pr-10 pl-4 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Debtors List / Table */}
            {filteredDebts.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-700">
                  {debts.length === 0 ? 'لا توجد ديون مسجلة حالياً.' : 'لا توجد نتائج مطابقة لبحثك.'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {debts.length === 0
                    ? 'اضغط على زر «+ فتح سجل مدين جديد» لبدء تسجيل ديون الزبائن وقوائم المشتريات.'
                    : 'جرب البحث بكلمات أخرى أو اختر فئة مختلفة.'}
                </p>
                {debts.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAddDebtorModal(true)}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
                  >
                    <UserPlus className="h-4 w-4" /> فتح أول سجل مدين
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                {filteredDebts.map((d) => {
                  const itemCount = d.items?.length || 0;
                  const payCount = d.payments?.length || 0;
                  const isPaid = d.status === 'paid';
                  const isPartial = d.status === 'partially_paid';

                  return (
                    <div
                      key={d.id}
                      className="group rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        {/* Top: Debtor Info + Status */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 font-black text-sm border border-blue-100">
                              {d.debtorName.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition">
                                {d.debtorName}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                                {d.debtorPhone ? (
                                  <span className="font-mono text-slate-600" dir="ltr">
                                    {d.debtorPhone}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">بدون هاتف</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div>
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                                <CheckCircle2 className="h-3 w-3" /> مسدد بالكامل
                              </span>
                            ) : isPartial ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
                                مسدد جزئياً
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">
                                غير مسدد
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Middle: Financial Balance Cards */}
                        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50/70 p-3 border border-slate-100 mb-3">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block">إجمالي الشراء</span>
                            <span className="text-xs font-bold text-slate-800">
                              {d.amount.toLocaleString('ar-IQ')} <span className="text-[9px] text-slate-400">د.ع</span>
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block">المسدد</span>
                            <span className="text-xs font-bold text-emerald-700">
                              {d.paidAmount.toLocaleString('ar-IQ')} <span className="text-[9px] text-slate-400">د.ع</span>
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-rose-700 block">المتبقي الصافي</span>
                            <span className={`text-xs font-black ${isPaid ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {d.remainingAmount.toLocaleString('ar-IQ')} <span className="text-[9px]">د.ع</span>
                            </span>
                          </div>
                        </div>

                        {/* Activity snippet */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-4 px-1">
                          <span>{itemCount} حركات مشتريات مسجلة</span>
                          {payCount > 0 && <span>{payCount} دفعات سداد</span>}
                          <span>{d.date || 'اليوم'}</span>
                        </div>
                      </div>

                      {/* Bottom Action Bar */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setSelectedDebtorLedger(d)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-2xs"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>كشف الحساب</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExportIndividualDebt(d)}
                          className="rounded-2xl p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 transition border border-slate-200 active:scale-95"
                          title="طباعة وتحميل كشف الحساب بصيغة PDF"
                        >
                          <Printer className="h-4 w-4 text-slate-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() => sendFullStatementWhatsAppNotification({
                            phone: d.debtorPhone,
                            storeName: store?.name || 'المتجر',
                            debtorName: d.debtorName,
                            totalPurchases: d.amount,
                            totalPaid: d.paidAmount,
                            remainingAmount: d.remainingAmount,
                            items: d.items,
                          })}
                          className="rounded-2xl p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition border border-emerald-200"
                          title="إرسال كشف الحساب للزبون عبر واتساب"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`حذف سجل المدين (${d.debtorName}) نهائياً؟`)) {
                              handleDebtDeleted(d.id);
                            }
                          }}
                          className="rounded-2xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="حذف السجل"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sales History */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">سجل المبيعات المسجلة</h3>
                <p className="text-xs text-slate-500">سجل الفواتير والمبيعات المباشرة للمتجر</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSaleModal(true)}
                className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition border border-emerald-200"
              >
                + تسجيل بيع
              </button>
            </div>

            {sales.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">لا توجد مبيعات مسجلة بعد.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {sales.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-3 text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{s.notes || s.items?.[0]?.name || 'مبيعات مباشرة'}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(s.createdAt).toLocaleDateString('ar-IQ')} • {s.paymentType === 'cash' ? 'نقداً (كاش)' : 'دين'}
                        {s.customerName ? ` • زبون: ${s.customerName}` : ''}
                      </p>
                    </div>
                    <span className="font-black text-emerald-700 text-sm">{s.totalAmount.toLocaleString('ar-IQ')} د.ع</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: STORE SETTINGS & INTERACTIVE MAP */}
      {activeTab === 'settings' && (
        <div className="mt-6 space-y-6">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Store Information */}
            <div className="rounded-3xl bg-white p-6 shadow-xs border border-slate-200 space-y-4">
              <h3 className="text-sm font-black text-slate-900">المعلومات الأساسية للمتجر</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم المتجر</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف للتواصل</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تصنيف النشاط</label>
                  <input
                    type="text"
                    value={settingsForm.category}
                    onChange={(e) => setSettingsForm({ ...settingsForm, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">أوقات العمل</label>
                  <input
                    type="text"
                    value={settingsForm.workingHours}
                    onChange={(e) => setSettingsForm({ ...settingsForm, workingHours: e.target.value })}
                    placeholder="مثال: يومياً من 8:00 ص إلى 11:00 م"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">العنوان التفصيلي في قلعة سكر</label>
                <input
                  type="text"
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  placeholder="مثال: الشارع العام، قرب فلكة الساعة"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف المتجر والخدمات</label>
                <textarea
                  value={settingsForm.description}
                  onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* STORE LOGO & BANNER UPLOAD */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <ImageUploadField
                  id="store-logo-upload"
                  label="شعار المتجر (اللوجو)"
                  value={settingsForm.logo}
                  onChange={(val) => setSettingsForm({ ...settingsForm, logo: val })}
                  aspectRatio="avatar"
                  helperText="اختر شعار متجرك من الاستوديو أو التقط صورة بالكاميرا"
                />

                <ImageUploadField
                  id="store-banner-upload"
                  label="صورة واجهة المتجر / الغلاف (اختياري)"
                  value={settingsForm.banner}
                  onChange={(val) => setSettingsForm({ ...settingsForm, banner: val })}
                  aspectRatio="wide"
                  helperText="صورة لواجهة المحل أو لافتة العرض الخاصة بمتجرك"
                />
              </div>
            </div>

            {/* INTERACTIVE STORE LOCATION MAP */}
            <div className="rounded-3xl bg-white p-6 shadow-xs border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    <span>تحديد موقع المتجر على الخريطة</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    حدد موقع محلك بدقة على خريطة قلعة سكر لتمكين الزبائن من فتح الاتجاهات المباشرة إليه.
                  </p>
                </div>
              </div>

              <LocationMap
                location={settingsForm.location}
                editable={true}
                onLocationChange={(loc) => setSettingsForm({ ...settingsForm, location: loc })}
                storeName={settingsForm.name}
                height="320px"
              />
            </div>

            {settingsSavedSuccess && (
              <div className="rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>تم حفظ إعدادات المتجر وموقعه على الخريطة بنجاح!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSavingSettings}
              className="rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition disabled:opacity-60 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSavingSettings ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </form>
        </div>
      )}

      {/* PRODUCT ADD/EDIT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المنتج</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="مثال: بيبسي 1.25 لتر، زيت طعام، أرز بسمتي"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السعر (بالدينار العراقي)</label>
                  <input
                    type="number"
                    required
                    min={250}
                    step={250}
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف</label>
                  <input
                    type="text"
                    required
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Offer Checkbox */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isOffer}
                    onChange={(e) => setProductForm({ ...productForm, isOffer: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span>تفعيل كعرض خاص / تخفيض سعر 🔥</span>
                </label>

                {productForm.isOffer && (
                  <div className="mt-2">
                    <label className="block text-[11px] font-bold text-rose-700 mb-1">سعر العرض المخفض (د.ع)</label>
                    <input
                      type="number"
                      required
                      min={250}
                      value={productForm.discountPrice}
                      onChange={(e) => setProductForm({ ...productForm, discountPrice: Number(e.target.value) })}
                      className="w-full rounded-xl border border-rose-300 bg-white p-2 text-xs text-slate-800 focus:border-rose-500 focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الكمية المتوفرة بالمخزن</label>
                  <input
                    type="number"
                    min={0}
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm({ ...productForm, stockQuantity: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تنبيه عند وصول المخزون إلى</label>
                  <input
                    type="number"
                    min={1}
                    value={productForm.minStockAlert}
                    onChange={(e) => setProductForm({ ...productForm, minStockAlert: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <ImageUploadField
                id="product-image-upload"
                label="صورة المنتج"
                value={productForm.image}
                onChange={(val) => setProductForm({ ...productForm, image: val })}
                required
                aspectRatio="square"
                helperText="التقط صورة للمنتج مباشرة بكاميرا الهاتف أو اختر من استوديو الصور"
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف المنتج (اختياري)</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  حفظ المنتج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED DEBTOR LEDGER MODAL */}
      {selectedDebtorLedger && (
        <DebtorLedgerModal
          debt={debts.find((d) => d.id === selectedDebtorLedger.id) || selectedDebtorLedger}
          storeName={store?.name || 'متجري'}
          storePhone={store?.phone}
          storeAddress={(store as any)?.locationName || store?.address || store?.location?.addressName}
          onClose={() => setSelectedDebtorLedger(null)}
          onDebtUpdated={handleDebtUpdated}
          onDebtDeleted={handleDebtDeleted}
        />
      )}

      {/* ADD NEW DEBTOR MODAL */}
      {showAddDebtorModal && (
        <AddDebtorModal
          storeName={store?.name || 'متجري'}
          onClose={() => setShowAddDebtorModal(false)}
          onDebtorCreated={handleDebtorCreated}
        />
      )}

      {/* DIRECT CASH SALE (POS) MODAL */}
      {showSaleModal && (
        <CashSaleModal
          storeId={store?.id || ''}
          storeName={store?.name || 'متجري'}
          storeLogo={store?.logo}
          storePhone={store?.phone}
          storeAddress={(store as any)?.locationName || store?.address || store?.location?.addressName}
          products={products}
          onClose={() => setShowSaleModal(false)}
          onSaleSaved={(newSale, updatedProducts) => {
            setSales((prev) => [newSale, ...prev]);
            if (updatedProducts && updatedProducts.length > 0) {
              setProducts(updatedProducts);
            }
          }}
          onPreviewPdf={(modalData) => setPrintModalData(modalData)}
        />
      )}

      {/* PRINT & PDF PREVIEW MODAL */}
      {printModalData && (
        <PrintReportModal
          title={printModalData.title}
          filename={printModalData.filename}
          htmlContent={printModalData.htmlContent}
          onClose={() => setPrintModalData(null)}
        />
      )}
    </div>
  );
};
