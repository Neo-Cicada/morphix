import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'blue' | 'purple' | 'green';
}

const colorMap = {
  blue: {
    iconBg: 'rgba(59,130,246,0.1)',
    iconColor: '#3b82f6',
    iconBorder: 'rgba(59,130,246,0.2)',
    topBar: 'linear-gradient(90deg,#3b82f6,transparent)',
    glow: 'rgba(59,130,246,0.06)',
  },
  purple: {
    iconBg: 'rgba(168,85,247,0.1)',
    iconColor: '#a855f7',
    iconBorder: 'rgba(168,85,247,0.2)',
    topBar: 'linear-gradient(90deg,#a855f7,transparent)',
    glow: 'rgba(168,85,247,0.06)',
  },
  green: {
    iconBg: 'rgba(34,197,94,0.1)',
    iconColor: '#22c55e',
    iconBorder: 'rgba(34,197,94,0.2)',
    topBar: 'linear-gradient(90deg,#22c55e,transparent)',
    glow: 'rgba(34,197,94,0.06)',
  },
};

export function StatsCard({ icon: Icon, title, value, subtitle, color = 'blue' }: StatsCardProps) {
  const c = colorMap[color];

  return (
    <div
      className="relative rounded-xl p-5 overflow-hidden transition-all duration-200 hover:border-[#2a2a2a] cursor-default group"
      style={{
        background: '#0d0d0d',
        border: '1px solid #1e1e1e',
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: c.topBar }}
      />
      {/* Subtle corner glow */}
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-60 pointer-events-none"
        style={{ background: c.glow }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="size-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: c.iconBg, border: `1px solid ${c.iconBorder}` }}
          >
            <Icon className="h-[17px] w-[17px]" style={{ color: c.iconColor }} />
          </div>
          <p className="text-[10px] font-semibold tracking-[0.12em] uppercase" style={{ color: '#555555' }}>
            {title}
          </p>
        </div>
        <p className="text-4xl font-bold tracking-tight text-white leading-none">{value}</p>
        {subtitle && (
          <p className="text-xs mt-2" style={{ color: '#666666' }}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}
