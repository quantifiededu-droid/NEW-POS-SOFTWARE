import { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';
import { db } from '../lib/db';

export interface UserProfile {
  id: string;
  business_id: string;
  full_name: string;
  whatsapp_number?: string;
  role: string;
  business?: {
    id: string;
    name: string;
    plan: 'basic' | 'medium' | 'ai';
  };
}

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const supabase = getSupabase();
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, business:businesses(*)')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return { user, profile, loading, signOut };
};
