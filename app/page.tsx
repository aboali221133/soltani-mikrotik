'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import LoginView from '@/components/LoginView';
import AdminDashboard from '@/components/AdminDashboard';
import EmployeeDashboard from '@/components/EmployeeDashboard';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
         fetchProfile(session.user.id);
      } else {
         setProfile(null);
         setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, retries = 3) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setProfile(data);
        setLoading(false);
      } else {
        if (retries > 0) {
          setTimeout(() => fetchProfile(userId, retries - 1), 1000);
          return;
        }
        // Fallback if profile not found or RLS error
        supabase.auth.getUser().then(({ data: userData }) => {
          setProfile({
             id: userId,
             role: userData?.user?.user_metadata?.role || 'employee',
             full_name: userData?.user?.user_metadata?.full_name || 'User'
          });
          setLoading(false);
        });
      }
    } catch (err) {
      console.error("Error fetching profile", err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!session) {
    return <LoginView onLogin={() => {
      // Profile fetch will automatically trigger via auth listener
      setLoading(true);
    }} />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (profile.role === 'admin') {
    return <AdminDashboard profile={profile} onLogout={() => setSession(null)} />;
  }

  return <EmployeeDashboard profile={profile} onLogout={() => setSession(null)} />;
}
