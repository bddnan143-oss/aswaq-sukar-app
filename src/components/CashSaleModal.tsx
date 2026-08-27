import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Printer,
  Share2,
  CheckCircle2,
  ShoppingBag,
  Calculator,
  User,
  Phone,
  Calendar,
  Sparkles,
  ArrowRight,
  PackageCheck,
  AlertCircle,
} from 'lucide-react';
import { Product, Sale, SaleItem } from '../types';
import { api } from '../services/api';
import {
  generateCashSaleReceiptHtml,
  printCashSaleReceipt,
} from '../utils/printPdf';
import { sendCashSaleReceiptWhatsAppNotification } from '../utils/whatsapp';

interface CashSaleModalProps {
  storeId: string;
  storeName: string;
  storeLogo?: string;
  storePhone?: string;
  storeAddress?: string;
  products: Product[];
  onClose: () => void;
  onSaleSaved: (newSale: Sale, updatedProducts?: Product[]) => void;
  onPreviewPdf: (data: { title: string; filename: string; htmlContent: string }) => void;
}

interface SaleRowItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  maxStock?: number;
}

export const CashSaleModal: React.FC<CashSaleModalProps> = ({
  storeId,
  storeName,
  storeLogo,
  storePhone,
  storeAddress,
  products,
  onClose,
  onSaleSaved,
  onPreviewPdf,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Successfully saved sale state to show receipt actions
  const [savedSale, setSavedSale] = useState<Sale | null>(null);

  // Sale items table state
  const [items, setItems] = useState<SaleRowItem[]>([
    {
      id: 'row_' + Date.now(),
      productId: '',
      name: '',
      price: 0,
      quantity: 1,
    },
  ]);

  // Calculations
  const subtotalAmount = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );
  const safeDiscount = Math.min(subtotalAmount, Math.max(0, Number(discountAmount) || 0));
  const finalTotalAmount = Math.max(0, subtotalAmount - safeDiscount);

  // Available store products with inventory
  const availableProducts = products.filter((p) => p.isAvailable && !(p as any).isDeleted);

  // Handlers for Items
  const handleAddItemRow = () => {
    setItems([
      ...items,
      {
        id: 'row_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        productId: '',
        name: '',
        price: 0,
        quantity: 1,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) {
      // Reset single row
      setItems([
        {
          id: 'row_' + Date.now(),
          productId: '',
          name: '',
          price: 0,
          quantity: 1,
        },
      ]);
      return;
    }
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleProductSelect = (index: number, selectedProdId: string) => {
    const newItems = [...items];
    if (!selectedProdId) {
      newItems[index] = {
        ...newItems[index],
        productId: '',
        name: '',
        price: 0,
        maxStock: undefined,
      };
    } else {
      const prod = products.find((p) => p.id === selectedProdId);
      if (prod) {
        newItems[index] = {
          ...newItems[index],
          productId: prod.id,
          name: prod.name,
          price: prod.discountPrice || prod.price,
          maxStock: prod.stockQuantity,
          quantity: newItems[index].quantity > 0 ? newItems[index].quantity : 1,
        };
      }
    }
    setItems(newItems);
  };

  const handleItemChange = (
    index: number,
    field: 'name' | 'price' | 'quantity',
    value: any
  ) => {
    const newItems = [...items];
    if (field === 'price') {
      newItems[index].price = Math.max(0, Number(value) || 0);
    } else if (field === 'quantity') {
      newItems[index].quantity = Math.max(1, Number(value) || 1);
    } else {
      newItems[index].name = value;
      // If manually typing name, clear productId if user changes it
      if (newItems[index].productId) {
        const matching = products.find((p) => p.id === newItems[index].productId);
        if (matching && matching.name !== value) {
          newItems[index].productId = undefined;
          newItems[index].maxStock = undefined;
        }
      }
    }
    setItems(newItems);
  };

  // Submit and Save Sale
  const handleSaveSale = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    // Validation
    const validItems: SaleItem[] = items
      .filter((it) => it.name.trim() !== '' && Number(it.price) > 0 && Number(it.quantity) > 0)
      .map((it) => ({
        productId: it.productId,
        name: it.name.trim(),
        price: Number(it.price),
        quantity: Number(it.quantity),
        subtotal: Number(it.price) * Number(it.quantity),
      }));

    if (validItems.length === 0) {
      setErrorMessage('يرجى إضافة مادة واحدة على الأقل وتحديد اسمها وسعرها وكميتها.');
      return;
    }

    if (finalTotalAmount <= 0) {
      setErrorMessage('المبلغ الإجمالي للفاتورة يجب أن يكون أكبر من الصفر.');
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date();
      const res = await api.addSale({
        customerName: (customerName.trim() || 'زبون نقدي عام'),
        customerPhone: customerPhone.trim(),
        items: validItems,
        subtotalAmount,
        discountAmount: safeDiscount,
        totalAmount: finalTotalAmount,
        paymentType: 'cash',
        notes: notes.trim(),
        date: now.toISOString().split('T')[0],
      });

      setSavedSale(res.sale);
      onSaleSaved(res.sale, res.products);
    } catch (err: any) {
      console.error('[CashSaleModal] Error saving sale:', err);
      setErrorMessage(err.message || 'فشل تسجيل عملية البيع. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct Print / Export PDF Handler
  const handlePrintOrExportPdf = (targetSale?: Sale) => {
    const saleToPrint: Sale = targetSale || savedSale || {
      id: 'preview_' + Date.now(),
      storeId,
      items: items
        .filter((it) => it.name.trim() !== '')
        .map((it) => ({
          productId: it.productId,
          name: it.name.trim(),
          price: Number(it.price) || 0,
          quantity: Number(it.quantity) || 1,
          subtotal: (Number(it.price) || 0) * (Number(it.quantity) || 1),
        })),
      subtotalAmount,
      discountAmount: safeDiscount,
      totalAmount: finalTotalAmount,
      paymentType: 'cash',
      customerName: (customerName.trim() || 'زبون نقدي عام'),
      customerPhone: customerPhone.trim(),
      notes: notes.trim(),
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    try {
      const html = generateCashSaleReceiptHtml({
        storeName,
        storeLogo,
        storePhone,
        storeAddress,
        sale: saleToPrint,
      });

      const filename = `وصل_شراء_نقدي_${(saleToPrint.id || 'POS').slice(-6).toUpperCase()}_${storeName}`;

      // Open universal preview and print modal
      onPreviewPdf({
        title: `وصل شراء نقدي: #${(saleToPrint.id || 'POS').slice(-6).toUpperCase()}`,
        filename,
        htmlContent: html,
      });
    } catch (err) {
      console.error('[CashSaleModal] Print fallback:', err);
      printCashSaleReceipt({
        storeName,
        storeLogo,
        storePhone,
        storeAddress,
        sale: saleToPrint,
      });
    }
  };

  // WhatsApp Share Handler
  const handleShareWhatsApp = (targetSale?: Sale) => {
    const saleToShare = targetSale || savedSale;
    const invNum = saleToShare ? `#POS-${saleToShare.id.slice(-6).toUpperCase()}` : '#POS-NEW';
    const saleItems = saleToShare
      ? saleToShare.items
      : items
          .filter((it) => it.name.trim() !== '')
          .map((it) => ({
            name: it.name,
            price: Number(it.price),
            quantity: Number(it.quantity),
            subtotal: Number(it.price) * Number(it.quantity),
          }));

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    sendCashSaleReceiptWhatsAppNotification({
      phone: customerPhone || saleToShare?.customerPhone,
      storeName,
      storePhone,
      customerName: customerName.trim() || saleToShare?.customerName || 'زبون نقدي عام',
      invoiceNumber: invNum,
      items: saleItems,
      subtotalAmount: saleToShare?.subtotalAmount || subtotalAmount,
      discountAmount: saleToShare?.discountAmount || safeDiscount,
      totalAmount: saleToShare?.totalAmount || finalTotalAmount,
      date: now.toISOString().split('T')[0],
      time: timeStr,
    });
  };

  // Reset form for another quick sale
  const handleResetForNewSale = () => {
    setSavedSale(null);
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
    setDiscountAmount(0);
    setErrorMessage(null);
    setItems([
      {
        id: 'row_' + Date.now(),
        productId: '',
        name: '',
        price: 0,
        quantity: 1,
      },
    ]);
  };

  return (
    <div
      id="cash-sale-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl my-auto rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-l from-emerald-700 via-teal-700 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/15 p-2.5 backdrop-blur-xs border border-white/20">
              <ShoppingBag className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  تسجيل بيع مباشر (كاشير سريع POS)
                </h3>
                <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-200 border border-emerald-400/30">
                  نقدي (كاش)
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                إصدار فاتورة بيع فورية وخصم الكميات من مخزون المتجر تلقائياً
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white transition active:scale-95"
            title="إغلاق النافذة"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50/40">
          {/* SUCCESS SCREEN STATE AFTER SAVING SALE */}
          {savedSale ? (
            <div className="rounded-3xl bg-emerald-50 border border-emerald-200 p-6 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h4 className="text-lg font-black text-emerald-950">
                  تم تسجيل عملية البيع وخصم المخزون بنجاح!
                </h4>
                <p className="text-xs text-emerald-800 mt-1 font-semibold">
                  رقم الفاتورة: #POS-{savedSale.id.slice(-6).toUpperCase()} • المبلغ الإجمالي:{' '}
                  {savedSale.totalAmount.toLocaleString('ar-IQ')} د.ع
                </p>
              </div>

              {/* ACTION BUTTONS ON SUCCESS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handlePrintOrExportPdf(savedSale)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 px-4 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-slate-800 transition active:scale-95 border border-slate-800"
                >
                  <Printer className="h-4 w-4 text-emerald-400" />
                  طباعة / تصدير الفاتورة PDF
                </button>

                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(savedSale)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 px-4 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition active:scale-95"
                >
                  <Share2 className="h-4 w-4" />
                  مشاركة الوصل عبر واتساب
                </button>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-emerald-200/60">
                <button
                  type="button"
                  onClick={handleResetForNewSale}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-white py-2.5 px-4 text-xs font-bold text-emerald-800 border border-emerald-300 hover:bg-emerald-100/50 transition"
                >
                  <Plus className="h-4 w-4" />
                  تسجيل فاتورة بيع جديدة
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-2xl bg-slate-200 py-2.5 px-4 text-xs font-bold text-slate-700 hover:bg-slate-300 transition"
                >
                  تم والعودة للوحة المتجر
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveSale} className="space-y-5">
              {/* ERROR ALERT */}
              {errorMessage && (
                <div className="rounded-2xl bg-red-50 border border-red-200 p-3.5 flex items-center gap-2.5 text-xs text-red-800 font-bold">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. CUSTOMER INFO SECTION */}
              <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-emerald-600" />
                    بيانات الزبون (اختياري)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerName('زبون نقدي عام');
                      setCustomerPhone('');
                    }}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 hover:underline"
                  >
                    تعيين كـ (زبون نقدي عام)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      اسم الزبون
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="اتركه فارغاً ليكون (زبون نقدي عام)"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-hidden transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      رقم هاتف الزبون (لإرسال الوصل بالواتساب)
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        dir="ltr"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="07801234567"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-hidden text-right transition"
                      />
                      <Phone className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. ITEMS & PRODUCTS POS TABLE */}
              <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <PackageCheck className="h-4 w-4 text-emerald-600" />
                    جدول المواد المباعة
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    عدد المواد: {items.length}
                  </span>
                </div>

                {/* ITEMS LIST */}
                <div className="space-y-3">
                  {items.map((item, index) => {
                    const rowSubtotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);

                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl bg-slate-50/80 p-3 border border-slate-200/70 space-y-2.5 transition hover:border-slate-300"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black">
                            {index + 1}
                          </span>

                          {/* QUICK SELECT FROM STORE PRODUCTS */}
                          <div className="flex-1 max-w-[280px] sm:max-w-[340px]">
                            <select
                              value={item.productId || ''}
                              onChange={(e) => handleProductSelect(index, e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white p-1.5 text-xs text-slate-800 font-semibold focus:border-emerald-500 focus:outline-hidden"
                            >
                              <option value="">-- اختر من مخزون المتجر أو اكتب يدوياً --</option>
                              {availableProducts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.price.toLocaleString('ar-IQ')} د.ع) - المخزون: {p.stockQuantity}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(index)}
                            className="rounded-xl p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="حذف هذه المادة"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* INPUT FIELDS: NAME, QUANTITY, UNIT PRICE, SUBTOTAL */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-12 sm:col-span-5">
                            <input
                              type="text"
                              required
                              value={item.name}
                              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                              placeholder="اسم المادة المباعة"
                              className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-800 font-medium focus:border-emerald-500 focus:outline-hidden"
                            />
                            {item.maxStock !== undefined && (
                              <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                                المخزون المتوفر: {item.maxStock} قطعة (سيتم الخصم تلقائياً)
                              </span>
                            )}
                          </div>

                          {/* QUANTITY */}
                          <div className="col-span-5 sm:col-span-3">
                            <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden">
                              <button
                                type="button"
                                onClick={() =>
                                  handleItemChange(index, 'quantity', Math.max(1, item.quantity - 1))
                                }
                                className="px-2 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                required
                                min={1}
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(index, 'quantity', Number(e.target.value))
                                }
                                className="w-full text-center p-1 text-xs text-slate-900 font-bold focus:outline-hidden"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleItemChange(index, 'quantity', item.quantity + 1)
                                }
                                className="px-2 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* UNIT PRICE */}
                          <div className="col-span-7 sm:col-span-4">
                            <div className="relative">
                              <input
                                type="number"
                                required
                                min={0}
                                step={250}
                                value={item.price || ''}
                                onChange={(e) =>
                                  handleItemChange(index, 'price', Number(e.target.value))
                                }
                                placeholder="السعر المفرد"
                                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-900 font-bold focus:border-emerald-500 focus:outline-hidden pl-8"
                              />
                              <span className="text-[10px] font-bold text-slate-400 absolute left-2 top-2.5 pointer-events-none">
                                د.ع
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* ROW SUBTOTAL */}
                        <div className="flex justify-end items-center gap-1.5 text-[11px] text-slate-600 font-semibold pt-1 border-t border-slate-200/50">
                          <span>المجموع للمادة:</span>
                          <span className="font-bold text-slate-900">
                            {rowSubtotal.toLocaleString('ar-IQ')} د.ع
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ADD ANOTHER ITEM BUTTON */}
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100/60 hover:border-emerald-400 transition active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  + إضافة مادة أخرى للفاتورة
                </button>
              </div>

              {/* 3. FINANCIAL SUMMARY & DISCOUNT */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white shadow-md space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>مجموع المواد الفرعي:</span>
                  <span className="font-bold text-white text-sm">
                    {subtotalAmount.toLocaleString('ar-IQ')} د.ع
                  </span>
                </div>

                {/* OPTIONAL DISCOUNT INPUT */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-700">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <Calculator className="h-4 w-4" />
                    <span>الخصم / التخفيض (إن وجد):</span>
                  </div>
                  <div className="relative w-36">
                    <input
                      type="number"
                      min={0}
                      max={subtotalAmount}
                      step={250}
                      value={discountAmount || ''}
                      onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-1.5 px-2.5 text-xs text-white font-bold focus:border-emerald-400 focus:outline-hidden text-left pl-8"
                    />
                    <span className="text-[10px] font-bold text-slate-400 absolute left-2 top-2 pointer-events-none">
                      د.ع
                    </span>
                  </div>
                </div>

                {/* FINAL TOTAL AMOUNT */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-700/80">
                  <div>
                    <span className="text-xs font-bold text-slate-300 block">المبلغ الصافي المطلوب:</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">الدفع نقداً بالدينار العراقي</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
                      {finalTotalAmount.toLocaleString('ar-IQ')}
                    </span>
                    <span className="text-xs font-bold text-white mr-1">د.ع</span>
                  </div>
                </div>
              </div>

              {/* 4. ACTIONS & SAVE BUTTONS */}
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 px-4 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 transition active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isSubmitting ? 'جاري حفظ البيع وخصم المخزون...' : '💾 حفظ البيع وتحديث المخزون'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrintOrExportPdf()}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-800 py-3.5 px-4 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-slate-700 transition active:scale-95 border border-slate-700"
                    title="معاينة وطباعة الوصل بصيغة PDF فورياً"
                  >
                    <Printer className="h-4 w-4 text-blue-400" />
                    معاينة / طباعة الفاتورة PDF
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  {customerPhone && (
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp()}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      إرسال تفاصيل الوصل للواتساب
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onClose}
                    className="mr-auto rounded-xl py-2 px-4 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
