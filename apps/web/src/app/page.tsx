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

  if (!data) return <Shell><div className="text-slate-500">Cargando dashboard...</div></Shell>;

  const cards = [
    { label: 'Productos activos', value: data.totalActive, sub: `${data.totalProducts} totales` },
    { label: 'Entradas de hoy', value: data.entradasHoy, sub: 'unidades' },
    { label: 'Salidas de hoy', value: data.salidasHoy, sub: 'unidades' },
    { label: 'Ventas de hoy', value: data.ventasHoy, sub: `S/. ${Number(data.montoVentasHoy).toFixed(2)}` },
  ];

  return (
    <Shell>
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-sm text-slate-500 mb-6">Resumen de la operacion en tiempo real</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <div className="text-xs uppercase tracking-wider text-slate-500">{c.label}</div>
            <div className="text-3xl font-bold mt-2 text-slate-900">{c.value}</div>
            <div className="text-xs text-slate-400 mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Alertas de stock minimo</h2>
          <span className="rounded-full bg-red-50 text-red-700 text-xs px-2 py-0.5 border border-red-200">
            {data.lowStockCount} producto(s)
          </span>
        </div>
        {data.lowStockProducts.length === 0 ? (
          <p className="text-sm text-slate-500">Sin alertas. El stock esta sobre el minimo.</p>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="table-th">SKU</th>
                <th className="table-th">Producto</th>
                <th className="table-th text-right">Stock</th>
                <th className="table-th text-right">Minimo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.lowStockProducts.map((p) => (
                <tr key={p.id}>
                  <td className="table-td font-mono text-xs">{p.sku}</td>
                  <td className="table-td">{p.name}</td>
                  <td className="table-td text-right">
                    <span className={p.stock === 0 ? 'text-red-700 font-semibold' : 'text-amber-700 font-semibold'}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="table-td text-right text-slate-500">{p.minStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  );
}
