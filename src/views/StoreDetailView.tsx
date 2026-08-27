import React, { useState, useEffect } from 'react';
import { 
  Store, 
  MapPin, 
  Clock, 
  Phone, 
  ArrowRight, 
  Navigation, 
  ShoppingBag, 
  Sparkles, 
  CheckCircle,
  Tag
} from 'lucide-react';
import { Store as StoreType, Product } from '../types';
import { api } from '../services/api';
import { LocationMap } from '../components/LocationMap';
import { ProductCard } from '../components/ProductCard';

interface StoreDetailViewProps {
  storeId: string;
  onBack: () => void;
  onOpenCart: () => void;
}

export const StoreDetailView: React.FC<StoreDetailViewProps> = ({
  storeId,
  onBack,
  onOpenCart,
}) => {
  const [store, setStore] = useState<StoreType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStoreDetails();
  }, [storeId]);

  const loadStoreDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getStore(storeId);
      setStore(res.store);
      setProducts(res.products);
    } catch (err: any) {
      setError(err.message || 'تعذر تحميل بيانات المتجر.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent mx-auto" />
        <p className="mt-3 text-xs text-slate-500 font-medium">جاري تحميل بيانات المتجر والمنتجات...</p>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <Store className="h-7 w-7" />
        </div>
        <h2 className="mt-3 text-base font-bold text-slate-900">المتجر غير متاح</h2>
        <p className="mt-1 text-xs text-slate-500">{error || 'المتجر غير موجود أو غير نشط حالياً.'}</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
        >
          <ArrowRight className="h-4 w-4" />
          <span>الرجوع للمتاجر</span>
        </button>
      </div>
    );
  }

  // Extract unique categories from products
  const productCategories = ['الكل', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'الكل') return true;
    return p.category === selectedCategory;
  });

  return (
    <div className="min-h-screen pb-20">
      {/* Back Button Bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 border border-slate-200 transition"
        >
          <ArrowRight className="h-4 w-4" />
          <span>الرجوع إلى جميع المتاجر</span>
        </button>
      </div>

      {/* Store Header Banner */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative h-48 sm:h-64 w-full overflow-hidden rounded-3xl bg-slate-900 shadow-sm">
          <img
            src={store.banner}
            alt={store.name}
            className="h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-transparent" />
        </div>

        {/* Store Profile Card Overlay */}
        <div className="relative -mt-16 sm:-mt-20 mx-4 sm:mx-6 rounded-3xl bg-white p-5 sm:p-6 shadow-xl border border-slate-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md">
                <img
                  src={store.logo}
                  alt={store.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">{store.name}</h1>
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                    {store.category}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 max-w-2xl leading-relaxed">
                  {store.description}
                </p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="flex flex-wrap sm:flex-col items-start gap-2 border-t sm:border-t-0 sm:border-r border-slate-100 pt-3 sm:pt-0 sm:pr-6 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-medium">
                <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span dir="ltr">{store.phone}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>{store.workingHours}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <MapPin className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                <span>{store.address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main: Store Products (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category Filter Chips */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-emerald-600" />
                <span>منتجات المتجر ({products.length})</span>
              </h2>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {productCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
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

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
                <ShoppingBag className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-xs font-bold text-slate-700">لا توجد منتجات في هذا التصنيف حالياً.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filteredProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    storeName={store.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Location Map & Directions (1 col on lg) */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-5 shadow-xs border border-slate-200">
              <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span>موقع المتجر على الخريطة</span>
              </h3>

              {/* Map Preview with Directions Button */}
              <LocationMap
                location={store.location}
                editable={false}
                storeName={store.name}
                height="220px"
              />

              <div className="mt-3 text-[11px] text-slate-500 leading-relaxed">
                📍 {store.address}
              </div>
            </div>

            {/* Store Pickup Notice */}
            <div className="rounded-3xl bg-emerald-50/80 p-5 border border-emerald-200/80">
              <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-emerald-700" />
                <span>طريقة الطلب والاستلام</span>
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-emerald-800 leading-relaxed">
                <li>أضف المنتجات المطلوبة إلى السلة.</li>
                <li>أرسل الطلب للمتجر من خلال السلة.</li>
                <li>يصلك إشعار وتحديث فوري بحالة تجهيز الطلب.</li>
                <li>استلم طلبك مباشرة من محل المتجر عند الجاهزية.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
