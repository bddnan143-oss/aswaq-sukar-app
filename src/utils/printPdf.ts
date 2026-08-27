import { Debt, Sale } from '../types';

export interface IndividualStatementOptions {
  storeName: string;
  storePhone?: string;
  storeAddress?: string;
  debt: Debt;
}

export interface FullDebtsReportOptions {
  storeName: string;
  storePhone?: string;
  debts: Debt[];
}

export interface CashSaleReceiptOptions {
  storeName: string;
  storeLogo?: string;
  storePhone?: string;
  storeAddress?: string;
  sale: Sale;
}

/**
 * Common Styles for A4 Arabic Financial Printouts
 */
export const BASE_PRINT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');

  @page {
    size: A4 portrait;
    margin: 10mm 10mm 10mm 10mm;
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  body, .print-doc-wrapper {
    margin: 0;
    padding: 0;
    font-family: 'Cairo', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #0f172a;
    background: #ffffff;
    direction: rtl;
    text-align: right;
    font-size: 12px;
    line-height: 1.5;
  }

  .statement-container {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    padding: 16px 20px;
    background: #ffffff;
  }

  .header-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #0f172a;
    padding-bottom: 12px;
    margin-bottom: 14px;
  }

  .header-right h1 {
    margin: 0 0 4px 0;
    font-size: 20px;
    font-weight: 900;
    color: #0f172a;
  }

  .header-right p {
    margin: 0;
    font-size: 11px;
    color: #475569;
    font-weight: 600;
  }

  .header-left {
    text-align: left;
    direction: ltr;
  }

  .platform-badge {
    display: inline-block;
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 800;
    color: #0f172a;
    text-align: right;
    direction: rtl;
  }

  .platform-badge small {
    display: block;
    font-size: 9px;
    color: #64748b;
    font-weight: 600;
  }

  .doc-title-bar {
    background: #0f172a;
    color: #ffffff;
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 800;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 14px;
  }

  .meta-item label {
    display: block;
    font-size: 10px;
    color: #64748b;
    font-weight: 700;
    margin-bottom: 2px;
  }

  .meta-item value, .meta-item div {
    display: block;
    font-size: 12px;
    color: #0f172a;
    font-weight: 800;
  }

  .summary-cards-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 14px;
  }

  .summary-card {
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  .summary-card.purchases {
    background: #eff6ff;
    border-color: #bfdbfe;
  }

  .summary-card.paid {
    background: #f0fdf4;
    border-color: #bbf7d0;
  }

  .summary-card.due {
    background: #fff1f2;
    border-color: #fecdd3;
  }

  .summary-card label {
    display: block;
    font-size: 10px;
    font-weight: 700;
    color: #475569;
    margin-bottom: 4px;
  }

  .summary-card .amount {
    font-size: 15px;
    font-weight: 900;
  }

  .summary-card.purchases .amount { color: #1d4ed8; }
  .summary-card.paid .amount { color: #15803d; }
  .summary-card.due .amount { color: #b91c1c; }

  table.data-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 14px;
    font-size: 11px;
  }

  table.data-table th {
    background: #f1f5f9;
    color: #1e293b;
    font-weight: 800;
    padding: 7px 10px;
    border: 1px solid #cbd5e1;
    text-align: right;
  }

  table.data-table td {
    padding: 6px 10px;
    border: 1px solid #e2e8f0;
    color: #334155;
    vertical-align: middle;
  }

  table.data-table tr:nth-child(even) td {
    background: #fafafa;
  }

  table.data-table tr.highlight-total td {
    background: #f8fafc;
    font-weight: 800;
    border-top: 2px solid #0f172a;
  }

  .badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 700;
  }

  .badge-purchase {
    background: #dbeafe;
    color: #1e40af;
  }

  .badge-payment {
    background: #dcfce7;
    color: #166534;
  }

  .status-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 800;
  }

  .status-paid { background: #dcfce7; color: #166534; }
  .status-partial { background: #dbeafe; color: #1e40af; }
  .status-unpaid { background: #fee2e2; color: #991b1b; }

  .footer-signatures {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 40px;
    margin-top: 24px;
    padding-top: 12px;
    border-top: 1px dashed #cbd5e1;
  }

  .sign-col {
    text-align: center;
  }

  .sign-col p {
    margin: 0 0 32px 0;
    font-size: 11px;
    font-weight: 700;
    color: #475569;
  }

  .sign-line {
    width: 70%;
    margin: 0 auto;
    border-bottom: 1px solid #94a3b8;
  }

  .system-watermark {
    margin-top: 16px;
    text-align: center;
    font-size: 9px;
    color: #94a3b8;
    border-top: 1px solid #f1f5f9;
    padding-top: 8px;
  }
`;

/**
 * Generate HTML string for Individual Debtor Statement
 */
export function generateIndividualStatementHtml({
  storeName,
  storePhone = 'غير متوفر',
  storeAddress = 'قلعة سكر',
  debt,
}: IndividualStatementOptions): string {
  const printDate = new Date().toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const printTime = new Date().toLocaleTimeString('ar-IQ', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isFullyPaid = debt.remainingAmount <= 0;
  const isPartial = debt.paidAmount > 0 && debt.remainingAmount > 0;

  const statusLabel = isFullyPaid
    ? 'مسدد بالكامل ✓'
    : isPartial
    ? 'مسدد جزئياً'
    : 'غير مسدد (مطلوب)';

  const statusClass = isFullyPaid
    ? 'status-paid'
    : isPartial
    ? 'status-partial'
    : 'status-unpaid';

  const items = Array.isArray(debt.items) ? debt.items : [];
  const payments = Array.isArray(debt.payments) ? debt.payments : [];

  let runningBalance = 0;
  const combinedTransactions: Array<{
    date: string;
    type: 'purchase' | 'payment';
    description: string;
    debit: number;
    credit: number;
    balance: number;
    notes?: string;
  }> = [];

  items.forEach((item) => {
    combinedTransactions.push({
      date: item.date || debt.date || '',
      type: 'purchase',
      description: item.itemDescription || 'مشتريات',
      debit: item.amount,
      credit: 0,
      balance: 0,
      notes: item.notes || '',
    });
  });

  payments.forEach((pay) => {
    combinedTransactions.push({
      date: pay.date || '',
      type: 'payment',
      description: pay.note || 'تسديد دفعة نقدية',
      debit: 0,
      credit: pay.amount,
      balance: 0,
      notes: '',
    });
  });

  combinedTransactions.sort((a, b) => (a.date > b.date ? 1 : -1));

  combinedTransactions.forEach((tx) => {
    runningBalance += tx.debit - tx.credit;
    tx.balance = runningBalance;
  });

  const tableRowsHtml =
    combinedTransactions.length === 0
      ? `<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding: 18px;">لا توجد حركات مسجلة في هذا السجل</td></tr>`
      : combinedTransactions
          .map(
            (tx, index) => `
        <tr>
          <td style="text-align: center; width: 35px; font-weight: 700;">${index + 1}</td>
          <td style="width: 90px; font-weight: 600;">${tx.date || '—'}</td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${tx.description}</div>
            ${tx.notes ? `<div style="font-size: 10px; color: #64748b;">${tx.notes}</div>` : ''}
          </td>
          <td style="width: 80px; text-align: center;">
            <span class="badge ${tx.type === 'purchase' ? 'badge-purchase' : 'badge-payment'}">
              ${tx.type === 'purchase' ? 'شراء (+)' : 'تسديد (-)'}
            </span>
          </td>
          <td style="width: 100px; text-align: left; font-weight: 700; color: ${
            tx.type === 'purchase' ? '#1e40af' : '#15803d'
          };">
            ${(tx.type === 'purchase' ? tx.debit : tx.credit).toLocaleString('ar-IQ')} د.ع
          </td>
          <td style="width: 105px; text-align: left; font-weight: 800; color: #0f172a; background: #f8fafc;">
            ${tx.balance.toLocaleString('ar-IQ')} د.ع
          </td>
        </tr>
      `
          )
          .join('');

  return `
    <div class="statement-container print-doc-wrapper">
      <!-- TOP HEADER -->
      <div class="header-box">
        <div class="header-right">
          <h1>${storeName}</h1>
          <p>هاتف المتجر: <span dir="ltr">${storePhone}</span> | الموقع: ${storeAddress}</p>
        </div>
        <div class="header-left">
          <div class="platform-badge">
            منصة أسواق قلعة سكر
            <small>سجل الديون والمحاسبة الإلكترونية</small>
          </div>
        </div>
      </div>

      <!-- DOCUMENT TITLE BAR -->
      <div class="doc-title-bar">
        <span>كشف حساب مالي تفصيلي (سجل الديون)</span>
        <span style="font-size: 11px; font-weight: 600;">رقم السجل: #${debt.id.slice(-6).toUpperCase()}</span>
      </div>

      <!-- DEBTOR & PRINT METADATA -->
      <div class="meta-grid">
        <div class="meta-item">
          <label>اسم الزبون (المدين):</label>
          <div>${debt.debtorName}</div>
        </div>
        <div class="meta-item">
          <label>رقم هاتف الزبون:</label>
          <div dir="ltr" style="text-align: right;">${debt.debtorPhone || 'غير مسجل'}</div>
        </div>
        <div class="meta-item">
          <label>حالة الحساب الحالية:</label>
          <div>
            <span class="status-tag ${statusClass}">${statusLabel}</span>
          </div>
        </div>
        <div class="meta-item">
          <label>تاريخ إصدار الكشف:</label>
          <div>${printDate} (${printTime})</div>
        </div>
        <div class="meta-item">
          <label>تاريخ فتح الحساب:</label>
          <div>${debt.date || '—'}</div>
        </div>
        <div class="meta-item">
          <label>إجمالي الحركات:</label>
          <div>${combinedTransactions.length} حركة مسجلة</div>
        </div>
      </div>

      <!-- SUMMARY FINANCIAL TILES -->
      <div class="summary-cards-grid">
        <div class="summary-card purchases">
          <label>إجمالي المشتريات الآجلة</label>
          <div class="amount">${debt.amount.toLocaleString('ar-IQ')} <small style="font-size: 10px;">د.ع</small></div>
        </div>
        <div class="summary-card paid">
          <label>إجمالي المبالغ المسددة</label>
          <div class="amount">${debt.paidAmount.toLocaleString('ar-IQ')} <small style="font-size: 10px;">د.ع</small></div>
        </div>
        <div class="summary-card due">
          <label>صافي المبلغ المتبقي المطلوب</label>
          <div class="amount">${debt.remainingAmount.toLocaleString('ar-IQ')} <small style="font-size: 10px;">د.ع</small></div>
        </div>
      </div>

      <!-- TRANSACTIONS LEDGER TABLE -->
      <table class="data-table">
        <thead>
          <tr>
            <th style="text-align: center; width: 35px;">#</th>
            <th style="width: 90px;">التاريخ</th>
            <th>بيان المادة / الحركة</th>
            <th style="width: 80px; text-align: center;">النوع</th>
            <th style="width: 100px; text-align: left;">المبلغ (د.ع)</th>
            <th style="width: 105px; text-align: left;">الرصيد التراكمي</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
        <tfoot>
          <tr class="highlight-total">
            <td colspan="4" style="text-align: right; font-size: 12px;">المجموع النهائي للمبلغ المتبقي بذمة الزبون:</td>
            <td colspan="2" style="text-align: left; font-size: 13px; font-weight: 900; color: ${
              debt.remainingAmount > 0 ? '#b91c1c' : '#15803d'
            };">
              ${debt.remainingAmount.toLocaleString('ar-IQ')} دينار عراقي
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- SIGNATURES BLOCK -->
      <div class="footer-signatures">
        <div class="sign-col">
          <p>توقيع وختم المتجر / الدائن</p>
          <div class="sign-line"></div>
        </div>
        <div class="sign-col">
          <p>توقيع واستلام الزبون / المدين</p>
          <div class="sign-line"></div>
        </div>
      </div>

      <!-- FOOTER / WATERMARK -->
      <div class="system-watermark">
        تم استخراج هذا الكشف آلياً عبر منصة <strong>أسواق قلعة سكر</strong> • تاريخ الاستخراج: ${printDate} - ${printTime}
      </div>
    </div>
  `;
}

/**
 * Generate HTML string for Full Debts Summary Report
 */
export function generateFullDebtsReportHtml({
  storeName,
  storePhone = 'غير متوفر',
  debts,
}: FullDebtsReportOptions): string {
  const printDate = new Date().toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const printTime = new Date().toLocaleTimeString('ar-IQ', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalPurchases = debts.reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalPaid = debts.reduce((sum, d) => sum + (d.paidAmount || 0), 0);
  const totalRemaining = debts.reduce((sum, d) => sum + (d.remainingAmount || 0), 0);

  const totalDebtorsCount = debts.length;
  const unpaidCount = debts.filter((d) => d.status === 'unpaid').length;
  const partialCount = debts.filter((d) => d.status === 'partially_paid').length;
  const paidCount = debts.filter((d) => d.status === 'paid').length;

  const rowsHtml =
    debts.length === 0
      ? `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 20px;">لا توجد أي سجلات ديون مسجلة</td></tr>`
      : debts
          .map((d, index) => {
            const isPaid = d.status === 'paid';
            const isPartial = d.status === 'partially_paid';
            const statusText = isPaid
              ? 'مسدد بالكامل'
              : isPartial
              ? 'مسدد جزئياً'
              : 'غير مسدد';
            const statusClass = isPaid
              ? 'status-paid'
              : isPartial
              ? 'status-partial'
              : 'status-unpaid';

            return `
        <tr>
          <td style="text-align: center; width: 35px; font-weight: 700;">${index + 1}</td>
          <td style="font-weight: 800; color: #0f172a;">${d.debtorName}</td>
          <td dir="ltr" style="text-align: right; width: 105px; font-family: monospace; font-size: 10px;">
            ${d.debtorPhone || '—'}
          </td>
          <td style="width: 100px; text-align: left; color: #1e40af; font-weight: 700;">
            ${d.amount.toLocaleString('ar-IQ')} د.ع
          </td>
          <td style="width: 100px; text-align: left; color: #15803d; font-weight: 700;">
            ${d.paidAmount.toLocaleString('ar-IQ')} د.ع
          </td>
          <td style="width: 110px; text-align: left; color: ${
            d.remainingAmount > 0 ? '#b91c1c' : '#15803d'
          }; font-weight: 900; background: #fff1f2;">
            ${d.remainingAmount.toLocaleString('ar-IQ')} د.ع
          </td>
          <td style="width: 85px; text-align: center;">
            <span class="status-tag ${statusClass}">${statusText}</span>
          </td>
        </tr>
      `;
          })
          .join('');

  return `
    <div class="statement-container print-doc-wrapper">
      <!-- TOP HEADER -->
      <div class="header-box">
        <div class="header-right">
          <h1>${storeName}</h1>
          <p>هاتف المتجر: <span dir="ltr">${storePhone}</span> | تقرير الديون الإجمالي</p>
        </div>
        <div class="header-left">
          <div class="platform-badge">
            منصة أسواق قلعة سكر
            <small>نظام التقارير المالية الموحدة</small>
          </div>
        </div>
      </div>

      <!-- DOCUMENT TITLE BAR -->
      <div class="doc-title-bar">
        <span>تقرير الموقف المالي العام لكافة الديون وحسابات الزبائن</span>
        <span style="font-size: 11px; font-weight: 600;">تاريخ التقرير: ${printDate}</span>
      </div>

      <!-- SUMMARY TILES -->
      <div class="summary-cards-grid" style="grid-template-columns: repeat(4, 1fr);">
        <div class="summary-card due">
          <label>إجمالي الديون المطلوبة (الصافي)</label>
          <div class="amount">${totalRemaining.toLocaleString('ar-IQ')} <small style="font-size: 10px;">د.ع</small></div>
        </div>
        <div class="summary-card purchases">
          <label>إجمالي المبيعات الآجلة</label>
          <div class="amount">${totalPurchases.toLocaleString('ar-IQ')} <small style="font-size: 10px;">د.ع</small></div>
        </div>
        <div class="summary-card paid">
          <label>إجمالي المبالغ المسددة</label>
          <div class="amount">${totalPaid.toLocaleString('ar-IQ')} <small style="font-size: 10px;">د.ع</small></div>
        </div>
        <div class="summary-card" style="background: #f8fafc; border-color: #cbd5e1;">
          <label>إجمالي الزبائن المدينين</label>
          <div class="amount" style="color: #0f172a;">${totalDebtorsCount} <small style="font-size: 10px;">سجل</small></div>
        </div>
      </div>

      <!-- DEBTORS STATUS METRICS ROW -->
      <div class="meta-grid" style="margin-bottom: 14px; padding: 8px 14px;">
        <div class="meta-item">
          <label>حسابات غير مسددة بالكامل:</label>
          <div style="color: #b91c1c;">${unpaidCount} زبون</div>
        </div>
        <div class="meta-item">
          <label>حسابات مسددة جزئياً:</label>
          <div style="color: #1d4ed8;">${partialCount} زبون</div>
        </div>
        <div class="meta-item">
          <label>حسابات مسددة بالكامل:</label>
          <div style="color: #15803d;">${paidCount} زبون (مسدد ✓)</div>
        </div>
      </div>

      <!-- FULL DEBTORS TABLE -->
      <table class="data-table">
        <thead>
          <tr>
            <th style="text-align: center; width: 35px;">#</th>
            <th>اسم الزبون (المدين)</th>
            <th style="width: 105px;">رقم الهاتف</th>
            <th style="width: 100px; text-align: left;">إجمالي الشراء</th>
            <th style="width: 100px; text-align: left;">المبلغ المسدد</th>
            <th style="width: 110px; text-align: left;">المتبقي المطلوب</th>
            <th style="width: 85px; text-align: center;">الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr class="highlight-total">
            <td colspan="3" style="text-align: right; font-size: 12px;">المجموع الإجمالي لكافة الحسابات والديون:</td>
            <td style="text-align: left; font-size: 12px; font-weight: 800; color: #1e40af;">
              ${totalPurchases.toLocaleString('ar-IQ')} د.ع
            </td>
            <td style="text-align: left; font-size: 12px; font-weight: 800; color: #15803d;">
              ${totalPaid.toLocaleString('ar-IQ')} د.ع
            </td>
            <td style="text-align: left; font-size: 13px; font-weight: 900; color: #b91c1c; background: #fee2e2;">
              ${totalRemaining.toLocaleString('ar-IQ')} د.ع
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <!-- SIGNATURE BLOCK -->
      <div class="footer-signatures" style="margin-top: 26px;">
        <div class="sign-col">
          <p>توقيع صاحب المتجر / الإدارة المالية</p>
          <div class="sign-line"></div>
        </div>
        <div class="sign-col">
          <p>ختم المتجر الرسمي</p>
          <div class="sign-line"></div>
        </div>
      </div>

      <!-- SYSTEM FOOTER -->
      <div class="system-watermark">
        تم استخراج هذا التقرير المالي تلقائياً عبر منصة <strong>أسواق قلعة سكر</strong> • ${printDate} - ${printTime}
      </div>
    </div>
  `;
}

/**
 * Direct print triggering on Mobile & Desktop using in-DOM mounting
 */
export function triggerDirectPrint(innerHtml: string, documentTitle = 'تقرير_الديون') {
  console.log('[PrintEngine] Triggering direct print for:', documentTitle);

  try {
    // 1. Ensure print root container exists
    let printRoot = document.getElementById('print-root-container');
    if (!printRoot) {
      printRoot = document.createElement('div');
      printRoot.id = 'print-root-container';
      document.body.appendChild(printRoot);
    }

    // 2. Set content
    printRoot.innerHTML = innerHtml;

    // 3. Set temporary page title for save-as-pdf dialog filename
    const originalTitle = document.title;
    document.title = documentTitle;

    // 4. Trigger print
    window.focus();
    setTimeout(() => {
      window.print();
      // Restore title after print dialog closes
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }, 150);
  } catch (err) {
    console.error('[PrintEngine] Error triggering window.print:', err);
    // Fallback: download standalone HTML document
    downloadHtmlDocument(innerHtml, documentTitle);
  }
}

/**
 * Download Standalone HTML document for offline printing or archiving
 */
export function downloadHtmlDocument(innerHtml: string, filename = 'تقرير_الديون') {
  console.log('[PrintEngine] Downloading HTML report:', filename);
  try {
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${filename}</title>
          <style>${BASE_PRINT_CSS}</style>
        </head>
        <body>
          ${innerHtml}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.html`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 500);
  } catch (err) {
    console.error('[PrintEngine] Failed to download HTML file:', err);
  }
}

/**
 * 1. Individual Debt Statement Handler
 */
export function printIndividualDebtStatement(options: IndividualStatementOptions) {
  const html = generateIndividualStatementHtml(options);
  const docTitle = `كشف_حساب_${options.debt.debtorName}_${options.storeName}`;
  triggerDirectPrint(html, docTitle);
}

/**
 * 2. Full Debts Report Handler
 */
export function printFullDebtsReport(options: FullDebtsReportOptions) {
  console.log('[printFullDebtsReport] Called with debts count:', options.debts?.length);
  const html = generateFullDebtsReportHtml(options);
  const docTitle = `تقرير_الديون_الكلي_${options.storeName}`;
  triggerDirectPrint(html, docTitle);
}

/**
 * Generate HTML string for Instant Cash Sale Receipt (وصل شراء نقدي / كاشير)
 */
export function generateCashSaleReceiptHtml({
  storeName,
  storeLogo,
  storePhone = 'غير متوفر',
  storeAddress = 'قلعة سكر',
  sale,
}: CashSaleReceiptOptions): string {
  const printDate = new Date().toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const printTime = new Date().toLocaleTimeString('ar-IQ', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const invoiceNumber = `POS-${sale.id.slice(-6).toUpperCase()}`;
  const subtotal = sale.subtotalAmount || (sale.totalAmount + (sale.discountAmount || 0));
  const discount = sale.discountAmount || 0;
  const netTotal = sale.totalAmount;

  const itemsRows = (sale.items || []).map((it, idx) => {
    const itemSubtotal = it.subtotal || (it.price * it.quantity);
    return `
      <tr>
        <td style="text-align: center; font-weight: bold; color: #64748b;">${idx + 1}</td>
        <td style="font-weight: 700; color: #0f172a;">${it.name}</td>
        <td style="text-align: left; font-weight: 600;">${it.price.toLocaleString('ar-IQ')} <small>د.ع</small></td>
        <td style="text-align: center; font-weight: bold; color: #0369a1;">${it.quantity}</td>
        <td style="text-align: left; font-weight: 800; color: #0f172a;">${itemSubtotal.toLocaleString('ar-IQ')} <small>د.ع</small></td>
      </tr>
    `;
  }).join('');

  return `
    <div class="print-doc-wrapper" style="max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 16px;">
      <!-- STORE HEADER -->
      <div class="header-section" style="border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 16px;">
        <div class="header-right">
          ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" class="store-logo" style="width: 54px; height: 54px; border-radius: 12px; object-fit: cover;" />` : ''}
          <div>
            <h1 style="font-size: 20px; font-weight: 900; margin: 0; color: #0f172a;">${storeName}</h1>
            <p style="font-size: 11px; margin: 2px 0 0 0; color: #64748b;">هاتف: <span dir="ltr">${storePhone}</span> | ${storeAddress}</p>
          </div>
        </div>
        <div class="header-left">
          <div class="platform-badge" style="background: #ecfdf5; border-color: #a7f3d0; color: #065f46;">
            وصل شراء نقدي (كاشير)
            <small>فاتورة مبيعات مباشرة</small>
          </div>
        </div>
      </div>

      <!-- INVOICE META GRID -->
      <div class="meta-grid" style="grid-template-columns: repeat(2, 1fr); margin-bottom: 16px; background: #f8fafc; border-radius: 12px; padding: 12px 16px;">
        <div class="meta-item">
          <label>رقم الفاتورة:</label>
          <div style="font-weight: 800; color: #0284c7;">#${invoiceNumber}</div>
        </div>
        <div class="meta-item">
          <label>تاريخ وتوقيت البيع:</label>
          <div style="font-size: 11px;">${printDate} • ${printTime}</div>
        </div>
        <div class="meta-item">
          <label>اسم الزبون:</label>
          <div style="font-weight: 700;">${sale.customerName || 'زبون نقدي عام'}</div>
        </div>
        <div class="meta-item">
          <label>طريقة الدفع:</label>
          <div><span class="status-tag status-paid">نقداً (كاش) ✓</span></div>
        </div>
        ${sale.customerPhone ? `
        <div class="meta-item" style="grid-column: span 2;">
          <label>هاتف الزبون:</label>
          <div dir="ltr" style="text-align: right;">${sale.customerPhone}</div>
        </div>
        ` : ''}
      </div>

      <!-- ITEMS TABLE -->
      <table class="data-table" style="margin-bottom: 16px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="width: 30px; text-align: center;">#</th>
            <th>المادة المباعة</th>
            <th style="width: 90px; text-align: left;">السعر</th>
            <th style="width: 50px; text-align: center;">الكمية</th>
            <th style="width: 100px; text-align: left;">المجموع</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- FINANCIAL SUMMARY BLOCK -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #475569; margin-bottom: 6px;">
          <span>المجموع الفرعي للمواد:</span>
          <span style="font-weight: 700;">${subtotal.toLocaleString('ar-IQ')} د.ع</span>
        </div>
        ${discount > 0 ? `
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #dc2626; margin-bottom: 6px;">
          <span>الخصم / التخفيض:</span>
          <span style="font-weight: 700;">- ${discount.toLocaleString('ar-IQ')} د.ع</span>
        </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px dashed #cbd5e1; padding-top: 10px; margin-top: 8px;">
          <span style="font-size: 14px; font-weight: 900; color: #0f172a;">المبلغ الصافي المدفوع:</span>
          <span style="font-size: 18px; font-weight: 900; color: #059669; font-family: monospace;">
            ${netTotal.toLocaleString('ar-IQ')} <small style="font-size: 12px; font-family: 'Cairo';">دينار عراقي</small>
          </span>
        </div>
      </div>

      <!-- THANK YOU & WATERMARK -->
      <div style="text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 14px;">
        <p style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0;">✨ شكراً لزيارتكم ونتشرف بخدمتكم دائماً ✨</p>
        <p style="font-size: 10px; color: #94a3b8; margin: 0;">منصة أسواق قلعة سكر • نظام الكاشير ونقاط البيع السريعة</p>
      </div>
    </div>
  `;
}

/**
 * 3. Cash Sale Receipt Handler
 */
export function printCashSaleReceipt(options: CashSaleReceiptOptions) {
  const html = generateCashSaleReceiptHtml(options);
  const docTitle = `وصل_شراء_نقدي_${options.sale.id.slice(-6).toUpperCase()}_${options.storeName}`;
  triggerDirectPrint(html, docTitle);
}

