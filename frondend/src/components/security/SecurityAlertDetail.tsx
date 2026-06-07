import React from 'react';
import {
    X, Clock, ShieldAlert, CheckCircle2,
    AlertTriangle, Play, Calendar, Hash, Info, ExternalLink
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface SecurityAlert {
    id: number;
    status: 'pending' | 'verified' | 'theft';
    video_clip: string | null;
    detected_at: string;
}

interface DetailProps {
    alert: SecurityAlert;
    onClose: () => void;
}

// ✅ Telegram group linki
const TELEGRAM_GROUP_URL = 'https://t.me/+OgVR8UsTmbFiZDky'; // <- group invite link qo'ying

export function SecurityAlertDetail({ alert, onClose }: DetailProps) {
    const { isDark } = useTheme();

    const getVideoUrl = (clip: string | null): string | null => {
        if (!clip) return null;
        if (clip.startsWith('http')) return clip;
        return null; // file_id — Telegram da ko'rish
    };

    const videoUrl = getVideoUrl(alert.video_clip);
    const hasVideo = !!alert.video_clip;

    const getStatusConfig = (s: string) => {
        switch (s) {
            case 'verified': return {
                color: 'text-emerald-500', bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/20',
                icon: <CheckCircle2 size={18} />, label: 'Verified',
            };
            case 'theft': return {
                color: 'text-red-500', bg: 'bg-red-500/10',
                border: 'border-red-500/20',
                icon: <AlertTriangle size={18} />, label: 'Theft Detected',
            };
            default: return {
                color: 'text-blue-500', bg: 'bg-blue-500/10',
                border: 'border-blue-500/20',
                icon: <Clock size={18} />, label: 'Under Investigation',
            };
        }
    };

    const config = getStatusConfig(alert.status);
    const cardBg = isDark
        ? 'bg-slate-900/95 backdrop-blur-2xl border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)]'
        : 'bg-white border-slate-200 shadow-2xl';

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
            <div className={`relative w-full max-w-4xl overflow-hidden rounded-[3rem] border animate-in zoom-in-95 duration-300 ${cardBg}`}>

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-7 border-b border-slate-500/10">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${config.bg} ${config.color} shadow-inner`}>
                            <ShieldAlert size={26} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className={`text-2xl font-black tracking-tight italic ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                ALERT EVIDENCE
                            </h3>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                                AI Neural Network Investigation
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className={`p-3 rounded-2xl transition-all active:scale-90 ${isDark ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                        <X size={22} />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12">

                    {/* Video */}
                    <div className="lg:col-span-7 p-6 bg-black/20 flex items-center justify-center min-h-[350px] border-r border-slate-500/10">
                        {videoUrl ? (
                            <div className="relative w-full aspect-video rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 bg-black">
                                <video key={alert.id} src={videoUrl} controls autoPlay className="w-full h-full object-contain" />
                            </div>
                        ) : hasVideo ? (
                            // ✅ file_id bor — Telegram grupada ko'rish
                            <div className="flex flex-col items-center gap-6 text-slate-500">
                                <div className="p-8 rounded-full bg-blue-500/10 border border-blue-500/20">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.68 7.92c-.12.56-.44.7-.88.44l-2.44-1.8-1.18 1.14c-.13.13-.24.24-.5.24l.18-2.5 4.56-4.12c.2-.18-.04-.28-.3-.1L7.74 14.6l-2.4-.75c-.52-.16-.53-.52.11-.77l9.38-3.62c.43-.16.81.1.81.34z" fill="#2BA0D8" />
                                    </svg>
                                </div>
                                <div className="text-center space-y-3">
                                    <p className="text-sm font-black uppercase tracking-widest text-blue-400">
                                        Video in Telegram Group
                                    </p>
                                    <p className="text-[11px] text-slate-500 max-w-[220px] leading-relaxed">
                                        Video sent to <b>Sofahotel Hotel Security Group</b> Go to group to view.
                                    </p>
                                    <button
                                        onClick={() => window.open(TELEGRAM_GROUP_URL, '_blank')}
                                        className="flex items-center gap-2 px-6 py-3 bg-[#2BA0D8] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#229ac8] transition-all mx-auto"
                                    >
                                        <ExternalLink size={14} />
                                        Go to telegram group
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-slate-500">
                                <div className="p-6 rounded-full bg-slate-500/5 border border-slate-500/10">
                                    <Play size={40} className="opacity-20" />
                                </div>
                                <p className="text-xs font-black uppercase tracking-widest opacity-40">No Video Evidence Available</p>
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="lg:col-span-5 p-8 md:p-10 space-y-8">
                        <div className={`p-6 rounded-[2rem] border ${config.bg} ${config.border} space-y-3 shadow-sm`}>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                                <Info size={14} /> Case Status
                            </div>
                            <div className={`flex items-center gap-3 text-xl font-black italic uppercase ${config.color}`}>
                                {config.icon} {config.label}
                            </div>
                        </div>

                        <div className="space-y-5">
                            {[
                                { icon: <Hash size={20} className="text-[#5D7B93]" />, label: 'Case Identifier', value: `#ALRT-${alert.id}` },
                                {
                                    icon: <Calendar size={20} className="text-[#5D7B93]" />, label: 'Detection Date',
                                    value: new Date(alert.detected_at).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })
                                },
                                {
                                    icon: <Clock size={20} className="text-[#5D7B93]" />, label: 'Event Timestamp',
                                    value: new Date(alert.detected_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-5">
                                    <div className={`p-3.5 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                        {item.icon}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.label}</p>
                                        <p className={`text-base font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={`p-5 rounded-2xl border text-[11px] font-medium leading-relaxed
                            ${isDark ? 'bg-white/5 border-white/5 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                            <strong className="text-blue-500 uppercase tracking-widest text-[9px] block mb-1">AI Diagnostics:</strong>
                            The available status door was opened and an alert was created.
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-gradient-to-r from-[#5D7B93] to-[#7A97AD] text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#5D7B93]/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            Close Investigation
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}