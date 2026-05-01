import { useState, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Room, Reservation } from '../types';
import api, { roomService } from '../services/api';

// Komponentlar
import { MetricsCards } from '../components/dashboard/MetricsCards';
import { RoomGrid } from '../components/dashboard/RoomGrid';
import { CheckInModal } from '../components/checkin/CheckInModal';
import { RoomDetailsModal } from '../components/dashboard/RoomDetailsModal';

// Contextlar
import { useTheme } from '../contexts/ThemeContext';

export function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [checkins, setCheckins] = useState<Reservation[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | undefined>();

  // Modallar holati
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { isDark } = useTheme();

  // Ma'lumotlarni yuklash funksiyasi
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [roomsRes, checkinsRes] = await Promise.all([
        roomService.getRooms(),
        api.get('/checkins/'),
      ]);

      const rData = Array.isArray(roomsRes.data) ? roomsRes.data : (roomsRes.data?.results || []);
      const cData = Array.isArray(checkinsRes.data) ? checkinsRes.data : (checkinsRes.data?.results || []);

      setRooms(rData);
      setCheckins(cData);
    } catch (error) {
      console.error("Ma'lumotlarni yuklashda xato:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Har 2 daqiqada avtomatik yangilash (Live Dashboard effekti)
    const interval = setInterval(() => fetchData(), 120000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    const status = room.status.toLowerCase();

    if (status === 'available') {
      setCheckInOpen(true);
    } else if (status === 'occupied' || status === 'booked') {
      setDetailsOpen(true);
    } else if (status === 'dirty' || status === 'cleaning') {
      // confirm() o'rniga chiroyli modal ishlatsa ham bo'ladi, hozircha mantiq saqlandi
      if (window.confirm(`${room.number}-xona tayyormi? Holatni 'Bo'sh'ga o'tkazamiz.`)) {
        handleFinishCleaning(room.id);
      }
    }
  };

  const handleFinishCleaning = async (roomId: number) => {
    try {
      await api.patch(`/rooms/${roomId}/`, { status: 'available' });
      fetchData(true);
    } catch (e) {
      alert("Xonani yangilashda xato yuz berdi");
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

      {/* 1. Header & Quick Refresh */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className={`text-2xl md:text-3xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Boshqaruv Paneli
          </h1>
          <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
            Xonalar va Bandlik Monitoringi
          </p>
        </div>


      </div>

      {/* 2. Metrics Section */}
      <section className="animate-in fade-in zoom-in-95 duration-1000 delay-150">
        <MetricsCards
          rooms={rooms}
          reservations={checkins}
          incidents={[]}
        />
      </section>

      {/* 3. Main Room Registry Section */}
      <section className="relative min-h-[400px]">
        <RoomGrid
          rooms={rooms}
          onRoomClick={handleRoomClick}
          loading={loading || refreshing}
          onRefresh={() => fetchData(true)}
          onNewCheckIn={() => {
            setSelectedRoom(undefined);
            setCheckInOpen(true);
          }}
        />
      </section>

      {/* MODALLAR */}
      {checkInOpen && (
        <CheckInModal
          isOpen={checkInOpen}
          room={selectedRoom}
          onClose={() => {
            setCheckInOpen(false);
            setSelectedRoom(undefined);
          }}
          onSuccess={() => {
            setCheckInOpen(false);
            fetchData(true);
          }}
        />
      )}

      {detailsOpen && selectedRoom && (
        <RoomDetailsModal
          isOpen={detailsOpen}
          room={selectedRoom}
          reservation={checkins.find(c => {
            // Room ID object yoki number bo'lishini tekshirish
            const checkinRoomId = typeof c.room === 'object' ? (c.room as any).id : c.room;
            return String(checkinRoomId) === String(selectedRoom.id);
          })}
          onClose={() => {
            setDetailsOpen(false);
            setSelectedRoom(undefined);
          }}
          onSuccess={() => {
            setDetailsOpen(false);
            fetchData(true);
          }}
        />
      )}
    </div>
  );
}