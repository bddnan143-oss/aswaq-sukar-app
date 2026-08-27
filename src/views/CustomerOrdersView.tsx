import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Store, 
  Clock, 
  CheckCircle2, 
  PackageCheck, 
  XCircle, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  MapPin,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const CustomerOrdersView: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading) {
      if (user) {
        loadOrders();
      } else {
        setIsLoading(false);
      }
    }
  }, [user?.id, isAuthLoading]);

  const loadOrders = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.getCustomerOrders();
      setOrders(res.orders);
    } catch (e) {
      console.error('Error fetching customer orders:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5 animate-spin" />
            <span>قيد المراجعة</span>
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>جاري التجهيز بالمحل</span>
          </span>
        );
      case 'ready_for_pickup':
        return (
          <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-300 animate-pulse">
            <PackageCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>جاهز للاستلام الآن 🎉</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>تم الاستلام والمحاسبة</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200">
            <XCircle className="h-3.5 w-3.5" />
            <span>ملغي</span>
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-emerald-600" />
            <span>طلباتي ومتابعة الاستلام</span>
          </h1>
          <p className="text-xs text-slate-500">متابعة حالة تجهيز طلباتك في متاجر قلعة سكر</p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>تحديث</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 rounded-3xl bg-slate-200/70 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-800">لا توجد طلبات سابقة حتى الآن</h3>
          <p className="mt-1 text-xs text-slate-500">
            تصفح متاجر قلعة سكر وأضف منتجاتك للسلة لإرسال طلبك الأول.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
            const isExpanded = expandedOrderId === ord.id;
            return (
              <div
                key={ord.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs transition hover:border-emerald-200"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                  className="cursor-pointer p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/40 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 font-bold">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-900">{ord.storeName}</h3>
                        <span className="font-mono text-[10px] text-slate-400">#{ord.orderNumber || ord.id.slice(0, 8)}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(ord.createdAt).toLocaleDateString('ar-IQ')}</span>
                        </span>
                        <span>•</span>
                        <span>{ord.items.length} أصناف</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                    <div className="text-left sm:text-right">
                      <span className="text-base font-black text-emerald-700">
                        {ord.totalAmount.toLocaleString('ar-IQ')} د.ع
                      </span>
                    </div>
                    <div>{getStatusBadge(ord.status)}</div>
                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 sm:p-5 bg-white space-y-4">
                    {/* Pickup Guidance */}
                    {ord.status === 'ready_for_pickup' && (
                      <div className="rounded-2xl bg-emerald-50 p-3.5 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                        <PackageCheck className="h-5 w-5 shrink-0 text-emerald-700" />
                        <div>
                          <p className="font-bold">طلبك جاهز تماماً للاستلام!</p>
                          <p className="text-[11px] text-emerald-800">
                            تفضل بزيارة محل «{ord.storeName}» لاستلام الأغراض ودفع المبلغ ({ord.totalAmount.toLocaleString('ar-IQ')} د.ع).
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Items table */}
                    <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
                      {ord.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{item.productName}</p>
                            <p className="text-[11px] text-slate-400">
                              {item.price.toLocaleString('ar-IQ')} د.ع × {item.quantity}
                            </p>
                          </div>
                          <span className="font-bold text-slate-900">
                            {item.subtotal.toLocaleString('ar-IQ')} د.ع
                          </span>
                        </div>
                      ))}
                    </div>

                    {ord.notes && (
                      <div className="rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600">
                        <span className="font-bold text-slate-800">ملاحظاتك للمتجر: </span>
                        <span>{ord.notes}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
