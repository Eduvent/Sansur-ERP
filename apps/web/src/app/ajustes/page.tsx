'use client';

import { useEffect, useState } from 'react';
import { Shell } from '@/components/Shell';
import { apiClient, ApiError } from '@/lib/api';

type Product = { id: string; sku: string; name: string; stock: number };
type Reason = 'DANIO' | 'ROBO' | 'ERROR_PREVIO' | 'CONTEO_FISICO' | 'OTRO';

const REASONS: { value: Reason; label: string }[] = [
  { value: 'DANIO', label: 'Daño / merma' },
  { value: 'ROBO', label: 'Robo' },
  { value: 'ERROR_PREVIO', label: 'Error de registro previo' },
  { value: 'CONTEO_FISICO', label: 'Conteo fisico' },
  { value: 'OTRO', label: 'Otro' },
];

export default function AdjustmentsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(-1);
  const [reason, setReason] = useState<Reason | ''>('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<Product[]>('/api/products?active=true').then(setProducts);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!reason) {
      setError('Selecciona un motivo');
      return;
    }
    if (!productId) {
      setError('Selecciona un producto');
      return;
    }
    if (quantity === 0) {
      setError('La cantidad no puede ser 0');
      return;
    }
    try {
      await apiClient.post('/api/inventory/adjustment', {
        reason,
        note: note || undefined,
        items: [{ productId, quantity }],
      });
      setSuccess('Ajuste registrado');
      setProductId('');
      setQuantity(-1);
      setNote('');
      setReason('');
      apiClient.get<Product[]>('/api/products?active=true').then(setProducts);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al registrar');
    }
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold mb-1">Ajuste de Inventario (Mermas)</h1>
      <p className="text-sm text-slate-500 mb-6">Cuadra el sistema con el stock fisico real</p>

      <form onSubmit={onSubmit} className="card space-y-4 max-w-xl">
        <div>
          <label className="text-xs text-slate-600">Motivo *</label>
          <select className="input" value={reason} onChange={(e) => setReason(e.target.value as Reason)}>
            <option value="">Selecciona...</option>
            {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-600">Producto *</label>
          <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">Selecciona...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.sku} — {p.name} (stock {p.stock})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-600">
            Cantidad (positiva = suma al stock, negativa = resta) *
          </label>
          <input
            className="input"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-xs text-slate-600">Nota</label>
          <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
        {success && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">{success}</div>}

        <div className="flex justify-end">
          <button type="submit" className="btn-primary">Registrar ajuste</button>
        </div>
      </form>
    </Shell>
  );
}
