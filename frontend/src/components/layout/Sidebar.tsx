'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Video, Plus, CreditCard, Settings, X, Droplet } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'My Videos', href: '/dashboard/videos', icon: Video },
  { name: 'New Video', href: '/dashboard/new', icon: Plus },
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
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-[#111111] border-r border-white/5 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 lg:px-6 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
            <Droplet className="h-6 w-6 text-blue-500 fill-blue-500" />
            <span className="text-xl font-bold tracking-tight">Morphix</span>
          </Link>
          <button 
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 flex flex-col gap-1.5 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600/10 text-white' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-300'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
