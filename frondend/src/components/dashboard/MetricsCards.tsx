import { DollarSign, BedDouble, AlertTriangle, TrendingUp, CheckCircle2, Brush } from 'lucide-react';
import { Room, Reservation, Incident } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LanguageContext';

interface MetricsCardsProps {
  rooms: Room[];
  reservations: Reservation[];
  incidents: Incident[];
}

export function MetricsCards({ rooms, reservations, incidents }: MetricsCardsProps) {
  const { isDark } = useTheme();
  const { t } = useLang();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const todayStr = new Date().toLocaleDateString('en-CA');
  const dailyRevenue = reservations.reduce((sum, r) => {
    const payments = (r as any).payments || [];
    return sum + payments
      .filter((p: any) => new Date(p.created_at).toLocaleDateString('en-CA') === todayStr)
      .reduce((s: number, p: any) => s + (parseFloat(p.amount) || 0), 0);
  }, 0);

  const availableRooms = rooms.filter(r => r.status.toLowerCase() === 'available').length;
  const occupiedRooms = rooms.filter(r => r.status.toLowerCase() === 'occupied').length;
  const totalRooms = rooms.length;
  const cleaningRooms = rooms.filter(r =>
    r.status.toLowerCase() === 'dirty' || r.status.toLowerCase() === 'cleaning'
  ).length;

  const cardBase = `group relative overflow-hidden rounded-[2rem] p-5 md:p-6 border transition-all duration-500 backdrop-blur-md
    ${isDark
      ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
      : 'bg-white/70 border-slate-200/60 shadow-sm hover:shadow-xl'
    }`;

  const iconBox = `w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">

      {/* 1. Kunlik Tushum */}
      <div className={`${cardBase} animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75`}>
        <div className="flex items-start justify-between relative z-10">
          <div className={`${iconBox} bg-emerald-500/10 border-emerald-500/20 text-emerald-500`}>
            <DollarSign size={20} />
          </div>
          <span className="text-[8px] md:text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 uppercase tracking-widest border border-emerald-500/20">
            {t('today')}
          </span>
        </div>
        <div className="mt-5 md:mt-6 relative z-10">
          <h3 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {dailyRevenue.toLocaleString()}
            <span className="text-[10px] md:text-xs font-bold opacity-40 ml-1 italic">UZS</span>
          </h3>
          <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2 opacity-70">
            {t('daily_revenue')}
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* 2. Bo'sh Xonalar */}
      <div className={`${cardBase} animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150`}>
        <div className="flex items-start justify-between relative z-10">
          <div className={`${iconBox} bg-[rgba(93,123,147,0.1)] border-[rgba(93,123,147,0.2)]`}
            style={{ color: '#5D7B93' }}>
            <CheckCircle2 size={20} />
          </div>
          <span className="text-[8px] md:text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border"
            style={{ background: 'rgba(93,123,147,0.1)', borderColor: 'rgba(93,123,147,0.2)', color: '#5D7B93' }}>
            {totalRooms > 0 ? Math.round((availableRooms / totalRooms) * 100) : 0}%
          </span>
        </div>
        <div className="mt-5 md:mt-6 relative z-10">
          <h3 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {availableRooms}
            <span className="text-lg opacity-20 mx-1">/</span>
            <span className="text-lg">{totalRooms}</span>
          </h3>
          <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2 opacity-70">
            {t('available_rooms')}
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl"
          style={{ background: 'rgba(93,123,147,0.05)' }} />
      </div>

      {/* 3. Band Xonalar */}
      <div className={`${cardBase} animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200`}>
        <div className="flex items-start justify-between relative z-10">
          <div className={`${iconBox} bg-red-500/10 border-red-500/20 text-red-500`}>
            <BedDouble size={20} />
          </div>
          <span className="text-[8px] md:text-[10px] font-black px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 uppercase tracking-widest">
            {totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0}%
          </span>
        </div>
        <div className="mt-5 md:mt-6 relative z-10">
          <h3 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {occupiedRooms}
            <span className="text-lg opacity-20 mx-1">/</span>
            <span className="text-lg">{totalRooms}</span>
          </h3>
          <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2 opacity-70">
            {t('occupied_rooms')}
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      {/* 4. Tozalanmoqda */}
      <div className={`${cardBase} animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300`}>
        <div className="flex items-start justify-between relative z-10">
          <div className={`${iconBox} bg-amber-500/10 border-amber-500/20 text-amber-500`}>
            <Brush size={20} />
          </div>
          <span className="text-[8px] md:text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 uppercase tracking-widest border border-amber-500/20">
            {t('cleaning')}
          </span>
        </div>
        <div className="mt-5 md:mt-6 relative z-10">
          <h3 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {cleaningRooms}
            <span className="text-lg opacity-20 mx-1">/</span>
            <span className="text-lg">{totalRooms}</span>
          </h3>
          <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2 opacity-70">
            {t('cleaning_rooms')}
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

    </div>
  );
}