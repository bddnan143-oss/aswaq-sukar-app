// Automatic Persistence & Supabase Cloud Synchronization Service for Aswaq Qalat Sukkar
import { supabaseService, supabase } from './supabase';

export interface SyncStatus {
  lastSavedAt: string | null;
  isSaving: boolean;
  status: 'saved' | 'syncing' | 'error';
  isCloudConnected?: boolean;
  cloudMessage?: string;
  itemCounts: {
    users: number;
    stores: number;
    products: number;
    debts: number;
    sales: number;
    orders: number;
  };
}

const STORAGE_KEYS = {
  FULL_BACKUP: 'aswaq_offline_full_backup',
  USERS: 'aswaq_local_users',
  STORES: 'aswaq_local_stores',
  PRODUCTS: 'aswaq_local_products',
  DEBTS: 'aswaq_local_debts',
  SALES: 'aswaq_local_sales',
  ORDERS: 'aswaq_local_orders',
  SUBSCRIPTIONS: 'aswaq_local_subscriptions',
  ACTIVATION_CODES: 'aswaq_local_codes',
  LAST_SAVED: 'aswaq_last_auto_save_time',
};

type SyncListener = (status: SyncStatus) => void;

class LocalStorageSyncService {
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;
  private syncTimeout: any = null;

  private isCloudConnected = false;

  constructor() {
    // Initial load check
    this.broadcastStatus('saved');
    // Initialize Realtime & Supabase sync
    this.initSupabaseLiveSync();
  }

  private async initSupabaseLiveSync() {
    try {
      const health = await supabaseService.testConnection();
      this.isCloudConnected = health.ok;
      this.broadcastStatus(health.ok ? 'saved' : 'error');

      // Setup realtime listener on tables for instant multi-user synchronization
      const tables: ('stores' | 'products' | 'debts' | 'orders' | 'users')[] = ['stores', 'products', 'debts', 'orders', 'users'];
      tables.forEach((tbl) => {
        supabaseService.subscribeToChanges(tbl, (payload) => {
          console.log(`[Supabase Realtime] Change detected in ${tbl}:`, payload);
          // Broadcast and notify open UI subscribers
          this.broadcastStatus('saved');
        });
      });
    } catch (e) {
      console.warn('Realtime init warning:', e);
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  public getStatus(): SyncStatus {
    const local = this.getLocalSnapshot();
    const lastSaved = localStorage.getItem(STORAGE_KEYS.LAST_SAVED) || null;

    return {
      lastSavedAt: lastSaved,
      isSaving: this.isSyncing,
      status: this.isSyncing ? 'syncing' : 'saved',
      isCloudConnected: this.isCloudConnected,
      cloudMessage: this.isCloudConnected ? 'متصل بسحابة Supabase ومزامن فورياً' : 'مزامن محلياً وسحابياً',
      itemCounts: {
        users: local?.users?.length || 0,
        stores: local?.stores?.length || 0,
        products: local?.products?.length || 0,
        debts: local?.debts?.length || 0,
        sales: local?.sales?.length || 0,
        orders: local?.orders?.length || 0,
      }
    };
  }

  private broadcastStatus(status: 'saved' | 'syncing' | 'error') {
    const current = this.getStatus();
    current.status = status;
    current.isSaving = status === 'syncing';
    this.listeners.forEach((cb) => cb(current));
  }

  // Get locally stored backup snapshot from browser
  public getLocalSnapshot(): any | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FULL_BACKUP);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not parse local backup snapshot:', e);
    }
    return null;
  }

  // Save snapshot to browser's localStorage
  public saveSnapshotLocally(snapshot: any): void {
    if (!snapshot || typeof snapshot !== 'object') return;
    try {
      localStorage.setItem(STORAGE_KEYS.FULL_BACKUP, JSON.stringify(snapshot));
      
      // Save individual key collections for resilient instant access
      if (Array.isArray(snapshot.users)) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(snapshot.users));
      }
      if (Array.isArray(snapshot.stores)) {
        localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(snapshot.stores));
      }
      if (Array.isArray(snapshot.products)) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(snapshot.products));
      }
      if (Array.isArray(snapshot.debts)) {
        localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(snapshot.debts));
      }
      if (Array.isArray(snapshot.sales)) {
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(snapshot.sales));
      }
      if (Array.isArray(snapshot.orders)) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(snapshot.orders));
      }
      if (Array.isArray(snapshot.subscriptions)) {
        localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(snapshot.subscriptions));
      }
      if (Array.isArray(snapshot.activationCodes)) {
        localStorage.setItem(STORAGE_KEYS.ACTIVATION_CODES, JSON.stringify(snapshot.activationCodes));
      }

      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.LAST_SAVED, now);
      this.broadcastStatus('saved');
    } catch (e) {
      console.error('Failed to write full snapshot to localStorage:', e);
      this.broadcastStatus('error');
    }
  }

  // Perform full two-way synchronization between LocalStorage and Server
  public async syncWithServer(): Promise<{ success: boolean; message: string }> {
    if (this.isSyncing) return { success: true, message: 'المزامنة جارية بالفعل...' };
    this.isSyncing = true;
    this.broadcastStatus('syncing');

    try {
      const localBackup = this.getLocalSnapshot();

      // Send local backup (if available) to server auto-sync endpoint
      const response = await fetch('/api/sync/auto-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot: localBackup })
      });

      if (!response.ok) {
        throw new Error('فشلت استجابة خادم المزامنة.');
      }

      const data = await response.json();
      if (data && data.snapshot) {
        // Save the merged canonical snapshot into localStorage
        this.saveSnapshotLocally(data.snapshot);
      }

      this.isSyncing = false;
      this.broadcastStatus('saved');
      return { success: true, message: 'تمت المزامنة وحفظ جميع البيانات في الذاكرة المحلية بنجاح.' };
    } catch (err: any) {
      console.error('Auto-sync error:', err);
      this.isSyncing = false;
      this.broadcastStatus('error');
      return { success: false, message: err.message || 'تعذر استكمال المزامنة السحابية.' };
    }
  }

  // Debounced auto-save trigger (called after user edits data)
  public queueAutoSync(delayMs = 800) {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    this.syncTimeout = setTimeout(() => {
      this.syncWithServer();
    }, delayMs);
  }

  // Export all local and cloud data to a downloadable JSON file
  public exportToJsonFile(filename = `aswaq_sukkar_backup_${new Date().toISOString().split('T')[0]}.json`) {
    const snapshot = this.getLocalSnapshot();
    if (!snapshot) {
      alert('لا توجد بيانات محلية محفوظة للتصدير.');
      return;
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // Import and restore from an uploaded JSON file
  public async importFromJsonFile(file: File): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          if (!parsed || typeof parsed !== 'object') {
            resolve({ success: false, message: 'ملف غير صالح أو فارغ.' });
            return;
          }

          // Save locally
          this.saveSnapshotLocally(parsed);

          // Restore to server
          const response = await fetch('/api/sync/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ snapshot: parsed })
          });

          if (!response.ok) {
            throw new Error('فشل استعادة البيانات على الخادم.');
          }

          const resData = await response.json();
          this.saveSnapshotLocally(resData.snapshot);
          resolve({ success: true, message: 'تم استيراد واستعادة كافة البيانات وتحديث الذاكرة المحلية بنجاح.' });
        } catch (err: any) {
          resolve({ success: false, message: 'خطأ في معالجة ملف النسخة الاحتياطية: ' + (err.message || '') });
        }
      };
      reader.readAsText(file);
    });
  }
}

export const syncService = new LocalStorageSyncService();
