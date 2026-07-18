import { Pizza, CupSoda, Sandwich, Star, Plus } from "lucide-react";
import { useState } from "react";
import CrudModal from "./CrudModal";

export default function CategoryFilter({ selected, onSelect }) {
  const [show, setShow] = useState(false);
  const categories = [
    { id: "all", name: "Todo", icon: null },
    {
      id: "tradicionales",
      name: "Tradicionales",
      icon: <Pizza className="w-4 h-4" />,
    },
    { id: "gourmet", name: "Gourmet", icon: <Star className="w-4 h-4" /> },
    { id: "bebidas", name: "Bebidas", icon: <CupSoda className="w-4 h-4" /> },
    {
      id: "combos",
      name: "Combos Especiales",
      icon: <Sandwich className="w-4 h-4" />,
    },
  ];

  return (
    <div className="flex gap-2 items-center overflow-x-auto pb-1 hide-scrollbar">
      {categories.map((cat) => {
        const isSelected = selected === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
              isSelected
                ? "bg-slate-800 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cat.icon}
            {cat.name}
          </button>
        );
      })}
      <div className="ml-2">
        <button
          onClick={() => setShow(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-pizza-red/10 text-pizza-red hover:bg-pizza-red/20"
        >
          <Plus className="w-4 h-4" /> Nuevo
        </button>
        {show && <CrudModal onClose={() => setShow(false)} />}
      </div>
    </div>
  );
}
