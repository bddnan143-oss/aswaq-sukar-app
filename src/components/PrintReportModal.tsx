import React, { useEffect } from 'react';
import { Printer, Download, X, FileText, CheckCircle2, MessageCircle } from 'lucide-react';
import { BASE_PRINT_CSS, triggerDirectPrint, downloadHtmlDocument } from '../utils/printPdf';

interface PrintReportModalProps {
  title: string;
  filename: string;
  htmlContent: string;
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  title,
  filename,
  htmlContent,
  onClose,
}) => {
  // Try auto-printing on mount for quick response
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerDirectPrint(htmlContent, filename);
    }, 150);
    return () => clearTimeout(timer);
  }, [htmlContent, filename]);

  const handlePrint = () => {
    triggerDirectPrint(htmlContent, filename);
  };

  const handleDownload = () => {
    downloadHtmlDocument(htmlContent, filename);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex h-full max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Top Header / Action Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black">{title}</h2>
              <p className="text-[11px] text-slate-300">جاهز للطباعة والحفظ كملف PDF</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition shadow-xs active:scale-95"
            >
              <Printer className="h-4 w-4" />
              <span>طباعة / حفظ PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition active:scale-95"
              title="تنزيل ملف HTML جاهز للطباعة"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">تنزيل مستند</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title="إغلاق"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Informational Notification on Mobile */}
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 text-xs font-semibold text-blue-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
            <span>للحفظ كـ PDF على الهاتف: اختر «طباعة» ثم حدد خيار «حفظ بتنسيق PDF» أو اضغط على «تنزيل مستند».</span>
          </div>
        </div>

        {/* Scrollable Document Preview Body */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-3 sm:p-6">
          <div className="mx-auto max-w-[820px] rounded-2xl bg-white shadow-md border border-slate-200 overflow-hidden">
            <style>{BASE_PRINT_CSS}</style>
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </div>
        </div>

        {/* Bottom Floating Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3">
          <span className="text-xs font-bold text-slate-500">منصة أسواق قلعة سكر • نظام الديون</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              تنزيل ملف التقرير
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs"
            >
              طباعة / حفظ PDF الآن
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
