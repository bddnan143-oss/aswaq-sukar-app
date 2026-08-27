/**
 * Helper utilities for formatting and sending WhatsApp notifications to customers and debtors.
 */

export function cleanIraqiPhoneNumber(phone?: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('00964')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0')) {
    cleaned = '964' + cleaned.substring(1);
  } else if (cleaned && !cleaned.startsWith('964')) {
    cleaned = '964' + cleaned;
  }
  return cleaned;
}

export function openWhatsAppMessage(phone: string | undefined, message: string) {
  const cleanPhone = cleanIraqiPhoneNumber(phone);
  const encodedMsg = encodeURIComponent(message.trim());
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedMsg}`
    : `https://wa.me/?text=${encodedMsg}`;
  
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Send WhatsApp notification when a new debt item/purchase is added.
 */
export function sendDebtItemWhatsAppNotification({
  phone,
  storeName,
  debtorName,
  itemDescription,
  itemAmount,
  remainingAmount,
  date,
  time,
  notes,
}: {
  phone?: string;
  storeName: string;
  debtorName: string;
  itemDescription: string;
  itemAmount: number;
  remainingAmount: number;
  date?: string;
  time?: string;
  notes?: string;
}) {
  const dateStr = date || new Date().toISOString().split('T')[0];
  const timeStr = time ? ` • ${time}` : '';

  const msg = 
`*🛒 إشعار حركة دين جديدة - ${storeName}*
━━━━━━━━━━━━━━━━━
👤 *الزبون:* ${debtorName}
📅 *التاريخ:* ${dateStr}${timeStr}

🛍️ *المادة / التفاصيل:* ${itemDescription}
💵 *المبلغ المضاف:* ${itemAmount.toLocaleString('ar-IQ')} د.ع
${notes ? `📝 *ملاحظات:* ${notes}\n` : ''}
━━━━━━━━━━━━━━━━━
🔴 *إجمالي الحساب المتبقي بذمتكم:* ${remainingAmount.toLocaleString('ar-IQ')} د.ع

شكراً لتعاملكم معنا ودمتم بألف خير 🙏`;

  openWhatsAppMessage(phone, msg);
}

/**
 * Send WhatsApp notification when a payment is recorded.
 */
export function sendPaymentWhatsAppNotification({
  phone,
  storeName,
  debtorName,
  paymentAmount,
  remainingAmount,
  date,
  note,
}: {
  phone?: string;
  storeName: string;
  debtorName: string;
  paymentAmount: number;
  remainingAmount: number;
  date?: string;
  note?: string;
}) {
  const dateStr = date || new Date().toISOString().split('T')[0];
  const isFullySettled = remainingAmount <= 0;

  const msg = 
`*💳 إشعار تسديد دفعة - ${storeName}*
━━━━━━━━━━━━━━━━━
👤 *الزبون:* ${debtorName}
📅 *التاريخ:* ${dateStr}

💰 *المبلغ المسدد:* ${paymentAmount.toLocaleString('ar-IQ')} د.ع
${note ? `📝 *بيان الدفعة:* ${note}\n` : ''}
━━━━━━━━━━━━━━━━━
${
  isFullySettled
    ? `✅ *تم تسديد كامل الحساب بنجاح! الرصيد المتبقي: 0 د.ع*`
    : `🟢 *المبلغ المتبقي الصافي بذمتكم:* ${remainingAmount.toLocaleString('ar-IQ')} د.ع`
}

نشكر لكم التزامكم وحسن تعاملكم 🙏`;

  openWhatsAppMessage(phone, msg);
}

/**
 * Send full debt statement summary via WhatsApp.
 */
export function sendFullStatementWhatsAppNotification({
  phone,
  storeName,
  debtorName,
  totalPurchases,
  totalPaid,
  remainingAmount,
  items,
}: {
  phone?: string;
  storeName: string;
  debtorName: string;
  totalPurchases: number;
  totalPaid: number;
  remainingAmount: number;
  items?: Array<{ itemDescription: string; amount: number; date?: string }>;
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const itemsSummary = (items || []).slice(0, 10).map((it, idx) => 
    `${idx + 1}. ${it.itemDescription} (${it.amount.toLocaleString('ar-IQ')} د.ع) - ${it.date || ''}`
  ).join('\n');

  const msg = 
`*📋 كشف حساب تفصيلي - ${storeName}*
━━━━━━━━━━━━━━━━━
👤 *الزبون:* ${debtorName}
📅 *تاريخ الكشف:* ${todayStr}

🛒 *إجمالي المشتريات:* ${totalPurchases.toLocaleString('ar-IQ')} د.ع
💳 *إجمالي المسدد:* ${totalPaid.toLocaleString('ar-IQ')} د.ع
━━━━━━━━━━━━━━━━━
${
  remainingAmount <= 0
    ? `✅ *الحساب مسدد بالكامل (المتبقي: 0 د.ع)*`
    : `🔴 *المبلغ المتبقي الصافي المطلوب:* ${remainingAmount.toLocaleString('ar-IQ')} د.ع`
}
${itemsSummary ? `\n*تفاصيل أحدث المشتريات:*\n${itemsSummary}\n` : ''}
شكراً لتعاملكم معنا 🙏`;

  openWhatsAppMessage(phone, msg);
}

/**
 * Send WhatsApp notification for POS Cash Sale Receipt.
 */
export function sendCashSaleReceiptWhatsAppNotification({
  phone,
  storeName,
  storePhone,
  customerName,
  invoiceNumber,
  items,
  subtotalAmount,
  discountAmount,
  totalAmount,
  date,
  time,
}: {
  phone?: string;
  storeName: string;
  storePhone?: string;
  customerName?: string;
  invoiceNumber: string;
  items: Array<{ name: string; price: number; quantity: number; subtotal?: number }>;
  subtotalAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  date?: string;
  time?: string;
}) {
  const dateStr = date || new Date().toLocaleDateString('ar-IQ');
  const timeStr = time ? ` • ${time}` : '';
  const custName = customerName || 'زبون نقدي عام';

  const itemsList = items.map((it, idx) => {
    const itemSubtotal = it.subtotal || it.price * it.quantity;
    return `${idx + 1}. *${it.name}* \n   الكمية: ${it.quantity} × ${it.price.toLocaleString('ar-IQ')} = ${itemSubtotal.toLocaleString('ar-IQ')} د.ع`;
  }).join('\n');

  const msg = 
`*🧾 وصل شراء نقدي (فاتورة مبيعات) - ${storeName}*
━━━━━━━━━━━━━━━━━
🔢 *رقم الفاتورة:* ${invoiceNumber}
👤 *الزبون:* ${custName}
📅 *التاريخ:* ${dateStr}${timeStr}
${storePhone ? `📞 *هاتف المتجر:* ${storePhone}\n` : ''}━━━━━━━━━━━━━━━━━
*تفاصيل المواد المشتراة:*
${itemsList}
━━━━━━━━━━━━━━━━━
${discountAmount && discountAmount > 0 ? `💵 *المجموع الفرعي:* ${(subtotalAmount || totalAmount + discountAmount).toLocaleString('ar-IQ')} د.ع\n🏷️ *الخصم / التخفيض:* ${discountAmount.toLocaleString('ar-IQ')} د.ع\n` : ''}✅ *المبلغ الصافي المدفوع:* ${totalAmount.toLocaleString('ar-IQ')} د.ع (نقداً)

شكراً لزيارتكم الكريمة لمتجرنا ونتشرف بخدمتكم دائماً 🙏`;

  openWhatsAppMessage(phone, msg);
}

