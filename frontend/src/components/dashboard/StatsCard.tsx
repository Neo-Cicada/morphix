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
    iconBg: 'rgba(193,123,79,0.1)',
    iconColor: '#C17B4F',
    iconBorder: 'rgba(193,123,79,0.2)',
    topBar: '#C17B4F',
    glow: 'rgba(193,123,79,0.06)',
  },
  purple: {
    iconBg: 'rgba(193,123,79,0.1)',
    iconColor: '#D4A574',
    iconBorder: 'rgba(193,123,79,0.2)',
    topBar: '#D4A574',
    glow: 'rgba(193,123,79,0.06)',
  },
  green: {
    iconBg: 'rgba(193,123,79,0.1)',
    iconColor: '#D4A574',
    iconBorder: 'rgba(193,123,79,0.2)',
    topBar: '#D4A574',
    glow: 'rgba(193,123,79,0.06)',
  },
};

export function StatsCard({ icon: Icon, title, value, subtitle, color = 'blue' }: StatsCardProps) {
  const c = colorMap[color];

  return (
    <div
      className="relative rounded-xl p-5 overflow-hidden transition-all duration-200 hover:border-[#2a2a2a] cursor-default group"
      style={{
        background: '#1a1a18',
        border: '1px solid #2e2e2c',
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
          <p className="text-[10px] font-semibold tracking-[0.12em] uppercase" style={{ color: '#888884' }}>
            {title}
          </p>
        </div>
        <p className="text-4xl font-bold tracking-tight text-white leading-none">{value}</p>
        {subtitle && (
          <p className="text-xs mt-2" style={{ color: '#888884' }}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}
