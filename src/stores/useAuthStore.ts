import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

export interface UserWallet {
  availableBalance: number;
  totalEarnings: number;
  pendingWithdrawal: number;
}

export interface UserAddress {
  street?: string;
  city?: string;
  state?: string;
  pinCode?: string;
}

export interface BankAccount {
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  branch?: string;
  accountName?: string;
}

export interface NomineeDetails {
  name?: string;
  relation?: string;
  dateOfBirth?: string;
}

export interface KYCDetails {
  status: 'none' | 'pending' | 'approved' | 'rejected';
  aadhaarNumber?: string;
  panCardNumber?: string;
  aadhaarFront?: { url: string };
  aadhaarBack?: { url: string };
  panImage?: { url: string };
  rejectionReason?: string;
}

export interface ApiUser {
  _id: string;
  memberId: string;
  fullName: string;
  email: string;
  phone: string;
  sponsorId: string;
  sponsorName?: string;
  panCardNumber: string;
  rank: string;
  currentRank?: string;
  role: 'user' | 'admin';
  leftPV: number;
  rightPV: number;
  leftTeamCount?: number;
  rightTeamCount?: number;
  wallet: UserWallet;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  profilePicture?: { url: string } | null;
  dateOfBirth?: string;
  address?: UserAddress;
  nominee?: NomineeDetails;
  kyc?: KYCDetails;
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  sponsorId: string;
  panCardNumber: string;
  preferredPosition: 'left' | 'right';
}

interface RegisterResponse {
  success: boolean;
  message?: string;
  data?: {
    memberId: string;
    token?: string;
  };
  memberId?: string;
}

interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: ApiUser;
  };
  message?: string;
}

interface ProfileResponse {
  success: boolean;
  data: {
    user: ApiUser;
    bankAccount?: BankAccount;
  };
}

interface AuthState {
  user: ApiUser | null;
  token: string | null;
  bankDetails: BankAccount | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  error: string | null;
  registeredMemberId: string | null;
  registeredPassword?: string | null;
  registeredFullName?: string | null;
  showMemberIdModal: boolean;

  // Actions
  login: (memberId: string, password: string) => Promise<{ success: boolean; redirect?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; memberId?: string }>;
  logout: () => void;
  clearError: () => void;
  closeMemberIdModal: () => void;
  fetchProfile: () => Promise<{ success: boolean }>;
  updateProfile: (formData: FormData) => Promise<{ success: boolean }>;
  submitKYC: (formData: FormData) => Promise<{ success: boolean }>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      bankDetails: null,
      isLoading: false,
      isProfileLoading: false,
      error: null,
      registeredMemberId: null,
      registeredPassword: null,
      registeredFullName: null,
      showMemberIdModal: false,

      login: async (memberId: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.post<LoginResponse>('/api/v1/login/user', {
            memberId,
            password,
          });
          
          const { token, user } = response.data.data;
          
          set({
            user,
            token,
            isLoading: false,
            error: null,
          });
          
          // Role-based redirect
          const redirect = user.role === 'admin' ? '/admin/users' : '/dashboard/profile';
          return { success: true, redirect };
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Invalid Member ID or Password';
          set({
            isLoading: false,
            error: errorMessage,
          });
          return { success: false };
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.post<RegisterResponse>('/api/v1/register/user', userData);
          const memberId = response.data?.data?.memberId || response.data?.memberId || 'N/A';
          
          set({
            isLoading: false,
            error: null,
            registeredMemberId: memberId,
            registeredPassword: userData.password,
            registeredFullName: userData.fullName,
            showMemberIdModal: true,
          });
          
          return { success: true, memberId };
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
          set({
            isLoading: false,
            error: errorMessage,
          });
          return { success: false };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          bankDetails: null,
          error: null,
          registeredMemberId: null,
          registeredPassword: null,
          registeredFullName: null,
          showMemberIdModal: false,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      closeMemberIdModal: () => {
        set({ showMemberIdModal: false, registeredMemberId: null, registeredPassword: null, registeredFullName: null });
      },

      fetchProfile: async () => {
        set({ isProfileLoading: true });
        
        try {
          const response = await api.get<ProfileResponse>('/api/v1/profile');
          
          const { user, bankAccount } = response.data.data;
          
          set({
            user,
            bankDetails: bankAccount || null,
            isProfileLoading: false,
          });
          
          return { success: true };
        } catch (error: any) {
          console.error('Error fetching profile:', error);
          set({ isProfileLoading: false });
          return { success: false };
        }
      },

      updateProfile: async (formData: FormData) => {
        set({ isLoading: true, error: null });
        
        try {
          await api.patch('/api/v1/profile', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          set({ isLoading: false });
          
          // Refresh profile data after successful update
          await get().fetchProfile();
          
          return { success: true };
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to update profile. Please try again.';
          set({
            isLoading: false,
            error: errorMessage,
          });
          return { success: false };
        }
      },

      submitKYC: async (formData: FormData) => {
        set({ isLoading: true, error: null });
        
        try {
          await api.post('/api/v1/kyc/submit', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          // Immediately update local kyc status to 'pending'
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: {
                ...currentUser,
                kyc: {
                  ...currentUser.kyc,
                  status: 'pending',
                },
              },
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
          
          return { success: true };
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'KYC submission failed. Please try again.';
          set({
            isLoading: false,
            error: errorMessage,
          });
          // Throw error so component can handle specific cases
          throw new Error(errorMessage);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        bankDetails: state.bankDetails,
      }),
    }
  )
);
