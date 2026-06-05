import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ShieldAlert, ShieldCheck, Activity, Clock,
    Eye, ExternalLink, AlertTriangle, Camera,
    ChevronDown, Wifi, WifiOff, RefreshCw
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { SecurityAlertDetail } from '../components/security/SecurityAlertDetail';
import api from '../services/api';

const CAMERA_BASE_URL = 'https://camera.sofahotel.uz';

interface SecurityAlert {
    id: number;
    detected_at: string;
    status: 'pending' | 'verified' | 'theft';
    video_clip: string | null;
    room?: { number: string } | null;
    risk_score?: number;
}

interface CameraConfig {
    id: string;
    name: string;
    hlsUrl: string;
    location: string;
}

// Kameralar ro'yxati — keyinroq ko'paytiriladi
const CAMERAS: CameraConfig[] = [
    {
        id: 'camera',
        name: 'Kamera #1',
        hlsUrl: `${CAMERA_BASE_URL}/hls/camera/index.m3u8`,
        location: 'Resepshn',
    },
    // Yangi kamera qo'shilganda shu yerga qo'shing:
    // {
    //   id: 'camera2',
    //   name: 'Kamera #2',
    //   hlsUrl: `${CAMERA_BASE_URL}/hls/camera2/index.m3u8`,
    //   location: 'Koridor',
    // },
];

// ─── HLS Video Player ──────────────────────────────────────────────────────────
function HLSPlayer({ camera }: { camera: CameraConfig }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [online, setOnline] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        setLoading(true);
        setOnline(false);

        // Native HLS (Safari) yoki hls.js ishlatamiz
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = camera.hlsUrl;
            video.addEventListener('loadeddata', () => { setOnline(true); setLoading(false); });
            video.addEventListener('error', () => { setOnline(false); setLoading(false); });
            video.play().catch(() => { });
        } else {
            // hls.js (Chrome, Firefox)
            import('https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js' as any)
                .then((module: any) => {
                    const Hls = module.default;
                    if (Hls.isSupported()) {
                        const hls = new Hls({ lowLatencyMode: true });
                        hls.loadSource(camera.hlsUrl);
                        hls.attachMedia(video);
                        hls.on(Hls.Events.MANIFEST_PARSED, () => {
                            setOnline(true);
                            setLoading(false);
                            video.play().catch(() => { });
                        });
                        hls.on(Hls.Events.ERROR, () => {
                            setOnline(false);
                            setLoading(false);
                        });
                        return () => hls.destroy();
                    }
                })
                .catch(() => { setOnline(false); setLoading(false); });
        }
    }, [camera.hlsUrl]);

    return (
        <div className="relative w-full h-full bg-black">
            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                autoPlay
                playsInline
            />

            {/* Loading */}
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                    <RefreshCw size={32} className="text-white/40 animate-spin mb-3" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                        Ulanmoqda...
                    </p>
                </div>
            )}

            {/* Offline */}
            {!loading && !online && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                    <WifiOff size={40} className="text-white/20 mb-3" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                        Kamera offline
                    </p>
                    <p className="text-[9px] text-white/20 mt-1">
                        mediamtx ishga tushirilganmi?
                    </p>
                </div>
            )}

            {/* REC badge */}
            {online && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full text-[9px] font-black text-white animate-pulse shadow-lg">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" /> REC LIVE
                </div>
            )}

            {/* Online badge */}
            <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black
                ${online ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {online ? <Wifi size={10} /> : <WifiOff size={10} />}
                {online ? 'Online' : 'Offline'}
            </div>

            {/* Camera name */}
            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-xl text-[9px] font-bold text-white border border-white/10 uppercase tracking-tighter">
                {camera.name} — {camera.location}
            </div>
        </div>
    );
}

// ─── Camera Selector ──────────────────────────────────────────────────────────
function CameraSelector({ selected, onSelect }: { selected: CameraConfig; onSelect: (c: CameraConfig) => void }) {
    const { isDark } = useTheme();
    const [open, setOpen] = useState(false);

    if (CAMERAS.length <= 1) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all
                    ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
            >
                <Camera size={14} className="text-[#5D7B93]" />
                {selected.name} — {selected.location}
                <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className={`absolute top-full left-0 mt-2 w-56 rounded-2xl border shadow-2xl py-2 z-50
                    ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
                    {CAMERAS.map(cam => (
                        <button
                            key={cam.id}
                            onClick={() => { onSelect(cam); setOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition-all text-left
                                ${selected.id === cam.id
                                    ? 'text-[#5D7B93] bg-[#5D7B93]/10'
                                    : isDark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Camera size={13} />
                            <div>
                                <div>{cam.name}</div>
                                <div className="text-[9px] opacity-60 font-normal">{cam.location}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export const SecurityPage: React.FC = () => {
    const { isDark } = useTheme();
    const queryClient = useQueryClient();
    const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
    const [selectedCam, setSelectedCam] = useState<CameraConfig>(CAMERAS[0]);

    // ✅ React Query — alerts cache
    const { data: alerts = [], isLoading, isFetching } = useQuery({
        queryKey: ['security-alerts'],
        queryFn: () => api.get('/security/alerts/').then(r => r.data),
        staleTime: 5_000,
        refetchInterval: 5_000,  // 5 soniyada yangilanadi
    });

    const systemStatus = alerts.some((a: SecurityAlert) => a.status === 'theft') ? 'Warning' : 'Active';

    const cardBase = isDark
        ? 'bg-slate-900/40 backdrop-blur-xl border-slate-800/50 shadow-2xl text-white'
        : 'bg-white/70 backdrop-blur-xl border-gray-200 shadow-xl text-slate-900';

    const secondaryCard = isDark
        ? 'bg-slate-950/40 border-white/5'
        : 'bg-gray-50/80 border-gray-200';

    return (
        <div className={`relative min-h-screen p-4 sm:p-6 md:p-8 overflow-x-hidden transition-colors duration-300
            ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>

            {/* Background */}
            <div className="absolute top-[-5%] left-[-5%] w-[60%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-[-5%] right-[-5%] w-[60%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] -z-10" />

            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 md:mb-10 gap-6
                animate-in fade-in slide-in-from-top-4 duration-500">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black flex items-center gap-3 tracking-tight">
                        <ShieldAlert
                            className={systemStatus === 'Active' ? 'text-emerald-500' : 'text-red-500 animate-pulse'}
                            size={32}
                        />
                        AI XAVFSIZLIK MARKAZI
                    </h1>
                    <p className={`text-xs sm:text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Smart Hotel monitoring va tranzaksiyalar nazorati
                    </p>
                </div>

                <div className="flex flex-row gap-3 w-full sm:w-auto">
                    <div className={`flex-1 sm:flex-initial p-3 md:p-4 rounded-2xl border ${cardBase}`}>
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Tizim Holati</p>
                        <p className={`text-xs md:text-sm font-bold flex items-center gap-2
                            ${systemStatus === 'Active' ? 'text-emerald-500' : 'text-red-500'}`}>
                            <Activity size={14} />
                            {systemStatus === 'Active' ? 'Monitoring Faol' : 'XAVF ANIQLANDI'}
                        </p>
                    </div>
                    <div className={`flex-1 sm:flex-initial p-3 md:p-4 rounded-2xl border text-center sm:text-left ${cardBase}`}>
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Bugungi Alertlar</p>
                        <div className="flex items-center gap-2">
                            <p className="font-black text-xl md:text-2xl text-blue-500">{alerts.length}</p>
                            {isFetching && <RefreshCw size={12} className="text-slate-400 animate-spin" />}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* Live Feed */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Camera selector + player */}
                    <div className={`relative rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border shadow-2xl
                        ${isDark ? 'bg-slate-950 border-white/5' : 'bg-slate-900 border-gray-200'}`}>

                        {/* Kamera tanlash */}
                        {CAMERAS.length > 1 && (
                            <div className="absolute top-4 left-4 z-20">
                                <CameraSelector selected={selectedCam} onSelect={setSelectedCam} />
                            </div>
                        )}

                        {/* Video */}
                        <div className="aspect-video">
                            <HLSPlayer key={selectedCam.id} camera={selectedCam} />
                        </div>
                    </div>

                    {/* Tizim parametrlari */}
                    <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border ${cardBase}`}>
                        <h3 className={`text-sm md:text-base font-black mb-5 flex items-center gap-2 uppercase tracking-widest
                            ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <ShieldCheck size={18} className="text-emerald-500" /> Tizim Parametrlari
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                            {[
                                { label: 'YOLO Model', val: 'v8n Active' },
                                { label: 'MediaPipe', val: 'Multi-Pose' },
                                { label: 'Datchik', val: 'Hand-to-Hand' },
                                { label: 'Confidence', val: '0.4 Thrld' },
                            ].map((item, i) => (
                                <div key={i} className={`p-3 md:p-4 rounded-xl md:rounded-2xl border ${secondaryCard}`}>
                                    <p className="text-[8px] md:text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">{item.label}</p>
                                    <p className={`text-[10px] md:text-xs font-bold uppercase ${isDark ? 'text-white' : 'text-slate-800'}`}>{item.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Alert Feed */}
                <div className="lg:col-span-4">
                    <div className={`rounded-[2rem] md:rounded-[2.5rem] border flex flex-col overflow-hidden
                        max-h-[600px] lg:max-h-[800px] ${cardBase}`}>
                        <div className={`p-5 md:p-6 border-b bg-white/5 sticky top-0 z-10
                            ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                            <h2 className="font-black text-xs md:text-sm uppercase tracking-[0.2em] flex items-center justify-between">
                                So'nggi hodisalar
                                <span className="text-[8px] bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-1 rounded-lg uppercase">
                                    Live
                                </span>
                            </h2>
                        </div>

                        <div className="overflow-y-auto p-4 md:p-5 space-y-4 scrollbar-hide">
                            {isLoading ? (
                                <div className="text-center py-20">
                                    <RefreshCw className="mx-auto mb-3 text-slate-500 animate-spin" size={28} />
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Yuklanmoqda...</p>
                                </div>
                            ) : alerts.length === 0 ? (
                                <div className="text-center py-20">
                                    <AlertTriangle className={`mx-auto mb-3 opacity-20 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} size={32} />
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Xabarlar yo'q</p>
                                </div>
                            ) : (
                                alerts.map((alert: SecurityAlert) => (
                                    <div
                                        key={alert.id}
                                        className={`p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] cursor-pointer
                                            ${alert.status === 'theft'
                                                ? 'bg-red-500/10 border-red-500/20'
                                                : alert.status === 'verified'
                                                    ? 'bg-emerald-500/10 border-emerald-500/20'
                                                    : 'bg-amber-500/10 border-amber-500/20'
                                            }`}
                                        onClick={() => setSelectedAlert(alert)}
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-white shadow-sm
                                                ${alert.status === 'theft' ? 'bg-red-500' :
                                                    alert.status === 'verified' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                                                {alert.status}
                                            </span>
                                            <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1">
                                                <Clock size={10} />
                                                {new Date(alert.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <h4 className={`font-black text-xs md:text-sm uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            Hodisa #{alert.id}
                                            {alert.room && <span className="text-[#5D7B93] ml-1">— Xona {alert.room.number}</span>}
                                        </h4>

                                        {alert.risk_score != null && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="flex-1 h-1 rounded-full bg-white/10">
                                                    <div
                                                        className={`h-1 rounded-full ${alert.risk_score >= 70 ? 'bg-red-500' : alert.risk_score >= 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                        style={{ width: `${alert.risk_score}%` }}
                                                    />
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-500">Risk: {alert.risk_score}</span>
                                            </div>
                                        )}

                                        <p className={`text-[10px] md:text-xs mt-2 font-medium italic ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {alert.status === 'theft'
                                                ? '⚠️ Shubhali harakat aniqlandi!'
                                                : alert.status === 'verified'
                                                    ? '✅ Tekshirildi — normal holat'
                                                    : '🔍 Tekshirilmoqda...'}
                                        </p>

                                        <div className="mt-3 flex gap-2">
                                            <button
                                                onClick={e => { e.stopPropagation(); setSelectedAlert(alert); }}
                                                className={`flex-1 text-[9px] font-black uppercase tracking-widest py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5
                                                    ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-200/50 hover:bg-gray-200 text-slate-700'}`}
                                            >
                                                <Eye size={11} /> Detallar
                                            </button>
                                            {alert.video_clip && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); window.open(alert.video_clip!, '_blank'); }}
                                                    className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl transition-all shadow-lg shadow-blue-600/20"
                                                >
                                                    <ExternalLink size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {selectedAlert && (
                <SecurityAlertDetail
                    alert={selectedAlert}
                    onClose={() => setSelectedAlert(null)}
                />
            )}
        </div>
    );
};

export default SecurityPage;