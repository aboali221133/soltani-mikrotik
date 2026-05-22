'use client';
import { useTheme } from './ThemeProvider';
import { useLanguage } from './LanguageProvider';
import { LogOut, Sun, Moon, Router, Server, FileText, ChevronDown, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import PPPoEDashboard from './PPPoEDashboard';

export default function EmployeeDashboard({ profile, onLogout }: { profile: any, onLogout: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const [selectedServer, setSelectedServer] = useState<string>('none');
  const [servers, setServers] = useState<any[]>([]);

  useEffect(() => {
    // Under Milestone 3 & 4 we fetch all servers (no strict assignment RLS setup yet).
    const fetchServers = async () => {
      const { data, error } = await supabase.from('servers').select('*');
      if (data) setServers(data);
    };
    fetchServers();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const t = {
    portal: language === 'ar' ? 'بوابة سلطاني' : 'Soltani Portal',
    welcome: language === 'ar' ? 'مرحباً،' : 'Welcome,',
    activeWorkspace: language === 'ar' ? 'اتصال مساحة العمل النشطة' : 'Active Workspace Connection',
    selectPrompt: language === 'ar' ? 'اختر راوتر مُعين لإدارة الملفات الشخصية النشطة.' : 'Select an assigned router to manage active profiles.',
    selectDefault: language === 'ar' ? '-- اختر السيرفر المستهدف --' : '-- Select Target Router --',
    noServer: language === 'ar' ? 'لم يتم اختيار سيرفر' : 'No Connection Engaged',
    noServerDesc: language === 'ar' ? 'يرجى اختيار راوتر من القائمة المنسدلة أعلاه لبدء مزامنة البيانات وأدوات إدارة PPPoE.' : 'Please select a router from the dropdown to initialize data syncing and PPPoE management tools.',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Router className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-bold text-xl text-slate-900 dark:text-white leading-tight">{t.portal}</h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.welcome} <span className="en-num font-bold px-1">{profile?.full_name || 'Staff'}</span></p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
             <button onClick={toggleLanguage} className="p-3 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all font-bold flex items-center gap-2 text-sm" title={language === 'ar' ? 'English' : 'عربي'}>
                <Globe size={20} /> <span className="hidden md:inline">{language === 'ar' ? 'EN' : 'AR'}</span>
             </button>
             <button onClick={toggleTheme} className="p-3 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
             </button>
             <button onClick={handleLogout} className="p-3 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all" title="تسجيل الخروج">
                <LogOut size={20} />
             </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Space */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Dynamic Server Selection Dropdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800 mb-8">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Server size={20} className="text-indigo-500" />
                  {t.activeWorkspace}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.selectPrompt}</p>
              </div>
              
              <div className="relative min-w-[280px]">
                <select 
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-3.5 px-12 rtl:pr-5 rtl:pl-12 ltr:pl-5 ltr:pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-inner en-num transition-all"
                  value={selectedServer}
                  onChange={(e) => setSelectedServer(e.target.value)}
                >
                  <option value="none" className="font-sans">{t.selectDefault}</option>
                  {servers.map((srv) => (
                    <option key={srv.id} value={srv.id}>{srv.server_name} ({srv.local_ip || srv.remote_dns_domain})</option>
                  ))}
                </select>
                <ChevronDown className="absolute rtl:left-4 ltr:right-4 top-4 text-slate-400 pointer-events-none" size={20} />
              </div>
           </div>
        </div>

        {selectedServer === 'none' ? (
          <div className="flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl animate-in fade-in zoom-in-95">
             <Router size={48} className="text-slate-300 dark:text-slate-700 mb-6" />
             <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300 mb-2">{t.noServer}</h3>
             <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">{t.noServerDesc}</p>
          </div>
        ) : (
          <PPPoEDashboard serverId={selectedServer} profile={profile} />
        )}

      </main>
    </div>
  );
}
