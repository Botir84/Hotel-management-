import { DollarSign, BedDouble, AlertTriangle, TrendingUp } from 'lucide-react';
import { Room, Reservation, Incident } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

interface MetricsCardsProps {
  rooms: Room[];
  reservations: Reservation[];
  incidents: Incident[]; // Bu yerda SecurityAlert ma'lumotlari keladi
}

export function MetricsCards({ rooms, reservations, incidents }: MetricsCardsProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();

  // Faqat admin ko'rishi uchun
  const isAdmin = user?.role === 'admin';

  // 1. Xonalar bandligi
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const totalRooms = rooms.length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // 2. Kunlik tushum (YYYY-MM-DD formatida solishtiramiz)
  const todayStr = new Date().toLocaleDateString('en-CA');
  const todayReservations = reservations.filter(r => {
    const resDate = new Date(r.created_at).toLocaleDateString('en-CA');
    return resDate === todayStr;
  });
  const dailyRevenue = todayReservations.reduce((sum, r) => sum + (parseFloat(r.total_amount as any) || 0), 0);

  // 3. Alertlar (Sizning serializerdagi 'status' maydoniga moslab)
  // Faqat 'pending' (Tekshirilmoqda) holatidagilarni yangi deb hisoblaymiz
  const unresolvedAlerts = incidents.filter(i => i.status === 'pending').length;

  const cardBase = `rounded-2xl p-5 border transition-all duration-300 ${isDark ? 'bg-slate-800/60 border-slate-700/40' : 'bg-white border-gray-100 shadow-sm'
    }`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

      {/* Daily Revenue */}
      <div className={cardBase}>
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl border flex items-center justify-center bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
            <DollarSign size={18} />
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 uppercase">Live</span>
        </div>
        <div className="mt-4">
          <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {dailyRevenue.toLocaleString()} <span className="text-[10px] opacity-40">UZS</span>
          </p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Bugungi tushum</p>
        </div>
      </div>

      {/* Occupancy Rate */}
      <div className={cardBase}>
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl border flex items-center justify-center bg-blue-500/10 border-blue-500/20 text-blue-400">
            <BedDouble size={18} />
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 uppercase">{occupancyRate}%</span>
        </div>
        <div className="mt-4">
          <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{occupiedRooms} / {totalRooms}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Band xonalar</p>
        </div>
      </div>

      {/* Security Alerts - FAQAT ADMIN UCHUN */}
      {isAdmin && (
        <div className={`${cardBase} ${unresolvedAlerts > 0 ? 'ring-2 ring-red-500/20' : ''}`}>
          <div className="flex items-start justify-between">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${unresolvedAlerts > 0
                ? 'bg-red-500/10 border-red-500/20 text-red-500'
                : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
              }`}>
              <AlertTriangle size={18} className={unresolvedAlerts > 0 ? 'animate-pulse' : ''} />
            </div>
            {unresolvedAlerts > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500 text-white animate-bounce">NEW</span>
            )}
          </div>
          <div className="mt-4">
            <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{unresolvedAlerts}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Xavfsizlik ogohlantirishi</p>
          </div>
        </div>
      )}

      {/* Total Reservations */}
      <div className={cardBase}>
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl border flex items-center justify-center bg-amber-500/10 border-amber-500/20 text-amber-400">
            <TrendingUp size={18} />
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 uppercase">Total</span>
        </div>
        <div className="mt-4">
          <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{reservations.length}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Jami bandlovlar</p>
        </div>
      </div>

    </div>
  );
}