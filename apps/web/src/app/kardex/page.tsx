'use client';

import { useEffect, useState } from 'react';
import { Shell } from '@/components/Shell';
import { apiClient } from '@/lib/api';

type Movement = {
  id: string;
  type: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'DEVOLUCION';
  note: string | null;
  reason: string | null;
  createdAt: string;
  user: { fullName: string };
  supplier: { name: string } | null;
  sale: { receiptNumber: string } | null;
  items: Array<{
    quantity: number;
    unitPrice: string | null;
    product: { sku: string; name: string };
  }>;
};

const TYPE_META: Record<Movement['type'], { label: string; symbol: string; stampClass: string; signClass: string }> = {
  ENTRADA:    { label: 'Ingreso',     symbol: '↳', stampClass: 'stamp-moss',   signClass: 'text-moss'  },
  SALIDA:     { label: 'Despacho',    symbol: '↥', stampClass: 'stamp-cobalt', signClass: 'text-cobalt' },
  AJUSTE:     { label: 'Ajuste',      symbol: '≅', stampClass: 'stamp-ink',    signClass: 'text-ink'   },
  DEVOLUCION: { label: 'Devolución',  symbol: '↶', stampClass: 'stamp-ember',  signClass: 'text-ember' },
};

const FILTERS: { value: string; label: string }[] = [
  { value: '',            label: 'Todos' },
  { value: 'ENTRADA',     label: 'Ingresos' },
  { value: 'SALIDA',      label: 'Despachos' },
  { value: 'AJUSTE',      label: 'Ajustes' },
  { value: 'DEVOLUCION',  label: 'Devoluciones' },
];

export default function KardexPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterType) params.set('type', filterType);
    apiClient.get<Movement[]>(`/api/kardex?${params.toString()}`).then(setMovements);
  }, [filterType]);

  return (
    <Shell>
      <header className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <span className="eyebrow">Sección VI · Kárdex</span>
          <span className="mono-num text-[10px] uppercase tracking-widest2 text-ink-500">
            Historia inmutable · trazabilidad total
          </span>
        </div>
        <div className="double-rule">
          <h1 className="font-display text-[72px] leading-[0.95] tracking-tight text-ink py-1">
            Kárdex <span className="italic text-ember">— libro mayor.</span>
          </h1>
        </div>
        <p className="font-display italic text-lg text-ink-500 mt-3 max-w-2xl">
          Cada entrada, salida, ajuste y devolución asentada en el orden en que ocurrió.
          Nada se borra, nada se reescribe.
        </p>
      </header>

      {/* FILTER TAGS */}
      <div className="flex flex-wrap items-center gap-2 mb-8 pb-5 border-b border-ink/15">
        <span className="text-[10px] uppercase tracking-widest2 text-ink-500 mr-2">
          Filtrar →
        </span>
        {FILTERS.map((f) => (
          <button
            key={f.value || 'all'}
            onClick={() => setFilterType(f.value)}
            className={filterType === f.value ? 'tag-active' : 'tag'}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-[10px] uppercase tracking-widest2 text-ink-500">
          <span className="font-display text-2xl text-ink mono-num align-middle">
            {String(movements.length).padStart(3, '0')}
          </span>{' '}
          registros
        </span>
      </div>

      {/* TIMELINE */}
      <div className="space-y-0">
        {movements.map((m, idx) => {
          const meta = TYPE_META[m.type];
          const totalItems = m.items.reduce((s, i) => s + i.quantity, 0);
          const date = new Date(m.createdAt);
          const dateStr = date.toLocaleDateString('es-PE', {
            day: '2-digit', month: 'short', year: 'numeric',
          });
          const timeStr = date.toLocaleTimeString('es-PE', {
            hour: '2-digit', minute: '2-digit',
          });

          return (
            <article
              key={m.id}
              className="grid grid-cols-1 lg:grid-cols-[140px,1fr,auto] gap-6 lg:gap-10 py-6 border-b border-ink/10 hover:bg-paper-200/40 transition-colors px-2 -mx-2"
            >
              {/* Date + ordinal */}
              <div className="lg:text-right">
                <div className="mono-num text-[10px] text-ink-300">
                  № {String(movements.length - idx).padStart(4, '0')}
                </div>
                <div className="font-display text-2xl text-ink leading-none mt-1">{dateStr}</div>
                <div className="mono-num text-xs text-ink-500 mt-1">{timeStr}</div>
              </div>

              {/* Body */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`${meta.stampClass}`}>
                    <span className={`${meta.signClass} mr-1`}>{meta.symbol}</span> {meta.label.toUpperCase()}
                  </span>
                  {m.sale && (
                    <span className="text-[10px] uppercase tracking-widest2 text-ink-500">
                      Comprobante <strong className="mono-num text-ink">{m.sale.receiptNumber}</strong>
                    </span>
                  )}
                  {m.supplier && (
                    <span className="text-[10px] uppercase tracking-widest2 text-ink-500">
                      Proveedor <strong className="font-display italic text-ink normal-case tracking-normal">{m.supplier.name}</strong>
                    </span>
                  )}
                  {m.reason && (
                    <span className="text-[10px] uppercase tracking-widest2 text-ink-500">
                      Motivo <strong className="text-ink">{m.reason}</strong>
                    </span>
                  )}
                </div>

                <ul className="space-y-1">
                  {m.items.map((it, i) => (
                    <li key={i} className="flex items-baseline gap-3 leading-snug">
                      <span className="mono-num text-xs text-ink-300">{String(i + 1).padStart(2, '0')}</span>
                      <span className="mono-num text-xs text-ink-500">{it.product.sku}</span>
                      <span className="font-display text-lg text-ink flex-1 truncate">
                        {it.product.name}
                      </span>
                      <span className={`mono-num font-display text-xl ${meta.signClass}`}>
                        × {it.quantity}
                      </span>
                    </li>
                  ))}
                </ul>

                {m.note && (
                  <p className="mt-3 font-display italic text-base text-ink-500 border-l-2 border-ink/20 pl-3">
                    «{m.note}»
                  </p>
                )}
              </div>

              {/* Right meta */}
              <div className="lg:text-right">
                <div className="text-[10px] uppercase tracking-widest2 text-ink-500">Total</div>
                <div className={`font-display text-5xl mono-num ${meta.signClass} leading-none mt-1`}>
                  {totalItems}
                </div>
                <div className="text-[10px] uppercase tracking-widest2 text-ink-500 mt-2">
                  unidades
                </div>
                <div className="dotted-rule mt-3 lg:w-32 lg:ml-auto" />
                <div className="text-[10px] uppercase tracking-widest2 text-ink-500 mt-2">
                  por <span className="font-display italic text-sm normal-case tracking-normal text-ink">{m.user.fullName}</span>
                </div>
              </div>
            </article>
          );
        })}
        {movements.length === 0 && (
          <div className="py-16 text-center">
            <div className="font-display italic text-3xl text-ink-500">
              Sin movimientos en el libro.
            </div>
            <p className="text-xs uppercase tracking-widest2 text-ink-300 mt-3">
              Apenas se registre uno aparecerá aquí.
            </p>
          </div>
        )}
      </div>
    </Shell>
  );
}
