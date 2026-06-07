import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BedDouble } from 'lucide-react';
import {
  LayoutGrid, ShieldAlert, Hotel, CircleDollarSign,
  LogOut, User, Sun, Moon, Globe, ChevronUp, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Page } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAlerts } from '../../contexts/AlertContext';
import { profileService } from '../../services/api';
import { useLang, Lang } from '../../contexts/LanguageContext';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

interface NavItem {
  id: Page;
  labelKey: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  badge?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

const LANG_OPTIONS: { value: Lang; label: string; flag: string }[] = [
  { value: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
];

// ✅ AvatarCircle — Sidebar TASHQARISIDA aniqlangan
// Shuning uchun har render da qayta mount bo'lmaydi
interface AvatarCircleProps {
  avatarUrl: string | null;
  initials: string;
  size?: number;
  border?: boolean;
}

function AvatarCircle({ avatarUrl, initials, size = 40, border = true }: AvatarCircleProps) {
  return (
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
              `https://ui-avatars.com/api/?name=${initials}&background=5D7B93&color=fff&bold=true`;
          }}
        />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(135deg,#5D7B93,#7a9ab3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 900, fontSize: size * 0.32,
        }}>
          {initials}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const { isAdmin, user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { incidents } = useAlerts();
  const { lang, setLang, t } = useLang();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  // ✅ Bug 1: Avatar React Query bilan — har page o'tishda refresh yo'q
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile().then(r => r.data),
    staleTime: 5 * 60_000,  // 5 daqiqa cache
    gcTime: 30 * 60_000,
  });

  const avatarUrl = (() => {
    const raw = profileData?.avatar || user?.avatar || null;
    if (!raw) return null;
    if (raw.startsWith('http')) return raw;
    return `${API_BASE_URL}${raw.startsWith('/') ? raw : '/' + raw}`;
  })();

  const displayName = profileData?.first_name || user?.first_name || user?.username || '';

  const initials = displayName
    ? displayName[0].toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() || 'U';

  // ✅ Bug 2 & 3: Outside click — desktop va mobil alohida
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const inDesktop = desktopDropdownRef.current?.contains(target);
      const inMobile = mobileDropdownRef.current?.contains(target);
      if (!inDesktop && !inMobile) {
        setIsProfileOpen(false);
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unresolvedIncidents = incidents?.filter(i => !i.investigated).length ?? 0;

  const navItems: NavItem[] = [
    { id: 'dashboard', labelKey: 'nav_reception', icon: <LayoutGrid size={22} /> },
    { id: 'revenue', labelKey: 'nav_revenue', icon: <CircleDollarSign size={22} />, adminOnly: true },
    { id: 'rooms', labelKey: 'nav_rooms', icon: <BedDouble size={22} />, adminOnly: true },
    { id: 'security', labelKey: 'nav_security', icon: <ShieldAlert size={22} />, adminOnly: true, badge: unresolvedIncidents },
  ];

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const bgClass = isDark
    ? 'bg-[#0f172a]/80 backdrop-blur-lg border-white/5'
    : 'bg-white/80 backdrop-blur-lg border-slate-200 shadow-2xl';
  const textMuted = isDark ? 'text-slate-500' : 'text-[#A2B3C1]';
  const activeItemStyle = isDark
    ? 'bg-[#5D7B93]/20 text-white'
    : 'bg-[#5D7B93]/10 text-[#5D7B93]';

  // AvatarCircle endi tashqarida aniqlangan — qayta mount bo'lmaydi

  // ✅ ProfileMenuItems — inline component sifatida, props orqali emas
  const ProfileMenuContent = () => {
    const currentLang = LANG_OPTIONS.find(l => l.value === lang);
    return (
      <div className="space-y-1 py-1">
        {/* Profil */}
        <button
          onClick={() => { navigate('/profile'); setIsProfileOpen(false); }}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl hover:bg-[#5D7B93]/10 transition-all"
        >
          <User size={18} className="text-[#5D7B93]" />
          <span>{t('my_profile')}</span>
        </button>

        {/* ✅ Bug 2: Tema — to'g'ridan toggleTheme chaqiradi */}
        <button
          onClick={() => { toggleTheme(); }}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl hover:bg-[#5D7B93]/10 transition-all"
        >
          {isDark
            ? <Sun size={18} className="text-amber-400" />
            : <Moon size={18} className="text-indigo-500" />
          }
          <span>{isDark ? t('theme_light') : t('theme_dark')}</span>
        </button>

        {/* ✅ Bug 3: Til — to'g'ridan setLang chaqiradi */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setIsLangOpen(p => !p); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl hover:bg-[#5D7B93]/10 transition-all"
          >
            <span className="text-lg">{currentLang?.flag}</span>
            <span>{t('language')}</span>
            <span className="ml-auto text-xs font-black text-[#5D7B93] uppercase">{lang}</span>
          </button>

          <AnimatePresence>
            {isLangOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                className={`absolute bottom-full left-0 mb-1 w-48 rounded-2xl border shadow-2xl py-2 z-[200]
                  ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}
              >
                {LANG_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={(e) => { e.stopPropagation(); setLang(opt.value); setIsLangOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold transition-all
                      ${lang === opt.value
                        ? 'text-[#5D7B93] bg-[#5D7B93]/10'
                        : isDark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span className="text-lg">{opt.flag}</span>
                    <span>{opt.label}</span>
                    {lang === opt.value && <Check size={14} className="ml-auto text-[#5D7B93]" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-px bg-slate-500/10 my-2 mx-2" />

        {/* Chiqish */}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-black text-red-500 rounded-2xl hover:bg-red-500/10 transition-all"
        >
          <LogOut size={18} />
          <span>{t('logout')}</span>
        </button>
      </div>
    );
  };

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
        onMouseLeave={() => { setIsProfileOpen(false); setIsLangOpen(false); }}
      >
        {/* Logo */}
        <div className="flex items-center gap-4 px-5 py-8 h-24 relative overflow-hidden shrink-0">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-[#5D7B93]/30 z-10"
            style={{ background: 'linear-gradient(135deg, #5D7B93 0%, #7A97AD 100%)' }}
          >
            <Hotel size={22} className="text-white" />
          </div>
          <div className="flex flex-col whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-500 delay-150 translate-x-[-10px] group-hover:translate-x-0">
            <p className={`font-black text-xl tracking-tighter ${isDark ? 'text-white' : 'text-slate-800'}`}>
              SofaHotel<span className="text-[#5D7B93]">CRM</span>
            </p>
            <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${textMuted}`}>Management</p>
          </div>
        </div>

        {/* Nav */}
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
                  {t(item.labelKey as any)}
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

        {/* Profile footer */}
        <div
          className={`p-3 border-t relative shrink-0 ${isDark ? 'border-white/5' : 'border-slate-100'}`}
          ref={desktopDropdownRef}
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
                <div className="flex items-center gap-3 px-4 py-2 mb-2 border-b border-slate-500/10">
                  <AvatarCircle avatarUrl={avatarUrl} initials={initials} size={36} border={false} />
                  <div className="overflow-hidden">
                    <p className={`text-sm font-black truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {displayName || user?.username}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5D7B93]">
                      {user?.role}
                    </p>
                  </div>
                </div>
                <ProfileMenuContent />
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
            <AvatarCircle avatarUrl={avatarUrl} initials={initials} size={40} border={true} />
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
        ref={mobileDropdownRef}
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
                <span className="text-[9px] font-bold uppercase tracking-tighter">{t(item.labelKey as any)}</span>
              </button>
            );
          })}

          {/* Mobile profile button */}
          <button
            onClick={() => { setIsProfileOpen(!isProfileOpen); setIsLangOpen(false); }}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full
              ${isProfileOpen ? 'text-[#5D7B93]' : 'text-slate-400'}`}
          >
            <div className={`rounded-full transition-all overflow-hidden
              ${isProfileOpen ? 'ring-2 ring-[#5D7B93] scale-110' : 'ring-2 ring-transparent'}`}
            >
              <AvatarCircle avatarUrl={avatarUrl} initials={initials} size={32} border={false} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-tighter">{t('nav_profile')}</span>
          </button>
        </div>

        {/* ✅ Mobile profile popup — z-index yuqori, to'g'ri ishlaydi */}
        <AnimatePresence>
          {isProfileOpen && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className={`absolute bottom-[calc(100%+8px)] left-4 right-4 rounded-[2rem] border shadow-2xl py-4 z-[150]
                ${isDark ? 'bg-slate-900 border-white/5 text-slate-300' : 'bg-white border-slate-100 text-slate-700'}`}
            >
              <div className="flex items-center gap-4 px-6 pb-4 border-b border-slate-500/10 mb-2">
                <AvatarCircle avatarUrl={avatarUrl} initials={initials} size={48} border={false} />
                <div>
                  <p className={`text-sm font-black truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {displayName || user?.username}
                  </p>
                  <p className="text-[10px] font-bold uppercase text-[#5D7B93]">{user?.role}</p>
                </div>
              </div>
              <div className="px-4">
                <ProfileMenuContent />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}