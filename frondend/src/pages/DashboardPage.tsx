import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Room, Reservation } from '../types';
import api, { roomService } from '../services/api';
import { useLang } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

import { MetricsCards } from '../components/dashboard/MetricsCards';
import { RoomGrid } from '../components/dashboard/RoomGrid';
import { CheckInModal } from '../components/checkin/CheckInModal';
import { RoomDetailsModal } from '../components/dashboard/RoomDetailsModal';

// ─── Fetch funksiyalari ───────────────────────────────────────────────────────
const fetchRooms = async (): Promise<Room[]> => {
  const res = await roomService.getRooms();
  return Array.isArray(res.data) ? res.data : (res.data?.results || []);
};

const fetchCheckins = async (): Promise<Reservation[]> => {
  const res = await api.get('/checkins/');
  return Array.isArray(res.data) ? res.data : (res.data?.results || []);
};

export function DashboardPage() {
  const { t } = useLang();
  const { isDark } = useTheme();
  const queryClient = useQueryClient();

  const [selectedRoom, setSelectedRoom] = useState<Room | undefined>();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // ✅ React Query — rooms cache
  const {
    data: rooms = [],
    isLoading: roomsLoading,
    isFetching: roomsFetching,
  } = useQuery({
    queryKey: ['rooms'],
    queryFn: fetchRooms,
    staleTime: 30_000,   // 30 soniya cache
    gcTime: 300_000,
    refetchInterval: 120_000,  // 2 daqiqada avtomatik yangilash
  });

  // ✅ React Query — checkins cache
  const {
    data: checkins = [],
    isLoading: checkinsLoading,
  } = useQuery({
    queryKey: ['checkins'],
    queryFn: fetchCheckins,
    staleTime: 30_000,
    gcTime: 300_000,
    refetchInterval: 120_000,
  });

  const loading = roomsLoading || checkinsLoading;
  const refreshing = roomsFetching;

  // ✅ Refresh — cache ni invalidate qiladi
  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
    queryClient.invalidateQueries({ queryKey: ['checkins'] });
  }, [queryClient]);

  const handleFinishCleaning = async (roomId: number) => {
    try {
      await api.patch(`/rooms/${roomId}/`, { status: 'available' });
      handleRefresh();
    } catch {
      alert('Xonani yangilashda xato yuz berdi');
    }
  };

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    const status = room.status.toLowerCase();
    if (status === 'available') {
      setCheckInOpen(true);
    } else if (status === 'occupied' || status === 'booked') {
      setDetailsOpen(true);
    } else if (status === 'dirty' || status === 'cleaning') {
      if (window.confirm(`${room.number}-xona tayyormi? Holatni 'Bo'sh'ga o'tkazamiz.`)) {
        handleFinishCleaning(room.id);
      }
    }
  };

  if (loading && rooms.length === 0) {
    return (
      <div className="h-[80vh] w-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 opacity-80" />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">
          Tizim yuklanmoqda...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10 p-3 md:p-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className={`text-2xl md:text-3xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t('dashboard_title')}
          </h1>
          <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
            {t('dashboard_subtitle')}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <section className="animate-in fade-in zoom-in-95 duration-1000 delay-150">
        <MetricsCards
          rooms={rooms}
          reservations={checkins}
          incidents={[]}
        />
      </section>

      {/* Room Grid */}
      <section className="relative min-h-[400px]">
        <RoomGrid
          rooms={rooms}
          onRoomClick={handleRoomClick}
          loading={loading || refreshing}
          onRefresh={handleRefresh}
          onNewCheckIn={() => {
            setSelectedRoom(undefined);
            setCheckInOpen(true);
          }}
        />
      </section>

      {/* Modallar */}
      {checkInOpen && (
        <CheckInModal
          isOpen={checkInOpen}
          room={selectedRoom}
          onClose={() => { setCheckInOpen(false); setSelectedRoom(undefined); }}
          onSuccess={() => { setCheckInOpen(false); handleRefresh(); }}
        />
      )}

      {detailsOpen && selectedRoom && (
        <RoomDetailsModal
          isOpen={detailsOpen}
          room={selectedRoom}
          reservation={checkins.find(c => {
            const checkinRoomId = typeof c.room === 'object' ? (c.room as any).id : c.room;
            return String(checkinRoomId) === String(selectedRoom.id);
          })}
          onClose={() => { setDetailsOpen(false); setSelectedRoom(undefined); }}
          onSuccess={() => { setDetailsOpen(false); handleRefresh(); }}
        />
      )}
    </div>
  );
}