import { headers } from 'next/headers';
import React from 'react';
import BaseLayout from './BaseLayout';
import Sidebar from '../../desktop/layout/Sidebar';
import MobileNav from '../../mobile/layout/MobileNav';

export default async function LayoutContainer({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);

  if (isMobile) {
    return (
      <BaseLayout isMobile={true} renderNavigation={() => <MobileNav />}>
        {children}
      </BaseLayout>
    );
  }

  return (
    <BaseLayout isMobile={false} renderNavigation={() => <Sidebar />}>
      {children}
    </BaseLayout>
  );
}
