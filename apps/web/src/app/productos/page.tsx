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
    if (!confirm('¿Deshabilitar este producto?')) return;
    await apiClient.delete(`/api/products/${id}`);
    load();
  }

  const activeCount = products.filter(p => p.active).length;
  const inStockCount = products.filter(p => p.stock > p.minStock).length;
  const lowCount = products.filter(p => p.active && p.stock > 0 && p.stock <= p.minStock).length;
  const outCount = products.filter(p => p.active && p.stock === 0).length;

  return (
    <Shell>
      {/* ─── MASTHEAD ─── */}
      <header className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <span className="eyebrow">Sección II · Catálogo</span>
          {isAdmin && (
            <button onClick={openCreate} className="btn-primary">
              + Registrar ventilador
            </button>
          )}
        </div>
        <div className="double-rule">
          <h1 className="font-display text-[72px] leading-[0.95] tracking-tight text-ink py-1">
            Catálogo <span className="italic text-ember">de ventiladores</span>
          </h1>
        </div>
        <p className="font-display italic text-lg text-ink-500 mt-3 max-w-2xl">
          Todo el aire del Perú, organizado por marca, categoría y potencia.
        </p>
      </header>

      {/* ─── BARRA DE BUSCADOR + RESUMEN ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 mb-8 border-t border-b border-ink/30">
        <div className="col-span-1 lg:col-span-2 px-6 py-5 lg:border-r border-ink/15">
          <div className="text-[10px] uppercase tracking-widest2 text-ink-500 mb-1">
            Buscar
          </div>
          <input
            className="input text-2xl font-display italic placeholder:not-italic placeholder:font-sans placeholder:text-base"
            placeholder="por SKU, nombre o marca…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-4 lg:grid-cols-4">
          {[
            { label: 'Activos', value: activeCount, color: 'text-ink' },
            { label: 'En stock', value: inStockCount, color: 'text-moss' },
            { label: 'Bajo', value: lowCount, color: 'text-ink' },
            { label: 'Agotado', value: outCount, color: 'text-ember' },
          ].map((s, i) => (
            <div key={s.label} className={`px-3 py-5 text-center ${i > 0 ? 'border-l border-ink/15' : ''}`}>
              <div className={`font-display text-3xl ${s.color} mono-num`}>{s.value}</div>
              <div className="text-[9px] uppercase tracking-widest2 text-ink-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── TABLA ─── */}
      <div className="card-bare overflow-x-auto">
        <table className="ed-table">
          <thead>
            <tr>
              <th style={{width:'2.5rem'}}>№</th>
              <th>SKU</th>
              <th>Producto · marca</th>
              <th>Categoría</th>
              <th className="text-right">Potencia</th>
              <th className="text-right">Precio</th>
              <th className="text-right">Stock</th>
              <th className="text-right">Estado</th>
              {isAdmin && <th className="text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {products.map((p, idx) => (
              <tr key={p.id} className={!p.active ? 'opacity-40' : ''}>
                <td className="mono-num text-[10px] text-ink-300">
                  {String(idx + 1).padStart(2, '0')}
                </td>
                <td className="mono-num text-xs text-ink-500">{p.sku}</td>
                <td>
                  <div className="font-display text-lg text-ink leading-tight">{p.name}</div>
                  <div className="text-xs text-ink-500 mt-0.5 italic font-display">{p.brand}</div>
                </td>
                <td className="text-sm text-ink-500 capitalize">{p.category ?? '—'}</td>
                <td className="text-right mono-num text-sm text-ink">
                  {p.power ? `${p.power} W` : '—'}
                </td>
                <td className="text-right">
                  <span className="font-display text-lg text-ink mono-num">
                    <span className="text-xs align-top text-ink-500">S/</span>
                    {Number(p.price).toFixed(2)}
                  </span>
                </td>
                <td className="text-right">
                  <span className={`mono-num font-display text-xl ${p.stock === 0 ? 'text-ember' : p.stock <= p.minStock ? 'text-ink' : 'text-moss'}`}>
                    {p.stock}
                  </span>
                  <span className="text-[10px] text-ink-300 ml-1 mono-num">/{p.minStock}</span>
                </td>
                <td className="text-right">
                  {!p.active ? (
                    <span className="stamp-ink opacity-60">INACTIVO</span>
                  ) : p.stock === 0 ? (
                    <span className="stamp-ember">AGOTADO</span>
                  ) : p.stock <= p.minStock ? (
                    <span className="stamp-ink">BAJO</span>
                  ) : (
                    <span className="stamp-moss">ACTIVO</span>
                  )}
                </td>
                {isAdmin && (
                  <td className="text-right whitespace-nowrap">
                    <button onClick={() => openEdit(p)} className="btn-ghost mr-3">
                      Editar
                    </button>
                    {p.active && (
                      <button onClick={() => onDisable(p.id)} className="btn-ghost hover:!text-ember">
                        Deshabilitar
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 9 : 8} className="text-center py-16">
                  <div className="font-display italic text-2xl text-ink-500">
                    Ningún ventilador coincide con esa búsqueda.
                  </div>
                  <div className="text-xs uppercase tracking-widest2 text-ink-300 mt-2">
                    Pruebe con otro término
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ─── MODAL ─── */}
      {showModal && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 animate-rise-in">
          <div className="bg-paper-50 w-full max-w-2xl border border-ink/30 shadow-paper relative">
            <div className="px-8 pt-7 pb-5 border-b border-ink/15">
              <div className="eyebrow mb-2">
                {editingId ? 'Edición · § II' : 'Alta · § II'}
              </div>
              <h2 className="font-display text-4xl text-ink leading-none">
                {editingId ? 'Editar' : 'Nuevo'} <span className="italic text-ember">ventilador</span>
              </h2>
            </div>

            <form onSubmit={onSubmit} className="px-8 py-6 space-y-5">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest2 text-ink-500 mb-1">SKU *</label>
                  <input className="input" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest2 text-ink-500 mb-1">Marca *</label>
                  <input className="input" required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest2 text-ink-500 mb-1">Nombre *</label>
                <input className="input font-display text-xl" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest2 text-ink-500 mb-1">Descripción</label>
                <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest2 text-ink-500 mb-1">Categoría</label>
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
                  <label className="block text-[10px] uppercase tracking-widest2 text-ink-500 mb-1">Potencia (W)</label>
                  <input className="input mono-num" type="number" value={form.power} onChange={(e) => setForm({ ...form, power: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest2 text-ink-500 mb-1">Stock mínimo</label>
                  <input className="input mono-num" type="number" min="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest2 text-ink-500 mb-1">Precio (S/) *</label>
                <input className="input mono-num text-xl font-display" type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>

              {error && (
                <div className="flex items-start gap-3 py-3 border-y border-ember">
                  <span className="stamp-ember mt-0.5">Error</span>
                  <span className="text-sm text-ink leading-snug">{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-ink/10">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Guardar cambios' : 'Registrar ventilador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Shell>
  );
}
