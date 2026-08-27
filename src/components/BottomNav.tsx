import React from 'react';
import { Home, Store, Search, ClipboardList, User, Shield, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string, data?: any) => void;
  onOpenAuth: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
}) => {
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 block md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-md pb-safe">
      <div className="flex items-center justify-around py-2 px-1">
        {/* Home */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center gap-1 p-1 text-[11px] font-bold transition ${
            currentView === 'home' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="h-5 w-5" />
          <span>الرئيسية</span>
        </button>

        {/* Global Search */}
        <button
          type="button"
          onClick={() => onNavigate('search')}
          className={`flex flex-col items-center gap-1 p-1 text-[11px] font-bold transition ${
            currentView === 'search' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search className="h-5 w-5" />
          <span>البحث</span>
        </button>

        {/* Orders (Customer) or Dashboard (Owner/Admin) */}
        {user?.role === 'customer' && (
          <button
            type="button"
            onClick={() => onNavigate('orders')}
            className={`flex flex-col items-center gap-1 p-1 text-[11px] font-bold transition ${
              currentView === 'orders' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardList className="h-5 w-5" />
            <span>طلباتي</span>
          </button>
        )}

        {user?.role === 'store_owner' && (
          <button
            type="button"
            onClick={() => onNavigate('owner')}
            className={`flex flex-col items-center gap-1 p-1 text-[11px] font-bold transition ${
              currentView === 'owner' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>المتجر</span>
          </button>
        )}

        {user?.role === 'super_admin' && (
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className={`flex flex-col items-center gap-1 p-1 text-[11px] font-bold transition ${
              currentView === 'admin' ? 'text-purple-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="h-5 w-5" />
            <span>الإدارة</span>
          </button>
        )}

        {/* User / Login */}
        {!user ? (
          <button
            type="button"
            onClick={onOpenAuth}
            className="flex flex-col items-center gap-1 p-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition"
          >
            <User className="h-5 w-5" />
            <span>حسابي</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (user.role === 'store_owner') onNavigate('owner');
              else if (user.role === 'super_admin') onNavigate('admin');
              else onNavigate('orders');
            }}
            className="flex flex-col items-center gap-1 p-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] text-slate-700">
              {user.name.charAt(0)}
            </div>
            <span className="truncate max-w-[60px]">{user.name.split(' ')[0]}</span>
          </button>
        )}
      </div>
    </nav>
  );
};
