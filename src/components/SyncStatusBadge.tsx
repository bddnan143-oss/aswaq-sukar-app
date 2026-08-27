import React, { useState, useEffect, useRef } from 'react';
import { Database, Download, Upload, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, HardDrive } from 'lucide-react';
import { syncService, SyncStatus } from '../services/localStorageSync';

interface SyncStatusBadgeProps {
  compact?: boolean;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ compact = false }) => {
  const [status, setStatus] = useState<SyncStatus>(syncService.getStatus());
  const [showModal, setShowModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = syncService.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    const res = await syncService.syncWithServer();
    if (res.success) {
      setFeedbackMsg({ text: 'تمت المزامنة وحفظ جميع البيانات في الذاكرة المحلية بنجاح!', type: 'success' });
    } else {
      setFeedbackMsg({ text: res.message, type: 'error' });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleExportBackup = () => {
    syncService.exportToJsonFile();
    setFeedbackMsg({ text: 'تم تصدير ملف النسخة الاحتياطية بنجاح.', type: 'success' });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await syncService.importFromJsonFile(file);
    if (res.success) {
      setFeedbackMsg({ text: res.message, type: 'success' });
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } else {
      setFeedbackMsg({ text: res.message, type: 'error' });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return 'الآن';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'الآن';
    }
  };

  if (compact) {
    return (
      <button
        id="btn-sync-status-compact"
        type="button"
        onClick={() => setShowModal(true)}
        title="حالة الحفظ التلقائي في الذاكرة المحلية"
        className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1 text-xs font-bold text-emerald-800 transition-all hover:bg-emerald-100 shadow-xs"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
        </span>
        <HardDrive className="h-3.5 w-3.5 text-emerald-700" />
        <span className="hidden sm:inline">محفوظ تلقائياً</span>
      </button>
    );
  }

  return (
    <>
      <div 
        id="container-sync-banner"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-slate-50 p-3.5 shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900">الحفظ التلقائي في الذاكرة المحلية (localStorage) مفعّل</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                آمن ودائم
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              جميع الحسابات، المتاجر، المنتجات، الديون، وفواتير المبيعات محفوظة تلقائياً في المتصفح. (آخر حفظ: {formatTime(status.lastSavedAt)})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-trigger-manual-sync"
            type="button"
            onClick={handleManualSync}
            disabled={status.isSaving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-emerald-600 ${status.isSaving ? 'animate-spin' : ''}`} />
            <span>{status.isSaving ? 'جاري الحفظ...' : 'حفظ فوري الآن'}</span>
          </button>

          <button
            id="btn-open-sync-details"
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
          >
            <Database className="h-3.5 w-3.5" />
            <span>إدارة النسخ الاحتياطي</span>
          </button>
        </div>
      </div>

      {/* SYNC & BACKUP MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">نظام الحفظ التلقائي والنسخ الاحتياطي</h3>
                  <p className="text-xs text-slate-500">حماية كاملة ضد مسح البيانات عند إغلاق المتصفح أو التحديث</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {feedbackMsg && (
              <div
                className={`mb-4 rounded-xl p-3 text-xs font-bold ${
                  feedbackMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {feedbackMsg.text}
              </div>
            )}

            {/* Counts Grid */}
            <div className="mb-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2.5">
                <span className="block text-lg font-black text-emerald-700">{status.itemCounts.stores}</span>
                <span className="text-[11px] font-bold text-slate-600">متاجر محفوظة</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2.5">
                <span className="block text-lg font-black text-emerald-700">{status.itemCounts.products}</span>
                <span className="text-[11px] font-bold text-slate-600">منتجات بالمخزن</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2.5">
                <span className="block text-lg font-black text-emerald-700">{status.itemCounts.debts}</span>
                <span className="text-[11px] font-bold text-slate-600">سجلات ديون</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2.5">
                <span className="block text-lg font-black text-emerald-700">{status.itemCounts.sales}</span>
                <span className="text-[11px] font-bold text-slate-600">فواتير مبيعات كاش</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2.5">
                <span className="block text-lg font-black text-emerald-700">{status.itemCounts.orders}</span>
                <span className="text-[11px] font-bold text-slate-600">طلبات زبائن</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2.5">
                <span className="block text-lg font-black text-emerald-700">{status.itemCounts.users}</span>
                <span className="text-[11px] font-bold text-slate-600">حسابات مستخدمين</span>
              </div>
            </div>

            {/* How it works info */}
            <div className="mb-5 rounded-2xl bg-emerald-50/70 p-3.5 border border-emerald-100 text-xs text-emerald-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                <span>كيف يعمل الحفظ التلقائي؟</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-800">
                1. يتم حفظ كل حركة جديدة (إضافة منتج، تسجيل دين، إصدار فاتورة بيع، تسجيل حساب) فوراً في ذاكرة المتصفح <strong className="font-bold">localStorage</strong>.
                <br />
                2. عند إعادة فتح أو تحديث المتصفح، يقوم التطبيق باسترجاع كافة البيانات والحسابات المسجلة تلقائياً بدون فقدان أي تفاصيل.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={status.isSaving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${status.isSaving ? 'animate-spin' : ''}`} />
                  <span>تحديث وحفظ الذاكرة الآن</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50"
                >
                  <Download className="h-4 w-4 text-slate-600" />
                  <span>تنزيل ملف JSON</span>
                </button>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  <Upload className="h-4 w-4 text-slate-500" />
                  <span>استيراد واستعادة من ملف نسخة احتياطية (.json)</span>
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
