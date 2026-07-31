import React, { useState, useMemo } from "react";
import {
  X,
  User,
  CreditCard,
  Phone,
  ChevronDown,
  ChevronUp,
  Check,
  Sparkles,
  MessageSquareText,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TIPO_EMOJI = { Pizza: "🍕", Bebida: "🥤", Helado: "🍦" };

const DESPACHO_LABEL = {
  Local: { label: "Comer Aquí", color: "text-blue-600", bg: "bg-blue-50" },
  Llevar: { label: "Para Llevar", color: "text-amber-600", bg: "bg-amber-50" },
  Delivery: { label: "Delivery", color: "text-purple-600", bg: "bg-purple-50" },
  "Pick Up": { label: "Pick Up", color: "text-teal-600", bg: "bg-teal-50" },
};

const ESTADO_COLOR = {
  Pendiente: "text-amber-600 bg-amber-50 border-amber-200",
  Preparado: "text-blue-600 bg-blue-50 border-blue-200",
  Horno: "text-orange-600 bg-orange-50 border-orange-200",
  Completado: "text-emerald-600 bg-emerald-50 border-emerald-200",
};

function InfoChip({ icon: Icon, label, value, colorClass = "text-slate-700" }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </span>
      <span className={`text-sm font-semibold ${colorClass}`}>{value}</span>
    </div>
  );
}

// ─── Extra Pill ───────────────────────────────────────────────────────────────
function ExtraPill({ extra, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold
        transition-all duration-200 select-none
        ${active
          ? "bg-pizza-red border-pizza-red text-white shadow-md shadow-pizza-red/20 scale-105"
          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
        }
      `}
    >
      {active && <Check className="w-3 h-3" />}
      {extra.name || extra.nombre}
      <span className={`text-[10px] ${active ? "text-red-100" : "text-slate-400"}`}>
        +${(extra.price ?? extra.precio ?? 0).toFixed(2)}
      </span>
    </button>
  );
}

// ─── Item Card ────────────────────────────────────────────────────────────────
function ItemCard({ item, availableExtras, localExtras, onToggleExtra }) {
  const [expanded, setExpanded] = useState(false);
  const isPizza = item.tipo_producto === "Pizza";
  const estadoCfg = ESTADO_COLOR[item.estado_detalle] || ESTADO_COLOR.Pendiente;
  const currentExtras = localExtras || item.extras || [];

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${expanded ? "border-slate-300 shadow-sm bg-slate-50/50" : "border-slate-100 bg-white"
        }`}
    >
      {/* ── Cabecera del item ── */}
      <div
        className="flex items-center gap-3 p-3.5 cursor-pointer select-none"
        onClick={() => isPizza && setExpanded((p) => !p)}
      >
        {/* Emoji */}
        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-xl shrink-0">
          {TIPO_EMOJI[item.tipo_producto] ?? "📦"}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm truncate">
            {item.nombre_producto || item.tipo_producto}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500 font-medium">
              Cant: {item.cantidad} · ${item.monto_total?.toFixed(2)}
            </span>
            {currentExtras.length > 0 && (
              <span className="text-[10px] text-pizza-red font-semibold bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                {currentExtras.length} extra{currentExtras.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Estado + flecha si es pizza */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${estadoCfg}`}>
            {item.estado_detalle}
          </span>
          {isPizza && (
            <span className="text-slate-400">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          )}
        </div>
      </div>

      {/* ── Panel expandible de extras (solo pizzas) ── */}
      {isPizza && expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 flex flex-col gap-3 bg-white">
          {availableExtras && availableExtras.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pizza-red" />
                Agregar / Quitar Extras:
              </p>
              <div className="flex flex-wrap gap-2">
                {availableExtras.map((ex) => {
                  const isActive = currentExtras.some(
                    (e) => (e.id_extras ?? e.id) === (ex.id_extras ?? ex.id)
                  );
                  return (
                    <ExtraPill
                      key={ex.id_extras ?? ex.id}
                      extra={ex}
                      active={isActive}
                      onClick={() => onToggleExtra(item.id_detalle, ex)}
                    />
                  );
                })}
              </div>

              {currentExtras.length > 0 && (
                <p className="text-[11px] text-slate-500 font-medium mt-2">
                  Seleccionados:{" "}
                  <span className="text-slate-700">
                    {currentExtras.map((e) => e.name ?? e.nombre).join(", ")}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MODAL PRINCIPAL ──────────────────────────────────────────────────────────
export default function OrderEditModal({ pedido, displayNum, onClose }) {
  const { extras: extrasCtx } = useApp();

  // Estado local de detalles para extras
  const [localDetalles, setLocalDetalles] = useState(
    () => pedido.detalles?.map((d) => ({ ...d, extras: [...(d.extras || [])] })) ?? []
  );

  // Observación única para todo el pedido
  const initialObservacion = useMemo(() => {
    const foundWithNote = pedido.detalles?.find((d) => d.nota && d.nota.trim().length > 0);
    return foundWithNote ? foundWithNote.nota : "";
  }, [pedido]);

  const [observacion, setObservacion] = useState(initialObservacion);

  const despacho = DESPACHO_LABEL[pedido.despacho] || DESPACHO_LABEL.Local;

  const availableExtras = useMemo(() => {
    if (extrasCtx && extrasCtx.length > 0) return extrasCtx;
    return [];
  }, [extrasCtx]);

  const handleToggleExtra = (idDetalle, extra) => {
    setLocalDetalles((prev) =>
      prev.map((d) => {
        if (d.id_detalle !== idDetalle) return d;
        const key = extra.id_extras ?? extra.id;
        const has = d.extras.some((e) => (e.id_extras ?? e.id) === key);
        return {
          ...d,
          extras: has
            ? d.extras.filter((e) => (e.id_extras ?? e.id) !== key)
            : [...d.extras, { ...extra, isNew: true }],
        };
      })
    );
  };

  const totalUsd = pedido.monto_total_usd ?? 0;
  const pizzaCount = localDetalles.filter((d) => d.tipo_producto === "Pizza").length;
  const bebidaCount = localDetalles.filter((d) => d.tipo_producto === "Bebida").length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-extrabold text-slate-800 text-lg">
              Editar Pedido #{displayNum ? String(displayNum).padStart(3, "0") : pedido.id_venta}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(pedido.fecha_hora).toLocaleString("es-VE", {
                hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short",
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body scrollable ── */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

          {/* Tarjeta del Cliente */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Información del Cliente
            </p>
            <div className="grid grid-cols-3 gap-3">
              <InfoChip
                icon={User}
                label="Nombre"
                value={pedido.nombre_cliente || "Anónimo"}
                colorClass="text-slate-800"
              />
              <InfoChip
                icon={CreditCard}
                label="Cédula"
                value={pedido.cedula_cliente ? `V-${pedido.cedula_cliente}` : "—"}
              />
              <InfoChip
                icon={Phone}
                label="Teléfono"
                value={pedido.telefono_cliente || "—"}
              />
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${despacho.bg} ${despacho.color}`}
              >
                {despacho.label}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {pizzaCount} pizza{pizzaCount !== 1 ? "s" : ""}
                {bebidaCount > 0 ? ` · ${bebidaCount} bebida${bebidaCount !== 1 ? "s" : ""}` : ""}
              </span>
            </div>
          </div>

          {/* Resumen de compra */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Productos del Pedido
            </p>
            <div className="flex flex-col gap-2">
              {localDetalles.map((item) => (
                <ItemCard
                  key={item.id_detalle}
                  item={item}
                  availableExtras={item.tipo_producto === "Pizza" ? availableExtras : []}
                  localExtras={item.extras}
                  onToggleExtra={handleToggleExtra}
                />
              ))}
            </div>
          </div>

          {/* Única Observación del Pedido */}
          <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-200/80">
            <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-2">
              <MessageSquareText className="w-4 h-4 text-amber-600" />
              Observación General del Pedido
            </label>
            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              rows={3}
              placeholder="Observacion"
              className="w-full resize-none rounded-lg border border-amber-200 text-sm px-3 py-2 text-slate-700 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Total */}
          <div className="flex items-center justify-between bg-slate-900 rounded-xl px-5 py-3.5 text-white">
            <span className="text-sm font-semibold text-slate-300">Monto Total</span>
            <span className="text-2xl font-black">${totalUsd.toFixed(2)}</span>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/60 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-pizza-red text-white font-semibold text-sm hover:bg-pizza-red-dark shadow-sm transition-colors"
          >
            Listo / Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
