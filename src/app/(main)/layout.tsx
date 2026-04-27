import LayoutContainer from '@/components/layout/MainLayout/LayoutContainer';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <LayoutContainer>{children}</LayoutContainer>;
}
