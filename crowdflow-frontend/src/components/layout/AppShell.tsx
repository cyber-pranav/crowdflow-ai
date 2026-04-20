'use client';

import TopAppBar from './TopAppBar';
import BottomNav from './BottomNav';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-dvh flex flex-col">
      <TopAppBar />
      <main
        id="main-content"
        role="main"
        aria-label="Main content area"
        className="flex-grow pt-24 pb-32 px-6 max-w-7xl mx-auto w-full"
      >
        {/* Live status announcements for screen readers */}
        <div aria-live="polite" aria-atomic="true" className="sr-only" id="live-status" />
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
