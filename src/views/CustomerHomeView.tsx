import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Search, 
  Flame, 
  Sparkles, 
  MapPin, 
  ArrowLeft, 
  ShoppingBag, 
  Compass, 
  SlidersHorizontal,
  ChevronLeft
} from 'lucide-react';
import { Store as StoreType, Product } from '../types';
import { api, DEFAULT_FALLBACK_STORES, DEFAULT_FALLBACK_PRODUCTS } from '../services/api';
import { StoreCard } from '../components/StoreCard';
import { ProductCard } from '../components/ProductCard';
import { InstallPwaPrompt } from '../components/InstallPwaPrompt';

interface CustomerHomeViewProps {
  onSelectStore: (storeId: string) => void;
  onNavigateSearch: (category?: string, query?: string) => void;
  onOpenRegisterOwner: () => void;
}

const CATEGORIES = [
  'الكل',
  'مواد غذائية وماركت',
  'إلكترونيات وموبايل',
  'لحوم وقصابة',
  'صيدلية وعناية',
  'حلويات ومعجنات',
  'خضار وفواكه',
  'أزياء وملابس'
];

export const CustomerHomeView: React.FC<CustomerHomeViewProps> = ({
  onSelectStore,
  onNavigateSearch,
  onOpenRegisterOwner,
}) => {
  const [stores, setStores] = useState<StoreType[]>(DEFAULT_FALLBACK_STORES);
  const [products, setProducts] = useState<Product[]>(DEFAULT_FALLBACK_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [storesRes, productsRes] = await Promise.all([
        api.getStores().catch(() => ({ stores: DEFAULT_FALLBACK_STORES })),
        api.searchProducts().catch(() => ({ products: DEFAULT_FALLBACK_PRODUCTS, total: DEFAULT_FALLBACK_PRODUCTS.length })),
      ]);
      if (storesRes && storesRes.stores && storesRes.stores.length > 0) {
        setStores(storesRes.stores);
      } else {
        setStores(DEFAULT_FALLBACK_STORES);
      }
      if (productsRes && productsRes.products && productsRes.products.length > 0) {
        setProducts(productsRes.products);
      } else {
        setProducts(DEFAULT_FALLBACK_PRODUCTS);
      }
    } catch (e) {
      console.warn('Notice loading marketplace data, using default catalog:', e);
      setStores(DEFAULT_FALLBACK_STORES);
      setProducts(DEFAULT_FALLBACK_PRODUCTS);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigateSearch(undefined, searchQuery.trim());
    }
  };

  // Filtered stores
  const filteredStores = stores.filter((s) => {
    if (selectedCategory === 'الكل') return true;
    return s.category.includes(selectedCategory);
  });

  // Offers and latest products
  const offerProducts = products.filter((p) => p.isOffer);
  const latestProducts = products.slice(0, 8);

  return (
    <div className="min-h-screen pb-16">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 text-white px-4 py-10 sm:py-14 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
        
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-200 backdrop-blur-md border border-emerald-400/30 mb-4">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            <span>السوق الرقمي المعتمد لمدينة قلعة سكر</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            أسواق قلعة سكر
          </h1>
          <p className="mt-3 text-sm sm:text-base text-emerald-100/90 max-w-xl mx-auto leading-relaxed">
            منصة تجمع متاجر قلعة سكر في مكان واحد — اكتشف المتاجر المحلية، قارن الأسعار، واطلب احتياجاتك واستلمها مباشرة من المحل.
          </p>

          {/* Quick Search in Hero */}
          <form onSubmit={handleSearchSubmit} className="mt-6 max-w-xl mx-auto">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن أي منتج أو متجر (مثل: بيبسي، لحم غنم، شاحن)..."
                className="w-full rounded-2xl bg-white/95 py-3.5 pr-11 pl-28 text-xs sm:text-sm text-slate-900 placeholder-slate-400 shadow-xl focus:bg-white focus:outline-hidden"
              />
              <Search className="absolute right-4 h-5 w-5 text-slate-400" />
              <button
                type="submit"
                className="absolute left-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                بحث شامل
              </button>
            </div>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 -mt-4">
        {/* 2. CATEGORIES SELECTOR */}
        <div className="overflow-x-auto no-scrollbar py-2">
          <div className="flex items-center gap-2 min-w-max bg-white/90 p-2 rounded-2xl shadow-xs border border-slate-200/80 backdrop-blur-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 1-Click PWA App Installation Card */}
        <div className="mt-6">
          <InstallPwaPrompt mode="card" />
        </div>

        {/* 3. STORES SECTION */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Store className="h-5 w-5 text-emerald-600" />
                <span>المتاجر المشاركة في قلعة سكر</span>
              </h2>
              <p className="text-xs text-slate-500">تصفح المتاجر الفعالة والطلب منها مباشرة</p>
            </div>

            <button
              type="button"
              onClick={() => onNavigateSearch()}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>مشاهدة كل المتاجر</span>
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-64 rounded-3xl bg-slate-200/70 animate-pulse" />
              ))}
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
              <Store className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm font-bold text-slate-700">لا توجد متاجر في هذا التصنيف حالياً.</p>
              <button
                type="button"
                onClick={() => setSelectedCategory('الكل')}
                className="mt-3 text-xs font-bold text-emerald-700 hover:underline"
              >
                عرض جميع المتاجر
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredStores.map((st) => (
                <StoreCard
                  key={st.id}
                  store={st}
                  onClick={() => onSelectStore(st.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 4. SPECIAL OFFERS SECTION */}
        {offerProducts.length > 0 && (
          <section className="mt-12 rounded-3xl bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 p-6 border border-rose-100">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Flame className="h-5 w-5 text-rose-600" />
                  <span>عروض وتخفيضات متاجر المدينة</span>
                </h2>
                <p className="text-xs text-slate-600">خصومات خاصة لأهالي قلعة سكر على سلع ومنتجات متنوعة</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {offerProducts.slice(0, 4).map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onVisitStore={(sId) => onSelectStore(sId)}
                />
              ))}
            </div>
          </section>
        )}

        {/* 5. LATEST PRODUCTS */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                <span>أحدث المنتجات المضافة</span>
              </h2>
              <p className="text-xs text-slate-500">منتجات جديدة وتحديثات يومية من محلات قلعة سكر</p>
            </div>

            <button
              type="button"
              onClick={() => onNavigateSearch()}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>البحث في كل المنتجات</span>
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {latestProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onVisitStore={(sId) => onSelectStore(sId)}
              />
            ))}
          </div>
        </section>

        {/* 6. FUTURE PROXIMITY DISCOVERY BANNER */}
        <section className="mt-12 rounded-3xl bg-slate-900 text-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Compass className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base font-bold">📍 ميزة المتاجر القريبة مني</h3>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed max-w-lg">
                تم تجهيز النظام ليدعم ترتيب المتاجر حسب المسافة الجغرافية لموقعك الحالي في قلعة سكر بدون تتبع مستمر، مع دعم فتح الاتجاهات فوراً.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateSearch()}
            className="shrink-0 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-md"
          >
            استعراض المتاجر على الخريطة
          </button>
        </section>
      </div>
    </div>
  );
};
