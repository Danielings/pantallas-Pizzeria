import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Minus, Plus, Trash2, ChevronDown } from 'lucide-react';

const SIZE_OPTIONS = ['Personal', 'Mediana', 'Familiar'];

function ExtrasModal({ item, extras, onClose, onSave }) {
  const [selected, setSelected] = useState(item.extras.map(e => e.id));

  const toggle = (extra) => {
    setSelected(prev =>
      prev.includes(extra.id) ? prev.filter(id => id !== extra.id) : [...prev, extra.id]
    );
  };

  const handleSave = () => {
    const chosenExtras = extras.filter(e => selected.includes(e.id));
    onSave(item.id, chosenExtras);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content p-6 w-96 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-1 text-pizza-dark">Personalizar</h3>
        <p className="text-pizza-muted text-sm mb-4">{item.name}</p>
        <div className="flex flex-col gap-2 mb-5">
          {extras.map(extra => {
            const isSelected = selected.includes(extra.id);
            return (
              <button
                key={extra.id}
                onClick={() => toggle(extra)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-pizza-red bg-pizza-red/10 text-pizza-red font-semibold'
                    : 'border-pizza-gray-3 text-pizza-muted hover:border-pizza-gray-4 hover:text-pizza-dark'
                }`}
              >
                <span className="text-sm">{extra.name}</span>
                <span className={`text-xs font-semibold ${isSelected ? 'text-pizza-red' : ''}`}>
                  +${extra.price.toFixed(2)}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={handleSave} className="btn-primary flex-1">Guardar</button>
        </div>
      </div>
    </div>
  );
}

export default function OrderItem({ item }) {
  const { updateItemQty, updateItemSize, updateItemExtras, removeItem, extras } = useApp();
  const [showExtras, setShowExtras] = useState(false);

  const hasSize = item.category === 'pizzas';

  return (
    <>
      <div className="bg-pizza-gray-2 rounded-xl p-3 flex flex-col gap-2 animate-slide-in border border-pizza-gray-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">{item.emoji}</span>
            <div className="min-w-0">
              <p className="text-pizza-dark text-sm font-semibold truncate">{item.name}</p>
              {item.extras.length > 0 && (
                <p className="text-pizza-muted text-xs truncate">
                  + {item.extras.map(e => e.name).join(', ')}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => removeItem(item.id)}
            className="text-pizza-muted hover:text-pizza-red transition-colors p-1 rounded-lg hover:bg-pizza-red/10 flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-2">
          {/* Qty */}
          <div className="flex items-center gap-1 bg-pizza-gray-3/50 rounded-lg p-1 border border-pizza-gray-3">
            <button
              onClick={() => updateItemQty(item.id, item.qty - 1)}
              disabled={item.qty <= 1}
              className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-pizza-gray-3 disabled:opacity-30 transition-colors"
            >
              <Minus className="w-3 h-3 text-pizza-dark" />
            </button>
            <span className="text-pizza-dark text-sm font-bold w-6 text-center">{item.qty}</span>
            <button
              onClick={() => updateItemQty(item.id, item.qty + 1)}
              className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-pizza-gray-3 transition-colors"
            >
              <Plus className="w-3 h-3 text-pizza-dark" />
            </button>
          </div>

          {/* Size selector */}
          {hasSize && (
            <div className="relative flex-1">
              <select
                value={item.size || ''}
                onChange={e => updateItemSize(item.id, e.target.value)}
                className="input-field py-1.5 text-xs appearance-none pr-6 cursor-pointer"
              >
                {SIZE_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-pizza-muted pointer-events-none" />
            </div>
          )}

          {/* Extras button */}
          {item.category === 'pizzas' && (
            <button
              onClick={() => setShowExtras(true)}
              className="text-xs text-pizza-red hover:text-pizza-red-light font-medium px-2 py-1.5 rounded-lg bg-pizza-red/10 hover:bg-pizza-red/20 transition-all whitespace-nowrap"
            >
              Extras
            </button>
          )}

          {/* Price */}
          <span className="text-pizza-dark font-bold text-sm ml-auto">
            ${(item.price * item.qty).toFixed(2)}
          </span>
        </div>
      </div>

      {showExtras && (
        <ExtrasModal
          item={item}
          extras={extras}
          onClose={() => setShowExtras(false)}
          onSave={updateItemExtras}
        />
      )}
    </>
  );
}
