import React, { useState } from 'react';
import { User, Mail, Shield, Calendar, Save, Camera, Phone, CheckCircle2, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export function ProfilePage() {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        firstName: user?.first_name || 'Botir',
        lastName: user?.last_name || 'Arabboyev',
        email: user?.email || 'botir@example.com',
        phone: '+998 90 123 45 67',
        bio: 'Senior Web Developer & System Administrator'
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsEditing(false);
    };

    const cardBase = isDark
        ? 'bg-slate-900/40 backdrop-blur-xl border-slate-800/50 shadow-2xl'
        : 'bg-white/70 backdrop-blur-xl border-gray-200 shadow-xl';

    const inputBase = `w-full px-4 py-3 rounded-2xl border transition-all duration-300 outline-none focus:ring-4 ${isDark
        ? 'bg-slate-950/50 border-slate-700 text-white focus:border-blue-500 focus:ring-blue-500/10'
        : 'bg-gray-50/50 border-gray-200 text-gray-800 focus:border-blue-500 focus:ring-blue-500/10'
        }`;

    return (
        <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-hidden">
            {/* Background Ornaments */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] -z-10" />

            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Profil Sozlamalari
                        </h2>
                        <p className={`text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Tizimdagi shaxsiy profilingizni boshqaring va yangilang
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-500 bg-blue-500/10 px-4 py-2 rounded-full">
                        <CheckCircle2 size={14} />
                        Hisob faol holatda
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Personal Card */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className={`p-8 rounded-[2.5rem] border ${cardBase} text-center relative overflow-hidden`}>
                            {/* Profile Avatar */}
                            <div className="relative w-40 h-40 mx-auto group">
                                <div className="absolute inset-0 bg-blue-500 rounded-[2rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                <div className="relative w-full h-full rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-indigo-700 p-1">
                                    <div className="w-full h-full rounded-[2.3rem] bg-slate-900 flex items-center justify-center overflow-hidden">
                                        <span className="text-white text-5xl font-black tracking-tighter">
                                            {formData.firstName[0]}{formData.lastName[0]}
                                        </span>
                                    </div>
                                </div>
                                <button className="absolute -bottom-2 -right-2 p-3 bg-white text-blue-600 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all">
                                    <Camera size={20} strokeWidth={2.5} />
                                </button>
                            </div>

                            <div className="mt-8 space-y-2">
                                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {formData.firstName} {formData.lastName}
                                </h3>
                                <p className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                    @{user?.username || 'botir_admin'}
                                </p>
                            </div>

                            <div className="mt-8 grid grid-cols-2 gap-4">
                                <div className={`p-4 rounded-3xl ${isDark ? 'bg-slate-800/40' : 'bg-gray-50'}`}>
                                    <p className="text-[10px] uppercase font-bold text-slate-500">Roli</p>
                                    <p className={`text-sm font-bold mt-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                        {user?.role?.toUpperCase()}
                                    </p>
                                </div>
                                <div className={`p-4 rounded-3xl ${isDark ? 'bg-slate-800/40' : 'bg-gray-50'}`}>
                                    <p className="text-[10px] uppercase font-bold text-slate-500">Kodi</p>
                                    <p className={`text-sm font-bold mt-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                        #ID-{Math.floor(Math.random() * 9000) + 1000}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Card */}
                        <div className={`p-6 rounded-[2rem] border ${cardBase}`}>
                            <h4 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Tezkor ma'lumotlar</h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl"><Globe size={18} /></div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Hudud</p>
                                        <p className="text-sm font-semibold">O'zbekiston, Toshkent</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl"><Calendar size={18} /></div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Ro'yxatdan o'tdi</p>
                                        <p className="text-sm font-semibold">12-Aprel, 2025</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Edit Form */}
                    <div className="lg:col-span-8">
                        <div className={`p-8 md:p-10 rounded-[2.5rem] border ${cardBase} h-full`}>
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/20">
                                        <User size={22} />
                                    </div>
                                    <h4 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Asosiy Ma'lumotlar</h4>
                                </div>
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 transition-all active:scale-95"
                                    >
                                        Tahrirlash
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSave} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Ismingiz</label>
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            disabled={!isEditing}
                                            className={inputBase}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Familiyangiz</label>
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            disabled={!isEditing}
                                            className={inputBase}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                disabled={!isEditing}
                                                className={`${inputBase} pl-12`}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Telefon</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                            <input
                                                type="text"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                disabled={!isEditing}
                                                className={`${inputBase} pl-12`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Bio / Maqomingiz</label>
                                    <textarea
                                        rows={3}
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        disabled={!isEditing}
                                        className={`${inputBase} resize-none`}
                                    />
                                </div>

                                {isEditing && (
                                    <div className="pt-6 flex items-center justify-end gap-4 animate-in fade-in zoom-in duration-300">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className={`px-8 py-3 rounded-2xl font-bold transition-all ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            Bekor qilish
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-10 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl hover:shadow-xl hover:shadow-blue-600/40 transition-all active:scale-95 flex items-center gap-2"
                                        >
                                            <Save size={20} />
                                            O'zgarishlarni Saqlash
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}