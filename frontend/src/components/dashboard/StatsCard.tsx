import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
}

export function StatsCard({ icon: Icon, title, value, subtitle }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-[#222222] bg-[#161616] p-5 transition-colors hover:border-[#2a2a2a]">
      <div className="flex items-center gap-3 mb-3">
        <div className="size-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
          <Icon className="h-4 w-4 text-gray-400" />
        </div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
