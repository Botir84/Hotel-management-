import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Wallet,
  Receipt,
  PieChart,
  Loader2,
  CalendarDays,
  RefreshCw,
  User,
  Home,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar as CalendarIcon,
  XCircle
} from 'lucide-react';
import { paymentService } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

export function RevenuePage() {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [stats, setStats] = useState({
    daily: 0,
    monthly: 0,
    yearly: 0,
    total: 0,
    filtered: 0
  });

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const res = await paymentService.getPayments();
      const data = res.data?.results || (Array.isArray(res.data) ? res.data : []);

      const sortedData = data.sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setPayments(sortedData);

      const now = new Date();
      const todayStr = now.toLocaleDateString('en-CA');
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const currentYear = now.getFullYear();

      let d = 0, m = 0, y = 0, t = 0;
      data.forEach((p: any) => {
        if (!p || !p.created_at) return;
        const amount = parseFloat(p.amount) || 0;
        const pDate = new Date(p.created_at);
        const pTime = pDate.getTime();
        const pDateStr = pDate.toLocaleDateString('en-CA');

        t += amount;
        if (pDateStr === todayStr) d += amount;
        if (pTime >= startOfMonth) m += amount;
        if (pDate.getFullYear() === currentYear) y += amount;
      });

      setStats({ daily: d, monthly: m, yearly: y, total: t, filtered: 0 });
    } catch (error) {
      console.error("Revenue fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const filteredPayments = useMemo(() => {
    let filtered = [...payments];
    let currentFilteredSum = 0;

    if (selectedDate) {
      filtered = payments.filter((p: any) => {
        const localPDate = new Date(p.created_at).toLocaleDateString('en-CA');
        return localPDate === selectedDate;
      });
      currentFilteredSum = filtered.reduce((acc, curr: any) => acc + (parseFloat(curr.amount) || 0), 0);
    }

    if (selectedDate) {
      setTimeout(() => {
        setStats(prev => ({ ...prev, filtered: currentFilteredSum }));
      }, 0);
    }

    return filtered;
  }, [payments, selectedDate]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const currentPayments = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredPayments.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredPayments, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate]);

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    if (window.innerWidth < 768) {
      window.scrollTo({ top: 100, behavior: 'smooth' });
    }
  };

  const cardBg = isDark ? 'bg-slate-900/40 border-white/5 backdrop-blur-md' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-500' : 'text-slate-400';

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-6 px-4">
        <div className="relative">
          <Loader2 className="animate-spin text-blue-500" size={48} />
          <div className="absolute inset-0 blur-xl bg-blue-500/20 animate-pulse rounded-full" />
        </div>
        <p className={`text-xs md:text-sm font-black uppercase tracking-[0.3em] text-center ${textMuted}`}>
          Ma'lumotlar qayta ishlanmoqda...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-10 px-2 sm:px-0 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header: Responsive Layout */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mt-4">
        <div className="px-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-6 md:w-2 md:h-8 bg-blue-600 rounded-full" />
            <h1 className={`text-2xl md:text-4xl font-black tracking-tighter ${textPrimary}`}>Moliya Paneli</h1>
          </div>
          <p className={`${textMuted} text-[11px] md:text-sm font-medium ml-4 md:ml-5`}>
            {selectedDate ? `Sana: ${selectedDate}` : "Tranzaksiyalar va daromadlar boshqaruvi"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl md:rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
            <CalendarIcon size={16} className="text-blue-500" />
            <input
              type="date"
              className="bg-transparent text-xs font-bold outline-none text-slate-400 uppercase flex-1"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            {selectedDate && (
              <button onClick={() => setSelectedDate('')} className="text-slate-500 hover:text-red-500 transition-colors">
                <XCircle size={16} />
              </button>
            )}
          </div>

          <button
            onClick={fetchRevenueData}
            className="group flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl md:rounded-2xl font-bold transition-all active:scale-95"
          >
            <RefreshCw size={18} className="group-active:rotate-180 transition-transform duration-500" />
            Yangilash
          </button>
        </div>
      </div>

      {/* Stats Cards: Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 px-2 sm:px-0">
        {selectedDate ? (
          <div className="col-span-1 lg:col-span-4 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20">
            <div>
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-80">{selectedDate} kunlik tushum</p>
              <h2 className="text-2xl md:text-4xl font-black mt-1 md:mt-2">
                {stats.filtered.toLocaleString()} <span className="text-xs md:text-sm opacity-60">UZS</span>
              </h2>
            </div>
            <div className="p-3 md:p-4 bg-white/20 rounded-2xl md:rounded-3xl backdrop-blur-md">
              <TrendingUp size={30} className="md:w-10 md:h-10" />
            </div>
          </div>
        ) : (
          [
            { label: 'Bugun', val: stats.daily, icon: <TrendingUp size={20} />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Shu oy', val: stats.monthly, icon: <CalendarDays size={20} />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Shu yil', val: stats.yearly, icon: <PieChart size={20} />, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
            { label: 'Jami', val: stats.total, icon: <Wallet size={20} />, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          ].map((s, i) => (
            <div key={i} className={`p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border transition-all hover:translate-y-[-4px] ${cardBg}`}>
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${s.bg} ${s.color} flex items-center justify-center mb-4 md:mb-5`}>
                {s.icon}
              </div>
              <p className="text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest">{s.label}</p>
              <h2 className={`text-xl md:text-2xl font-black mt-1 ${textPrimary}`}>
                {s.val.toLocaleString()} <span className="text-[9px] font-bold opacity-40 italic">UZS</span>
              </h2>
            </div>
          ))
        )}
      </div>

      {/* Table: Improved Mobile Scrolling */}
      <div className={`rounded-[1.5rem] md:rounded-[2.5rem] border overflow-hidden mx-2 sm:mx-0 ${cardBg}`}>
        <div className="p-5 md:p-8 border-b border-white/5 bg-white/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Receipt size={18} />
            </div>
            <h3 className={`font-black text-xs md:text-sm uppercase tracking-widest ${textPrimary}`}>
              {selectedDate ? "Sana bo'yicha" : "To'lovlar tarixi"}
            </h3>
          </div>

          <div className="flex items-center flex-wrap gap-2 md:gap-4">
            <span className="text-[8px] md:text-[10px] font-bold px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-500 uppercase tracking-tighter">
              {currentPage} / {totalPages || 1}
            </span>
            <span className="text-[8px] md:text-[10px] font-bold px-3 py-1.5 bg-slate-500/10 rounded-full text-slate-500 uppercase tracking-tighter">
              {filteredPayments.length} ta
            </span>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className={isDark ? 'bg-white/5' : 'bg-slate-50'}>
                <th className="px-6 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black uppercase text-slate-500">Mehmon & Xona</th>
                <th className="px-6 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black uppercase text-slate-500 text-center">Xodim</th>
                <th className="px-6 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black uppercase text-slate-500 text-center">Metod</th>
                <th className="px-6 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black uppercase text-slate-500 text-right">Summa & Vaqt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentPayments.map((p: any) => (
                <tr key={p.id} className="hover:bg-blue-500/[0.02] transition-colors group">
                  <td className="px-6 md:px-8 py-4 md:py-6">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <User size={12} className="text-blue-500" />
                        <span className={`text-xs md:text-sm font-black ${textPrimary} line-clamp-1`}>{p.guest_name || 'Noma\'lum'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Home size={10} />
                        <span className="text-[9px] font-bold uppercase tracking-tighter">
                          {p.room_number || 'N/A'}-xona
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 md:px-8 py-4 md:py-6 text-center">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-blue-600/20 flex items-center justify-center text-[9px] font-black text-blue-500 border border-blue-500/20">
                        {p.cashier_name?.charAt(0) || 'K'}
                      </div>
                      <span className={`text-[10px] md:text-xs font-bold ${textMuted}`}>{p.cashier_name || 'Kassir'}</span>
                    </div>
                  </td>
                  <td className="px-6 md:px-8 py-4 md:py-6 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest border ${p.method === 'cash'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                      {p.method}
                    </span>
                  </td>
                  <td className="px-6 md:px-8 py-4 md:py-6 text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={`text-sm md:text-base font-black tracking-tight ${textPrimary}`}>
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

        {/* Pagination: Touch Friendly */}
        {totalPages > 1 && (
          <div className="p-4 md:p-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-center gap-4 bg-white/[0.01]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-xl border transition-all ${currentPage === 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-blue-600 hover:text-white border-white/10'} ${isDark ? 'text-white' : 'text-slate-900'}`}
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1 mx-2 overflow-x-auto max-w-[200px] sm:max-w-none px-2 py-1 scrollbar-hide">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToPage(i + 1)}
                    className={`min-w-[32px] md:min-w-[40px] h-8 md:h-10 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black transition-all flex-shrink-0 ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-lg' : `hover:bg-white/5 border border-white/5 ${textMuted}`}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-xl border transition-all ${currentPage === totalPages ? 'opacity-20 cursor-not-allowed' : 'hover:bg-blue-600 hover:text-white border-white/10'} ${isDark ? 'text-white' : 'text-slate-900'}`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {filteredPayments.length === 0 && (
          <div className="py-16 md:py-20 text-center px-4">
            <Search className="mx-auto text-slate-700 mb-4 opacity-20" size={40} />
            <p className="text-slate-500 font-bold uppercase text-[9px] md:text-[10px] tracking-widest">Ma'lumot topilmadi</p>
          </div>
        )}
      </div>
    </div>
  );
}