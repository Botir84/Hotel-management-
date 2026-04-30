import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Banknote, User, Hash, Loader2, Sparkles, CalendarDays, X, Moon, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Room } from '../../types';
import api, { roomService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useAlerts } from '../../contexts/AlertContext';
import { useTheme } from '../../contexts/ThemeContext';

const HOTEL_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=85';

const typeLabel: Record<string, string> = {
  standard: 'Standard',
  deluxe: 'Luxury Deluxe',
  suite: 'Premium Suite',
};

export function CheckInModal({ isOpen, onClose, room, onSuccess }: any) {
  const { user } = useAuth();
  const { activeAlert, resolveAlert } = useAlerts();
  const { isDark } = useTheme();

  const getInitialDates = () => {
    const now = new Date();
    const currentISO = now.toLocaleDateString('en-CA');
    const currentHour = now.getHours();
    let checkoutDate = new Date();
    if (currentHour >= 12) checkoutDate.setDate(now.getDate() + 1);
    return {
      inDate: currentISO,
      inTime: now.toTimeString().slice(0, 5),
      outDate: checkoutDate.toLocaleDateString('en-CA'),
    };
  };

  const initialForm = {
    guest_name: '',
    guest_id_number: '',
    room_id: '',
    check_in_date: '',
    check_in_time: '',
    check_out_date: '',
    check_out_time: '12:00',
    payment_method: 'cash' as 'cash' | 'card',
    payment_amount: '0.00',
    notes: '',
    is_custom_price: false,
  };

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);

  useEffect(() => {
    if (isOpen) {
      const dates = getInitialDates();
      setForm(prev => ({
        ...prev,
        check_in_date: dates.inDate,
        check_in_time: dates.inTime,
        check_out_date: dates.outDate,
      }));
      roomService.getRooms().then((res) => {
        const rooms = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setAvailableRooms(rooms.filter((r: Room) => r.status === 'available'));
      }).catch(() => setError('Xonalarni yuklashda xatolik.'));
    }
  }, [isOpen]);

  useEffect(() => {
    if (room) setForm(f => ({ ...f, room_id: room.id.toString() }));
  }, [room]);

  const calculateTotal = useCallback(() => {
    if (form.is_custom_price || !form.check_out_date || !form.room_id) return;
    const selectedRoom = availableRooms.find(r => r.id.toString() === form.room_id);
    const pricePerNight = selectedRoom?.price_per_night ? parseFloat(selectedRoom.price_per_night as any) : 0;
    const start = new Date(form.check_in_date);
    const end = new Date(form.check_out_date);
    const diffTime = end.getTime() - start.getTime();
    const dayDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const finalDays = dayDiff < 1 ? 1 : dayDiff;
    setForm(f => ({ ...f, payment_amount: (finalDays * pricePerNight).toFixed(2) }));
  }, [form.check_in_date, form.check_out_date, form.room_id, form.is_custom_price, availableRooms]);

  useEffect(() => { calculateTotal(); }, [calculateTotal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    const payload = {
      guest_name: form.guest_name,
      guest_id_number: form.guest_id_number,
      room: parseInt(form.room_id),
      receptionist: user.id,
      check_in_date: `${form.check_in_date}T${form.check_in_time}:00`,
      check_out_date: `${form.check_out_date}T${form.check_out_time}:00`,
      payment_amount: parseFloat(form.payment_amount),
      payment_method: form.payment_method,
      notes: form.notes,
    };
    try {
      const res = await api.post('/checkins/', payload);
      if (activeAlert) await resolveAlert(activeAlert.id, res.data.id);
      onSuccess();
      onClose();
      setForm(initialForm);
    } catch {
      setError("Ma'lumotlarni yuborishda xatolik. To'ldirishni tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  // Night count for display
  const nightCount = (() => {
    if (!form.check_in_date || !form.check_out_date) return 0;
    const d = Math.ceil((new Date(form.check_out_date).getTime() - new Date(form.check_in_date).getTime()) / 86400000);
    return d < 1 ? 1 : d;
  })();

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        /* ── Backdrop ── */
        .ci-backdrop {
          position: fixed; inset: 0; z-index: 50;
          background: rgba(10,15,25,0.72);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          animation: ci-fade-in .25s ease;
        }
        @keyframes ci-fade-in { from { opacity:0 } to { opacity:1 } }

        /* ── Dialog ── */
        .ci-dialog {
          width: 100%; max-width: 900px;
          border-radius: 24px;
          overflow: hidden;
          display: flex;
          box-shadow: 0 32px 80px rgba(0,0,0,0.45);
          animation: ci-slide-up .35s cubic-bezier(0.23,1,0.32,1);
          max-height: 92vh;
        }
        @keyframes ci-slide-up {
          from { opacity:0; transform: translateY(20px) scale(0.98) }
          to   { opacity:1; transform: translateY(0)   scale(1) }
        }

        /* ── Left panel (image) ── */
        .ci-left {
          width: 320px; flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }
        .ci-left-img {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
        }
        .ci-left-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(10,20,35,0.15) 0%,
            rgba(10,20,35,0.55) 60%,
            rgba(10,20,35,0.88) 100%
          );
        }
        .ci-left-content {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 32px 28px;
        }
        .ci-left-tag {
          font-size: 9px; font-weight: 700;
          letter-spacing: .2em; text-transform: uppercase;
          color: rgba(255,255,255,0.55);
          margin-bottom: 10px;
        }
        .ci-left-title {
          font-size: 26px; font-weight: 800;
          line-height: 1.15;
          color: #fff;
          letter-spacing: -.02em;
        }
        .ci-left-sub {
          margin-top: 8px;
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          font-style: italic;
        }
        /* floating pill */
        .ci-pill {
          position: absolute; top: 24px; left: 24px;
          display: flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.18);
          padding: 6px 14px; border-radius: 999px;
          font-size: 10px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase;
          color: #fff;
        }

        /* ── Right panel ── */
        .ci-right {
          flex: 1;
          overflow-y: auto;
          padding: 36px 36px 32px;
          position: relative;
        }

        /* close btn */
        .ci-close {
          position: absolute; top: 20px; right: 20px;
          width: 34px; height: 34px; border-radius: 50%;
          background: transparent;
          border: 1px solid rgba(93,123,147,0.25);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background .2s, border-color .2s;
          color: #5D7B93;
        }
        .ci-close:hover {
          background: rgba(93,123,147,0.1);
          border-color: #5D7B93;
        }

        /* header */
        .ci-header-title {
          font-size: 22px; font-weight: 800;
          letter-spacing: -.03em;
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 3px;
        }
        .ci-header-sub {
          font-size: 12px;
          margin-bottom: 28px;
        }

        /* label */
        .ci-label {
          display: block;
          font-size: 9px; font-weight: 800;
          letter-spacing: .18em; text-transform: uppercase;
          margin-bottom: 7px;
          color: #5D7B93;
        }

        /* input */
        .ci-input {
          width: 100%; padding: 11px 16px;
          border-radius: 12px;
          font-size: 13px;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
          box-sizing: border-box;
        }
        .ci-input:focus {
          border-color: #5D7B93 !important;
          box-shadow: 0 0 0 3px rgba(93,123,147,0.12);
        }

        /* input with icon */
        .ci-input-wrap { position: relative; }
        .ci-input-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: #A2B3C1; pointer-events: none;
        }
        .ci-input-padded { padding-left: 40px !important; }

        /* date strip */
        .ci-date-strip {
          border-radius: 16px;
          border: 1px dashed rgba(93,123,147,0.3);
          padding: 20px 22px;
          display: grid; grid-template-columns: 1fr auto 1fr;
          align-items: center; gap: 12px;
          margin-bottom: 20px;
        }
        .ci-date-col { display: flex; flex-direction: column; gap: 5px; }
        .ci-date-col-label {
          font-size: 8px; font-weight: 800;
          letter-spacing: .15em; text-transform: uppercase;
          color: #A2B3C1;
        }
        .ci-date-col-val { font-size: 13px; font-weight: 600; }
        .ci-date-separator {
          display: flex; flex-direction: column; align-items: center; gap: 2px;
          padding: 0 8px;
        }
        .ci-nights-badge {
          font-size: 10px; font-weight: 700;
          color: #5D7B93;
          background: rgba(93,123,147,0.1);
          padding: 3px 10px; border-radius: 999px;
          white-space: nowrap;
        }

        /* payment buttons */
        .ci-pay-btn {
          flex: 1; padding: 14px 0;
          border-radius: 14px;
          font-size: 11px; font-weight: 800;
          letter-spacing: .15em; text-transform: uppercase;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          cursor: pointer;
          transition: all .25s cubic-bezier(0.34,1.56,0.64,1);
          border: none;
        }
        .ci-pay-btn:hover { transform: translateY(-2px); }

        /* submit */
        .ci-submit {
          width: 100%; padding: 15px;
          border-radius: 16px;
          font-size: 11px; font-weight: 800;
          letter-spacing: .18em; text-transform: uppercase;
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all .3s cubic-bezier(0.34,1.56,0.64,1);
          background: linear-gradient(135deg, #5D7B93 0%, #7a9ab3 100%);
          color: #F8FAFC;
          box-shadow: 0 8px 24px rgba(93,123,147,0.35);
        }
        .ci-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 36px rgba(93,123,147,0.5);
        }
        .ci-submit:active { transform: translateY(0); }

        .ci-cancel {
          flex: 1; padding: 15px;
          border-radius: 16px;
          font-size: 11px; font-weight: 700;
          letter-spacing: .12em; text-transform: uppercase;
          cursor: pointer; border: none;
          background: transparent;
          transition: background .2s;
        }

        /* section divider */
        .ci-divider {
          height: 1px; margin: 20px 0;
          background: linear-gradient(to right, rgba(93,123,147,0.2), transparent);
        }

        /* error */
        .ci-error {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 11px; font-weight: 700;
          letter-spacing: .05em;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.25);
          color: #dc2626;
          margin-bottom: 16px;
        }

        /* scrollbar */
        .ci-right::-webkit-scrollbar { width: 4px; }
        .ci-right::-webkit-scrollbar-track { background: transparent; }
        .ci-right::-webkit-scrollbar-thumb { background: rgba(93,123,147,0.2); border-radius: 99px; }

        @media (max-width: 680px) {
          .ci-left { display: none; }
          .ci-dialog { max-width: 480px; }
        }
      `}</style>

      <div className="ci-backdrop" onClick={onClose}>
        <div className="ci-dialog" onClick={e => e.stopPropagation()}>

          {/* ── LEFT: hotel image panel ── */}
          <div className="ci-left">
            <img src={HOTEL_IMAGE} alt="Hotel lobby" className="ci-left-img" />
            <div className="ci-left-overlay" />

            {/* Top pill */}
            <div className="ci-pill">
              <Sparkles size={10} />
              Registration
            </div>

            {/* Bottom text */}
            <div className="ci-left-content">
              <p className="ci-left-tag">Hotel HRM</p>
              <h2 className="ci-left-title">Welcome to the Grand Wing</h2>
              <p className="ci-left-sub">Curating the guest experience</p>
            </div>
          </div>

          {/* ── RIGHT: form panel ── */}
          <div
            className="ci-right"
            style={{
              background: isDark ? '#0f1923' : '#F8FAFC',
              color: isDark ? '#e2e8f0' : '#1e293b',
            }}
          >
            {/* Close */}
            <button className="ci-close" onClick={onClose}>
              <X size={15} />
            </button>

            {/* Header */}
            <div>
              <h2
                className="ci-header-title"
                style={{ color: isDark ? '#F8FAFC' : '#1e293b' }}
              >
                <Sparkles size={18} color="#5D7B93" />
                Check-in Formalities
              </h2>
              <p className="ci-header-sub" style={{ color: '#A2B3C1' }}>
                Yangi mehmonni ro'yxatdan o'tkazish
              </p>
            </div>

            <form onSubmit={handleSubmit}>

              {/* Row 1: Guest name + ID */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label className="ci-label">Mehmon ismi</label>
                  <div className="ci-input-wrap">
                    <User size={14} className="ci-input-icon" />
                    <input
                      type="text"
                      className="ci-input ci-input-padded"
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E0E7EF'}`,
                        color: isDark ? '#F8FAFC' : '#1e293b',
                      }}
                      placeholder="Botir Arabboyev"
                      value={form.guest_name}
                      onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="ci-label">Pasport / ID</label>
                  <div className="ci-input-wrap">
                    <Hash size={14} className="ci-input-icon" />
                    <input
                      type="text"
                      className="ci-input ci-input-padded"
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E0E7EF'}`,
                        color: isDark ? '#F8FAFC' : '#1e293b',
                      }}
                      placeholder="AB1234567"
                      value={form.guest_id_number}
                      onChange={e => setForm(f => ({ ...f, guest_id_number: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Room selection */}
              <div style={{ marginBottom: 16 }}>
                <label className="ci-label">Xona tanlash</label>
                <select
                  className="ci-input"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E0E7EF'}`,
                    color: isDark ? '#F8FAFC' : '#1e293b',
                  }}
                  value={form.room_id}
                  onChange={e => setForm(f => ({ ...f, room_id: e.target.value, is_custom_price: false }))}
                  required
                >
                  <option value="">Bo'sh xonani tanlang...</option>
                  {availableRooms.map(r => (
                    <option key={r.id} value={r.id} style={{ background: isDark ? '#0f1923' : '#fff' }}>
                      №{r.number} — {typeLabel[r.type] || r.type} (${r.price_per_night}/kecha)
                    </option>
                  ))}
                </select>
              </div>

              {/* Date strip */}
              <div
                className="ci-date-strip"
                style={{
                  background: isDark ? 'rgba(93,123,147,0.06)' : 'rgba(93,123,147,0.04)',
                }}
              >
                {/* Check-in */}
                <div className="ci-date-col" style={{ opacity: 0.6 }}>
                  <span className="ci-date-col-label">Kirish (Bugun)</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input
                      type="date"
                      className="ci-input"
                      style={{
                        background: 'transparent',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E0E7EF'}`,
                        color: isDark ? '#94a3b8' : '#64748b',
                        fontSize: 12, padding: '8px 12px',
                      }}
                      value={form.check_in_date}
                      readOnly
                    />
                    <input
                      type="time"
                      className="ci-input"
                      style={{
                        background: 'transparent',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E0E7EF'}`,
                        color: isDark ? '#94a3b8' : '#64748b',
                        fontSize: 12, padding: '8px 12px',
                      }}
                      value={form.check_in_time}
                      readOnly
                    />
                  </div>
                </div>

                {/* Separator */}
                <div className="ci-date-separator">
                  <ArrowRight size={16} color="#A2B3C1" />
                  {nightCount > 0 && (
                    <span className="ci-nights-badge">{nightCount} kecha</span>
                  )}
                </div>

                {/* Check-out */}
                <div className="ci-date-col">
                  <span className="ci-date-col-label" style={{ color: '#5D7B93' }}>
                    Chiqish (12:00 gacha)
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input
                      type="date"
                      className="ci-input"
                      style={{
                        background: isDark ? 'rgba(93,123,147,0.08)' : '#fff',
                        border: '1px solid rgba(93,123,147,0.4)',
                        color: isDark ? '#F8FAFC' : '#1e293b',
                        fontSize: 12, padding: '8px 12px',
                      }}
                      min={form.check_in_date}
                      value={form.check_out_date}
                      onChange={e => setForm(f => ({ ...f, check_out_date: e.target.value }))}
                      required
                    />
                    <input
                      type="time"
                      className="ci-input"
                      style={{
                        background: 'transparent',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E0E7EF'}`,
                        color: isDark ? '#64748b' : '#94a3b8',
                        fontSize: 12, padding: '8px 12px',
                        opacity: 0.5, cursor: 'not-allowed',
                      }}
                      value={form.check_out_time}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Payment amount */}
              <div style={{ marginBottom: 16 }}>
                <label className="ci-label">To'lov summasi ($)</label>
                <div className="ci-input-wrap">
                  <Banknote size={14} className="ci-input-icon" style={{ color: '#5D7B93' }} />
                  <input
                    type="number"
                    step="0.01"
                    className="ci-input ci-input-padded"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                      border: '1px solid rgba(93,123,147,0.35)',
                      color: '#5D7B93',
                      fontWeight: 800, fontSize: 15,
                    }}
                    value={form.payment_amount}
                    onChange={e => setForm(f => ({ ...f, payment_amount: e.target.value, is_custom_price: true }))}
                    required
                  />
                </div>
              </div>

              <div className="ci-divider" />

              {/* Payment method */}
              <div style={{ marginBottom: 20 }}>
                <label className="ci-label">To'lov usuli</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['cash', 'card'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      className="ci-pay-btn"
                      onClick={() => setForm(f => ({ ...f, payment_method: m }))}
                      style={
                        form.payment_method === m
                          ? {
                            background: 'linear-gradient(135deg, #5D7B93, #7a9ab3)',
                            color: '#F8FAFC',
                            boxShadow: '0 6px 20px rgba(93,123,147,0.35)',
                          }
                          : {
                            background: isDark ? 'rgba(255,255,255,0.05)' : '#E0E7EF',
                            color: isDark ? '#A2B3C1' : '#64748b',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
                          }
                      }
                    >
                      {m === 'cash' ? <Banknote size={16} /> : <CreditCard size={16} />}
                      {m === 'cash' ? 'Naqd' : 'Karta'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && <div className="ci-error">{error}</div>}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  type="button"
                  className="ci-cancel"
                  style={{ color: isDark ? '#64748b' : '#94a3b8' }}
                  onClick={onClose}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="ci-submit"
                  disabled={loading}
                  style={{ flex: 2 }}
                >
                  {loading
                    ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    : <>Ro'yxatdan O'tkazish <ArrowRight size={15} /></>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}