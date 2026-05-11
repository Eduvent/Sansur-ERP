'use client';

import { useEffect, useState } from 'react';
import { Shell } from '@/components/Shell';
import { apiClient, ApiError } from '@/lib/api';

type Product = { id: string; sku: string; name: string; brand: string; stock: number };
type Supplier = { id: string; name: string };

type Row = { productId: string; quantity: number; unitPrice: number };

export default function StockInPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [note, setNote] = useState('');
  const [rows, setRows] = useState<Row[]>([{ productId: '', quantity: 1, unitPrice: 0 }]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<Product[]>('/api/products?active=true').then(setProducts);
    apiClient.get<Supplier[]>('/api/suppliers').then(setSuppliers);
  }, []);

  function updateRow(idx: number, patch: Partial<Row>) {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }
  function addRow() {
    setRows((r) => [...r, { productId: '', quantity: 1, unitPrice: 0 }]);
  }
  function removeRow(idx: number) {
    setRows((r) => r.filter((_, i) => i !== idx));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const items = rows.filter((r) => r.productId && r.quantity > 0);
    if (items.length === 0) {
      setError('Agrega al menos un producto');
      return;
    }
    try {
      await apiClient.post('/api/inventory/stock-in', {
        supplierId: supplierId || undefined,
        note: note || undefined,
        items,
      });
      setSuccess('Ingreso registrado correctamente');
      setRows([{ productId: '', quantity: 1, unitPrice: 0 }]);
      setSupplierId('');
      setNote('');
      apiClient.get<Product[]>('/api/products?active=true').then(setProducts);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al registrar');
    }
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold mb-1">Registrar Ingreso de Mercaderia</h1>
      <p className="text-sm text-slate-500 mb-6">Suma unidades al stock al recibir productos del proveedor</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="card grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-600">Proveedor</label>
            <select className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">— Sin proveedor —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-600">Observacion</label>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lote, factura, etc..." />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Productos</h2>
            <button type="button" onClick={addRow} className="btn-secondary text-xs">+ Linea</button>
          </div>
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="table-th">Producto</th>
                <th className="table-th text-right">Cantidad</th>
                <th className="table-th text-right">Costo unit.</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="py-2 pr-2">
                    <select
                      className="input"
                      value={row.productId}
                      onChange={(e) => updateRow(idx, { productId: e.target.value })}
                    >
                      <option value="">Selecciona...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.sku} — {p.name} (stock {p.stock})</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min={1}
                      className="input text-right"
                      value={row.quantity}
                      onChange={(e) => updateRow(idx, { quantity: Number(e.target.value) })}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      className="input text-right"
                      value={row.unitPrice}
                      onChange={(e) => updateRow(idx, { unitPrice: Number(e.target.value) })}
                    />
                  </td>
                  <td className="py-2 text-right">
                    {rows.length > 1 && (
                      <button type="button" onClick={() => removeRow(idx)} className="text-red-600 text-xs">X</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && <div className="card text-sm text-red-700 bg-red-50 border-red-200">{error}</div>}
        {success && <div className="card text-sm text-emerald-700 bg-emerald-50 border-emerald-200">{success}</div>}

        <div className="flex justify-end">
          <button type="submit" className="btn-primary">Registrar ingreso</button>
        </div>
      </form>
    </Shell>
  );
}
