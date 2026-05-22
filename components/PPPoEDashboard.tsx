'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from './LanguageProvider';
import { Users, Wifi, WifiOff, Clock, Tag, RefreshCw, HandCoins, Activity, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PPPoEDashboard({ serverId, profile }: { serverId: string; profile: any }) {
  const { language } = useLanguage();
  const [data, setData] = useState<{secrets: any[], active: any[], profiles: any[]}>({ secrets: [], active: [], profiles: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'connected' | 'disconnected'>('all');

  const [extendModal, setExtendModal] = useState<{ open: boolean; user: any }>({ open: false, user: null });
  const [newProfile, setNewProfile] = useState('');
  const [newDate, setNewDate] = useState('');
  const [renewalPrice, setRenewalPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = {
    totalUsers: language === 'ar' ? 'إجمالي المشتركين' : 'Total Users',
    connected: language === 'ar' ? 'متصل الآن' : 'Connected',
    disconnected: language === 'ar' ? 'غير متصل' : 'Disconnected',
    renew: language === 'ar' ? 'تجديد / تمديد' : 'Renew / Extend',
    search: language === 'ar' ? 'ابحث عن مستخدم...' : 'Search for user...',
    all: language === 'ar' ? 'الكل' : 'All',
    offline: language === 'ar' ? 'مفصول' : 'Offline',
    profile: language === 'ar' ? 'الباقة (السرعة)' : 'Profile (Speed)',
    expiration: language === 'ar' ? 'تاريخ الانتهاء' : 'Expiration Date',
    uptime: language === 'ar' ? 'مدة الجلسة' : 'Session Uptime',
    status: language === 'ar' ? 'تحديث الاتصال' : 'Sync Status',
    close: language === 'ar' ? 'إغلاق' : 'Close',
    save: language === 'ar' ? 'تطبيق وحفظ' : 'Apply & Save',
    price: language === 'ar' ? 'تكلفة التجديد' : 'Renewal Price',
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mikrotik/ppp?serverId=${serverId}`);
      const json = await res.json();
      if (json.success) setData(json);
    } catch (e) {
      console.error('Failed to fetch PPPoE data', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (serverId && serverId !== 'none') {
      fetchData();
    }
  }, [serverId]);

  const getActiveSession = (username: string) => data.active.find((a: any) => a.name === username);
  
  const parseExpiration = (comment: string) => {
    if (!comment) return null;
    const match = comment.match(/@@(.*?)@@/);
    return match ? match[1] : null;
  };

  const handleExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendModal.user || !newProfile || !newDate) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/mikrotik/ppp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId,
          action: 'extend_profile',
          targetUserId: extendModal.user['.id'],
          newProfileName: newProfile,
          newDate,
          price: renewalPrice,
          profileId: profile?.id
        })
      });
      if (res.ok) {
        alert(language === 'ar' ? 'تم تجديد الاشتراك بنجاح' : 'Subscription renewed successfully');
        setExtendModal({ open: false, user: null });
        fetchData();
      }
    } catch (e) {
      alert('Error updating user');
    }
    setIsSubmitting(false);
  };

  const filteredSecrets = data.secrets.filter(user => {
    const isActive = !!getActiveSession(user.name);
    if (filter === 'connected') return isActive;
    if (filter === 'disconnected') return !isActive;
    return true;
  });

  if (loading) {
    return <div className="text-center p-10"><RefreshCw className="animate-spin mx-auto text-blue-500 mb-4" size={32}/> {t.status}...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t.totalUsers}</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1 en-num">{data.secrets.length}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-50/50 dark:bg-emerald-900/10 z-0"></div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{t.connected}</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1 en-num">{data.active.length}</h3>
          </div>
          <div className="relative z-10 w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Wifi size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">{t.disconnected}</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1 en-num">
              {data.secrets.length - data.active.length}
            </h3>
          </div>
          <div className="w-12 h-12 bg-red-50 dark:bg-red-900/40 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400">
            <WifiOff size={24} />
          </div>
        </div>
      </div>

      {/* Grid Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-100 dark:bg-slate-900 p-2 rounded-xl">
         <div className="flex bg-white dark:bg-slate-950 rounded-lg p-1 shadow-sm w-full sm:w-auto">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-md font-semibold text-sm transition-all flex-1 sm:flex-none ${filter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>{t.all}</button>
            <button onClick={() => setFilter('connected')} className={`px-4 py-2 rounded-md font-semibold text-sm transition-all flex-1 sm:flex-none ${filter === 'connected' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>{t.connected}</button>
            <button onClick={() => setFilter('disconnected')} className={`px-4 py-2 rounded-md font-semibold text-sm transition-all flex-1 sm:flex-none ${filter === 'disconnected' ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>{t.offline}</button>
         </div>
      </div>

      {/* Secrets Table/List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right">
            <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">المستخدم (User)</th>
                <th className="px-6 py-4">{t.profile}</th>
                <th className="px-6 py-4">{t.expiration}</th>
                <th className="px-6 py-4">الحالة (Status)</th>
                <th className="px-6 py-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredSecrets.map((user) => {
                const activeSession = getActiveSession(user.name);
                const expDate = parseExpiration(user.comment);
                return (
                  <tr key={user['.id']} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white en-num">{user.name}</td>
                    <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                      <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-md text-xs font-bold border border-blue-100 dark:border-blue-800/50 en-num">{user.profile}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300 text-xs">
                       {expDate ? (
                         <div className="flex items-center gap-1"><Clock size={14} className="text-slate-400"/> <span className="en-num">{expDate}</span></div>
                       ) : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      {activeSession ? (
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> {t.connected}
                          </span>
                          <span className="text-[10px] text-slate-500 en-num">{activeSession.uptime}</span>
                        </div>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {t.offline}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => {
                          setNewProfile(user.profile);
                          setExtendModal({ open: true, user });
                        }} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
                      >
                        {t.renew}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renewal Modal */}
      {extendModal.open && extendModal.user && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="text-indigo-600 dark:text-indigo-400" />
                تعديل وتمديد الاشتراك
              </h3>
            </div>
            
            <form onSubmit={handleExtend} className="p-6 space-y-5">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl flex justify-between items-center border border-slate-100 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-500">حساب العميل (User)</span>
                <span className="font-bold text-lg en-num text-slate-900 dark:text-white">{extendModal.user.name}</span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t.profile}</label>
                <select value={newProfile} onChange={e => setNewProfile(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white en-num font-semibold">
                  {data.profiles.map((p) => (
                    <option key={p['.id']} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">تاريخ الانتهاء الجديد (Format: YYYY-MM-DD)</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white en-num" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t.price} ($Price$)</label>
                <div className="relative">
                  <HandCoins className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input type="number" value={renewalPrice} onChange={e => setRenewalPrice(e.target.value)} placeholder="0" className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white en-num" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setExtendModal({ open: false, user: null })} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  {t.close}
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-70 flex justify-center items-center gap-2">
                  {isSubmitting ? <RefreshCw className="animate-spin" size={18} /> : null}
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
