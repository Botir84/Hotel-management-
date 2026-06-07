import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, Banknote, User, Hash, Loader2, Sparkles, X, ChevronDown, Bed, Calendar, Phone, Clock } from 'lucide-react';
import api, { roomService } from '../../services/api';
import { Room } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useAlerts } from '../../contexts/AlertContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLang } from '../../contexts/LanguageContext';

const HOTEL_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80';

export function CheckInModal({ isOpen, onClose, room, onSuccess }: any) {
  const { user } = useAuth();
  const { activeAlert, resolveAlert } = useAlerts();
  const { isDark } = useTheme();
  const { t } = useLang();

  const [form, setForm] = useState({
    guest_name: '',
    guest_id_number: '',
    phone_number: '',
    room_id: '',
    check_in_date: '',
    check_in_time: '',
    check_out_date: '',
    check_out_time: '12:00',
    payment_method: 'card' as 'cash' | 'card',
    payment_amount: '0.00',
  });

  const [loading, setLoading] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [roomDropdownOpen, setRoomDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const inDate = now.toISOString().split('T')[0];
      const outDate = new Date(now.setDate(now.getDate() + 1)).toISOString().split('T')[0];
      setForm(prev => ({
        ...prev,
        check_in_date: inDate,
        check_in_time: new Date().toTimeString().slice(0, 5),
        check_out_date: outDate,
      }));
      roomService.getRooms().then((res) => {
        const rooms = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setAvailableRooms(rooms.filter((r: Room) => r.status === 'available'));
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (room) setForm(f => ({ ...f, room_id: room.id.toString() }));
  }, [room]);

  const nightCount = useMemo(() => {
    if (!form.check_in_date || !form.check_out_date) return 1;
    const diff = Math.ceil(
      (new Date(form.check_out_date).getTime() - new Date(form.check_in_date).getTime()) / 86400000
    );
    return diff < 1 ? 1 : diff;
  }, [form.check_in_date, form.check_out_date]);

  const selectedRoomData = useMemo(() =>
    availableRooms.find(r => r.id.toString() === form.room_id) ||
    (room?.id?.toString() === form.room_id ? room : null),
    [availableRooms, form.room_id, room]
  );

  useEffect(() => {
    if (selectedRoomData) {
      const price = parseFloat(selectedRoomData.price_per_night as any);
      setForm(f => ({ ...f, payment_amount: (nightCount * price).toFixed(2) }));
    }
  }, [nightCount, selectedRoomData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        room: parseInt(form.room_id),
        receptionist: user.id,
        check_in_date: `${form.check_in_date}T${form.check_in_time}:00`,
        check_out_date: `${form.check_out_date}T${form.check_out_time}:00`,
        payment_amount: parseFloat(form.payment_amount),
      };
      const res = await api.post('/checkins/', payload);
      if (activeAlert) await resolveAlert(activeAlert.id, res.data.id);
      onSuccess();
      onClose();
    } catch {
      alert(t('checkin_title'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = `w-full px-4 py-3 rounded-xl text-sm border transition-all outline-none
    ${isDark ? 'bg-white/5 border-white/10 text-slate-100 focus:border-[#5D7B93]' : 'bg-slate-50 border-slate-200 text-slate-800'}`;
  const labelClass = `block text-[10px] font-black mb-1.5 uppercase tracking-[0.15em] ${isDark ? 'text-slate-400' : 'text-[#5D7B93]'}`;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '12px',
      background: 'rgba(2,6,23,0.85)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    }}>
      <div className={`${isDark ? 'bg-[#0f172a]' : 'bg-white'} border ${isDark ? 'border-white/5' : 'border-slate-200'}
        w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden flex`}
        style={{ height: '92vh', maxHeight: '92vh' }}>

        {/* LEFT PANEL — faqat katta ekranda */}
        <div className="w-[35%] relative hidden lg:block flex-shrink-0">
          <img src={HOTEL_IMAGE} alt="Lobby" className="absolute inset-0 w-full h-full object-cover" />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0f172a 0%, rgba(15,23,42,0.5) 50%, rgba(15,23,42,0.3) 100%)' }} />
          <div className="absolute bottom-12 left-10 right-10">
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-white/20 mb-4 inline-block">
              {t('reception')}
            </span>
            <h2 className="text-4xl font-black text-white leading-tight">{t('guest_reg')}</h2>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Header */}
          <div className={`px-6 md:px-10 py-4 md:py-6 flex justify-between items-center border-b flex-shrink-0
            ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
            <h3 className={`text-base md:text-xl font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {t('checkin_title')}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-500/10 rounded-full transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 md:px-10 py-5 md:py-8 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Guest info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t('full_name')}</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 text-[#5D7B93] opacity-60" size={16} />
                    <input className={`${inputClass} pl-11`} placeholder="John Doe"
                      value={form.guest_name} onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))} required />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t('passport_id')}</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-3.5 text-[#5D7B93] opacity-60" size={16} />
                    <input className={`${inputClass} pl-11`} placeholder="AB1234567"
                      value={form.guest_id_number} onChange={e => setForm(f => ({ ...f, guest_id_number: e.target.value }))} required />
                  </div>
                </div>
              </div>

              {/* Room Selector */}
              <div className="relative">
                <label className={labelClass}>{t('selected_room')}</label>
                <button type="button" onClick={() => setRoomDropdownOpen(!roomDropdownOpen)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all
                    ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}
                    ${roomDropdownOpen ? 'border-[#5D7B93]' : ''}`}>
                  <div className="flex items-center gap-3">
                    <Bed size={18} className="text-[#5D7B93] flex-shrink-0" />
                    <p className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {selectedRoomData ? `№${selectedRoomData.number} — ${selectedRoomData.type}` : t('choose_room')}
                    </p>
                  </div>
                  <ChevronDown className={`text-slate-400 transition-transform flex-shrink-0 ${roomDropdownOpen ? 'rotate-180' : ''}`} size={18} />
                </button>

                {roomDropdownOpen && (
                  <div className={`absolute z-[110] w-full mt-2 rounded-xl border shadow-2xl overflow-hidden
                    ${isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'}`}>
                    <div className="max-h-48 overflow-y-auto">
                      {availableRooms.map(r => (
                        <div key={r.id}
                          onClick={() => { setForm(f => ({ ...f, room_id: r.id.toString() })); setRoomDropdownOpen(false); }}
                          className={`p-4 cursor-pointer flex justify-between hover:bg-[#5D7B93]/10 border-b last:border-0
                            ${isDark ? 'border-white/5' : 'border-slate-50'}`}>
                          <span className="font-bold text-sm">№{r.number} • {r.type}</span>
                          <span className="text-[#10b981] font-mono font-bold text-sm">${r.price_per_night}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ✅ Date & Time — mobil uchun vertikal, katta ekranda gorizontal */}
              <div className={`p-4 md:p-6 rounded-2xl border
                ${isDark ? 'bg-white/5 border-white/10' : 'bg-[#5D7B93]/5 border-[#5D7B93]/10'}`}>

                {/* Mobil: vertikal stack */}
                <div className="flex flex-col gap-4 md:hidden">
                  {/* Check-in */}
                  <div className="space-y-2">
                    <span className={labelClass}>{t('checkin_label')}</span>
                    <input type="date" className={inputClass} value={form.check_in_date}
                      onChange={e => setForm(f => ({ ...f, check_in_date: e.target.value }))} />
                    <div className="relative">
                      <Clock className="absolute left-4 top-3 text-[#5D7B93] opacity-60" size={14} />
                      <input type="time" className={`${inputClass} pl-10`} value={form.check_in_time}
                        onChange={e => setForm(f => ({ ...f, check_in_time: e.target.value }))} />
                    </div>
                  </div>

                  {/* Tunlar soni */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-[#5D7B93]/20" />
                    <span className="px-4 py-1.5 bg-[#5D7B93] text-white text-[10px] font-black rounded-full uppercase shadow-lg whitespace-nowrap">
                      {nightCount} {nightCount > 1 ? t('nights') : t('night')}
                    </span>
                    <div className="flex-1 h-px bg-[#5D7B93]/20" />
                  </div>

                  {/* Check-out */}
                  <div className="space-y-2">
                    <span className={labelClass}>{t('checkout_label')}</span>
                    <input type="date" className={inputClass} value={form.check_out_date}
                      onChange={e => setForm(f => ({ ...f, check_out_date: e.target.value }))} />
                    <div className="relative">
                      <Clock className="absolute left-4 top-3 text-[#5D7B93] opacity-60" size={14} />
                      <input type="time" className={`${inputClass} pl-10 opacity-60`} value={form.check_out_time} readOnly />
                    </div>
                  </div>
                </div>

                {/* Desktop: gorizontal */}
                <div className="hidden md:flex items-center gap-4">
                  <div className="flex-1 space-y-3">
                    <span className={labelClass}>{t('checkin_label')}</span>
                    <input type="date" className={inputClass} value={form.check_in_date}
                      onChange={e => setForm(f => ({ ...f, check_in_date: e.target.value }))} />
                    <div className="relative">
                      <Clock className="absolute left-4 top-3 text-[#5D7B93] opacity-60" size={14} />
                      <input type="time" className={`${inputClass} pl-10 py-2`} value={form.check_in_time}
                        onChange={e => setForm(f => ({ ...f, check_in_time: e.target.value }))} />
                    </div>
                  </div>

                  <div className="flex flex-col items-center min-w-[90px] pt-5">
                    <div className="h-px w-full bg-[#5D7B93]/20 mb-3" />
                    <span className="px-3 py-1.5 bg-[#5D7B93] text-white text-[10px] font-black rounded-full uppercase shadow-lg text-center whitespace-nowrap">
                      {nightCount} {nightCount > 1 ? t('nights') : t('night')}
                    </span>
                    <div className="h-px w-full bg-[#5D7B93]/20 mt-3" />
                  </div>

                  <div className="flex-1 space-y-3">
                    <span className={labelClass}>{t('checkout_label')}</span>
                    <input type="date" className={inputClass} value={form.check_out_date}
                      onChange={e => setForm(f => ({ ...f, check_out_date: e.target.value }))} />
                    <div className="relative">
                      <Clock className="absolute left-4 top-3 text-[#5D7B93] opacity-60" size={14} />
                      <input type="time" className={`${inputClass} pl-10 py-2 opacity-60`} value={form.check_out_time} readOnly />
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Amount */}
              <div className={`p-4 md:p-6 rounded-2xl border
                ${isDark ? 'bg-[#5D7B93]/10 border-[#5D7B93]/20' : 'bg-white border-[#5D7B93]/30 shadow-sm'}`}>
                <div className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 md:w-10 md:h-10 bg-[#5D7B93] rounded-lg flex items-center justify-center text-white flex-shrink-0">
                      <CreditCard size={18} />
                    </div>
                    <h4 className="text-sm md:text-base font-black uppercase tracking-widest text-[#5D7B93]">{t('total_amount')}</h4>
                  </div>
                  <span className={`text-2xl md:text-4xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-[#2C3E50]'}`}>
                    {parseFloat(form.payment_amount).toLocaleString()}so'm
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-2 gap-3">
                {(['cash', 'card'] as const).map(m => (
                  <button key={m} type="button" onClick={() => setForm(f => ({ ...f, payment_method: m }))}
                    className={`flex items-center justify-center gap-2 py-3 md:py-4 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest transition-all
                      ${form.payment_method === m
                        ? 'bg-[#5D7B93] border-[#5D7B93] text-white shadow-lg'
                        : isDark ? 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                    {m === 'cash' ? <Banknote size={15} /> : <CreditCard size={15} />}
                    {t(m === 'cash' ? 'payment_cash' : 'payment_card')}
                  </button>
                ))}
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className={`px-6 md:px-10 py-4 md:py-6 border-t flex-shrink-0 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
            <div className="flex gap-3 w-full">
              <button onClick={onClose}
                className={`flex-1 min-h-[52px] md:min-h-[60px] rounded-xl font-black uppercase text-[10px] tracking-widest transition-all
                  ${isDark ? 'bg-white/5 text-slate-500 hover:bg-white/10' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                {t('cancel')}
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-[2] min-h-[52px] md:min-h-[60px] rounded-xl font-black uppercase text-[10px] tracking-widest text-white shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #5D7B93 0%, #7A97AD 100%)' }}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {t('confirm_reg')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}