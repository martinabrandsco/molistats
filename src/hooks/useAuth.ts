import { useState, useEffect } from 'react';
import { authService } from '../services/supabase';
import { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    authService.getCurrentUser().then((user) => {
      if (user) {
        setUser({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email || ''
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      if (user) {
        setUser({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email || ''
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await authService.signUp(email, password);
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await authService.signIn(email, password);
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await authService.signOut();
    return { error };
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };
} 