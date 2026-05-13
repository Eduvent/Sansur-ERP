'use client';

import { useEffect, useState } from 'react';
import { Shell } from '@/components/Shell';
import { apiClient } from '@/lib/api';

type Summary = {
  totalProducts: number;
  totalActive: number;
  entradasHoy: number;
  salidasHoy: number;
  ventasHoy: number;
  montoVentasHoy: number;
  lowStockCount: number;
  lowStockProducts: Array<{ id: string; sku: string; name: string; stock: number; minStock: number }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    apiClient.get<Summary>('/api/dashboard/summary').then(setData);
  }, []);

  if (!data) {
    return (
      <Shell>
        <div className="flex items-center gap-3 text-ink-500">
          <span className="font-display italic text-2xl">Compilando la edición de hoy…</span>
        </div>
      </Shell>
    );
  }

  const today = new Date();
  const longDate = today.toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const kpis = [
    {
      eyebrow: 'Catálogo vigente',
      figure: data.totalActive,
      caption: `de ${data.totalProducts} referencias totales`,
      hint: 'productos activos',
    },
    {
      eyebrow: 'Entradas del día',
      figure: data.entradasHoy,
      caption: 'unidades recibidas',
      hint: 'ingresos hoy',
    },
    {
      eyebrow: 'Salidas del día',
      figure: data.salidasHoy,
      caption: 'unidades despachadas',
      hint: 'salidas hoy',
    },
    {
      eyebrow: 'Caja del día',
      figure: data.ventasHoy,
      caption: `S/ ${Number(data.montoVentasHoy).toFixed(2)}`,
      hint: 'comprobantes',
      currency: true,
    },
  ];

  return (
    <Shell>
      {/* ─── MASTHEAD ─── */}
      <header className="mb-12">
        <div className="flex items-baseline justify-between mb-3">
          <span className="eyebrow">Sección I · Boletín</span>
          <span className="mono-num text-[10px] uppercase tracking-widest2 text-ink-500">
            Edición {today.toISOString().slice(0, 10).replace(/-/g, '.')}
          </span>
        </div>
        <div className="double-rule">
          <h1 className="font-display text-[88px] leading-[0.92] tracking-tight text-ink py-2">
            Operaciones <span className="italic text-ember">de hoy</span>
          </h1>
        </div>
        <div className="flex items-end justify-between mt-4">
          <p className="font-display italic text-xl text-ink-500 max-w-md leading-snug">
            «Aire fresco para el norte chico,<br/>cifras frescas para la oficina.»
          </p>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest2 text-ink-500">Bitácora</div>
            <div className="font-display text-2xl text-ink mt-0.5">{longDate}</div>
          </div>
        </div>
      </header>

      {/* ─── KPI TICKER ─── */}
      <section className="mb-14 animate-rise-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t border-b border-ink/60">
          {kpis.map((k, i) => (
            <div
              key={k.eyebrow}
              className={[
                'px-6 py-7 relative',
                i > 0 ? 'lg:border-l border-ink/15' : '',
                i === 1 || i === 3 ? 'md:border-l md:border-ink/15 lg:border-l lg:border-ink/15' : '',
              ].join(' ')}
            >
              <div className="text-[10px] uppercase tracking-widest2 text-ink-500 mb-3">
                {k.eyebrow}
              </div>
              <div className="font-display text-[68px] leading-none text-ink tabular-nums">
                {k.currency && <span className="text-ember align-top text-2xl mr-0.5">S/</span>}
                {k.currency ? Number(data.montoVentasHoy).toFixed(0) : k.figure}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest2 text-ink-300">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-xs text-ink-500 italic font-display">
                  {k.caption}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── ALERTAS + COLUMNA EDITORIAL ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Tabla de stock mínimo */}
        <div className="lg:col-span-2">
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="eyebrow mb-2">Alertas · § II</div>
              <h2 className="font-display text-4xl text-ink leading-none">
                Stock por <span className="italic">debajo del mínimo</span>
              </h2>
            </div>
            {data.lowStockCount > 0 ? (
              <div className="stamp-ember">
                {data.lowStockCount} {data.lowStockCount === 1 ? 'producto' : 'productos'}
              </div>
            ) : (
              <div className="stamp-moss">Sin alertas</div>
            )}
          </div>

          {data.lowStockProducts.length === 0 ? (
            <div className="card flex items-center gap-4 py-10">
              <div className="font-display text-7xl italic text-moss">✓</div>
              <div>
                <div className="font-display text-2xl text-ink">Inventario en orden.</div>
                <p className="text-sm text-ink-500 mt-1">
                  Todos los productos están por encima de su umbral mínimo.
                  Buen día para enfocarse en despachos.
                </p>
              </div>
            </div>
          ) : (
            <div className="card-bare overflow-x-auto">
              <table className="ed-table">
                <thead>
                  <tr>
                    <th style={{width: '2rem'}}>№</th>
                    <th>SKU</th>
                    <th>Producto</th>
                    <th className="text-right">Stock</th>
                    <th className="text-right">Mínimo</th>
                    <th className="text-right">Severidad</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lowStockProducts.map((p, idx) => {
                    const sev = p.stock === 0 ? 'agotado' : 'bajo';
                    return (
                      <tr key={p.id}>
                        <td className="mono-num text-[10px] text-ink-300">
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td className="mono-num text-xs text-ink-500">{p.sku}</td>
                        <td className="font-display text-lg text-ink leading-tight">{p.name}</td>
                        <td className="text-right">
                          <span className={`mono-num text-2xl font-display ${p.stock === 0 ? 'text-ember' : 'text-ink'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="text-right mono-num text-sm text-ink-500">{p.minStock}</td>
                        <td className="text-right">
                          {sev === 'agotado' ? (
                            <span className="stamp-ember">AGOTADO</span>
                          ) : (
                            <span className="stamp-ink">BAJO</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Columna editorial */}
        <aside className="lg:border-l lg:border-ink/15 lg:pl-10">
          <div className="eyebrow mb-2">Editorial · § III</div>
          <h3 className="font-display text-3xl text-ink leading-tight mb-4">
            Notas del<br/><span className="italic text-ember">administrador.</span>
          </h3>
          <div className="dotted-rule mb-5" />

          <div className="space-y-5 text-sm leading-relaxed text-ink-700">
            <p>
              <span className="font-display text-3xl float-left mr-2 leading-none italic text-ember">L</span>
              a jornada se abre con <strong className="font-medium">{data.entradasHoy}</strong> unidades recién
              llegadas y <strong className="font-medium">{data.salidasHoy}</strong> ya en manos del cliente.
              El catálogo cuenta con {data.totalActive} referencias listas para despacho.
            </p>

            {data.lowStockCount > 0 && (
              <p className="text-ink-700">
                Hay <strong className="text-ember">{data.lowStockCount}</strong>{' '}
                {data.lowStockCount === 1 ? 'producto' : 'productos'} por debajo del umbral.
                Considere reponer antes del fin de semana.
              </p>
            )}

            <p className="font-display italic text-ink-500 text-base">
              Cuide los flujos de aire — y los flujos de caja.
            </p>
          </div>

          <div className="hairline mt-8 mb-5" />

          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="font-display text-4xl text-ink mono-num">{data.ventasHoy}</div>
              <div className="text-[10px] uppercase tracking-widest2 text-ink-500 mt-1">
                Comprobantes
              </div>
            </div>
            <div>
              <div className="font-display text-4xl text-ember mono-num">
                {data.totalProducts - data.totalActive}
              </div>
              <div className="text-[10px] uppercase tracking-widest2 text-ink-500 mt-1">
                Deshabilitados
              </div>
            </div>
          </div>
        </aside>
      </section>
    </Shell>
  );
}
