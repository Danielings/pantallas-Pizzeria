// src/screens/MeseroScreen.jsx
import { useApp } from "../context/AppContext";
import Header from "../components/layout/Header";
import MeseroBoard from "../components/cocinero/MeseroBoard";

export default function MeseroScreen() {
const { orders } = useApp();

// Contador para el indicador del header
const deliveredCount = orders.filter((o) => o.status === "delivered").length;

return (
<div className="flex flex-col h-full bg-white">
    <Header title="Pantalla del Mesero">
    {deliveredCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-emerald-700 text-sm font-semibold">
            {deliveredCount} para entregar
        </span>
        </div>
    )}
    </Header>

    {/* Board centrado */}
    <div className="flex-1 overflow-hidden">
    <MeseroBoard />
    </div>
</div>
);
}