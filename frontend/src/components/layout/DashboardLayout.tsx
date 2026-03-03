'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans selection:bg-blue-500/30 selection:text-blue-200">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {/* Subtle background glow effect using exact colors from landing page */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[400px] bg-blue-600/10 blur-[120px] rounded-full point-events-none -z-10" />
          
          <div className="mx-auto max-w-7xl relative z-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
