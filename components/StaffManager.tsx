'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from './LanguageProvider';
import { supabase, secondarySupabaseAuth } from '@/lib/supabase';
import { Users, Shield, ShieldAlert, RefreshCw, Plus, Loader2 } from 'lucide-react';

export default function StaffManager() {
  const { language } = useLanguage();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('employee');
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState('');

  const t = {
    title: language === 'ar' ? 'إدارة الموظفين والصلاحيات' : 'Staff & Roles Management',
    desc: language === 'ar' ? 'تعديل صلاحيات الوصول للمستخدمين.' : 'Modify access roles for users.',
    name: language === 'ar' ? 'الاسم' : 'Name',
    email: language === 'ar' ? 'البريد الإلكتروني' : 'Email',
    password: language === 'ar' ? 'كلمة المرور' : 'Password',
    role: language === 'ar' ? 'الصلاحية' : 'Role',
    action: language === 'ar' ? 'إجراء' : 'Action',
    makeAdmin: language === 'ar' ? 'ترقية لمدير' : 'Make Admin',
    makeEmployee: language === 'ar' ? 'تخفيض لموظف' : 'Make Employee',
    editParams: language === 'ar' ? 'تعديل كلمة المرور' : 'Edit Password',
  };

  const fetchStaff = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setStaff(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeRole = async (id: string, newRole: string) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    if (!error) {
       fetchStaff();
    } else {
       alert('Error updating role');
    }
  };

  const changePassword = async (id: string, newPass: string) => {
    if (newPass !== undefined) {
       const { error } = await supabase.from('profiles').update({ plain_password: newPass }).eq('id', id);
       if (!error) fetchStaff();
       else alert('Error updating password');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateMsg('');
    
    // We use the secondary client to prevent logging out the current admin
    const { data, error } = await secondarySupabaseAuth.auth.signUp({
      email: newEmail,
      password: newPassword,
      options: {
        data: {
          full_name: newName,
          role: newRole
        }
      }
    });

    if (error) {
      setCreateMsg('❌ ' + error.message);
    } else {
      // For initial password tracking
      if (data.user) {
        await supabase.from('profiles').update({ plain_password: newPassword }).eq('id', data.user.id);
      }
      setCreateMsg('✅ ' + (language === 'ar' ? 'تم إنشاء الحساب بنجاح' : 'User created successfully'));
      setNewEmail(''); setNewPassword(''); setNewName(''); setNewRole('employee');
      fetchStaff();
    }
    setCreating(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in fade-in">
       <div className="flex justify-between items-center mb-6">
         <div>
           <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
             <Users className="text-blue-500" /> {t.title}
           </h3>
           <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.desc}</p>
         </div>
         <button onClick={fetchStaff} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500">
           <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
         </button>
       </div>

       <div className="overflow-x-auto">
         <table className="w-full text-sm text-left rtl:text-right">
           <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 uppercase font-semibold">
             <tr>
               <th className="px-6 py-4">{t.name}</th>
               <th className="px-6 py-4">{t.email}</th>
               <th className="px-6 py-4">{t.password}</th>
               <th className="px-6 py-4 text-center text-xs">{t.role} / {t.action}</th>
             </tr>
           </thead>
           <tbody>
             {staff.map(user => (
               <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                 <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{user.full_name || 'Staff'}</td>
                 <td className="px-6 py-4 text-slate-500 en-num">{user.email}</td>
                 <td className="px-6 py-4">
                   <div className="flex items-center gap-2">
                     <input 
                       type="text" 
                       defaultValue={user.plain_password} 
                       onBlur={(e) => changePassword(user.id, e.target.value)}
                       placeholder={language === 'ar' ? 'كلمة المرور...' : 'Password...'}
                       className="text-slate-600 dark:text-slate-300 font-mono en-num bg-slate-100 dark:bg-slate-800 px-2 py-1.5 rounded w-28 text-xs border border-transparent focus:border-indigo-500 focus:outline-none"
                     />
                   </div>
                 </td>
                 <td className="px-6 py-4 text-center">
                   <select 
                     value={user.role}
                     onChange={(e) => changeRole(user.id, e.target.value)}
                     className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg p-2 focus:outline-none focus:border-indigo-500 cursor-pointer w-full"
                   >
                     <option value="admin">{language === 'ar' ? 'مدير (Admin)' : 'Admin'}</option>
                     <option value="employee">{language === 'ar' ? 'موظف (Employee)' : 'Employee'}</option>
                   </select>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>

       <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
         <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
           <Plus className="text-emerald-500" size={18} />
           {language === 'ar' ? 'إضافة موظف جديد' : 'Add New Staff'}
         </h4>
         
         <form onSubmit={handleCreateUser} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
             <div>
               <label className="block text-xs font-semibold text-slate-500 mb-1">{t.name}</label>
               <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 focus:outline-none text-sm dark:text-white" />
             </div>
             <div>
               <label className="block text-xs font-semibold text-slate-500 mb-1">{t.email}</label>
               <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 focus:outline-none text-sm dark:text-white en-num" dir="ltr" />
             </div>
             <div>
               <label className="block text-xs font-semibold text-slate-500 mb-1">{t.password}</label>
               <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 focus:outline-none text-sm dark:text-white en-num" dir="ltr" />
             </div>
             <div>
               <label className="block text-xs font-semibold text-slate-500 mb-1">{t.role}</label>
               <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 focus:outline-none text-sm font-bold text-slate-700 dark:text-slate-200">
                 <option value="employee">{language === 'ar' ? 'موظف (Employee)' : 'Employee'}</option>
                 <option value="admin">{language === 'ar' ? 'مدير (Admin)' : 'Admin'}</option>
               </select>
             </div>
           </div>
           
           <div className="flex items-center justify-between">
             <div className={`text-sm font-bold ${createMsg.includes('✅') ? 'text-emerald-600' : 'text-red-500'}`}>
               {createMsg}
             </div>
             <button type="submit" disabled={creating} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-xl transition-colors flex items-center gap-2 text-sm disabled:opacity-75">
               {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
               {language === 'ar' ? 'إنشاء الحساب' : 'Create Account'}
             </button>
           </div>
         </form>
       </div>
    </div>
  );
}
