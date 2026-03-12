'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlaySquare, PlusCircle, X, Film, Clapperboard, PanelLeftClose, PanelLeftOpen, LayoutTemplate } from 'lucide-react';

const navItems = [
  { name: 'Home',        href: '/dashboard',             icon: Home },
  { name: 'My Videos',  href: '/dashboard/videos',      icon: PlaySquare },
  { name: 'Templates',  href: '/dashboard/marketplace', icon: LayoutTemplate },
  { name: 'New Video',  href: '/dashboard/new',         icon: PlusCircle },
  { name: 'Editor',     href: '/dashboard/editor',      icon: Clapperboard },
];

interface SidebarProps {
  isOpen:       boolean;
  setIsOpen:    (v: boolean) => void;
  collapsed:    boolean;
  setCollapsed: (v: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen, collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const w = collapsed ? 60 : 220;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          width: w,
          minWidth: w,
          background: '#111110',
          borderRight: '1px solid #2e2e2c',
          transition: 'width 220ms cubic-bezier(0.4,0,0.2,1), min-width 220ms cubic-bezier(0.4,0,0.2,1)',
          overflow: 'visible',
          position: 'relative',
        }}
      >

        {/* ── Logo row ───────────────────────────────────────────────── */}
        <div
          className="flex items-center flex-shrink-0"
          style={{
            height: 56,
            padding: collapsed ? '0 0' : '0 16px',
            borderBottom: '1px solid #2e2e2c',
            justifyContent: collapsed ? 'center' : 'space-between',
          }}
        >
          {collapsed ? (
            <Link href="/dashboard" className="group flex items-center justify-center" style={{ width: 60, height: 56 }}>
              <div
                className="flex items-center justify-center rounded-lg transition-all duration-200 group-hover:bg-white/[0.05]"
                style={{ width: 32, height: 32 }}
              >
                <Film className="size-[18px] text-[#555553] group-hover:text-[#C17B4F] transition-colors duration-200" />
              </div>
            </Link>
          ) : (
            <>
              <Link href="/dashboard" className="flex items-center gap-2.5 group cursor-pointer">
                <Film className="size-[17px] text-[#C17B4F]" />
                <span className="font-bold text-[15px] tracking-tight text-white">Morphix</span>
              </Link>
              <button
                className="lg:hidden flex items-center justify-center rounded-md text-[#555] hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                style={{ width: 28, height: 28 }}
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* ── Nav ────────────────────────────────────────────────────── */}
        <nav
          className="flex-1 flex flex-col"
          style={{ padding: collapsed ? '10px 8px' : '10px 10px', gap: 2 }}
        >
          {!collapsed && (
            <p
              className="truncate"
              style={{
                fontSize: 9, fontWeight: 600, letterSpacing: '0.15em',
                textTransform: 'uppercase', color: '#4a4a48',
                padding: '6px 8px 8px', userSelect: 'none',
              }}
            >
              Studio
            </p>
          )}

          {navItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname?.startsWith(item.href);
            const Icon = item.icon;

            return (
              <div key={item.href} className="relative group/item">
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`relative flex items-center rounded-lg transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#C17B4F]/[0.08] text-[#C17B4F]'
                      : 'text-[#555] hover:bg-white/[0.04] hover:text-[#bbb]'
                  }`}
                  style={{
                    gap: collapsed ? 0 : 10,
                    height: 36,
                    padding: collapsed ? '0' : '0 10px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                  }}
                >
                  {/* Active bar */}
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                      style={{
                        width: 2, height: 16,
                        background: '#C17B4F',
                        boxShadow: '0 0 8px rgba(193,123,79,0.6)',
                      }}
                    />
                  )}

                  <Icon
                    className="shrink-0 transition-colors"
                    style={{
                      width: 15, height: 15,
                      color: isActive ? '#C17B4F' : 'inherit',
                    }}
                  />

                  {!collapsed && (
                    <>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</span>
                      {item.name === 'New Video' && (
                        <span
                          className="ml-auto font-bold text-[#C17B4F] bg-[#C17B4F]/10 rounded-full border border-[#C17B4F]/20"
                          style={{ fontSize: 9, letterSpacing: '0.15em', padding: '2px 6px' }}
                        >
                          NEW
                        </span>
                      )}
                    </>
                  )}
                </Link>

                {/* Tooltip — only in collapsed mode */}
                {collapsed && (
                  <div
                    className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity duration-150"
                    style={{ marginLeft: 10, zIndex: 200 }}
                  >
                    <div
                      className="flex items-center whitespace-nowrap rounded-lg px-3 py-1.5"
                      style={{
                        background: '#141412',
                        border: '1px solid #2a2a28',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#ccc',
                      }}
                    >
                      {/* Arrow */}
                      <div
                        className="absolute right-full top-1/2 -translate-y-1/2"
                        style={{
                          width: 0, height: 0,
                          borderTop: '4px solid transparent',
                          borderBottom: '4px solid transparent',
                          borderRight: '5px solid #2a2a28',
                        }}
                      />
                      {item.name}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 flex flex-col"
          style={{ borderTop: '1px solid #2e2e2c' }}
        >
          {!collapsed && (
            <div style={{ padding: '10px 18px 4px' }}>
              <p style={{ fontSize: 9, color: '#444442', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Morphix Studio · v0.1
              </p>
            </div>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center transition-colors duration-150 cursor-pointer hover:bg-white/[0.04] group/toggle"
            style={{
              height: 42,
              gap: 7,
              color: '#3a3a38',
              padding: collapsed ? 0 : '0 14px',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onMouseEnter={e => { e.currentTarget.style.color = '#888884'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#3a3a38'; }}
          >
            {collapsed
              ? <PanelLeftOpen size={14} />
              : (
                <>
                  <PanelLeftClose size={14} />
                  <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.02em' }}>Collapse</span>
                </>
              )
            }
          </button>
        </div>

      </aside>
    </>
  );
}
