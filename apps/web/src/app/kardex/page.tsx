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

const TYPE_LABEL: Record<Movement['type'], { label: string; color: string }> = {
  ENTRADA:    { label: 'Ingreso',     color: 'bg-emerald-100 text-emerald-800' },
  SALIDA:     { label: 'Venta',       color: 'bg-blue-100 text-blue-800' },
  AJUSTE:     { label: 'Ajuste',      color: 'bg-amber-100 text-amber-800' },
  DEVOLUCION: { label: 'Devolucion',  color: 'bg-purple-100 text-purple-800' },
};

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
      <h1 className="text-2xl font-bold mb-1">Kardex — Historial de Movimientos</h1>
      <p className="text-sm text-slate-500 mb-6">Trazabilidad completa de entradas, salidas, ajustes y devoluciones</p>

      <div className="card mb-4 flex gap-3 items-center">
        <label className="text-sm text-slate-600">Filtrar por tipo:</label>
        <select className="input max-w-xs" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Todos</option>
          <option value="ENTRADA">Ingresos</option>
          <option value="SALIDA">Ventas</option>
          <option value="AJUSTE">Ajustes</option>
          <option value="DEVOLUCION">Devoluciones</option>
        </select>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="table-th">Fecha</th>
              <th className="table-th">Tipo</th>
              <th className="table-th">Detalle</th>
              <th className="table-th">Items</th>
              <th className="table-th">Responsable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {movements.map((m) => {
              const meta = TYPE_LABEL[m.type];
              return (
                <tr key={m.id} className="align-top">
                  <td className="table-td whitespace-nowrap">
                    {new Date(m.createdAt).toLocaleString('es-PE')}
                  </td>
                  <td className="table-td">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${meta.color}`}>
                      {meta.label}
                    </span>
                  </td>
                  <td className="table-td text-xs text-slate-600">
                    {m.sale && <div>Comprobante: <strong>{m.sale.receiptNumber}</strong></div>}
                    {m.supplier && <div>Proveedor: {m.supplier.name}</div>}
                    {m.reason && <div>Motivo: {m.reason}</div>}
                    {m.note && <div className="italic">{m.note}</div>}
                  </td>
                  <td className="table-td">
                    <ul className="text-xs space-y-1">
                      {m.items.map((it, i) => (
                        <li key={i}>
                          <span className="font-mono text-slate-500">{it.product.sku}</span> — {it.product.name}
                          <span className="ml-2 font-semibold">x{it.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="table-td text-xs">{m.user.fullName}</td>
                </tr>
              );
            })}
            {movements.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-slate-400 py-8">
                  Sin movimientos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
