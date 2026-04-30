import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Loader2 } from 'lucide-react';
import { Room, Reservation } from '../types';
import api, { roomService } from '../services/api';

// Komponentlar
import { MetricsCards } from '../components/dashboard/MetricsCards';
import { RoomGrid } from '../components/dashboard/RoomGrid';
import { CheckInModal } from '../components/checkin/CheckInModal';
import { RoomDetailsModal } from '../components/dashboard/RoomDetailsModal';
import { Button } from '../components/ui/Button';

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

  const { isDark } = useTheme();

  // Ma'lumotlarni backenddan olish
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsRes, checkinsRes] = await Promise.all([
        roomService.getRooms(),
        api.get('/checkins/'),
      ]);

      // Django Rest Framework pagination (results) yoki oddiy array bo'lsa ham ishlaydi
      const rData = Array.isArray(roomsRes.data) ? roomsRes.data : (roomsRes.data?.results || []);
      const cData = Array.isArray(checkinsRes.data) ? checkinsRes.data : (checkinsRes.data?.results || []);

      setRooms(rData);
      setCheckins(cData);
    } catch (error) {
      console.error("Ma'lumotlarni yuklashda xato:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Xona bosilganda mantiqiy tekshiruv
  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);

    // Statuslarni kichik harflarda tekshiramiz (Backend modelingga mos)
    const status = room.status.toLowerCase();

    if (status === 'available') {
      setCheckInOpen(true);
    } else if (status === 'occupied') {
      setDetailsOpen(true);
    } else if (status === 'dirty') { // 'cleaning' emas, 'dirty' (Django modelingga mos)
      if (window.confirm(`${room.number}-xona tozalandimi?`)) {
        handleFinishCleaning(room.id);
      }
    }
  };

  const handleFinishCleaning = async (roomId: number) => {
    try {
      await api.patch(`/rooms/${roomId}/`, { status: 'available' });
      fetchData();
    } catch (e) {
      alert("Xonani yangilashda xato yuz berdi");
    }
  };

  return (
    <div className="space-y-6 p-4 animate-in fade-in duration-500">

      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Operations Overview
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => { setSelectedRoom(undefined); setCheckInOpen(true); }}
          >
            <Plus size={18} className="mr-1" /> New Check-In
          </Button>
        </div>
      </div>

      {/* 2. Metrics Section */}
      <MetricsCards
        rooms={rooms}
        reservations={checkins}
        incidents={[]} // Oq ekran muammosini hal qilish uchun
      />

      {/* 3. Rooms Grid Section */}
      <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-slate-900/40 border-slate-800/60' : 'bg-white border-gray-200'} backdrop-blur-md`}>
        <RoomGrid
          rooms={rooms}
          onRoomClick={handleRoomClick}
          loading={loading}
          onRefresh={fetchData}
        />
      </div>

      {/* MODAL: Check-In (Yashil xona uchun) */}
      {checkInOpen && (
        <CheckInModal
          isOpen={checkInOpen}
          room={selectedRoom}
          onClose={() => { setCheckInOpen(false); setSelectedRoom(undefined); }}
          onSuccess={() => { setCheckInOpen(false); fetchData(); }}
        />
      )}

      {/* MODAL: Room Details (Band xona uchun) */}
      {detailsOpen && selectedRoom && (
        <RoomDetailsModal
          isOpen={detailsOpen}
          room={selectedRoom}
          // Django modelingda ForeignKey 'room' deb nomlangan
          reservation={checkins.find(c => {
            const checkinRoomId = typeof c.room === 'object' ? c.room.id : c.room;
            return String(checkinRoomId) === String(selectedRoom.id);
          })}
          onClose={() => { setDetailsOpen(false); setSelectedRoom(undefined); }}
          onSuccess={() => { setDetailsOpen(false); fetchData(); }}
        />
      )}
    </div>
  );
}