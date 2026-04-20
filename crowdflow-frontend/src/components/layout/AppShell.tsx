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
      <main className="flex-grow pt-24 pb-32 px-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
