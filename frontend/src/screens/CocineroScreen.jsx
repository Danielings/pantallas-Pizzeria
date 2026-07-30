import { useApp } from "../context/AppContext";
import { LogOut } from "lucide-react";
import KanbanBoard from "../components/cocinero/KanbanBoard";

export default function CocineroScreen() {
  const { orders, logout } = useApp();

  const pending   = orders.filter((o) => o.status === "pending").length;
  const preparing = orders.filter((o) => o.status === "preparing").length;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-pizza-gray-3 bg-white">
        <div className="flex items-center gap-3">
          <h1 className="text-pizza-dark font-bold text-lg">
            Pantalla del Cocinero
          </h1>
        </div>

        {/* Indicadores + reloj + salir */}
        <div className="flex items-center gap-4">
          {pending > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-status-pending/10 border border-status-pending/20 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-status-pending animate-pulse" />
              <span className="text-status-pending text-sm font-semibold">
                {pending} pendiente{pending !== 1 ? "s" : ""}
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

      {/* Kanban de preparación */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <KanbanBoard />
      </div>
    </div>
  );
}
