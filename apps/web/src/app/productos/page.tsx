'use client';

import { useEffect, useState } from 'react';
import { Shell } from '@/components/Shell';
import { apiClient, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Product = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string | null;
  power: number | null;
  price: string;
  stock: number;
  minStock: number;
  active: boolean;
};

const empty = {
  sku: '',
  name: '',
  brand: '',
  description: '',
  category: '',
  power: '',
  price: '',
  minStock: '5',
};

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  function load() {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    apiClient.get<Product[]>(`/api/products?${params.toString()}`).then(setProducts);
  }
  useEffect(load, [search]);

  function openCreate() {
    setForm({ ...empty });
    setEditingId(null);
    setError(null);
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setForm({
      sku: p.sku,
      name: p.name,
      brand: p.brand,
      description: '',
      category: p.category ?? '',
      power: p.power?.toString() ?? '',
      price: p.price,
      minStock: p.minStock.toString(),
    });
    setEditingId(p.id);
    setError(null);
    setShowModal(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      sku: form.sku,
      name: form.name,
      brand: form.brand,
      description: form.description || undefined,
      category: form.category || undefined,
      power: form.power ? Number(form.power) : undefined,
      price: Number(form.price),
      minStock: Number(form.minStock),
    };
    try {
      if (editingId) {
        await apiClient.put(`/api/products/${editingId}`, payload);
      } else {
        await apiClient.post('/api/products', payload);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar');
    }
  }

  async function onDisable(id: string) {
    if (!confirm('Deshabilitar este producto?')) return;
    await apiClient.delete(`/api/products/${id}`);
    load();
  }

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Catalogo de Productos</h1>
          <p className="text-sm text-slate-500">Gestiona los ventiladores del inventario</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="btn-primary">
            + Registrar ventilador
          </button>
        )}
      </div>

      <div className="card mb-4">
        <input
          className="input"
          placeholder="Buscar por SKU, nombre o marca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="table-th">SKU</th>
              <th className="table-th">Producto</th>
              <th className="table-th">Marca</th>
              <th className="table-th">Categoria</th>
              <th className="table-th text-right">Precio</th>
              <th className="table-th text-right">Stock</th>
              <th className="table-th text-right">Estado</th>
              {isAdmin && <th className="table-th text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => (
              <tr key={p.id} className={!p.active ? 'opacity-50' : ''}>
                <td className="table-td font-mono text-xs">{p.sku}</td>
                <td className="table-td font-medium">{p.name}</td>
                <td className="table-td">{p.brand}</td>
                <td className="table-td capitalize">{p.category ?? '—'}</td>
                <td className="table-td text-right">S/. {Number(p.price).toFixed(2)}</td>
                <td className="table-td text-right">
                  {p.stock === 0 ? (
                    <span className="inline-block rounded bg-red-100 text-red-800 px-2 py-0.5 text-xs font-semibold">Agotado</span>
                  ) : p.stock <= p.minStock ? (
                    <span className="inline-block rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-semibold">Bajo: {p.stock}</span>
                  ) : (
                    <span className="inline-block rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-xs font-semibold">Stock: {p.stock}</span>
                  )}
                </td>
                <td className="table-td text-right">
                  {p.active ? <span className="text-emerald-700">Activo</span> : <span className="text-slate-500">Inactivo</span>}
                </td>
                {isAdmin && (
                  <td className="table-td text-right space-x-2">
                    <button onClick={() => openEdit(p)} className="text-brand hover:underline text-xs">Editar</button>
                    {p.active && (
                      <button onClick={() => onDisable(p.id)} className="text-red-600 hover:underline text-xs">Deshabilitar</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="text-center text-slate-400 py-8">
                  No se encontraron coincidencias
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? 'Editar producto' : 'Nuevo ventilador'}
            </h2>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600">SKU *</label>
                  <input className="input" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-slate-600">Marca *</label>
                  <input className="input" required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-600">Nombre *</label>
                <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-600">Descripcion</label>
                <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-600">Categoria</label>
                  <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="">—</option>
                    <option value="pie">Pie</option>
                    <option value="mesa">Mesa</option>
                    <option value="techo">Techo</option>
                    <option value="pared">Pared</option>
                    <option value="torre">Torre</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600">Potencia (W)</label>
                  <input className="input" type="number" value={form.power} onChange={(e) => setForm({ ...form, power: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-slate-600">Stock minimo</label>
                  <input className="input" type="number" min="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-600">Precio (S/.) *</label>
                <input className="input" type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Shell>
  );
}
