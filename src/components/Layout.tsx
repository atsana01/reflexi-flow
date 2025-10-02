import { ReactNode } from 'react';
import { Navigation } from './Navigation';

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="container mx-auto p-4 md:p-6 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
};
