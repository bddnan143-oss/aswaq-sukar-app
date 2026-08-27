import React, { useState } from 'react';
import { Download, FileCode, CheckCircle2, FolderArchive, Terminal, Smartphone, Laptop, Sparkles, X, ShieldCheck } from 'lucide-react';

interface DownloadSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadSourceModal: React.FC<DownloadSourceModalProps> = ({ isOpen, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      const link = document.createElement('a');
      link.href = '/api/download-source-zip';
      link.setAttribute('download', `aswaq-qalat-sukkar-source-${new Date().toISOString().slice(0, 10)}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        setIsDownloading(false);
        setDownloadSuccess(true);
      }, 1200);
    } catch (error) {
      console.error('Download failed:', error);
      setIsDownloading(false);
      window.open('/api/download-source-zip', '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-6 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md">
              <FolderArchive className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">تنزيل الكود المصدري للمشروع (ZIP)</h3>
                <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black text-emerald-800">
                  مباشر ومجاني
                </span>
              </div>
              <p className="text-xs text-slate-500">تحميل مجلد المشروع كاملاً كملف مضغوط فوراً على جهازك</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success Message */}
        {downloadSuccess && (
          <div className="mb-4 rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-emerald-900 animate-in fade-in">
            <div className="flex items-center gap-2 font-black text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>بدأ تنزيل ملف المشروع المضغوط (.zip) بنجاح!</span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">
              تم إرسال الملف إلى قائمة التنزيلات في هاتفك أو متصفحك. يمكنك فك الضغط وتشغيله محلياً.
            </p>
          </div>
        )}

        {/* What's Included */}
        <div className="space-y-3 mb-5">
          <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            محتويات ملف الـ ZIP المصدري:
          </h4>
          
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <FileCode className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <strong className="block text-slate-900 font-bold">كود React 19 كامل</strong>
                <span className="text-slate-500 text-[10px]">مجلد /src مع كل الشاشات</span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <Terminal className="h-4 w-4 text-teal-600 shrink-0" />
              <div>
                <strong className="block text-slate-900 font-bold">خادم Express كامل</strong>
                <span className="text-slate-500 text-[10px]">خادم Backend مع APIs</span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <Smartphone className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <strong className="block text-slate-900 font-bold">ملفات PWA جاهزة</strong>
                <span className="text-slate-500 text-[10px]">Manifest + Service Worker</span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" />
              <div>
                <strong className="block text-slate-900 font-bold">دليل التشغيل (README)</strong>
                <span className="text-slate-500 text-[10px]">أوامر التثبيت والتشغيل</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Instructions */}
        <div className="mb-5 rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80 text-xs text-slate-700 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <Laptop className="h-4 w-4 text-emerald-600" />
            <span>كيفية تشغيل المشروع بعد التنزيل:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 font-medium">
            <li>فك ضغط ملف <strong className="text-slate-900">aswaq-qalat-sukkar-source.zip</strong>.</li>
            <li>افتح المجلد ونفذ أمر: <code className="bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-900 font-mono text-[10px]">npm install</code> لتثبيت الحزم.</li>
            <li>شغل المشروع بأمر: <code className="bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-900 font-mono text-[10px]">npm run dev</code>.</li>
            <li>افتح المتصفح على <code className="bg-emerald-100/70 px-1.5 py-0.5 rounded text-emerald-900 font-mono text-[10px]">http://localhost:3000</code>.</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <a
            id="btn-download-standalone-single-file"
            href="/standalone.html"
            download="index.html"
            className="flex items-center justify-center gap-2.5 w-full rounded-2xl bg-amber-500 hover:bg-amber-600 py-3.5 text-xs font-black text-slate-950 shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
            title="ملف index.html واحد فقط مستقل يعمل مباشرة في أي متصفح دون أي خادم"
          >
            <FileCode className="h-4 w-4 text-slate-950" />
            <span>تنزيل ملف الواجهة المستقل الكامل (index.html Standalone)</span>
          </a>

          <button
            id="btn-download-project-zip-modal"
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center justify-center gap-2.5 w-full rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 py-3 text-xs font-black text-white shadow-md hover:from-emerald-700 hover:to-teal-800 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <Download className={`h-4 w-4 ${isDownloading ? 'animate-bounce' : ''}`} />
            <span>{isDownloading ? 'جاري ضغط الملفات وتجهيز التنزيل...' : 'تنزيل المشروع كاملاً بمجلداته (ZIP Archive)'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
