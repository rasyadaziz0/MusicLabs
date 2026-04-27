import React from 'react';
import { BaseLayout } from './BaseLayout';
import MobileNav from '../../mobile/layout/MobileNav';

// Inheritance & Polymorphism
export default class MobileLayout extends BaseLayout {
  protected renderSidebar(): React.ReactNode {
    // Hide desktop sidebar in mobile layout
    return null;
  }

  protected renderMobileNav(): React.ReactNode {
    return <MobileNav />;
  }
}
