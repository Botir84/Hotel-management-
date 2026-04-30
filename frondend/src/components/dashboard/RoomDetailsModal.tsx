import { X, LogOut, Loader2, Calendar, UserCheck, ReceiptText, Edit3, Save, Clock, ArrowRight, TrendingUp, Banknote, CreditCard, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import api, { roomService } from '../../services/api';
import { Reservation, Room } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface RoomDetailsModalProps {
    isOpen: boolean;
    room: Room | undefined;
    reservation?: Reservation;
    onClose: () => void;
    onSuccess: () => void;
}

const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
};

const formatTime = (dateString: string | undefined) => {
    if (!dateString) return '--:--';
    try {
        const timePart = dateString.split('T')[1];
        const [hours, minutes] = timePart.split(':');
        return `${hours}:${minutes}`;
    } catch (e) { return '--:--'; }
};

const formatDateDisplay = (dateString: string | undefined) => {
    if (!dateString) return '---';
    try {
        const datePart = dateString.split('T')[0];
        const [year, month, day] = datePart.split('-');
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${day}-${monthNames[parseInt(month) - 1]}, ${year}`;
    } catch (e) { return '---'; }
};

const calculateLateCheckOutPenalty = (scheduledOutDate: string) => {
    const now = new Date();
    const deadline = new Date(`${scheduledOutDate.split('T')[0]}T12:00:00`);
    if (now <= deadline) return { lateHours: 0, penalty: 0 };
    const diffMs = now.getTime() - deadline.getTime();
    const lateHours = Math.ceil(diffMs / (1000 * 60 * 60));
    return { lateHours, penalty: lateHours * 5 };
};

const getDaysDiff = (from: string, to: string): number => {
    if (!from || !to) return 0;
    const a = new Date(from.split('T')[0]);
    const b = new Date(to);
    const diff = Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
};

export function RoomDetailsModal({ isOpen, room, reservation, onClose, onSuccess }: RoomDetailsModalProps) {
    const { isDark } = useTheme();
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');

    const [editForm, setEditForm] = useState({
        room_id: '',
        check_out_date: '',
        notes: '',
    });

    const lateStatus = useMemo(() => {
        if (!reservation?.check_out_date) return { lateHours: 0, penalty: 0 };
        return calculateLateCheckOutPenalty(reservation.check_out_date);
    }, [reservation?.check_out_date, isOpen]);

    const extraChargeInfo = useMemo(() => {
        if (!reservation?.check_out_date || !editForm.check_out_date) return null;
        const originalDate = reservation.check_out_date;
        const newDate = editForm.check_out_date;
        const extraDays = getDaysDiff(originalDate, newDate);
        if (extraDays <= 0) return null;
        const pricePerNight = room?.price_per_night || 0;
        return { extraDays, extraCharge: extraDays * (typeof pricePerNight === 'string' ? parseFloat(pricePerNight) : pricePerNight), pricePerNight };
    }, [editForm.check_out_date, reservation?.check_out_date, room?.price_per_night]);

    useEffect(() => {
        if (isOpen && reservation) {
            setEditForm({
                room_id: room?.id.toString() || '',
                check_out_date: formatDateForInput(reservation.check_out_date),
                notes: reservation.notes || '',
            });
            roomService.getRooms().then(res => {
                const rooms = Array.isArray(res.data) ? res.data : (res.data.results || []);
                setAvailableRooms(rooms.filter((r: Room) => r.status === 'available'));
            });
        }
    }, [isOpen, reservation, room]);

    const handleUpdate = async () => {
        if (!reservation) return;
        setLoading(true);
        try {
            const finalizedCheckOut = `${editForm.check_out_date}T12:00:00`;
            await api.patch(`/checkins/${reservation.id}/`, {
                room: parseInt(editForm.room_id),
                check_out_date: finalizedCheckOut,
                notes: editForm.notes,
            });
            if (extraChargeInfo && extraChargeInfo.extraCharge > 0) {
                await api.post('/payments/', {
                    check_in: reservation.id,
                    amount: extraChargeInfo.extraCharge,
                    method: paymentMethod,
                    notes: `Extension: ${extraChargeInfo.extraDays} day(s)`
                });
            }
            setIsEditing(false);
            onSuccess();
        } catch (error) {
            alert("Error updating information!");
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async () => {
        if (!reservation || !room) return;
        let confirmMessage = `Confirm checkout for Room №${room.number}?`;
        if (lateStatus.lateHours > 0) confirmMessage = `⚠️ LATE CHECKOUT! Penalty: $${lateStatus.penalty}. Has payment been received?`;
        if (!window.confirm(confirmMessage)) return;

        setLoading(true);
        try {
            const now = new Date().toISOString();
            await api.patch(`/checkins/${reservation.id}/`, { actual_check_out: now });
            await api.patch(`/rooms/${room.id}/`, { status: 'dirty' });
            if (lateStatus.penalty > 0) {
                await api.post('/payments/', {
                    check_in: reservation.id,
                    amount: lateStatus.penalty,
                    method: 'cash',
                    notes: `Late penalty: ${lateStatus.lateHours}h`
                });
            }
            onSuccess();
            onClose();
        } catch (error) { alert("Checkout error!"); } finally { setLoading(false); }
    };

    if (!isOpen || !room) return null;
    const totalPaid = reservation?.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    const inputClass = `w-full px-5 py-3.5 rounded-2xl text-sm border transition-all outline-none backdrop-blur-md 
    ${isDark
            ? 'bg-white/5 border-white/10 text-slate-100 focus:border-[#5D7B93] focus:ring-4 focus:ring-[#5D7B93]/10'
            : 'bg-slate-50/50 border-slate-200 text-slate-800 focus:border-[#5D7B93] focus:ring-4 focus:ring-[#5D7B93]/10'
        }`;

    const labelClass = `block text-[10px] font-black mb-2 uppercase tracking-[0.15em] ${isDark ? 'text-slate-400' : 'text-[#5D7B93]'}`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
            <div className={`${isDark ? 'bg-[#1e293b]' : 'bg-white'} border ${isDark ? 'border-white/10' : 'border-slate-200'} w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex h-[85vh] transition-all`}>

                {/* LEFT SIDE: Visual Panel */}
                <div className="w-[40%] relative overflow-hidden hidden md:block">
                    <img
                        src={room.image || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80"}
                        alt="Room"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

                    <div className="absolute bottom-10 left-10 right-10">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-white/30">
                                {room.type}
                            </span>
                            {room.status === 'occupied' && (
                                <span className="px-3 py-1 bg-emerald-500/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                                    Occupied
                                </span>
                            )}
                        </div>
                        <h2 className="text-4xl font-black text-white leading-tight mb-2">Room №{room.number}</h2>
                        <p className="text-slate-300 text-sm font-medium opacity-80 leading-relaxed italic">
                            "{reservation?.notes || 'Providing premium service for our guests is our top priority.'}"
                        </p>
                    </div>
                </div>

                {/* RIGHT SIDE: Content Panel */}
                <div className="flex-1 flex flex-col min-w-0 bg-transparent">
                    {/* Header */}
                    <div className={`px-8 py-7 flex justify-between items-center border-b ${isDark ? 'border-white/5' : 'border-slate-100'} ${isDark ? 'bg-[#5D7B93]/5' : 'bg-slate-50/50'}`}>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-[#5D7B93]/10 text-[#5D7B93] text-[9px] font-black uppercase tracking-widest rounded-md border border-[#5D7B93]/20">Room Service</span>
                                {lateStatus.lateHours > 0 && !isEditing && (
                                    <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-md border border-red-500/20 animate-pulse">Late Alert</span>
                                )}
                            </div>
                            <h3 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Room Details</h3>
                        </div>
                        <button onClick={onClose} className={`p-3 rounded-2xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                        {!isEditing ? (
                            <>
                                {/* Dates Panel */}
                                <div className={`p-6 rounded-[2rem] border flex items-center justify-between relative ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-emerald-500 mb-1">
                                            <Calendar size={13} />
                                            <span className="text-[9px] font-black uppercase tracking-tighter">Check In</span>
                                        </div>
                                        <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatDateDisplay(reservation?.check_in_date)}</p>
                                        <div className="flex items-center gap-1 opacity-50">
                                            <Clock size={11} className={isDark ? 'text-slate-400' : 'text-slate-600'} />
                                            <span className={`text-[11px] font-mono font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{formatTime(reservation?.check_in_date)}</span>
                                        </div>
                                    </div>

                                    <div className="absolute left-1/2 -translate-x-1/2 opacity-20">
                                        <ArrowRight size={24} className={isDark ? 'text-white' : 'text-[#5D7B93]'} />
                                    </div>

                                    <div className="text-right space-y-1">
                                        <div className={`flex items-center gap-2 justify-end mb-1 ${lateStatus.lateHours > 0 ? 'text-red-500' : 'text-orange-400'}`}>
                                            <Clock size={13} />
                                            <span className="text-[9px] font-black uppercase tracking-tighter">Check Out</span>
                                        </div>
                                        <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatDateDisplay(reservation?.check_out_date)}</p>
                                        <div className="flex items-center gap-1 justify-end opacity-50">
                                            <span className={`text-[11px] font-mono font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{formatTime(reservation?.check_out_date)}</span>
                                            <Clock size={11} className={isDark ? 'text-slate-400' : 'text-slate-600'} />
                                        </div>
                                    </div>
                                </div>

                                {/* Guest Info */}
                                <div className={`p-5 rounded-2xl border flex items-center gap-4 ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="w-12 h-12 bg-[#5D7B93]/10 rounded-xl flex items-center justify-center text-[#5D7B93]">
                                        <UserCheck size={22} />
                                    </div>
                                    <div>
                                        <p className={labelClass}>Guest Name</p>
                                        <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{reservation?.guest_name}</p>
                                    </div>
                                    <div className="ml-auto">
                                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black border border-emerald-500/20 uppercase">Active</span>
                                    </div>
                                </div>

                                {/* Payment History */}
                                <div className={`p-6 rounded-[2rem] border space-y-4 ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                        <div className="flex items-center gap-2 text-[#5D7B93]">
                                            <ReceiptText size={18} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Payment History</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] uppercase font-bold text-slate-500">Total Paid</p>
                                            <p className="text-xl font-black text-[#5D7B93]">${totalPaid.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                        {reservation?.payments?.length ? reservation.payments.map((p, i) => (
                                            <div key={i} className={`flex justify-between items-center p-3 rounded-xl ${isDark ? 'bg-black/20' : 'bg-white border border-slate-100'}`}>
                                                <div className="flex flex-col">
                                                    <span className={`font-black uppercase text-[9px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{p.method === 'cash' ? 'Cash' : 'Card'} Payment</span>
                                                    <span className="text-slate-500 text-[10px]">
                                                        {new Date(p.created_at).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                                                    </span>
                                                </div>
                                                <span className="font-mono font-black text-emerald-500">+${Number(p.amount).toLocaleString()}</span>
                                            </div>
                                        )) : (
                                            <p className="text-center text-xs text-slate-500 py-4 italic">No payments found</p>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6">
                                {/* Extend Date */}
                                <div className={`p-6 rounded-[2.5rem] border ${isDark ? 'bg-[#5D7B93]/5 border-[#5D7B93]/20' : 'bg-slate-50 border-slate-200'} space-y-4`}>
                                    <label className={labelClass}>Extend Stay (Until 12:00 PM)</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-4 text-[#5D7B93]" size={18} />
                                        <input
                                            type="date"
                                            className={`${inputClass} pl-12 font-bold`}
                                            value={editForm.check_out_date}
                                            onChange={e => setEditForm(prev => ({ ...prev, check_out_date: e.target.value }))}
                                        />
                                    </div>

                                    {extraChargeInfo && (
                                        <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                                            <div className={`flex items-center justify-between rounded-2xl px-6 py-5 border ${isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                                                <div className="flex items-center gap-3 text-emerald-600">
                                                    <TrendingUp size={22} />
                                                    <div>
                                                        <p className="text-xs font-black uppercase">Extra Duration</p>
                                                        <p className="text-sm font-bold">+{extraChargeInfo.extraDays} Night(s)</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Additional Charge</p>
                                                    <p className="text-2xl font-black text-emerald-600">+${extraChargeInfo.extraCharge}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                {(['cash', 'card'] as const).map(m => (
                                                    <button
                                                        key={m}
                                                        onClick={() => setPaymentMethod(m)}
                                                        className={`flex items-center justify-center gap-3 py-4 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest transition-all
                                                            ${paymentMethod === m
                                                                ? 'bg-[#5D7B93] border-[#5D7B93] text-white shadow-lg shadow-[#5D7B93]/20'
                                                                : isDark ? 'bg-white/5 border-white/5 text-slate-500' : 'bg-white border-slate-200 text-slate-400'}`}
                                                    >
                                                        {m === 'cash' ? <Banknote size={16} /> : <CreditCard size={16} />} {m === 'cash' ? 'Cash' : 'Card'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Room Change */}
                                <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                    <label className={labelClass}>Change Room (Transfer)</label>
                                    <select className={inputClass} value={editForm.room_id} onChange={e => setEditForm(prev => ({ ...prev, room_id: e.target.value }))}>
                                        <option value={room.id}>Stay in Current Room №{room.number}</option>
                                        {availableRooms.map(r => (
                                            <option key={r.id} value={r.id} className="bg-slate-800 text-white">№{r.number} ({r.type}) - ${r.price_per_night}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Buttons */}
                    <div className={`p-8 border-t ${isDark ? 'border-white/5' : 'border-slate-100'} bg-transparent`}>
                        <div className="flex gap-4">
                            {!isEditing ? (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className={`flex-1 py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border transition-all
                                        ${isDark ? 'bg-white/5 border-white/5 text-[#A2B3C1] hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}
                                    >
                                        <Edit3 size={16} /> Edit
                                    </button>
                                    <button
                                        onClick={handleCheckout}
                                        disabled={loading}
                                        className={`flex-[1.5] py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 text-white
                                        ${lateStatus.lateHours > 0 ? 'bg-red-600 shadow-red-500/20' : 'bg-[#5D7B93] shadow-[#5D7B93]/20'}`}
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : <LogOut size={16} />}
                                        {lateStatus.lateHours > 0 ? `Checkout + $${lateStatus.penalty}` : 'Checkout'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className={`flex-1 py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest transition-all
                                        ${isDark ? 'bg-white/5 text-slate-500 hover:bg-white/10' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdate}
                                        disabled={loading}
                                        className="flex-[2] py-5 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] text-white shadow-xl shadow-[#5D7B93]/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                                        style={{ background: 'linear-gradient(135deg, #5D7B93 0%, #A2B3C1 100%)' }}
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                        Save & Update
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}