import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Plus, Pencil, Trash2, Save, XCircle } from 'lucide-react';

const CATEGORIES_MAP = {
  pizzas: { label: 'Pizzas', icon: '🍕' },
  drinks: { label: 'Bebidas', icon: '🥤' },
  icecream: { label: 'Heladería', icon: '🍦' },
};

const EMPTY_PRODUCT = {
  name: '',
  price: '',
  description: '',
  emoji: '🍕',
  sizes: [],
  available: true,
};

function ProductForm({ initial, category, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { ...EMPTY_PRODUCT });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const toggleSize = (size) => {
    const sizes = form.sizes.includes(size)
      ? form.sizes.filter(s => s !== size)
      : [...form.sizes, size];
    setForm(prev => ({ ...prev, sizes }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'El nombre es requerido';
    if (!form.price || isNaN(form.price) || parseFloat(form.price) <= 0) e.price = 'Precio inválido';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSave({ ...form, price: parseFloat(form.price), category });
  };

  const EMOJIS = ['🍕', '🥤', '🍦', '🍫', '🍌', '🍓', '🥦', '🍺', '🍷', '🥩', '🍍', '🦐', '💧', '🍋', '🧋', '🍨'];

  return (
    <div className="flex flex-col gap-4">
      {/* Name */}
      <div>
        <label className="text-pizza-muted text-xs font-semibold uppercase tracking-wider mb-1.5 block">Nombre del Producto</label>
        <input
          type="text"
          value={form.name}
          onChange={e => handleChange('name', e.target.value)}
          className={`input-field ${errors.name ? 'border-pizza-red' : ''}`}
          placeholder="Ej. Pepperoni Clásico"
        />
        {errors.name && <p className="text-pizza-red text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Price + Emoji */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-pizza-muted text-xs font-semibold uppercase tracking-wider mb-1.5 block">Precio ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={e => handleChange('price', e.target.value)}
            className={`input-field ${errors.price ? 'border-pizza-red' : ''}`}
            placeholder="0.00"
          />
          {errors.price && <p className="text-pizza-red text-xs mt-1">{errors.price}</p>}
        </div>
        <div>
          <label className="text-pizza-muted text-xs font-semibold uppercase tracking-wider mb-1.5 block">Icono</label>
          <select
            value={form.emoji}
            onChange={e => handleChange('emoji', e.target.value)}
            className="input-field text-xl"
          >
            {EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-pizza-muted text-xs font-semibold uppercase tracking-wider mb-1.5 block">Descripción</label>
        <textarea
          value={form.description}
          onChange={e => handleChange('description', e.target.value)}
          className="input-field resize-none"
          rows={2}
          placeholder="Ingredientes o detalles..."
        />
      </div>

      {/* Sizes (only for pizzas) */}
      {category === 'pizzas' && (
        <div>
          <label className="text-pizza-muted text-xs font-semibold uppercase tracking-wider mb-1.5 block">Tamaños Disponibles</label>
          <div className="flex gap-2">
            {['Personal', 'Mediana', 'Familiar'].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSize(s)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                  form.sizes.includes(s)
                    ? 'border-pizza-red bg-pizza-red/10 text-pizza-red'
                    : 'border-pizza-gray-3 text-pizza-muted hover:border-pizza-gray-4'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="btn-secondary flex-1 flex items-center justify-center gap-2">
          <XCircle className="w-4 h-4" /> Cancelar
        </button>
        <button onClick={handleSubmit} className="btn-primary flex-1 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> Guardar
        </button>
      </div>
    </div>
  );
}

export default function CrudModal({ onClose }) {
  const { products, addProduct, updateProduct, deleteProduct } = useApp();
  const [activeTab, setActiveTab] = useState('pizzas');
  const [editingId, setEditingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const currentProducts = products[activeTab];

  const handleSaveNew = (product) => {
    addProduct(activeTab, product);
    setCreating(false);
  };

  const handleSaveEdit = (product) => {
    updateProduct(activeTab, product);
    setEditingId(null);
  };

  const handleDelete = (id) => {
    deleteProduct(activeTab, id);
    setDeleteConfirm(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content w-[640px] max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-pizza-gray-3">
          <h2 className="text-pizza-dark font-bold text-lg">Gestión de Productos</h2>
          <button onClick={onClose} className="text-pizza-muted hover:text-pizza-dark p-1.5 rounded-lg hover:bg-pizza-gray-2 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-4 pb-0">
          {Object.entries(CATEGORIES_MAP).map(([key, { label, icon }]) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setEditingId(null); setCreating(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === key ? 'tab-active' : 'tab-inactive'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {/* Create form */}
          {creating && (
            <div className="card p-4 border-pizza-red/30 bg-pizza-gray-2">
              <h3 className="text-pizza-dark font-semibold mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-pizza-red" /> Nuevo Producto
              </h3>
              <ProductForm
                category={activeTab}
                onSave={handleSaveNew}
                onCancel={() => setCreating(false)}
              />
            </div>
          )}

          {/* Product list */}
          {currentProducts.map(product => (
            <div key={product.id} className="card p-4">
              {editingId === product.id ? (
                <>
                  <h3 className="text-pizza-dark font-semibold mb-3 flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-pizza-red" /> Editar Producto
                  </h3>
                  <ProductForm
                    initial={product}
                    category={activeTab}
                    onSave={handleSaveEdit}
                    onCancel={() => setEditingId(null)}
                  />
                </>
              ) : deleteConfirm === product.id ? (
                <div className="flex flex-col gap-3">
                  <p className="text-pizza-dark">¿Eliminar <span className="font-bold text-pizza-red">{product.name}</span>?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancelar</button>
                    <button onClick={() => handleDelete(product.id)} className="btn-primary flex-1">Sí, Eliminar</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{product.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-pizza-dark font-semibold text-sm truncate">{product.name}</p>
                    <p className="text-pizza-muted text-xs truncate">{product.description}</p>
                  </div>
                  <span className="text-pizza-red font-bold text-sm whitespace-nowrap">${product.price.toFixed(2)}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingId(product.id); setCreating(false); }}
                      className="p-2 rounded-lg hover:bg-pizza-gray-2 text-pizza-muted hover:text-pizza-dark transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(product.id)}
                      className="p-2 rounded-lg hover:bg-pizza-red/10 text-pizza-muted hover:text-pizza-red transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {currentProducts.length === 0 && !creating && (
            <div className="flex flex-col items-center justify-center py-12 text-pizza-muted gap-2">
              <span className="text-4xl">{CATEGORIES_MAP[activeTab].icon}</span>
              <p className="text-sm">No hay productos en esta categoría</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-pizza-gray-3 p-4">
          <button
            onClick={() => { setCreating(true); setEditingId(null); }}
            disabled={creating}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
        </div>
      </div>
    </div>
  );
}
