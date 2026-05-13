import { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';

// Normalize Django user → shape matching what the rest of the app expects
// (user.user_metadata.full_name, user.user_metadata.property_type, etc.)
const normalizeUser = (djangoUser: any) => {
  if (!djangoUser) return null;
  return {
    id: djangoUser.id,
    email: djangoUser.email,
    created_at: djangoUser.date_joined,
    // Map Django profile fields onto user_metadata so existing components
    // that read user.user_metadata.* continue to work without changes
    user_metadata: {
      full_name: djangoUser.full_name || `${djangoUser.first_name} ${djangoUser.last_name}`.trim(),
      first_name: djangoUser.first_name,
      last_name: djangoUser.last_name,
      location: djangoUser.profile?.location ?? '',
      postcode: djangoUser.profile?.postcode ?? '',
      property_type: djangoUser.profile?.property_type ?? '',
      avatar_url: djangoUser.profile?.avatar_url ?? '',
    },
    // Keep raw Django fields accessible too
    _raw: djangoUser,
  };
};

interface AuthContextType {
  user: any | null;
  session: any | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
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
      const { data: res } = await apiClient.get('/api/v1/auth/me/');
      const normalized = normalizeUser(res.data);
      setUser(normalized);
      return normalized;
    } catch {
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }
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
      });

      const { access, refresh, user: djangoUser } = res.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      // Save profile fields right after registration
      if (metadata) {
        try {
          await apiClient.patch('/api/v1/auth/me/', {
            profile: {
              location: metadata.location || '',
              postcode: String(metadata.postcode || ''),
              property_type: metadata.property_type || '',
            },
          });
        } catch {
          // Non-fatal — user is registered, profile update can be retried
        }
      }

      const normalized = normalizeUser(djangoUser);
      setUser(normalized);
      return { error: null };
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

  const signIn = async (email: string, password: string) => {
    try {
      const { data: res } = await apiClient.post('/api/v1/auth/login/', { email, password });
      const { access, refresh, user: djangoUser } = res.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      const normalized = normalizeUser(djangoUser);
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
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        await apiClient.post('/api/v1/auth/logout/', { refresh });
      }
    } catch {
      // Ignore logout errors — clear local state regardless
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
    return { error: null };
  };

  const refreshUser = async () => {
    await fetchMe();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session: user ? { user } : null,
        loading,
        signUp,
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
