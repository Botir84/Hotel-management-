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

// Ma'lumotlar strukturasi uchun interfeys
interface SecurityAlert {
    id: number;
    created_at: string;
    status: 'Pending' | 'Verified' | 'Theft';
    description?: string;
}

// DIQQAT: 'export' so'zi qo'shildi, endi App.tsx buni ko'radi
export const SecurityPage: React.FC = () => {
    const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
    const [systemStatus, setSystemStatus] = useState<'Active' | 'Warning'>('Active');

    // Backenddan alertlarni olish (Polling mantiqi)
    const fetchAlerts = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/security/alerts/');
            if (!response.ok) throw new Error("Tarmoq xatosi");
            const data = await response.json();
            setAlerts(data);

            // Agar 'Theft' statusli yangi alert bo'lsa, tizim statusini o'zgartirish
            const hasTheft = data.some((a: SecurityAlert) => a.status === 'Theft');
            setSystemStatus(hasTheft ? 'Warning' : 'Active');
        } catch (error) {
            console.error("Alertlarni yuklashda xato:", error);
        }
    };

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 5000); // Har 5 soniyada yangilash
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 md:p-8">

            {/* 1. Header & Stats Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <ShieldAlert className={systemStatus === 'Active' ? "text-emerald-500" : "text-red-500 animate-pulse"} size={36} />
                        AI Xavfsizlik Markazi
                    </h1>
                    <p className="text-slate-400 mt-1">Smart Hotel monitoring va tranzaksiyalar nazorati</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Tizim Holati</p>
                        <p className={`font-bold flex items-center gap-2 ${systemStatus === 'Active' ? 'text-emerald-400' : 'text-red-400'}`}>
                            <Activity size={16} /> {systemStatus === 'Active' ? 'Monitoring Faol' : 'XAVF ANIQLANDI'}
                        </p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Bugungi Alertlar</p>
                        <p className="font-bold text-2xl">{alerts.length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* 2. Live Feed (Chap tomonda katta blok) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-700 group">
                        {/* Kamera oqimi simulyatsiyasi */}
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 text-slate-500">
                            <div className="text-center">
                                <Eye size={48} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Kamera oqimi ulanmoqda...</p>
                            </div>
                        </div>

                        {/* UI Overlays */}
                        <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                            <div className="w-2 h-2 bg-white rounded-full"></div> REC LIVE
                        </div>
                        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg text-xs text-slate-300 border border-white/10">
                            Kamera #01 - Kassa (Admin Paneli)
                        </div>
                    </div>

                    <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <ShieldCheck size={20} className="text-emerald-400" /> Tizim Parametrlari
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                <p className="text-slate-400">YOLO Model</p>
                                <p className="font-medium">v8n Active</p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                <p className="text-slate-400">MediaPipe</p>
                                <p className="font-medium">Multi-Pose (2)</p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                <p className="text-slate-400">Datchik</p>
                                <p className="font-medium">Hand-to-Hand</p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                <p className="text-slate-400">Confidence</p>
                                <p className="font-medium">0.4 Threshold</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Alert Feed (O'ng tomonda ro'yxat) */}
                <div className="lg:col-span-1 flex flex-col h-full max-h-[700px]">
                    <div className="bg-slate-800/50 rounded-2xl border border-slate-700 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-700 bg-slate-800/80 sticky top-0">
                            <h2 className="font-bold flex items-center justify-between">
                                So'nggi hodisalar
                                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase">Real-time</span>
                            </h2>
                        </div>

                        <div className="overflow-y-auto p-4 space-y-4">
                            {alerts.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">Hozircha xabarlar yo'q</div>
                            ) : (
                                alerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${alert.status === 'Theft'
                                            ? 'bg-red-500/10 border-red-500/30'
                                            : alert.status === 'Verified'
                                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                                : 'bg-amber-500/10 border-amber-500/30'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${alert.status === 'Theft' ? 'bg-red-500 text-white' :
                                                alert.status === 'Verified' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                                                }`}>
                                                {alert.status}
                                            </span>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <Clock size={10} /> {new Date(alert.created_at).toLocaleTimeString()}
                                            </span>
                                        </div>

                                        <h4 className="font-semibold text-sm">Hodisa #{alert.id}</h4>
                                        <p className="text-xs text-slate-400 mt-1 italic">
                                            {alert.status === 'Theft' ? "⚠️ Shubhali pul uzatish aniqlandi!" : "Pul uzatish qayd etildi."}
                                        </p>

                                        <div className="mt-4 flex gap-2">
                                            <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-[10px] py-1.5 rounded flex items-center justify-center gap-1">
                                                <Eye size={12} /> Detallar
                                            </button>
                                            <button className="bg-blue-600 hover:bg-blue-500 text-[10px] py-1.5 px-3 rounded">
                                                <ExternalLink size={12} />
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

// Bu ham qo'shimcha xavfsizlik uchun (Import qulay bo'lishi uchun)
export default SecurityPage;