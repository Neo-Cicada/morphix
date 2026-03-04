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
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    borderClass: 'stats-border-blue',
  },
  purple: {
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-400',
    borderClass: 'stats-border-purple',
  },
  green: {
    iconBg: 'bg-green-500/15',
    iconColor: 'text-green-400',
    borderClass: 'stats-border-green',
  },
};

export function StatsCard({ icon: Icon, title, value, subtitle, color = 'blue' }: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div className={`morphix-card rounded-xl border border-[#222222] bg-[#161616] p-5 transition-colors hover:border-[#2a2a2a] ${colors.borderClass}`}>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`size-9 rounded-lg ${colors.iconBg} flex items-center justify-center`}>
            <Icon className={`h-[18px] w-[18px] ${colors.iconColor}`} />
          </div>
          <p className="text-xs font-medium text-[#888888] uppercase tracking-wider">{title}</p>
        </div>
        <p className="text-4xl font-bold text-white tracking-tight leading-none">{value}</p>
        {subtitle && (
          <p className="text-xs text-[#888888] mt-2">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
