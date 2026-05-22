'use client';
import { useTheme } from './ThemeProvider';
import { useLanguage } from './LanguageProvider';
import { Moon, Sun, Settings, LogOut, LayoutDashboard, Database, Activity, Globe, Server } from 'lucide-react';
import ServerManager from './ServerForm';
import AccountingBoard from './AccountingBoard';
import StaffManager from './StaffManager';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export default function AdminDashboard({ profile, onLogout }: { profile: any, onLogout: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'matrix' | 'logs' | 'staff'>('matrix');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const t = {
    admin: language === 'ar' ? 'إدارة سلطاني' : 'Soltani Admin',
    access: language === 'ar' ? 'صلاحيات' : 'Access',
    overview: language === 'ar' ? 'نظرة عامة' : 'Overview',
    matrix: language === 'ar' ? 'مصفوفة الخوادم' : 'Server Matrix',
    logs: language === 'ar' ? 'سجلات المحاسبة' : 'Accounting Logs',
    themeName: language === 'ar' ? 'المظهر' : 'Theme',
    themeVal: theme === 'dark' ? (language === 'ar' ? 'داكن' : 'Dark') : (language === 'ar' ? 'فاتح' : 'Light'),
    logout: language === 'ar' ? 'إنهاء الجلسة' : 'Terminate Session',
    infra: language === 'ar' ? 'البنية التحتية' : 'Infrastructure',
    infraDesc: language === 'ar' ? 'إدارة بنية التوجيه المعمارية وتعيينات الوصول.' : 'Manage routing architectures and access assignments.',
    auditing: language === 'ar' ? 'التدقيق المحاسبي' : 'Accounting & Auditing',
    auditingDesc: language === 'ar' ? 'تقرير الإيرادات وسجل الإجراءات' : 'Revenue reporting and action history.',
    staff: language === 'ar' ? 'الموظفين' : 'Staff',
    staffDesc: language === 'ar' ? 'إدارة الأدوار وحقوق الوصول للموظفين.' : 'Manage roles and access rights for staff.',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row rtl:flex-row ltr:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-72 bg-white dark:bg-slate-900 border-x border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/30">
               <Database className="text-white" size={20} />
             </div>
             <div>
               <h1 className="font-bold text-slate-900 dark:text-white">{t.admin}</h1>
               <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{t.access} <span className="en-num ml-1">{profile?.role}</span></p>
             </div>
          </div>
          <button onClick={toggleLanguage} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors flex items-center justify-center">
            <Globe size={18} />
          </button>
        </div>
        
        <nav className="p-4 flex-1 space-y-2">
          <button onClick={() => setActiveTab('matrix')} className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition-all ${activeTab === 'matrix' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'}`}>
            <Settings size={20} />
            {t.matrix}
          </button>
          <button onClick={() => setActiveTab('logs')} className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition-all ${activeTab === 'logs' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'}`}>
            <Activity size={20} />
            {t.logs}
          </button>
          <button onClick={() => setActiveTab('staff')} className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition-all ${activeTab === 'staff' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'}`}>
            <LayoutDashboard size={20} />
            {t.staff}
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={toggleTheme} className="w-full flex items-center justify-between px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium rounded-xl transition-all mb-2">
            <span className="flex items-center gap-3"><Moon size={20} className="hidden dark:block"/><Sun size={20} className="block dark:hidden"/> {t.themeName}</span>
            <span className="text-xs uppercase tracking-wider">{t.themeVal}</span>
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 font-medium rounded-xl transition-all">
            <LogOut size={20} />
            {t.logout}
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {activeTab === 'logs' ? t.auditing : activeTab === 'staff' ? t.staff : t.infra}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              {activeTab === 'logs' ? t.auditingDesc : activeTab === 'staff' ? t.staffDesc : t.infraDesc}
            </p>
          </div>
        </header>

        {activeTab === 'logs' ? (
          <div className="max-w-6xl">
            <AccountingBoard />
          </div>
        ) : activeTab === 'staff' ? (
          <div className="max-w-4xl">
            <StaffManager />
          </div>
        ) : (
          <div className="max-w-4xl">
             <ServerManager />
          </div>
        )}
      </main>
    </div>
  );
}
