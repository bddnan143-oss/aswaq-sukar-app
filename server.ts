import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
// @ts-ignore
import { ZipArchive } from 'archiver';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { User, Store, Product, Order, Debt, Sale, Subscription, ActivationCode } from './src/types';

// Extended request with user payload
interface AuthenticatedRequest extends Request {
  user?: User;
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Simple Token / User header middleware to support real authentication
const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const userHeader = req.headers['x-user-id'] as string;

  if (userHeader) {
    const user = db.findUserById(userHeader);
    if (user && user.status === 'active') {
      req.user = user;
      return next();
    }
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const tokenOrId = authHeader.replace('Bearer ', '').trim();
    const user = db.findUserById(tokenOrId);
    if (user && user.status === 'active') {
      req.user = user;
      return next();
    }
  }

  next();
};

app.use(authMiddleware);

// Role authorization helpers
const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول أولاً للمتابعة.' });
  }
  if (req.user.status !== 'active') {
    return res.status(403).json({ error: 'هذا الحساب معطل حالياً من قِبل إدارة المنصة.' });
  }
  next();
};

const requireRole = (role: User['role']) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'يرجى تسجيل الدخول أولاً للمتابعة.' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'ليس لديك الصلاحيات الكافية لتنفيذ هذا الإجراء.' });
    }
    next();
  };
};

/* =========================================================================
   1. AUTHENTICATION & REGISTRATION ENDPOINTS
   ========================================================================= */

// Check if Super Admin account has already been initialized
app.get('/api/auth/admin-status', (req: Request, res: Response) => {
  res.json({
    isSuperAdminInitialized: db.isSuperAdminInitialized()
  });
});

// Secure Setup for the First Super Admin Only (Cannot be called once initialized)
app.post('/api/auth/setup-initial-admin', (req: Request, res: Response) => {
  const { name, phone, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور للمدير الرئيسي.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'يجب أن لا تقل كلمة المرور عن 6 أحرف/أرقام.' });
  }

  const result = db.setupInitialSuperAdmin({
    name: name?.trim() || 'المدير الرئيسي للمنصة',
    phone: phone?.trim() || '07801234567',
    email: email.trim().toLowerCase(),
    password
  });

  if (!result.success) {
    return res.status(403).json({ error: result.message });
  }

  res.status(201).json({
    message: result.message,
    user: result.user
  });
});

// Register Customer (Open & Free)
app.post('/api/auth/register-customer', (req: Request, res: Response) => {
  const { name, phone, email, password } = req.body;

  if (!name || !phone || !email || !password) {
    return res.status(400).json({ error: 'يرجى إدخال جميع الحقول المطلوبة (الاسم، الهاتف، البريد، كلمة المرور).' });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'البريد الإلكتروني مسجل مسبقاً في النظام.' });
  }

  const newUser = {
    id: 'usr_' + Date.now(),
    name: name.trim(),
    phone: phone.trim(),
    email: email.trim().toLowerCase(),
    role: 'customer' as const,
    status: 'active' as const,
    createdAt: new Date().toISOString()
  };

  const createdUser = db.addUser(newUser, password);

  res.status(201).json({
    message: 'تم إنشاء حساب الزبون بنجاح.',
    user: createdUser
  });
});

// Register Store Owner (Strictly Requires Valid Activation Code)
app.post('/api/auth/register-store-owner', (req: Request, res: Response) => {
  const { name, phone, email, password, storeName, category, address, activationCode } = req.body;

  if (!name || !phone || !email || !password || !storeName || !activationCode) {
    return res.status(400).json({ 
      error: 'يرجى إدخال جميع البيانات المطلوبة بما فيها رمز تفعيل صاحب المتجر.' 
    });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'البريد الإلكتروني مسجل مسبقاً في النظام.' });
  }

  const storeId = 'store_' + Date.now();
  const userId = 'usr_' + Date.now();

  // Validate and consume code atomically
  const codeValidation = db.validateAndConsumeCode(activationCode, storeId, storeName);
  if (!codeValidation.valid) {
    return res.status(400).json({ error: codeValidation.message || 'رمز التفعيل غير صالح.' });
  }

  const newStore: Store = {
    id: storeId,
    ownerId: userId,
    ownerName: name.trim(),
    name: storeName.trim(),
    logo: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
    category: category || 'عام ومواد غذائية',
    description: `متجر ${storeName} لخدمة أهالي قلعة سكر الكرام.`,
    phone: phone.trim(),
    workingHours: '8:00 ص - 10:00 م',
    address: address || 'قلعة سكر - السوق الداخلي',
    location: {
      lat: 31.8596 + (Math.random() - 0.5) * 0.005,
      lng: 46.0683 + (Math.random() - 0.5) * 0.005,
      addressName: address || 'قلعة سكر'
    },
    subscriptionStatus: 'active',
    subscriptionEndDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    status: 'active',
    createdAt: new Date().toISOString()
  };

  const newUser = {
    id: userId,
    name: name.trim(),
    phone: phone.trim(),
    email: email.trim().toLowerCase(),
    role: 'store_owner' as const,
    storeId: storeId,
    status: 'active' as const,
    createdAt: new Date().toISOString()
  };

  db.addStore(newStore);
  const createdUser = db.addUser(newUser, password);

  // Create initial subscription record
  db.addSubscription({
    id: 'sub_' + Date.now(),
    storeId: storeId,
    storeName: newStore.name,
    ownerName: createdUser.name,
    planName: 'باقة الانطلاق الترحيبية',
    price: 0,
    durationMonths: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: newStore.subscriptionEndDate!,
    status: 'active',
    createdAt: new Date().toISOString()
  });

  res.status(201).json({
    message: 'تم تفعيل المتجر وإنشاء الحساب بنجاح.',
    user: createdUser,
    store: newStore
  });
});

// Login (Customer, Store Owner, Super Admin with Bcrypt Verification)
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' });
  }

  const userWithAuth = db.findUserByEmailWithAuth(email);
  if (!userWithAuth) {
    return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
  }

  // Verify bcrypt password hash
  const isMatch = db.comparePassword(password, userWithAuth.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
  }

  if (userWithAuth.status !== 'active') {
    return res.status(403).json({ error: 'تم تعطيل هذا الحساب. يرجى التواصل مع إدارة المنصة.' });
  }

  const user = db.getSanitizedUser(userWithAuth);
  let store: Store | null = null;
  if (user.role === 'store_owner' && user.storeId) {
    store = db.findStoreById(user.storeId) || null;
  }

  res.json({
    message: 'تم تسجيل الدخول بنجاح.',
    user,
    store
  });
});

// Request Password Reset
app.post('/api/auth/request-reset', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني.' });
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'لم يتم العثور على حساب مسجل بهذا البريد.' });
  }

  const resetToken = db.createPasswordResetToken(email);
  const resetLink = `/reset-password?token=${resetToken}`;

  res.json({
    message: 'تم توليد رابط استعادة كلمة المرور بنجاح.',
    resetToken,
    resetLink,
    email: user.email
  });
});

// Reset Password with Token
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'الرمز وكلمة المرور الجديدة مطلوبان.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'يجب أن لا تقل كلمة المرور عن 6 أحرف/أرقام.' });
  }

  const result = db.verifyAndResetPassword(token, newPassword);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.json({ message: result.message });
});

/* =========================================================================
   2. PUBLIC & CUSTOMER ENDPOINTS
   ========================================================================= */

// Get all active stores (Active subscription, not paused/deleted)
app.get('/api/stores', (req: Request, res: Response) => {
  const activeStores = db.getActiveCustomerStores();
  res.json({ stores: activeStores });
});

// Get single store details + its available products
app.get('/api/stores/:id', (req: Request, res: Response) => {
  const storeId = req.params.id;
  const store = db.findStoreById(storeId);

  if (!store || store.status !== 'active' || store.subscriptionStatus !== 'active') {
    return res.status(404).json({ error: 'المتجر غير متوفر حالياً أو انتهى اشتراكه.' });
  }

  const products = db.getProducts(storeId).filter(p => p.isAvailable);
  res.json({ store, products });
});

// Global Product Search & Price Comparison across all active stores
app.get('/api/products/search', (req: Request, res: Response) => {
  const query = ((req.query.q as string) || '').trim().toLowerCase();
  const category = req.query.category as string;

  let products = db.getActiveCustomerProducts();

  if (category && category !== 'الكل') {
    products = products.filter(p => p.category.includes(category));
  }

  if (query) {
    products = products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query) ||
      (p.storeName && p.storeName.toLowerCase().includes(query))
    );
  }

  // Group by matching name pattern to enable price comparison insight
  res.json({ products, total: products.length });
});

// Create Customer Order
app.post('/api/orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { storeId, items, notes } = req.body;
  const user = req.user!;

  if (!storeId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'بيانات الطلب غير مكتملة أو السلة فارغة.' });
  }

  const store = db.findStoreById(storeId);
  if (!store || store.status !== 'active' || store.subscriptionStatus !== 'active') {
    return res.status(400).json({ error: 'المتجر المختار غير متاح لاستقبال الطلبات حالياً.' });
  }

  // Calculate order items and total amount
  let totalAmount = 0;
  const orderItems = [];

  for (const itm of items) {
    const prod = db.findProductById(itm.productId);
    if (!prod || prod.storeId !== storeId) {
      return res.status(400).json({ 
        error: 'جميع المنتجات داخل السلة يجب أن تنتمي لنفس المتجر حصراً.' 
      });
    }
    if (prod.stockQuantity < itm.quantity) {
      return res.status(400).json({ 
        error: `الكمية المطلوبة من (${prod.name}) غير متوفرة حالياً في المخزون (المتوفر: ${prod.stockQuantity}).` 
      });
    }

    const price = (prod.isOffer && prod.discountPrice) ? prod.discountPrice : prod.price;
    const subtotal = price * itm.quantity;
    totalAmount += subtotal;

    orderItems.push({
      productId: prod.id,
      productName: prod.name,
      productImage: prod.image,
      price: price,
      quantity: itm.quantity,
      subtotal: subtotal
    });
  }

  const orderNumber = `QS-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder: Order = {
    id: 'ord_' + Date.now(),
    orderNumber,
    customerId: user.id,
    customerName: user.name,
    customerPhone: user.phone,
    storeId: store.id,
    storeName: store.name,
    storePhone: store.phone,
    items: orderItems,
    totalAmount,
    notes: notes || '',
    status: 'new',
    statusHistory: [
      {
        status: 'new',
        timestamp: new Date().toISOString(),
        note: 'تم إرسال الطلب بنجاح وهو بانتظار تأكيد المتجر'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.addOrder(newOrder);

  res.status(201).json({
    message: 'تم إرسال طلبك بنجاح للمتجر. يمكنك متابعة حالة الطلب واستلامه من المحل.',
    order: newOrder
  });
});

// Customer's Orders
app.get('/api/customer/orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const orders = db.getOrders({ customerId: req.user!.id });
  res.json({ orders });
});

/* =========================================================================
   3. STORE OWNER ENDPOINTS (ISOLATED STRICTLY BY storeId)
   ========================================================================= */

// Middleware to verify owner owns a store
const requireStoreOwner = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'store_owner' || !req.user.storeId) {
    return res.status(403).json({ error: 'عذراً، هذا القسم مخصص لأصحاب المتاجر المسجلين فقط.' });
  }

  const store = db.findStoreById(req.user.storeId);
  if (!store) {
    return res.status(404).json({ error: 'لم يتم العثور على المتجر الخاص بحسابك.' });
  }

  next();
};

// Get Store Owner's Store Profile
app.get('/api/owner/store', requireAuth, requireStoreOwner, (req: AuthenticatedRequest, res: Response) => {
  const store = db.findStoreById(req.user!.storeId!);
  const subscription = db.getSubscriptionByStoreId(req.user!.storeId!);
  res.json({ store, subscription });
});

// Update Store Profile & Location
app.put('/api/owner/store', requireAuth, requireStoreOwner, (req: AuthenticatedRequest, res: Response) => {
  const { name, description, phone, workingHours, address, location, logo, banner, category } = req.body;
  const storeId = req.user!.storeId!;

  const updated = db.updateStore(storeId, {
    ...(name && { name: name.trim() }),
    ...(description && { description }),
    ...(phone && { phone }),
    ...(workingHours && { workingHours }),
    ...(address && { address }),
    ...(location && { location }),
    ...(logo && { logo }),
    ...(banner && { banner }),
    ...(category && { category })
  });

  res.json({ message: 'تم تحديث بيانات المتجر والموقع بنجاح.', store: updated });
});

// Get Products (Only this store!)
app.get('/api/owner/products', requireAuth, requireStoreOwner, (req: AuthenticatedRequest, res: Response) => {
  const products = db.getProducts(req.user!.storeId!);
  res.json({ products });
});

// Add Product to Store
app.post('/api/owner/products', requireAuth, requireStoreOwner, (req: AuthenticatedRequest, res: Response) => {
  const { name, description, price, image, category, stockQuantity, minStockAlert, isOffer, discountPrice } = req.body;
  const storeId = req.user!.storeId!;
  const store = db.findStoreById(storeId)!;

  if (!name || price === undefined || stockQuantity === undefined) {
    return res.status(400).json({ error: 'اسم المنتج والسعر والكمية في المخزون مطلوبة.' });
  }

  const newProduct: Product = {
    id: 'prod_' + Date.now(),
    storeId,
    storeName: store.name,
    name: name.trim(),
    description: description || '',
    price: Number(price),
    image: image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80',
    category: category || 'عام',
    stockQuantity: Number(stockQuantity),
    minStockAlert: Number(minStockAlert) || 5,
    isAvailable: Number(stockQuantity) > 0,
    isOffer: Boolean(isOffer),
    discountPrice: discountPrice ? Number(discountPrice) : undefined,
    createdAt: new Date().toISOString()
  };

  db.addProduct(newProduct);
  res.status(201).json({ message: 'تمت إضافة المنتج للمتجر بنجاح.', product: newProduct });
});

// Update Product
app.put('/api/owner/products/:id', requireAuth, requireStoreOwner, (req: AuthenticatedRequest, res: Response) => {
  const productId = req.params.id;
  const storeId = req.user!.storeId!;

  const updated = db.updateProduct(productId, storeId, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'المنتج غير موجود أو لا تملك صلاحية تعديله.' });
  }

  res.json({ message: 'تم تحديث المنتج بنجاح.', product: updated });
});

// Delete Product
app.delete('/api/owner/products/:id', requireAuth, requireStoreOwner, (req: AuthenticatedRequest, res: Response) => {
  const productId = req.params.id;
  const storeId = req.user!.storeId!;

  const success = db.deleteProduct(productId, storeId);
  if (!success) {
    return res.status(404).json({ error: 'المنتج غير موجود أو لا تملك صلاحية حذفه.' });
  }

  res.json({ message: 'تم حذف المنتج بنجاح.' });
});

// Get Store Orders
app.get('/api/owner/orders', requireAuth, requireStoreOwner, (req: AuthenticatedRequest, res: Response) => {
  const orders = db.getOrders({ storeId: req.user!.storeId! });
  res.json({ orders });
});

// Update Store Order Status (new -> preparing -> ready_for_pickup -> completed / cancelled)
app.put('/api/owner/orders/:id/status', requireAuth, requireStoreOwner, (req: AuthenticatedRequest, res: Response) => {
  const orderId = req.params.id;
  const { status, note } = req.body;
  const storeId = req.user!.storeId!;

  const updated = db.updateOrderStatus(orderId, status, note, storeId);
  if (!updated) {
    return res.status(404).json({ error: 'الطلب غير موجود في متجرك.' });
  }

  res.json({ message: 'تم تحديث حالة الطلب بنجاح.', order: updated });
});

// Debts Management (Strictly Isolated by storeId!)
app.get('/api/owner/debts', requireAuth, requireStoreOwner, (req: AuthenticatedRequest, res: Response) => {
  const debts = db.getDebts(req.user!.storeId!);
  res.json({ debts });
});

app.post('/api/owner/debts', requireAuth, requireStoreOwner, (req: AuthenticatedRequest, res: Response) => {
  const { debtorName, debtorPhone, amount, itemDescription, details, notes, date, time } = req.body;
  const storeId = req.user!.storeId!;

  if (!debtorName || !debtorName.trim()) {
    return res.status(400).json({ error: 'يرجى إدخال اسم الشخص المدين.' });
  }

  const now = new Date();
  const entryDate = date || now.toISOString().split('T')[0];
  const entryTime = time || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const numAmount = Number(amount) || 0;
  const desc = itemDescription || details || notes || '';

  const initialItems: any[] = [];
  if (numAmount > 0 && desc) {
    initialItems.push({
      id: 'ditem_' + Date.now(),
      itemDescription: desc.trim(),
      amount: numAmount,
      date: entryDate,
      time: entryTime,
      notes: notes || '',
      createdAt: now.toISOString()
    });
  }

  const newDebt: Debt = {
    id: 'debt_' + Date.now(),
    storeId,
    debtorName: debtorName.trim(),
    debtorPhone: debtorPhone ? debtorPhone.trim() : '',
    amount: numAmount,
    paidAmount: 0,
    remainingAmount: numAmount,
    details: desc,
    date: entryDate,
    status: numAmount === 0 ? 'paid' : 'unpaid',
    items: initialItems,
    payments: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  db.addDebt(newDebt);
  res.status(201).json({ message: 'تم إنشاء سجل المدين بنجاح.', debt: newDebt });
});

// Add Itemized Debt Entry to an existing debtor
app.post('/api/owner/debts/:id/items', requireAuth, requireStoreOwner, (req: AuthenticatedRequest, res: Response) => {
  const debtId = req.params.id;
  const { itemDescription, amount, date, time, notes } = req.body;
  const storeId = req.user!.storeId!;

  if (!itemDescription || !itemDescription.trim()) {
    return res.status(400).json({ error: 'يرجى إدخال بيان المادة / تفاصيل المشتريات.' });
  }

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'يرجى إدخال مبلغ صحيح للمادة (د.ع).' });
  }

  const updated = db.addDebtItem(debtId, storeId, {
    itemDescription,
    amount: Number(amount),
    date,
    time,
    notes
  });

  if (!updated) {
    return res.status(404).json({ error: 'سجل المدين غير موجود في متجرك.' });
  }

  res.status(201).json({ message: 'تمت إضافة حركة الدين للمدين بنجاح.', debt: updated });
});

// Delete an itemized purchase entry
app.delete('/api/owner/debts/:id/items/:itemId', requireAuth, requireStoreOwner, (req: AuthenticatedRequest, res: Response) => {
  const { id: debtId, itemId } = req.params;
  const storeId = req.user!.storeId!;

  const updated = db.deleteDebtItem(debtId, storeId, itemId);
  if (!updated) {
    return res.status(404).json({ error: 'الحركة غير موجودة أو تم حذفها.' });
  }

  res.json({ message: 'تم حذف حركة الشراء وتحديث الرصيد.', debt: updated });
});

// Record Payment / Installment
app.post('/api/owner/debts/:id/pay', requireAuth, requireStoreOwner, (req: AuthenticatedRequest, res: Response) => {
  const debtId = req.params.id;
  const { amount, note, date } = req.body;
  const storeId = req.user!.storeId!;

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'يرجى إدخال مبلغ تسديد صالح.' });
  }

  const updated = db.addDebtPayment(debtId, storeId, Number(amount), note, date);
  if (!updated) {
    return res.status(404).json({ error: 'سجل المدين غير موجود في سجلات متجرك.' });
  }

  res.json({ message: 'تم تسجيل دفعة التسديد وتحديث الرصيد المتبقي.', debt: updated });
});

// Settle Debt in Full
app.post('/api/owner/debts/:id/settle', requireAuth, requireStoreOwner, (req: AuthenticatedRequest, res: Response) => {
  const debtId = req.params.id;
  const { note } = req.body;
  const storeId = req.user!.storeId!;

  const updated = db.settleDebtFull(debtId, storeId, note);
  if (!updated) {
    return res.status(404).json({ error: 'سجل المدين غير موجود.' });
  }

  res.json({ message: 'تم تسوية حساب المدين بالكامل بنجاح.', debt: updated });
});

// Delete Debtor Account
app.delete('/api/owner/debts/:id', requireAuth, requireStoreOwner, (req: AuthenticatedRequest, res: Response) => {
  const debtId = req.params.id;
  const storeId = req.user!.storeId!;

  const success = db.deleteDebt(debtId, storeId);
  if (!success) {
    return res.status(404).json({ error: 'سجل المدين غير موجود أو لا تملك صلاحية حذفه.' });
  }

  res.json({ message: 'تم حذف سجل المدين بالكامل.' });
});

// Sales Management (Strictly Isolated by storeId!)
app.get('/api/owner/sales', requireAuth, requireStoreOwner, (req: AuthenticatedRequest, res: Response) => {
  const sales = db.getSales(req.user!.storeId!);
  res.json({ sales });
});

app.post('/api/owner/sales', requireAuth, requireStoreOwner, (req: AuthenticatedRequest, res: Response) => {
  const { items, totalAmount, subtotalAmount, discountAmount, paymentType, customerName, customerPhone, notes, date } = req.body;
  const storeId = req.user!.storeId!;

  const finalTotal = Number(totalAmount) || 0;
  if (finalTotal <= 0) {
    return res.status(400).json({ error: 'مبلغ البيع الإجمالي مطلوب ويجب أن يكون أكبر من الصفر.' });
  }

  // Deduct inventory stock for items linked to store products
  if (Array.isArray(items)) {
    items.forEach((item: any) => {
      if (item.productId && Number(item.quantity) > 0) {
        db.decrementProductStock(item.productId, storeId, Number(item.quantity));
      }
    });
  }

  const newSale: Sale = {
    id: 'sale_' + Date.now(),
    storeId,
    items: Array.isArray(items) ? items : [],
    subtotalAmount: Number(subtotalAmount) || finalTotal,
    discountAmount: Number(discountAmount) || 0,
    totalAmount: finalTotal,
    paymentType: paymentType || 'cash',
    customerName: (customerName || 'زبون نقدي عام').trim(),
    customerPhone: customerPhone ? customerPhone.trim() : '',
    notes: notes || '',
    date: date || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };

  db.addSale(newSale);
  const updatedProducts = db.getProducts(storeId);
  res.status(201).json({ 
    message: 'تم تسجيل عملية البيع وخصم الكميات من المخزون بنجاح.', 
    sale: newSale,
    products: updatedProducts
  });
});

/* =========================================================================
   4. SUPER ADMIN ENDPOINTS
   ========================================================================= */

// Platform Stats
app.get('/api/admin/stats', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const stats = db.getStats();
  res.json({ stats });
});

// All Stores
app.get('/api/admin/stores', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const stores = db.getStores();
  res.json({ stores });
});

// Update Store Info by Admin
app.put('/api/admin/stores/:id', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const storeId = req.params.id;
  const updated = db.updateStore(storeId, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'المتجر غير موجود.' });
  }
  res.json({ message: 'تم تحديث بيانات المتجر بنجاح.', store: updated });
});

// Toggle Store Status (active / inactive)
app.put('/api/admin/stores/:id/status', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const storeId = req.params.id;
  const { status } = req.body;

  const updated = db.updateStore(storeId, { status });
  if (!updated) {
    return res.status(404).json({ error: 'المتجر غير موجود.' });
  }

  res.json({ message: 'تم تغيير حالة المتجر بنجاح.', store: updated });
});

// Update Store Location (GPS & Address)
app.put('/api/admin/stores/:id/location', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const storeId = req.params.id;
  const { lat, lng, addressName } = req.body;

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'يرجى إدخال إحداثيات موقع صالحة.' });
  }

  const updated = db.updateStoreLocation(storeId, { lat, lng, addressName: addressName || 'قلعة سكر' });
  if (!updated) {
    return res.status(404).json({ error: 'المتجر غير موجود.' });
  }

  res.json({ message: 'تم تحديث موقع المتجر على الخريطة بنجاح.', store: updated });
});

// PERMANENT SAFE STORE DELETION (Requires confirmation keyword/name)
app.delete('/api/admin/stores/:id', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const storeId = req.params.id;
  const { confirmText } = req.body;

  const store = db.findStoreById(storeId);
  if (!store) {
    return res.status(404).json({ error: 'المتجر غير موجود.' });
  }

  // Strict confirmation check
  const trimmed = (confirmText || '').trim();
  if (trimmed !== store.name && trimmed !== 'حذف' && trimmed !== 'delete') {
    return res.status(400).json({ 
      error: 'يرجى كتابة اسم المتجر بدقة أو كلمة "حذف" لتأكيد عملية الحذف النهائي.' 
    });
  }

  const success = db.deleteStorePermanent(storeId);
  if (!success) {
    return res.status(500).json({ error: 'تعذر حذف المتجر.' });
  }

  res.json({ message: `تم حذف متجر (${store.name}) وكافة المنتجات والبيانات المرتبطة به نهائياً.` });
});

// Store Owners List
app.get('/api/admin/owners', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const owners = db.getStoreOwners();
  res.json({ owners });
});

// All Users
app.get('/api/admin/users', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers();
  res.json({ users });
});

// Toggle User Status
app.put('/api/admin/users/:id/status', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const userId = req.params.id;
  const { status } = req.body;

  const updated = db.updateUser(userId, { status });
  if (!updated) {
    return res.status(404).json({ error: 'المستخدم غير موجود.' });
  }

  res.json({ message: 'تم تحديث حالة المستخدم بنجاح.', user: updated });
});

// All Products (Admin View)
app.get('/api/admin/products', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const storeId = req.query.storeId as string | undefined;
  const products = db.getProducts(storeId);
  res.json({ products });
});

// Admin Update Product
app.put('/api/admin/products/:id', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const prodId = req.params.id;
  const updated = db.updateProductAdmin(prodId, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'المنتج غير موجود.' });
  }
  res.json({ message: 'تم تحديث بيانات المنتج بنجاح.', product: updated });
});

// Admin Delete Product
app.delete('/api/admin/products/:id', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const prodId = req.params.id;
  const success = db.deleteProductAdmin(prodId);
  if (!success) {
    return res.status(404).json({ error: 'المنتج غير موجود أو تعذر حذفه.' });
  }
  res.json({ message: 'تم حذف المنتج بنجاح.' });
});

// All Orders (Admin View)
app.get('/api/admin/orders', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const orders = db.getAllOrders();
  res.json({ orders });
});

// Admin Update Order Status
app.put('/api/admin/orders/:id/status', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const orderId = req.params.id;
  const { status, note } = req.body;

  const updated = db.updateOrderStatus(orderId, status, note);
  if (!updated) {
    return res.status(404).json({ error: 'الطلب غير موجود.' });
  }
  res.json({ message: 'تم تحديث حالة الطلب بنجاح.', order: updated });
});

// Subscriptions List
app.get('/api/admin/subscriptions', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const subscriptions = db.getSubscriptions();
  res.json({ subscriptions });
});

// Create / Renew Subscription
app.post('/api/admin/subscriptions', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const { storeId, planName, price, durationMonths, status } = req.body;
  const store = db.findStoreById(storeId);

  if (!store) {
    return res.status(404).json({ error: 'المتجر غير موجود.' });
  }

  const months = Number(durationMonths) || 12;
  const startDate = new Date().toISOString().split('T')[0];
  const endDateObj = new Date();
  endDateObj.setMonth(endDateObj.getMonth() + months);
  const endDate = endDateObj.toISOString().split('T')[0];

  const newSub: Subscription = {
    id: 'sub_' + Date.now(),
    storeId: store.id,
    storeName: store.name,
    ownerName: store.ownerName || 'صاحب المتجر',
    planName: planName || 'الباقة السنوية المعتمدة',
    price: Number(price) || 100000,
    durationMonths: months,
    startDate,
    endDate,
    status: status || 'active',
    createdAt: new Date().toISOString()
  };

  db.addSubscription(newSub);
  res.status(201).json({ message: 'تم تفعيل / تجديد الاشتراك بنجاح.', subscription: newSub });
});

// Extend Subscription
app.post('/api/admin/subscriptions/:id/extend', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const subId = req.params.id;
  const { months } = req.body;
  const numMonths = Number(months) || 1;

  const updated = db.extendSubscription(subId, numMonths);
  if (!updated) {
    return res.status(404).json({ error: 'الاشتراك غير موجود.' });
  }
  res.json({ message: `تم تمديد الاشتراك لمدة ${numMonths} شهر بنجاح.`, subscription: updated });
});

// Update Subscription
app.put('/api/admin/subscriptions/:id', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const subId = req.params.id;
  const updated = db.updateSubscription(subId, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'الاشتراك غير موجود.' });
  }
  res.json({ message: 'تم تحديث بيانات الاشتراك بنجاح.', subscription: updated });
});

// Activation Codes List
app.get('/api/admin/activation-codes', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const codes = db.getActivationCodes();
  res.json({ activationCodes: codes });
});

// Create Activation Code
app.post('/api/admin/activation-codes', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const { code, maxUses, expiresAt, note } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'رمز التفعيل مطلوب.' });
  }

  const existing = db.findActivationCode(code);
  if (existing) {
    return res.status(400).json({ error: 'رمز التفعيل هذا مسجل مسبقاً.' });
  }

  const newCode: ActivationCode = {
    id: 'act_' + Date.now(),
    code: code.trim().toUpperCase(),
    maxUses: Number(maxUses) || 1,
    usedCount: 0,
    usedByStoreIds: [],
    usedByStoreNames: [],
    expiresAt: expiresAt || '2026-12-31',
    status: 'active',
    note: note || '',
    createdAt: new Date().toISOString()
  };

  db.createActivationCode(newCode);
  res.status(201).json({ message: 'تم إنشاء رمز التفعيل بنجاح.', activationCode: newCode });
});

// Toggle Activation Code Status
app.put('/api/admin/activation-codes/:id', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const codeId = req.params.id;
  const updated = db.updateActivationCode(codeId, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'رمز التفعيل غير موجود.' });
  }
  res.json({ message: 'تم تحديث حالة رمز التفعيل بنجاح.', activationCode: updated });
});

// Delete Activation Code
app.delete('/api/admin/activation-codes/:id', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const codeId = req.params.id;
  const success = db.deleteActivationCode(codeId);
  if (!success) {
    return res.status(404).json({ error: 'رمز التفعيل غير موجود.' });
  }
  res.json({ message: 'تم حذف رمز التفعيل بنجاح.' });
});

// Reset Demo Data
app.post('/api/admin/reset-demo-data', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  db.resetToDefault();
  res.json({ message: 'تمت إعادة تهيئة بيانات المنصة إلى الوضع التجريبي الأولي بنجاح.' });
});

/* =========================================================================
   5. LOCAL STORAGE & DATA SYNCHRONIZATION ENDPOINTS
   ========================================================================= */

// Get full snapshot for automatic localStorage caching
app.get('/api/sync/snapshot', (req: Request, res: Response) => {
  const snapshot = db.getFullSnapshot();
  // Strip sensitive internal fields like password hashes for safety in transfer if any
  const sanitizedUsers = snapshot.users.map(u => {
    const { passwordHash, ...rest } = u;
    return rest;
  });

  res.json({
    timestamp: new Date().toISOString(),
    snapshot: {
      ...snapshot,
      users: sanitizedUsers
    }
  });
});

// Auto-sync client localStorage backup with server database
app.post('/api/sync/auto-sync', (req: Request, res: Response) => {
  const { snapshot } = req.body;
  if (!snapshot) {
    const current = db.getFullSnapshot();
    return res.json({
      message: 'البيانات متزامنة مسبقاً.',
      snapshot: current,
      timestamp: new Date().toISOString()
    });
  }

  const mergeResult = db.mergeSnapshot(snapshot);
  res.json({
    message: mergeResult.message,
    snapshot: mergeResult.data,
    timestamp: new Date().toISOString()
  });
});

// Restore / Import full database snapshot
app.post('/api/sync/restore', (req: Request, res: Response) => {
  const { snapshot } = req.body;
  if (!snapshot) {
    return res.status(400).json({ error: 'ملف أو كائن النسخة الاحتياطية غير موجود.' });
  }

  const result = db.restoreFullSnapshot(snapshot);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.json({
    message: result.message,
    snapshot: db.getFullSnapshot(),
    timestamp: new Date().toISOString()
  });
});

// Download Complete Project Source Code as a ZIP archive
app.get('/api/download-source-zip', (req: Request, res: Response) => {
  try {
    const archive = new ZipArchive({
      zlib: { level: 9 } // Maximum compression
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const zipFilename = `aswaq-qalat-sukkar-source-${timestamp}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    archive.on('error', (err: any) => {
      console.error('Error generating project zip archive:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'تعذر إنشاء وضغط ملف المشروع.' });
      }
    });

    archive.pipe(res);

    const rootDir = process.cwd();

    // Folders to include in the zip
    const includeFolders = ['src', 'server', 'public', 'data', 'scripts'];
    
    // Top-level files to include in the zip
    const includeFiles = [
      'index.html',
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'metadata.json',
      '.env.example',
      '.gitignore',
      'server.ts',
      'README.md'
    ];

    includeFolders.forEach((folder) => {
      const folderPath = path.join(rootDir, folder);
      if (fs.existsSync(folderPath)) {
        archive.directory(folderPath, folder);
      }
    });

    includeFiles.forEach((file) => {
      const filePath = path.join(rootDir, file);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: file });
      }
    });

    archive.finalize();
  } catch (err: any) {
    console.error('Download source zip handler error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'حدث خطأ أثناء تصدير ملفات المشروع.' });
    }
  }
});

// Download Single-File Standalone index.html
app.get('/api/download-standalone-html', (req: Request, res: Response) => {
  try {
    const standalonePath = path.join(process.cwd(), 'public', 'standalone.html');
    if (fs.existsSync(standalonePath)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="index.html"');
      return res.sendFile(standalonePath);
    }
    res.status(404).json({ error: 'الملف غير موجود.' });
  } catch (err) {
    console.error('Error serving standalone html:', err);
    res.status(500).json({ error: 'تعذر تنزيل الملف.' });
  }
});

/* =========================================================================
   6. VITE SPA & STATIC HANDLER
   ========================================================================= */

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`«أسواق قلعة سكر» server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
