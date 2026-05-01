import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  ShieldAlert,
  Users,
  Hotel,
  CircleDollarSign,
  LogOut,
  User,
  Sun,
  Moon,
  Globe,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Page } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAlerts } from '../../contexts/AlertContext';
import { profileService } from '../../services/api';   // ← added

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

interface NavItem {
  id: Page;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  badge?: number;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const { isAdmin, user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { incidents } = useAlerts();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Avatar state fetched fresh from profile API ──────────────────
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    profileService.getProfile()
      .then((res) => {
        const data = res.data;

        // Build full avatar URL
        let url: string | null = data.avatar || null;
        if (url && !url.startsWith('http')) {
          url = `${API_BASE_URL}${url.startsWith('/') ? url : '/' + url}`;
        }
        setAvatarUrl(url);

        // Display name
        setDisplayName(data.first_name || data.username || '');
      })
      .catch(() => {
        // fallback — use whatever auth context has
        const raw = user?.avatar || null;
        if (raw && !raw.startsWith('http')) {
          setAvatarUrl(`${API_BASE_URL}${raw.startsWith('/') ? raw : '/' + raw}`);
        } else {
          setAvatarUrl(raw);
        }
        setDisplayName(user?.first_name || user?.username || '');
      });
  }, []);   // runs once on mount; re-runs if page triggers a re-mount after profile save

  // ── Helpers ──────────────────────────────────────────────────────
  const getInitials = () => {
    if (displayName) return displayName[0].toUpperCase();
    return user?.username?.slice(0, 2).toUpperCase() || 'U';
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unresolvedIncidents = incidents ? incidents.filter(i => !i.investigated).length : 0;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Reception', icon: <LayoutGrid size={22} /> },
    { id: 'revenue', label: 'Revenue', icon: <CircleDollarSign size={22} />, adminOnly: true, badge: unresolvedIncidents },
    { id: 'employees', label: 'Staff', icon: <Users size={22} />, adminOnly: true },
    { id: 'security', label: 'Security', icon: <ShieldAlert size={22} />, adminOnly: true },
  ];

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  // ── Style tokens ─────────────────────────────────────────────────
  const bgClass = isDark
    ? 'bg-[#0f172a]/80 backdrop-blur-lg border-white/5'
    : 'bg-white/80 backdrop-blur-lg border-slate-200 shadow-2xl';

  const textMuted = isDark ? 'text-slate-500' : 'text-[#A2B3C1]';

  const activeItemStyle = isDark
    ? 'bg-[#5D7B93]/20 text-white'
    : 'bg-[#5D7B93]/10 text-[#5D7B93]';

  // ── Reusable avatar element ───────────────────────────────────────
  const AvatarCircle = ({ size = 40, border = true }: { size?: number; border?: boolean }) => (
    <div
      style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}
      className={`shadow-lg ${border ? 'border-2 border-[#5D7B93]/30' : ''} bg-slate-200`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Avatar"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => {
            (e.target as HTMLImageElement).src =
              `https://ui-avatars.com/api/?name=${getInitials()}&background=5D7B93&color=fff&bold=true`;
          }}
        />
      ) : (
        <div
          style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#5D7B93,#7a9ab3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: size * 0.32 }}
        >
          {getInitials()}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ══════════════ DESKTOP SIDEBAR ══════════════ */}
      <aside
        className={`
          hidden lg:flex group sticky left-0 top-0 h-screen z-[100] border-r flex-shrink-0
          ${isDark ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-200 shadow-2xl shadow-slate-200/40'}
          w-20 hover:w-72
          transition-[width] duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
          will-change-[width] flex-col overflow-hidden
        `}
        onMouseLeave={() => setIsProfileOpen(false)}
      >
        {/* 1. Logo */}
        <div className="flex items-center gap-4 px-5 py-8 h-24 relative overflow-hidden shrink-0">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-[#5D7B93]/30 z-10"
            style={{ background: 'linear-gradient(135deg, #5D7B93 0%, #7A97AD 100%)' }}
          >
            <Hotel size={22} className="text-white" />
          </div>
          <div className="flex flex-col whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-500 delay-150 translate-x-[-10px] group-hover:translate-x-0">
            <p className={`font-black text-xl tracking-tighter ${isDark ? 'text-white' : 'text-slate-800'}`}>
              HOTEL<span className="text-[#5D7B93]">CRM</span>
            </p>
            <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${textMuted}`}>Management</p>
          </div>
        </div>

        {/* 2. Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-2 mb-2 overflow-hidden shrink-0">
            <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${textMuted} opacity-0 group-hover:opacity-100 transition-all duration-500`}>
              Operations
            </p>
          </div>
          {visibleItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl
                  transition-all duration-300 text-left relative overflow-hidden group/btn
                  ${isActive
                    ? `${activeItemStyle} ring-1 ring-[#5D7B93]/30`
                    : `hover:bg-slate-500/5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`
                  }
                `}
              >
                <span className={`relative z-10 flex-shrink-0 transition-transform duration-500 ${isActive ? 'scale-110 text-[#5D7B93]' : 'group-hover/btn:scale-110'}`}>
                  {item.icon}
                </span>
                <span className="relative z-10 flex-1 text-sm font-bold tracking-tight whitespace-nowrap transition-all duration-500 opacity-0 group-hover:opacity-100 translate-x-[-12px] group-hover:translate-x-0">
                  {item.label}
                </span>
                {item.badge != null && item.badge > 0 && (
                  <span className="relative z-10 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 3. Footer / Profile */}
        <div
          className={`p-3 border-t relative shrink-0 ${isDark ? 'border-white/5' : 'border-slate-100'}`}
          ref={dropdownRef}
        >
          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`absolute bottom-full left-3 right-3 mb-4 rounded-2xl border shadow-2xl py-3 z-[110]
                  ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-gray-100 text-gray-700'}`}
              >
                {/* Mini profile header in dropdown */}
                <div className="flex items-center gap-3 px-4 py-2 mb-2 border-b border-slate-500/10">
                  <AvatarCircle size={36} border={false} />
                  <div className="overflow-hidden">
                    <p className={`text-sm font-black truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {displayName || user?.username}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5D7B93]">
                      {user?.role}
                    </p>
                  </div>
                </div>
                <ProfileMenuItems
                  navigate={navigate}
                  setIsProfileOpen={setIsProfileOpen}
                  toggleTheme={toggleTheme}
                  isDark={isDark}
                  signOut={signOut}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`w-full flex items-center gap-4 p-2 rounded-2xl transition-all
              ${isProfileOpen
                ? (isDark ? 'bg-slate-800' : 'bg-slate-100')
                : 'hover:bg-slate-500/5'
              }`}
          >
            {/* Avatar — always visible (collapsed & expanded) */}
            <AvatarCircle size={40} border={true} />

            {/* Name + role — visible only when expanded */}
            <div className="flex-1 text-left overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-500">
              <p className={`text-sm font-black truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {displayName || user?.username}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-[#5D7B93]">
                {user?.role}
              </p>
            </div>
            <ChevronUp
              size={16}
              className={`text-slate-400 transition-transform duration-500 opacity-0 group-hover:opacity-100 ${isProfileOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </aside>

      {/* ══════════════ MOBILE BOTTOM NAV ══════════════ */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-[100] border-t px-2 pb-safe-area shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] ${bgClass}`}
      >
        <div className="flex items-center justify-around h-16 max-w-md mx-auto">
          {visibleItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center gap-1 flex-1 h-full relative transition-colors
                  ${isActive ? 'text-[#5D7B93]' : 'text-slate-400'}`}
              >
                <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-[#5D7B93]/10 scale-110' : ''}`}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
              </button>
            );
          })}

          {/* Mobile profile button */}
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full
              ${isProfileOpen ? 'text-[#5D7B93]' : 'text-slate-400'}`}
          >
            <div className={`rounded-full transition-all overflow-hidden
              ${isProfileOpen ? 'ring-2 ring-[#5D7B93] scale-110' : 'ring-2 ring-transparent'}`}
            >
              <AvatarCircle size={32} border={false} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter">Profil</span>
          </button>
        </div>

        {/* Mobile profile popup */}
        <AnimatePresence>
          {isProfileOpen && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className={`absolute bottom-[calc(100%+8px)] left-4 right-4 rounded-[2rem] border shadow-2xl py-4 z-[110]
                ${isDark ? 'bg-slate-900 border-white/5 text-slate-300' : 'bg-white border-slate-100 text-slate-700'}`}
            >
              <div className="flex items-center gap-4 px-6 pb-4 border-b border-slate-500/10 mb-2">
                <AvatarCircle size={48} border={false} />
                <div>
                  <p className={`text-sm font-black truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {displayName || user?.username}
                  </p>
                  <p className="text-[10px] font-bold uppercase text-[#5D7B93]">{user?.role}</p>
                </div>
              </div>
              <div className="px-4">
                <ProfileMenuItems
                  navigate={navigate}
                  setIsProfileOpen={setIsProfileOpen}
                  toggleTheme={toggleTheme}
                  isDark={isDark}
                  signOut={signOut}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

function ProfileMenuItems({ navigate, setIsProfileOpen, toggleTheme, isDark, signOut }: any) {
  return (
    <div className="space-y-1 py-1">
      <button
        onClick={() => { navigate('/profile'); setIsProfileOpen(false); }}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl hover:bg-[#5D7B93]/10 transition-all"
      >
        <User size={18} className="text-[#5D7B93]" />
        <span>Mening profilim</span>
      </button>

      <button
        onClick={toggleTheme}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl hover:bg-[#5D7B93]/10 transition-all"
      >
        {isDark
          ? <Sun size={18} className="text-amber-400" />
          : <Moon size={18} className="text-indigo-500" />
        }
        <span>{isDark ? 'Kunduzgi rejim' : 'Tungi rejim'}</span>
      </button>

      <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl hover:bg-[#5D7B93]/10 transition-all">
        <Globe size={18} className="text-emerald-500" />
        <span>O'zbekcha</span>
      </button>

      <div className="h-px bg-slate-500/10 my-2 mx-2" />

      <button
        onClick={signOut}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-black text-red-500 rounded-2xl hover:bg-red-500/10 transition-all"
      >
        <LogOut size={18} />
        <span>Chiqish</span>
      </button>
    </div>
  );
}