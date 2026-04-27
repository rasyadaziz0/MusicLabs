import React, { ReactNode, Suspense } from 'react';
import Header from '../Header';
import PlayerBar from '../../player/PlayerBar';

export interface ILayoutProps {
  children: ReactNode;
}

export abstract class BaseLayout extends React.Component<ILayoutProps> {
  // Abstraction: subclasses must implement these methods (Polymorphism)
  protected abstract renderSidebar(): ReactNode;
  protected abstract renderMobileNav(): ReactNode;

  // Encapsulation: the core layout structure is hidden and reused
  render() {
    return (
      <div className="flex h-screen overflow-hidden bg-void">
        {this.renderSidebar()}

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Suspense fallback={null}>
            <Header />
          </Suspense>

          <main className="flex-1 overflow-y-auto gradient-mesh pb-36 md:pb-0 relative z-0">
            <div className="p-4 md:p-8 max-w-[1600px] mx-auto pb-6 md:pb-8">
              {this.props.children}
            </div>
          </main>

          <PlayerBar />

          {this.renderMobileNav()}
        </div>
      </div>
    );
  }
}
