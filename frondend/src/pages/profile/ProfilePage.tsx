import React, { useState, useEffect, useRef } from 'react';
import {
    User, Mail, Save, Camera, Phone,
    CheckCircle2, Loader2, FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { profileService } from '../../services/api';

export function ProfilePage() {
    const { user } = useAuth();
    const { isDark } = useTheme();

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const API_BASE_URL = 'http://127.0.0.1:8000';

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        bio: '',
        avatar: null as File | string | null,
    });

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            const response = await profileService.getProfile();
            const data = response.data;
            let avatarUrl = data.avatar || null;
            if (avatarUrl && typeof avatarUrl === 'string' && !avatarUrl.startsWith('http')) {
                avatarUrl = `${API_BASE_URL}${avatarUrl}`;
            }
            setFormData({
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                email: data.email || '',
                phone: data.phone || '',
                bio: data.bio || '',
                avatar: avatarUrl,
            });
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProfileData(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setUpdating(true);
            const data = new FormData();
            data.append('first_name', formData.first_name);
            data.append('last_name', formData.last_name);
            data.append('email', formData.email);
            data.append('bio', formData.bio);
            data.append('phone', formData.phone);
            if (formData.avatar instanceof File) data.append('avatar', formData.avatar);
            await profileService.updateProfile(data);
            setIsEditing(false);
            await fetchProfileData();
        } catch (error: any) {
            console.error('Save error:', error.response?.data);
            alert("An error occurred while saving.");
        } finally {
            setUpdating(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData({ ...formData, avatar: file });
            setIsEditing(true);
        }
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex', height: '100vh',
                alignItems: 'center', justifyContent: 'center',
                background: isDark ? '#0f172a' : '#f8fafc',
            }}>
                <Loader2 size={36} color="#5D7B93" style={{ animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const avatarSrc = formData.avatar
        ? (typeof formData.avatar === 'string'
            ? formData.avatar
            : URL.createObjectURL(formData.avatar))
        : null;

    // ── Color tokens from RoomDetailsModal ──
    const pageBg = isDark ? '#0f172a' : '#f8fafc';
    const cardBg = isDark ? '#1e293b' : '#ffffff';
    const cardBdr = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
    const innerBg = isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc';
    const innerBdr = isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9';
    const txt = isDark ? '#ffffff' : '#1e293b';
    const muted = isDark ? '#94a3b8' : '#64748b';
    const inpBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(248,250,252,0.5)';
    const inpBdr = isDark ? 'rgba(255,255,255,0.10)' : '#e2e8f0';

    const inputClass = `w-full px-5 py-3.5 rounded-2xl text-sm border transition-all outline-none
    ${isDark
            ? 'bg-white/5 border-white/10 text-slate-100 focus:border-[#5D7B93] focus:ring-4 focus:ring-[#5D7B93]/10'
            : 'bg-slate-50/50 border-slate-200 text-slate-800 focus:border-[#5D7B93] focus:ring-4 focus:ring-[#5D7B93]/10'
        }`;

    const labelClass = `block text-[10px] font-black mb-2 uppercase tracking-[0.15em] ${isDark ? 'text-slate-400' : 'text-[#5D7B93]'}`;

    return (
        <>
            <style>{`
        .pp * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pp-fi { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

        .pp-page { animation: pp-fi .4s ease; }

        /* avatar hover */
        .pp-av-group { position: relative; }
        .pp-av-overlay {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.45); border-radius: 50%;
          opacity: 0; transition: opacity .22s ease;
          cursor: pointer;
        }
        .pp-av-group:hover .pp-av-overlay { opacity: 1; }

        /* info item hover */
        .pp-info-item { transition: background .18s, border-color .18s; }
        .pp-info-item:hover { border-color: rgba(93,123,147,0.35) !important; }

        /* edit btn hover */
        .pp-edit-btn {
          transition: all .25s cubic-bezier(.34,1.56,.64,1);
        }
        .pp-edit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        }
        .pp-edit-btn:active { transform: none; }

        /* save btn */
        .pp-save-btn { transition: all .28s cubic-bezier(.34,1.56,.64,1); }
        .pp-save-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(93,123,147,0.4) !important; }
        .pp-save-btn:active { transform: none; }
        .pp-save-btn:disabled { opacity: .55; cursor: not-allowed; transform: none !important; }

        /* cancel btn */
        .pp-cancel-btn { transition: background .18s; }

        /* input focus already handled by inputClass focus:ring */

        /* scrollbar */
        .pp-page::-webkit-scrollbar { width: 4px; }
        .pp-page::-webkit-scrollbar-thumb { background: rgba(93,123,147,0.25); border-radius: 99px; }

        @media (max-width: 640px) {
          .pp-hero-row { flex-direction: column !important; align-items: center !important; text-align: center !important; }
          .pp-grid-2 { grid-template-columns: 1fr !important; }
          .pp-view-grid { grid-template-columns: 1fr !important; }
          .pp-hero-text { align-items: center !important; }
        }
      `}</style>

            <div
                className="pp pp-page"
                style={{ background: pageBg, minHeight: '100vh', padding: '32px 16px 60px', overflowY: 'auto', color: txt }}
            >
                <div style={{ maxWidth: 860, margin: '0 auto' }}>

                    {/* ══════════════ CARD ══════════════ */}
                    <div style={{
                        background: cardBg,
                        border: `1px solid ${cardBdr}`,
                        borderRadius: 40,
                        boxShadow: isDark
                            ? '0 32px 80px rgba(0,0,0,0.45)'
                            : '0 8px 40px rgba(93,123,147,0.12)',
                        overflow: 'hidden',
                    }}>

                        {/* ── HERO BANNER ── */}
                        <div style={{
                            background: 'linear-gradient(135deg, #3d5f74 0%, #5D7B93 50%, #7a9ab3 100%)',
                            padding: '44px 40px',
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            {/* decorative bg circles */}
                            <div style={{
                                position: 'absolute', top: -70, right: -70,
                                width: 280, height: 280, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
                            }} />
                            <div style={{
                                position: 'absolute', bottom: -50, left: '35%',
                                width: 180, height: 180, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
                            }} />

                            <div
                                className="pp-hero-row"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, position: 'relative', zIndex: 2 }}
                            >
                                {/* Left: avatar + name */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                                    {/* Avatar */}
                                    <div className="pp-av-group" style={{ flexShrink: 0 }}>
                                        <div style={{
                                            width: 100, height: 100, borderRadius: '50%',
                                            border: '4px solid rgba(255,255,255,0.3)',
                                            overflow: 'hidden',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: 'rgba(255,255,255,0.15)',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                            fontSize: 32, fontWeight: 900, color: '#fff',
                                            letterSpacing: '-.04em',
                                        }}>
                                            {avatarSrc
                                                ? <img
                                                    src={avatarSrc}
                                                    alt="Avatar"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                    onError={e => {
                                                        (e.target as HTMLImageElement).src =
                                                            `https://ui-avatars.com/api/?name=${formData.first_name}+${formData.last_name}&background=5D7B93&color=fff&bold=true`;
                                                    }}
                                                />
                                                : `${formData.first_name?.[0] ?? ''}${formData.last_name?.[0] ?? ''}` || <User size={32} color="rgba(255,255,255,0.7)" />
                                            }
                                        </div>
                                        {/* Camera overlay — always visible on hover */}
                                        <div
                                            className="pp-av-overlay"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Camera size={20} color="#fff" strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageChange}
                                            style={{ display: 'none' }}
                                            accept="image/*"
                                        />
                                    </div>

                                    {/* Name + badge */}
                                    <div className="pp-hero-text" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-.03em', lineHeight: 1.2 }}>
                                            {formData.first_name} {formData.last_name}
                                        </h1>
                                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0, fontWeight: 500 }}>
                                            @{user?.username || 'foydalanuvchi'}
                                        </p>
                                        {/* Active badge — same as RoomDetailsModal pill */}
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 5,
                                            marginTop: 4, width: 'fit-content',
                                            padding: '4px 12px', borderRadius: 999,
                                            background: 'rgba(255,255,255,0.15)',
                                            border: '1px solid rgba(255,255,255,0.25)',
                                            fontSize: 9, fontWeight: 800,
                                            letterSpacing: '.14em', textTransform: 'uppercase',
                                            color: '#fff',
                                        }}>
                                            <CheckCircle2 size={10} strokeWidth={2.5} />
                                            Hisob faol
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Edit button */}
                                {!isEditing && (
                                    <button
                                        className="pp-edit-btn"
                                        onClick={() => setIsEditing(true)}
                                        style={{
                                            padding: '10px 26px', borderRadius: 14, border: 'none',
                                            background: '#fff', color: '#5D7B93',
                                            fontSize: 10, fontWeight: 800,
                                            letterSpacing: '.16em', textTransform: 'uppercase',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                            flexShrink: 0,
                                        }}
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* ── BODY ── */}
                        <div style={{ padding: '32px 40px 36px' }}>

                            {/* Header row for section */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: 'linear-gradient(135deg, #5D7B93, #A2B3C1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 14px rgba(93,123,147,0.32)',
                                    flexShrink: 0,
                                }}>
                                    <User size={17} color="#fff" strokeWidth={2} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 15, fontWeight: 800, margin: 0, letterSpacing: '-.02em', color: txt }}>
                                        Shaxsiy ma'lumotlar
                                    </p>
                                    <p style={{ fontSize: 11, color: muted, margin: '1px 0 0' }}>
                                        {isEditing ? 'Ma\'lumotlaringizni tahrirlang' : 'Hisob ma\'lumotlaringiz'}
                                    </p>
                                </div>
                                {/* small badge like RoomDetailsModal */}
                                <div style={{
                                    marginLeft: 'auto',
                                    padding: '3px 10px', borderRadius: 6,
                                    background: 'rgba(93,123,147,0.1)',
                                    border: '1px solid rgba(93,123,147,0.2)',
                                    fontSize: 9, fontWeight: 800,
                                    letterSpacing: '.12em', textTransform: 'uppercase',
                                    color: '#5D7B93',
                                }}>
                                    {user?.role || 'Staff'}
                                </div>
                            </div>

                            {/* ── VIEW MODE ── */}
                            {!isEditing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {/* Email + Phone grid */}
                                    <div
                                        className="pp-view-grid"
                                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
                                    >
                                        {[
                                            { icon: <Mail size={18} color="#5D7B93" strokeWidth={2} />, label: 'Email Address', value: formData.email },
                                            { icon: <Phone size={18} color="#5D7B93" strokeWidth={2} />, label: 'Phone Number', value: formData.phone || 'Biriktirilmagan' },
                                        ].map(item => (
                                            <div
                                                key={item.label}
                                                className="pp-info-item"
                                                style={{
                                                    display: 'flex', alignItems: 'flex-start', gap: 14,
                                                    padding: '16px 18px', borderRadius: 20,
                                                    background: innerBg, border: `1px solid ${innerBdr}`,
                                                }}
                                            >
                                                <div style={{
                                                    width: 40, height: 40, borderRadius: 12,
                                                    background: 'rgba(93,123,147,0.1)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}>
                                                    {item.icon}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.15em', textTransform: 'uppercase', color: '#5D7B93', marginBottom: 4 }}>
                                                        {item.label}
                                                    </div>
                                                    <div style={{ fontSize: 14, fontWeight: 600, color: txt }}>
                                                        {item.value}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Bio full width */}
                                    <div
                                        className="pp-info-item"
                                        style={{
                                            display: 'flex', alignItems: 'flex-start', gap: 14,
                                            padding: '16px 18px', borderRadius: 20,
                                            background: innerBg, border: `1px solid ${innerBdr}`,
                                        }}
                                    >
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 12,
                                            background: 'rgba(93,123,147,0.1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <FileText size={18} color="#5D7B93" strokeWidth={2} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.15em', textTransform: 'uppercase', color: '#5D7B93', marginBottom: 4 }}>
                                                Biography
                                            </div>
                                            <div style={{ fontSize: 14, fontWeight: 500, color: formData.bio ? txt : muted, fontStyle: formData.bio ? 'normal' : 'italic', lineHeight: 1.6 }}>
                                                {formData.bio || "No biography provided yet."}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            ) : (
                                /* ── EDIT MODE ── */
                                <form onSubmit={handleSave}>
                                    <div
                                        className="pp-grid-2"
                                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}
                                    >
                                        <div>
                                            <label className={labelClass}>Ism</label>
                                            <input
                                                type="text"
                                                className={inputClass}
                                                placeholder="Botir"
                                                value={formData.first_name}
                                                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Familiya</label>
                                            <input
                                                type="text"
                                                className={inputClass}
                                                placeholder="Arabboyev"
                                                value={formData.last_name}
                                                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div
                                        className="pp-grid-2"
                                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}
                                    >
                                        <div>
                                            <label className={labelClass}>Email manzili</label>
                                            <div style={{ position: 'relative' }}>
                                                <Mail
                                                    size={16} color="#A2B3C1" strokeWidth={2}
                                                    style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                                                />
                                                <input
                                                    type="email"
                                                    className={inputClass}
                                                    style={{ paddingLeft: 44 }}
                                                    placeholder="botir@example.com"
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Telefon raqami</label>
                                            <div style={{ position: 'relative' }}>
                                                <Phone
                                                    size={16} color="#A2B3C1" strokeWidth={2}
                                                    style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                                                />
                                                <input
                                                    type="text"
                                                    className={inputClass}
                                                    style={{ paddingLeft: 44 }}
                                                    placeholder="+998 90 000 00 00"
                                                    value={formData.phone}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 28 }}>
                                        <label className={labelClass}>Bio / Ma'lumot</label>
                                        <textarea
                                            rows={3}
                                            className={inputClass}
                                            style={{ resize: 'none' }}
                                            placeholder="O'zingiz haqingizda qisqacha..."
                                            value={formData.bio}
                                            onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                        />
                                    </div>

                                    {/* Action buttons — same style as RoomDetailsModal footer */}
                                    <div style={{
                                        display: 'flex', gap: 12,
                                        paddingTop: 20,
                                        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}`,
                                    }}>
                                        <button
                                            type="button"
                                            className="pp-cancel-btn"
                                            onClick={() => { setIsEditing(false); fetchProfileData(); }}
                                            style={{
                                                flex: 1, padding: '16px 0', borderRadius: 24, border: 'none',
                                                fontSize: 10, fontWeight: 800,
                                                letterSpacing: '.14em', textTransform: 'uppercase',
                                                cursor: 'pointer',
                                                background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                                                color: muted,
                                            }}
                                        >
                                            Bekor qilish
                                        </button>
                                        <button
                                            type="submit"
                                            className="pp-save-btn"
                                            disabled={updating}
                                            style={{
                                                flex: 2, padding: '16px 0', borderRadius: 24, border: 'none',
                                                fontSize: 10, fontWeight: 800,
                                                letterSpacing: '.18em', textTransform: 'uppercase',
                                                cursor: 'pointer',
                                                background: 'linear-gradient(135deg, #5D7B93 0%, #A2B3C1 100%)',
                                                color: '#fff',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                boxShadow: '0 8px 24px rgba(93,123,147,0.3)',
                                            }}
                                        >
                                            {updating
                                                ? <Loader2 size={16} strokeWidth={2.5} style={{ animation: 'spin 1s linear infinite' }} />
                                                : <Save size={16} strokeWidth={2.5} />
                                            }
                                            Saqlash
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}