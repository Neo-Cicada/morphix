'use client';

import { Menu, LogOut, User as UserIcon, CreditCard, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  const displayName = user?.full_name || user?.email?.split('@')[0] || '—';
  const credits = user?.credit_balance ?? '—';

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between px-4 backdrop-blur-xl sm:px-6 lg:px-8"
      style={{
        background: 'rgba(8,8,8,0.9)',
        borderBottom: '1px solid #111122',
      }}
    >
      {/* Left: Mobile menu */}
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="text-zinc-500 hover:text-white transition-colors focus:outline-none lg:hidden cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Right: Credits + Avatar */}
      <div className="flex items-center gap-3">
        {/* Credits pill */}
        <Link
          href="/dashboard/billing"
          className="group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all duration-200 hover:text-white hover:border-white/[0.15] cursor-pointer"
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          <Zap className="h-3 w-3 text-[#3b82f6] group-hover:text-[#60a5fa] transition-colors" />
          <span>{credits} Credits</span>
        </Link>

        {/* Avatar dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 focus:outline-none cursor-pointer hover:border-white/20"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-haspopup="menu"
            aria-expanded={dropdownOpen}
            aria-label="User menu"
          >
            <UserIcon className="h-3.5 w-3.5 text-zinc-400" />
          </button>

          {dropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-52 origin-top-right overflow-hidden rounded-xl shadow-2xl shadow-black/60 animate-in fade-in zoom-in-95 duration-200"
              style={{
                background: '#0A0A10',
                border: '1px solid #111122',
              }}
            >
              {/* User info */}
              <div className="px-4 py-3" style={{ borderBottom: '1px solid #111122' }}>
                <p className="text-sm font-semibold text-white">{displayName}</p>
                <p className="text-xs text-[#555555] truncate mt-0.5">{user?.email ?? ''}</p>
              </div>

              <div className="py-1">
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white cursor-pointer"
                  onClick={() => setDropdownOpen(false)}
                >
                  <UserIcon className="h-4 w-4 text-zinc-600" />
                  Profile
                </Link>
                <Link
                  href="/dashboard/billing"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white cursor-pointer"
                  onClick={() => setDropdownOpen(false)}
                >
                  <CreditCard className="h-4 w-4 text-zinc-600" />
                  Billing
                </Link>
                <div className="my-1 mx-3" style={{ borderTop: '1px solid #111122' }} />
                <button
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 text-left cursor-pointer"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 text-red-400/60" />
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
