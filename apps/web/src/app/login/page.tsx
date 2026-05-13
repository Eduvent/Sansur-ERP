'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';

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

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@sansur.pe');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error de conexión');
    } finally {
      setSubmitting(false);
    }
  }

  const longDate = new Date().toLocaleDateString('es-PE', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 relative">
      {/* ─── COLUMNA EDITORIAL IZQUIERDA ─── */}
      <aside className="hidden lg:flex flex-col justify-between p-14 border-r border-ink/15 relative overflow-hidden">
        {/* Decorative fan, big and ghosted */}
        <div className="absolute -right-32 top-1/4 text-ember/8 pointer-events-none">
          <FanMark className="w-[680px] h-[680px] animate-spin-slow opacity-30" />
        </div>

        <header className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <FanMark className="w-8 h-8 text-ink animate-spin-slow" />
            <div>
              <div className="font-display text-2xl text-ink leading-none">Sansur</div>
              <div className="font-display italic text-xs text-ink-500">atelier del aire · MMXXVI</div>
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-widest2 text-ink-500 flex items-center gap-3">
            <span>Edición privada</span>
            <span className="w-6 h-px bg-ink-300" />
            <span className="mono-num">{longDate}</span>
          </div>
        </header>

        <div className="relative z-10 max-w-md">
          <div className="eyebrow mb-3">Manifiesto</div>
          <h1 className="font-display text-[68px] leading-[0.95] tracking-tight text-ink">
            El aire que mueve <span className="italic text-ember">al país.</span>
          </h1>
          <p className="font-display italic text-xl text-ink-500 mt-6 leading-snug">
            Veinte años fabricando frescura para hogares peruanos.
            Cada ventilador con su historia, cada venta con su registro.
          </p>
        </div>

        <footer className="relative z-10 flex items-baseline justify-between text-[10px] uppercase tracking-widest2 text-ink-500">
          <span>Lima · Perú</span>
          <span className="font-display italic text-base normal-case tracking-normal text-ink/60">
            «que el aire nunca falte»
          </span>
          <span className="mono-num">v 1.0</span>
        </footer>
      </aside>

      {/* ─── COLUMNA DERECHA · FORM ─── */}
      <main className="flex items-center justify-center p-8 lg:p-14 relative">
        <div className="w-full max-w-md">
          {/* mobile masthead */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <FanMark className="w-8 h-8 text-ink animate-spin-slow" />
            <div>
              <div className="font-display text-2xl text-ink leading-none">Sansur</div>
              <div className="font-display italic text-xs text-ink-500">atelier del aire</div>
            </div>
          </div>

          <div className="mb-8">
            <div className="eyebrow mb-3">Sala de control</div>
            <h2 className="font-display text-5xl text-ink leading-none mb-2">
              Bienvenido <span className="italic">de vuelta.</span>
            </h2>
            <p className="text-sm text-ink-500 mt-3">
              Identifíquese para abrir la edición de hoy del boletín.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-7">
            <div>
              <label className="block text-[10px] uppercase tracking-widest2 text-ink-500 mb-2">
                Correo
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input text-lg font-display"
                placeholder="usuario@sansur.pe"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest2 text-ink-500 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input text-lg font-display tracking-widest"
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 py-3 border-y border-ember">
                <span className="stamp-ember mt-0.5">Error</span>
                <span className="text-sm text-ink leading-snug">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3.5 text-[11px]"
            >
              {submitting ? 'Ingresando…' : 'Entrar al atelier →'}
            </button>

            <div className="pt-6 border-t border-ink/15">
              <div className="text-[10px] uppercase tracking-widest2 text-ink-500 mb-3">
                Credenciales de demostración
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="font-display italic text-ember mb-1">Administrador</div>
                  <div className="mono-num text-ink leading-snug">admin@sansur.pe<br/>admin123</div>
                </div>
                <div>
                  <div className="font-display italic text-ember mb-1">Vendedor</div>
                  <div className="mono-num text-ink leading-snug">vendedor@sansur.pe<br/>vendedor123</div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
