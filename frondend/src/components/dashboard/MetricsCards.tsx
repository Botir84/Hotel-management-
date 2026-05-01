import { DollarSign, BedDouble, AlertTriangle, TrendingUp } from 'lucide-react';
import { Room, Reservation, Incident } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

interface MetricsCardsProps {
  rooms: Room[];
  reservations: Reservation[];
  incidents: Incident[];
}

export function MetricsCards({ rooms, reservations, incidents }: MetricsCardsProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';

  // 1. Occupancy Logic
  const occupiedRooms = rooms.filter(r => r.status.toLowerCase() === 'occupied').length;
  const totalRooms = rooms.length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // 2. Daily Revenue Logic
  const todayStr = new Date().toLocaleDateString('en-CA');
  const dailyRevenue = reservations
    .filter(r => new Date(r.created_at).toLocaleDateString('en-CA') === todayStr)
    .reduce((sum, r) => sum + (parseFloat(r.total_amount as any) || 0), 0);

  // 3. Security Alerts Logic
  const unresolvedAlerts = incidents.filter(i => i.status.toLowerCase() === 'pending').length;

  const cardBase = `group relative overflow-hidden rounded-[2rem] p-5 md:p-6 border transition-all duration-500 backdrop-blur-md
    ${isDark
      ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
      : 'bg-white/70 border-slate-200/60 shadow-sm hover:shadow-xl hover:border-blue-500/30'
    }`;

  const iconBox = `w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">

      {/* Daily Revenue */}
      <div className={`${cardBase} animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75`}>
        <div className="flex items-start justify-between relative z-10">
          <div className={`${iconBox} bg-emerald-500/10 border-emerald-500/20 text-emerald-500`}>
            <DollarSign size={20} />
          </div>
          <span className="text-[8px] md:text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 uppercase tracking-widest border border-emerald-500/20">
            Bugun
          </span>
        </div>
        <div className="mt-5 md:mt-6 relative z-10">
          <h3 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {dailyRevenue.toLocaleString()}
            <span className="text-[10px] md:text-xs font-bold opacity-40 ml-1 italic">UZS</span>
          </h3>
          <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2 opacity-70">Kunlik Tushum</p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Occupancy Rate */}
      <div className={`${cardBase} animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150`}>
        <div className="flex items-start justify-between relative z-10">
          <div className={`${iconBox} bg-blue-500/10 border-blue-500/20 text-blue-500`}>
            <BedDouble size={20} />
          </div>
          <span className={`text-[8px] md:text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest
            ${occupancyRate > 80 ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'}`}>
            {occupancyRate}%
          </span>
        </div>
        <div className="mt-5 md:mt-6 relative z-10">
          <h3 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {occupiedRooms}<span className="text-lg opacity-20 mx-1">/</span>{totalRooms}
          </h3>
          <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2 opacity-70">Band Xonalar</p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Security Alerts - Admin Only */}
      {isAdmin && (
        <div className={`${cardBase} animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 ${unresolvedAlerts > 0 ? 'ring-2 ring-red-500/10' : ''}`}>
          <div className="flex items-start justify-between relative z-10">
            <div className={`${iconBox} ${unresolvedAlerts > 0
              ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
              : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
              }`}>
              <AlertTriangle size={20} className={unresolvedAlerts > 0 ? 'animate-pulse' : ''} />
            </div>
            {unresolvedAlerts > 0 && (
              <span className="text-[8px] md:text-[10px] font-black px-2.5 py-1 rounded-full bg-red-600 text-white animate-bounce shadow-lg shadow-red-600/30">
                TEZKOR
              </span>
            )}
          </div>
          <div className="mt-5 md:mt-6 relative z-10">
            <h3 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {unresolvedAlerts}
            </h3>
            <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2 opacity-70">Xavfsizlik Bildirgi</p>
          </div>
          {unresolvedAlerts > 0 && <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-500/10 rounded-full blur-3xl" />}
        </div>
      )}

      {/* Total Reservations */}
      <div className={`${cardBase} animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300`}>
        <div className="flex items-start justify-between relative z-10">
          <div className={`${iconBox} bg-amber-500/10 border-amber-500/20 text-amber-500`}>
            <TrendingUp size={20} />
          </div>
          <span className="text-[8px] md:text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 uppercase tracking-widest border border-amber-500/20">
            Jami
          </span>
        </div>
        <div className="mt-5 md:mt-6 relative z-10">
          <h3 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {reservations.length}
          </h3>
          <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2 opacity-70">Umumiy Bandlovlar</p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

    </div>
  );
}