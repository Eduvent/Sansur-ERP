'use client';

import { useEffect, useState } from 'react';
import { Shell } from '@/components/Shell';
import { apiClient, ApiError } from '@/lib/api';

type Product = {
  id: string;
  sku: string;
  name: string;
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

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('active', 'true');
    if (search) params.set('q', search);
    apiClient.get<Product[]>(`/api/products?${params.toString()}`).then(setProducts);
  }, [search]);

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
      apiClient
        .get<Product[]>(`/api/products?${search ? 'q=' + search + '&' : ''}active=true`)
        .then(setProducts);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al registrar venta');
    }
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold mb-1">Registro de Venta</h1>
      <p className="text-sm text-slate-500 mb-6">Selecciona productos y registra la salida del inventario</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="card">
            <input
              className="input"
              placeholder="Buscar ventilador por nombre, SKU o marca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="card p-0 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="table-th">SKU</th>
                  <th className="table-th">Producto</th>
                  <th className="table-th text-right">Precio</th>
                  <th className="table-th text-right">Stock</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="table-td font-mono text-xs">{p.sku}</td>
                    <td className="table-td font-medium">{p.name}</td>
                    <td className="table-td text-right">S/. {Number(p.price).toFixed(2)}</td>
                    <td className="table-td text-right">
                      {p.stock === 0 ? (
                        <span className="text-red-700 font-semibold">Agotado</span>
                      ) : (
                        <span className="text-emerald-700">{p.stock}</span>
                      )}
                    </td>
                    <td className="table-td text-right">
                      <button
                        disabled={p.stock === 0}
                        onClick={() => addToCart(p)}
                        className="btn-primary text-xs disabled:cursor-not-allowed"
                      >
                        Agregar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card h-fit sticky top-6">
          <h2 className="font-semibold mb-3">Carrito de Venta</h2>
          {cart.length === 0 ? (
            <p className="text-sm text-slate-500">Aun no hay productos en el carrito.</p>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-slate-500">S/. {item.unitPrice.toFixed(2)} c/u</div>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={item.stock}
                    value={item.quantity}
                    onChange={(e) => updateQty(item.productId, Number(e.target.value))}
                    className="w-16 border border-slate-300 rounded px-2 py-1 text-sm text-right"
                  />
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-red-600 text-xs ml-2"
                  >
                    X
                  </button>
                </div>
              ))}
              <div className="flex justify-between border-t pt-3 font-semibold">
                <span>Total</span>
                <span>S/. {total.toFixed(2)}</span>
              </div>
              {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
              <button onClick={confirmSale} className="btn-primary w-full">Confirmar venta</button>
            </div>
          )}
          {lastReceipt && (
            <div className="mt-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
              Venta registrada: <strong>{lastReceipt}</strong>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
