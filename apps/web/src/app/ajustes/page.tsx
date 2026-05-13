'use client';

import { useEffect, useState } from 'react';
import { Shell } from '@/components/Shell';
import { apiClient, ApiError } from '@/lib/api';

type Product = { id: string; sku: string; name: string; stock: number };
type Reason = 'DANIO' | 'ROBO' | 'ERROR_PREVIO' | 'CONTEO_FISICO' | 'OTRO';

const REASONS: { value: Reason; label: string; sub: string }[] = [
  { value: 'DANIO',         label: 'Daño / merma',           sub: 'rotura, defectos, deterioro' },
  { value: 'ROBO',          label: 'Robo',                   sub: 'sustracción confirmada' },
  { value: 'ERROR_PREVIO',  label: 'Error de registro',      sub: 'corrección de captura previa' },
  { value: 'CONTEO_FISICO', label: 'Conteo físico',          sub: 'cuadre con almacén' },
  { value: 'OTRO',          label: 'Otro motivo',            sub: 'detallar en la nota' },
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
    if (!reason) return setError('Seleccione un motivo');
    if (!productId) return setError('Seleccione un producto');
    if (quantity === 0) return setError('La cantidad no puede ser 0');
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

  const product = products.find(p => p.id === productId);
  const newStock = product ? product.stock + quantity : null;

  return (
    <Shell>
      <header className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <span className="eyebrow">Sección V · Ajustes</span>
          <span className="mono-num text-[10px] uppercase tracking-widest2 text-ink-500">
            Cuadre fino · uso restringido
          </span>
        </div>
        <div className="double-rule">
          <h1 className="font-display text-[72px] leading-[0.95] tracking-tight text-ink py-1">
            Ajuste <span className="italic text-ember">de inventario.</span>
          </h1>
        </div>
        <p className="font-display italic text-lg text-ink-500 mt-3 max-w-2xl">
          Sume o reste unidades cuando el sistema y el almacén no coincidan.
          Toda corrección queda registrada en el kárdex.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* FORM */}
        <form onSubmit={onSubmit} className="lg:col-span-3 space-y-8">
          {/* Reason picker */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest2 text-ink-500 mb-3">
              Motivo del ajuste
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border-t border-b border-ink/30">
              {REASONS.map((r, i) => {
                const active = reason === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReason(r.value)}
                    className={[
                      'text-left px-5 py-4 transition-colors border-ink/15',
                      i % 2 === 1 ? 'sm:border-l' : '',
                      i >= 2 ? 'border-t' : 'border-t sm:border-t-0',
                      i === 4 ? 'border-t' : '',
                      active ? 'bg-ink text-paper' : 'hover:bg-paper-200',
                    ].join(' ')}
                  >
                    <div className={`font-display text-xl leading-none ${active ? 'italic text-ember' : 'text-ink'}`}>
                      {r.label}
                    </div>
                    <div className={`text-[11px] mt-1 ${active ? 'text-paper-200' : 'text-ink-500'}`}>
                      {r.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest2 text-ink-500 mb-2">
              Producto a ajustar
            </label>
            <select className="input text-xl font-display italic" value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">— Selecciona —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.sku} · {p.name} (stock {p.stock})</option>
              ))}
            </select>
          </div>

          {/* Quantity with explicit +/- */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest2 text-ink-500 mb-3">
              Cantidad
              <span className="ml-2 normal-case text-ink-300 tracking-normal font-display italic text-sm">
                positivo suma, negativo resta
              </span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(q => -Math.abs(q || 1))}
                className={`btn ${quantity < 0 ? 'bg-ember border-ember text-paper' : 'btn-secondary'}`}
              >
                − Resta
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="input text-center font-display text-4xl mono-num flex-1"
              />
              <button
                type="button"
                onClick={() => setQuantity(q => Math.abs(q || 1))}
                className={`btn ${quantity > 0 ? 'bg-moss border-moss text-paper' : 'btn-secondary'}`}
              >
                + Suma
              </button>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest2 text-ink-500 mb-2">
              Nota
            </label>
            <textarea
              className="input"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Detalle del motivo, número de acta, responsable…"
            />
          </div>

          {error && (
            <div className="flex items-start gap-3 py-3 border-y border-ember">
              <span className="stamp-ember mt-0.5">Error</span>
              <span className="text-sm text-ink leading-snug">{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 py-3 border-y border-moss">
              <span className="stamp-moss">✓ Asentado</span>
              <span className="font-display italic text-xl text-ink">{success}.</span>
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" className="btn-primary">
              Asentar ajuste →
            </button>
          </div>
        </form>

        {/* PREVIEW */}
        <aside className="lg:col-span-2">
          <div className="sticky top-20 border border-ink/30 p-7 bg-paper-50">
            <div className="eyebrow mb-3">Vista previa</div>
            <h3 className="font-display text-3xl text-ink leading-none mb-5">
              Antes <span className="italic text-ember">/ después.</span>
            </h3>

            {product ? (
              <>
                <div className="mb-2 mono-num text-xs text-ink-500">{product.sku}</div>
                <div className="font-display text-2xl text-ink leading-tight mb-5">
                  {product.name}
                </div>

                <div className="dotted-rule mb-4" />

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest2 text-ink-500">Actual</div>
                    <div className="font-display text-6xl mono-num text-ink-500 mt-1 leading-none">
                      {product.stock}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest2 text-ink-500">Resultado</div>
                    <div className={`font-display text-6xl mono-num mt-1 leading-none ${
                      newStock !== null && newStock < 0 ? 'text-ember' : 'text-ink'
                    }`}>
                      {newStock}
                    </div>
                  </div>
                </div>

                <div className="dotted-rule mt-4 mb-2" />
                <div className="text-center mt-3">
                  <span className={`font-display text-xl ${quantity > 0 ? 'text-moss' : 'text-ember'}`}>
                    {quantity > 0 ? '+' : ''}{quantity}{' '}
                    <span className="italic text-ink-500 text-base">unidades</span>
                  </span>
                </div>

                {newStock !== null && newStock < 0 && (
                  <div className="mt-5 stamp-ember w-full justify-center py-1.5">
                    Stock quedaría negativo
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center">
                <div className="font-display italic text-xl text-ink-500">
                  Seleccione un producto para ver el resultado del ajuste.
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </Shell>
  );
}
