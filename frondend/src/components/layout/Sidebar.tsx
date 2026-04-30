import {
  LayoutDashboard,
  Shield,
  Users,
  Hotel,
  ChevronRight,
} from 'lucide-react';
import { Page } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAlerts } from '../../contexts/AlertContext';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  collapsed: boolean;
}

interface NavItem {
  id: Page;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  badge?: number;
}

export function Sidebar({ currentPage, onNavigate, collapsed }: SidebarProps) {
  const { isAdmin } = useAuth();
  const { isDark } = useTheme();
  const { incidents } = useAlerts();

  const unresolvedIncidents = incidents.filter(i => !i.investigated).length;

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={18} />,
    },
    {
      id: 'revenue',
      label: 'Revenue Panel',
      icon: <Shield size={18} />,
      adminOnly: true,
      badge: unresolvedIncidents,
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: <Users size={18} />,
      adminOnly: true,
    },
    {
      id: 'security',
      label: 'security',
      icon: <Shield size={18} />,
      adminOnly: true,
    },
  ];

  const bg = isDark ? 'bg-slate-950 border-slate-800/60' : 'bg-gray-900 border-gray-800';
  const textMuted = 'text-slate-500';
  const textInactive = 'text-slate-400 hover:text-slate-200';
  const activeItem = 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-500';
  const inactiveItem = 'hover:bg-slate-800/60';

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className={`h-full flex flex-col border-r transition-all duration-300 ${bg} ${collapsed ? 'w-16' : 'w-64'
      }`}>
      {/* Logo Section */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-800/60 ${collapsed ? 'justify-center' : ''}`}>
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/30">
          <Hotel size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-semibold text-sm leading-none">HotelCRM</p>
            <p className="text-slate-500 text-xs mt-0.5">Management System</p>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="px-4 pt-4">
          <p className={`text-xs font-medium uppercase tracking-widest ${textMuted} mb-2`}>
            Navigation
          </p>
        </div>
      )}

      {/* Menu Items */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-150 text-left
                ${isActive ? activeItem : `${inactiveItem} ${textInactive}`}
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  {item.badge != null && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight size={14} className="text-blue-400 ml-auto" />}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer qismidagi profil bloki butkul olib tashlandi */}
    </aside>
  );
}