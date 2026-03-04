'use client';

import { Menu, LogOut, User as UserIcon, CreditCard, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

interface TopbarProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Home',
  '/dashboard/new': 'New Video',
  '/dashboard/videos': 'My Videos',
  '/dashboard/billing': 'Billing',
  '/dashboard/settings': 'Settings',
};

export function Topbar({ onMenuClick }: TopbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const pageTitle = pageTitles[pathname] || 'Dashboard';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0a]/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      {/* Left: Mobile menu */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="text-gray-500 hover:text-white transition-colors focus:outline-none lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold text-white tracking-tight" style={{ letterSpacing: '-0.02em' }}>{pageTitle}</h1>
      </div>

      {/* Right: Credits + Avatar */}
      <div className="flex items-center gap-3">
        <Link 
          href="/dashboard/billing"
          className="group flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-gray-400 transition-all hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-gray-300"
        >
          <Zap className="h-3 w-3 text-blue-500 group-hover:text-blue-400" />
          <span>3 Credits</span>
        </Link>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] border border-white/[0.08] text-gray-400 transition-all hover:bg-white/[0.08] hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <UserIcon className="h-3.5 w-3.5" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 origin-top-right overflow-hidden rounded-xl border border-white/[0.08] bg-[#161616] shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <p className="text-sm font-medium text-white">Neo Barnachea</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">neo@morphix.ai</p>
              </div>
              <div className="py-1">
                <Link 
                  href="/dashboard/settings" 
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 transition-colors hover:bg-white/[0.04] hover:text-white"
                  onClick={() => setDropdownOpen(false)}
                >
                  <UserIcon className="h-4 w-4 text-gray-500" />
                  Profile
                </Link>
                <Link 
                  href="/dashboard/billing" 
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 transition-colors hover:bg-white/[0.04] hover:text-white"
                  onClick={() => setDropdownOpen(false)}
                >
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  Billing
                </Link>
                <div className="my-1 mx-3 border-t border-white/[0.06]" />
                <button 
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 text-left"
                  onClick={() => {
                    // TODO: Handle logout
                    setDropdownOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4 text-red-400/70" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
