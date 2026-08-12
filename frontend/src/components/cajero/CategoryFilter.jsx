import { useState, useEffect } from "react";
import { Pizza, CupSoda, Sandwich, Star } from "lucide-react";
import axios from "axios";

export default function CategoryFilter({ selected, onSelect }) {
  const [pedidosPendientes, setPedidosPendientes] = useState(0);

  useEffect(() => {
    const obtenerDespachos = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3001/api/obtener-contador-cajero",
        );
        if (response.data.success) {
          setPedidosPendientes(response.data.total);
        }
      } catch (error) {
        console.error("Error obteniendo el contador de despachos:", error);
      }
    };

    obtenerDespachos();
  }, []);

  const categories = [
    { id: "Normal", name: "Normal", icon: <Pizza className="w-4 h-4" /> },
    { id: "Grande", name: "Grande", icon: <Star className="w-4 h-4" /> },
    { id: "bebidas", name: "Bebidas", icon: <CupSoda className="w-4 h-4" /> },
    {
      id: "Gigantes",
      name: "Gigantes",
      icon: <Sandwich className="w-4 h-4" />,
      mostrarContador: true,
    },
  ];

  return (
    <div className="flex gap-2 items-center overflow-x-auto pb-1 hide-scrollbar">
      {categories.map((cat) => {
        const isSelected = selected === cat.id;

        return (
          <div key={cat.id} className="flex items-center gap-2">
            <button
              onClick={() => onSelect(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                isSelected
                  ? "bg-slate-800 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.icon}
              <span>{cat.name}</span>
            </button>

            {/* Ahora se muestra si hay 1 o más pedidos ( > 0 ) */}
            {cat.mostrarContador && pedidosPendientes > 0 && (
              <span className="flex items-center justify-center min-w-[24px] h-6 px-2 text-xs rounded-full font-bold bg-emerald-100 text-emerald-700 shadow-sm">
                {pedidosPendientes}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
