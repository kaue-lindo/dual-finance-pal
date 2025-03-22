
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, predefinedUsers } from '../constants';
import { toast } from 'sonner';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user);
        setSupabaseUser(session?.user || null);
        
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setSelectedProfile(null);
          localStorage.removeItem('selectedFinanceProfile');
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // When user signs in, we'll check if they have a saved profile
          const savedProfile = localStorage.getItem('selectedFinanceProfile');
          if (savedProfile) {
            const profile = predefinedUsers.find(u => u.id === savedProfile);
            if (profile) {
              setCurrentUser(profile);
              setSelectedProfile(savedProfile);
            }
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user || null);
      
      // If we have a supabase user but no profile selected, check localStorage
      if (session?.user) {
        const savedProfile = localStorage.getItem('selectedFinanceProfile');
        if (savedProfile) {
          setSelectedProfile(savedProfile);
          
          // Get the corresponding user from predefined users
          const profile = predefinedUsers.find(u => u.id === savedProfile);
          if (profile) {
            setCurrentUser(profile);
          }
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error("Google login error:", error);
        toast.error(error.message || 'Erro ao fazer login com Google');
        return { success: false, error };
      }
      
      console.log("Google sign in initiated:", data);
      return { success: true };
    } catch (error: any) {
      console.error("Google login exception:", error);
      toast.error(error.message || 'Erro ao fazer login com Google');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
      
      if (error) throw error;
      toast.success('Cadastro realizado com sucesso. Verifique seu email.');
      return { success: true };
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar conta');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setCurrentUser(null);
      setSelectedProfile(null);
      localStorage.removeItem('selectedFinanceProfile');
      
      await supabase.auth.signOut();
    } catch (error: any) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectProfile = (userId: string) => {
    // Get the base user from predefined users
    const profile = predefinedUsers.find(u => u.id === userId);
    
    if (profile) {
      setCurrentUser(profile);
      setSelectedProfile(userId);
      localStorage.setItem('selectedFinanceProfile', userId);
    }
  };

  return {
    currentUser,
    setCurrentUser,
    loading,
    supabaseUser,
    login,
    signInWithGoogle,
    signup,
    logout,
    users: predefinedUsers,
    selectedProfile,
    selectProfile,
    isAuthenticated: !!supabaseUser
  };
};
