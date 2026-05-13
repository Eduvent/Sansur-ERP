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

  const totalUnits = rows.reduce((s, r) => s + (r.quantity || 0), 0);
  const totalCost = rows.reduce((s, r) => s + (r.quantity || 0) * (r.unitPrice || 0), 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const items = rows.filter((r) => r.productId && r.quantity > 0);
    if (items.length === 0) {
      setError('Agregue al menos un producto');
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

  const supplierName = suppliers.find(s => s.id === supplierId)?.name;

  return (
    <Shell>
      <header className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <span className="eyebrow">Sección IV · Mercadería</span>
          <span className="mono-num text-[10px] uppercase tracking-widest2 text-ink-500">
            Acta de recepción
          </span>
        </div>
        <div className="double-rule">
          <h1 className="font-display text-[72px] leading-[0.95] tracking-tight text-ink py-1">
            Registro <span className="italic text-ember">de ingreso.</span>
          </h1>
        </div>
        <p className="font-display italic text-lg text-ink-500 mt-3 max-w-2xl">
          Levante el acta cuando la mercadería entre al almacén — suma al stock y queda en el kárdex.
        </p>
      </header>

      <form onSubmit={onSubmit}>
        {/* CABECERA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-8 pb-8 border-b border-ink/15">
          <div>
            <label className="block text-[10px] uppercase tracking-widest2 text-ink-500 mb-2">
              Proveedor
            </label>
            <select className="input text-xl font-display italic" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="" className="italic">— Sin proveedor —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {supplierName && (
              <div className="text-xs text-ink-500 mt-2">
                Acta dirigida a: <span className="font-display text-base text-ink italic">{supplierName}</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest2 text-ink-500 mb-2">
              Observación · lote, factura
            </label>
            <input
              className="input font-display text-xl"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Factura, lote, etc…"
            />
          </div>
        </div>

        {/* DETALLE */}
        <div className="mb-6">
          <div className="flex items-end justify-between mb-4">
            <h2 className="font-display text-3xl text-ink leading-none">
              Detalle <span className="italic text-ember">del ingreso</span>
            </h2>
            <button type="button" onClick={addRow} className="btn-secondary">
              + Línea
            </button>
          </div>

          <div className="card-bare overflow-x-auto">
            <table className="ed-table">
              <thead>
                <tr>
                  <th style={{width:'2.5rem'}}>№</th>
                  <th>Producto</th>
                  <th className="text-right" style={{width:'8rem'}}>Cantidad</th>
                  <th className="text-right" style={{width:'10rem'}}>Costo unit.</th>
                  <th className="text-right" style={{width:'10rem'}}>Subtotal</th>
                  <th style={{width:'2rem'}}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="mono-num text-[10px] text-ink-300">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td>
                      <select
                        className="input"
                        value={row.productId}
                        onChange={(e) => updateRow(idx, { productId: e.target.value })}
                      >
                        <option value="">— Selecciona —</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.sku} · {p.name} (stock {p.stock})</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        className="input text-right mono-num font-display text-lg"
                        value={row.quantity}
                        onChange={(e) => updateRow(idx, { quantity: Number(e.target.value) })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        className="input text-right mono-num"
                        value={row.unitPrice}
                        onChange={(e) => updateRow(idx, { unitPrice: Number(e.target.value) })}
                      />
                    </td>
                    <td className="text-right">
                      <span className="mono-num font-display text-lg text-ink">
                        <span className="text-xs align-top text-ink-500">S/</span>
                        {(row.quantity * row.unitPrice).toFixed(2)}
                      </span>
                    </td>
                    <td className="text-right">
                      {rows.length > 1 && (
                        <button type="button" onClick={() => removeRow(idx)} className="text-ember text-sm">
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOTALES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 py-6 border-t border-b border-ink/30">
          <div>
            <div className="text-[10px] uppercase tracking-widest2 text-ink-500">Líneas</div>
            <div className="font-display text-4xl mono-num text-ink mt-1">
              {String(rows.length).padStart(2, '0')}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest2 text-ink-500">Unidades</div>
            <div className="font-display text-4xl mono-num text-ink mt-1">
              {totalUnits}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest2 text-ink-500">Costo total</div>
            <div className="font-display text-5xl mono-num text-ember mt-1">
              <span className="text-lg align-top">S/</span>
              {totalCost.toFixed(2)}
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 py-4 mb-6 border-y border-ember">
            <span className="stamp-ember mt-0.5">Error</span>
            <span className="text-sm text-ink leading-snug">{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 py-4 mb-6 border-y border-moss">
            <span className="stamp-moss mt-0.5">✓ Asentado</span>
            <span className="font-display italic text-xl text-ink leading-snug">{success}.</span>
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" className="btn-primary">
            Asentar ingreso →
          </button>
        </div>
      </form>
    </Shell>
  );
}
