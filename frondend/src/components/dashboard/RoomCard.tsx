import { BedDouble, Users, Maximize2, Sparkles, Brush, DoorOpen, DoorClosed } from 'lucide-react';
import { Room } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useLang } from '../../contexts/LanguageContext';
import { useState, useEffect, useRef } from 'react';

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
type DoorStatus = 'open' | 'closed' | 'unknown';

function getStatus(raw?: string): RoomStatus {
  const s = raw?.toLowerCase() ?? '';
  if (s === 'cleaning' || s === 'dirty') return 'cleaning';
  if (s === 'available') return 'available';
  return 'occupied';
}

// ── Door Status Hook ──────────────────────────────────────────────────────────
function useDoorStatus(roomId: number, hasSensor: boolean) {
  const [doorStatus, setDoorStatus] = useState<DoorStatus>('unknown');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!hasSensor) return;
    const fetchStatus = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = user.access || '';
        const res = await fetch(`http://127.0.0.1:8000/api/rooms/${roomId}/door-status/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setDoorStatus(data.door_open ? 'open' : 'closed');
        if (data.last_updated) {
          const d = new Date(data.last_updated);
          setLastUpdated(d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      } catch { /* jimgina */ }
    };
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [roomId, hasSensor]);

  return { doorStatus, lastUpdated };
}

// ── Room Card ─────────────────────────────────────────────────────────────────
export function RoomCard({ room, onClick, selected = false }: RoomCardProps) {
  const { isDark } = useTheme();
  const { t } = useLang();

  const status = getStatus(room.status);
  const isAvail = status === 'available';

  // ✅ Status label lar t() bilan — config ichida emas, render qismida
  const STATUS_CONFIG = {
    available: { dotColor: '#22c55e', textColor: '#15803d', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.45)', pulse: true },
    occupied: { dotColor: '#ef4444', textColor: '#b91c1c', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.45)', pulse: false },
    cleaning: { dotColor: '#f59e0b', textColor: '#b45309', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.45)', pulse: true },
  };

  const BTN_CONFIG = {
    available: { label: t('book'), style: { background: 'linear-gradient(135deg, #5D7B93 0%, #A2B3C1 100%)', color: '#F8FAFC', boxShadow: '0 8px 24px rgba(93,123,147,0.35)' } as React.CSSProperties, hoverClass: 'btn-available' },
    occupied: { label: t('occupied'), style: { background: 'rgba(162,179,193,0.12)', color: '#A2B3C1', border: '1px solid rgba(162,179,193,0.25)', cursor: 'not-allowed' } as React.CSSProperties, hoverClass: '' },
    cleaning: { label: t('cleaning'), style: { background: 'rgba(245,158,11,0.12)', color: '#b45309', border: '1px solid rgba(245,158,11,0.3)', cursor: 'not-allowed' } as React.CSSProperties, hoverClass: '' },
  };

  const sc = STATUS_CONFIG[status];
  const bc = BTN_CONFIG[status];

  const statusLabel: Record<RoomStatus, string> = {
    available: t('available'),
    occupied: t('occupied'),
    cleaning: t('cleaning'),
  };

  const hasSensor = Boolean((room as any).tuya_device_id);
  const { doorStatus, lastUpdated } = useDoorStatus(room.id, hasSensor);

  const isOpen = doorStatus === 'open';
  const isDangerAlert = isOpen && status === 'available';

  const category = (room as any).chategory || room.type || 'standard';
  const sizeRoom = (room as any).size_room || null;
  const roomName = room.number
    ? `${typeLabel[category] || category} ${room.number}`
    : typeLabel[category] || category || 'Wonderful Room';
  const roomImage = (room as any).image_url
    ? `http://127.0.0.1:8000${(room as any).image_url}`
    : ROOM_IMAGES[room.type] || DEFAULT_IMAGE;

  return (
    <>
      <style>{`
        .rc-wrap { position: relative; border-radius: 2rem; overflow: hidden; cursor: pointer; transition: transform .6s cubic-bezier(0.23,1,0.32,1); height: 100%; display: flex; flex-direction: column; }
        .rc-wrap:hover { transform: translateY(-10px); }
        .rc-img { width: 100%; height: 100%; object-fit: cover; transition: transform 1s cubic-bezier(0.25,0.46,0.45,0.94); }
        .rc-wrap:hover .rc-img { transform: scale(1.09); }
        .rc-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 600; }
        .rc-btn { width: 100%; padding: 13px 0; border-radius: 1.25rem; font-size: 11px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; border: none; }
        @keyframes pulse-dot  { 0%,100%{opacity:1;transform:scale(1);}   50%{opacity:.4;transform:scale(.65);} }
        @keyframes pulse-door { 0%,100%{opacity:1;transform:scale(1);box-shadow:0 0 0 0 rgba(239,68,68,.5);} 50%{opacity:.8;transform:scale(1.25);box-shadow:0 0 0 5px rgba(239,68,68,0);} }
        @keyframes danger-glow { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.35);} 50%{box-shadow:0 0 22px 5px rgba(239,68,68,.2);} }
        .rc-danger { animation: danger-glow 2s infinite; }
      `}</style>

      <div
        className={`rc-wrap${selected ? ' rc-selected' : ''}${isDangerAlert ? ' rc-danger' : ''}`}
        onClick={() => onClick(room)}
      >
        <div style={{
          position: 'relative', borderRadius: '2rem', flex: 1,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: isDangerAlert
            ? '1.5px solid rgba(239,68,68,0.65)'
            : selected
              ? '1.5px solid rgba(93,123,147,0.6)'
              : `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(224,231,239,0.9)'}`,
          background: isDark
            ? 'linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))'
            : '#fff',
          transition: 'border-color 0.4s ease',
        }}>

          {/* Tozalash stripes */}
          {status === 'cleaning' && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
              background: 'repeating-linear-gradient(-45deg,rgba(245,158,11,0.05) 0,rgba(245,158,11,0.05) 10px,transparent 10px,transparent 20px)'
            }} />
          )}

          {/* ⚠️ Xavf banneri */}
          {isDangerAlert && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
              background: 'rgba(220,38,38,0.93)', padding: '7px 12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: '0.04em' }}>
                ⚠️ {t('available').toUpperCase()} — {t('door_open').toUpperCase()}!
              </span>
            </div>
          )}

          {/* IMAGE */}
          <div style={{
            position: 'relative', overflow: 'hidden', margin: '8px',
            borderRadius: '1.5rem', height: '200px', flexShrink: 0,
            marginTop: isDangerAlert ? '38px' : '8px', transition: 'margin-top 0.3s ease'
          }}>
            <img src={roomImage} alt={roomName} className="rc-img" />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 50%,rgba(0,0,0,0.7) 100%)' }} />

            {/* Xona raqami */}
            <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: 99, color: '#fff', fontSize: 10, fontWeight: 700 }}>
              {room.number}
            </div>

            {/* CRM Status — yuqori o'ng */}
            <div style={{ position: 'absolute', top: 12, right: 12 }}>
              <span className="rc-badge" style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.textColor, backdropFilter: 'blur(8px)' }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: sc.dotColor, flexShrink: 0,
                  display: 'inline-block', animation: sc.pulse ? 'pulse-dot 1.5s infinite' : 'none'
                }} />
                {statusLabel[status]}
              </span>
            </div>

            {/* Narx */}
            <div style={{
              position: 'absolute', bottom: 12, left: 12,
              background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
              padding: '6px 12px', borderRadius: 12, color: '#fff'
            }}>
              <span style={{ fontWeight: 900 }}>${Number(room.price_per_night)}</span>
              <span style={{ fontSize: 9, opacity: 0.8 }}>/night</span>
            </div>
          </div>

          {/* CONTENT */}
          <div style={{ padding: '14px 18px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minHeight: '44px', marginBottom: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: isDark ? '#F8FAFC' : '#2d3f4f', margin: 0, lineHeight: '1.2' }}>
                {roomName}
              </h3>
              {isAvail ? <Sparkles size={14} color="#5D7B93" /> : <Brush size={14} color="#f59e0b" />}
            </div>

            {/* Badge lar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: '52px', marginBottom: 12 }}>
              {/* Kategoriya */}
              <span className="rc-badge" style={{
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(93,123,147,0.05)',
                color: isDark ? '#A2B3C1' : '#5D7B93',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E0E7EF'}`,
              }}>
                <BedDouble size={11} /> {category}
              </span>

              {/* Hajm */}
              {sizeRoom && (
                <span className="rc-badge" style={{
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(93,123,147,0.05)',
                  color: isDark ? '#A2B3C1' : '#5D7B93',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E0E7EF'}`,
                }}>
                  <Maximize2 size={11} /> {sizeRoom}m²
                </span>
              )}

              {/* Eshik statusi */}
              {hasSensor && doorStatus !== 'unknown' && (
                <span className="rc-badge" style={{
                  background: isOpen ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                  color: isOpen ? '#ef4444' : '#16a34a',
                  border: `1px solid ${isOpen ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                }}>
                  {isOpen ? <DoorOpen size={11} /> : <DoorClosed size={11} />}
                  {isOpen ? t('door_open') : t('door_closed')}
                  {lastUpdated && (
                    <span style={{ fontSize: 9, opacity: 0.7, marginLeft: 2 }}>{lastUpdated}</span>
                  )}
                </span>
              )}
            </div>

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