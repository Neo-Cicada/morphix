'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { UserProvider } from '@/contexts/UserContext';

const SIDEBAR_KEY = 'morphix_sidebar_collapsed';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen,     setSidebarOpen]     = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored !== null) setSidebarCollapsed(stored === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);
  const pathname = usePathname();
  const isFullBleed = pathname === '/dashboard/editor';

  return (
    <UserProvider>
    <div
      className="flex h-screen text-white overflow-hidden antialiased selection:bg-blue-500/30"
      style={{ background: '#05050A', fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}
    >
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <div className="flex flex-1 flex-col overflow-hidden relative">
        {!isFullBleed && <Topbar onMenuClick={() => setSidebarOpen(true)} />}

        {isFullBleed ? (
          <main className="flex-1 overflow-hidden relative">
            {children}
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative morphix-dot-grid">
            <div className="mx-auto max-w-6xl relative z-0">
              {children}
            </div>
          </main>
        )}
      </div>
    </div>
    </UserProvider>
  );
}
