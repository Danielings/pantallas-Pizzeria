import { useApp } from "../context/AppContext";
import { useMemo, useState } from "react";
import {
  Pizza,
  DollarSign,
  ShoppingBag,
  Clock,
  TrendingUp,
  CalendarDays,
  ArrowUpRight,
  Edit3,
  RefreshCw,
  Package,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import OrderEditModal from "../components/cajero/OrderEditModal";

// ─── CONFIGURACIONES DE ESTADO Y DESPACHO ────────────────────────────────────
const DESPACHO_BADGES = {
  Local:    { label: "Local",    bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200" },
  Llevar:   { label: "Llevar",   bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200" },
  Delivery: { label: "Delivery", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  "Pick Up":{ label: "Pick Up",  bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-200" },
};

const ESTADO_BADGES = {
  Pendiente:  { label: "Pendiente", bg: "bg-amber-100",  text: "text-amber-800",  dot: "bg-amber-500" },
  Preparado:  { label: "En Prep.",  bg: "bg-blue-100",   text: "text-blue-800",   dot: "bg-blue-500" },
  Horno:      { label: "En Horno",  bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500" },
  Completado: { label: "Listo ✓",   bg: "bg-emerald-100",text: "text-emerald-800",dot: "bg-emerald-500" },
};

const ITEMS_PER_PAGE = 15;

function getElapsed(iso) {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return "< 1 min";
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, iconBg, iconColor, trend, loading }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3 shadow-xs">
      <div className="flex items-center justify-between">
        <div className={`w-11 h-11 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5.5 h-5.5 ${iconColor}`} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            <ArrowUpRight className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <div>
        {loading ? (
          <div className="h-8 w-24 bg-slate-100 rounded-md animate-pulse mb-1" />
        ) : (
          <p className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">
            {value}
          </p>
        )}
        <p className="text-xs font-semibold text-slate-500 mt-1">{label}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── PANTALLA PRINCIPAL ───────────────────────────────────────────────────────
export default function ColaTrabajoScreen() {
  const { metricsHoy, pedidosActivos, fetchVentasHoy, fetchPedidosActivos } = useApp();
  const [editState, setEditState] = useState(null); // { pedido, displayNum }
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const loading = metricsHoy === null;

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchVentasHoy(), fetchPedidosActivos()]);
    setTimeout(() => setRefreshing(false), 500);
  };

  const totalRevenue = metricsHoy?.totalRevenue ?? 0;
  const totalPizzas = metricsHoy?.totalPizzas ?? 0;
  const avgTicket = metricsHoy?.avgTicket ?? 0;
  const totalTx = metricsHoy?.totalTransactions ?? 0;
  const activos = pedidosActivos.length;

  // Mapa de número cronológico del día (#1, #2, ...)
  const numMap = useMemo(() => {
    const sorted = [...pedidosActivos].sort(
      (a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora)
    );
    return Object.fromEntries(sorted.map((p, i) => [p.id_venta, i + 1]));
  }, [pedidosActivos]);

  // Paginación (15 elementos por página)
  const totalPages = Math.max(1, Math.ceil(pedidosActivos.length / ITEMS_PER_PAGE));
  const paginatedPedidos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return pedidosActivos.slice(start, start + ITEMS_PER_PAGE);
  }, [pedidosActivos, currentPage]);

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 p-6 flex flex-col gap-6">
      
      {/* Header Superior */}
      <div className="bg-white border border-slate-200/60 rounded-2xl px-6 py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-pizza-red/10 rounded-xl flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-pizza-red" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
              Cola de Trabajo
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5 capitalize flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activos > 0 && (
            <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              {activos} pedido{activos !== 1 ? "s" : ""} activo{activos !== 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-xs font-extrabold text-white bg-slate-900 hover:bg-black border border-slate-800 px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={DollarSign}
          label="Ingresos del Día"
          value={`$${totalRevenue.toFixed(2)}`}
          sub={`${totalTx} transacciones hoy`}
          iconBg="bg-red-50"
          iconColor="text-pizza-red"
          loading={loading}
        />
        <KpiCard
          icon={Pizza}
          label="Pizzas Vendidas"
          value={totalPizzas}
          sub="Unidades vendidas"
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
          loading={loading}
        />
        <KpiCard
          icon={ShoppingBag}
          label="Pedidos Activos"
          value={activos}
          sub={`${totalTx} ventas hoy`}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          loading={loading}
        />
        <KpiCard
          icon={TrendingUp}
          label="Ticket Promedio"
          value={`$${avgTicket.toFixed(2)}`}
          sub="Por pedido"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
          loading={loading}
        />
      </div>

      {/* Tabla Limpia de Pedidos */}
      <div className="flex-1 flex flex-col min-h-[520px] bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h2 className="font-bold text-slate-800 text-sm">Historial y Cola de Pedidos</h2>
            <p className="text-xs text-slate-500">Pedidos registrados hoy</p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-md">
            Total: {pedidosActivos.length} pedidos
          </span>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Pedido</th>
                <th className="py-3.5 px-6">Cliente</th>
                <th className="py-3.5 px-6">Tipo Despacho</th>
                <th className="py-3.5 px-6">Productos / Detalle</th>
                <th className="py-3.5 px-6 text-right">Total</th>
                <th className="py-3.5 px-6 text-center">Estado</th>
                <th className="py-3.5 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {pedidosActivos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-slate-400">
                    <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600 text-base">No hay pedidos activos</p>
                    <p className="text-xs">Los nuevos pedidos se listarán aquí</p>
                  </td>
                </tr>
              ) : (
                paginatedPedidos.map((pedido) => {
                  const num = numMap[pedido.id_venta] ?? 1;
                  const despacho = DESPACHO_BADGES[pedido.despacho] || DESPACHO_BADGES.Local;

                  // Estado más crítico
                  const estados = pedido.detalles?.map((d) => d.estado_detalle) || [];
                  let estadoObj = ESTADO_BADGES.Completado;
                  if (estados.includes("Pendiente")) estadoObj = ESTADO_BADGES.Pendiente;
                  else if (estados.includes("Preparado")) estadoObj = ESTADO_BADGES.Preparado;
                  else if (estados.includes("Horno")) estadoObj = ESTADO_BADGES.Horno;

                  // Observación general si existe
                  const obs = pedido.detalles?.find((d) => d.nota && d.nota.trim())?.nota;

                  return (
                    <tr key={pedido.id_venta} className="hover:bg-slate-50/80 transition-colors">
                      {/* Pedido # + Tiempo */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="font-bold text-slate-800 text-base">
                          #{String(num).padStart(3, "0")}
                        </span>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {getElapsed(pedido.fecha_hora)}
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <p className="font-semibold text-slate-800 text-sm">
                          {pedido.nombre_cliente || "Sin cliente"}
                        </p>
                        {pedido.cedula_cliente && (
                          <p className="text-xs text-slate-400">V-{pedido.cedula_cliente}</p>
                        )}
                      </td>

                      {/* Tipo Despacho */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md border ${despacho.bg} ${despacho.text} ${despacho.border}`}>
                          {despacho.label}
                        </span>
                      </td>

                      {/* Detalle */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap gap-1.5">
                            {pedido.detalles?.map((d, i) => (
                              <span key={i} className="text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded font-medium border border-slate-200/60">
                                <span className="font-bold">{d.cantidad}x</span> {d.nombre_producto || d.tipo_producto}
                                {d.extras?.length > 0 && (
                                  <span className="text-pizza-red ml-1 font-bold">
                                    (+{d.extras.length} ext)
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                          {obs && (
                            <p className="text-xs text-amber-700 font-medium flex items-center gap-1 mt-0.5">
                              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">"{obs}"</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-4 px-6 text-right font-black text-slate-800 text-base whitespace-nowrap">
                        ${pedido.monto_total_usd?.toFixed(2) ?? "—"}
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${estadoObj.bg} ${estadoObj.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${estadoObj.dot}`} />
                          {estadoObj.label}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <button
                          onClick={() => setEditState({ pedido: JSON.parse(JSON.stringify(pedido)), displayNum: num })}
                          className="px-3.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer shadow-2xs"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación de 15 por página al pie de la tabla */}
        {pedidosActivos.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
            <span>
              Mostrando <span className="font-bold text-slate-800">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-bold text-slate-800">{Math.min(currentPage * ITEMS_PER_PAGE, pedidosActivos.length)}</span> de <span className="font-bold text-slate-800">{pedidosActivos.length}</span> pedidos
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <span className="font-bold text-slate-800 px-2">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de edición */}
      {editState && (
        <OrderEditModal
          key={editState.pedido.id_venta}
          pedido={editState.pedido}
          displayNum={editState.displayNum}
          onClose={() => setEditState(null)}
        />
      )}
    </div>
  );
}
