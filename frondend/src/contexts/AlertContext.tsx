import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import api from '../services/api'; // Supabase o'rniga bizning API
import { CashDetectionAlert, Incident } from '../types';
import { useAuth } from './AuthContext';

const ALERT_DURATION_MS = 5 * 60 * 1000;
const SIMULATE_INTERVAL_MS = 2 * 60 * 1000;

interface AlertContextType {
  activeAlert: CashDetectionAlert | null;
  timeRemaining: number;
  incidents: Incident[];
  allAlerts: CashDetectionAlert[];
  triggerCashDetection: () => Promise<void>;
  resolveAlert: (alertId: string, reservationId: string) => Promise<void>;
  loadIncidents: () => Promise<void>;
  markInvestigated: (incidentId: string, investigated: boolean) => Promise<void>;
  isAlertActive: boolean;
  timerProgress: number;
}

const AlertContext = createContext<AlertContextType>({
  activeAlert: null,
  timeRemaining: 0,
  incidents: [],
  allAlerts: [],
  triggerCashDetection: async () => { },
  resolveAlert: async () => { },
  loadIncidents: async () => { },
  markInvestigated: async () => { },
  isAlertActive: false,
  timerProgress: 0,
});

export function AlertProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeAlert, setActiveAlert] = useState<CashDetectionAlert | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [allAlerts, setAllAlerts] = useState<CashDetectionAlert[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simulatorRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiryRef = useRef<Date | null>(null);

  const startTimer = useCallback((expiresAt: Date) => {
    expiryRef.current = expiresAt;
    if (timerRef.current) clearInterval(timerRef.current);

    const tick = () => {
      const remaining = Math.max(0, expiryRef.current!.getTime() - Date.now());
      setTimeRemaining(remaining);
      if (remaining === 0 && timerRef.current) clearInterval(timerRef.current);
    };
    tick();
    timerRef.current = setInterval(tick, 500);
  }, []);

  const loadIncidents = useCallback(async () => {
    try {
      const res = await api.get('/incidents/');
      setIncidents(Array.isArray(res.data) ? res.data : (res.data.results || []));
    } catch (e) {
      console.error("Incidents yuklashda xato:", e);
    }
  }, []);

  const flagAlertAsTheft = useCallback(async (alertId: string) => {
    try {
      // Django backendda incident yaratish endpointini chaqiramiz
      await api.post(`/incidents/`, {
        alert_id: alertId,
        video_evidence: 'incidents/default_evidence.mp4' // Backend FileField uchun path
      });

      setActiveAlert(null);
      setTimeRemaining(0);
      loadIncidents();
    } catch (e) {
      console.error("Incident yaratishda xato:", e);
    }
  }, [loadIncidents]);

  const triggerCashDetection = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.post('/incidents/', { // Backendda trigger logikasi
        is_simulated: true
      });
      if (res.data) {
        setActiveAlert(res.data);
        startTimer(new Date(Date.now() + ALERT_DURATION_MS));
      }
    } catch (e) {
      console.error("Triggerda xato:", e);
    }
  }, [user, startTimer]);

  const resolveAlert = useCallback(async (alertId: string, reservationId: string) => {
    try {
      await api.patch(`/incidents/${alertId}/`, {
        is_resolved: true,
        reservation_id: reservationId
      });
      setActiveAlert(null);
      setTimeRemaining(0);
    } catch (e) {
      console.error("Resolve xatosi:", e);
    }
  }, []);

  const markInvestigated = useCallback(async (incidentId: string, investigated: boolean) => {
    try {
      await api.patch(`/incidents/${incidentId}/`, { is_resolved: investigated });
      loadIncidents();
    } catch (e) {
      console.error("Investigate xatosi:", e);
    }
  }, [loadIncidents]);

  useEffect(() => {
    if (!user) return;
    loadIncidents();

    // Simulyatorni to'xtatib turamiz (agar kerak bo'lmasa)
    // simulatorRef.current = setInterval(triggerCashDetection, SIMULATE_INTERVAL_MS);

    return () => {
      if (simulatorRef.current) clearInterval(simulatorRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user, loadIncidents, triggerCashDetection]);

  const timerProgress = activeAlert ? Math.max(0, (timeRemaining / ALERT_DURATION_MS) * 100) : 0;

  return (
    <AlertContext.Provider value={{
      activeAlert,
      timeRemaining,
      incidents,
      allAlerts,
      triggerCashDetection,
      resolveAlert,
      loadIncidents,
      markInvestigated,
      isAlertActive: !!activeAlert,
      timerProgress,
    }}>
      {children}
    </AlertContext.Provider>
  );
}

export const useAlerts = () => useContext(AlertContext);