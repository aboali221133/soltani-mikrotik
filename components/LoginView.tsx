'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Router, Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginView({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (signInError) {
      setError('بيانات الدخول غير صحيحة، أو الحساب غير موجود.');
      setLoading(false);
    } else {
      onLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-8 text-center bg-gradient-to-br from-blue-700 to-slate-900 text-white relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="mx-auto w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-6 border border-white/20 shadow-inner">
            <Router size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">سلطاني مايكروتيك</h1>
          <p className="text-blue-200 mt-2 text-sm font-medium">إدارة النطاق العريض المتقدمة</p>
        </div>
        <div className="p-8">
          {error && <div className="mb-6 p-3 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border dark:border-red-800/50 rounded-xl text-sm font-medium text-center animate-in fade-in">{error}</div>}
          
          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3.5 top-3.5 text-slate-400" size={18} />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="w-full pr-11 pl-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white" 
                  placeholder="admin@soltani.net" 
                  dir="ltr"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-3.5 text-slate-400" size={18} />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="w-full pr-11 pl-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white" 
                  placeholder="••••••••" 
                  dir="ltr"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'تسجيل الدخول'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
