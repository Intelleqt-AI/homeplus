import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { isDemoMode, DEMO_CREDENTIALS, mockUser, mockSession } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage key for demo session persistence
const DEMO_SESSION_KEY = 'homeplus_demo_session';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we're in demo mode
    if (isDemoMode()) {
      // Check for existing demo session in localStorage
      const savedDemoSession = localStorage.getItem(DEMO_SESSION_KEY);
      if (savedDemoSession) {
        setUser(mockUser as unknown as User);
        setSession(mockSession as unknown as Session);
      }
      setLoading(false);
      return;
    }

    // Set up auth state listener FIRST (production mode)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata?: any) => {
    // Demo mode signup
    if (isDemoMode()) {
      // In demo mode, just simulate successful signup
      localStorage.setItem(DEMO_SESSION_KEY, 'true');
      setUser(mockUser as unknown as User);
      setSession(mockSession as unknown as Session);
      return { error: null };
    }

    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Demo mode login
    if (isDemoMode()) {
      // Check demo credentials
      if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
        localStorage.setItem(DEMO_SESSION_KEY, 'true');
        setUser(mockUser as unknown as User);
        setSession(mockSession as unknown as Session);
        return { error: null };
      }
      // Also allow any email/password combo in demo mode for convenience
      localStorage.setItem(DEMO_SESSION_KEY, 'true');
      setUser(mockUser as unknown as User);
      setSession(mockSession as unknown as Session);
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    // Demo mode logout
    if (isDemoMode()) {
      localStorage.removeItem(DEMO_SESSION_KEY);
      setUser(null);
      setSession(null);
      return { error: null };
    }

    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
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
