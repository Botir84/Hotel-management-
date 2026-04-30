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

  // Admin access check
  const isAdmin = user?.role === 'admin';

  // 1. Occupancy Logic
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const totalRooms = rooms.length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // 2. Daily Revenue Logic
  const todayStr = new Date().toLocaleDateString('en-CA');
  const todayReservations = reservations.filter(r => {
    const resDate = new Date(r.created_at).toLocaleDateString('en-CA');
    return resDate === todayStr;
  });
  const dailyRevenue = todayReservations.reduce((sum, r) => sum + (parseFloat(r.total_amount as any) || 0), 0);

  // 3. Security Alerts Logic
  const unresolvedAlerts = incidents.filter(i => i.status === 'pending').length;

  // Glassmorphism Base Style
  const cardBase = `group relative overflow-hidden rounded-[2rem] p-6 border transition-all duration-500 backdrop-blur-md
    ${isDark
      ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
      : 'bg-white/70 border-slate-200/60 shadow-sm hover:shadow-xl hover:border-[#5D7B93]/30'
    }`;

  const iconBox = `w-12 h-12 rounded-2xl border flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

      {/* Daily Revenue */}
      <div className={cardBase}>
        <div className="flex items-start justify-between relative z-10">
          <div className={`${iconBox} bg-emerald-500/10 border-emerald-500/20 text-emerald-500`}>
            <DollarSign size={22} />
          </div>
          <span className="text-[10px] font-black px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 uppercase tracking-widest border border-emerald-500/20">
            Live
          </span>
        </div>
        <div className="mt-6 relative z-10">
          <div className="flex items-baseline gap-1">
            <p className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              ${dailyRevenue.toLocaleString()}
            </p>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mt-2 opacity-70">Daily Revenue</p>
        </div>
        {/* Subtle decorative background gradient */}
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Occupancy Rate */}
      <div className={cardBase}>
        <div className="flex items-start justify-between relative z-10">
          <div className={`${iconBox} bg-[#5D7B93]/10 border-[#5D7B93]/20 text-[#5D7B93]`}>
            <BedDouble size={22} />
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest
              ${occupancyRate > 80 ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'}`}>
              {occupancyRate}%
            </span>
          </div>
        </div>
        <div className="mt-6 relative z-10">
          <p className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {occupiedRooms}<span className="text-lg opacity-30 mx-1">/</span>{totalRooms}
          </p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mt-2 opacity-70">Occupied Rooms</p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#5D7B93]/5 rounded-full blur-3xl" />
      </div>

      {/* Security Alerts - Admin Only */}
      {isAdmin && (
        <div className={`${cardBase} ${unresolvedAlerts > 0 ? 'ring-2 ring-red-500/20' : ''}`}>
          <div className="flex items-start justify-between relative z-10">
            <div className={`${iconBox} ${unresolvedAlerts > 0
              ? 'bg-red-500/10 border-red-500/20 text-red-500'
              : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
              }`}>
              <AlertTriangle size={22} className={unresolvedAlerts > 0 ? 'animate-pulse' : ''} />
            </div>
            {unresolvedAlerts > 0 && (
              <span className="text-[10px] font-black px-3 py-1 rounded-full bg-red-500 text-white animate-bounce tracking-widest shadow-lg shadow-red-500/20">
                URGENT
              </span>
            )}
          </div>
          <div className="mt-6 relative z-10">
            <p className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{unresolvedAlerts}</p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mt-2 opacity-70">Security Alerts</p>
          </div>
          {unresolvedAlerts > 0 && <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-500/10 rounded-full blur-3xl" />}
        </div>
      )}

      {/* Total Reservations */}
      <div className={cardBase}>
        <div className="flex items-start justify-between relative z-10">
          <div className={`${iconBox} bg-amber-500/10 border-amber-500/20 text-amber-500`}>
            <TrendingUp size={22} />
          </div>
          <span className="text-[10px] font-black px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 uppercase tracking-widest border border-amber-500/20">
            Global
          </span>
        </div>
        <div className="mt-6 relative z-10">
          <p className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{reservations.length}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mt-2 opacity-70">Total Bookings</p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

    </div>
  );
}