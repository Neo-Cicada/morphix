import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Morphix',
  description: 'Manage your Morphix AI video marketing campaigns.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
