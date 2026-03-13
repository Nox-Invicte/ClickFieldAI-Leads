'use client';

import { usePathname } from 'next/navigation';

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
};

function getTitle(pathname: string): string {
  if (titles[pathname]) return titles[pathname];
  if (pathname.startsWith('/leads/')) return 'Lead Detail';
  return 'Dashboard';
}

export function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed left-64 right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-gray-900">{getTitle(pathname)}</h1>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          AI Active
        </span>
      </div>
    </header>
  );
}
