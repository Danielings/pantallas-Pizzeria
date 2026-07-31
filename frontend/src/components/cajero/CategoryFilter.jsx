import { Pizza, CupSoda, Sandwich, Star, Plus } from "lucide-react";
import { useState } from "react";
import CrudModal from "./CrudModal";

export default function CategoryFilter({ selected, onSelect }) {
  const [show, setShow] = useState(false);
  const categories = [
    {
      id: "Normal",
      name: "Normal",
      icon: <Pizza className="w-4 h-4" />,
    },
    { id: "Grande", name: "Grande", icon: <Star className="w-4 h-4" /> },
    { id: "bebidas", name: "Bebidas", icon: <CupSoda className="w-4 h-4" /> },
    {
      id: "Gigantes",
      name: "Gigantes",
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
    </div>
  );
}
