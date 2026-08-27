import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle2, X, Share, PlusSquare, Sparkles, ArrowDown, ShieldCheck, Zap } from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';

interface InstallPwaPromptProps {
  mode?: 'banner' | 'modal' | 'button' | 'card';
  className?: string;
}

export const InstallPwaPrompt: React.FC<InstallPwaPromptProps> = ({ mode = 'banner', className = '' }) => {
  const {
    canInstall,
    hasNativePrompt,
    isInstalled,
    isIos,
    installSuccess,
    promptInstall,
    dismissPrompt,
  } = usePwaInstall();

  const [showIosModal, setShowIosModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstallClick = async () => {
    if (isIos && !hasNativePrompt) {
      setShowIosModal(true);
      return;
    }

    if (hasNativePrompt) {
      setIsInstalling(true);
      const success = await promptInstall();
      setIsInstalling(false);
      if (!success && isIos) {
        setShowIosModal(true);
      }
    } else if (isIos) {
      setShowIosModal(true);
    }
  };

  // Compact Header / Navbar Button
  if (mode === 'button') {
    if (isInstalled) return null;

    return (
      <>
        <button
          id="btn-install-pwa-nav"
          type="button"
          onClick={handleInstallClick}
          className={`relative inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 text-xs font-black text-white shadow-sm hover:from-emerald-700 hover:to-teal-700 transition-all hover:scale-105 active:scale-95 ${className}`}
          title="تثبيت التطبيق على الشاشة الرئيسية للهاتف"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-80"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400"></span>
          </span>
          <Download className="h-3.5 w-3.5" />
          <span>تثبيت التطبيق</span>
        </button>

        {/* iOS Modal Guide */}
        {showIosModal && (
          <IosInstallGuideModal onClose={() => setShowIosModal(false)} />
        )}
      </>
    );
  }

  // Standalone Card Section (e.g. For Homepage or Dashboard)
  if (mode === 'card') {
    if (isInstalled) {
      return (
        <div className="flex items-center justify-between rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-emerald-950">التطبيق مثبت على جهازك</h4>
              <p className="text-xs text-emerald-700">أنت تستخدم تطبيق «أسواق قلعة سكر» المثبت مباشرة بكامل مميزاته وسرعته.</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            تطبيق PWA نشط
          </span>
        </div>
      );
    }

    return (
      <>
        <div className={`relative overflow-hidden rounded-3xl border border-emerald-200/90 bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 p-6 text-white shadow-xl ${className}`}>
          {/* Background Decorative Rings */}
          <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-emerald-500/20 blur-2xl"></div>
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-amber-500/20 blur-2xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white p-2 text-emerald-700 shadow-md">
                <img src="/icons/icon.svg" alt="أيقونة التطبيق" className="h-full w-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-400/20 px-2 py-0.5 text-[11px] font-black text-amber-300 border border-amber-400/30">
                    <Sparkles className="h-3 w-3" />
                    تطبيق PWA سريع وخفيف
                  </span>
                </div>
                <h3 className="mt-1 text-lg font-black text-white">تثبيت تطبيق «أسواق قلعة سكر» على هاتفك</h3>
                <p className="mt-1 text-xs text-emerald-100/90 leading-relaxed max-w-xl">
                  ثبّت التطبيق بنقرة واحدة على الشاشة الرئيسية للوصول السريع للمتاجر، كاشير المبيعات، ومتابعة سجل الديون حتى بدون إنترنت!
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-emerald-200">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    حجم فائق الخفة (بدون استهلاك للذاكرة)
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                    يعمل بدون متجر تطبيقات
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <button
                id="btn-install-pwa-card"
                type="button"
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3.5 text-sm font-black text-slate-950 shadow-lg hover:from-amber-300 hover:to-amber-400 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>{isInstalling ? 'جاري التثبيت...' : 'تثبيت التطبيق الآن'}</span>
              </button>
            </div>
          </div>
        </div>

        {showIosModal && (
          <IosInstallGuideModal onClose={() => setShowIosModal(false)} />
        )}
      </>
    );
  }

  // Floating Bottom Banner / Toast Prompt
  if (!canInstall || isInstalled) {
    if (installSuccess) {
      return (
        <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between rounded-2xl bg-emerald-700 p-4 text-white shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-black">تهانينا! تم تثبيت التطبيق بنجاح</p>
                <p className="text-[11px] text-emerald-100">
                  يمكنك الآن فتح التطبيق مباشرة من شاشة هاتفك الرئيسية.
                </p>
              </div>
            </div>
            <button
              onClick={() => dismissPrompt()}
              className="rounded-lg p-1 text-emerald-200 hover:bg-emerald-600 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {/* Floating Bottom App Installation Bar */}
      <div 
        id="banner-pwa-install-prompt"
        className="fixed bottom-16 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in fade-in slide-in-from-bottom-6 duration-300"
      >
        <div className="overflow-hidden rounded-3xl border border-emerald-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 p-2 shadow-xs">
                <img src="/icons/icon.svg" alt="أيقونة التطبيق" className="h-full w-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-black text-slate-900">تطبيق «أسواق قلعة سكر»</h4>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-bold text-emerald-800">
                    PWA مجاني
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">
                  ثبّت التطبيق على الشاشة الرئيسية للوصول الفوري وتصفح المتاجر.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={dismissPrompt}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="إغلاق التنبيه"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              id="btn-install-pwa-banner"
              type="button"
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs font-black text-white shadow-sm hover:from-emerald-700 hover:to-teal-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>{isInstalling ? 'جاري التثبيت...' : 'تثبيت على الهاتف الآن'}</span>
            </button>

            <button
              type="button"
              onClick={dismissPrompt}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              لاحقاً
            </button>
          </div>
        </div>
      </div>

      {/* iOS Modal Guide */}
      {showIosModal && (
        <IosInstallGuideModal onClose={() => setShowIosModal(false)} />
      )}
    </>
  );
};

// Modal specifically guiding iPhone/iPad Safari users to Add to Home Screen
interface IosModalProps {
  onClose: () => void;
}

const IosInstallGuideModal: React.FC<IosModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-8 duration-300">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">تثبيت التطبيق على iPhone / iPad</h3>
              <p className="text-xs text-slate-500">طريقة الإضافة المباشرة إلى الشاشة الرئيسية</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs text-slate-700">
          <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">
              1
            </div>
            <div>
              <p className="font-black text-slate-900">اضغط على زر المشاركة (Share)</p>
              <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                الموجود في الشريط السفلي لمتصفح سفاري <Share className="inline h-3.5 w-3.5 text-emerald-600" />.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">
              2
            </div>
            <div>
              <p className="font-black text-slate-900">اختر «إضافة إلى الشاشة الرئيسية»</p>
              <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                مرر القائمة لأسفل واختر <PlusSquare className="inline h-3.5 w-3.5 text-emerald-600" /> Add to Home Screen.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">
              3
            </div>
            <div>
              <p className="font-black text-slate-900">اضغط على «إضافة» (Add)</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                في الزاوية العلوية، وسيظهر التطبيق فوراً على شاشة هاتفك مثل التطبيقات الأصلية!
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-black text-white hover:bg-emerald-700 shadow-sm"
          >
            حسناً، فهمت
          </button>
        </div>
      </div>
    </div>
  );
};
