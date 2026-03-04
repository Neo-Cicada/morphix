'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlaySquare, PlusCircle, X, Film } from 'lucide-react';

const navItems = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'My Videos', href: '/dashboard/videos', icon: PlaySquare },
  { name: 'New Video', href: '/dashboard/new', icon: PlusCircle },
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
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[224px] flex flex-col transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: '#080808',
          borderRight: '1px solid #1a1a1a',
        }}
      >
        {/* Logo — matches landing page nav */}
        <div
          className="flex h-16 items-center justify-between px-5"
          style={{ borderBottom: '1px solid #1a1a1a' }}
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <Film className="size-5 text-white group-hover:text-[#3b82f6] transition-colors duration-200" />
            <span className="font-bold text-[17px] tracking-tight text-white">
              Morphix
            </span>
          </Link>
          <button
            className="lg:hidden text-zinc-500 hover:text-white transition-colors cursor-pointer"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-5 pb-4 flex flex-col gap-0.5">
          <p className="px-3 mb-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-[#555555]">
            Studio
          </p>
          {navItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname?.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#3b82f6]/10 text-[#3b82f6]'
                    : 'text-[#888888] hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                {/* Active left bar — same glow as landing accent */}
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-full bg-[#3b82f6]"
                    style={{ boxShadow: '0 0 8px rgba(59,130,246,0.7)' }}
                  />
                )}
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#3b82f6]' : 'text-[#555555] group-hover:text-white'
                  }`}
                />
                {item.name}
                {item.name === 'New Video' && (
                  <span className="ml-auto text-[9px] font-bold tracking-widest text-[#3b82f6] bg-[#3b82f6]/10 rounded-full px-1.5 py-0.5 border border-[#3b82f6]/20">
                    +
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: version / build info */}
        <div
          className="px-5 py-4"
          style={{ borderTop: '1px solid #1a1a1a' }}
        >
          <p className="text-[10px] text-[#333333] tracking-wider">MORPHIX STUDIO · v0.1</p>
        </div>
      </aside>
    </>
  );
}
