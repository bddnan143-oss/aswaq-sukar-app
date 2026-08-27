import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Store, 
  Search, 
  User, 
  LogOut, 
  Shield, 
  LayoutDashboard, 
  ClipboardList, 
  Sparkles, 
  MapPin,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { SyncStatusBadge } from './SyncStatusBadge';
import { InstallPwaPrompt } from './InstallPwaPrompt';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, data?: any) => void;
  onOpenCart: () => void;
  onOpenAuth: (tab?: 'login' | 'customer' | 'owner' | 'admin_setup') => void;
  onOpenDemoSwitcher?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenCart,
  onOpenAuth,
}) => {
  const { user, store, logout } = useAuth();
  const { totalCount } = useCart();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('search', { query: searchQuery.trim() });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Brand Logo & City Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-right group focus:outline-hidden"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-slate-900 tracking-tight">أسواق قلعة سكر</span>
                <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  سوق رقمي
                </span>
              </div>
              <p className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                <MapPin className="h-3 w-3 text-emerald-600" />
                <span>مدينة قلعة سكر • ذي قار</span>
              </p>
            </div>
          </button>
        </div>

        {/* Global Search Bar (Desktop) */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute right-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن منتج أو متجر (مثل: بيبسي، أرز، شاحن)..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-2 pr-10 pl-4 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden transition"
            />
          </div>
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick PWA Install Button */}
          <InstallPwaPrompt mode="button" />

          {/* Quick Search Button on Mobile */}
          <button
            type="button"
            onClick={() => onNavigate('search')}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Auto-Sync LocalStorage Badge */}
          <SyncStatusBadge compact={true} />

          {/* Cart Trigger */}
          <button
            type="button"
            onClick={onOpenCart}
            className="relative flex items-center gap-2 rounded-2xl bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 active:scale-95 transition"
          >
            <ShoppingBag className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">السلة</span>
            {totalCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-black text-white">
                {totalCount}
              </span>
            )}
          </button>

          {/* User Profile / Auth State */}
          {user ? (
            <div className="flex items-center gap-2">
              {user.role === 'super_admin' && (
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  className={`flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-bold transition shadow-xs ${
                    currentView === 'admin'
                      ? 'bg-amber-600 text-white ring-2 ring-amber-400/40'
                      : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">👑 لوحة المدير</span>
                  <span className="sm:hidden">👑</span>
                </button>
              )}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 pr-2.5 text-right hover:border-slate-300 transition"
                >
                  <div className="hidden sm:block">
                    <p className="text-xs font-bold text-slate-800 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {user.role === 'customer' && '👤 زبون'}
                      {user.role === 'store_owner' && '🏪 صاحب متجر'}
                      {user.role === 'super_admin' && '👑 مدير المنصة'}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                    {user.name.charAt(0)}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="border-b border-slate-100 px-3 py-2 sm:hidden">
                      <p className="text-xs font-bold text-slate-900">{user.name}</p>
                      <p className="text-[10px] text-slate-500">{user.email}</p>
                    </div>

                    {user.role === 'customer' && (
                      <button
                        type="button"
                        onClick={() => { onNavigate('orders'); setUserDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 text-right transition"
                      >
                        <ClipboardList className="h-4 w-4 text-emerald-600" />
                        <span>طلباتي ومتابعة الحالة</span>
                      </button>
                    )}

                    {user.role === 'store_owner' && (
                      <button
                        type="button"
                        onClick={() => { onNavigate('owner'); setUserDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 text-right transition"
                      >
                        <LayoutDashboard className="h-4 w-4 text-blue-600" />
                        <span>لوحة تحكم المتجر</span>
                      </button>
                    )}

                    {user.role === 'super_admin' && (
                      <button
                        type="button"
                        onClick={() => { onNavigate('admin'); setUserDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 text-right transition"
                      >
                        <Shield className="h-4 w-4 text-amber-600" />
                        <span>لوحة تحكم المدير الرئيسي</span>
                      </button>
                    )}

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={() => { logout(); setUserDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-right transition"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onOpenAuth('admin_setup')}
                className="flex items-center gap-1 rounded-xl bg-amber-50 border border-amber-200/80 px-2.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100/90 active:scale-95 transition"
                title="بوابة إدارة المنصة (Super Admin)"
              >
                <Shield className="h-3.5 w-3.5 text-amber-600" />
                <span className="hidden sm:inline">👑 المدير</span>
                <span className="sm:hidden">👑</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                دخول
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('customer')}
                className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition"
              >
                تسجيل
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
