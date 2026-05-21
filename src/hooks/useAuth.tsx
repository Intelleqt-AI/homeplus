import { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';

export const PENDING_TOKEN_KEY = 'hp_pending_token';

const normalizeUser = (djangoUser: any) => {
  if (!djangoUser) return null;
  return {
    id: djangoUser.id,
    email: djangoUser.email,
    created_at: djangoUser.date_joined,
    user_metadata: {
      full_name: djangoUser.full_name || `${djangoUser.first_name} ${djangoUser.last_name}`.trim(),
      first_name: djangoUser.first_name,
      last_name: djangoUser.last_name,
      location: djangoUser.profile?.location ?? '',
      postcode: djangoUser.profile?.postcode ?? '',
      property_type: djangoUser.profile?.property_type ?? '',
      avatar_url: djangoUser.profile?.avatar_url ?? '',
    },
    _raw: djangoUser,
  };
};

interface AuthContextType {
  user: any | null;
  session: any | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any; pendingToken?: string; email?: string }>;
  verifyEmail: (pendingToken: string, otp: string) => Promise<{ error: any; user?: any }>;
  resendOTP: (pendingToken: string) => Promise<{ error: any }>;
  cancelRegistration: (pendingToken: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const { data: res } = await apiClient.get('/api/v1/auth/me/', { _skipRefresh: true } as any);
      const normalized = normalizeUser(res.data);
      setUser(normalized);
      return normalized;
    } catch {
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    if (user) { setLoading(false); return; }
    fetchMe().finally(() => setLoading(false));
  }, []);

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { data: res } = await apiClient.post('/api/v1/auth/register/', {
        email,
        password,
        password_confirm: password,
        first_name: metadata?.first_name || metadata?.full_name?.split(' ')[0] || '',
        last_name: metadata?.last_name || metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        property_type: metadata?.property_type || '',
        postcode: String(metadata?.postcode || ''),
        location: metadata?.location || '',
      }, { _skipRefresh: true } as any);

      const { pending_token, email: userEmail } = res.data;
      localStorage.setItem(PENDING_TOKEN_KEY, pending_token);
      return { error: null, pendingToken: pending_token, email: userEmail };
    } catch (err: any) {
      const errors = err.response?.data?.errors || {};
      const msg =
        errors.email?.[0] ||
        errors.password?.[0] ||
        errors.non_field_errors?.[0] ||
        err.response?.data?.message ||
        'Registration failed.';
      return { error: { message: msg } };
    }
  };

  const verifyEmail = async (pendingToken: string, otp: string) => {
    try {
      const { data: res } = await apiClient.post('/api/v1/auth/verify-email/', {
        pending_token: pendingToken,
        otp,
      }, { _skipRefresh: true } as any);

      localStorage.removeItem(PENDING_TOKEN_KEY);
      const normalized = normalizeUser(res.data.user);
      setUser(normalized);
      return { error: null, user: normalized };
    } catch (err: any) {
      const errors = err.response?.data?.errors || {};
      const msg =
        errors.otp?.[0] ||
        errors.pending_token?.[0] ||
        errors.detail?.[0] ||
        err.response?.data?.message ||
        'Verification failed.';
      return { error: { message: msg } };
    }
  };

  const resendOTP = async (pendingToken: string) => {
    try {
      await apiClient.post('/api/v1/auth/resend-otp/', { pending_token: pendingToken }, { _skipRefresh: true } as any);
      return { error: null };
    } catch (err: any) {
      return { error: { message: err.response?.data?.message || 'Failed to resend code.' } };
    }
  };

  const cancelRegistration = async (pendingToken: string) => {
    try {
      await apiClient.post('/api/v1/auth/cancel-registration/', { pending_token: pendingToken }, { _skipRefresh: true } as any);
    } catch {
      // best effort
    } finally {
      localStorage.removeItem(PENDING_TOKEN_KEY);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data: res } = await apiClient.post('/api/v1/auth/login/', { email, password }, { _skipRefresh: true } as any);
      const normalized = normalizeUser(res.data.user);
      setUser(normalized);
      return { error: null };
    } catch (err: any) {
      const errors = err.response?.data?.errors || {};
      const msg =
        errors.non_field_errors?.[0] ||
        err.response?.data?.message ||
        'Invalid email or password.';
      return { error: { message: msg } };
    }
  };

  const signOut = async () => {
    try {
      await apiClient.post('/api/v1/auth/logout/', {}, { _skipRefresh: true } as any);
    } catch {
      // backend clears cookies regardless
    } finally {
      setUser(null);
    }
    return { error: null };
  };

  const refreshUser = async () => { await fetchMe(); };

  return (
    <AuthContext.Provider value={{
      user, session: user ? { user } : null, loading,
      signUp, verifyEmail, resendOTP, cancelRegistration,
      signIn, signOut, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
