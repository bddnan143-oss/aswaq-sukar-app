import React from 'react';
import { AlertTriangle, Store, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartConflictModal: React.FC = () => {
  const { conflictState, resolveConflict } = useCart();

  if (!conflictState.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl transition-all border border-slate-100"
        role="dialog"
        aria-modal="true"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div className="mt-4 text-center">
          <h3 className="text-lg font-bold text-slate-900">سلة المشتريات مخصصة لمتجر واحد</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            السلة الحالية تحتوي على منتجات من متجر <span className="font-bold text-emerald-700">«{conflictState.existingStoreName}»</span>. 
            هل تريد تفريغ السلة والبدء بطلب جديد من متجر <span className="font-bold text-blue-700">«{conflictState.incomingStore?.name}»</span>؟
          </p>
        </div>

        {conflictState.incomingProduct && (
          <div className="mt-4 rounded-2xl bg-slate-50 p-3 border border-slate-200/70 flex items-center gap-3">
            <img
              src={conflictState.incomingProduct.image}
              alt={conflictState.incomingProduct.name}
              className="h-12 w-12 rounded-xl object-cover"
            />
            <div className="text-right">
              <p className="text-xs text-slate-500">المنتج المراد إضافته:</p>
              <p className="text-sm font-bold text-slate-800">{conflictState.incomingProduct.name}</p>
              <p className="text-xs font-semibold text-emerald-600">
                {conflictState.incomingProduct.price.toLocaleString('ar-IQ')} د.ع
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={() => resolveConflict(false)}
            className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-98 transition"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => resolveConflict(true)}
            className="flex-1 rounded-xl bg-amber-600 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-amber-700 active:scale-98 transition flex items-center justify-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>تفريغ السلة والبدء من جديد</span>
          </button>
        </div>
      </div>
    </div>
  );
};
