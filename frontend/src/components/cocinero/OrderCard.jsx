import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { Clock, ChefHat, CheckCheck, Archive } from "lucide-react";

function useTimer(createdAt) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = Math.floor(
        (Date.now() - new Date(createdAt).getTime()) / 1000,
      );
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setElapsed(`${m}:${s.toString().padStart(2, "0")}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [createdAt]);

  return elapsed;
}

const STATUS_CONFIG = {
  pending: {
    border: "border-l-status-pending",
    badge:
      "bg-status-pending/20 text-status-pending border border-status-pending/30",
    dot: "bg-status-pending animate-pulse",
    label: "Por Preparar",
    btnLabel: "Preparar",
    btnNext: "preparing",
    btnClass: "bg-status-pending hover:bg-red-600 text-white",
    icon: ChefHat,
  },
  preparing: {
    border: "border-l-status-preparing",
    badge:
      "bg-status-preparing/20 text-status-preparing border border-status-preparing/30",
    dot: "bg-status-preparing animate-pulse",
    label: "En Preparación",
    btnLabel: "✓ Listo",
    btnNext: "ready",
    btnClass: "bg-status-preparing hover:bg-amber-500 text-white",
    icon: Clock,
  },
  ready: {
    border: "border-l-status-ready",
    badge: "bg-status-ready/20 text-status-ready border border-status-ready/30",
    dot: "bg-status-ready",
    label: "Completado",
    btnLabel: "Completado",
    btnNext: "archive",
    btnClass: "bg-status-ready hover:bg-emerald-500 text-white",
    icon: CheckCheck,
  },
};

export function OrderCard({ order }) {
  const { updateOrderStatus, archiveOrder } = useApp();
  const elapsed = useTimer(order.createdAt);
  const cfg = STATUS_CONFIG[order.status];
  const Icon = cfg.icon;

  const handleAction = () => {
    if (cfg.btnNext === "archive") {
      archiveOrder(order.id);
    } else {
      updateOrderStatus(order.id, cfg.btnNext);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border border-pizza-gray-3 border-l-4 ${cfg.border} p-4 flex flex-col gap-3 animate-card-move shadow-card`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
          <span className="text-pizza-dark font-bold text-sm">{order.id}</span>
        </div>
        <div className="flex items-center gap-1.5 text-pizza-muted">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs font-mono font-bold">{elapsed}</span>
        </div>
      </div>

      {/* Table */}
      {order.table && (
        <div className="text-pizza-muted text-xs">{order.table}</div>
      )}

      {/* Items */}
      <div className="flex flex-col gap-1.5">
        {order.items.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-2 bg-pizza-gray-2 border border-pizza-gray-3 rounded-lg px-3 py-2"
          >
            <span className="text-pizza-red font-bold text-sm w-5 flex-shrink-0">
              {item.qty}×
            </span>
            <div className="min-w-0">
              <p className="text-pizza-dark text-sm font-medium leading-tight">
                {item.name}
              </p>
              {item.size && (
                <p className="text-pizza-muted text-xs">{item.size}</p>
              )}
              {item.extras && item.extras.length > 0 && (
                <p className="text-xs mt-0.5 font-medium">
                  +{" "}
                  {item.extras.map((e) => (
                    <span
                      key={e.id}
                      className={`${e.isNew ? "text-yellow-700 bg-yellow-50 px-1 rounded-sm" : "text-pizza-red"} mr-1`}
                    >
                      {e.name}
                    </span>
                  ))}
                </p>
              )}
              {item.note && (
                <p className="text-xs text-slate-600 mt-1">Nota: {item.note}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center text-xs text-pizza-muted pt-1 border-t border-pizza-gray-3">
        <span>{order.items.reduce((s, i) => s + i.qty, 0)} artículos</span>
        <span className="text-pizza-dark font-semibold">
          ${order.total.toFixed(2)}
        </span>
      </div>

      {/* Action button */}
      <button
        onClick={handleAction}
        className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all duration-200 active:scale-95 ${cfg.btnClass}`}
      >
        {cfg.btnLabel}
      </button>
    </div>
  );
}
