import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    ShieldAlert, ShieldCheck, Activity, Clock,
    Eye, ExternalLink, AlertTriangle, Camera,
    ChevronDown, Wifi, RefreshCw, Info
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { SecurityAlertDetail } from '../components/security/SecurityAlertDetail';
import api from '../services/api';

const PRIMARY = '#5D7B93';
const PRIMARY_LIGHT = '#7A97AD';
const PRIMARY_BG = 'rgba(93,123,147,0.1)';
const PRIMARY_BORDER = 'rgba(93,123,147,0.2)';

const CAMERA_WEBRTC_BASE = 'http://100.94.22.47:8889';

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
    webrtcUrl: string;
    location: string;
}

const CAMERAS: CameraConfig[] = [
    {
        id: 'camera',
        name: 'Camera #1',
        webrtcUrl: `${CAMERA_WEBRTC_BASE}/camera`,
        location: 'Reception',
    },
    // {
    //   id: 'camera2',
    //   name: 'Camera #2',
    //   webrtcUrl: `${CAMERA_WEBRTC_BASE}/camera2`,
    //   location: 'Corridor',
    // },
];

// ─── WebRTC Player ────────────────────────────────────────────────────────────
function WebRTCPlayer({ camera }: { camera: CameraConfig }) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    return (
        <div className="relative w-full h-full bg-black">
            <iframe
                ref={iframeRef}
                src={camera.webrtcUrl}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen"
                title={camera.name}
            />
            {/* REC LIVE badge */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-2 bg-red-600 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[8px] sm:text-[9px] font-black text-white animate-pulse shadow-lg pointer-events-none">
                <div className="w-1.5 h-1.5 bg-white rounded-full" /> REC LIVE
            </div>
            {/* Tailscale badge */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[8px] sm:text-[9px] font-black pointer-events-none"
                style={{ background: PRIMARY_BG, color: PRIMARY, border: `1px solid ${PRIMARY_BORDER}` }}>
                <Wifi size={9} />
                Tailscale VPN
            </div>
            {/* Camera label */}
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-black/60 backdrop-blur-xl px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[8px] sm:text-[9px] font-bold text-white border border-white/10 uppercase tracking-tighter pointer-events-none">
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
                <Camera size={14} style={{ color: PRIMARY }} />
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
                            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition-all text-left`}
                            style={selected.id === cam.id
                                ? { color: PRIMARY, background: PRIMARY_BG }
                                : {}}
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
    const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
    const [selectedCam, setSelectedCam] = useState<CameraConfig>(CAMERAS[0]);

    const { data: allAlerts = [], isLoading, isFetching } = useQuery({
        queryKey: ['security-alerts'],
        queryFn: () => api.get('/security/alerts/').then(r => r.data),
        staleTime: 5_000,
        refetchInterval: 5_000,
    });

    // Faqat bugungi alertlar
    const today = new Date().toDateString();
    const alerts = allAlerts.filter((a: SecurityAlert) =>
        new Date(a.detected_at).toDateString() === today
    );

    const systemStatus = alerts.some((a: SecurityAlert) => a.status === 'theft') ? 'Warning' : 'Active';

    const cardBg = isDark ? 'bg-slate-900/40 border-white/5 backdrop-blur-md' : 'bg-white border-slate-200 shadow-sm';
    const textPrim = isDark ? 'text-white' : 'text-slate-900';
    const textMut = isDark ? 'text-slate-500' : 'text-slate-400';

    return (
        <div className={`relative min-h-screen p-4 sm:p-6 md:p-8 overflow-x-hidden transition-colors duration-300
            ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>

            <div className="absolute top-[-5%] left-[-5%] w-[60%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-[-5%] right-[-5%] w-[60%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] -z-10" />

            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 md:mb-10 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="px-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-1.5 h-6 md:w-2 md:h-8 rounded-full" style={{ background: PRIMARY }} />
                        <h1 className={`text-2xl md:text-4xl font-black tracking-tighter flex items-center gap-3 ${textPrim}`}>
                            <ShieldAlert
                                size={28}
                                className={systemStatus === 'Active' ? 'text-emerald-500' : 'text-red-500 animate-pulse'}
                            />
                            AI SECURITY CENTER
                        </h1>
                    </div>
                    <p className={`${textMut} text-[11px] md:text-sm font-medium ml-4 md:ml-5`}>
                        Smart Hotel monitoring & door sensor control
                    </p>
                </div>

                <div className="flex flex-row gap-3 w-full sm:w-auto">
                    {/* System Status */}
                    <div className={`flex-1 sm:flex-initial p-3 md:p-4 rounded-[1.5rem] border ${cardBg}`}>
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">System Status</p>
                        <p className={`text-xs md:text-sm font-bold flex items-center gap-2
                            ${systemStatus === 'Active' ? 'text-emerald-500' : 'text-red-500'}`}>
                            <Activity size={14} />
                            {systemStatus === 'Active' ? 'Monitoring Active' : 'THREAT DETECTED'}
                        </p>
                    </div>
                    {/* Today's Alerts */}
                    <div className={`flex-1 sm:flex-initial p-3 md:p-4 rounded-[1.5rem] border ${cardBg}`}>
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Today's Alerts</p>
                        <div className="flex items-center gap-2">
                            <p className="font-black text-xl md:text-2xl" style={{ color: PRIMARY }}>{alerts.length}</p>
                            {isFetching && <RefreshCw size={12} className="text-slate-400 animate-spin" />}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* Live Feed */}
                <div className="lg:col-span-8 space-y-4 md:space-y-6">

                    {/* Camera player */}
                    <div className={`relative rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border shadow-2xl
                        ${isDark ? 'bg-slate-950 border-white/5' : 'bg-slate-900 border-slate-200'}`}>
                        {CAMERAS.length > 1 && (
                            <div className="absolute top-4 left-4 z-20">
                                <CameraSelector selected={selectedCam} onSelect={setSelectedCam} />
                            </div>
                        )}
                        <div className="aspect-video">
                            <WebRTCPlayer key={selectedCam.id} camera={selectedCam} />
                        </div>
                    </div>

                    {/* Tailscale info */}
                    <div className={`flex items-start gap-3 p-4 rounded-2xl border`}
                        style={{ background: PRIMARY_BG, borderColor: PRIMARY_BORDER }}>
                        <Info size={15} style={{ color: PRIMARY }} className="mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: PRIMARY }}>
                                Tailscale VPN Required
                            </p>
                            <p className="text-[11px] font-medium leading-relaxed" style={{ color: PRIMARY }}>
                                To view live camera feed, install <strong>Tailscale</strong> on your device and sign in with the hotel account. Available on iOS, Android, Windows & Mac.
                            </p>
                        </div>
                    </div>

                    {/* System Parameters */}
                    <div className={`p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border ${cardBg}`}>
                        <h3 className={`text-xs md:text-sm font-black mb-4 md:mb-5 flex items-center gap-2 uppercase tracking-widest ${textPrim}`}>
                            <ShieldCheck size={18} className="text-emerald-500" /> System Parameters
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                            {[
                                { label: 'Gateway', val: 'Tuya Zigbee' },
                                { label: 'Door Sensor', val: 'Tuya PIR' },
                                { label: 'Camera', val: 'Hikvision IP' },
                                { label: 'Streaming', val: 'WebRTC Live' },
                            ].map((item, i) => (
                                <div key={i} className={`p-3 md:p-4 rounded-xl md:rounded-2xl border
                                    ${isDark ? 'bg-slate-950/40 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                    <p className="text-[8px] md:text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">{item.label}</p>
                                    <p className={`text-[10px] md:text-xs font-bold uppercase ${textPrim}`}>{item.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Alert Feed */}
                <div className="lg:col-span-4">
                    <div className={`rounded-[1.5rem] md:rounded-[2.5rem] border flex flex-col overflow-hidden max-h-[500px] sm:max-h-[600px] lg:max-h-[800px] ${cardBg}`}>
                        <div className={`p-5 md:p-6 border-b sticky top-0 z-10
                            ${isDark ? 'border-white/5 bg-slate-900/80' : 'border-slate-100 bg-white/80'} backdrop-blur-md`}>
                            <h2 className={`font-black text-xs md:text-sm uppercase tracking-[0.2em] flex items-center justify-between ${textPrim}`}>
                                Recent Incidents
                                <span className="text-[8px] px-2 py-1 rounded-lg uppercase font-black"
                                    style={{ background: PRIMARY_BG, color: PRIMARY, border: `1px solid ${PRIMARY_BORDER}` }}>
                                    Live
                                </span>
                            </h2>
                        </div>

                        <div className="overflow-y-auto p-3 md:p-5 space-y-3 md:space-y-4 scrollbar-hide">
                            {isLoading ? (
                                <div className="text-center py-20">
                                    <RefreshCw className="mx-auto mb-3 animate-spin" size={28} style={{ color: PRIMARY }} />
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Loading...</p>
                                </div>
                            ) : alerts.length === 0 ? (
                                <div className="text-center py-20">
                                    <AlertTriangle className="mx-auto mb-3 opacity-20" size={32} style={{ color: PRIMARY }} />
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No incidents today</p>
                                </div>
                            ) : (
                                alerts.map((alert: SecurityAlert) => (
                                    <div
                                        key={alert.id}
                                        className={`p-3 md:p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] cursor-pointer
                                            ${alert.status === 'theft'
                                                ? 'bg-red-500/10 border-red-500/20'
                                                : alert.status === 'verified'
                                                    ? 'bg-emerald-500/10 border-emerald-500/20'
                                                    : 'border'}`}
                                        style={alert.status === 'pending' ? { background: PRIMARY_BG, borderColor: PRIMARY_BORDER } : {}}
                                        onClick={() => setSelectedAlert(alert)}
                                    >
                                        <div className="flex justify-between items-center mb-2 md:mb-3">
                                            {/* Status dot */}
                                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${alert.status === 'theft' ? 'bg-red-500' :
                                                    alert.status === 'verified' ? 'bg-emerald-500' : 'animate-pulse'
                                                }`}
                                                style={alert.status === 'pending' ? { background: PRIMARY } : {}} />
                                            <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1">
                                                <Clock size={10} />
                                                {new Date(alert.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <h4 className={`font-black text-xs md:text-sm uppercase tracking-tight ${textPrim}`}>
                                            Incident #{alert.id}
                                            {alert.room && (
                                                <span className="ml-1" style={{ color: PRIMARY }}>
                                                    — Room {alert.room.number}
                                                </span>
                                            )}
                                        </h4>

                                        {alert.risk_score != null && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className={`flex-1 h-1 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                                                    <div
                                                        className={`h-1 rounded-full transition-all ${alert.risk_score >= 70 ? 'bg-red-500' :
                                                                alert.risk_score >= 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                        style={{ width: `${alert.risk_score}%` }}
                                                    />
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-500">Risk: {alert.risk_score}</span>
                                            </div>
                                        )}

                                        <p className={`text-[10px] md:text-xs mt-1.5 md:mt-2 font-medium italic ${textMut}`}>
                                            {alert.status === 'theft'
                                                ? '⚠️ Suspicious activity detected!'
                                                : alert.status === 'verified'
                                                    ? '✅ Verified — normal activity'
                                                    : '🔍 Under investigation...'}
                                        </p>

                                        <div className="mt-2 md:mt-3 flex gap-2">
                                            <button
                                                onClick={e => { e.stopPropagation(); setSelectedAlert(alert); }}
                                                className={`flex-1 text-[9px] font-black uppercase tracking-widest py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5
                                                    ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                                            >
                                                <Eye size={11} /> Details
                                            </button>
                                            {alert.video_clip && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); window.open(alert.video_clip!, '_blank'); }}
                                                    className="text-white p-2 rounded-xl transition-all shadow-lg"
                                                    style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)` }}
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