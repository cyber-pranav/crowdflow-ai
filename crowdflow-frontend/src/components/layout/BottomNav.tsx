'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', icon: 'stadium', label: 'Stadium' },
  { href: '/queues', icon: 'navigation', label: 'Flow' },
  { href: '/dashboard', icon: 'psychology', label: 'Intelligence' },
  { href: '/alerts', icon: 'notifications', label: 'Alerts' },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav
      role="navigation"
      aria-label="Primary navigation"
      className="fixed bottom-0 left-0 w-full z-50 flex justify-center items-center pb-[env(safe-area-inset-bottom)]"
    >
      <div className="bg-background/60 backdrop-blur-2xl rounded-3xl mx-6 mb-6 overflow-hidden border border-primary/10 shadow-[0_20px_50px_rgba(143,245,255,0.15)] flex justify-around items-center w-full max-w-lg px-4 py-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={`Navigate to ${item.label} page`}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center py-2 px-4 min-w-[48px] min-h-[48px] transition-all active:scale-90 duration-200 ease-out focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded-2xl ${
                active
                  ? 'text-primary bg-primary/10'
                  : 'text-slate-500 hover:bg-primary/5 hover:text-primary'
              }`}
            >
              <span
                className={`material-symbols-outlined mb-1 ${active ? 'filled' : ''}`}
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <span className="font-label text-[10px] font-medium tracking-wide uppercase">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
