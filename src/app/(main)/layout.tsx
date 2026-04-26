import MainLayout from '@/components/layout/MainLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
