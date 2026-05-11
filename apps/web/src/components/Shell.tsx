'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useAuth } from '@/lib/auth';

type NavRole = 'ADMIN' | 'VENDEDOR';

const NAV: ReadonlyArray<{ href: string; label: string; roles: NavRole[] }> = [
  { href: '/', label: 'Dashboard', roles: ['ADMIN', 'VENDEDOR'] },
  { href: '/productos', label: 'Productos', roles: ['ADMIN', 'VENDEDOR'] },
  { href: '/ventas', label: 'Ventas', roles: ['ADMIN', 'VENDEDOR'] },
  { href: '/ingresos', label: 'Ingresos', roles: ['ADMIN'] },
  { href: '/ajustes', label: 'Ajustes', roles: ['ADMIN'] },
  { href: '/kardex', label: 'Kardex', roles: ['ADMIN', 'VENDEDOR'] },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Cargando...
      </div>
    );
  }

  if (!user) return null;

  const items = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-slate-900 text-slate-100 flex flex-col">
        <div className="px-5 py-6 border-b border-slate-800">
          <div className="text-xl font-bold tracking-tight">SANSUR</div>
          <div className="text-xs text-slate-400">ERP de Ventiladores</div>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'block rounded-md px-3 py-2 text-sm',
                pathname === item.href
                  ? 'bg-brand text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="text-sm font-medium">{user.fullName}</div>
          <div className="text-xs text-slate-400">{user.role}</div>
          <button
            onClick={logout}
            className="mt-3 w-full rounded-md bg-slate-800 px-3 py-1.5 text-xs hover:bg-slate-700"
          >
            Cerrar sesion
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
