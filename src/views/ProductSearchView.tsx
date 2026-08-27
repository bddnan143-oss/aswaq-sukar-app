import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Store, 
  SlidersHorizontal, 
  ArrowUpDown, 
  ShoppingBag, 
  Sparkles,
  Layers
} from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';
import { ProductCard } from '../components/ProductCard';

interface ProductSearchViewProps {
  initialQuery?: string;
  initialCategory?: string;
  onSelectStore: (storeId: string) => void;
}

const CATEGORIES = [
  'الكل',
  'مواد غذائية',
  'إلكترونيات',
  'لحوم',
  'صيدلية',
  'حلويات',
  'مشروبات',
  'ألبان'
];

export const ProductSearchView: React.FC<ProductSearchViewProps> = ({
  initialQuery = '',
  initialCategory = 'الكل',
  onSelectStore,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'newest'>('price_asc');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSearchResults();
  }, [query, selectedCategory]);

  const fetchSearchResults = async () => {
    setIsLoading(true);
    try {
      const res = await api.searchProducts(
        query.trim(),
        selectedCategory === 'الكل' ? undefined : selectedCategory
      );
      setProducts(res.products);
    } catch (e) {
      console.error('Error searching products:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    const priceA = a.isOffer && a.discountPrice ? a.discountPrice : a.price;
    const priceB = b.isOffer && b.discountPrice ? b.discountPrice : b.price;

    if (sortBy === 'price_asc') return priceA - priceB;
    if (sortBy === 'price_desc') return priceB - priceA;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 pb-20">
      {/* Header & Search Input */}
      <div className="rounded-3xl bg-white p-6 shadow-xs border border-slate-200">
        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Search className="h-5 w-5 text-emerald-600" />
          <span>البحث الشامل ومقارنة الأسعار في قلعة سكر</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          ابحث عن أي سلعة لمشاهدة أسعارها في كافة متاجر المدينة واختيار المتجر الأنسب لك
        </p>

        <div className="mt-4 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="مثال: بيبسي، شاحن، رز، لحم غنم..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-2.5 pr-10 pl-4 text-xs sm:text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden transition"
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1 text-xs font-bold text-slate-600 whitespace-nowrap">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>الترتيب:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="price_asc">الأقل سعراً أولاً</option>
              <option value="price_desc">الأعلى سعراً أولاً</option>
              <option value="newest">الأحدث إضافة</option>
            </select>
          </div>
        </div>

        {/* Categories Chips */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition whitespace-nowrap ${
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

      {/* Results Header */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs font-bold text-slate-700">
          نتائج البحث: <span className="text-emerald-700 font-black">({sortedProducts.length}) منتج متوفر</span>
        </p>
      </div>

      {/* Price comparison insight banner if search has results from multiple stores */}
      {query.trim().length > 0 && sortedProducts.length > 1 && (
        <div className="mt-3 rounded-2xl bg-emerald-50/90 p-3.5 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2.5">
          <Layers className="h-5 w-5 shrink-0 text-emerald-700" />
          <span>
            يتم عرض السلعة ومقارنة أسعارها في متاجر مختلفة بقلعة سكر. يمكنك النقر على اسم أي متجر لزيارة صفحته أو الطلب مباشرة.
          </span>
        </div>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 rounded-3xl bg-slate-200/70 animate-pulse" />
          ))}
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <Search className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-800">لم يتم العثور على منتجات مطابقة للبحث</h3>
          <p className="mt-1 text-xs text-slate-500">جرب كلمات بحث مختلفة أو تصفح التصنيفات العامة.</p>
          <button
            type="button"
            onClick={() => { setQuery(''); setSelectedCategory('الكل'); }}
            className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
          >
            عرض كافة المنتجات
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              storeName={prod.storeName}
              onVisitStore={(sId) => onSelectStore(sId)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
