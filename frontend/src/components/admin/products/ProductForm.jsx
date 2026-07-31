import { useState, useEffect } from "react";
import { Save, XCircle, ImagePlus, X } from "lucide-react";

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

// Configuración de textos e iconos predeterminados según la categoría
const CATEGORY_CONFIG = {
  pizzas: {
    namePlaceholder: "Ej. Pepperoni Clásico",
    descPlaceholder: "Ej. Salsa de tomate, mozzarella y pepperoni...",
    defaultEmoji: "🍕",
  },
  drinks: {
    namePlaceholder: "Ej. Coca-Cola 2L",
    descPlaceholder: "Ej. Bebida gaseosa bien fría...",
    defaultEmoji: "🥤",
  },
  icecream: {
    namePlaceholder: "Ej. Helado de Chocolate",
    descPlaceholder: "Ej. Barquilla de dos bolas...",
    defaultEmoji: "🍦",
  },
};

export default function ProductForm({
  initial,
  category,
  onSave,
  onCancel,
  isSaving,
}) {
  // Obtenemos la configuración según la categoría actual (con un respaldo por si acaso)
  const currentConfig = CATEGORY_CONFIG[category] || {
    namePlaceholder: "Ej. Nombre del producto",
    descPlaceholder: "Detalles del producto...",
    defaultEmoji: "🍕",
  };

  const EMPTY_PRODUCT = {
    name: "",
    price: "",
    description: "",
    emoji: currentConfig.defaultEmoji,
    size: "",
    available: true,
  };

  const [form, setForm] = useState(initial || { ...EMPTY_PRODUCT });
  const [errors, setErrors] = useState({});

  // Nuevos estados para manejar la imagen
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initial?.url || null);

  // Limpiar la URL creada para evitar memory leaks cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (imagePreview && !initial?.url) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview, initial]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const selectSize = (selectedSize) => {
    setForm((prev) => ({ ...prev, size: selectedSize }));
    setErrors((prev) => ({ ...prev, size: "" }));
  };

  // Función para manejar la selección de la imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // Genera una URL temporal para la vista previa
    }
  };

  // Función para remover la imagen seleccionada
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
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

    // Ahora pasamos también el "imageFile" al componente padre
    onSave({
      ...form,
      price: parseFloat(form.price),
      category,
      image: imageFile, // Añadimos el archivo físico
    });
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
          placeholder={currentConfig.namePlaceholder}
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
          placeholder={currentConfig.descPlaceholder}
        />
      </div>

      {/* Subida de Imagen */}
      <div>
        <label className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5 block">
          Imagen del Producto
        </label>
        <div className="flex items-center gap-4">
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Vista previa"
                className="w-16 h-16 rounded-lg object-cover border border-slate-200 shadow-sm"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-md border border-slate-200 text-slate-500 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <label className="cursor-pointer bg-slate-50 border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-lg px-4 py-3 text-sm text-slate-600 flex items-center justify-center flex-1 transition-colors group">
            <div className="flex items-center gap-2">
              <ImagePlus className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
              <span className="font-medium">
                {imageFile ? "Cambiar imagen" : "Seleccionar imagen"}
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>
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
      <div className="flex gap-3 pt-4 border-t border-slate-100 mt-2">
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
