import React, { useState } from 'react';
import { ShoppingBag, X, Trash2, Plus, Minus, Store, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (orderId: string) => void;
  onRequireAuth: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
  onRequireAuth,
}) => {
  const { items, storeId, storeName, totalAmount, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();

  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }

    if (!storeId || items.length === 0) {
      setErrorMsg('السلة فارغة.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        storeId,
        items: items.map((it) => ({
          productId: it.product.id,
          quantity: it.quantity,
        })),
        notes: notes.trim(),
      };

      const res = await api.createOrder(payload);
      clearCart();
      onClose();
      onOrderSuccess(res.order.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إرسال الطلب.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all border border-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">سلة المشتريات</h2>
              {storeName && (
                <p className="flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                  <Store className="h-3 w-3" />
                  <span>متجر: {storeName}</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <p className="mt-4 text-base font-bold text-slate-700">السلة فارغة حالياً</p>
              <p className="mt-1 text-xs text-slate-500">تصفح متاجر ومنتجات قلعة سكر وأضف ما تحتاجه للطلب.</p>
              <button
                onClick={onClose}
                className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                تصفح المتاجر الآن
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Items List */}
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/70 bg-white">
                {items.map((item) => {
                  const effectivePrice = item.product.isOffer && item.product.discountPrice 
                    ? item.product.discountPrice 
                    : item.product.price;
                  const itemSubtotal = effectivePrice * item.quantity;

                  return (
                    <div key={item.product.id} className="flex items-center gap-3.5 p-3.5">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-16 w-16 rounded-xl object-cover border border-slate-100"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{item.product.name}</h4>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="text-xs font-semibold text-emerald-700">
                            {effectivePrice.toLocaleString('ar-IQ')} د.ع
                          </span>
                          {item.product.isOffer && (
                            <span className="text-[11px] text-slate-400 line-through">
                              {item.product.price.toLocaleString('ar-IQ')} د.ع
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] font-medium text-slate-500">
                          الإجمالي: <span className="text-slate-800 font-bold">{itemSubtotal.toLocaleString('ar-IQ')} د.ع</span>
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-700 shadow-2xs hover:bg-slate-100 active:scale-95 transition"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          disabled={item.quantity >= item.product.stockQuantity}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-700 shadow-2xs hover:bg-slate-100 active:scale-95 transition disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Remove item */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Order Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ملاحظات إضافية للمتجر (اختياري)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: يرجى وضع الأغراض في كيس محكم، أو ملاحظات بخصوص التجهيز..."
                  rows={2}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden transition"
                />
              </div>

              {/* Pickup info badge */}
              <div className="flex items-start gap-2.5 rounded-2xl bg-blue-50/80 p-3 text-xs text-blue-900 border border-blue-100">
                <Clock className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
                <p className="leading-relaxed">
                  <span className="font-bold">طريقة الاستلام:</span> استلام مباشر من محل المتجر في قلعة سكر بعد تجهيز الطلب.
                </p>
              </div>

              {/* Error alert */}
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/80 p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">المجموع الكلي:</span>
              <span className="text-xl font-black text-emerald-700">
                {totalAmount.toLocaleString('ar-IQ')} د.ع
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={clearCart}
                className="rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                تفريغ
              </button>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="flex-1 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>جاري إرسال الطلب...</span>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>{user ? 'تأكيد وإرسال الطلب' : 'تسجيل الدخول لإرسال الطلب'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
