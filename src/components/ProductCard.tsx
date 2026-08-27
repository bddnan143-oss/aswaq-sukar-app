import React from 'react';
import { Plus, ShoppingBag, Store, Tag, Check, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  storeName?: string;
  onVisitStore?: (storeId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  storeName,
  onVisitStore,
}) => {
  const { addToCart, items, storeId: cartStoreId } = useCart();

  const effectivePrice = product.isOffer && product.discountPrice ? product.discountPrice : product.price;
  const isOutOfStock = product.stockQuantity <= 0 || !product.isAvailable;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= product.minStockAlert;

  const currentCartItem = items.find((it) => it.product.id === product.id);
  const quantityInCart = currentCartItem?.quantity || 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, {
      id: product.storeId,
      name: storeName || product.storeName || 'المتجر',
    });
  };

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-3 shadow-xs transition duration-200 hover:shadow-md hover:border-emerald-200">
      <div>
        {/* Product Image & Badges */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100 mb-3">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />

          {/* Offer Badge */}
          {product.isOffer && (
            <div className="absolute top-2 right-2 rounded-lg bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
              عرض خاص
            </div>
          )}

          {/* Stock Alert */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs">
              <span className="rounded-xl bg-white/90 px-3 py-1 text-xs font-bold text-slate-800">
                نفدت الكمية
              </span>
            </div>
          )}

          {isLowStock && !isOutOfStock && (
            <div className="absolute bottom-2 right-2 rounded-md bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-2xs">
              متبقي {product.stockQuantity} فقط
            </div>
          )}
        </div>

        {/* Store Reference if in global search */}
        {(storeName || product.storeName) && onVisitStore && (
          <button
            type="button"
            onClick={() => onVisitStore(product.storeId)}
            className="mb-1 flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-emerald-700 transition"
          >
            <Store className="h-3 w-3 text-emerald-600 shrink-0" />
            <span className="truncate">{storeName || product.storeName}</span>
          </button>
        )}

        {/* Product Name & Description */}
        <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition">
          {product.name}
        </h4>
        <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
          {product.description || 'متوفر في أسواق قلعة سكر بجودة ممتازة.'}
        </p>
      </div>

      {/* Pricing & Add to Cart */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-black text-emerald-700">
              {effectivePrice.toLocaleString('ar-IQ')}
            </span>
            <span className="text-[10px] font-bold text-slate-500">د.ع</span>
          </div>
          {product.isOffer && (
            <span className="text-[10px] text-slate-400 line-through">
              {product.price.toLocaleString('ar-IQ')} د.ع
            </span>
          )}
        </div>

        {/* Add button */}
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleAdd}
          className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : quantityInCart > 0
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white'
          }`}
        >
          {quantityInCart > 0 ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>في السلة ({quantityInCart})</span>
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              <span>إضافة</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
