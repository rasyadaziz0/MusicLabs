import React from 'react';
import Sidebar from '../../desktop/layout/Sidebar';
import MobileNav from '../../mobile/layout/MobileNav';
import BaseLayout from './BaseLayout';

export default function LayoutContainer({ children }: { children: React.ReactNode }) {
  return (
    <BaseLayout
      renderDesktopNav={() => <Sidebar />}
      renderMobileNav={() => <MobileNav />}
    >
      {children}
    </BaseLayout>
  );
}
