import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BedDouble, Plus, Trash2, Save, X, Edit2,
  RefreshCw, Search, DoorOpen, DoorClosed,
  Wifi, WifiOff, CheckCircle2, AlertTriangle,
  Maximize2, ShieldAlert, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLang } from '../contexts/LanguageContext';
import { roomService } from '../services/api';

interface Room {
  id: number;
  number: string;
  status: 'available' | 'occupied' | 'dirty';
  chategory: string;
  price_per_night: string | number;
  tuya_device_id?: string | null;
  door_status?: 'open' | 'closed';
  door_last_updated?: string | null;
  size_room?: number;
}

type ModalMode = 'add' | 'edit' | null;

const STATUS_STYLE = {
  available: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  occupied: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-500' },
  dirty: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500' },
};

const CATEGORIES = ['1-bad', '2-bad', 'suite', 'deluxe', 'standard'];
const ITEMS_PER_PAGE = 8;
const PRIMARY = '#5D7B93';
const PRIMARY_LIGHT = '#7A97AD';
const PRIMARY_BG = 'rgba(93,123,147,0.1)';

// ─── Form Modal ───────────────────────────────────────────────────────────────
function FormModal({ mode, initial, onClose, onSave, isDark }: {
  mode: ModalMode; initial?: Partial<Room>; onClose: () => void;
  onSave: (d: Partial<Room>) => Promise<void>; isDark: boolean;
}) {
  const { t } = useLang();
  const [form, setForm] = useState<Partial<Room>>({
    number: '', status: 'available', chategory: '1-bad',
    price_per_night: 25, size_room: 25, tuya_device_id: '', ...initial,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof Room, v: any) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.number?.trim()) { setError(t('room_number')); return; }
    setSaving(true); setError('');
    try { await onSave(form); onClose(); }
    catch (e: any) { setError(e.response?.data?.detail || e.message || 'Xatolik'); }
    finally { setSaving(false); }
  };

  const inputCls = `w-full px-4 py-3 rounded-xl text-sm border transition-all outline-none
    ${isDark ? 'bg-white/5 border-white/10 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`;
  const labelCls = `block text-[10px] font-black mb-1.5 uppercase tracking-[0.15em]`;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`w-full max-w-lg rounded-[2rem] border overflow-hidden shadow-2xl
        ${isDark ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-200'}`}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex justify-center pt-3 pb-1">
          <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-white/15' : 'bg-slate-200'}`} />
        </div>
        <div className={`px-6 py-5 flex items-center justify-between border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: PRIMARY_BG }}>
              <BedDouble size={18} style={{ color: PRIMARY }} />
            </div>
            <div>
              <p className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {mode === 'add' ? t('add_room') : t('edit_room')}
              </p>
              <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {mode === 'add' ? t('enter_data') : `#${initial?.number}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ color: PRIMARY }}>{t('room_number')}</label>
              <input className={inputCls} value={form.number || ''} onChange={e => set('number', e.target.value)} placeholder="101" />
            </div>
            <div>
              <label className={labelCls} style={{ color: PRIMARY }}>{t('price')}</label>
              <input className={inputCls} type="number" value={form.price_per_night || ''} onChange={e => set('price_per_night', e.target.value)} placeholder="25" />
            </div>
            <div>
              <label className={labelCls} style={{ color: PRIMARY }}>{t('category')}</label>
              <select className={inputCls} style={{ appearance: 'none' }} value={form.chategory || ''} onChange={e => set('chategory', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ color: PRIMARY }}>{t('size')}</label>
              <input className={inputCls} type="number" value={form.size_room || ''} onChange={e => set('size_room', Number(e.target.value))} placeholder="25" />
            </div>
            <div>
              <label className={labelCls} style={{ color: PRIMARY }}>{t('status')}</label>
              <select className={inputCls} style={{ appearance: 'none' }} value={form.status || 'available'} onChange={e => set('status', e.target.value as any)}>
                <option value="available">{t('available')}</option>
                <option value="occupied">{t('occupied')}</option>
                <option value="dirty">{t('dirty')}</option>
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ color: PRIMARY }}>{t('tuya_id')}</label>
              <input className={inputCls} value={form.tuya_device_id || ''} onChange={e => set('tuya_device_id', e.target.value)} placeholder="bf6aecb38b..." />
            </div>
          </div>
          {error && <p className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">⚠ {error}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className={`flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all
              ${isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {t('cancel')}
            </button>
            <button onClick={submit} disabled={saving}
              className="flex-[2] py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)` }}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {mode === 'add' ? t('add') : t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ onCancel, onConfirm, isDark }: { onCancel: () => void; onConfirm: () => void; isDark: boolean }) {
  const { t } = useLang();
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
      <div className={`w-full max-w-sm rounded-[2rem] border p-6 shadow-2xl
        ${isDark ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-4">
          <ShieldAlert size={22} />
        </div>
        <p className={`text-base font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('delete_title')}</p>
        <p className={`text-sm mb-5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('delete_confirm')}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className={`flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all
            ${isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            {t('cancel')}
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-red-600 hover:bg-red-500 transition-all active:scale-95">
            {t('delete')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function TableSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div className="space-y-3 p-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className={`h-14 rounded-2xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function RoomsManagePage() {
  const { isDark } = useTheme();
  const { t } = useLang();
  const queryClient = useQueryClient();

  // ✅ Birinchi yuklanishmi yoki refreshmi
  const isFirstLoad = useRef(true);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modal, setModal] = useState<ModalMode>(null);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: rooms = [], isLoading, isFetching } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomService.getRooms().then(r => r.data as Room[]),
    staleTime: 30_000,
    gcTime: 300_000,
  });

  // ✅ Ma'lumot kelgandan keyin isFirstLoad false ga o'tadi
  useEffect(() => {
    if (!isLoading) isFirstLoad.current = false;
  }, [isLoading]);

  const createMutation = useMutation({
    mutationFn: (f: Partial<Room>) => roomService.createRoom(f),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Room> }) => roomService.updateRoom(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => roomService.deleteRoom(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });

  useEffect(() => { setCurrentPage(1); }, [search, filterStatus]);

  const handleCreate = async (f: Partial<Room>) => { await createMutation.mutateAsync(f); };
  const handleUpdate = async (f: Partial<Room>) => { await updateMutation.mutateAsync({ id: editRoom!.id, data: f }); };
  const handleDelete = async (id: number) => {
    try { await deleteMutation.mutateAsync(id); }
    catch { alert(t('delete_title')); }
    finally { setDeleteId(null); }
  };

  const filtered = rooms.filter(r => {
    const q = search.toLowerCase();
    return (r.number.toLowerCase().includes(q) || r.chategory.toLowerCase().includes(q)) &&
      (filterStatus === 'all' || r.status === filterStatus);
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const stats = {
    total: rooms.length,
    available: rooms.filter(r => r.status === 'available').length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
    dirty: rooms.filter(r => r.status === 'dirty').length,
    sensor: rooms.filter(r => r.tuya_device_id).length,
  };

  const filterOptions = [
    { value: 'all', label: t('all') },
    { value: 'available', label: t('available') },
    { value: 'occupied', label: t('occupied') },
    { value: 'dirty', label: t('dirty') },
  ];

  const cardBg = isDark ? 'bg-slate-900/40 border-white/5 backdrop-blur-md' : 'bg-white border-slate-200 shadow-sm';
  const textPrim = isDark ? 'text-white' : 'text-slate-900';
  const textMut = isDark ? 'text-slate-500' : 'text-slate-400';

  // ✅ Animatsiya faqat birinchi kirishda
  const animStyle = `
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .anim-card { animation: fadeSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
  `;

  const cardClass = (delay: number) =>
    isFirstLoad.current ? `anim-card` : '';
  const cardStyle = (delay: number): React.CSSProperties =>
    isFirstLoad.current ? { animationDelay: `${delay}ms` } : {};

  return (
    <>
      <style>{animStyle}</style>
      <div className="space-y-6 md:space-y-8 pb-10 px-2 sm:px-0 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-4">
          <div className="px-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-6 md:w-2 md:h-8 rounded-full" style={{ background: PRIMARY }} />
              <h1 className={`text-2xl md:text-4xl font-black tracking-tighter ${textPrim}`}>{t('rooms_title')}</h1>
            </div>
            <p className={`${textMut} text-[11px] md:text-sm font-medium ml-4 md:ml-5`}>
              {t('total_rooms')}: {stats.total} · {t('available')}: {stats.available}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['rooms'] })}
              className={`group flex items-center gap-2 px-5 py-3 rounded-xl md:rounded-2xl font-bold text-sm transition-all active:scale-95 border
                ${isDark ? 'border-white/10 hover:bg-white/5 text-slate-400' : 'border-slate-200 hover:bg-slate-50 text-slate-500'}`}>
              <RefreshCw size={16} className={`transition-transform duration-500 ${isFetching ? 'animate-spin' : 'group-active:rotate-180'}`} />
              {t('refresh')}
            </button>
            <button onClick={() => { setEditRoom(null); setModal('add'); }}
              className="group flex items-center gap-2 px-5 py-3 rounded-xl md:rounded-2xl font-bold text-sm text-white transition-all active:scale-95"
              style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, boxShadow: `0 8px 24px ${PRIMARY}50` }}>
              <Plus size={16} />
              {t('new_room')}
            </button>
          </div>
        </div>

        {/* Stats — faqat birinchi kirishda animatsiya */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 px-2 sm:px-0">
          {[
            { label: t('total_rooms'), value: stats.total, icon: <BedDouble size={20} />, color: PRIMARY, bgColor: PRIMARY_BG },
            { label: t('available'), value: stats.available, icon: <CheckCircle2 size={20} />, color: '#22c55e', bgColor: 'rgba(34,197,94,0.1)' },
            { label: t('occupied'), value: stats.occupied, icon: <AlertTriangle size={20} />, color: '#ef4444', bgColor: 'rgba(239,68,68,0.1)' },
            { label: t('dirty'), value: stats.dirty, icon: <RefreshCw size={20} />, color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)' },
            { label: t('sensor_connected'), value: stats.sensor, icon: <Wifi size={20} />, color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.1)' },
          ].map((s, i) => (
            <div
              key={i}
              className={`${cardClass(i * 80)} p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border transition-all hover:-translate-y-1 ${cardBg}`}
              style={cardStyle(i * 80)}
            >
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center mb-3"
                style={{ background: s.bgColor, color: s.color }}>
                {s.icon}
              </div>
              <p className="text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest">{s.label}</p>
              <h2 className={`text-xl md:text-2xl font-black mt-1 ${textPrim}`}>{s.value}</h2>
            </div>
          ))}
        </div>

        {/* Table Card */}
        <div className={`rounded-[1.5rem] md:rounded-[2.5rem] border overflow-hidden mx-2 sm:mx-0 ${cardBg}`}>

          {/* Table Header */}
          <div className={`p-5 md:p-7 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4
            ${isDark ? 'border-white/5 bg-white/[0.01]' : 'border-slate-100 bg-slate-50/50'}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: PRIMARY_BG }}>
                <BedDouble size={18} style={{ color: PRIMARY }} />
              </div>
              <h3 className={`font-black text-xs md:text-sm uppercase tracking-widest ${textPrim}`}>{t('rooms_list')}</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border
                ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                <Search size={14} className="text-slate-500" />
                <input type="text" placeholder={t('search_room')} value={search} onChange={e => setSearch(e.target.value)}
                  className="bg-transparent text-xs font-bold outline-none text-slate-400 w-32 md:w-40" />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-0.5">
                {filterOptions.map(f => (
                  <button key={f.value} onClick={() => setFilterStatus(f.value)}
                    className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all"
                    style={filterStatus === f.value
                      ? { background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: '#fff' }
                      : { background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', color: isDark ? '#94a3b8' : '#64748b' }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table yoki Skeleton */}
          {isLoading ? <TableSkeleton isDark={isDark} /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className={isDark ? 'bg-white/5' : 'bg-slate-50'}>
                    {['#', t('rooms_list'), t('category'), t('price'), t('size'), t('status'), t('door_open'), ''].map((h, i) => (
                      <th key={i} className={`px-5 md:px-7 py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 ${i === 7 ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                  {paginated.map((room) => {
                    const ss = STATUS_STYLE[room.status] || STATUS_STYLE.available;
                    const isOpen = room.door_status === 'open';
                    return (
                      <tr key={room.id} className={`transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/80'}`}>
                        <td className="px-5 md:px-7 py-4 md:py-5">
                          <span className="text-[10px] font-bold text-slate-500">{room.id}</span>
                        </td>
                        <td className="px-5 md:px-7 py-4 md:py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: PRIMARY_BG }}>
                              <BedDouble size={15} style={{ color: PRIMARY }} />
                            </div>
                            <div>
                              <p className={`text-sm font-black ${textPrim}`}>{room.number}</p>
                              {room.tuya_device_id && (
                                <p className="text-[9px] font-bold text-violet-500 flex items-center gap-1">
                                  <Wifi size={8} />{room.tuya_device_id.slice(0, 12)}…
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 md:px-7 py-4 md:py-5">
                          <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{room.chategory}</span>
                        </td>
                        <td className="px-5 md:px-7 py-4 md:py-5">
                          <span className={`text-sm font-black ${textPrim}`}>${Number(room.price_per_night).toFixed(0)}</span>
                          <span className="text-[9px] text-slate-500 font-bold italic"> /k</span>
                        </td>
                        <td className="px-5 md:px-7 py-4 md:py-5">
                          <span className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            <Maximize2 size={10} />{room.size_room || 25}m²
                          </span>
                        </td>
                        <td className="px-5 md:px-7 py-4 md:py-5">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-1.5 ${ss.color} ${ss.bg} ${ss.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />
                            {room.status === 'available' ? t('available') : room.status === 'occupied' ? t('occupied') : t('dirty')}
                          </span>
                        </td>
                        <td className="px-5 md:px-7 py-4 md:py-5">
                          {room.tuya_device_id ? (
                            <span className={`text-xs font-bold flex items-center gap-1.5 ${isOpen ? 'text-red-500' : 'text-emerald-500'}`}>
                              {isOpen ? <DoorOpen size={13} /> : <DoorClosed size={13} />}
                              {isOpen ? t('door_open') : t('door_closed')}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500 flex items-center gap-1"><WifiOff size={11} /> —</span>
                          )}
                        </td>
                        <td className="px-5 md:px-7 py-4 md:py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => { setEditRoom(room); setModal('edit'); }}
                              className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => setDeleteId(room.id)}
                              className="p-2 rounded-xl hover:bg-red-500/10 text-red-500 transition-all">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="py-16 text-center">
              <BedDouble className="mx-auto opacity-20 mb-3" size={36} />
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">{t('not_found')}</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className={`p-4 md:p-6 border-t flex items-center justify-center gap-2
              ${isDark ? 'border-white/5 bg-white/[0.01]' : 'border-slate-100 bg-slate-50/50'}`}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className={`p-2 rounded-xl border transition-all ${currentPage === 1 ? 'opacity-20 cursor-not-allowed' : ''}
                  ${isDark ? 'border-white/10 text-white' : 'border-slate-200 text-slate-900'}`}>
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none px-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)}
                    className={`min-w-[36px] h-9 rounded-xl text-[10px] font-black transition-all flex-shrink-0
                      ${currentPage === i + 1 ? 'text-white shadow-lg'
                        : `hover:bg-white/5 border ${isDark ? 'border-white/5 text-slate-400' : 'border-slate-200 text-slate-500'}`}`}
                    style={currentPage === i + 1
                      ? { background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, boxShadow: `0 4px 12px ${PRIMARY}40` }
                      : {}}>
                    {i + 1}
                  </button>
                ))}
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className={`p-2 rounded-xl border transition-all ${currentPage === totalPages ? 'opacity-20 cursor-not-allowed' : ''}
                  ${isDark ? 'border-white/10 text-white' : 'border-slate-200 text-slate-900'}`}>
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {modal && (
          <FormModal mode={modal} initial={editRoom || undefined}
            onClose={() => { setModal(null); setEditRoom(null); }}
            onSave={modal === 'add' ? handleCreate : handleUpdate}
            isDark={isDark} />
        )}
        {deleteId !== null && (
          <DeleteConfirm onCancel={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId!)} isDark={isDark} />
        )}
      </div>
    </>
  );
}