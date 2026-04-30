import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { useAlerts } from '../../contexts/AlertContext';

function formatTime(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function AlertBanner() {
  const { isAlertActive, activeAlert, timeRemaining, timerProgress } = useAlerts();

  if (!isAlertActive || !activeAlert) return null;

  const isUrgent = timeRemaining < 60000;
  const isCritical = timeRemaining < 30000;

  return (
    <div className={`relative overflow-hidden transition-all ${
      isCritical
        ? 'bg-red-950/80 border-b border-red-500/40'
        : isUrgent
          ? 'bg-amber-950/80 border-b border-amber-500/40'
          : 'bg-amber-950/60 border-b border-amber-600/30'
    }`}>
      <div
        className={`absolute bottom-0 left-0 h-0.5 transition-all duration-500 ${
          isCritical ? 'bg-red-500' : 'bg-amber-500'
        }`}
        style={{ width: `${timerProgress}%` }}
      />

      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
            isCritical ? 'bg-red-500/20' : 'bg-amber-500/20'
          }`}>
            <AlertTriangle
              size={16}
              className={`${isCritical ? 'text-red-400 animate-ping' : 'text-amber-400 animate-pulse'}`}
            />
          </div>

          <div>
            <p className={`text-sm font-semibold ${isCritical ? 'text-red-300' : 'text-amber-300'}`}>
              CAUTION: Cash Detected at Front Desk
            </p>
            <p className={`text-xs ${isCritical ? 'text-red-400/70' : 'text-amber-400/70'}`}>
              {isCritical
                ? 'CRITICAL — Logging as potential theft incident in moments'
                : isUrgent
                  ? 'Urgently complete a guest check-in to resolve this alert'
                  : 'Complete a guest check-in within the time limit to resolve this alert'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono ${
            isCritical
              ? 'bg-red-500/15 border-red-500/30 text-red-300'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
          }`}>
            <Clock size={14} className={isCritical ? 'animate-pulse' : ''} />
            <span className="text-lg font-bold tracking-widest">
              {formatTime(timeRemaining)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-amber-400/60">
            <CheckCircle size={12} />
            <span>Check-in to resolve</span>
          </div>
        </div>
      </div>
    </div>
  );
}
