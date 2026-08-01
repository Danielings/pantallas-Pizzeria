import { useApp } from "../../context/AppContext";
import { Plus, Loader2 } from "lucide-react";
import CrudModal from "./CrudModal";
import OrderTypeModal from "./OrderTypeModal";
import { useState, useEffect } from "react";
import axios from "axios";

export default function MenuGrid({ category }) {
  // Ya no extraemos 'products' del contexto, ya que los traeremos de la API directamente aquí
  const { addToCart, currentOrder } = useApp();

  // Estados locales para los productos y la carga
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showCrud, setShowCrud] = useState(false);
  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null); // { product, size }

  // ─── FETCH DE APIS INDEPENDIENTES ─────────────────────────────────────
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        // Consultamos las 3 APIs de manera simultánea
        const [pizzasRes, bebidasRes, heladosRes] = await Promise.all([
          axios
            .get("http://localhost:3001/api/pizzas")
            .catch(() => ({ data: { data: [] } })),
          axios
            .get("http://localhost:3001/api/bebidas")
            .catch(() => ({ data: { data: [] } })),
          axios
            .get("http://localhost:3001/api/heladeria")
            .catch(() => ({ data: { data: [] } })),
        ]);

        // Mapeamos los datos respetando las propiedades que ya trae tu API
        const pizzas = (pizzasRes.data.data || []).map((pizza) => ({
          id: pizza.id || pizza.id_pizza,
          name: pizza.name || pizza.nombre,
          price: Number(pizza.price || pizza.precio),
          description: pizza.description || pizza.descripcion,
          category: "pizzas",
          size: pizza.size || pizza.categoria_nombre || "Normal",
          pizzaCategory:
            pizza.pizzaCategory || pizza.categoria_nombre || "Normal", // <-- Aquí estaba el error
          url: pizza.url || null,
          estado: pizza.estado || "Activo",
          emoji: "🍕",
        }));

        const bebidas = (bebidasRes.data.data || []).map((bebida) => ({
          id: bebida.id || bebida.id_bebida,
          name: bebida.name || bebida.nombre,
          price: Number(bebida.price || bebida.precio),
          description: bebida.description || bebida.descripcion,
          category: "drinks",
          url: bebida.url || null,
          estado: bebida.estado || "Activo",
          emoji: "🥤",
        }));

        const helados = (heladosRes.data.data || []).map((helado) => ({
          id: helado.id || helado.id_helado,
          name: helado.name || helado.nombre,
          price: Number(helado.price || helado.precio),
          description: helado.description || helado.descripcion,
          category: "icecream",
          url: helado.url || null,
          estado: helado.estado || "Activo",
          emoji: "🍦",
        }));

        const allProducts = [...pizzas, ...bebidas, ...helados];

        setProducts(allProducts);
      } catch (error) {
        console.error("Error al cargar los productos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (product, size) => {
    // Si el carrito está vacío y aún no se eligió tipo de pedido, interceptar
    if (currentOrder.items.length === 0 && !currentOrder.orderType) {
      setPendingProduct({ product, size });
      setShowOrderTypeModal(true);
    } else {
      addToCart(product, size);
    }
  };

  const handleOrderTypeConfirmed = () => {
    setShowOrderTypeModal(false);
    if (pendingProduct) {
      addToCart(pendingProduct.product, pendingProduct.size);
      setPendingProduct(null);
    }
  };

  const handleOrderTypeClose = () => {
    setShowOrderTypeModal(false);
    setPendingProduct(null);
  };

  // ─── LÓGICA DE FILTRADO DE PRODUCTOS ─────────────────────────────────
  // 1. Filtramos para mostrar únicamente los que tienen estado "Activo"
  const activeProducts = products.filter((p) => p.estado === "Activo");

  // 2. Mapear categorías de filtro a productos reales
  let displayedProducts = [];

  const allPizzas = activeProducts.filter((p) => p.category === "pizzas");
  const normal = allPizzas.filter((p) => p.pizzaCategory === "Normal");
  const grande = allPizzas.filter(
    (p) => p.pizzaCategory === "Grande" || p.pizzaCategory === "Familiar",
  );
  const gigantes = allPizzas.filter((p) => p.pizzaCategory === "Gigante");
  const drinks = activeProducts.filter((p) => p.category === "drinks");

  switch (category) {
    case "Normal":
      displayedProducts = normal;
      break;
    case "Grande":
      displayedProducts = grande;
      break;
    case "bebidas":
    case "Bebidas": // Agregado por seguridad si la prop viene con mayúscula
      displayedProducts = drinks;
      break;
    case "Gigantes":
      displayedProducts = gigantes;
      break;
    case "all":
    default:
      displayedProducts = activeProducts;
      break;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 hide-scrollbar relative">
      {/* Pantalla de Carga */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-pizza-red" />
          <p className="text-sm font-medium">Cargando menú...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
          {displayedProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-pizza hover:border-pizza-red/30 transition-all cursor-pointer group flex flex-col"
              onClick={() => handleAddToCart(product, product.size)}
            >
              {product.url || product.image ? (
                <div className="h-32 w-full shrink-0 overflow-hidden bg-slate-50 relative">
                  <img
                    src={product.url || product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <span className="absolute bottom-2 left-2 text-white font-bold">
                    ${product.price.toFixed(2)}
                  </span>
                </div>
              ) : (
                <div className="h-24 w-full shrink-0 bg-slate-50 flex items-center justify-center text-4xl relative">
                  {product.emoji}
                  <span className="absolute bottom-2 right-2 text-slate-800 font-bold text-sm bg-white/80 px-2 rounded-full backdrop-blur-sm">
                    ${product.price.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                    {product.description}
                  </p>
                </div>

                <button className="mt-3 w-full shrink-0 py-1.5 flex items-center justify-center gap-1 bg-slate-50 hover:bg-pizza-red hover:text-white text-slate-600 rounded-lg text-xs font-semibold transition-colors">
                  <Plus className="w-3 h-3" />
                  Agregar
                </button>
              </div>
            </div>
          ))}

          {!isLoading && displayedProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400">
              <p>No hay productos activos en esta categoría.</p>
            </div>
          )}
        </div>
      )}

      {showCrud && <CrudModal onClose={() => setShowCrud(false)} />}
      {showOrderTypeModal && (
        <OrderTypeModal
          onConfirm={handleOrderTypeConfirmed}
          onClose={handleOrderTypeClose}
        />
      )}
    </div>
  );
}
