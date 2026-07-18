import { useApp } from '../context/AppContext';
import { useMemo } from 'react';
import {
  Pizza, DollarSign, ShoppingBag, CheckCircle2,
  Clock, Flame, TrendingUp, Users, CalendarDays, ArrowUpRight
} from 'lucide-react';

const STATUS_LABELS = {
  pending:   { label: 'Pendiente',  color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200',  dot: 'bg-amber-400' },
  preparing: { label: 'En Cocina', color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200',   dot: 'bg-blue-400' },
  baking:    { label: 'En Horno',  color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-200', dot: 'bg-orange-400' },
  ready:     { label: 'Listo',     color: 'text-emerald-600',bg: 'bg-emerald-50', border: 'border-emerald-200',dot: 'bg-emerald-400' },
  completed: { label: 'Entregado', color: 'text-slate-500',  bg: 'bg-slate-50',   border: 'border-slate-200',  dot: 'bg-slate-400' },
};

function getElapsed(iso) {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return '< 1 min';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function KpiCard({ icon: Icon, label, value, sub, iconBg, iconColor, trend }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4 group hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <ArrowUpRight className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-extrabold text-slate-800 tracking-tight leading-none">{value}</p>
        <p className="text-sm font-semibold text-slate-500 mt-1.5">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function OrderRow({ order }) {
  const cfg = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
  const isCompleted = order.status === 'completed';

  return (
    <div className={`flex items-center gap-4 px-5 py-4 border-b border-slate-50 hover:bg-slate-50/80 transition-colors group`}>
      {/* Order ID & Time */}
      <div className="w-24 shrink-0">
        <p className="font-extrabold text-slate-800 text-sm">{order.id}</p>
        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3" />
          {getElapsed(order.createdAt)}
        </p>
      </div>

      {/* Items summary */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 truncate">
          {order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{order.table || 'POS'}</p>
      </div>

      {/* Total */}
      <div className="text-right shrink-0 w-20">
        <p className="font-bold text-slate-800">${order.total?.toFixed(2) || '—'}</p>
      </div>

      {/* Status badge */}
      <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${cfg.bg} ${cfg.color} ${cfg.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${!isCompleted ? 'animate-pulse' : ''}`}></span>
        {cfg.label}
      </div>
    </div>
  );
}

export default function ColaTrabajoScreen() {
  const { orders, sales } = useApp();

  const today = new Date().toDateString();

  // All today's sales (historical completed)
  const todaySales = useMemo(() =>
    sales.filter(s => new Date(s.date).toDateString() === today),
  [sales, today]);

  // Active orders
  const activeOrders = orders;

  // Metrics
  const totalRevenue = useMemo(() =>
    todaySales.reduce((sum, s) => sum + s.total, 0),
  [todaySales]);

  const totalPizzas = useMemo(() =>
    todaySales.reduce((sum, s) => sum + s.items, 0),
  [todaySales]);

  const completedOrders = useMemo(() =>
    activeOrders.filter(o => o.status === 'completed').length,
  [activeOrders]);

  const pendingOrders = useMemo(() =>
    activeOrders.filter(o => o.status !== 'completed').length,
  [activeOrders]);

  const avgTicket = todaySales.length > 0 ? totalRevenue / todaySales.length : 0;

  // All orders to show: active + completed, sorted newest first
  const allOrders = [...activeOrders].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">

      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-5 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-pizza-red" />
              Pedidos del Día
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 capitalize flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pendingOrders > 0 && (
              <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                {pendingOrders} activo{pendingOrders !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6 hide-scrollbar">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <KpiCard
            icon={DollarSign}
            label="Ingresos del Día"
            value={`$${totalRevenue.toFixed(2)}`}
            sub={`${todaySales.length} transacciones`}
            iconBg="bg-red-50"
            iconColor="text-pizza-red"
            trend="+12%"
          />
          <KpiCard
            icon={Pizza}
            label="Pizzas Vendidas"
            value={totalPizzas}
            sub="Unidades totales"
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
            trend="+8%"
          />
          <KpiCard
            icon={ShoppingBag}
            label="Pedidos Totales"
            value={todaySales.length + activeOrders.length}
            sub={`${completedOrders} entregados · ${pendingOrders} activos`}
            iconBg="bg-blue-50"
            iconColor="text-blue-500"
          />
          <KpiCard
            icon={TrendingUp}
            label="Ticket Promedio"
            value={`$${avgTicket.toFixed(2)}`}
            sub="Por pedido"
            iconBg="bg-emerald-50"
            iconColor="text-emerald-500"
            trend="+5%"
          />
        </div>

        {/* Orders list */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Historial de Pedidos</h2>
            <span className="text-xs text-slate-400 font-medium">{allOrders.length} pedido(s)</span>
          </div>

          <div className="divide-y divide-slate-50">
            {/* Column labels */}
            <div className="flex items-center gap-4 px-5 py-2.5 bg-slate-50/60">
              <span className="w-24 shrink-0 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pedido</span>
              <span className="flex-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Detalle</span>
              <span className="w-20 shrink-0 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
              <span className="shrink-0 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-28 text-center">Estado</span>
            </div>

            {allOrders.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-3 text-slate-300">
                <ShoppingBag className="w-12 h-12" />
                <p className="font-semibold">Sin pedidos registrados hoy</p>
              </div>
            ) : (
              allOrders.map(order => (
                <OrderRow key={order.id} order={order} />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
