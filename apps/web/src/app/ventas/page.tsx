'use client';

import { useEffect, useState } from 'react';
import { Shell } from '@/components/Shell';
import { apiClient, ApiError } from '@/lib/api';

type Product = {
  id: string;
  sku: string;
  name: string;
  brand?: string;
  price: string;
  stock: number;
  active: boolean;
};

type CartItem = {
  productId: string;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  stock: number;
};

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);

  function loadProducts(q = search) {
    const params = new URLSearchParams();
    params.set('active', 'true');
    if (q) params.set('q', q);
    apiClient.get<Product[]>(`/api/products?${params.toString()}`).then(setProducts);
  }

  useEffect(() => loadProducts(), [search]);

  function addToCart(p: Product) {
    if (p.stock <= 0) return;
    setCart((c) => {
      const found = c.find((i) => i.productId === p.id);
      if (found) {
        if (found.quantity >= p.stock) return c;
        return c.map((i) => (i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...c,
        { productId: p.id, sku: p.sku, name: p.name, unitPrice: Number(p.price), quantity: 1, stock: p.stock },
      ];
    });
  }

  function updateQty(id: string, qty: number) {
    setCart((c) =>
      c.map((i) =>
        i.productId === id ? { ...i, quantity: Math.max(1, Math.min(i.stock, qty)) } : i
      )
    );
  }

  function removeItem(id: string) {
    setCart((c) => c.filter((i) => i.productId !== id));
  }

  const total = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  async function confirmSale() {
    setError(null);
    try {
      const result = await apiClient.post<{ sale: { receiptNumber: string } }>(
        '/api/inventory/sale',
        {
          items: cart.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        }
      );
      setLastReceipt(result.sale.receiptNumber);
      setCart([]);
      loadProducts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al registrar venta');
    }
  }

  return (
    <Shell>
      {/* MASTHEAD */}
      <header className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <span className="eyebrow">Sección III · Despachos</span>
          <span className="mono-num text-[10px] uppercase tracking-widest2 text-ink-500">
            Mostrador · venta directa
          </span>
        </div>
        <div className="double-rule">
          <h1 className="font-display text-[72px] leading-[0.95] tracking-tight text-ink py-1">
            Registro <span className="italic text-ember">de venta</span>
          </h1>
        </div>
        <p className="font-display italic text-lg text-ink-500 mt-3 max-w-xl">
          Seleccione los ventiladores; el sistema descuenta del inventario al confirmar.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* CATÁLOGO */}
        <div className="lg:col-span-3">
          <div className="border-t border-b border-ink/30 mb-5 px-1 py-4">
            <div className="text-[10px] uppercase tracking-widest2 text-ink-500 mb-1">
              Buscar en catálogo activo
            </div>
            <input
              className="input text-xl font-display italic placeholder:not-italic placeholder:font-sans placeholder:text-base"
              placeholder="nombre, SKU o marca…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="card-bare overflow-x-auto">
            <table className="ed-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th className="text-right">Precio</th>
                  <th className="text-right">Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="mono-num text-xs text-ink-500">{p.sku}</td>
                    <td className="font-display text-lg text-ink leading-tight">{p.name}</td>
                    <td className="text-right">
                      <span className="font-display text-lg mono-num">
                        <span className="text-xs align-top text-ink-500">S/</span>
                        {Number(p.price).toFixed(2)}
                      </span>
                    </td>
                    <td className="text-right">
                      {p.stock === 0 ? (
                        <span className="stamp-ember">AGOTADO</span>
                      ) : (
                        <span className="mono-num text-lg font-display text-moss">{p.stock}</span>
                      )}
                    </td>
                    <td className="text-right">
                      <button
                        disabled={p.stock === 0}
                        onClick={() => addToCart(p)}
                        className="btn-ghost hover:!text-ember"
                      >
                        + agregar
                      </button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 font-display italic text-ink-500">
                      Sin resultados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* COMPROBANTE / CARRITO */}
        <aside className="lg:col-span-2">
          <div className="sticky top-20 bg-paper-50 border border-ink/40 p-7 relative">
            {/* receipt holes/teeth */}
            <div className="absolute -top-1 left-0 right-0 flex justify-around pointer-events-none">
              {Array.from({length: 24}).map((_, i) => (
                <span key={i} className="w-1.5 h-1.5 bg-paper border border-ink/40 rounded-full" />
              ))}
            </div>

            <div className="flex items-baseline justify-between mb-1 mt-2">
              <span className="eyebrow">Comprobante</span>
              <span className="mono-num text-[10px] text-ink-500">
                {new Date().toLocaleString('es-PE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h2 className="font-display text-3xl text-ink leading-none mb-5">
              {cart.length === 0 ? (
                <>Carrito <span className="italic text-ink-300">vacío.</span></>
              ) : (
                <>{totalItems} {totalItems === 1 ? 'pieza' : 'piezas'} <span className="italic">por despachar.</span></>
              )}
            </h2>

            <div className="hairline mb-4" />

            {cart.length === 0 ? (
              <p className="font-display italic text-ink-500 leading-snug">
                Agregue ventiladores del catálogo para construir la nota de venta.
              </p>
            ) : (
              <>
                <div className="space-y-4 mb-5">
                  {cart.map((item) => (
                    <div key={item.productId} className="border-b border-ink/10 pb-3 last:border-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-display text-base text-ink leading-tight">
                            {item.name}
                          </div>
                          <div className="mono-num text-[10px] text-ink-500 mt-0.5">
                            {item.sku} · S/ {item.unitPrice.toFixed(2)} c/u
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-ember text-xs leading-none mt-1"
                          aria-label="quitar"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-ink/30">
                          <button
                            onClick={() => updateQty(item.productId, item.quantity - 1)}
                            className="px-2.5 py-1 text-sm hover:bg-ink hover:text-paper transition-colors"
                          >−</button>
                          <input
                            type="number"
                            min={1}
                            max={item.stock}
                            value={item.quantity}
                            onChange={(e) => updateQty(item.productId, Number(e.target.value))}
                            className="w-10 text-center mono-num bg-transparent text-sm focus:outline-none"
                          />
                          <button
                            onClick={() => updateQty(item.productId, item.quantity + 1)}
                            className="px-2.5 py-1 text-sm hover:bg-ink hover:text-paper transition-colors"
                          >+</button>
                        </div>
                        <div className="font-display text-lg mono-num text-ink">
                          <span className="text-xs text-ink-500 align-top">S/</span>
                          {(item.unitPrice * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="dotted-rule mb-3" />
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-widest2 text-ink-500">Subtotal</span>
                  <span className="mono-num text-ink-500">S/ {total.toFixed(2)}</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-ink mt-2 pt-2">
                  <span className="font-display italic text-xl text-ink">Total</span>
                  <span className="font-display text-4xl mono-num text-ember">
                    <span className="text-base align-top text-ember">S/</span>
                    {total.toFixed(2)}
                  </span>
                </div>

                {error && (
                  <div className="flex items-start gap-3 py-3 mt-4 border-y border-ember">
                    <span className="stamp-ember mt-0.5">Error</span>
                    <span className="text-sm text-ink leading-snug">{error}</span>
                  </div>
                )}

                <button onClick={confirmSale} className="btn-primary w-full mt-5">
                  Confirmar despacho →
                </button>
              </>
            )}

            {lastReceipt && (
              <div className="mt-5 p-4 border border-moss text-center bg-moss/5">
                <div className="text-[10px] uppercase tracking-widest2 text-moss">Venta registrada</div>
                <div className="font-display text-2xl text-ink mt-1 mono-num">{lastReceipt}</div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </Shell>
  );
}
