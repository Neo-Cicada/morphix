'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlaySquare, PlusCircle, CreditCard, Settings, X, Clapperboard } from 'lucide-react';

const navItems = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'My Videos', href: '/dashboard/videos', icon: PlaySquare },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-[240px] transform border-r border-white/[0.06] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'linear-gradient(180deg, #111111 0%, #0d0d16 100%)' }}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-white/[0.06]">
          <Link href="/dashboard" className="flex items-center gap-2.5 text-white hover:opacity-80 transition-opacity">
            <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Clapperboard className="h-4 w-4 text-blue-500" />
            </div>
            <span className="text-lg font-bold tracking-tight">Morphix</span>
          </Link>
          <button 
            className="lg:hidden text-gray-500 hover:text-white transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex flex-col gap-1 px-3 flex-1">
          {navItems.map((item) => {
            const isActive = item.href === '/dashboard' 
              ? pathname === '/dashboard' 
              : pathname?.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#1a2744] text-[#3b82f6]'
                    : 'bg-transparent text-[#888888] hover:bg-white/[0.04] hover:text-white'
                }`}
                style={isActive ? { boxShadow: '-4px 0 16px rgba(59, 130, 246, 0.3), inset 2px 0 8px rgba(59, 130, 246, 0.1)' } : undefined}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#3b82f6] rounded-r-full" style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)' }} />
                )}
                <Icon className={`h-5 w-5 transition-colors shrink-0 ${
                  isActive 
                    ? 'text-[#3b82f6]' 
                    : 'text-[#888888] group-hover:text-white'
                }`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section CTA */}
        <div className="p-4 mt-auto">
          <Link
            href="/dashboard/new"
            className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white"
            onClick={() => setIsOpen(false)}
          >
            <PlusCircle className="h-5 w-5" />
            New Video
          </Link>
        </div>
      </aside>
    </>
  );
}
