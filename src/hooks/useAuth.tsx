import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create supabase client safely with fallbacks for development
const createSupabaseClient = (): SupabaseClient<Database> | null => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  if (!url || !key) {
    console.warn('Supabase credentials not found. Waiting for environment to load...');
    return null;
  }
  
  return createClient<Database>(url, key, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
};

let supabaseInstance: SupabaseClient<Database> | null = null;

export const getSupabase = (): SupabaseClient<Database> | null => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient();
  }
  return supabaseInstance;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const supabase = getSupabase();
    
    if (!supabase) {
      // Retry after a short delay if credentials not yet available
      if (retryCount < 10) {
        const timer = setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 500);
        return () => clearTimeout(timer);
      } else {
        setLoading(false);
        return;
      }
    }

    setIsConfigured(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [retryCount]);

  const signUp = async (email: string, password: string, username?: string) => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { username }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isConfigured, signUp, signIn, signOut }}>
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

// Re-export a safe supabase getter for use in components
export { getSupabase as supabase };
