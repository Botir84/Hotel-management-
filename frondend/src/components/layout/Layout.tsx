import { useState, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AlertBanner } from '../alerts/AlertBanner';
import { Page } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}

export function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { isDark } = useTheme();

  const mainBg = isDark ? 'bg-slate-900' : 'bg-gray-50';

  return (
    <div className={`flex h-screen overflow-hidden ${mainBg}`}>
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        collapsed={collapsed}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentPage={currentPage}
          onToggleSidebar={() => setCollapsed(c => !c)}
        />
        <AlertBanner />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
