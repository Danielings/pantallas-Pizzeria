import { useState } from "react";
import axios from "axios";
import {
  Search,
  Plus,
  Package,
  Pencil,
  Trash2,
  Pizza,
  Coffee,
  IceCream,
  X,
} from "lucide-react";
import ProductForm from "./products/ProductForm"; // <-- Asegúrate de tener este componente guardado

// ─── Mocks y Configuración ────────────────────────────────────────────────
const MOCK_PRODUCTS = [
  {
    id: 1,
    name: "Pepperoni Clásico",
    price: 8.5,
    description: "Salsa, mozzarella y pepperoni",
    category: "pizzas",
    emoji: "🍕",
  },
  {
    id: 2,
    name: "Coca-Cola 1.5L",
    price: 2.5,
    description: "Bebida gaseosa",
    category: "drinks",
    emoji: "🥤",
  },
  {
    id: 3,
    name: "Helado de Vainilla",
    price: 3.0,
    description: "Dos porciones con sirope",
    category: "icecream",
    emoji: "🍦",
  },
];

const CATEGORY_TYPES = [
  {
    id: "pizzas",
    label: "Pizza",
    sublabel: "Masa tradicional",
    icon: Pizza,
    colorLight: "bg-amber-50 border-amber-200",
    colorSelected: "bg-amber-500 border-amber-500",
    colorIcon: "text-amber-500",
  },
  {
    id: "drinks",
    label: "Bebida",
    sublabel: "Refrescos y jugos",
    icon: Coffee,
    colorLight: "bg-blue-50 border-blue-200",
    colorSelected: "bg-blue-500 border-blue-500",
    colorIcon: "text-blue-500",
  },
  {
    id: "icecream",
    label: "Helado",
    sublabel: "Postres fríos",
    icon: IceCream,
    colorLight: "bg-pink-50 border-pink-200",
    colorSelected: "bg-pink-500 border-pink-500",
    colorIcon: "text-pink-500",
  },
];

// ─── Componente Principal ────────────────────────────────────────────────
export default function ProductosScreen() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState(MOCK_PRODUCTS);

  // Estados para el Modal y Flujo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Nuevos estados para edición y carga en DB
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()),
  );

  // Funciones de apertura
  const handleNewClick = () => {
    setEditingProduct(null);
    setSelectedCategory(null);
    setModalStep(1);
    setIsModalOpen(true);
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setSelectedCategory(product.category);
    setModalStep(2); // Saltamos el paso 1 porque ya tiene categoría
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setModalStep(1);
      setSelectedCategory(null);
      setEditingProduct(null);
    }, 300); // Esperar que cierre para resetear
  };

  // Funciones de DB
  const handleSaveProduct = async (productData) => {
    setIsSaving(true);
    try {
      // Determinamos el endpoint según tu estructura de APIs independientes
      let endpoint = "";
      if (selectedCategory === "pizzas")
        endpoint = "http://localhost:3001/api/pizzas";
      if (selectedCategory === "drinks")
        endpoint = "http://localhost:3001/api/bebidas";
      if (selectedCategory === "icecream")
        endpoint = "http://localhost:3001/api/heladeria";

      if (editingProduct) {
        // ACTUALIZAR (PUT)
        const response = await axios.put(
          `${endpoint}/${editingProduct.id}`,
          productData,
        );
        if (response.data.success) {
          setProducts((prev) =>
            prev.map((p) =>
              p.id === editingProduct.id ? { ...productData, id: p.id } : p,
            ),
          );
        }
      } else {
        // CREAR (POST)
        const response = await axios.post(endpoint, productData);
        if (response.data.success) {
          setProducts((prev) => [
            ...prev,
            { ...productData, id: response.data.id },
          ]);
        }
      }
      closeModal();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert(
        error.response?.data?.message || "Error de conexión con el servidor",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, category) => {
    if (!window.confirm("¿Estás seguro de eliminar este producto?")) return;

    // Aquí a futuro agregarías el axios.delete() apuntando a la API correspondiente
    // Ejemplo: await axios.delete(`http://localhost:3001/api/${category}/${id}`);

    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto w-full h-full bg-slate-50">
      {/* Header */}
      <header className="flex flex-wrap gap-4 justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-slate-100 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-pizza-red" />
            Productos
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {products.length} productos registrados
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-72 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all"
            />
          </div>
          <button
            onClick={handleNewClick}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
        </div>
      </header>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 text-base">
            Directorio de Productos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {filtered.length} resultado(s)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">No se encontraron productos</p>
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl shrink-0">
                          {product.emoji}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block">
                            {product.name}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            {
                              CATEGORY_TYPES.find(
                                (c) => c.id === product.category,
                              )?.label
                            }
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {product.description}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-bold text-emerald-600">
                        ${product.price.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditClick(product)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-800 transition-all p-1.5 rounded-lg hover:bg-slate-100"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(product.id, product.category)
                          }
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1.5 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal de Agregar / Editar Producto ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Cabecera Oscura del Modal */}
            <div className="bg-slate-800 p-6 text-white relative">
              <button
                onClick={closeModal}
                className="absolute right-4 top-4 p-1.5 bg-slate-700 hover:bg-slate-600 rounded-full text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <h2 className="text-xl font-bold mb-1">
                {editingProduct
                  ? "Editar Producto"
                  : modalStep === 1
                    ? "¿Qué vas a registrar?"
                    : "Detalles del Producto"}
              </h2>
              <p className="text-slate-400 text-sm">
                {editingProduct
                  ? "Modifica la información a continuación"
                  : modalStep === 1
                    ? "Selecciona la categoría del producto"
                    : "Completa la información requerida"}
              </p>

              {/* Stepper Simple (Oculto si se está editando) */}
              {!editingProduct && (
                <div className="flex items-center mt-6 text-sm">
                  <span
                    className={`font-bold ${modalStep === 1 ? "text-white" : "text-slate-400"}`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full mr-2 text-xs ${modalStep === 1 ? "bg-white text-slate-900" : "bg-slate-700"}`}
                    >
                      1
                    </span>
                    Categoría
                  </span>
                  <div className="flex-1 h-px bg-slate-600 mx-4" />
                  <span
                    className={`font-bold ${modalStep === 2 ? "text-white" : "text-slate-400"}`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full mr-2 text-xs ${modalStep === 2 ? "bg-white text-slate-900" : "bg-slate-700"}`}
                    >
                      2
                    </span>
                    Detalles
                  </span>
                </div>
              )}
            </div>

            {/* Contenido del Modal */}
            <div className="p-6">
              {modalStep === 1 && !editingProduct ? (
                /* Paso 1: Selección estilo "¿Cómo es este pedido?" */
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    {CATEGORY_TYPES.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`relative border-2 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? `${cat.colorSelected} shadow-md scale-[1.02]`
                              : "border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors ${isSelected ? "bg-white/20" : cat.colorLight}`}
                          >
                            <Icon
                              className={`w-6 h-6 ${isSelected ? "text-white" : cat.colorIcon}`}
                            />
                          </div>
                          <span
                            className={`font-bold block ${isSelected ? "text-white" : "text-slate-800"}`}
                          >
                            {cat.label}
                          </span>
                          <span
                            className={`text-xs mt-1 ${isSelected ? "text-white/80" : "text-slate-500"}`}
                          >
                            {cat.sublabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setModalStep(2)}
                    disabled={!selectedCategory}
                    className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white py-3.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center"
                  >
                    Siguiente
                  </button>
                </div>
              ) : (
                /* Paso 2: Formulario de Creación/Edición */
                <div className="flex flex-col gap-4">
                  {/* Banner superior de categoría seleccionada */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex gap-4 mb-2">
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                      {(() => {
                        const Icon = CATEGORY_TYPES.find(
                          (c) => c.id === selectedCategory,
                        )?.icon;
                        return Icon ? (
                          <Icon className="w-5 h-5 text-slate-700" />
                        ) : null;
                      })()}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase">
                        Categoría Seleccionada
                      </p>
                      <p className="text-sm font-bold text-slate-800">
                        {
                          CATEGORY_TYPES.find((c) => c.id === selectedCategory)
                            ?.label
                        }
                      </p>
                    </div>
                  </div>

                  {/* Integración del componente Formulario */}
                  <ProductForm
                    initial={editingProduct}
                    category={selectedCategory}
                    isSaving={isSaving}
                    onSave={handleSaveProduct}
                    onCancel={() =>
                      editingProduct ? closeModal() : setModalStep(1)
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
