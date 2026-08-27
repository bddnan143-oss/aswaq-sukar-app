import React, { useState } from 'react';
import { 
  X, 
  User, 
  Store, 
  Shield, 
  Lock, 
  Mail, 
  Phone, 
  Key, 
  MapPin, 
  Tag, 
  AlertCircle, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'customer' | 'owner' | 'admin_setup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
}) => {
  const { login, registerCustomer, registerStoreOwner, setupInitialSuperAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'customer' | 'owner' | 'admin_setup'>(initialTab);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [isSuperAdminInitialized, setIsSuperAdminInitialized] = useState<boolean | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState('مواد غذائية وماركت');
  const [address, setAddress] = useState('');
  const [activationCode, setActivationCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check admin status when modal opens
  React.useEffect(() => {
    if (isOpen) {
      api.getAdminStatus()
        .then((res) => {
          setIsSuperAdminInitialized(res.isSuperAdminInitialized);
        })
        .catch(() => {
          setIsSuperAdminInitialized(true);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login(email.trim(), password);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل تسجيل الدخول. يرجى التحقق من البيانات.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage('كلمة المرور وتأكيدها غير متطابقين.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('يجب أن لا تقل كلمة المرور عن 6 أحرف/أرقام.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await setupInitialSuperAdmin({
        name: name.trim() || 'المدير الرئيسي للمنصة',
        phone: phone.trim() || '07801234567',
        email: email.trim().toLowerCase(),
        password,
      });
      setIsSuperAdminInitialized(true);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'تعذر إعداد حساب المدير الرئيسي.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await registerCustomer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'تعذر إنشاء حساب الزبون.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterStoreOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await registerStoreOwner({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        storeName: storeName.trim(),
        category,
        address: address.trim(),
        activationCode: activationCode.trim().toUpperCase(),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'تعذر إنشاء حساب المتجر. تحقق من رمز التفعيل.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showForgotModal) {
    return (
      <ForgotPasswordModal
        isOpen={true}
        onClose={onClose}
        onBackToLogin={() => setShowForgotModal(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all border border-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Title & Close button */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {activeTab === 'login' && 'تسجيل الدخول إلى المنصة'}
              {activeTab === 'customer' && 'إنشاء حساب زبون جديد'}
              {activeTab === 'owner' && 'تسجيل وتفعيل متجر جديد'}
              {activeTab === 'admin_setup' && (isSuperAdminInitialized === false ? '👑 إعداد حساب المدير الرئيسي' : '👑 بوابة المدير الرئيسي')}
            </h2>
            <p className="text-[11px] text-slate-500">منصة وسوق قلعة سكر الموحد</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-slate-100/80 border-b border-slate-200/60 text-center">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMessage(null); }}
            className={`rounded-xl py-2 text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1 ${
              activeTab === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>دخول</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('customer'); setErrorMessage(null); }}
            className={`rounded-xl py-2 text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1 ${
              activeTab === 'customer'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>👤 زبون</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('owner'); setErrorMessage(null); }}
            className={`rounded-xl py-2 text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1 ${
              activeTab === 'owner'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="h-3.5 w-3.5" />
            <span>🏪 متجر</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('admin_setup'); setErrorMessage(null); }}
            className={`rounded-xl py-2 text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1 ${
              activeTab === 'admin_setup'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-800 hover:text-amber-950 bg-amber-100/60 hover:bg-amber-100'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            <span>👑 المدير</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl bg-rose-50 p-3.5 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 0. FIRST TIME SUPER ADMIN SETUP */}
          {activeTab === 'admin_setup' && isSuperAdminInitialized === false && (
            <form onSubmit={handleSetupAdmin} className="space-y-3.5">
              <div className="rounded-2xl bg-amber-50 p-3.5 text-xs text-amber-900 border border-amber-200">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-950">
                  <Key className="h-4 w-4 text-amber-600" />
                  <span>إعداد وتعيين حساب المدير الرئيسي (Super Admin)</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  قم بتعيين بيانات الدخول الخاصة بك كمدير للمنصة لأول مرة. ستُشفّر كلمة المرور وتُحفظ بصورة آمنة تماماً.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المدير</label>
                <div className="relative">
                  <User className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="المدير الرئيسي للمنصة"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pr-10 pl-3 text-xs text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07801234567"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pr-10 pl-3 text-xs text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني للدخول</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@qalatsukkar.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pr-10 pl-3 text-xs text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور الخاصة بالمدير</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pr-10 pl-3 text-xs text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-hidden transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تأكيد كلمة المرور</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pr-10 pl-3 text-xs text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-hidden transition"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-amber-600 py-3 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700 active:scale-98 transition disabled:opacity-60 mt-2"
              >
                {isLoading ? 'جاري تثبيت وتشفير الحساب...' : 'تثبيت وتفعيل حساب المدير الرئيسي'}
              </button>
            </form>
          )}

          {/* 0.1 SUPER ADMIN LOGIN (When already initialized) */}
          {activeTab === 'admin_setup' && isSuperAdminInitialized === true && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="rounded-2xl bg-amber-50 p-3.5 text-xs text-amber-900 border border-amber-200">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-950">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <span>بوابة الدخول للمدير الرئيسي (Super Admin)</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  أدخل البريد الإلكتروني وكلمة المرور المعتمدة لإدارة منصة ومتاجر أسواق قلعة سكر.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني للمدير</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@qalatsukkar.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pr-10 pl-3 text-xs text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pr-10 pl-3 text-xs text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-hidden transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-amber-600 py-3 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700 active:scale-98 transition disabled:opacity-60 mt-2"
              >
                {isLoading ? 'جاري التحقق والدخول...' : 'دخول إلى لوحة المدير العام'}
              </button>
            </form>
          )}

          {/* 1. LOGIN TAB */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@store.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pr-10 pl-3 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">كلمة المرور</label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] font-bold text-emerald-700 hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pr-10 pl-3 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-hidden transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-98 transition disabled:opacity-60"
              >
                {isLoading ? 'جاري تسجيل الدخول...' : 'دخول إلى الحساب'}
              </button>

              <div className="rounded-2xl bg-slate-50 p-3 text-center text-xs text-slate-500 border border-slate-200/60">
                ليس لديك حساب بعد؟{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('customer')}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  سجل كزبون مجاناً
                </button>
                {' '}أو{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('owner')}
                  className="font-bold text-blue-700 hover:underline"
                >
                  سجل متجرك برمز تفعيل
                </button>
              </div>
            </form>
          )}

          {/* 2. CUSTOMER REGISTRATION */}
          {activeTab === 'customer' && (
            <form onSubmit={handleRegisterCustomer} className="space-y-3.5">
              <div className="rounded-2xl bg-emerald-50/80 p-3 text-xs text-emerald-800 border border-emerald-100 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>حساب الزبون مجاني ومتاح فوراً لطلب المنتجات من متاجر قلعة سكر.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل</label>
                <div className="relative">
                  <User className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: حيدر الموسوي"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pr-10 pl-3 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0770XXXXXXX أو 0780XXXXXXX"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pr-10 pl-3 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@gmail.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pr-10 pl-3 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••••• (6 خانات على الأقل)"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pr-10 pl-3 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-hidden transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-98 transition disabled:opacity-60"
              >
                {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب زبون ودخول فوري'}
              </button>
            </form>
          )}

          {/* 3. STORE OWNER REGISTRATION (REQUIRES ACTIVATION CODE) */}
          {activeTab === 'owner' && (
            <form onSubmit={handleRegisterStoreOwner} className="space-y-3">
              <div className="rounded-2xl bg-blue-50/90 p-3 text-xs text-blue-900 border border-blue-100">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Key className="h-4 w-4 text-blue-600" />
                  <span>تسجيل أصحاب المتاجر في قلعة سكر</span>
                </div>
                <p className="text-[11px] leading-relaxed text-blue-800">
                  يتطلب إنشاء حساب المتجر رمز تفعيل رسمي معتمد من قِبل إدارة المنصة.
                </p>
              </div>

              {/* ACTIVATION CODE FIELD */}
              <div className="rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/30 p-3">
                <label className="block text-xs font-black text-blue-900 mb-1">
                  🔑 رمز تفعيل صاحب المتجر (إجباري)
                </label>
                <input
                  type="text"
                  required
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                  placeholder="مثال: SUKKAR-2026-VIP أو SUKKAR-NEW-2026"
                  className="w-full rounded-xl border border-blue-300 bg-white py-2 px-3 text-xs font-mono font-bold tracking-wider text-blue-950 uppercase placeholder-slate-400 focus:border-blue-600 focus:outline-hidden"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  * يُستخدم الرمز عند التسجيل فقط، ولا تحتاجه في المرات القادمة لتسجيل الدخول.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم صاحب المتجر</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: أحمد الشمري"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم المتجر</label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="مثال: أسواق الفرات"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">تصنيف النشاط</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                  >
                    <option value="مواد غذائية وماركت">مواد غذائية وماركت</option>
                    <option value="إلكترونيات وموبايل">إلكترونيات وموبايل</option>
                    <option value="لحوم وقصابة">لحوم وقصابة</option>
                    <option value="صيدلية وعناية">صيدلية وعناية</option>
                    <option value="حلويات ومعجنات">حلويات ومعجنات</option>
                    <option value="أزياء وملابس">أزياء وملابس</option>
                    <option value="خضار وفواكه">خضار وفواكه</option>
                    <option value="تجهيزات منزلية">تجهيزات منزلية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">رقم الهاتف للتواصل</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0780XXXXXXX"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">عنوان المتجر في قلعة سكر</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="مثال: الشارع العام، قرب فلكة الساعة"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">البريد الإلكتروني للوجين</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@store.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">كلمة المرور</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 active:scale-98 transition disabled:opacity-60"
              >
                {isLoading ? 'جاري التحقق من الرمز وإنشاء المتجر...' : 'تفعيل المتجر وبدء الاستخدام'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
