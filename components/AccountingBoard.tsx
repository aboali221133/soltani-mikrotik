'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from './LanguageProvider';
import { supabase } from '@/lib/supabase';
import { Calendar, Download, Printer, DollarSign, Users, Activity, FileSpreadsheet, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AccountingBoard() {
  const { language } = useLanguage();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First of current month
    to: new Date().toISOString().split('T')[0] // Today
  });

  const t = {
    title: language === 'ar' ? 'سجلات المحاسبة والتدقيق' : 'Accounting & Auditing Logs',
    desc: language === 'ar' ? 'مراجعة نشاط الموظفين وتتبع الإيرادات.' : 'Review staff activity and track revenue.',
    from: language === 'ar' ? 'من تاريخ' : 'From Date',
    to: language === 'ar' ? 'إلى تاريخ' : 'To Date',
    totalRev: language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue',
    totalRenewals: language === 'ar' ? 'عمليات التجديد' : 'Total Renewals',
    load: language === 'ar' ? 'تحديث البيانات' : 'Refresh Data',
    staff: language === 'ar' ? 'الموظف' : 'Staff',
    action: language === 'ar' ? 'الإجراء' : 'Action',
    target: language === 'ar' ? 'المشترك' : 'Target User',
    revenue: language === 'ar' ? 'المبلغ' : 'Revenue',
    date: language === 'ar' ? 'التاريخ والوقت' : 'Date & Time',
    exportPdf: language === 'ar' ? 'تصدير PDF' : 'Export PDF',
    exportXls: language === 'ar' ? 'تصدير Excel' : 'Export Excel',
  };

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('accounting_logs')
      .select(`
        id,
        action,
        target_user,
        details,
        revenue_generated,
        created_at,
        profiles (
          full_name,
          role
        )
      `)
      .gte('created_at', `${dateRange.from}T00:00:00Z`)
      .lte('created_at', `${dateRange.to}T23:59:59Z`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [dateRange]);

  const totalRevenue = logs.reduce((sum, log) => sum + Number(log.revenue_generated || 0), 0);
  const totalRenewals = logs.filter(log => log.action === 'renewal').length;

  const handleExportExcel = () => {
    const wsData = logs.map(log => ({
      [t.date]: new Date(log.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US'),
      [t.staff]: log.profiles?.full_name || 'Unknown',
      [t.action]: log.action,
      [t.target]: log.target_user,
      [t.revenue]: log.revenue_generated,
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Accounting Logs');
    XLSX.writeFile(wb, `accounting_logs_${dateRange.from}_to_${dateRange.to}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [[t.date, t.staff, t.action, t.target, t.revenue]],
      body: logs.map(log => [
        new Date(log.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US'),
        log.profiles?.full_name || 'Unknown',
        log.action,
        log.target_user,
        `$${log.revenue_generated}`
      ]),
      styles: { font: 'helvetica' } // custom arabic fonts can be complex in jspdf, fallback to simple
    });
    doc.save(`accounting_logs_${dateRange.from}_to_${dateRange.to}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 gap-6 justify-between items-end">
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Calendar size={16}/> {t.from}</label>
            <input type="date" value={dateRange.from} onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 en-num" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Calendar size={16}/> {t.to}</label>
            <input type="date" value={dateRange.to} onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 en-num" />
          </div>
        </div>
        <button onClick={fetchLogs} className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center justify-center gap-2">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> {t.load}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-6">
           <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <DollarSign size={28} />
           </div>
           <div>
             <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400">{t.totalRev}</p>
             <h3 className="text-4xl font-bold text-emerald-950 dark:text-emerald-100 mt-1 en-num">${totalRevenue.toFixed(2)}</h3>
           </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800/30 flex items-center gap-6">
           <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
              <Activity size={28} />
           </div>
           <div>
             <p className="text-sm font-bold text-blue-800 dark:text-blue-400">{t.totalRenewals}</p>
             <h3 className="text-4xl font-bold text-blue-950 dark:text-blue-100 mt-1 en-num">{totalRenewals}</h3>
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
           <h3 className="font-bold text-slate-800 dark:text-slate-200">{t.title}</h3>
           <div className="flex gap-2">
             <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors">
               <FileSpreadsheet size={16} /> <span className="hidden sm:inline">{t.exportXls}</span>
             </button>
             <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-lg text-sm font-bold hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors">
               <Printer size={16} /> <span className="hidden sm:inline">{t.exportPdf}</span>
             </button>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">{t.date}</th>
                <th className="px-6 py-4">{t.staff}</th>
                <th className="px-6 py-4">{t.action}</th>
                <th className="px-6 py-4">{t.target}</th>
                <th className="px-6 py-4">{t.revenue}</th>
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10"><RefreshCw className="animate-spin mx-auto text-slate-400 mb-2" /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-500">لا توجد سجلات في هذا النطاق</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 en-num">{new Date(log.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</td>
                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center text-xs"><Users size={12}/></div>
                        {log.profiles?.full_name || 'Staff'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold capitalize ${log.action === 'renewal' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white en-num">{log.target_user}</td>
                    <td className="px-6 py-4 font-black text-emerald-600 dark:text-emerald-400 en-num">${Number(log.revenue_generated || 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
