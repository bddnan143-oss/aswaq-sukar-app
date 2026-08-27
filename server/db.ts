import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { serverSupabase } from './supabaseSync';
import {
  User,
  Store,
  Product,
  Order,
  Debt,
  Sale,
  Subscription,
  ActivationCode,
  PlatformStats,
  StoreLocation
} from '../src/types';

export interface DbUser extends User {
  passwordHash?: string;
}

export interface DatabaseSchema {
  users: DbUser[];
  stores: Store[];
  products: Product[];
  orders: Order[];
  debts: Debt[];
  sales: Sale[];
  subscriptions: Subscription[];
  activationCodes: ActivationCode[];
  passwordResetTokens: { token: string; email: string; expiresAt: string; used: boolean }[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Coordinates for Qalat Sukkar, Dhi Qar Governorate, Iraq
const QALAT_SUKKAR_LAT = 31.8596;
const QALAT_SUKKAR_LNG = 46.0683;

// Default password hash helper (fallback pre-hashed for seed)
const hashPasswordSync = (plain: string): string => {
  return bcrypt.hashSync(plain, 10);
};

const INITIAL_DATA: DatabaseSchema = {
  users: [
    {
      id: 'usr_admin',
      name: 'المدير الرئيسي للمنصة',
      phone: '07801234567',
      email: 'admin@qalatsukkar.com',
      role: 'super_admin',
      status: 'active',
      createdAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'usr_owner_1',
      name: 'أحمد الشمري',
      phone: '07802223334',
      email: 'ahmed@store.com',
      role: 'store_owner',
      storeId: 'store_1',
      status: 'active',
      createdAt: new Date('2026-01-10').toISOString(),
    },
    {
      id: 'usr_owner_2',
      name: 'علي الحسيني',
      phone: '07805556667',
      email: 'ali@store.com',
      role: 'store_owner',
      storeId: 'store_2',
      status: 'active',
      createdAt: new Date('2026-01-15').toISOString(),
    },
    {
      id: 'usr_owner_3',
      name: 'حسين السعدي',
      phone: '07807778889',
      email: 'hussein@store.com',
      role: 'store_owner',
      storeId: 'store_3',
      status: 'active',
      createdAt: new Date('2026-02-01').toISOString(),
    },
    {
      id: 'usr_owner_4',
      name: 'د. سجاد الخفاجي',
      phone: '07809990001',
      email: 'sajjad@store.com',
      role: 'store_owner',
      storeId: 'store_4',
      status: 'active',
      createdAt: new Date('2026-02-10').toISOString(),
    },
    {
      id: 'usr_customer_1',
      name: 'حيدر الموسوي',
      phone: '07701112233',
      email: 'customer@gmail.com',
      role: 'customer',
      status: 'active',
      createdAt: new Date('2026-02-05').toISOString(),
    },
    {
      id: 'usr_customer_2',
      name: 'كرار البدري',
      phone: '07704445566',
      email: 'karrar@gmail.com',
      role: 'customer',
      status: 'active',
      createdAt: new Date('2026-02-12').toISOString(),
    }
  ],
  stores: [
    {
      id: 'store_1',
      ownerId: 'usr_owner_1',
      ownerName: 'أحمد الشمري',
      name: 'أسواق الفرات الغذائية',
      logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
      category: 'مواد غذائية وماركت',
      description: 'أكبر مركز للمواد الغذائية والمنظفات والألبان الطازجة في قلعة سكر - أسعار جملة ومفرد وتجهيز فوري.',
      phone: '07802223334',
      workingHours: '8:00 ص - 11:30 م (يومياً)',
      address: 'قلعة سكر - الشارع العام، قرب فلكة الساعة',
      location: {
        lat: QALAT_SUKKAR_LAT + 0.0021,
        lng: QALAT_SUKKAR_LNG + 0.0015,
        addressName: 'شارع السوق الكبير، قرب فلكة الساعة'
      },
      subscriptionStatus: 'active',
      subscriptionEndDate: '2026-12-31',
      status: 'active',
      createdAt: new Date('2026-01-10').toISOString(),
    },
    {
      id: 'store_2',
      ownerId: 'usr_owner_2',
      ownerName: 'علي الحسيني',
      name: 'مجمع النور للأجهزة والموبايل',
      logo: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80',
      category: 'إلكترونيات وموبايل',
      description: 'أحدث الهواتف الذكية والإكسسوارات الأصلية والأجهزة المنزلية مع ضمان حقيقي وخدمات صيانة متخصصة.',
      phone: '07805556667',
      workingHours: '9:00 ص - 10:00 م',
      address: 'قلعة سكر - مقابل مدرسة الفراهيدي للبنين',
      location: {
        lat: QALAT_SUKKAR_LAT - 0.0018,
        lng: QALAT_SUKKAR_LNG + 0.0028,
        addressName: 'مقابل مدرسة الفراهيدي للبنين'
      },
      subscriptionStatus: 'active',
      subscriptionEndDate: '2026-11-30',
      status: 'active',
      createdAt: new Date('2026-01-15').toISOString(),
    },
    {
      id: 'store_3',
      ownerId: 'usr_owner_3',
      ownerName: 'حسين السعدي',
      name: 'قصابة البركة للحوم الطازجة',
      logo: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&auto=format&fit=crop&q=80',
      category: 'لحوم وقصابة',
      description: 'لحوم غنم وعجل محلية طازجة ذبح يومي تحت إشراف صحي - فرم وتتبيل وتجهيز ولائم.',
      phone: '07807778889',
      workingHours: '7:00 ص - 9:00 م',
      address: 'قلعة سكر - سوق اللحوم، فرع القصابين',
      location: {
        lat: QALAT_SUKKAR_LAT + 0.0012,
        lng: QALAT_SUKKAR_LNG - 0.0019,
        addressName: 'سوق اللحوم المركزي'
      },
      subscriptionStatus: 'active',
      subscriptionEndDate: '2026-10-15',
      status: 'active',
      createdAt: new Date('2026-02-01').toISOString(),
    },
    {
      id: 'store_4',
      ownerId: 'usr_owner_4',
      ownerName: 'د. سجاد الخفاجي',
      name: 'صيدلية الشفاء المركزية',
      logo: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=80',
      category: 'صيدلية وعناية',
      description: 'كافة الأدوية والمستلزمات الطبية وحليب وأغذية الأطفال ومنتجات العناية بالبشرة مع استشارات دوائية.',
      phone: '07809990001',
      workingHours: '8:00 ص - 12:00 منتصف الليل',
      address: 'قلعة سكر - شارع الأطباء، قرب المستوصف',
      location: {
        lat: QALAT_SUKKAR_LAT - 0.0009,
        lng: QALAT_SUKKAR_LNG - 0.0011,
        addressName: 'شارع الأطباء، قرب المستوصف'
      },
      subscriptionStatus: 'active',
      subscriptionEndDate: '2026-12-01',
      status: 'active',
      createdAt: new Date('2026-02-10').toISOString(),
    }
  ],
  products: [
    // Store 1 Products (أسواق الفرات - أحمد)
    {
      id: 'prod_101',
      storeId: 'store_1',
      storeName: 'أسواق الفرات الغذائية',
      name: 'بيبسي عائلي 1.25 لتر',
      description: 'مشروب غازي بيبسي أصلي حجم عائلي مثلج.',
      price: 1500,
      image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&auto=format&fit=crop&q=80',
      category: 'مشروبات وعصائر',
      stockQuantity: 45,
      minStockAlert: 10,
      isAvailable: true,
      isOffer: true,
      discountPrice: 1250,
      createdAt: new Date('2026-01-11').toISOString(),
    },
    {
      id: 'prod_102',
      storeId: 'store_1',
      storeName: 'أسواق الفرات الغذائية',
      name: 'أرز بسمتي محمود 5 كغم',
      description: 'أرز بسمتي هندي عنبر درجة أولى حبة طويلة فاخرة.',
      price: 14000,
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80',
      category: 'مواد غذائية وتموينية',
      stockQuantity: 28,
      minStockAlert: 5,
      isAvailable: true,
      createdAt: new Date('2026-01-11').toISOString(),
    },
    {
      id: 'prod_103',
      storeId: 'store_1',
      storeName: 'أسواق الفرات الغذائية',
      name: 'زيت طعام زير 1 لتر',
      description: 'زيت ذرة نقي عالي الجودة للطبخ والقلي.',
      price: 3250,
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80',
      category: 'مواد غذائية وتموينية',
      stockQuantity: 60,
      minStockAlert: 12,
      isAvailable: true,
      createdAt: new Date('2026-01-12').toISOString(),
    },
    {
      id: 'prod_104',
      storeId: 'store_1',
      storeName: 'أسواق الفرات الغذائية',
      name: 'لبن أربيل 1 كغم',
      description: 'لبن رائب طازج كامل الدسم طعم عراقي أصيل.',
      price: 2000,
      image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&auto=format&fit=crop&q=80',
      category: 'ألبان وأجبان',
      stockQuantity: 4,
      minStockAlert: 6, // triggers low stock warning for Ahmed
      isAvailable: true,
      createdAt: new Date('2026-01-13').toISOString(),
    },

    // Store 2 Products (مجمع النور - علي)
    {
      id: 'prod_201',
      storeId: 'store_2',
      storeName: 'مجمع النور للأجهزة والموبايل',
      name: 'بيبسي عائلي 1.25 لتر',
      description: 'مشروب غازي منعش 1.25 لتر متوفر في ركن المشروبات بالمجمع.',
      price: 1750, // Price comparison test scenario as requested!
      image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&auto=format&fit=crop&q=80',
      category: 'مشروبات وسناكات',
      stockQuantity: 20,
      minStockAlert: 5,
      isAvailable: true,
      createdAt: new Date('2026-01-16').toISOString(),
    },
    {
      id: 'prod_202',
      storeId: 'store_2',
      storeName: 'مجمع النور للأجهزة والموبايل',
      name: 'شاحن سريع Anker 20W Type-C',
      description: 'شاحن أنكر أصلي يدعم الشحن السريع للآيفون وسامسونج مع كفالة سنة.',
      price: 18000,
      image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&auto=format&fit=crop&q=80',
      category: 'إلكترونيات وإكسسوارات',
      stockQuantity: 15,
      minStockAlert: 4,
      isAvailable: true,
      isOffer: true,
      discountPrice: 15000,
      createdAt: new Date('2026-01-16').toISOString(),
    },
    {
      id: 'prod_203',
      storeId: 'store_2',
      storeName: 'مجمع النور للأجهزة والموبايل',
      name: 'سماعة بلوتوث لاسلكية Earbuds Pro',
      description: 'سماعات عازلة للضوضاء بصوت نقي وبطارية تدوم حتى 24 ساعة.',
      price: 25000,
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=80',
      category: 'إلكترونيات وإكسسوارات',
      stockQuantity: 8,
      minStockAlert: 3,
      isAvailable: true,
      createdAt: new Date('2026-01-18').toISOString(),
    },

    // Store 3 Products (قصابة البركة - حسين)
    {
      id: 'prod_301',
      storeId: 'store_3',
      storeName: 'قصابة البركة للحوم الطازجة',
      name: 'لحم غنم محلي طازج 1 كغم',
      description: 'لحم خروف عراقي طازج ذبح اليوم بالعظم أو بدون عظم حسب الطلب.',
      price: 22000,
      image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400&auto=format&fit=crop&q=80',
      category: 'لحوم طازجة',
      stockQuantity: 30,
      minStockAlert: 5,
      isAvailable: true,
      createdAt: new Date('2026-02-02').toISOString(),
    },
    {
      id: 'prod_302',
      storeId: 'store_3',
      storeName: 'قصابة البركة للحوم الطازجة',
      name: 'لحم مفروم كباب عراقي جاهز 1 كغم',
      description: 'لحم غنم مخلوط بلية ناعمة متبل وجاهز للشيش والشوي.',
      price: 23000,
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&auto=format&fit=crop&q=80',
      category: 'لحوم طازجة',
      stockQuantity: 18,
      minStockAlert: 4,
      isAvailable: true,
      createdAt: new Date('2026-02-02').toISOString(),
    },

    // Store 4 Products (صيدلية الشفاء - سجاد)
    {
      id: 'prod_401',
      storeId: 'store_4',
      storeName: 'صيدلية الشفاء المركزية',
      name: 'فيتامين C فوار 1000mg',
      description: 'مكمل غذائي لتعزيز المناعة بنكهة البرتقال الطبيعي (20 قرص).',
      price: 4500,
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80',
      category: 'فيتامينات ومكملات',
      stockQuantity: 40,
      minStockAlert: 8,
      isAvailable: true,
      createdAt: new Date('2026-02-11').toISOString(),
    },
    {
      id: 'prod_402',
      storeId: 'store_4',
      storeName: 'صيدلية الشفاء المركزية',
      name: 'مرطب بشرة سيتافيل 250 مل',
      description: 'كريم مرطب طبي فائق الترطيب للبشرة الجافة والحساسة.',
      price: 16000,
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80',
      category: 'عناية بالبشرة',
      stockQuantity: 12,
      minStockAlert: 3,
      isAvailable: true,
      createdAt: new Date('2026-02-11').toISOString(),
    }
  ],
  orders: [
    {
      id: 'ord_101',
      orderNumber: 'QS-1021',
      customerId: 'usr_customer_1',
      customerName: 'حيدر الموسوي',
      customerPhone: '07701112233',
      storeId: 'store_1',
      storeName: 'أسواق الفرات الغذائية',
      storePhone: '07802223334',
      items: [
        {
          productId: 'prod_101',
          productName: 'بيبسي عائلي 1.25 لتر',
          productImage: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&auto=format&fit=crop&q=80',
          price: 1250,
          quantity: 2,
          subtotal: 2500,
        },
        {
          productId: 'prod_102',
          productName: 'أرز بسمتي محمود 5 كغم',
          productImage: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80',
          price: 14000,
          quantity: 1,
          subtotal: 14000,
        }
      ],
      totalAmount: 16500,
      notes: 'يرجى وضع الأغراض في كيس محكم للاستلام بعد صلاة العصر.',
      status: 'preparing',
      statusHistory: [
        { status: 'new', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), note: 'تم إرسال الطلب من الزبون' },
        { status: 'preparing', timestamp: new Date(Date.now() - 3600000).toISOString(), note: 'تم قبول الطلب وجاري تجهيز المواد' }
      ],
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'ord_102',
      orderNumber: 'QS-1022',
      customerId: 'usr_customer_1',
      customerName: 'حيدر الموسوي',
      customerPhone: '07701112233',
      storeId: 'store_3',
      storeName: 'قصابة البركة للحوم الطازجة',
      storePhone: '07807778889',
      items: [
        {
          productId: 'prod_301',
          productName: 'لحم غنم محلي طازج 1 كغم',
          productImage: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400&auto=format&fit=crop&q=80',
          price: 22000,
          quantity: 1,
          subtotal: 22000,
        }
      ],
      totalAmount: 22000,
      notes: 'تقطيع لحم صغار للمرق مع قليل من الشحم.',
      status: 'completed',
      statusHistory: [
        { status: 'new', timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
        { status: 'preparing', timestamp: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString() },
        { status: 'ready_for_pickup', timestamp: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString() },
        { status: 'completed', timestamp: new Date(Date.now() - 86400000 * 2 + 7200000).toISOString(), note: 'تم تسليم الطلب للزبون باليد' }
      ],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2 + 7200000).toISOString(),
    }
  ],
  debts: [
    // Store 1 debts (Only visible to Ahmed!)
    {
      id: 'debt_101',
      storeId: 'store_1',
      debtorName: 'أبو كرار العقيلي',
      debtorPhone: '07801122334',
      amount: 45000,
      paidAmount: 20000,
      remainingAmount: 25000,
      details: 'قائمة مسواك شهري مواد غذائية وزيت وتمن.',
      date: '2026-02-01',
      status: 'partially_paid',
      items: [
        {
          id: 'item_101_1',
          itemDescription: 'أرز بسمتي محمود 5 كغم + كارتون معجون طماطة التونسا',
          amount: 28000,
          date: '2026-02-01',
          time: '10:30',
          notes: 'مسواك أول الشهر',
          createdAt: new Date('2026-02-01T10:30:00').toISOString()
        },
        {
          id: 'item_101_2',
          itemDescription: 'زيت طعام زير 1 لتر (عدد 3) + كارتون شاي الوزة أصلي',
          amount: 17000,
          date: '2026-02-08',
          time: '18:15',
          notes: 'طلب عائلي إضافي',
          createdAt: new Date('2026-02-08T18:15:00').toISOString()
        }
      ],
      payments: [
        { id: 'pay_1', amount: 20000, date: '2026-02-15', note: 'تسديد دفعة مع الراتب' }
      ],
      createdAt: new Date('2026-02-01').toISOString(),
    },
    {
      id: 'debt_102',
      storeId: 'store_1',
      debtorName: 'سيد مهدي',
      debtorPhone: '07804455667',
      amount: 18500,
      paidAmount: 0,
      remainingAmount: 18500,
      details: 'صندوقين حليب مع كارتون معجون طماطة.',
      date: '2026-02-10',
      status: 'unpaid',
      items: [
        {
          id: 'item_102_1',
          itemDescription: 'صندوقين حليب كيكوز مع كارتون معجون طماطة 800 غم',
          amount: 18500,
          date: '2026-02-10',
          time: '14:20',
          notes: 'حساب مسجل بالدفتر',
          createdAt: new Date('2026-02-10T14:20:00').toISOString()
        }
      ],
      payments: [],
      createdAt: new Date('2026-02-10').toISOString(),
    },
    // Store 2 debts (Only visible to Ali!)
    {
      id: 'debt_201',
      storeId: 'store_2',
      debtorName: 'أستاذ حامد المعلم',
      debtorPhone: '07809988776',
      amount: 60000,
      paidAmount: 30000,
      remainingAmount: 30000,
      details: 'شاحن أصلي مع سماعة بلوتوث وباور بانك.',
      date: '2026-01-25',
      status: 'partially_paid',
      items: [
        {
          id: 'item_201_1',
          itemDescription: 'شاحن سريع Anker 20W أصلي مع كيبل تايب سي معتمد',
          amount: 25000,
          date: '2026-01-25',
          time: '16:00',
          notes: 'ضمان استبدال سنة',
          createdAt: new Date('2026-01-25T16:00:00').toISOString()
        },
        {
          id: 'item_201_2',
          itemDescription: 'سماعة بلوتوث لاسلكية Earbuds Pro + باور بانك 10000mAh',
          amount: 35000,
          date: '2026-01-28',
          time: '19:40',
          notes: 'مستلزمات مدرسية',
          createdAt: new Date('2026-01-28T19:40:00').toISOString()
        }
      ],
      payments: [
        { id: 'pay_2', amount: 30000, date: '2026-02-05', note: 'دفعة أولى عند الاستلام' }
      ],
      createdAt: new Date('2026-01-25').toISOString(),
    }
  ],
  sales: [
    // Store 1 sales
    {
      id: 'sale_101',
      storeId: 'store_1',
      items: [
        { name: 'أرز بسمتي محمود 5 كغم', price: 14000, quantity: 2 },
        { name: 'زيت طعام زير 1 لتر', price: 3250, quantity: 4 }
      ],
      totalAmount: 41000,
      paymentType: 'cash',
      customerName: 'زبون مباشر - نقد',
      date: '2026-02-20',
      notes: 'بيع مباشر في المحل',
      createdAt: new Date('2026-02-20T10:30:00').toISOString(),
    },
    {
      id: 'sale_102',
      storeId: 'store_1',
      items: [
        { name: 'بيبسي عائلي 1.25 لتر', price: 1250, quantity: 6 }
      ],
      totalAmount: 7500,
      paymentType: 'cash',
      customerName: 'أبو فاطمة',
      date: '2026-02-22',
      createdAt: new Date('2026-02-22T14:15:00').toISOString(),
    },
    // Store 2 sales
    {
      id: 'sale_201',
      storeId: 'store_2',
      items: [
        { name: 'سماعة بلوتوث لاسلكية Earbuds Pro', price: 25000, quantity: 1 }
      ],
      totalAmount: 25000,
      paymentType: 'cash',
      customerName: 'زبون مباشر',
      date: '2026-02-21',
      createdAt: new Date('2026-02-21T18:00:00').toISOString(),
    }
  ],
  subscriptions: [
    {
      id: 'sub_1',
      storeId: 'store_1',
      storeName: 'أسواق الفرات الغذائية',
      ownerName: 'أحمد الشمري',
      planName: 'الباقة السنوية المميزة',
      price: 150000,
      durationMonths: 12,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'active',
      createdAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'sub_2',
      storeId: 'store_2',
      storeName: 'مجمع النور للأجهزة والموبايل',
      ownerName: 'علي الحسيني',
      planName: 'الباقة السنوية الأساسية',
      price: 100000,
      durationMonths: 12,
      startDate: '2026-01-15',
      endDate: '2026-11-30',
      status: 'active',
      createdAt: new Date('2026-01-15').toISOString(),
    },
    {
      id: 'sub_3',
      storeId: 'store_3',
      storeName: 'قصابة البركة للحوم الطازجة',
      ownerName: 'حسين السعدي',
      planName: 'الباقة نصف السنوية',
      price: 60000,
      durationMonths: 6,
      startDate: '2026-02-01',
      endDate: '2026-10-15',
      status: 'active',
      createdAt: new Date('2026-02-01').toISOString(),
    },
    {
      id: 'sub_4',
      storeId: 'store_4',
      storeName: 'صيدلية الشفاء المركزية',
      ownerName: 'د. سجاد الخفاجي',
      planName: 'الباقة السنوية الأساسية',
      price: 100000,
      durationMonths: 12,
      startDate: '2026-02-10',
      endDate: '2026-12-01',
      status: 'active',
      createdAt: new Date('2026-02-10').toISOString(),
    }
  ],
  activationCodes: [
    {
      id: 'act_1',
      code: 'SUKKAR-2026-VIP',
      maxUses: 5,
      usedCount: 2,
      usedByStoreIds: ['store_1', 'store_2'],
      usedByStoreNames: ['أسواق الفرات الغذائية', 'مجمع النور للأجهزة والموبايل'],
      expiresAt: '2026-12-31',
      status: 'active',
      note: 'رمز معتمد للمتاجر الكبيرة في قلعة سكر',
      createdAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'act_2',
      code: 'QALAT-STORE-777',
      maxUses: 3,
      usedCount: 2,
      usedByStoreIds: ['store_3', 'store_4'],
      usedByStoreNames: ['قصابة البركة للحوم الطازجة', 'صيدلية الشفاء المركزية'],
      expiresAt: '2026-12-31',
      status: 'active',
      note: 'رمز متاجر الخدمات الصحية واللحوم',
      createdAt: new Date('2026-01-15').toISOString(),
    },
    {
      id: 'act_3',
      code: 'SUKKAR-NEW-2026',
      maxUses: 10,
      usedCount: 0,
      usedByStoreIds: [],
      usedByStoreNames: [],
      expiresAt: '2026-12-31',
      status: 'active',
      note: 'رمز تفعيل متاح لتسجيل المتاجر الجديدة',
      createdAt: new Date('2026-02-01').toISOString(),
    }
  ],
  passwordResetTokens: []
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
    // Hydrate and sync with Supabase cloud database in background
    setTimeout(async () => {
      try {
        const cloudData = await serverSupabase.loadFromSupabase();
        if (cloudData && Object.keys(cloudData).length > 0) {
          this.mergeSnapshot(cloudData);
        } else {
          // Push initial dataset if Supabase is fresh
          await serverSupabase.syncToSupabase(this.data);
        }
      } catch (err) {
        console.warn('[Supabase Init] Background sync note:', err);
      }
    }, 1000);
  }

  public hashPassword(plain: string): string {
    return bcrypt.hashSync(plain, 10);
  }

  public comparePassword(plain: string, hash?: string): boolean {
    if (!hash) return false;
    try {
      return bcrypt.compareSync(plain, hash);
    } catch {
      return false;
    }
  }

  private loadData(): DatabaseSchema {
    let parsedData: DatabaseSchema | null = null;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        parsedData = JSON.parse(content);
      }
    } catch (e) {
      console.error('Error loading db file, falling back to initial seed:', e);
    }

    if (!parsedData) {
      parsedData = JSON.parse(JSON.stringify(INITIAL_DATA));
    }

    // Ensure seed store owners and customers have initial hashed passwords
    if (parsedData && parsedData.users) {
      // Check environment variables for superadmin initialization if present
      const envAdminEmail = process.env.SUPERADMIN_EMAIL;
      const envAdminPass = process.env.SUPERADMIN_PASSWORD;

      parsedData.users.forEach((u) => {
        if (!u.passwordHash) {
          if (u.role === 'super_admin') {
            if (envAdminPass) {
              u.passwordHash = bcrypt.hashSync(envAdminPass, 10);
              if (envAdminEmail) u.email = envAdminEmail.trim().toLowerCase();
            } else {
              // Default secure password for Super Admin: Admin@2026
              u.passwordHash = bcrypt.hashSync('Admin@2026', 10);
              u.email = 'admin@qalatsukkar.com';
            }
          } else if (u.role === 'store_owner') {
            u.passwordHash = bcrypt.hashSync('owner123', 10);
          } else {
            u.passwordHash = bcrypt.hashSync('cust123', 10);
          }
        }
      });
    }

    // Ensure all debts have normalized items and accurate calculations
    if (parsedData && parsedData.debts) {
      parsedData.debts.forEach((debt) => {
        if (!Array.isArray(debt.items)) {
          debt.items = [];
          if (debt.amount > 0) {
            debt.items.push({
              id: 'item_legacy_' + debt.id,
              itemDescription: debt.details || 'رصيد سابق / مشتريات سابقة',
              amount: debt.amount,
              date: debt.date || (debt.createdAt ? debt.createdAt.split('T')[0] : '2026-02-01'),
              time: '12:00',
              notes: 'سجل سابق تم تحويله تلقائياً',
              createdAt: debt.createdAt || new Date().toISOString()
            });
          }
        }
        if (!Array.isArray(debt.payments)) {
          debt.payments = [];
        }

        // Recalculate totals
        const totalItemsAmount = debt.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
        debt.amount = totalItemsAmount > 0 ? totalItemsAmount : (Number(debt.amount) || 0);
        debt.paidAmount = debt.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        debt.remainingAmount = Math.max(0, debt.amount - debt.paidAmount);

        if (debt.remainingAmount === 0 && (debt.amount > 0 || debt.paidAmount > 0)) {
          debt.status = 'paid';
        } else if (debt.paidAmount > 0 && debt.remainingAmount > 0) {
          debt.status = 'partially_paid';
        } else {
          debt.status = 'unpaid';
        }
      });
    }

    this.saveDataDirect(parsedData!);
    return parsedData!;
  }

  private saveDataDirect(data: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving db file:', e);
    }
  }

  public save() {
    this.saveDataDirect(this.data);
    // Push changes to Supabase cloud asynchronously
    serverSupabase.syncToSupabase(this.data).catch(() => {});
  }

  public isSuperAdminInitialized(): boolean {
    const admin = this.data.users.find(u => u.role === 'super_admin');
    return Boolean(admin && admin.passwordHash && admin.passwordHash.length > 10 && admin.status === 'active');
  }

  public setupInitialSuperAdmin(data: { name?: string; phone?: string; email: string; password: string }): { success: boolean; message: string; user?: User } {
    if (this.isSuperAdminInitialized()) {
      return {
        success: false,
        message: 'تم إعداد حساب المدير الرئيسي مسبقاً. لا يمكن إنشاء حساب مدير آخر.'
      };
    }

    const hashedPassword = bcrypt.hashSync(data.password, 10);
    const existingAdminIdx = this.data.users.findIndex(u => u.role === 'super_admin');

    let adminUser: DbUser;

    if (existingAdminIdx !== -1) {
      this.data.users[existingAdminIdx].name = data.name || 'المدير الرئيسي للمنصة';
      this.data.users[existingAdminIdx].phone = data.phone || '07801234567';
      this.data.users[existingAdminIdx].email = data.email.trim().toLowerCase();
      this.data.users[existingAdminIdx].passwordHash = hashedPassword;
      this.data.users[existingAdminIdx].status = 'active';
      adminUser = this.data.users[existingAdminIdx];
    } else {
      adminUser = {
        id: 'usr_admin',
        name: data.name || 'المدير الرئيسي للمنصة',
        phone: data.phone || '07801234567',
        email: data.email.trim().toLowerCase(),
        role: 'super_admin',
        status: 'active',
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString()
      };
      this.data.users.unshift(adminUser);
    }

    this.save();
    return {
      success: true,
      message: 'تم إنشاء وتفعيل حساب المدير الرئيسي بنجاح.',
      user: this.getSanitizedUser(adminUser)
    };
  }

  public resetToDefault() {
    const currentAdmin = this.data.users.find(u => u.role === 'super_admin');
    const previousAdminHash = currentAdmin?.passwordHash;
    const previousAdminEmail = currentAdmin?.email;
    const previousAdminName = currentAdmin?.name;
    const previousAdminPhone = currentAdmin?.phone;

    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.data.users.forEach((u) => {
      if (u.role === 'super_admin') {
        if (previousAdminHash) {
          u.passwordHash = previousAdminHash;
          if (previousAdminEmail) u.email = previousAdminEmail;
          if (previousAdminName) u.name = previousAdminName;
          if (previousAdminPhone) u.phone = previousAdminPhone;
        } else if (process.env.SUPERADMIN_PASSWORD) {
          u.passwordHash = bcrypt.hashSync(process.env.SUPERADMIN_PASSWORD, 10);
          if (process.env.SUPERADMIN_EMAIL) u.email = process.env.SUPERADMIN_EMAIL.trim().toLowerCase();
        }
      } else if (u.role === 'store_owner') {
        u.passwordHash = bcrypt.hashSync('owner123', 10);
      } else {
        u.passwordHash = bcrypt.hashSync('cust123', 10);
      }
    });
    this.save();
    return this.data;
  }

  // --- Auth & Users ---
  public getSanitizedUser(u: DbUser): User {
    const store = u.storeId ? this.data.stores.find(s => s.id === u.storeId && !s.isDeleted) : undefined;
    return {
      id: u.id,
      name: u.name,
      phone: u.phone,
      email: u.email,
      role: u.role,
      storeId: u.storeId,
      storeName: store ? store.name : undefined,
      status: u.status || 'active',
      createdAt: u.createdAt
    };
  }

  public getUsers(): User[] {
    return this.data.users.map(u => this.getSanitizedUser(u));
  }

  public findUserByEmailWithAuth(email: string): DbUser | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  public findUserByEmail(email: string): User | undefined {
    const u = this.findUserByEmailWithAuth(email);
    return u ? this.getSanitizedUser(u) : undefined;
  }

  public findUserByIdWithAuth(id: string): DbUser | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findUserById(id: string): User | undefined {
    const u = this.findUserByIdWithAuth(id);
    return u ? this.getSanitizedUser(u) : undefined;
  }

  public addUser(user: DbUser, plainPassword?: string): User {
    // Strictly prevent adding additional super_admins through standard flow
    if (user.role === 'super_admin') {
      const existingSuperAdmin = this.data.users.find(u => u.role === 'super_admin');
      if (existingSuperAdmin && existingSuperAdmin.id !== user.id) {
        user.role = 'customer';
      }
    }

    if (plainPassword && !user.passwordHash) {
      user.passwordHash = this.hashPassword(plainPassword);
    }

    this.data.users.push(user);
    this.save();
    return this.getSanitizedUser(user);
  }

  public updateUser(id: string, updates: Partial<DbUser>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      // Prevent elevating any account to super_admin
      if (updates.role === 'super_admin' && this.data.users[idx].role !== 'super_admin') {
        delete updates.role;
      }
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.save();
      return this.getSanitizedUser(this.data.users[idx]);
    }
    return null;
  }

  public getStoreOwners(): (User & { store?: Store })[] {
    return this.data.users
      .filter(u => u.role === 'store_owner')
      .map(u => {
        const sanitized = this.getSanitizedUser(u);
        const store = u.storeId ? this.findStoreById(u.storeId) : undefined;
        return {
          ...sanitized,
          store
        };
      });
  }

  // --- Activation Codes ---
  public getActivationCodes(): ActivationCode[] {
    return this.data.activationCodes;
  }

  public findActivationCode(code: string): ActivationCode | undefined {
    return this.data.activationCodes.find(c => c.code.trim().toUpperCase() === code.trim().toUpperCase());
  }

  public validateAndConsumeCode(codeStr: string, storeId: string, storeName: string): { valid: boolean; message?: string } {
    const code = this.findActivationCode(codeStr);
    if (!code) {
      return { valid: false, message: 'رمز التفعيل غير موجود أو تم إدخاله بشكل غير صحيح.' };
    }
    if (code.status !== 'active') {
      return { valid: false, message: 'رمز التفعيل معطل حاليًا من قِبل إدارة المنصة.' };
    }
    if (new Date(code.expiresAt).getTime() < Date.now()) {
      return { valid: false, message: 'انتهت صلاحية رمز التفعيل هذا.' };
    }
    if (code.usedCount >= code.maxUses) {
      return { valid: false, message: 'تم استهلاك الحد الأقصى لعدد مرات استخدام هذا الرمز.' };
    }

    // Atomically increment use count and link store
    code.usedCount += 1;
    code.usedByStoreIds.push(storeId);
    code.usedByStoreNames.push(storeName);
    this.save();
    return { valid: true };
  }

  public createActivationCode(code: ActivationCode): ActivationCode {
    this.data.activationCodes.unshift(code);
    this.save();
    return code;
  }

  public updateActivationCode(id: string, updates: Partial<ActivationCode>): ActivationCode | null {
    const idx = this.data.activationCodes.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.activationCodes[idx] = { ...this.data.activationCodes[idx], ...updates };
      this.save();
      return this.data.activationCodes[idx];
    }
    return null;
  }

  public deleteActivationCode(id: string): boolean {
    const idx = this.data.activationCodes.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.activationCodes.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // --- Stores ---
  public getStores(includeDeleted = false): Store[] {
    const list = includeDeleted ? this.data.stores : this.data.stores.filter(s => !s.isDeleted);
    return list.map(s => {
      const owner = this.data.users.find(u => u.id === s.ownerId);
      const prodCount = this.data.products.filter(p => p.storeId === s.id).length;
      const orderCount = this.data.orders.filter(o => o.storeId === s.id).length;
      return {
        ...s,
        ownerName: owner ? owner.name : s.ownerName,
        ownerPhone: owner ? owner.phone : s.phone,
        ownerEmail: owner ? owner.email : undefined,
        productsCount: prodCount,
        ordersCount: orderCount
      };
    });
  }

  public getActiveCustomerStores(): Store[] {
    return this.data.stores.filter(s => 
      !s.isDeleted && 
      s.status === 'active' && 
      s.subscriptionStatus === 'active'
    );
  }

  public findStoreById(id: string): Store | undefined {
    return this.data.stores.find(s => s.id === id && !s.isDeleted);
  }

  public findStoreByOwnerId(ownerId: string): Store | undefined {
    return this.data.stores.find(s => s.ownerId === ownerId && !s.isDeleted);
  }

  public addStore(store: Store): Store {
    this.data.stores.push(store);
    this.save();
    return store;
  }

  public updateStore(id: string, updates: Partial<Store>): Store | null {
    const idx = this.data.stores.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.data.stores[idx] = { ...this.data.stores[idx], ...updates };
      // Also cascade name updates to products if name changed
      if (updates.name) {
        this.data.products.forEach(p => {
          if (p.storeId === id) {
            p.storeName = updates.name;
          }
        });
      }
      this.save();
      return this.data.stores[idx];
    }
    return null;
  }

  public updateStoreLocation(id: string, location: StoreLocation): Store | null {
    const store = this.findStoreById(id);
    if (!store) return null;
    store.location = location;
    if (location.addressName) {
      store.address = location.addressName;
    }
    this.save();
    return store;
  }

  // Safe permanent deletion of store by Super Admin
  public deleteStorePermanent(storeId: string): boolean {
    const store = this.findStoreById(storeId);
    if (!store) return false;

    // 1. Remove store from stores list
    const storeIdx = this.data.stores.findIndex(s => s.id === storeId);
    if (storeIdx !== -1) {
      this.data.stores.splice(storeIdx, 1);
    }

    // 2. Cascade delete products of this store
    this.data.products = this.data.products.filter(p => p.storeId !== storeId);

    // 3. Cascade delete debts of this store
    this.data.debts = this.data.debts.filter(d => d.storeId !== storeId);

    // 4. Cascade delete sales of this store
    this.data.sales = this.data.sales.filter(s => s.storeId !== storeId);

    // 5. Cascade delete subscriptions of this store
    this.data.subscriptions = this.data.subscriptions.filter(sub => sub.storeId !== storeId);

    // 6. Keep customer orders for records or mark store deleted without breaking
    this.data.orders.forEach(o => {
      if (o.storeId === storeId) {
        o.storeName = `${o.storeName} (متجر محذوف)`;
      }
    });

    // 7. Update store owner user account storeId association
    const owner = this.data.users.find(u => u.storeId === storeId);
    if (owner) {
      owner.storeId = undefined;
      owner.status = 'disabled';
    }

    this.save();
    serverSupabase.deleteStoreCascade(storeId).catch(() => {});
    return true;
  }

  // --- Products ---
  public getProducts(storeId?: string): Product[] {
    if (storeId) {
      return this.data.products.filter(p => p.storeId === storeId);
    }
    return this.data.products;
  }

  public getActiveCustomerProducts(): Product[] {
    const activeStoreIds = new Set(this.getActiveCustomerStores().map(s => s.id));
    return this.data.products.filter(p => activeStoreIds.has(p.storeId) && p.isAvailable);
  }

  public findProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  public addProduct(product: Product): Product {
    this.data.products.unshift(product);
    this.save();
    return product;
  }

  public updateProduct(id: string, storeId: string, updates: Partial<Product>): Product | null {
    const idx = this.data.products.findIndex(p => p.id === id && p.storeId === storeId);
    if (idx !== -1) {
      this.data.products[idx] = { 
        ...this.data.products[idx], 
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return this.data.products[idx];
    }
    return null;
  }

  public updateProductAdmin(id: string, updates: Partial<Product>): Product | null {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.products[idx] = { 
        ...this.data.products[idx], 
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return this.data.products[idx];
    }
    return null;
  }

  public deleteProduct(id: string, storeId: string): boolean {
    const idx = this.data.products.findIndex(p => p.id === id && p.storeId === storeId);
    if (idx !== -1) {
      this.data.products.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  public decrementProductStock(productId: string, storeId: string, quantity: number): Product | null {
    const prod = this.data.products.find(p => p.id === productId && p.storeId === storeId);
    if (!prod) return null;
    prod.stockQuantity = Math.max(0, (prod.stockQuantity || 0) - quantity);
    prod.isAvailable = prod.stockQuantity > 0;
    prod.updatedAt = new Date().toISOString();
    this.save();
    return prod;
  }

  public deleteProductAdmin(id: string): boolean {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.products.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // --- Orders ---
  public getOrders(filters: { customerId?: string; storeId?: string }): Order[] {
    return this.data.orders.filter(o => {
      if (filters.customerId && o.customerId !== filters.customerId) return false;
      if (filters.storeId && o.storeId !== filters.storeId) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAllOrders(): Order[] {
    return [...this.data.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public findOrderById(id: string): Order | undefined {
    return this.data.orders.find(o => o.id === id);
  }

  public addOrder(order: Order): Order {
    this.data.orders.unshift(order);

    // Deduct stock for ordered products
    for (const item of order.items) {
      const prod = this.findProductById(item.productId);
      if (prod) {
        prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
        if (prod.stockQuantity === 0) {
          prod.isAvailable = false;
        }
      }
    }

    this.save();
    return order;
  }

  public updateOrderStatus(orderId: string, status: Order['status'], note?: string, storeId?: string): Order | null {
    const order = this.data.orders.find(o => o.id === orderId && (!storeId || o.storeId === storeId));
    if (!order) return null;

    order.status = status;
    order.updatedAt = new Date().toISOString();
    order.statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      note
    });

    // If completed, record automated sale for store
    if (status === 'completed') {
      const existingSale = this.data.sales.find(s => s.orderId === order.id);
      if (!existingSale) {
        this.addSale({
          id: 'sale_' + Date.now(),
          storeId: order.storeId,
          orderId: order.id,
          items: order.items.map(i => ({ name: i.productName, price: i.price, quantity: i.quantity })),
          totalAmount: order.totalAmount,
          paymentType: 'cash',
          customerName: order.customerName,
          notes: `طلب رقم ${order.orderNumber}`,
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        });
      }
    }

    this.save();
    return order;
  }

  // --- Debts (Strictly Isolated by storeId) ---
  public getDebts(storeId: string): Debt[] {
    return this.data.debts.filter(d => d.storeId === storeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public findDebtById(debtId: string, storeId: string): Debt | undefined {
    return this.data.debts.find(d => d.id === debtId && d.storeId === storeId);
  }

  public addDebt(debt: Debt): Debt {
    if (!Array.isArray(debt.items)) {
      debt.items = [];
    }
    if (!Array.isArray(debt.payments)) {
      debt.payments = [];
    }

    const itemsTotal = debt.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
    debt.amount = itemsTotal > 0 ? itemsTotal : (Number(debt.amount) || 0);
    debt.paidAmount = debt.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    debt.remainingAmount = Math.max(0, debt.amount - debt.paidAmount);

    if (debt.remainingAmount === 0 && (debt.amount > 0 || debt.paidAmount > 0)) {
      debt.status = 'paid';
    } else if (debt.paidAmount > 0 && debt.remainingAmount > 0) {
      debt.status = 'partially_paid';
    } else {
      debt.status = 'unpaid';
    }

    this.data.debts.unshift(debt);
    this.save();
    return debt;
  }

  public addDebtItem(debtId: string, storeId: string, itemData: { itemDescription: string; amount: number; date?: string; time?: string; notes?: string }): Debt | null {
    const debt = this.findDebtById(debtId, storeId);
    if (!debt) return null;

    if (!Array.isArray(debt.items)) {
      debt.items = [];
    }

    const now = new Date();
    const itemDate = itemData.date || now.toISOString().split('T')[0];
    const itemTime = itemData.time || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    debt.items.unshift({
      id: 'ditem_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      itemDescription: itemData.itemDescription.trim(),
      amount: Number(itemData.amount) || 0,
      date: itemDate,
      time: itemTime,
      notes: itemData.notes || '',
      createdAt: now.toISOString()
    });

    debt.amount = debt.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
    debt.remainingAmount = Math.max(0, debt.amount - debt.paidAmount);

    if (debt.remainingAmount === 0 && (debt.amount > 0 || debt.paidAmount > 0)) {
      debt.status = 'paid';
    } else if (debt.paidAmount > 0 && debt.remainingAmount > 0) {
      debt.status = 'partially_paid';
    } else {
      debt.status = 'unpaid';
    }

    debt.updatedAt = now.toISOString();
    this.save();
    return debt;
  }

  public deleteDebtItem(debtId: string, storeId: string, itemId: string): Debt | null {
    const debt = this.findDebtById(debtId, storeId);
    if (!debt) return null;

    debt.items = debt.items.filter(it => it.id !== itemId);
    debt.amount = debt.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
    debt.remainingAmount = Math.max(0, debt.amount - debt.paidAmount);

    if (debt.remainingAmount === 0 && (debt.amount > 0 || debt.paidAmount > 0)) {
      debt.status = 'paid';
    } else if (debt.paidAmount > 0 && debt.remainingAmount > 0) {
      debt.status = 'partially_paid';
    } else {
      debt.status = 'unpaid';
    }

    debt.updatedAt = new Date().toISOString();
    this.save();
    return debt;
  }

  public addDebtPayment(debtId: string, storeId: string, amount: number, note?: string, date?: string): Debt | null {
    const debt = this.findDebtById(debtId, storeId);
    if (!debt) return null;

    if (!Array.isArray(debt.payments)) {
      debt.payments = [];
    }

    const now = new Date();
    const paymentDate = date || now.toISOString().split('T')[0];

    const paymentId = 'pay_' + Date.now();
    debt.payments.unshift({
      id: paymentId,
      amount: Number(amount) || 0,
      date: paymentDate,
      note: note || 'دفعة تسديد على الحساب',
      createdAt: now.toISOString()
    });

    debt.paidAmount = debt.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    debt.remainingAmount = Math.max(0, debt.amount - debt.paidAmount);

    if (debt.remainingAmount === 0) {
      debt.status = 'paid';
    } else if (debt.paidAmount > 0) {
      debt.status = 'partially_paid';
    }

    debt.updatedAt = now.toISOString();
    this.save();
    return debt;
  }

  public settleDebtFull(debtId: string, storeId: string, note?: string): Debt | null {
    const debt = this.findDebtById(debtId, storeId);
    if (!debt) return null;

    if (debt.remainingAmount <= 0) {
      debt.status = 'paid';
      this.save();
      return debt;
    }

    const settleAmount = debt.remainingAmount;
    const now = new Date();

    if (!Array.isArray(debt.payments)) {
      debt.payments = [];
    }

    debt.payments.unshift({
      id: 'pay_settle_' + Date.now(),
      amount: settleAmount,
      date: now.toISOString().split('T')[0],
      note: note || 'تسوية الحساب بالكامل ✓',
      createdAt: now.toISOString()
    });

    debt.paidAmount = debt.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    debt.remainingAmount = 0;
    debt.status = 'paid';
    debt.updatedAt = now.toISOString();

    this.save();
    return debt;
  }

  public deleteDebt(debtId: string, storeId: string): boolean {
    const idx = this.data.debts.findIndex(d => d.id === debtId && d.storeId === storeId);
    if (idx !== -1) {
      this.data.debts.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // --- Sales (Strictly Isolated by storeId) ---
  public getSales(storeId: string): Sale[] {
    return this.data.sales.filter(s => s.storeId === storeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addSale(sale: Sale): Sale {
    this.data.sales.unshift(sale);
    this.save();
    return sale;
  }

  // --- Subscriptions ---
  public getSubscriptions(): Subscription[] {
    return this.data.subscriptions;
  }

  public getSubscriptionByStoreId(storeId: string): Subscription | undefined {
    return this.data.subscriptions.find(s => s.storeId === storeId);
  }

  public addSubscription(subscription: Subscription): Subscription {
    this.data.subscriptions.unshift(subscription);
    // Update store subscription status
    const store = this.findStoreById(subscription.storeId);
    if (store) {
      store.subscriptionStatus = subscription.status;
      store.subscriptionEndDate = subscription.endDate;
    }
    this.save();
    return subscription;
  }

  public updateSubscription(id: string, updates: Partial<Subscription>): Subscription | null {
    const idx = this.data.subscriptions.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.data.subscriptions[idx] = { ...this.data.subscriptions[idx], ...updates };
      const sub = this.data.subscriptions[idx];
      const store = this.findStoreById(sub.storeId);
      if (store) {
        if (updates.status) store.subscriptionStatus = updates.status;
        if (updates.endDate) store.subscriptionEndDate = updates.endDate;
      }
      this.save();
      return this.data.subscriptions[idx];
    }
    return null;
  }

  public extendSubscription(id: string, months: number): Subscription | null {
    const sub = this.data.subscriptions.find(s => s.id === id);
    if (!sub) return null;

    const currentEnd = new Date(sub.endDate);
    const baseDate = currentEnd.getTime() > Date.now() ? currentEnd : new Date();
    baseDate.setMonth(baseDate.getMonth() + months);
    const newEndDate = baseDate.toISOString().split('T')[0];

    sub.endDate = newEndDate;
    sub.status = 'active';
    sub.durationMonths += months;

    const store = this.findStoreById(sub.storeId);
    if (store) {
      store.subscriptionStatus = 'active';
      store.subscriptionEndDate = newEndDate;
    }

    this.save();
    return sub;
  }

  // --- Password Reset ---
  public createPasswordResetToken(email: string): string {
    const token = 'rst_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const item = {
      token,
      email: email.toLowerCase(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      used: false
    };
    this.data.passwordResetTokens.push(item);
    this.save();
    return token;
  }

  public verifyAndResetPassword(token: string, newPasswordPlain: string): { success: boolean; message: string } {
    const resetItem = this.data.passwordResetTokens.find(t => t.token === token && !t.used);
    if (!resetItem) {
      return { success: false, message: 'رابط استعادة كلمة المرور غير صالح أو تم استخدامه مسبقاً.' };
    }
    if (new Date(resetItem.expiresAt).getTime() < Date.now()) {
      return { success: false, message: 'انتهت صلاحية رابط استعادة كلمة المرور.' };
    }

    const user = this.data.users.find(u => u.email.toLowerCase() === resetItem.email);
    if (!user) {
      return { success: false, message: 'المستخدم غير موجود في النظام.' };
    }

    user.passwordHash = this.hashPassword(newPasswordPlain);
    resetItem.used = true;
    this.save();
    return { success: true, message: 'تم إعادة تعيين كلمة المرور وتشفيرها بنجاح. يمكنك الآن تسجيل الدخول.' };
  }

  // --- Platform Stats ---
  public getStats(): PlatformStats {
    const activeStores = this.data.stores.filter(s => !s.isDeleted && s.status === 'active' && s.subscriptionStatus === 'active').length;
    const pausedStores = this.data.stores.filter(s => !s.isDeleted && (s.status === 'inactive' || s.subscriptionStatus !== 'active')).length;
    const totalCustomers = this.data.users.filter(u => u.role === 'customer').length;
    const totalStoreOwners = this.data.users.filter(u => u.role === 'store_owner').length;
    const totalProducts = this.data.products.length;
    const activeSubscriptions = this.data.subscriptions.filter(s => s.status === 'active').length;
    const expiredSubscriptions = this.data.subscriptions.filter(s => s.status === 'expired').length;
    const totalOrders = this.data.orders.length;
    const totalPlatformSales = this.data.orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.totalAmount, 0) + 
      this.data.sales.reduce((sum, s) => sum + s.totalAmount, 0);

    return {
      totalStores: this.data.stores.filter(s => !s.isDeleted).length,
      activeStores,
      pausedStores,
      totalCustomers,
      totalStoreOwners,
      totalProducts,
      activeSubscriptions,
      expiredSubscriptions,
      totalOrders,
      totalPlatformSales
    };
  }

  // --- Full Backup, Restore & Synchronization with LocalStorage ---
  public getFullSnapshot(): DatabaseSchema {
    return JSON.parse(JSON.stringify(this.data));
  }

  public restoreFullSnapshot(snapshot: Partial<DatabaseSchema>): { success: boolean; message: string } {
    if (!snapshot || typeof snapshot !== 'object') {
      return { success: false, message: 'بيانات النسخة الاحتياطية غير صالحة.' };
    }

    if (Array.isArray(snapshot.users) && snapshot.users.length > 0) this.data.users = snapshot.users;
    if (Array.isArray(snapshot.stores) && snapshot.stores.length > 0) this.data.stores = snapshot.stores;
    if (Array.isArray(snapshot.products)) this.data.products = snapshot.products;
    if (Array.isArray(snapshot.orders)) this.data.orders = snapshot.orders;
    if (Array.isArray(snapshot.debts)) this.data.debts = snapshot.debts;
    if (Array.isArray(snapshot.sales)) this.data.sales = snapshot.sales;
    if (Array.isArray(snapshot.subscriptions)) this.data.subscriptions = snapshot.subscriptions;
    if (Array.isArray(snapshot.activationCodes)) this.data.activationCodes = snapshot.activationCodes;

    this.save();
    return { success: true, message: 'تم استرجاع ومزامنة كافة بيانات التطبيق بنجاح.' };
  }

  public mergeSnapshot(incoming: Partial<DatabaseSchema>): { success: boolean; message: string; data: DatabaseSchema } {
    if (!incoming || typeof incoming !== 'object') {
      return { success: true, message: 'لا توجد بيانات جديدة للمزامنة.', data: this.getFullSnapshot() };
    }

    const mergeList = <T extends { id: string }>(currentList: T[], incomingList?: T[]): T[] => {
      if (!Array.isArray(incomingList) || incomingList.length === 0) return currentList;
      const map = new Map<string, T>();
      currentList.forEach(item => {
        if (item && item.id) map.set(item.id, item);
      });
      incomingList.forEach(item => {
        if (item && item.id) {
          const existing = map.get(item.id);
          map.set(item.id, existing ? { ...existing, ...item } : item);
        }
      });
      return Array.from(map.values());
    };

    if (Array.isArray(incoming.users) && incoming.users.length > 0) {
      this.data.users = mergeList(this.data.users, incoming.users);
    }
    if (Array.isArray(incoming.stores) && incoming.stores.length > 0) {
      this.data.stores = mergeList(this.data.stores, incoming.stores);
    }
    if (Array.isArray(incoming.products) && incoming.products.length > 0) {
      this.data.products = mergeList(this.data.products, incoming.products);
    }
    if (Array.isArray(incoming.orders) && incoming.orders.length > 0) {
      this.data.orders = mergeList(this.data.orders, incoming.orders);
    }
    if (Array.isArray(incoming.debts) && incoming.debts.length > 0) {
      this.data.debts = mergeList(this.data.debts, incoming.debts);
    }
    if (Array.isArray(incoming.sales) && incoming.sales.length > 0) {
      this.data.sales = mergeList(this.data.sales, incoming.sales);
    }
    if (Array.isArray(incoming.subscriptions) && incoming.subscriptions.length > 0) {
      this.data.subscriptions = mergeList(this.data.subscriptions, incoming.subscriptions);
    }
    if (Array.isArray(incoming.activationCodes) && incoming.activationCodes.length > 0) {
      this.data.activationCodes = mergeList(this.data.activationCodes, incoming.activationCodes);
    }

    this.save();
    return {
      success: true,
      message: 'تمت مزامنة وحفظ كافة البيانات في قاعدة البيانات والذاكرة بنجاح.',
      data: this.getFullSnapshot()
    };
  }
}

export const db = new Database();
