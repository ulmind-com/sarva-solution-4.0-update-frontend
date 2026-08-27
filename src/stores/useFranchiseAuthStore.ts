import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface FranchiseData {
  _id: string;
  vendorId: string;
  name: string;
  shopName: string;
  email: string;
  phone: string;
  city: string;
  status: string;
}

interface FranchiseAuthState {
  franchise: FranchiseData | null;
  franchiseToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (vendorId: string, password: string) => Promise<{ success: boolean }>;
  logout: () => void;
  clearError: () => void;
}

export const useFranchiseAuthStore = create<FranchiseAuthState>()(
  persist(
    (set) => ({
      franchise: null,
      franchiseToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (vendorId: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.post('/api/v1/franchise/login', {
            vendorId,
            password,
          });

          const { token, franchise } = response.data.data || response.data;

          set({
            franchise,
            franchiseToken: token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return { success: true };
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Invalid Vendor ID or Password';
          set({
            isLoading: false,
            error: errorMessage,
          });
          return { success: false };
        }
      },

      logout: () => {
        set({
          franchise: null,
          franchiseToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'franchise-auth-storage',
      partialize: (state) => ({
        franchise: state.franchise,
        franchiseToken: state.franchiseToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
