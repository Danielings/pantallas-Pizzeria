import { useState } from "react";
import { Save, XCircle } from "lucide-react";

const EMPTY_PRODUCT = {
  name: "",
  price: "",
  description: "",
  emoji: "🍕",
  size: "",
  available: true,
};

const EMOJIS = [
  "🍕",
  "🥤",
  "🍦",
  "🍫",
  "🍌",
  "🍓",
  "🥦",
  "🍺",
  "🍷",
  "🥩",
  "🍍",
  "🦐",
  "💧",
  "🍋",
  "🧋",
  "🍨",
];

export default function ProductForm({
  initial,
  category,
  onSave,
  onCancel,
  isSaving,
}) {
  const [form, setForm] = useState(initial || { ...EMPTY_PRODUCT });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const selectSize = (selectedSize) => {
    setForm((prev) => ({ ...prev, size: selectedSize }));
    setErrors((prev) => ({ ...prev, size: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "El nombre es requerido";
    if (!form.price || isNaN(form.price) || parseFloat(form.price) <= 0)
      e.price = "Precio inválido";

    if (category === "pizzas" && !form.size) {
      e.size = "Debe seleccionar un tamaño";
    }
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    onSave({ ...form, price: parseFloat(form.price), category });
  };

  return (
    <div className="flex flex-col gap-4 relative">
      {/* Overlay de carga */}
      {isSaving && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
          <span className="text-pizza-red font-bold animate-pulse">
            Guardando...
          </span>
        </div>
      )}

      {/* Nombre */}
      <div>
        <label className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5 block">
          Nombre del Producto
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className={`w-full bg-slate-50 border ${errors.name ? "border-red-500" : "border-slate-200"} rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-slate-400`}
          placeholder="Ej. Pepperoni Clásico"
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>
        )}
      </div>

      {/* Precio + Icono */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5 block">
            Precio ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => handleChange("price", e.target.value)}
            className={`w-full bg-slate-50 border ${errors.price ? "border-red-500" : "border-slate-200"} rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-slate-400`}
            placeholder="0.00"
          />
          {errors.price && (
            <p className="text-red-500 text-xs mt-1 font-medium">
              {errors.price}
            </p>
          )}
        </div>
        <div>
          <label className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5 block">
            Icono
          </label>
          <select
            value={form.emoji}
            onChange={(e) => handleChange("emoji", e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xl focus:outline-none focus:border-slate-400 h-[42px]"
          >
            {EMOJIS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5 block">
          Descripción
        </label>
        <textarea
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-slate-400 resize-none"
          rows={2}
          placeholder="Ingredientes o detalles..."
        />
      </div>

      {/* Tamaños (Solo pizzas) */}
      {category === "pizzas" && (
        <div>
          <label className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5 block">
            Tamaño
          </label>
          <div className="flex gap-2">
            {["Normal", "Familiar", "Gigante"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => selectSize(s)}
                className={`px-3 py-1.5 rounded-lg text-sm border font-medium transition-all ${
                  form.size === s
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {errors.size && (
            <p className="text-red-500 text-xs mt-1 font-medium">
              {errors.size}
            </p>
          )}
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 w-1/3 transition-colors flex items-center justify-center gap-2"
        >
          <XCircle className="w-4 h-4" /> Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> Guardar Producto
        </button>
      </div>
    </div>
  );
}
