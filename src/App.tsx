import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';
import { CartConflictModal } from './components/CartConflictModal';
import { CartModal } from './components/CartModal';
import { AuthModal } from './components/AuthModal';
import { InstallPwaPrompt } from './components/InstallPwaPrompt';

import { CustomerHomeView } from './views/CustomerHomeView';
import { StoreDetailView } from './views/StoreDetailView';
import { ProductSearchView } from './views/ProductSearchView';
import { CustomerOrdersView } from './views/CustomerOrdersView';
import { StoreOwnerDashboard } from './views/StoreOwnerDashboard';
import { SuperAdminDashboard } from './views/SuperAdminDashboard';
import { CheckCircle2, ShoppingBag, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user } = useAuth();

  // Navigation state
  const [currentView, setCurrentView] = useState<'home' | 'store' | 'search' | 'orders' | 'owner' | 'admin'>('home');
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<{ category?: string; query?: string }>({});

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'customer' | 'owner' | 'admin_setup'>('login');

  // Success Toast for Orders
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);

  // Auto-redirect when user logs in or role changes
  useEffect(() => {
    if (user?.role === 'super_admin') {
      setCurrentView('admin');
    } else if (user?.role === 'store_owner' && currentView === 'home') {
      setCurrentView('owner');
    } else if (!user) {
      if (currentView === 'admin' || currentView === 'owner' || currentView === 'orders') {
        setCurrentView('home');
      }
    } else if (user.role !== 'super_admin' && currentView === 'admin') {
      setCurrentView('home');
    } else if (user.role !== 'store_owner' && currentView === 'owner') {
      setCurrentView('home');
    }
  }, [user?.id, user?.role]);

  const handleNavigate = (view: string, data?: any) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (view === 'store' && data?.storeId) {
      setSelectedStoreId(data.storeId);
      setCurrentView('store');
    } else if (view === 'search') {
      setSearchParams({ category: data?.category, query: data?.query });
      setCurrentView('search');
    } else if (view === 'orders') {
      if (!user) {
        setAuthTab('login');
        setIsAuthOpen(true);
        return;
      }
      setCurrentView('orders');
    } else if (view === 'owner') {
      if (user?.role !== 'store_owner') {
        setAuthTab('owner');
        setIsAuthOpen(true);
        return;
      }
      setCurrentView('owner');
    } else if (view === 'admin') {
      if (user?.role !== 'super_admin') {
        setAuthTab('login');
        setIsAuthOpen(true);
        return;
      }
      setCurrentView('admin');
    } else {
      setCurrentView('home');
    }
  };

  const handleOrderSuccess = (orderId: string) => {
    setOrderSuccessId(orderId);
    setTimeout(() => {
      setCurrentView('orders');
    }, 1200);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100/60 font-sans text-slate-800 antialiased selection:bg-emerald-500 selection:text-white" dir="rtl">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={(tab) => {
          setAuthTab(tab || 'login');
          setIsAuthOpen(true);
        }}
      />

      {/* Main View Body */}
      <main className="flex-1">
        {currentView === 'home' && (
          <CustomerHomeView
            onSelectStore={(storeId) => handleNavigate('store', { storeId })}
            onNavigateSearch={(category, query) => handleNavigate('search', { category, query })}
            onOpenRegisterOwner={() => {
              setAuthTab('owner');
              setIsAuthOpen(true);
            }}
          />
        )}

        {currentView === 'store' && selectedStoreId && (
          <StoreDetailView
            storeId={selectedStoreId}
            onBack={() => setCurrentView('home')}
            onOpenCart={() => setIsCartOpen(true)}
          />
        )}

        {currentView === 'search' && (
          <ProductSearchView
            initialQuery={searchParams.query || ''}
            initialCategory={searchParams.category || 'الكل'}
            onSelectStore={(storeId) => handleNavigate('store', { storeId })}
          />
        )}

        {currentView === 'orders' && <CustomerOrdersView />}

        {currentView === 'owner' && <StoreOwnerDashboard />}

        {currentView === 'admin' && <SuperAdminDashboard />}
      </main>

      {/* Footer */}
      <Footer
        onOpenAuth={(tab) => {
          setAuthTab(tab);
          setIsAuthOpen(true);
        }}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={() => {
          setAuthTab('login');
          setIsAuthOpen(true);
        }}
      />

      {/* Modals */}
      <CartConflictModal />

      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderSuccess={handleOrderSuccess}
        onRequireAuth={() => {
          setIsCartOpen(false);
          setAuthTab('login');
          setIsAuthOpen(true);
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialTab={authTab}
      />

      {/* Order Success Toast Notification */}
      {orderSuccessId && (
        <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between rounded-2xl bg-emerald-700 p-4 text-white shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold">تم إرسال طلبك بنجاح للمتجر!</p>
                <p className="text-[11px] text-emerald-100">
                  يمكنك متابعة حالة التجهيز والاستلام من صفحة «طلباتي».
                </p>
              </div>
            </div>
            <button
              onClick={() => setOrderSuccessId(null)}
              className="rounded-lg p-1 text-emerald-200 hover:bg-emerald-600 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating 1-Click PWA App Install Banner for Mobile & Desktop */}
      <InstallPwaPrompt mode="banner" />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
