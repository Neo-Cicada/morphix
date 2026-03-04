'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="flex h-screen text-white overflow-hidden antialiased selection:bg-blue-500/30"
      style={{ background: '#080808', fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}
    >
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden relative">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden relative morphix-dot-grid">
          <div className="mx-auto max-w-6xl relative z-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
