import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
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

  const { isDark } = useTheme();

  // Ma'lumotlarni backenddan olish
  const fetchData = useCallback(async () => {
    setLoading(true);
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
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Xona bosilganda mantiqiy tekshiruv (User Summary'da ko'rsatilgan Django mantiqiga mos)
  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    const status = room.status.toLowerCase();

    if (status === 'available') {
      setCheckInOpen(true);
    } else if (status === 'occupied') {
      setDetailsOpen(true);
    } else if (status === 'dirty' || status === 'cleaning') {
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

  if (loading && rooms.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#5D7B93]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-2 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* 1. Metrics Section - Operatsiyalar holati haqida qisqacha ma'lumot */}
      <MetricsCards
        rooms={rooms}
        reservations={checkins}
        incidents={[]}
      />

      {/* 2. Main Registry Section */}
      <div className="relative">
        <RoomGrid
          rooms={rooms}
          onRoomClick={handleRoomClick}
          loading={loading}
          onRefresh={fetchData}
          onNewCheckIn={() => {
            setSelectedRoom(undefined);
            setCheckInOpen(true);
          }}
        />
      </div>

      {/* MODALLAR */}

      {/* 1. Check-In Modal (Bo'sh xona yoki yangi check-in uchun) */}
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
            fetchData();
          }}
        />
      )}

      {/* 2. Room Details Modal (Band xonalar va mehmon ma'lumotlari) */}
      {detailsOpen && selectedRoom && (
        <RoomDetailsModal
          isOpen={detailsOpen}
          room={selectedRoom}
          reservation={checkins.find(c => {
            const checkinRoomId = typeof c.room === 'object' ? c.room.id : c.room;
            return String(checkinRoomId) === String(selectedRoom.id);
          })}
          onClose={() => {
            setDetailsOpen(false);
            setSelectedRoom(undefined);
          }}
          onSuccess={() => {
            setDetailsOpen(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}