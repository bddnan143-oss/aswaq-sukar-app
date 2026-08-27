import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Store } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  store: Store | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  setupInitialSuperAdmin: (data: { name?: string; phone?: string; email: string; password: string }) => Promise<void>;
  registerCustomer: (data: { name: string; phone: string; email: string; password: string }) => Promise<void>;
  registerStoreOwner: (data: {
    name: string;
    phone: string;
    email: string;
    password: string;
    storeName: string;
    category?: string;
    address?: string;
    activationCode: string;
  }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize or restore session
  useEffect(() => {
    const savedUser = localStorage.getItem('aswaq_current_user');
    const savedStore = localStorage.getItem('aswaq_current_store');

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        api.setUserId(parsedUser.id);
        if (savedStore) {
          setStore(JSON.parse(savedStore));
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    } else {
      api.setUserId(null);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    setUser(res.user);
    setStore(res.store || null);
    api.setUserId(res.user.id);
    localStorage.setItem('aswaq_current_user', JSON.stringify(res.user));
    if (res.store) {
      localStorage.setItem('aswaq_current_store', JSON.stringify(res.store));
    } else {
      localStorage.removeItem('aswaq_current_store');
    }
  };

  const setupInitialSuperAdmin = async (data: { name?: string; phone?: string; email: string; password: string }) => {
    const res = await api.setupInitialSuperAdmin(data);
    setUser(res.user);
    setStore(null);
    api.setUserId(res.user.id);
    localStorage.setItem('aswaq_current_user', JSON.stringify(res.user));
    localStorage.removeItem('aswaq_current_store');
  };

  const registerCustomer = async (data: { name: string; phone: string; email: string; password: string }) => {
    const res = await api.registerCustomer(data);
    setUser(res.user);
    setStore(null);
    api.setUserId(res.user.id);
    localStorage.setItem('aswaq_current_user', JSON.stringify(res.user));
    localStorage.removeItem('aswaq_current_store');
  };

  const registerStoreOwner = async (data: {
    name: string;
    phone: string;
    email: string;
    password: string;
    storeName: string;
    category?: string;
    address?: string;
    activationCode: string;
  }) => {
    const res = await api.registerStoreOwner(data);
    setUser(res.user);
    setStore(res.store);
    api.setUserId(res.user.id);
    localStorage.setItem('aswaq_current_user', JSON.stringify(res.user));
    localStorage.setItem('aswaq_current_store', JSON.stringify(res.store));
  };

  const logout = () => {
    setUser(null);
    setStore(null);
    api.setUserId(null);
    localStorage.removeItem('aswaq_current_user');
    localStorage.removeItem('aswaq_current_store');
  };

  const refreshProfile = async () => {
    if (!user) return;
    if (user.role === 'store_owner') {
      try {
        const res = await api.getOwnerStore();
        setStore(res.store);
        localStorage.setItem('aswaq_current_store', JSON.stringify(res.store));
      } catch (e) {
        console.error('Error refreshing store profile:', e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        store,
        isLoading,
        login,
        setupInitialSuperAdmin,
        registerCustomer,
        registerStoreOwner,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
