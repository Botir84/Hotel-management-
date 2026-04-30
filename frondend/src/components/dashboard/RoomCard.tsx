import { BedDouble, Users, Maximize2, Sparkles, Brush } from 'lucide-react';
import { Room } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface RoomCardProps {
  room: Room;
  onClick: (room: Room) => void;
  selected?: boolean;
}

const typeLabel: Record<string, string> = {
  standard: 'Standard',
  deluxe: 'Luxury Deluxe',
  suite: 'Premium Suite',
};

const ROOM_IMAGES: Record<string, string> = {
  standard: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
  deluxe: 'https://images.unsplash.com/photo-1590490360182-c33d955a4c86?w=800&q=80',
  suite: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
};
const DEFAULT_IMAGE = ROOM_IMAGES.standard;

type RoomStatus = 'available' | 'occupied' | 'cleaning';

function getStatus(raw?: string): RoomStatus {
  const s = raw?.toLowerCase() ?? '';
  if (s === 'cleaning' || s === 'dirty') return 'cleaning';
  if (s === 'available') return 'available';
  return 'occupied';
}

const STATUS_CONFIG: Record<RoomStatus, {
  label: string;
  dotColor: string;
  textColor: string;
  bg: string;
  border: string;
  pulse: boolean;
}> = {
  available: { label: 'Available', dotColor: '#22c55e', textColor: '#15803d', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.45)', pulse: true },
  occupied: { label: 'Occupied', dotColor: '#ef4444', textColor: '#b91c1c', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.45)', pulse: false },
  cleaning: { label: 'Cleaning', dotColor: '#f59e0b', textColor: '#b45309', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.45)', pulse: true },
};

const BTN_CONFIG: Record<RoomStatus, { label: string; style: React.CSSProperties; hoverClass: string; }> = {
  available: { label: 'Book', style: { background: 'linear-gradient(135deg, #5D7B93 0%, #A2B3C1 100%)', color: '#F8FAFC', boxShadow: '0 8px 24px rgba(93,123,147,0.35)' }, hoverClass: 'btn-available' },
  occupied: { label: 'Fully Booked', style: { background: 'rgba(162,179,193,0.12)', color: '#A2B3C1', border: '1px solid rgba(162,179,193,0.25)', cursor: 'not-allowed' }, hoverClass: '' },
  cleaning: { label: 'Cleaning', style: { background: 'rgba(245,158,11,0.12)', color: '#b45309', border: '1px solid rgba(245,158,11,0.3)', cursor: 'not-allowed' }, hoverClass: '' },
};

export function RoomCard({ room, onClick, selected = false }: RoomCardProps) {
  const { isDark } = useTheme();
  const status = getStatus(room.status);
  const sc = STATUS_CONFIG[status];
  const bc = BTN_CONFIG[status];
  const isAvail = status === 'available';

  const roomName = room.number ? `${typeLabel[room.type] || 'Room'} ${room.number}` : typeLabel[room.type] || 'Wonderful Room';
  const roomImage = room.image_url ? `http://127.0.0.1:8000${room.image_url}` : ROOM_IMAGES[room.type] || DEFAULT_IMAGE;

  return (
    <>
      <style>{`
        .rc-wrap { position: relative; border-radius: 2rem; overflow: hidden; cursor: pointer; transition: transform .6s cubic-bezier(0.23,1,0.32,1); height: 100%; display: flex; flex-direction: column; }
        .rc-wrap:hover { transform: translateY(-10px); }
        .rc-img { width: 100%; height: 100%; object-fit: cover; transition: transform 1s cubic-bezier(0.25,0.46,0.45,0.94); }
        .rc-wrap:hover .rc-img { transform: scale(1.09); }
        .rc-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 600; }
        .rc-btn { width: 100%; padding: 13px 0; border-radius: 1.25rem; font-size: 11px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; border: none; }
        @keyframes pulse-dot { 0%, 100% { opacity:1; transform:scale(1); } 50% { opacity:.4; transform:scale(.65); } }
      `}</style>

      <div className={`rc-wrap${selected ? ' rc-selected' : ''}`} onClick={() => onClick(room)}>
        <div className="rc-inner" style={{
          position: 'relative', borderRadius: '2rem', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: selected ? '1.5px solid rgba(93,123,147,0.6)' : `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(224,231,239,0.9)'}`,
          background: isDark ? 'linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))' : '#fff',
        }}>
          {status === 'cleaning' && <div className="rc-cleaning-stripe" style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(-45deg, rgba(245,158,11,0.05) 0, rgba(245,158,11,0.05) 10px, transparent 10px, transparent 20px)', pointerEvents: 'none', zIndex: 1 }} />}

          {/* Image Section */}
          <div style={{ position: 'relative', overflow: 'hidden', margin: '8px', borderRadius: '1.5rem', height: '200px', flexShrink: 0 }}>
            <img src={roomImage} alt={roomName} className="rc-img" />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7) 100%)' }} />

            {/* Room Number Badge */}
            <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: 99, color: '#fff', fontSize: 10, fontWeight: 700 }}>
              {room.number}
            </div>

            {/* Price Tag */}
            <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', padding: '6px 12px', borderRadius: 12, color: '#fff' }}>
              <span style={{ fontWeight: 900 }}>${Number(room.price_per_night)}</span><span style={{ fontSize: 9, opacity: 0.8 }}>/night</span>
            </div>
          </div>

          {/* Content Section */}
          <div style={{ padding: '14px 18px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* Title - Fixed height to ensure alignment */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minHeight: '44px', marginBottom: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: isDark ? '#F8FAFC' : '#2d3f4f', margin: 0, lineHeight: '1.2' }}>
                {roomName}
              </h3>
              {isAvail ? <Sparkles size={14} color="#5D7B93" /> : <Brush size={14} color="#f59e0b" />}
            </div>

            {/* Badges Container - Fixed height */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: '52px', marginBottom: 12 }}>
              {[
                { icon: <BedDouble size={11} />, text: room.type },
                { icon: <Users size={11} />, text: '2-3 Guests' },
                { icon: <Maximize2 size={11} />, text: '35m²' },
              ].map((item, i) => (
                <span key={i} className="rc-badge" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(93,123,147,0.05)', color: isDark ? '#A2B3C1' : '#5D7B93', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E0E7EF'}` }}>
                  {item.icon} {item.text}
                </span>
              ))}
            </div>

            {/* Button - Always at the bottom */}
            <div style={{ marginTop: 'auto' }}>
              <button className={`rc-btn ${bc.hoverClass}`} style={bc.style} disabled={!isAvail}>
                {bc.label}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}