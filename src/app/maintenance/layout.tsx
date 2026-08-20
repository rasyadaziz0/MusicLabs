import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Under Maintenance - Acadmusic',
  description: 'Acadmusic sedang melakukan beberapa peningkatan. Kami akan segera kembali.',
};

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
