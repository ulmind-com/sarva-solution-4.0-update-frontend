import React, { createContext, useContext, useState, useCallback } from 'react';
import { users, User, Transaction, transactions as initialTransactions } from '@/data/mockData';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; redirect: string }>;
  logout: () => void;
  updateUserBalance: (amount: number) => void;
  allUsers: User[];
  updateUser: (userId: string, updates: Partial<User>) => void;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transactionId: string, updates: Partial<Transaction>) => void;
  loginAsUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>(users);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

  const login = useCallback(async (email: string, _password: string) => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (user) {
      setCurrentUser(user);
      const isAdminUser = email.toLowerCase() === 'admin@ulmind.com';
      setIsAdmin(isAdminUser);
      setIsLoading(false);
      return { 
        success: true, 
        redirect: isAdminUser ? '/admin' : '/dashboard' 
      };
    }
    
    setIsLoading(false);
    return { success: false, redirect: '' };
  }, [allUsers]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsAdmin(false);
  }, []);

  const updateUserBalance = useCallback((amount: number) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, balance: currentUser.balance + amount };
      setCurrentUser(updatedUser);
      setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    }
  }, [currentUser]);

  const updateUser = useCallback((userId: string, updates: Partial<User>) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [currentUser]);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `T${String(transactions.length + 1).padStart(3, '0')}`
    };
    setTransactions(prev => [newTransaction, ...prev]);
  }, [transactions.length]);

  const updateTransaction = useCallback((transactionId: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => 
      t.id === transactionId ? { ...t, ...updates } : t
    ));
  }, []);

  const loginAsUser = useCallback((userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setIsAdmin(false);
    }
  }, [allUsers]);

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAdmin,
      isLoading,
      login,
      logout,
      updateUserBalance,
      allUsers,
      updateUser,
      transactions,
      addTransaction,
      updateTransaction,
      loginAsUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
