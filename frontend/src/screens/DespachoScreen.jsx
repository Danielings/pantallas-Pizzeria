import { useApp } from "../context/AppContext";
import { LogOut } from "lucide-react";
import DespachoBoard from "../components/cocinero/DespachoBoard";

export default function DespachoScreen() {
  const { orders, logout } = useApp();

  const preparing = orders.filter((o) => o.status === "preparing").length;
  const ready     = orders.filter((o) => o.status === "ready").length;
  const delivered = orders.filter((o) => o.status === "delivered").length;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-pizza-gray-3 bg-white">
        <h1 className="text-pizza-dark font-bold text-lg">
          Pantalla de Despacho
        </h1>

        {/* Indicadores + reloj + salir */}
        <div className="flex items-center gap-4">
          {preparing > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-700 text-sm font-semibold">
                {preparing} en horno
              </span>
            </div>
          )}
          {ready > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-orange-700 text-sm font-semibold">
                {ready} pendiente{ready !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          {delivered > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-emerald-700 text-sm font-semibold">
                {delivered} en despacho
              </span>
            </div>
          )}

          <div className="text-pizza-muted text-sm font-mono">
            {new Date().toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all text-xs shadow-sm"
            title="Cerrar Sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="font-semibold">Salir</span>
          </button>
        </div>
      </div>

      {/* Board de despacho */}
      <div className="flex-1 overflow-hidden">
        <DespachoBoard />
      </div>
    </div>
  );
}
