import React from 'react';
import { BaseLayout } from './BaseLayout';
import Sidebar from '../../desktop/layout/Sidebar';

// Inheritance & Polymorphism
export default class DesktopLayout extends BaseLayout {
  protected renderSidebar(): React.ReactNode {
    return <Sidebar />;
  }

  protected renderMobileNav(): React.ReactNode {
    // Hide mobile navigation in desktop layout
    return null;
  }
}
