import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Navigatsiyani import qilamiz
import {
  Menu, Sun, Moon, LogOut, Bell, Zap,
  User, Settings, ChevronDown, Globe
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAlerts } from '../../contexts/AlertContext';
import { Page } from '../../types';

interface HeaderProps {
  currentPage: Page;
  onToggleSidebar: () => void;
}

export function Header({ currentPage, onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate(); // 2. Navigatsiya funksiyasini chaqiramiz
  const auth = useAuth();
  const theme = useTheme();
  const alerts = useAlerts();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!auth || !theme || !alerts) return null;

  const { user, signOut } = auth;
  const { isDark, toggleTheme } = theme;
  const { incidents } = alerts;

  const getInitials = () => {
    if (user?.first_name) return user.first_name[0].toUpperCase();
    return user?.username?.slice(0, 2).toUpperCase() || 'U';
  };

  const bgClass = isDark ? 'bg-slate-950/80 border-slate-800/60' : 'bg-white/80 border-gray-200';

  return (
    <header className={`h-16 flex items-center justify-between px-6 border-b backdrop-blur-md sticky top-0 z-30 ${bgClass}`}>
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>
          <Menu size={18} />
        </button>
        <h1 className={`font-semibold text-sm ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
          {currentPage?.toUpperCase()}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button className={`p-2 rounded-lg ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-100'}`}>
            <Bell size={18} />
            {incidents.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-transparent" />
            )}
          </button>
        </div>

        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center gap-2 p-1 rounded-xl transition-all ${isProfileOpen ? (isDark ? 'bg-slate-800' : 'bg-gray-100') : 'hover:bg-slate-800/40'}`}
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
              {getInitials()}
            </div>
            <ChevronDown size={14} className={`text-slate-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <div className={`absolute right-0 mt-2 w-60 rounded-2xl border shadow-2xl py-2 z-50 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-gray-100 text-gray-700'}`}>
              <div className="px-4 py-3 border-b border-slate-800/50 mb-1">
                <p className="text-sm font-bold truncate">{user?.username}</p>
                <p className="text-[10px] text-blue-500 font-bold uppercase mt-0.5">{user?.role}</p>
              </div>

              <div className="px-2 space-y-0.5">
                {/* 3. PROFILGA O'TISH TUGMASI */}
                <button
                  onClick={() => {
                    navigate('/profile');
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                >
                  <User size={16} />
                  Mening profilim
                </button>

                <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                  <span>{isDark ? "Kunduzgi rejim" : "Tungi rejim"}</span>
                </button>

                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
                  <Globe size={16} />
                  Til: O'zbekcha
                </button>
              </div>

              <div className="h-px bg-slate-800/50 my-2 mx-2" />

              <div className="px-2">
                <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 rounded-lg hover:bg-red-500/10 transition-colors">
                  <LogOut size={16} />
                  Chiqish
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}