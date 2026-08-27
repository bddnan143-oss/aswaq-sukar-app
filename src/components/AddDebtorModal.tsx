import React, { useState } from 'react';
import { X, UserPlus, Phone, ShoppingBag, Calendar, Clock, AlertCircle, MessageCircle } from 'lucide-react';
import { Debt } from '../types';
import { api } from '../services/api';
import { sendDebtItemWhatsAppNotification } from '../utils/whatsapp';

interface AddDebtorModalProps {
  storeName?: string;
  onClose: () => void;
  onDebtorCreated: (newDebt: Debt) => void;
}

export const AddDebtorModal: React.FC<AddDebtorModalProps> = ({
  storeName = 'المتجر',
  onClose,
  onDebtorCreated,
}) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [debtorName, setDebtorName] = useState('');
  const [debtorPhone, setDebtorPhone] = useState('');
  const [hasInitialPurchase, setHasInitialPurchase] = useState(true);
  const [itemDescription, setItemDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(currentTimeStr);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent, sendWhatsApp = false) => {
    if (e) e.preventDefault();
    if (!debtorName.trim()) {
      setError('يرجى إدخال اسم الشخص المدين.');
      return;
    }

    if (hasInitialPurchase) {
      if (!itemDescription.trim()) {
        setError('يرجى إدخال بيان المادة أو التفاصيل لحركة الدين الأولى.');
        return;
      }
      const numAmount = Number(amount);
      if (!numAmount || numAmount <= 0) {
        setError('يرجى إدخال مبلغ صحيح لحركة الدين بالدينار العراقي.');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.createDebt({
        debtorName: debtorName.trim(),
        debtorPhone: debtorPhone.trim(),
        itemDescription: hasInitialPurchase ? itemDescription.trim() : undefined,
        amount: hasInitialPurchase ? Number(amount) : 0,
        notes: notes.trim(),
        date,
        time,
      });

      if (sendWhatsApp && hasInitialPurchase) {
        sendDebtItemWhatsAppNotification({
          phone: debtorPhone.trim(),
          storeName,
          debtorName: debtorName.trim(),
          itemDescription: itemDescription.trim(),
          itemAmount: Number(amount),
          remainingAmount: res.debt.remainingAmount,
          date,
          time,
          notes: notes.trim(),
        });
      }

      onDebtorCreated(res.debt);
      onClose();
    } catch (err: any) {
      setError(err.message || 'فشل إنشاء سجل المدين.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">فتح سجل دين لزبون جديد</h3>
              <p className="text-xs text-slate-500">إضافة مدين جديد مع إمكانية إضافة حركة مشتريات أولى</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-xs font-bold text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* DEBTOR INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم الشخص المدين <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={debtorName}
                onChange={(e) => setDebtorName(e.target.value)}
                placeholder="مثال: أبو كرار العقيلي، سيد مهدي..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم الهاتف (اختياري)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={debtorPhone}
                  onChange={(e) => setDebtorPhone(e.target.value)}
                  placeholder="07801122334"
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* INITIAL PURCHASE TOGGLE */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasInitialPurchase}
                  onChange={(e) => setHasInitialPurchase(e.target.checked)}
                  className="h-4 w-4 rounded-sm text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  تسجيل مشتريات / حركة دين أولى مباشرة
                </span>
              </label>
            </div>

            {hasInitialPurchase && (
              <div className="space-y-3 pt-2 border-t border-slate-200/60 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    بيان المادة / التفاصيل <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={hasInitialPurchase}
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="مثال: كارتون شاي، مسواك مخضر، بيبسي 1.25 لتر..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      المبلغ (دينار عراقي) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required={hasInitialPurchase}
                      min={250}
                      step={250}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="مثال: 25000"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      التاريخ والوقت
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                      />
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ملاحظات إضافية (اختياري)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: مسواك بداية الشهر، سيتم الدفع في 25 من الشهر..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              إلغاء
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={(e) => handleSubmit(e, false)}
              className="flex-1 rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-white hover:bg-slate-900 transition shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ فقط'}
            </button>
            {hasInitialPurchase && (
              <button
                type="submit"
                disabled={isSubmitting}
                onClick={(e) => handleSubmit(e, true)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs disabled:opacity-50"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ وإرسال واتساب'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
