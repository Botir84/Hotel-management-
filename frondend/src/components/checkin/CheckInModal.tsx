import { useState, useEffect, useCallback, useMemo } from 'react';
import { CreditCard, Banknote, User, Hash, Loader2, Sparkles, X, ChevronDown, Bed, Calendar, Phone, Clock } from 'lucide-react';
import api, { roomService } from '../../services/api';
import { Room } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useAlerts } from '../../contexts/AlertContext';
import { useTheme } from '../../contexts/ThemeContext';

const HOTEL_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80';

export function CheckInModal({ isOpen, onClose, room, onSuccess }: any) {
  const { user } = useAuth();
  const { activeAlert, resolveAlert } = useAlerts();
  const { isDark } = useTheme();

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
    const start = new Date(form.check_in_date);
    const end = new Date(form.check_out_date);
    const diff = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    return diff < 1 ? 1 : diff;
  }, [form.check_in_date, form.check_out_date]);

  const selectedRoomData = useMemo(() =>
    availableRooms.find(r => r.id.toString() === form.room_id) || (room?.id?.toString() === form.room_id ? room : null),
    [availableRooms, form.room_id, room]);

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
    } catch (error) {
      alert("Error processing check-in.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = `w-full px-5 py-3 rounded-xl text-sm border transition-all outline-none 
    ${isDark ? 'bg-white/5 border-white/10 text-slate-100 focus:border-[#5D7B93]' : 'bg-slate-50 border-slate-200 text-slate-800'}`;

  const labelClass = `block text-[10px] font-black mb-1.5 uppercase tracking-[0.15em] ${isDark ? 'text-slate-400' : 'text-[#5D7B93]'}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`${isDark ? 'bg-[#0f172a]' : 'bg-white'} border ${isDark ? 'border-white/5' : 'border-slate-200'} w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex h-[90vh]`}>

        {/* LEFT PANEL */}
        <div className="w-[35%] relative hidden md:block">
          <img src={HOTEL_IMAGE} alt="Lobby" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/20 to-transparent" />
          <div className="absolute bottom-12 left-10 right-10">
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-white/20 mb-4 inline-block">Reception</span>
            <h2 className="text-4xl font-black text-white leading-tight">Guest Registration</h2>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className={`px-10 py-6 flex justify-between items-center border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
            <h3 className={`text-xl font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-800'}`}>Check-in Details</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-500/10 rounded-full transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <div className="p-10 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Guest Data Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className={labelClass}>Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 text-[#5D7B93] opacity-60" size={16} />
                    <input className={`${inputClass} pl-12`} placeholder="John Doe" value={form.guest_name} onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))} required />
                  </div>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className={labelClass}>Passport / ID</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-3.5 text-[#5D7B93] opacity-60" size={16} />
                    <input className={`${inputClass} pl-12`} placeholder="AB1234567" value={form.guest_id_number} onChange={e => setForm(f => ({ ...f, guest_id_number: e.target.value }))} required />
                  </div>
                </div>
              </div>

              {/* Room Selector */}
              <div className="relative">
                <label className={labelClass}>Selected Room</label>
                <button
                  type="button"
                  onClick={() => setRoomDropdownOpen(!roomDropdownOpen)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} ${roomDropdownOpen ? 'border-[#5D7B93]' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <Bed size={20} className="text-[#5D7B93]" />
                    <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {selectedRoomData ? `№${selectedRoomData.number} — ${selectedRoomData.type}` : 'Choose an available room'}
                    </p>
                  </div>
                  <ChevronDown className={`text-slate-400 transition-transform ${roomDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {roomDropdownOpen && (
                  <div className={`absolute z-[110] w-full mt-2 rounded-xl border shadow-2xl overflow-hidden ${isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'}`}>
                    <div className="max-h-48 overflow-y-auto">
                      {availableRooms.map(r => (
                        <div key={r.id} onClick={() => { setForm(f => ({ ...f, room_id: r.id.toString() })); setRoomDropdownOpen(false); }} className={`p-4 cursor-pointer flex justify-between hover:bg-[#5D7B93]/10 border-b last:border-0 ${isDark ? 'border-white/5' : 'border-slate-50'}`}>
                          <span className="font-bold text-sm">№{r.number} • {r.type}</span>
                          <span className="text-[#10b981] font-mono font-bold text-sm">${r.price_per_night}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Date & Time Strip - Marksazlashtirilgan */}
              <div className={`p-6 rounded-3xl border flex items-center justify-center gap-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-[#5D7B93]/5 border-[#5D7B93]/10'}`}>
                <div className="flex-1 space-y-3">
                  <span className={labelClass}>Check-in</span>
                  <input type="date" className={inputClass} value={form.check_in_date} onChange={e => setForm(f => ({ ...f, check_in_date: e.target.value }))} />
                  <div className="relative">
                    <Clock className="absolute left-4 top-3 text-[#5D7B93] opacity-60" size={14} />
                    <input type="time" className={`${inputClass} pl-10 py-2`} value={form.check_in_time} onChange={e => setForm(f => ({ ...f, check_in_time: e.target.value }))} />
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center min-w-[100px] self-center pt-5">
                  <div className="h-px w-full bg-[#5D7B93]/20 mb-3" />
                  <span className="px-4 py-1.5 bg-[#5D7B93] text-white text-[10px] font-black rounded-full uppercase shadow-lg shadow-[#5D7B93]/20 whitespace-nowrap">
                    {nightCount} Night{nightCount > 1 ? 's' : ''}
                  </span>
                  <div className="h-px w-full bg-[#5D7B93]/20 mt-3" />
                </div>

                <div className="flex-1 space-y-3">
                  <span className={labelClass}>Check-out</span>
                  <input type="date" className={inputClass} value={form.check_out_date} onChange={e => setForm(f => ({ ...f, check_out_date: e.target.value }))} />
                  <div className="relative">
                    <Clock className="absolute left-4 top-3 text-[#5D7B93] opacity-60" size={14} />
                    <input type="time" className={`${inputClass} pl-10 py-2 opacity-60`} value={form.check_out_time} readOnly />
                  </div>
                </div>
              </div>

              {/* Total Amount Panel */}
              <div className={`p-6 rounded-[2rem] border transition-all ${isDark ? 'bg-[#5D7B93]/10 border-[#5D7B93]/20' : 'bg-white border-[#5D7B93]/30 shadow-sm'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#5D7B93] rounded-lg flex items-center justify-center text-white">
                      <CreditCard size={20} />
                    </div>
                    <h4 className={`text-lg font-black uppercase tracking-widest ${isDark ? 'text-[#5D7B93]' : 'text-[#5D7B93]'}`}>Total Amount</h4>
                  </div>
                  <div className="text-right">
                    <span className={`text-4xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-[#2C3E50]'}`}>
                      ${parseFloat(form.payment_amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-2 gap-3">
                {(['cash', 'card'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, payment_method: m }))}
                    className={`flex items-center justify-center gap-3 py-4 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest transition-all
                      ${form.payment_method === m
                        ? 'bg-[#5D7B93] border-[#5D7B93] text-white shadow-lg'
                        : isDark ? 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                  >
                    {m === 'cash' ? <Banknote size={16} /> : <CreditCard size={16} />} {m}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Footer Buttons - Fixed Size */}
          <div className={`p-8 border-t mt-auto ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
            <div className="flex gap-4 w-full">
              <button
                onClick={onClose}
                className={`flex-1 min-h-[60px] rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${isDark ? 'bg-white/5 text-slate-500 hover:bg-white/10' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] min-h-[60px] rounded-xl font-black uppercase text-[10px] tracking-widest text-white shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #5D7B93 0%, #7A97AD 100%)' }}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                Confirm Registration
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}