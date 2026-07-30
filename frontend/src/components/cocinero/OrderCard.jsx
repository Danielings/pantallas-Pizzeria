import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

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

// Estilos base por status (cuando no se pasa variant)
const STATUS_CONFIG = {
  pending: {
    border: "border-l-status-pending",
    badge: "bg-status-pending/20 text-status-pending border border-status-pending/30",
    dot: "bg-status-pending animate-pulse",
    primaryBtn: "bg-status-pending hover:bg-red-600 text-white",
  },
  preparing: {
    border: "border-l-status-preparing",
    badge: "bg-status-preparing/20 text-status-preparing border border-status-preparing/30",
    dot: "bg-status-preparing animate-pulse",
    primaryBtn: "bg-status-preparing hover:bg-amber-500 text-white",
  },
  ready: {
    border: "border-l-status-ready",
    badge: "bg-status-ready/20 text-status-ready border border-status-ready/30",
    dot: "bg-status-ready",
    primaryBtn: "bg-status-ready hover:bg-emerald-500 text-white",
  },
  delivered: {
    border: "border-l-emerald-600",
    badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-600",
    primaryBtn: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
};

// Estilos temáticos por variante de columna
const VARIANT_CONFIG = {
  yellow: {
    border: "border-l-amber-400",
    badge: "bg-amber-100 text-amber-700 border border-amber-200",
    dot: "bg-amber-400 animate-pulse",
    primaryBtn: "bg-amber-400 hover:bg-amber-500 text-white",
    secondaryBtn: "",
  },
  orange: {
    border: "border-l-orange-400",
    badge: "bg-orange-100 text-orange-700 border border-orange-200",
    dot: "bg-orange-400 animate-pulse",
    primaryBtn: "bg-orange-500 hover:bg-orange-600 text-white",
    secondaryBtn: "",
  },
  green: {
    border: "border-l-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
    primaryBtn: "bg-emerald-500 hover:bg-emerald-600 text-white",
    secondaryBtn:
      "bg-white border border-orange-400 text-orange-600 hover:bg-orange-50",
  },
};

// Mapeo principal: orderType técnico → etiqueta
const ORDER_TYPE_CONFIG = {
  dine_in:        { label: "Local"},
  local:          { label: "Local"}, // alias
  takeaway:       { label: "Para llevar"},
  delivery_call:  { label: "Delivery"},
  delivery_ws:    { label: "Delivery"},
  delivery:       { label: "Delivery"}, // alias
  pickup:         { label: "Pickup"},
};

// Mapeo de respaldo: order.table → etiqueta (para datos legacy)
const TABLE_TO_LABEL = {
  Mesa: "Local",
  Llevar: "Para llevar",
  Delivery: "Delivery",
};

// Helper que busca primero en orderType, luego en table
const getOrderTypeConfig = (order) => {
  // 1. orderType técnico (caso ideal: pedidos nuevos)
  if (order.orderType && ORDER_TYPE_CONFIG[order.orderType]) {
    return ORDER_TYPE_CONFIG[order.orderType];
  }
  // 2. Fallback desde order.table (mock data / datos legacy)
  if (order.table) {
    if (order.table.startsWith("Mesa"))        return ORDER_TYPE_CONFIG.dine_in;
    if (order.table === "Llevar")              return ORDER_TYPE_CONFIG.takeaway;
    if (order.table === "Delivery")            return ORDER_TYPE_CONFIG.delivery_call;
    if (order.table === "POS" || order.table === "Pickup") {
      return ORDER_TYPE_CONFIG.pickup;
    }
  }
  return null;
};

/**
 * OrderCard — componente reutilizable para el flujo de cocina/despacho.
 *
 * Props:
 *  - order          : objeto de pedido
 *  - isFirst        : bool — si false, el botón primario queda deshabilitado (lógica secuencial)
 *  - variant        : 'yellow' | 'orange' | 'green' | null  — tema de color de la columna
 *  - primaryBtnLabel: texto del botón principal
 *  - onPrimary      : handler del botón principal
 *  - secondaryBtnLabel: texto del botón secundario (opcional)
 *  - onSecondary    : handler del botón secundario (opcional)
 */
export function OrderCard({
  order,
  isFirst = true,
  variant = null,
  primaryBtnLabel,
  onPrimary,
  secondaryBtnLabel,
  onSecondary,
  itemsFilter = null,
}) {
  const elapsed = useTimer(order.createdAt);

  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const variantCfg = variant ? VARIANT_CONFIG[variant] : null;

  const borderClass = variantCfg ? variantCfg.border : statusCfg.border;
  const badgeClass  = variantCfg ? variantCfg.badge  : statusCfg.badge;
  const dotClass    = variantCfg ? variantCfg.dot    : statusCfg.dot;
  const primaryBtnClass   = variantCfg ? variantCfg.primaryBtn   : statusCfg.primaryBtn;
  const secondaryBtnClass = variantCfg ? variantCfg.secondaryBtn : "";

  const visibleItems = itemsFilter && Array.isArray(itemsFilter)
    ? order.items.filter((it) => it.category && itemsFilter.includes(it.category))
    : order.items;

  return (
    <div
      className={`bg-white rounded-xl border border-pizza-gray-3 border-l-4 ${borderClass} p-4 3xl:p-6 flex flex-col gap-3 3xl:gap-5 animate-card-move shadow-card`}
    >
      {/* Header: ID + timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 3xl:w-3.5 3xl:h-3.5 rounded-full ${dotClass}`} />
          <span className="text-pizza-dark font-bold text-sm 3xl:text-base">{order.id}</span>
        </div>
        <div className="flex items-center gap-1.5 text-pizza-muted">
          <Clock className="w-3.5 h-3.5 3xl:w-5 3xl:h-5" />
          <span className="text-xs 3xl:text-sm font-mono font-bold">{elapsed}</span>
        </div>
      </div>

      {/* Etiqueta de Reasignación */}
      {order.reassigned && (
        <div className="bg-red-50 text-red-700 text-xs font-bold px-2.5 py-1 rounded-md border border-red-200 w-max shadow-sm animate-pulse">
          ⚠️ Pedido Reasignado
        </div>
      )}

      {/* Mesa / tipo de orden */}
{getOrderTypeConfig(order) && (
  <div className="flex items-center gap-2 flex-wrap">
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold w-max`}
    >
      <span aria-hidden>{getOrderTypeConfig(order).icon}</span>
      <span>{getOrderTypeConfig(order).label}</span>
    </div>
    {/* Si es Local, mostramos también el # de mesa ("Mesa 4" → "#4") */}
    {order.table && order.table.startsWith("Mesa ") && (
      <span className="text-pizza-muted text-xs font-semibold">
        {order.table.replace(/^Mesa\s+/, "Mesa ")}
      </span>
    )}
  </div>
)}
      {/* {order.table && (
        <div className="text-pizza-muted text-xs">{order.table}</div>
      )} */}

      {/* Items */}
      <div className="flex flex-col gap-1.5 3xl:gap-2.5">
                {visibleItems.length === 0 ? (
          <div className="text-pizza-muted text-xs italic px-2 py-3 text-center border border-dashed border-pizza-gray-3 rounded-lg">
            {itemsFilter
              ? "Sin items de cocina en este pedido"
              : "Pedido sin items"}
          </div>
        ) : (
          visibleItems.map((item, i) => (
            <div
              key={`${item.category || "x"}-${i}`}
              className="flex items-start gap-2 bg-pizza-gray-2 border border-pizza-gray-3 rounded-lg px-3 py-2 3xl:px-4 3xl:py-3"
            >
              <span className="text-pizza-red font-bold 3xl:text-base text-sm w-5 3xl:w-7 flex-shrink-0">
                {item.qty}x
              </span>
              <div className="min-w-0 flex-1">
              <p className="text-pizza-dark text-sm 3xl:text-base font-medium leading-tight flex items-center gap-1.5">
                  <span>{item.name}</span>
                </p>
                {item.size && (
                  <p className="text-pizza-muted text-xs 3xl:text-sm">{item.size}</p>
                )}
                {item.extras && item.extras.length > 0 && (
                  <p className="text-xs mt-0.5 font-medium">
                    +{" "}
                    {item.extras.map((e) => (
                      <span
                        key={e.id}
                        className={`${
                          e.isNew
                            ? "text-yellow-700 bg-yellow-50 px-1 rounded-sm"
                            : "text-pizza-red"
                        } mr-1`}
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
          ))
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col gap-2 3xl:gap-3">
        {/* Botón secundario (opcional, ej: "Pendiente" en columna Despacho) */}
        {secondaryBtnLabel && onSecondary && (
          <button
            onClick={onSecondary}
            className={`w-full py-2 3xl:py-3.5 rounded-lg font-bold text-sm 3xl:text-base transition-all duration-200 active:scale-95 ${secondaryBtnClass}`}
          >
            {secondaryBtnLabel}
          </button>
        )}

        {/* Botón primario — deshabilitado si no es el primero en la cola */}
        {primaryBtnLabel && onPrimary && (
          <button
            onClick={onPrimary}
            disabled={!isFirst}
            className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all duration-200 active:scale-95 ${primaryBtnClass} ${
              !isFirst ? "opacity-40 cursor-not-allowed" : ""
            }`}
          >
            {primaryBtnLabel}
          </button>
        )}
      </div>
    </div>
  );
}
