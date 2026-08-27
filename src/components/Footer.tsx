import React from 'react';
import { Store, MapPin, Heart, ShieldCheck, PhoneCall } from 'lucide-react';

interface FooterProps {
  onOpenAuth: (tab: 'owner' | 'customer') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAuth }) => {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white pb-20 md:pb-8 text-slate-600">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Col 1: About */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">
                <Store className="h-4 w-4" />
              </div>
              <span className="text-base font-black text-slate-900">أسواق قلعة سكر</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              المنصة والسوق الرقمي الموحد لمدينة قلعة سكر. نجمع أصحاب المتاجر والمشاريع التجارية مع أهالي المدينة لتسهيل استعراض المنتجات والأسعار وإرسال الطلبات مباشرة.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span>قلعة سكر، محافظة ذي قار، العراق</span>
            </div>
          </div>

          {/* Col 2: Store Owner Promo */}
          <div className="rounded-2xl bg-emerald-50/70 p-4 border border-emerald-100">
            <h4 className="text-xs font-bold text-emerald-950 mb-1.5 flex items-center gap-1.5">
              <Store className="h-4 w-4 text-emerald-700" />
              <span>هل أنت صاحب متجر في قلعة سكر؟</span>
            </h4>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              احصل على متجر رقمي متكامل، اعرض منتجاتك، استقبل طلبات زبائن المدينة، وأدر ديونك ومبيعاتك بكل سهولة وأمان.
            </p>
            <button
              type="button"
              onClick={() => onOpenAuth('owner')}
              className="mt-3 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition active:scale-95 shadow-2xs"
            >
              تسجيل متجر جديد برمز التفعيل
            </button>
          </div>

          {/* Col 3: Safe Market Guarantee */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>مميزات السوق الرقمي</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-500">
              <li>• استعراض ومقارنة أسعار المنتجات في مختلف المتاجر.</li>
              <li>• سلة مخصصة لكل متجر تضمن دقة الطلب والتجهيز.</li>
              <li>• عزل تام وآمن لبيانات كل متجر وحساباته.</li>
              <li>• تحديد موقع المتجر على الخريطة وسهولة الوصول إليه.</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <p>© {new Date().getFullYear()} أسواق قلعة سكر. جميع الحقوق محفوظة لأهالي المدينة الكرام.</p>
          <p className="flex items-center gap-1">
            <span>صُمم بإتقان لخدمة مدينة</span>
            <span className="font-bold text-slate-700">قلعة سكر</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
