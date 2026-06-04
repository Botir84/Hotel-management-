import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp, Wallet, Receipt, PieChart,
  CalendarDays, RefreshCw, User, Home, Clock,
  ChevronLeft, ChevronRight, Search,
  Calendar as CalendarIcon, XCircle
} from 'lucide-react';
import { paymentService } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useLang } from '../contexts/LanguageContext';

const PRIMARY = '#5D7B93';
const PRIMARY_LIGHT = '#7A97AD';
const PRIMARY_BG = 'rgba(93,123,147,0.1)';
const PRIMARY_BORDER = 'rgba(93,123,147,0.2)';

function calcStats(data: any[]) {
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA');
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const curYear = now.getFullYear();
  let d = 0, m = 0, y = 0, t = 0;
  data.forEach((p: any) => {
    if (!p?.created_at) return;
    const amount = parseFloat(p.amount) || 0;
    const pDate = new Date(p.created_at);
    t += amount;
    if (pDate.toLocaleDateString('en-CA') === todayStr) d += amount;
    if (pDate.getTime() >= startMonth) m += amount;
    if (pDate.getFullYear() === curYear) y += amount;
  });
  return { daily: d, monthly: m, yearly: y, total: t };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function StatsSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 px-2 sm:px-0">
      {[...Array(4)].map((_, i) => (
        <div key={i} className={`h-32 rounded-[2rem] animate-pulse ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />
      ))}
    </div>
  );
}

function TableSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div className="space-y-3 p-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className={`h-14 rounded-2xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />
      ))}
    </div>
  );
}

export function RevenuePage() {
  const { t } = useLang();
  const { isDark } = useTheme();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { data: rawData = [], isLoading, isFetching } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const res = await paymentService.getPayments();
      const data = res.data?.results || (Array.isArray(res.data) ? res.data : []);
      return [...data].sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    staleTime: 30_000,
    gcTime: 300_000,
  });

  const stats = useMemo(() => calcStats(rawData), [rawData]);

  const filteredPayments = useMemo(() => {
    if (!selectedDate) return rawData;
    return rawData.filter((p: any) =>
      new Date(p.created_at).toLocaleDateString('en-CA') === selectedDate
    );
  }, [rawData, selectedDate]);

  const filteredSum = useMemo(() =>
    filteredPayments.reduce((acc: number, p: any) => acc + (parseFloat(p.amount) || 0), 0),
    [filteredPayments]
  );

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const currentPayments = useMemo(() => {
    const last = currentPage * itemsPerPage;
    const first = last - itemsPerPage;
    return filteredPayments.slice(first, last);
  }, [filteredPayments, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [selectedDate]);

  const goToPage = (n: number) => {
    setCurrentPage(n);
    if (window.innerWidth < 768) window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const cardBg = isDark ? 'bg-slate-900/40 border-white/5 backdrop-blur-md' : 'bg-white border-slate-200 shadow-sm';
  const textPrim = isDark ? 'text-white' : 'text-slate-900';
  const textMut = isDark ? 'text-slate-500' : 'text-slate-400';

  // ✅ Animatsiya uchun CSS
  const animStyle = `
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .anim-card {
      animation: fadeSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
    }
  `;

  return (
    <>
      <style>{animStyle}</style>
      <div className="space-y-6 md:space-y-8 pb-10 px-2 sm:px-0 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mt-4">
          <div className="px-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-6 md:w-2 md:h-8 rounded-full" style={{ background: PRIMARY }} />
              <h1 className={`text-2xl md:text-4xl font-black tracking-tighter ${textPrim}`}>{t('revenue_title')}</h1>
            </div>
            <p className={`${textMut} text-[11px] md:text-sm font-medium ml-4 md:ml-5`}>
              {selectedDate ? `${t('revenue_date')} ${selectedDate}` : t('revenue_subtitle')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl md:rounded-2xl border
              ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
              <CalendarIcon size={16} style={{ color: PRIMARY }} />
              <input type="date"
                className="bg-transparent text-xs font-bold outline-none text-slate-400 uppercase flex-1"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)} />
              {selectedDate && (
                <button onClick={() => setSelectedDate('')} className="text-slate-500 hover:text-red-500 transition-colors">
                  <XCircle size={16} />
                </button>
              )}
            </div>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['payments'] })}
              className="group flex items-center justify-center gap-3 px-6 py-3 text-white rounded-xl md:rounded-2xl font-bold transition-all active:scale-95"
              style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, boxShadow: `0 8px 24px ${PRIMARY}50` }}>
              <RefreshCw size={18} className={`transition-transform duration-500 ${isFetching ? 'animate-spin' : 'group-active:rotate-180'}`} />
              Yangilash
            </button>
          </div>
        </div>

        {/* Stats — ✅ key={String(isLoading)} animatsiyani qayta ishga tushiradi */}
        {isLoading ? <StatsSkeleton isDark={isDark} /> : (
          <div
            key={`stats-${selectedDate}`}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 px-2 sm:px-0"
          >
            {selectedDate ? (
              <div
                className="anim-card col-span-1 lg:col-span-4 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border flex items-center justify-between text-white"
                style={{
                  background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`,
                  boxShadow: `0 16px 40px ${PRIMARY}40`,
                  animationDelay: '0ms',
                }}>
                <div>
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-80">
                    {selectedDate} {t('daily_income')}
                  </p>
                  <h2 className="text-2xl md:text-4xl font-black mt-1 md:mt-2">
                    {filteredSum.toLocaleString()} <span className="text-xs md:text-sm opacity-60">UZS</span>
                  </h2>
                </div>
                <div className="p-3 md:p-4 rounded-2xl md:rounded-3xl" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <TrendingUp size={30} />
                </div>
              </div>
            ) : (
              [
                { label: t('today'), val: stats.daily, icon: <TrendingUp size={20} />, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
                { label: t('this_month'), val: stats.monthly, icon: <CalendarDays size={20} />, color: PRIMARY, bg: PRIMARY_BG },
                { label: t('this_year'), val: stats.yearly, icon: <PieChart size={20} />, color: PRIMARY_LIGHT, bg: 'rgba(122,151,173,0.12)' },
                { label: t('total'), val: stats.total, icon: <Wallet size={20} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
              ].map((s, i) => (
                // ✅ har karta alohida delay bilan chiqadi
                <div
                  key={i}
                  className={`anim-card p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border transition-all hover:-translate-y-1 ${cardBg}`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-5"
                    style={{ background: s.bg, color: s.color }}>
                    {s.icon}
                  </div>
                  <p className="text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest">{s.label}</p>
                  <h2 className={`text-xl md:text-2xl font-black mt-1 ${textPrim}`}>
                    {s.val.toLocaleString()} <span className="text-[9px] font-bold opacity-40 italic">UZS</span>
                  </h2>
                </div>
              ))
            )}
          </div>
        )}

        {/* Table */}
        <div className={`rounded-[1.5rem] md:rounded-[2.5rem] border overflow-hidden mx-2 sm:mx-0 ${cardBg}`}>
          <div className={`p-5 md:p-8 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4
            ${isDark ? 'border-white/5 bg-white/[0.01]' : 'border-slate-100 bg-slate-50/50'}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: PRIMARY_BG }}>
                <Receipt size={18} style={{ color: PRIMARY }} />
              </div>
              <h3 className={`font-black text-xs md:text-sm uppercase tracking-widest ${textPrim}`}>
                {selectedDate ? t('by_date') : t('payment_history')}
              </h3>
            </div>
            <div className="flex items-center flex-wrap gap-2 md:gap-4">
              <span className="text-[8px] md:text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-tighter"
                style={{ background: PRIMARY_BG, border: `1px solid ${PRIMARY_BORDER}`, color: PRIMARY }}>
                {currentPage} / {totalPages || 1}
              </span>
              <span className="text-[8px] md:text-[10px] font-bold px-3 py-1.5 bg-slate-500/10 rounded-full text-slate-500 uppercase tracking-tighter">
                {filteredPayments.length} ta
              </span>
            </div>
          </div>

          {isLoading ? <TableSkeleton isDark={isDark} /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className={isDark ? 'bg-white/5' : 'bg-slate-50'}>
                    {[t('guest_room'), t('employee'), t('method'), t('amount_time')].map((h, i) => (
                      <th key={i} className={`px-6 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black uppercase text-slate-500 ${i === 3 ? 'text-right' : i > 0 ? 'text-center' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                  {currentPayments.map((p: any, idx: number) => (
                    <tr
                      key={p.id}
                      className={`transition-colors group anim-card ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/80'}`}
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <td className="px-6 md:px-8 py-4 md:py-6">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <User size={12} style={{ color: PRIMARY }} />
                            <span className={`text-xs md:text-sm font-black ${textPrim} line-clamp-1`}>{p.guest_name || t('unknown')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <Home size={10} />
                            <span className="text-[9px] font-bold uppercase tracking-tighter">{p.room_number || 'N/A'}{t('room_suffix')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 md:px-8 py-4 md:py-6 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-[9px] font-black"
                            style={{ background: PRIMARY_BG, color: PRIMARY, border: `1px solid ${PRIMARY_BORDER}` }}>
                            {p.cashier_name?.charAt(0) || 'K'}
                          </div>
                          <span className={`text-[10px] md:text-xs font-bold ${textMut}`}>{p.cashier_name || t('cashier')}</span>
                        </div>
                      </td>
                      <td className="px-6 md:px-8 py-4 md:py-6 text-center">
                        <span className={`px-3 py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest border
                          ${p.method === 'cash'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'border'}`}
                          style={p.method !== 'cash' ? { background: PRIMARY_BG, color: PRIMARY, borderColor: PRIMARY_BORDER } : {}}>
                          {p.method}
                        </span>
                      </td>
                      <td className="px-6 md:px-8 py-4 md:py-6 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className={`text-sm md:text-base font-black tracking-tight ${textPrim}`}>
                            {parseFloat(p.amount).toLocaleString()} <span className="text-[9px] opacity-40 italic">UZS</span>
                          </span>
                          <div className="flex items-center gap-1 text-slate-500">
                            <Clock size={10} />
                            <span className="text-[8px] md:text-[9px] font-bold">
                              {new Date(p.created_at).toLocaleString('uz-UZ', {
                                hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short'
                              })}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`p-4 md:p-6 border-t flex items-center justify-center gap-4
              ${isDark ? 'border-white/5 bg-white/[0.01]' : 'border-slate-100 bg-slate-50/50'}`}>
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                className={`p-2 rounded-xl border transition-all
                  ${currentPage === 1 ? 'opacity-20 cursor-not-allowed' : ''}
                  ${isDark ? 'border-white/10 text-white' : 'border-slate-200 text-slate-900'}`}>
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none px-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => goToPage(i + 1)}
                    className={`min-w-[32px] md:min-w-[40px] h-8 md:h-10 rounded-xl text-[10px] font-black transition-all flex-shrink-0
                      ${currentPage === i + 1
                        ? 'text-white shadow-lg'
                        : `hover:bg-white/5 border ${isDark ? 'border-white/5 text-slate-400' : 'border-slate-200 text-slate-500'}`}`}
                    style={currentPage === i + 1
                      ? { background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, boxShadow: `0 4px 12px ${PRIMARY}40` }
                      : {}}>
                    {i + 1}
                  </button>
                ))}
              </div>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                className={`p-2 rounded-xl border transition-all
                  ${currentPage === totalPages ? 'opacity-20 cursor-not-allowed' : ''}
                  ${isDark ? 'border-white/10 text-white' : 'border-slate-200 text-slate-900'}`}>
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {!isLoading && filteredPayments.length === 0 && (
            <div className="py-16 md:py-20 text-center px-4">
              <Search className="mx-auto mb-4 opacity-20" size={40} style={{ color: PRIMARY }} />
              <p className="text-slate-500 font-bold uppercase text-[9px] md:text-[10px] tracking-widest">{t('no_data')}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}