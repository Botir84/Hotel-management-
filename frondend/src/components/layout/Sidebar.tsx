import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  ShieldAlert,
  Users,
  Hotel,
  ChevronRight,
  Settings,
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

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const { isAdmin, user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { incidents } = useAlerts();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tashqariga bosilganda profil dropdownni yopish
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
    { id: 'dashboard', label: 'Reception Desk', icon: <LayoutGrid size={22} /> },
    { id: 'revenue', label: 'Revenue Panel', icon: <CircleDollarSign size={22} />, adminOnly: true, badge: unresolvedIncidents },
    { id: 'employees', label: 'Staff Directory', icon: <Users size={22} />, adminOnly: true },
    { id: 'security', label: 'Security Lab', icon: <ShieldAlert size={22} />, adminOnly: true },
  ];

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const getInitials = () => {
    if (user?.first_name) return user.first_name[0].toUpperCase();
    return user?.username?.slice(0, 2).toUpperCase() || 'U';
  };

  const bgClass = isDark
    ? 'bg-[#0f172a] border-white/5'
    : 'bg-white border-slate-200 shadow-2xl shadow-slate-200/40';

  const textMuted = isDark ? 'text-slate-500' : 'text-[#A2B3C1]';
  const activeItemStyle = isDark
    ? 'bg-[#5D7B93]/20 text-white'
    : 'bg-[#5D7B93]/10 text-[#5D7B93]';

  return (
    <aside
      className={`
        group sticky left-0 top-0 h-screen z-[100] border-r flex-shrink-0
        ${bgClass}
        w-20 hover:w-72
        transition-[width] duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
        will-change-[width]
      `}
      // Sidebar yopilganda dropdown ham yopilishi uchun
      onMouseLeave={() => setIsProfileOpen(false)}
    >
      <div className="flex flex-col h-full overflow-hidden">

        {/* 1. Logo Section */}
        <div className="flex items-center gap-4 px-5 py-8 h-24 relative overflow-hidden">
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

        {/* Operations Label */}
        <div className="px-7 py-2 h-10 overflow-hidden">
          <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${textMuted} opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 translate-x-[-5px] group-hover:translate-x-0`}>
            Operations
          </p>
        </div>

        {/* 2. Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5">
          {visibleItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl
                  transition-all duration-300 text-left relative overflow-hidden group/btn
                  ${isActive ? `${activeItemStyle} ring-1 ring-[#5D7B93]/30` : `hover:bg-slate-500/5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 bg-[#5D7B93]/10 z-0"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                <span className={`relative z-10 flex-shrink-0 transition-transform duration-500 ${isActive ? 'scale-110 text-[#5D7B93]' : 'group-hover/btn:scale-110'}`}>
                  {item.icon}
                </span>

                <span className={`
                  relative z-10 flex-1 text-sm font-bold tracking-tight whitespace-nowrap
                  transition-all duration-500 delay-75
                  opacity-0 group-hover:opacity-100 translate-x-[-12px] group-hover:translate-x-0
                `}>
                  {item.label}
                </span>

                {item.badge != null && item.badge > 0 && (
                  <span className="relative z-10 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-sm shadow-red-500/50">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 3. Footer Section (Profile & Settings) */}
        <div className={`p-3 border-t relative ${isDark ? 'border-white/5' : 'border-slate-100'}`} ref={dropdownRef}>

          {/* Profile Dropdown Menu */}
          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className={`absolute bottom-full left-3 right-3 mb-4 rounded-2xl border shadow-2xl py-3 z-50 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-gray-100 text-gray-700'}`}
              >
                <div className="px-4 py-3 border-b border-slate-800/50 mb-2">
                  <p className="text-xs font-black uppercase tracking-wider opacity-50">Authorized User</p>
                  <p className="text-sm font-bold truncate mt-1">{user?.username}</p>
                </div>

                <div className="px-2 space-y-1">
                  <button
                    onClick={() => { navigate('/profile'); setIsProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-[#5D7B93] hover:text-white transition-all"
                  >
                    <User size={18} /> Mening profilim
                  </button>

                  <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-[#5D7B93] hover:text-white transition-all">
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    <span>{isDark ? "Kunduzgi rejim" : "Tungi rejim"}</span>
                  </button>

                  <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-[#5D7B93] hover:text-white transition-all">
                    <Globe size={18} /> O'zbekcha
                  </button>
                </div>

                <div className="h-px bg-slate-800/50 my-2 mx-2" />

                <div className="px-2">
                  <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-black text-red-500 rounded-xl hover:bg-red-500/10 transition-all">
                    <LogOut size={18} /> Chiqish
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Profile Trigger Button */}
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`
              w-full flex items-center gap-4 p-2 rounded-2xl transition-all duration-300
              ${isProfileOpen ? (isDark ? 'bg-slate-800' : 'bg-slate-100') : 'hover:bg-slate-500/5'}
            `}
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-[#5D7B93] flex items-center justify-center text-white text-xs font-black shadow-lg">
                {getInitials()}
              </div>
              {/* Notification dot for mobile/collapsed view */}
              {unresolvedIncidents > 0 && !isProfileOpen && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
              )}
            </div>

            <div className="flex-1 text-left overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-500 delay-75 translate-x-[-10px] group-hover:translate-x-0">
              <p className={`text-sm font-black truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {user?.first_name || user?.username}
              </p>
              <p className={`text-[10px] font-bold uppercase tracking-widest opacity-60 ${textMuted}`}>
                {user?.role}
              </p>
            </div>

            <ChevronUp
              size={16}
              className={`text-slate-400 transition-all duration-500 opacity-0 group-hover:opacity-100 ${isProfileOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

      </div>
    </aside>
  );
}