import React, { useState } from 'react';
import { KeyRound, X, Mail, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onBackToLogin,
}) => {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.requestPasswordReset(email.trim());
      setToken(res.resetToken);
      setSuccessMessage(`تم إنشاء رمز التحقق بنجاح لحسابك (${res.email}). يرجى إدخال كلمة المرور الجديدة أدناه.`);
      setStep('reset');
    } catch (err: any) {
      setErrorMessage(err.message || 'تعذر إرسال طلب استعادة كلمة المرور.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setErrorMessage('كلمتا المرور غير متطابقتين.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('كلمة المرور يجب ألا تقل عن 6 أحرف/أرقام.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.resetPassword({ token, newPassword });
      setSuccessMessage(res.message);
      setTimeout(() => {
        onBackToLogin();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء إعادة تعيين كلمة المرور.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl transition-all border border-slate-100"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <KeyRound className="h-5 w-5" />
            </span>
            <h3 className="text-base font-bold text-slate-900">استعادة كلمة المرور</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequestToken} className="mt-4 space-y-4">
            <p className="text-xs leading-relaxed text-slate-600">
              أدخل بريدك الإلكتروني المسجل في منصة «أسواق قلعة سكر» (سواء كنت زبوناً، صاحب متجر، أو مديراً للمنصة) لإرسال رابط آمن واستعادة حسابك.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@store.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pr-10 pl-3 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-hidden transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition disabled:opacity-60"
            >
              {isLoading ? 'جاري التحقق...' : 'إرسال طلب الاستعادة'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onBackToLogin}
                className="text-xs font-semibold text-slate-600 hover:text-emerald-700 transition inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3 rotate-180" />
                <span>الرجوع إلى شاشة تسجيل الدخول</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
            <div className="rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-600 border border-slate-200">
              <span className="font-bold text-slate-800">رمز الأمان: </span>
              <span className="font-mono text-emerald-700 font-bold">{token}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور الجديدة</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-hidden transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">تأكيد كلمة المرور الجديدة</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-hidden transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{isLoading ? 'جاري الحفظ...' : 'حفظ كلمة المرور الجديدة والدخول'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
