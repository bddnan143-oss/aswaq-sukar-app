import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  CreditCard, 
  CheckCircle2, 
  Trash2, 
  Phone, 
  Calendar, 
  Clock, 
  Share2, 
  ShoppingBag, 
  FileText, 
  AlertCircle,
  MessageCircle,
  Receipt,
  User,
  ArrowDownLeft,
  Check,
  Send,
  Printer,
  FileDown
} from 'lucide-react';
import { Debt, DebtItemEntry } from '../types';
import { api } from '../services/api';
import { 
  sendDebtItemWhatsAppNotification, 
  sendPaymentWhatsAppNotification, 
  sendFullStatementWhatsAppNotification, 
  cleanIraqiPhoneNumber 
} from '../utils/whatsapp';
import { 
  printIndividualDebtStatement, 
  generateIndividualStatementHtml 
} from '../utils/printPdf';
import { PrintReportModal } from './PrintReportModal';

interface DebtorLedgerModalProps {
  debt: Debt;
  storeName?: string;
  storePhone?: string;
  storeAddress?: string;
  onClose: () => void;
  onDebtUpdated: (updatedDebt: Debt) => void;
  onDebtDeleted: (debtId: string) => void;
}

export const DebtorLedgerModal: React.FC<DebtorLedgerModalProps> = ({
  debt,
  storeName = 'المتجر',
  storePhone,
  storeAddress,
  onClose,
  onDebtUpdated,
  onDebtDeleted,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'items' | 'payments'>('items');
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [showSettleConfirm, setShowSettleConfirm] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Quick Action WhatsApp Notification Prompt after operation
  const [lastActionWhatsApp, setLastActionWhatsApp] = useState<{
    type: 'item' | 'payment';
    itemDescription?: string;
    amount: number;
    remainingAmount: number;
    date?: string;
    time?: string;
    notes?: string;
  } | null>(null);

  // New Item Form State
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [itemForm, setItemForm] = useState({
    itemDescription: '',
    amount: '',
    date: todayStr,
    time: currentTimeStr,
    notes: '',
  });

  // Payment Form State
  const [payForm, setPayForm] = useState({
    amount: debt.remainingAmount > 0 ? String(debt.remainingAmount) : '',
    date: todayStr,
    note: '',
  });

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  // 1. ADD DEBT ITEM HANDLER (WITH OPTIONAL INSTANT WHATSAPP SEND)
  const handleAddItem = async (e?: React.FormEvent, sendWhatsApp = false) => {
    if (e) e.preventDefault();
    if (!itemForm.itemDescription.trim()) {
      showNotification('يرجى كتابة بيان المادة أو التفاصيل.', true);
      return;
    }
    const numAmount = Number(itemForm.amount);
    if (!numAmount || numAmount <= 0) {
      showNotification('يرجى إدخال مبلغ صحيح بالدينار العراقي.', true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.addDebtItem(debt.id, {
        itemDescription: itemForm.itemDescription.trim(),
        amount: numAmount,
        date: itemForm.date || todayStr,
        time: itemForm.time || currentTimeStr,
        notes: itemForm.notes.trim(),
      });
      onDebtUpdated(res.debt);

      const actionData = {
        type: 'item' as const,
        itemDescription: itemForm.itemDescription.trim(),
        amount: numAmount,
        remainingAmount: res.debt.remainingAmount,
        date: itemForm.date || todayStr,
        time: itemForm.time || currentTimeStr,
        notes: itemForm.notes.trim(),
      };
      setLastActionWhatsApp(actionData);

      if (sendWhatsApp) {
        sendDebtItemWhatsAppNotification({
          phone: debt.debtorPhone,
          storeName,
          debtorName: debt.debtorName,
          itemDescription: actionData.itemDescription,
          itemAmount: actionData.amount,
          remainingAmount: actionData.remainingAmount,
          date: actionData.date,
          time: actionData.time,
          notes: actionData.notes,
        });
      }

      showNotification('تمت إضافة حركة الدين بنجاح.');
      setItemForm({
        itemDescription: '',
        amount: '',
        date: todayStr,
        time: currentTimeStr,
        notes: '',
      });
      setShowAddItemForm(false);
      setActiveSubTab('items');
    } catch (err: any) {
      showNotification(err.message || 'فشلت إضافة حركة الدين.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. DELETE DEBT ITEM HANDLER
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('هل أنت متأكد من حذف حركة الشراء هذه من سجل المدين؟')) return;
    setIsSubmitting(true);
    try {
      const res = await api.deleteDebtItem(debt.id, itemId);
      onDebtUpdated(res.debt);
      showNotification('تم حذف حركة الشراء وتحديث الرصيد.');
    } catch (err: any) {
      showNotification(err.message || 'فشل حذف الحركة.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. RECORD PAYMENT HANDLER (WITH OPTIONAL INSTANT WHATSAPP SEND)
  const handleRecordPayment = async (e?: React.FormEvent, sendWhatsApp = false) => {
    if (e) e.preventDefault();
    const numAmount = Number(payForm.amount);
    if (!numAmount || numAmount <= 0) {
      showNotification('يرجى إدخال مبلغ سداد صحيح.', true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.payDebt(debt.id, {
        amount: numAmount,
        note: payForm.note.trim() || 'تسديد دفعة على الحساب',
        date: payForm.date || todayStr,
      });
      onDebtUpdated(res.debt);

      const actionData = {
        type: 'payment' as const,
        amount: numAmount,
        remainingAmount: res.debt.remainingAmount,
        date: payForm.date || todayStr,
        notes: payForm.note.trim() || 'تسديد دفعة على الحساب',
      };
      setLastActionWhatsApp(actionData);

      if (sendWhatsApp) {
        sendPaymentWhatsAppNotification({
          phone: debt.debtorPhone,
          storeName,
          debtorName: debt.debtorName,
          paymentAmount: actionData.amount,
          remainingAmount: actionData.remainingAmount,
          date: actionData.date,
          note: actionData.notes,
        });
      }

      showNotification('تم تسجيل دفعة السداد وتحديث الحساب.');
      setPayForm({
        amount: '',
        date: todayStr,
        note: '',
      });
      setShowPayForm(false);
      setActiveSubTab('payments');
    } catch (err: any) {
      showNotification(err.message || 'فشل تسجيل السداد.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. SETTLE IN FULL HANDLER
  const handleSettleFull = async (sendWhatsApp = false) => {
    setIsSubmitting(true);
    const amountPaid = debt.remainingAmount;
    try {
      const res = await api.settleDebtFull(debt.id, {
        note: 'تسوية الحساب بالكامل ✓',
      });
      onDebtUpdated(res.debt);

      if (sendWhatsApp) {
        sendPaymentWhatsAppNotification({
          phone: debt.debtorPhone,
          storeName,
          debtorName: debt.debtorName,
          paymentAmount: amountPaid,
          remainingAmount: 0,
          date: todayStr,
          note: 'تسوية الحساب بالكامل ✓',
        });
      }

      showNotification('تم تسوية حساب المدين بالكامل بنجاح!');
      setShowSettleConfirm(false);
      setActiveSubTab('payments');
    } catch (err: any) {
      showNotification(err.message || 'فشلت تسوية الحساب.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. DELETE ENTIRE DEBTOR
  const handleDeleteDebtor = async () => {
    if (!confirm(`هل أنت متأكد تماماً من حذف سجل المدين (${debt.debtorName}) وكافة حركاته نهائياً؟`)) return;
    try {
      await api.deleteDebt(debt.id);
      onDebtDeleted(debt.id);
    } catch (err: any) {
      alert(err.message || 'فشل حذف سجل المدين.');
    }
  };

  // 6. WHATSAPP STATEMENT SHARE
  const handleShareWhatsApp = () => {
    sendFullStatementWhatsAppNotification({
      phone: debt.debtorPhone,
      storeName,
      debtorName: debt.debtorName,
      totalPurchases: debt.amount,
      totalPaid: debt.paidAmount,
      remainingAmount: debt.remainingAmount,
      items: debt.items,
    });
  };

  // 7. PRINT / EXPORT PDF STATEMENT
  const handlePrintPdf = () => {
    console.log('[DebtorLedgerModal] handlePrintPdf triggered for:', debt.debtorName);
    try {
      setShowPrintModal(true);
    } catch (err) {
      console.error('[DebtorLedgerModal] Error opening print modal:', err);
      // Fallback
      printIndividualDebtStatement({
        storeName,
        storePhone,
        storeAddress,
        debt,
      });
    }
  };

  const itemsList = Array.isArray(debt.items) ? debt.items : [];
  const paymentsList = Array.isArray(debt.payments) ? debt.payments : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">{debt.debtorName}</h2>
                {debt.status === 'paid' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" /> مسدد بالكامل
                  </span>
                ) : debt.status === 'partially_paid' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                    مسدد جزئياً
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                    غير مسدد
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                {debt.debtorPhone ? (
                  <span className="flex items-center gap-1 font-mono text-slate-700" dir="ltr">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {debt.debtorPhone}
                  </span>
                ) : (
                  <span className="text-slate-400">لا يوجد رقم هاتف مسجل</span>
                )}
                <span>•</span>
                <span>سجل ديون ومشتريات تفصيلي</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs border border-slate-300"
              title="طباعة وتحميل كشف الحساب بصيغة PDF"
            >
              <Printer className="h-4 w-4 text-blue-600" />
              <span className="hidden sm:inline">طباعة كشف الحساب PDF</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition shadow-xs border border-emerald-200"
              title="مشاركة كشف الحساب عبر واتساب"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">إرسال كشف واتساب</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* NOTIFICATIONS & WHATSAPP QUICK ACTION BANNER */}
        {errorMessage && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-xs font-bold text-rose-700 border border-rose-200 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 border border-emerald-200 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>

            {lastActionWhatsApp && (
              <button
                type="button"
                onClick={() => {
                  if (lastActionWhatsApp.type === 'item') {
                    sendDebtItemWhatsAppNotification({
                      phone: debt.debtorPhone,
                      storeName,
                      debtorName: debt.debtorName,
                      itemDescription: lastActionWhatsApp.itemDescription || 'مشتريات جديدة',
                      itemAmount: lastActionWhatsApp.amount,
                      remainingAmount: lastActionWhatsApp.remainingAmount,
                      date: lastActionWhatsApp.date,
                      time: lastActionWhatsApp.time,
                      notes: lastActionWhatsApp.notes,
                    });
                  } else {
                    sendPaymentWhatsAppNotification({
                      phone: debt.debtorPhone,
                      storeName,
                      debtorName: debt.debtorName,
                      paymentAmount: lastActionWhatsApp.amount,
                      remainingAmount: lastActionWhatsApp.remainingAmount,
                      date: lastActionWhatsApp.date,
                      note: lastActionWhatsApp.notes,
                    });
                  }
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs active:scale-95"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>إرسال إشعار واتساب للزبون ({debt.debtorName})</span>
              </button>
            )}
          </div>
        )}

        {/* BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* FINANCIAL SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <span className="text-[11px] font-bold text-slate-500 block mb-1">إجمالي المشتريات المسجلة</span>
              <p className="text-xl font-black text-slate-900">
                {debt.amount.toLocaleString('ar-IQ')} <span className="text-xs font-semibold text-slate-500">د.ع</span>
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">{itemsList.length} حركة مشتريات</span>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
              <span className="text-[11px] font-bold text-emerald-700 block mb-1">إجمالي المبالغ المسددة</span>
              <p className="text-xl font-black text-emerald-700">
                {debt.paidAmount.toLocaleString('ar-IQ')} <span className="text-xs font-semibold text-emerald-600">د.ع</span>
              </p>
              <span className="text-[10px] text-emerald-600/80 mt-1 block">{paymentsList.length} دفعات تسديد</span>
            </div>

            <div className={`rounded-2xl border p-4 shadow-xs ${
              debt.remainingAmount > 0 
                ? 'border-rose-300 bg-rose-50/70' 
                : 'border-emerald-300 bg-emerald-50/70'
            }`}>
              <span className={`text-[11px] font-bold block mb-1 ${
                debt.remainingAmount > 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}>
                المبلغ المتبقي الصافي المطلوب
              </span>
              <p className={`text-2xl font-black ${
                debt.remainingAmount > 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}>
                {debt.remainingAmount.toLocaleString('ar-IQ')} <span className="text-xs font-semibold">د.ع</span>
              </p>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {debt.remainingAmount === 0 ? 'الحساب خالص ومسدد ✓' : 'مستحق الدفع من الزبون'}
              </span>
            </div>
          </div>

          {/* ACTION BUTTONS TOOLBAR */}
          <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-2xl bg-slate-100/70 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setShowAddItemForm(true);
                setShowPayForm(false);
                setShowSettleConfirm(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة حركة دين جديدة</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowPayForm(true);
                setShowAddItemForm(false);
                setShowSettleConfirm(false);
                setPayForm({
                  amount: debt.remainingAmount > 0 ? String(debt.remainingAmount) : '',
                  date: todayStr,
                  note: '',
                });
              }}
              disabled={debt.remainingAmount <= 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCard className="h-4 w-4" />
              <span>تسجيل دفعة / سداد</span>
            </button>

            {debt.remainingAmount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowSettleConfirm(true);
                  setShowAddItemForm(false);
                  setShowPayForm(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-700 transition shadow-xs"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>تسوية الحساب بالكامل</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-200/80 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-300 transition"
              title="طباعة وتحميل الكشف بصيغة PDF"
            >
              <Printer className="h-4 w-4 text-slate-700" />
              <span>طباعة كشف الحساب</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteDebtor}
              className="mr-auto inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
              title="حذف حساب المدين"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">حذف السجل</span>
            </button>
          </div>

          {/* 1. INLINE FORM: ADD ITEM */}
          {showAddItemForm && (
            <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/40 p-4 sm:p-5 shadow-xs animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-blue-600" />
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    إضافة حركة دين جديدة للمدين ({debt.debtorName})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddItemForm(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 text-xs"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      بيان المادة / تفاصيل المشتريات <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={itemForm.itemDescription}
                      onChange={(e) => setItemForm({ ...itemForm, itemDescription: e.target.value })}
                      placeholder="مثلاً: كارتون شاي، مسواك مخضر، بيبسي 1.25 لتر..."
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      المبلغ (دينار عراقي) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={250}
                      step={250}
                      value={itemForm.amount}
                      onChange={(e) => setItemForm({ ...itemForm, amount: e.target.value })}
                      placeholder="مثال: 15000"
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      التاريخ والوقت (تلقائي)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={itemForm.date}
                        onChange={(e) => setItemForm({ ...itemForm, date: e.target.value })}
                        className="rounded-xl border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                      />
                      <input
                        type="time"
                        value={itemForm.time}
                        onChange={(e) => setItemForm({ ...itemForm, time: e.target.value })}
                        className="rounded-xl border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ملاحظات إضافية (اختياري)
                    </label>
                    <input
                      type="text"
                      value={itemForm.notes}
                      onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                      placeholder="مثال: استلمه ابنه كرار، طلب خاص، موعد الراتب..."
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddItemForm(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={(e) => handleAddItem(e, false)}
                    className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-900 transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ فقط'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={(e) => handleAddItem(e, true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50 shadow-xs"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ وإرسال إشعار واتساب للزبون'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 2. INLINE FORM: RECORD PAYMENT */}
          {showPayForm && (
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 p-4 sm:p-5 shadow-xs animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    تسجيل دفعة / سداد للمدين ({debt.debtorName})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPayForm(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 text-xs"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={(e) => handleRecordPayment(e, false)} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      المبلغ المسدد الآن (د.ع) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={250}
                      max={debt.remainingAmount}
                      value={payForm.amount}
                      onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                      placeholder={`أقصى حد: ${debt.remainingAmount.toLocaleString('ar-IQ')} د.ع`}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ السداد</label>
                    <input
                      type="date"
                      value={payForm.date}
                      onChange={(e) => setPayForm({ ...payForm, date: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">بيان أو ملاحظة السداد</label>
                    <input
                      type="text"
                      value={payForm.note}
                      onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
                      placeholder="مثال: دفعة نقدية مع الراتب، تحويل زين كاش، تسديد يدوي..."
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPayForm(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={(e) => handleRecordPayment(e, false)}
                    className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-900 transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'جاري التسجيل...' : 'تسجيل فقط'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={(e) => handleRecordPayment(e, true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50 shadow-xs"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>{isSubmitting ? 'جاري التسجيل...' : 'تسجيل وإرسال إشعار سداد واتساب'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3. SETTLE IN FULL CONFIRMATION */}
          {showSettleConfirm && (
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 sm:p-5 shadow-xs animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-black text-amber-900 mb-1">تأكيد تسوية الحساب بالكامل</h3>
                  <p className="text-xs text-amber-800 leading-relaxed mb-3">
                    سيتم تسجيل سداد للمبلغ المتبقي بالكامل وقدره <strong className="font-black underline">{debt.remainingAmount.toLocaleString('ar-IQ')} د.ع</strong> وتحويل حالة الحساب إلى «مسدد بالكامل».
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSettleFull(false)}
                      disabled={isSubmitting}
                      className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-900 transition disabled:opacity-50"
                    >
                      {isSubmitting ? 'جاري التسوية...' : 'تسوية بدون إشعار'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSettleFull(true)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50 shadow-xs"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>تسوية وإرسال إشعار واتساب للزبون</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSettleConfirm(false)}
                      className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100"
                    >
                      تراجع
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TABS: ITEMS TABLE vs PAYMENTS TABLE */}
          <div className="border-b border-slate-200 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveSubTab('items')}
              className={`pb-2.5 text-xs font-bold transition relative ${
                activeSubTab === 'items'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              جدول المشتريات والمواد التفصيلي ({itemsList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('payments')}
              className={`pb-2.5 text-xs font-bold transition relative ${
                activeSubTab === 'payments'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              سجل الدفعات والتسديدات ({paymentsList.length})
            </button>
          </div>

          {/* SUB-TAB 1: ITEMIZED PURCHASES TABLE */}
          {activeSubTab === 'items' && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              {itemsList.length === 0 ? (
                <div className="py-12 text-center">
                  <ShoppingBag className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">لا توجد حركات مشتريات مسجلة بعد لهذا المدين.</p>
                  <p className="text-[11px] text-slate-400 mt-1">اضغط على زر «إضافة حركة دين جديدة» لإضافة مواد وقوائم.</p>
                  <button
                    type="button"
                    onClick={() => setShowAddItemForm(true)}
                    className="mt-3 inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    <Plus className="h-3.5 w-3.5" /> إضافة مادة الآن
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-10 text-center">#</th>
                        <th className="p-3">بيان المادة / التفاصيل</th>
                        <th className="p-3">التاريخ والوقت</th>
                        <th className="p-3">المبلغ (د.ع)</th>
                        <th className="p-3">ملاحظات إضافية</th>
                        <th className="p-3 text-center w-28">إشعار / إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {itemsList.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/70 transition">
                          <td className="p-3 text-center text-slate-400 text-[11px]">{idx + 1}</td>
                          <td className="p-3 font-bold text-slate-900">
                            {item.itemDescription}
                          </td>
                          <td className="p-3 text-slate-500 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              <span>{item.date || '—'}</span>
                              {item.time && (
                                <>
                                  <Clock className="h-3 w-3 text-slate-400 mr-1" />
                                  <span>{item.time}</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-black text-blue-700 whitespace-nowrap">
                            {item.amount.toLocaleString('ar-IQ')} د.ع
                          </td>
                          <td className="p-3 text-slate-500 text-[11px]">
                            {item.notes || '—'}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => sendDebtItemWhatsAppNotification({
                                  phone: debt.debtorPhone,
                                  storeName,
                                  debtorName: debt.debtorName,
                                  itemDescription: item.itemDescription,
                                  itemAmount: item.amount,
                                  remainingAmount: debt.remainingAmount,
                                  date: item.date,
                                  time: item.time,
                                  notes: item.notes,
                                })}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition border border-emerald-200"
                                title="إرسال إشعار بهذه الحركة عبر واتساب للزبون"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">إشعار</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="حذف حركة الشراء"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50/90 font-black text-slate-900 border-t border-slate-200">
                      <tr>
                        <td colSpan={3} className="p-3 text-left pl-4 font-bold text-slate-600">
                          إجمالي مبالغ المشتريات:
                        </td>
                        <td className="p-3 text-blue-700 text-sm font-black whitespace-nowrap">
                          {debt.amount.toLocaleString('ar-IQ')} د.ع
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 2: PAYMENTS HISTORY TABLE */}
          {activeSubTab === 'payments' && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              {paymentsList.length === 0 ? (
                <div className="py-12 text-center">
                  <Receipt className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">لا توجد دفعات تسديد مسجلة بعد لهذا المدين.</p>
                  <p className="text-[11px] text-slate-400 mt-1">عند تسديد أي مبلغ أو جزء من الدين، يمكنك تسجيله هنا.</p>
                  {debt.remainingAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowPayForm(true)}
                      className="mt-3 inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <CreditCard className="h-3.5 w-3.5" /> تسجيل دفعة سداد
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-10 text-center">#</th>
                        <th className="p-3">المبلغ المسدد (د.ع)</th>
                        <th className="p-3">تاريخ الدفعة</th>
                        <th className="p-3">البيان / ملاحظات السداد</th>
                        <th className="p-3 text-center w-28">إشعار السداد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {paymentsList.map((pay, idx) => (
                        <tr key={pay.id || idx} className="hover:bg-slate-50/70 transition">
                          <td className="p-3 text-center text-slate-400 text-[11px]">{idx + 1}</td>
                          <td className="p-3 font-black text-emerald-700 whitespace-nowrap">
                            +{pay.amount.toLocaleString('ar-IQ')} د.ع
                          </td>
                          <td className="p-3 text-slate-600 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-[11px]">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              <span>{pay.date || '—'}</span>
                            </div>
                          </td>
                          <td className="p-3 font-bold text-slate-800">
                            {pay.note || 'تسديد دفعة على الحساب'}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => sendPaymentWhatsAppNotification({
                                phone: debt.debtorPhone,
                                storeName,
                                debtorName: debt.debtorName,
                                paymentAmount: pay.amount,
                                remainingAmount: debt.remainingAmount,
                                date: pay.date,
                                note: pay.note,
                              })}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition border border-emerald-200"
                              title="إرسال وصل سداد للزبون عبر واتساب"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span>وصل واتساب</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50/90 font-black text-slate-900 border-t border-slate-200">
                      <tr>
                        <td className="p-3 text-center"></td>
                        <td className="p-3 text-emerald-700 text-sm font-black whitespace-nowrap">
                          {debt.paidAmount.toLocaleString('ar-IQ')} د.ع
                        </td>
                        <td colSpan={3} className="p-3 text-slate-600 text-xs font-bold">
                          إجمالي المبالغ المسددة
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3.5">
          <span className="text-xs text-slate-500">
            آخر تحديث للحساب: {debt.updatedAt ? new Date(debt.updatedAt).toLocaleDateString('ar-IQ') : 'اليوم'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            إغلاق كشف الحساب
          </button>
        </div>

      </div>

      {/* PRINT / PDF PREVIEW MODAL */}
      {showPrintModal && (
        <PrintReportModal
          title={`كشف حساب الزبون: ${debt.debtorName}`}
          filename={`كشف_حساب_${debt.debtorName}_${storeName}`}
          htmlContent={generateIndividualStatementHtml({
            storeName,
            storePhone,
            storeAddress,
            debt,
          })}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
