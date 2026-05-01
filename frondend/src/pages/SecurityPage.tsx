import React, { useState, useEffect } from 'react';
import {
    ShieldAlert,
    ShieldCheck,
    Activity,
    Clock,
    Eye,
    ExternalLink,
    AlertTriangle
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// Ma'lumotlar strukturasi uchun interfeys
interface SecurityAlert {
    id: number;
    created_at: string;
    status: 'Pending' | 'Verified' | 'Theft';
    description?: string;
}

export const SecurityPage: React.FC = () => {
    const { isDark } = useTheme(); // Joriy mavzuni aniqlaymiz
    const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
    const [systemStatus, setSystemStatus] = useState<'Active' | 'Warning'>('Active');

    const fetchAlerts = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/security/alerts/');
            if (!response.ok) throw new Error("Tarmoq xatosi");
            const data = await response.json();
            setAlerts(data);

            const hasTheft = data.some((a: SecurityAlert) => a.status === 'Theft');
            setSystemStatus(hasTheft ? 'Warning' : 'Active');
        } catch (error) {
            console.error("Alertlarni yuklashda xato:", error);
        }
    };

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 5000);
        return () => clearInterval(interval);
    }, []);

    // Dizayn tizimi ranglari (ProfilePage bilan bir xil stil)
    const cardBase = isDark
        ? 'bg-slate-900/40 backdrop-blur-xl border-slate-800/50 shadow-2xl text-white'
        : 'bg-white/70 backdrop-blur-xl border-gray-200 shadow-xl text-slate-900';

    const secondaryCard = isDark
        ? 'bg-slate-950/40 border-white/5'
        : 'bg-gray-50/80 border-gray-200';

    return (
        <div className={`relative min-h-screen lg:min-h-[calc(100vh-4rem)] p-4 sm:p-6 md:p-8 overflow-x-hidden transition-colors duration-300 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>

            {/* Background Ornaments (Profil sahifasidagi kabi) */}
            <div className="absolute top-[-5%] left-[-5%] w-[60%] md:w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[80px] md:blur-[120px] -z-10" />
            <div className="absolute bottom-[-5%] right-[-5%] w-[60%] md:w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[80px] md:blur-[120px] -z-10" />

            {/* 1. Header & Stats Section */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 md:mb-10 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black flex items-center gap-3 tracking-tight">
                        <ShieldAlert
                            className={systemStatus === 'Active' ? "text-emerald-500" : "text-red-500 animate-pulse"}
                            size={32}
                        />
                        AI XAVFSIZLIK MARKAZI
                    </h1>
                    <p className={`text-xs sm:text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Smart Hotel monitoring va tranzaksiyalar nazorati
                    </p>
                </div>

                <div className="flex flex-row gap-3 w-full sm:w-auto">
                    <div className={`flex-1 sm:flex-initial p-3 md:p-4 rounded-2xl border transition-all ${cardBase}`}>
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Tizim Holati</p>
                        <p className={`text-xs md:text-sm font-bold flex items-center gap-2 ${systemStatus === 'Active' ? 'text-emerald-500' : 'text-red-500'}`}>
                            <Activity size={14} /> {systemStatus === 'Active' ? 'Monitoring Faol' : 'XAVF ANIQLANDI'}
                        </p>
                    </div>
                    <div className={`flex-1 sm:flex-initial p-3 md:p-4 rounded-2xl border text-center sm:text-left transition-all ${cardBase}`}>
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Bugungi Alertlar</p>
                        <p className="font-black text-xl md:text-2xl text-blue-500">{alerts.length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* 2. Live Feed (Chap tomonda) */}
                <div className="lg:col-span-8 space-y-6">
                    <div className={`relative aspect-video rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border shadow-2xl group transition-all ${isDark ? 'bg-slate-950 border-white/5' : 'bg-slate-900 border-gray-200'}`}>
                        {/* Kamera oqimi simulyatsiyasi */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                            <div className="text-center">
                                <Eye size={40} className="mx-auto mb-3 text-white opacity-20" />
                                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/50">Kamera oqimi ulanmoqda...</p>
                            </div>
                        </div>

                        {/* UI Overlays */}
                        <div className="absolute top-3 left-3 md:top-6 md:left-6 flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full text-[9px] md:text-xs font-black text-white animate-pulse shadow-lg">
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div> REC LIVE
                        </div>
                        <div className="absolute bottom-3 right-3 md:bottom-6 md:right-6 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-xl text-[9px] md:text-xs font-bold text-white border border-white/10 uppercase tracking-tighter">
                            Kamera #01 - Kassa Paneli
                        </div>
                    </div>

                    {/* Tizim Parametrlari Card */}
                    <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border transition-all ${cardBase}`}>
                        <h3 className={`text-sm md:text-base font-black mb-5 flex items-center gap-2 uppercase tracking-widest ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <ShieldCheck size={18} className="text-emerald-500" /> Tizim Parametrlari
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                            {[
                                { label: 'YOLO Model', val: 'v8n Active' },
                                { label: 'MediaPipe', val: 'Multi-Pose' },
                                { label: 'Datchik', val: 'Hand-to-Hand' },
                                { label: 'Confidence', val: '0.4 Thrld' },
                            ].map((item, i) => (
                                <div key={i} className={`p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all ${secondaryCard}`}>
                                    <p className="text-[8px] md:text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">{item.label}</p>
                                    <p className={`text-[10px] md:text-xs font-bold uppercase ${isDark ? 'text-white' : 'text-slate-800'}`}>{item.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Alert Feed (O'ng tomonda) */}
                <div className="lg:col-span-4">
                    <div className={`rounded-[2rem] md:rounded-[2.5rem] border flex flex-col overflow-hidden max-h-[600px] lg:max-h-[800px] transition-all ${cardBase}`}>
                        <div className={`p-5 md:p-6 border-b bg-white/5 sticky top-0 z-10 ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                            <h2 className="font-black text-xs md:text-sm uppercase tracking-[0.2em] flex items-center justify-between">
                                So'nggi hodisalar
                                <span className="text-[8px] bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-1 rounded-lg uppercase">Live</span>
                            </h2>
                        </div>

                        <div className="overflow-y-auto p-4 md:p-5 space-y-4 scrollbar-hide">
                            {alerts.length === 0 ? (
                                <div className="text-center py-20">
                                    <AlertTriangle className={`mx-auto mb-3 opacity-20 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} size={32} />
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Xabarlar yo'q</p>
                                </div>
                            ) : (
                                alerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className={`p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${alert.status === 'Theft'
                                            ? 'bg-red-500/10 border-red-500/20'
                                            : alert.status === 'Verified'
                                                ? 'bg-emerald-500/10 border-emerald-500/20'
                                                : 'bg-amber-500/10 border-amber-500/20'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-white shadow-sm ${alert.status === 'Theft' ? 'bg-red-500' :
                                                alert.status === 'Verified' ? 'bg-emerald-500' : 'bg-amber-500'
                                                }`}>
                                                {alert.status}
                                            </span>
                                            <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1">
                                                <Clock size={10} /> {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <h4 className={`font-black text-xs md:text-sm uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            Hodisa #{alert.id}
                                        </h4>
                                        <p className={`text-[10px] md:text-xs mt-1 font-medium italic ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {alert.status === 'Theft' ? "⚠️ Shubhali harakat aniqlandi!" : "Oddiy tranzaksiya qayd etildi."}
                                        </p>

                                        <div className="mt-4 flex gap-2">
                                            <button className={`flex-1 text-[9px] md:text-[10px] font-black uppercase tracking-widest py-2 rounded-xl transition-colors flex items-center justify-center gap-2 ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-200/50 hover:bg-gray-200 text-slate-700'}`}>
                                                <Eye size={12} /> Detallar
                                            </button>
                                            <button className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl transition-all shadow-lg shadow-blue-600/20">
                                                <ExternalLink size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SecurityPage;