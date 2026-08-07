import { createContext, useContext } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';
import apiClient from '@/lib/apiClient';
import useFetch from '@/hooks/useFetch';

export const PENDING_TOKEN_KEY = 'hp_pending_token';

const ME_URL = '/api/v1/auth/me/';

type SkipRefreshConfig = AxiosRequestConfig & { _skipRefresh?: boolean };

export type HomePlusUser = {
  id: string;
  email: string;
  created_at: string;
  user_metadata: {
    full_name: string;
    first_name: string;
    last_name: string;
    location: string;
    postcode: string;
    property_type: string;
    avatar_url: string;
  };
  _raw: Record<string, unknown>;
};

type AuthResult = { error: { message: string } | null };

const normalizeUser = (raw: unknown): HomePlusUser | null => {
  if (!raw || typeof raw !== 'object') return null;
  const u = raw as Record<string, unknown>;
  const profile = (u.profile ?? {}) as Record<string, unknown>;
  const firstName = String(u.first_name ?? '');
  const lastName = String(u.last_name ?? '');
  return {
    id: String(u.id ?? ''),
    email: String(u.email ?? ''),
    created_at: String(u.date_joined ?? ''),
    user_metadata: {
      full_name: String(u.full_name ?? `${firstName} ${lastName}`.trim()),
      first_name: firstName,
      last_name: lastName,
      location: String(profile.location ?? ''),
      postcode: String(profile.postcode ?? ''),
      property_type: String(profile.property_type ?? ''),
      avatar_url: String(profile.avatar_url ?? ''),
    },
    _raw: u,
  };
};

interface AuthContextType {
  user: HomePlusUser | null;
  session: { user: HomePlusUser } | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, unknown>,
  ) => Promise<AuthResult & { pendingToken?: string; email?: string }>;
  verifyEmail: (pendingToken: string, otp: string) => Promise<AuthResult & { user?: HomePlusUser }>;
  resendOTP: (pendingToken: string) => Promise<AuthResult>;
  cancelRegistration: (pendingToken: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const skipRefresh: SkipRefreshConfig = { _skipRefresh: true };

const extractUser = (res: unknown): unknown => {
  if (!res || typeof res !== 'object') return res;
  const r = res as Record<string, unknown>;
  return r?.data && typeof r.data === 'object' ? ((r.data as Record<string, unknown>)?.user ?? r.data) : res;
};

const extractError = (err: unknown): string => {
  const e = err as { response?: { data?: { errors?: Record<string, string | string[]>; message?: string } } };
  const first = Object.values(e?.response?.data?.errors ?? {})[0];
  const msg = Array.isArray(first) ? first[0] : first;
  return msg || e?.response?.data?.message || 'Something went wrong.';
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading: loading,
    refetch,
  } = useFetch<HomePlusUser | null>(ME_URL, {
    queryFn: async () => {
      try {
        const { data: res } = await apiClient.get(ME_URL, skipRefresh);
        return normalizeUser(extractUser(res));
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401) return null;
        throw err;
      }
    },
    // retry: false,
    // staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const signUp = async (
    email: string,
    password: string,
    metadata: Record<string, unknown> = {},
  ): Promise<AuthResult & { pendingToken?: string; email?: string }> => {
    try {
      const { data: res } = await apiClient.post(
        '/api/v1/auth/register/',
        {
          email,
          password,
          password_confirm: password,
          first_name: metadata.first_name ?? String(metadata.full_name ?? '').split(' ')[0] ?? '',
          last_name:
            metadata.last_name ??
            String(metadata.full_name ?? '')
              .split(' ')
              .slice(1)
              .join(' ') ??
            '',
          property_type: metadata.property_type ?? '',
          postcode: String(metadata.postcode ?? ''),
          location: metadata.location ?? '',
        },
        skipRefresh,
      );

      const data = (res as Record<string, unknown>)?.data as Record<string, unknown>;
      const pending_token = String(data?.pending_token ?? '');
      const userEmail = String(data?.email ?? '');
      localStorage.setItem(PENDING_TOKEN_KEY, pending_token);
      return { error: null, pendingToken: pending_token, email: userEmail };
    } catch (err: unknown) {
      return { error: { message: extractError(err) } };
    }
  };

  const verifyEmail = async (pendingToken: string, otp: string): Promise<AuthResult & { user?: HomePlusUser }> => {
    try {
      const { data: res } = await apiClient.post(
        '/api/v1/auth/verify-email/',
        {
          pending_token: pendingToken,
          otp,
        },
        skipRefresh,
      );

      localStorage.removeItem(PENDING_TOKEN_KEY);
      const normalized = normalizeUser(extractUser(res));
      queryClient.setQueryData([ME_URL], normalized);
      return { error: null, user: normalized ?? undefined };
    } catch (err: unknown) {
      return { error: { message: extractError(err) } };
    }
  };

  const resendOTP = async (pendingToken: string): Promise<AuthResult> => {
    try {
      await apiClient.post('/api/v1/auth/resend-otp/', { pending_token: pendingToken }, skipRefresh);
      return { error: null };
    } catch (err: unknown) {
      return { error: { message: extractError(err) } };
    }
  };

  const cancelRegistration = async (pendingToken: string): Promise<void> => {
    try {
      await apiClient.post('/api/v1/auth/cancel-registration/', { pending_token: pendingToken }, skipRefresh);
    } catch {
      // best effort
    } finally {
      localStorage.removeItem(PENDING_TOKEN_KEY);
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { data: res } = await apiClient.post('/api/v1/auth/login/', { email, password }, skipRefresh);
      const normalized = normalizeUser(extractUser(res));
      queryClient.setQueryData([ME_URL], normalized);
      return { error: null };
    } catch (err: unknown) {
      return { error: { message: extractError(err) } };
    }
  };

  const signOut = async (): Promise<AuthResult> => {
    queryClient.setQueryData([ME_URL], null);
    apiClient.post('/api/v1/auth/logout/', {}, skipRefresh).catch(() => {});
    return { error: null };
  };

  const refreshUser = async (): Promise<void> => {
    await refetch();
  };

  const resolvedUser = user ?? null;

  return (
    <AuthContext.Provider
      value={{
        user: resolvedUser,
        session: resolvedUser ? { user: resolvedUser } : null,
        loading,
        signUp,
        verifyEmail,
        resendOTP,
        cancelRegistration,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
