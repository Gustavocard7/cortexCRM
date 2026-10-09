import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStore } from '@/lib/mockStore';
import { Profile } from '@/types';

interface AuthContextType {
  user: User | { id: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_AUTH_USER_KEY = 'cortex_local_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured) {
      const fetchSession = async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Error fetching Supabase session:', error);
          }
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };

      fetchSession();

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Local Auth Mode
      try {
        const stored = localStorage.getItem(LOCAL_AUTH_USER_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed.user);
          setProfile(parsed.profile);
        } else {
          // Default initial session: Carlos Mendes (Admin)
          const db = mockStore.get();
          const defaultAdmin = db.profiles[0];
          const defaultUser = { id: defaultAdmin.id, email: 'admin@cortex.com' };
          setUser(defaultUser);
          setProfile(defaultAdmin);
          localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify({ user: defaultUser, profile: defaultAdmin }));
        }
      } catch (e) {
        console.error('Error reading local auth:', e);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching profile from Supabase:', error);
          return;
        }
        setProfile(data as Profile);
      } else {
        const db = mockStore.get();
        const p = db.profiles.find((x) => x.id === userId) || db.profiles[0];
        setProfile(p);
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return { error };
      } else {
        // Local mode sign in
        const db = mockStore.get();
        let matched = db.profiles.find((p) => p.role === 'admin') || db.profiles[0];
        
        const isAdm = email.toLowerCase().includes('adm') || email.toLowerCase().includes('admin') || email.toLowerCase().includes('cortex');
        if (!isAdm) {
          const byName = db.profiles.find((p) => p.full_name.toLowerCase().includes(email.split('@')[0].toLowerCase()));
          if (byName) matched = byName;
        }

        const loggedUser = { id: matched.id, email: email || 'adm@cortex.com' };
        setUser(loggedUser);
        setProfile(matched);
        localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify({ user: loggedUser, profile: matched }));
        return { error: null };
      }
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) return { error };

        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                full_name: fullName,
                role: 'sales_rep',
              },
            ]);

          if (!profileError) {
            await fetchProfile(data.user.id);
          }
        }

        return { error: null };
      } else {
        // Local mode sign up
        const db = mockStore.get();
        const newProfile: Profile = {
          id: 'user-' + Date.now(),
          full_name: fullName,
          role: 'sales_rep',
          avatar_url: null,
          phone: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.profiles.push(newProfile);
        mockStore.save(db);

        const newUser = { id: newProfile.id, email };
        setUser(newUser);
        setProfile(newProfile);
        localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify({ user: newUser, profile: newProfile }));
        return { error: null };
      }
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem(LOCAL_AUTH_USER_KEY);
      setUser(null);
      setProfile(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        isDemoMode: !isSupabaseConfigured,
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
