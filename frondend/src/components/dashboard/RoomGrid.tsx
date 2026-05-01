import { useState } from 'react';
import { RefreshCw, LayoutGrid, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Room, RoomStatus } from '../../types';
import { RoomCard } from './RoomCard';
import { useTheme } from '../../contexts/ThemeContext';

interface RoomGridProps {
  rooms: Room[];
  onRoomClick: (room: Room) => void;
  onRefresh: () => void;
  loading?: boolean;
}

const filters: { id: RoomStatus | 'all'; label: string; color: string; dot: string }[] = [
  { id: 'all', label: 'All', color: '#5D7B93', dot: '#5D7B93' },
  { id: 'available', label: 'Available', color: '#22c55e', dot: '#22c55e' },
  { id: 'occupied', label: 'Occupied', color: '#ef4444', dot: '#ef4444' },
  { id: 'dirty', label: 'Cleaning', color: '#f59e0b', dot: '#f59e0b' },
  { id: 'maintenance', label: 'Service', color: '#64748b', dot: '#64748b' },
];

export function RoomGrid({ rooms = [], onRoomClick, onRefresh, loading }: RoomGridProps) {
  const [activeFilter, setActiveFilter] = useState<RoomStatus | 'all'>('all');
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);
  const { isDark } = useTheme();

  const filteredRooms = (Array.isArray(rooms) ? rooms : []).filter(
    r => activeFilter === 'all' || r.status === activeFilter
  );

  const textPrimary = isDark ? 'text-slate-100' : 'text-[#2d3f4f]';
  const textMuted = isDark ? 'text-slate-500' : 'text-[#A2B3C1]';

  return (
    <div
      className={`rounded-[1.5rem] md:rounded-[2.5rem] border p-4 md:p-6 transition-all duration-500 backdrop-blur-md
        ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200'}`}
    >
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl shrink-0 ${isDark ? 'bg-[#5D7B93]/20' : 'bg-[#5D7B93]/10'} text-[#5D7B93]`}>
            <LayoutGrid size={24} />
          </div>
          <div className="min-w-0">
            <h2 className={`text-lg md:text-xl font-black tracking-tight truncate ${textPrimary}`}>Room Management</h2>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>
              {rooms.length} total units
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 w-full lg:w-auto">
          {/* Advanced Glass Filter Bar - Mobil uchun Scrollable */}
          <div className={`flex-1 lg:flex-none relative flex items-center gap-1 p-1 rounded-2xl md:rounded-[1.5rem] border backdrop-blur-xl overflow-x-auto no-scrollbar
            ${isDark ? 'bg-black/20 border-white/5' : 'bg-white/60 border-slate-200 shadow-sm'}`}>

            <div className="flex items-center gap-1 px-1 min-w-max">
              {filters.map(f => {
                const count = f.id === 'all' ? rooms.length : rooms.filter(r => r.status === f.id).length;
                const isActive = activeFilter === f.id;
                const isHovered = hoveredFilter === f.id;

                return (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    onMouseEnter={() => setHoveredFilter(f.id)}
                    onMouseLeave={() => setHoveredFilter(null)}
                    className={`relative px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-colors duration-300 flex items-center gap-2 whitespace-nowrap z-10
                      ${isActive ? 'text-[#5D7B93]' : textMuted} 
                      ${isHovered && !isActive ? 'text-[#5D7B93]/80' : ''}`}
                  >
                    {/* Background Swipe Animation (Active) */}
                    {isActive && (
                      <motion.div
                        layoutId="activeFilterPill"
                        className="absolute inset-0 bg-white rounded-xl shadow-md z-[-1]"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}

                    {/* Hover Shadow Effect */}
                    {isHovered && !isActive && (
                      <motion.div
                        layoutId="hoverFilterPill"
                        className={`absolute inset-0 rounded-xl z-[-1] ${isDark ? 'bg-white/5' : 'bg-slate-500/5 shadow-inner'}`}
                        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                      />
                    )}

                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: f.dot }} />
                    {f.label}
                    <span className={`px-1.5 py-0.5 rounded-md text-[8px] md:text-[9px] font-bold ${isActive ? 'bg-slate-100 text-[#5D7B93]' : 'bg-slate-500/10'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className={`p-3 md:p-3.5 rounded-xl md:rounded-2xl border transition-all active:scale-95 shrink-0
              ${loading ? 'animate-spin' : ''} 
              ${isDark
                ? 'bg-white/5 border-white/10 text-[#A2B3C1] hover:bg-white/10'
                : 'bg-white border-slate-200 text-[#5D7B93] hover:shadow-md'
              }`}
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="relative min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6"
          >
            {filteredRooms.length > 0 ? (
              filteredRooms.map(room => (
                <RoomCard key={room.id} room={room} onClick={onRoomClick} />
              ))
            ) : (
              <div className={`col-span-full py-16 md:py-24 flex flex-col items-center justify-center rounded-[1.5rem] md:rounded-[2rem] border-2 border-dashed
                ${isDark ? 'border-white/5 bg-white/2' : 'border-slate-200 bg-white/30'}`}>
                <div className="p-4 rounded-full bg-slate-500/10 text-slate-500 mb-4">
                  <Search size={32} />
                </div>
                <h3 className={`text-base md:text-lg font-bold ${textPrimary}`}>No rooms found</h3>
                <p className={`text-xs md:text-sm ${textMuted}`}>Try another category or clear filters</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Custom Styles for hiding scrollbar */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}