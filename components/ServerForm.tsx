'use client';
import { useState, useEffect } from 'react';
import { Building, Network, Lock, Globe, Server as ServerIcon, User, KeyRound, Shield, CheckCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ServerManager() {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [formData, setFormData] = useState({
    serverName: '',
    localIp: '',
    remoteDnsDomain: '',
    sslEnabled: false,
    apiPort: 8728,
    username: '',
    plainPassword: ''
  });
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{status: 'success' | 'error' | 'local', message: string} | null>(null);

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    setLoading(true);
    const { data } = await supabase.from('servers').select('*').order('created_at', { ascending: false });
    if (data) setServers(data);
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (name === 'sslEnabled') {
      setFormData(prev => ({ ...prev, apiPort: checked ? 8729 : 8728 }));
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm('هل أنت متأكد من حذف هذا السيرفر؟')) return;
    await supabase.from('servers').delete().eq('id', id);
    fetchServers();
  };

  const handleTestConnection = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!formData.localIp && !formData.remoteDnsDomain) {
      setTestResult({ status: 'error', message: 'يرجى إدخال IP المحلي أو الدومين الخارجي' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      let localReachable = false;
      if (formData.localIp) {
        const localProtocol = formData.sslEnabled ? 'https' : 'http';
        const localUrl = `${localProtocol}://${formData.localIp}:${formData.apiPort}/rest/system/resource`;
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 300);
          await fetch(localUrl, { mode: 'no-cors', signal: controller.signal });
          clearTimeout(timeoutId);
          localReachable = true;
        } catch (err) {}
      }

      if (localReachable) {
        setTestResult({ status: 'local', message: 'تم الاتصال بالراوتر محلياً بنجاح!' });
        setTesting(false);
        return;
      }

      const response = await fetch('/api/mikrotik/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setTestResult({ status: 'success', message: 'تم الاتصال عبر الخادم الوكيل بنجاح!' });
      } else {
        setTestResult({ status: 'error', message: data.error || 'فشل الاتصال بالراوتر' });
      }
    } catch (err: any) {
      setTestResult({ status: 'error', message: err.message || 'حدث خطأ غير متوقع' });
    }
    setTesting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('servers').insert([{
      server_name: formData.serverName,
      local_ip: formData.localIp,
      remote_dns_domain: formData.remoteDnsDomain,
      api_port: formData.apiPort,
      username: formData.username,
      plain_password: formData.plainPassword,
      ssl_enabled: formData.sslEnabled
    }]);

    if (error) {
      alert(`خطأ في الحفظ: ${error.message}`);
    } else {
      alert('تم حفظ إعدادات السيرفر بنجاح!');
      setShowAdd(false);
      fetchServers();
    }
  };

  return (
    <div className="space-y-6">
      {!showAdd && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <ServerIcon className="text-blue-500" /> إدارة السيرفرات (Routers)
            </h3>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">
              <Plus size={16}/> إضافة سيرفر
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="px-6 py-4">اسم السيرفر</th>
                  <th className="px-6 py-4">IP المحلي</th>
                  <th className="px-6 py-4">المنفذ</th>
                  <th className="px-6 py-4">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {servers.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-slate-500">لا توجد سيرفرات مضافة</td></tr>
                )}
                {servers.map(server => (
                  <tr key={server.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{server.server_name}</td>
                    <td className="px-6 py-4 text-slate-500 en-num">{server.local_ip || server.remote_dns_domain}</td>
                    <td className="px-6 py-4 text-slate-500 en-num">{server.api_port}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDelete(server.id)} className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 size={16}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800 animate-in fade-in">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <ServerIcon size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">إضافة سيرفر جديد</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">تكوين اتصال آمن جديد براوتر مايكروتيك</p>
              </div>
            </div>
            <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-slate-700 font-bold text-sm">
              إلغاء والعودة
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">اسم السيرفر (وصف)</label>
                  <div className="relative">
                    <Building className="absolute right-3.5 top-3 text-slate-400" size={18} />
                    <input type="text" name="serverName" value={formData.serverName} onChange={handleChange} required className="w-full pr-11 pl-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" placeholder="الراوتر الرئيسي للمنطقة" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">IP المحلي (Local)</label>
                  <div className="relative">
                    <Network className="absolute right-3.5 top-3 text-slate-400" size={18} />
                    <input type="text" name="localIp" value={formData.localIp} onChange={handleChange} className="w-full pr-11 pl-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white en-num" placeholder="192.168.88.1" dir="ltr" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">الدومين الخارجي (DNS)</label>
                  <div className="relative">
                    <Globe className="absolute right-3.5 top-3 text-slate-400" size={18} />
                    <input type="text" name="remoteDnsDomain" value={formData.remoteDnsDomain} onChange={handleChange} className="w-full pr-11 pl-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white en-num" placeholder="router.soltani.net" dir="ltr" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">منفذ الـ API (Port)</label>
                  <div className="relative flex items-center">
                    <input type="number" name="apiPort" value={formData.apiPort} onChange={handleChange} required className="w-full pr-4 pl-24 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white font-mono en-num" dir="ltr" />
                    <div className="absolute left-3 flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">SSL</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="sslEnabled" checked={formData.sslEnabled} onChange={handleChange} className="sr-only peer" />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">الافتراضي بدون تشفير: 8728, بتشفير SSL/HTTPS: 8729</p>
                </div>
             </div>

             <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2"><Shield size={16}/> بيانات المصادقة</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1.5">
                     <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">اسم المستخدم (API Username)</label>
                     <div className="relative">
                       <User className="absolute right-3.5 top-3 text-slate-400" size={18} />
                       <input type="text" name="username" value={formData.username} onChange={handleChange} required className="w-full pr-11 pl-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" placeholder="admin" dir="ltr" />
                     </div>
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">كلمة المرور</label>
                     <div className="relative">
                       <KeyRound className="absolute right-3.5 top-3 text-slate-400" size={18} />
                       <input type="password" name="plainPassword" value={formData.plainPassword} onChange={handleChange} required className="w-full pr-11 pl-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white font-mono" placeholder="••••••••" dir="ltr" />
                     </div>
                   </div>
                </div>
             </div>

             {testResult && (
               <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${
                 testResult.status === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                 testResult.status === 'local' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
               }`}>
                 <CheckCircle size={18} className={testResult.status === 'error' ? 'hidden' : 'block'} />
                 {testResult.message}
               </div>
             )}

             <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
               <button type="submit" className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-500/20 transition-all">
                 إضافة وحفظ السيرفر
               </button>
               
               <button type="button" onClick={handleTestConnection} disabled={testing} className="w-full sm:w-auto px-8 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                 {testing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />} 
                 اختبار الاتصال
               </button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
}
