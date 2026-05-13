'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useAuth } from '@/lib/auth';

type NavRole = 'ADMIN' | 'VENDEDOR';
type NavItem = { href: string; label: string; section: string; roles: NavRole[] };

const NAV: ReadonlyArray<NavItem> = [
  { href: '/',          label: 'Boletín',        section: 'I',    roles: ['ADMIN', 'VENDEDOR'] },
  { href: '/productos', label: 'Catálogo',       section: 'II',   roles: ['ADMIN', 'VENDEDOR'] },
  { href: '/ventas',    label: 'Despachos',      section: 'III',  roles: ['ADMIN', 'VENDEDOR'] },
  { href: '/ingresos',  label: 'Mercadería',     section: 'IV',   roles: ['ADMIN'] },
  { href: '/ajustes',   label: 'Ajustes',        section: 'V',    roles: ['ADMIN'] },
  { href: '/kardex',    label: 'Kárdex',         section: 'VI',   roles: ['ADMIN', 'VENDEDOR'] },
  { href: '/chat',      label: 'Asistente',      section: 'VII',  roles: ['ADMIN', 'VENDEDOR'] },
];

function FanMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <g fill="currentColor">
        <circle cx="32" cy="32" r="3.2" />
        <path d="M32 30c-2 0-3.5-1-4.5-3-3-6-2-13 4-17.5.6-.5 1.4-.2 1.6.6 1.5 7 .5 13.5-1 18-.2.8-.5 1.5-.8 1.9z" opacity="0.92" />
        <path d="M34 32c0-2 1-3.5 3-4.5 6-3 13-2 17.5 4 .5.6.2 1.4-.6 1.6-7 1.5-13.5.5-18-1-.8-.2-1.5-.5-1.9-.8z" opacity="0.78" transform="rotate(72 32 32)" />
        <path d="M34 32c0-2 1-3.5 3-4.5 6-3 13-2 17.5 4 .5.6.2 1.4-.6 1.6-7 1.5-13.5.5-18-1-.8-.2-1.5-.5-1.9-.8z" opacity="0.62" transform="rotate(144 32 32)" />
        <path d="M34 32c0-2 1-3.5 3-4.5 6-3 13-2 17.5 4 .5.6.2 1.4-.6 1.6-7 1.5-13.5.5-18-1-.8-.2-1.5-.5-1.9-.8z" opacity="0.48" transform="rotate(216 32 32)" />
        <path d="M34 32c0-2 1-3.5 3-4.5 6-3 13-2 17.5 4 .5.6.2 1.4-.6 1.6-7 1.5-13.5.5-18-1-.8-.2-1.5-.5-1.9-.8z" opacity="0.34" transform="rotate(288 32 32)" />
      </g>
    </svg>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-ink-500">
          <FanMark className="w-5 h-5 animate-spin-slow" />
          <span className="font-display italic text-lg">Abriendo el atelier…</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const items = NAV.filter((n) => n.roles.includes(user.role));
  const currentSection = NAV.find((n) => n.href === pathname)?.section ?? '—';

  return (
    <div className="min-h-screen flex relative">
      {/* ─────── SIDEBAR ─────── */}
      <aside className="w-72 shrink-0 flex flex-col bg-paper border-r border-ink/15 relative z-10">
        {/* Masthead */}
        <div className="px-7 pt-9 pb-7 border-b border-ink/15">
          <Link href="/" className="block group">
            <div className="flex items-start gap-3">
              <FanMark className="w-9 h-9 text-ink mt-0.5 group-hover:animate-spin-slow group-hover:text-ember transition-colors" />
              <div>
                <div className="font-display text-[34px] leading-none tracking-tight text-ink">
                  Sansur
                </div>
                <div className="font-display italic text-[13px] text-ink-500 leading-none mt-1">
                  atelier del aire
                </div>
              </div>
            </div>
          </Link>
          <div className="dotted-rule mt-5" />
          <div className="flex justify-between items-baseline mt-3">
            <span className="text-[9px] uppercase tracking-widest2 text-ink-500">Edición</span>
            <span className="mono-num text-[11px] text-ink">
              N.° {new Date().toISOString().slice(0, 10).replace(/-/g, '.')}
            </span>
          </div>
        </div>

        {/* Index / Nav */}
        <div className="px-7 py-6 flex-1">
          <div className="text-[10px] uppercase tracking-widest2 text-ink-500 mb-4">
            Índice
          </div>
          <nav>
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'group flex items-baseline justify-between py-2.5 transition-colors border-b border-ink/8',
                    active ? 'text-ink' : 'text-ink-500 hover:text-ink'
                  )}
                >
                  <div className="flex items-baseline gap-4">
                    <span className={clsx(
                      'font-mono text-[10px] w-6 tabular-nums',
                      active ? 'text-ember' : 'text-ink-300 group-hover:text-ember'
                    )}>
                      {item.section}
                    </span>
                    <span className={clsx(
                      'font-display text-[19px] leading-none',
                      active && 'italic text-ember'
                    )}>
                      {item.label}
                    </span>
                  </div>
                  {active && (
                    <span className="text-ember text-xs leading-none">●</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Colophon — user info */}
        <div className="px-7 py-5 border-t border-ink/15">
          <div className="text-[9px] uppercase tracking-widest2 text-ink-500 mb-2">
            Responsable
          </div>
          <div className="font-display text-[20px] leading-tight text-ink">
            {user.fullName}
          </div>
          <div className="mono-num text-[10px] uppercase tracking-widest2 text-ink-500 mt-1">
            {user.role} · § {currentSection}
          </div>
          <button
            onClick={logout}
            className="mt-4 w-full text-[10px] uppercase tracking-widest2 text-ink-500 hover:text-ember transition-colors text-left flex items-center gap-1.5 group"
          >
            <span className="inline-block w-3 h-px bg-current group-hover:w-5 transition-all" />
            Cerrar edición
          </button>
        </div>
      </aside>

      {/* ─────── MAIN ─────── */}
      <main className="flex-1 overflow-x-hidden relative">
        {/* top rule */}
        <div className="sticky top-0 z-20 bg-paper/95 backdrop-blur-sm border-b border-ink/15">
          <div className="px-10 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest2 text-ink-500">
              <span>Lima · Perú</span>
              <span className="text-ink-300">/</span>
              <span className="mono-num">
                {new Date().toLocaleDateString('es-PE', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest2 text-ink-500">
              <span className="inline-block w-1.5 h-1.5 bg-moss rounded-full animate-ticker" />
              <span>En línea</span>
            </div>
          </div>
        </div>

        <div className="px-10 py-10">{children}</div>

        <footer className="px-10 py-8 mt-12 border-t border-ink/15">
          <div className="flex items-baseline justify-between text-[10px] uppercase tracking-widest2 text-ink-500">
            <span>Sansur · Comercio de ventiladores</span>
            <span className="font-display italic text-[13px] text-ink/60 normal-case tracking-normal">
              que el aire nunca falte
            </span>
            <span className="mono-num">© MMXXVI</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
