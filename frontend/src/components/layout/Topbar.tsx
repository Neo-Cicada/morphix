'use client';

import { Menu, LogOut, User as UserIcon, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-[#0a0a0a]/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-4 lg:hidden">
        <button
          onClick={onMenuClick}
          className="text-gray-400 hover:text-white transition-colors focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-end gap-5">
        <Link 
          href="/dashboard/billing"
          className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-gray-300 transition-all hover:bg-white/10 hover:border-white/20"
        >
          <Zap className="h-3.5 w-3.5 text-blue-500 group-hover:text-blue-400" />
          <span>3 Credits</span>
        </Link>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-300 transition-all hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <UserIcon className="h-4 w-4" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 origin-top-right overflow-hidden rounded-xl border border-white/10 bg-[#111111] shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-sm font-medium text-white">Neo Barnachea</p>
                <p className="text-xs text-gray-500 truncate">neo@morphix.ai</p>
              </div>
              <div className="py-1">
                <Link 
                  href="/dashboard/settings" 
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                  onClick={() => setDropdownOpen(false)}
                >
                  <UserIcon className="h-4 w-4 text-gray-400" />
                  Profile settings
                </Link>
                <button 
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 text-left"
                  onClick={() => {
                    // TODO: Handle logout integration
                    setDropdownOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4 text-red-400/80" />
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
