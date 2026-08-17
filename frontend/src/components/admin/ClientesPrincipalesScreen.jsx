import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Users,
  Search,
  Sparkles,
  ShieldCheck,
  ShoppingBag,
  Star,
  Banknote,
  Smartphone,
  CreditCard,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_BASE = "http://localhost:3001/api";

const VIP_LIMIT = 10;

// Configuración visual de los métodos de pago que existen en la BD
const PAYMENT_METHODS = [
  {
    metodo: "Punto",
    label: "Punto de Venta",
    icon: CreditCard,
    colorText: "text-purple-500",
    colorBg: "bg-purple-100",
    colorBar: "bg-purple-500",
    colorLight: "bg-purple-50/70",
    colorBorder: "border-purple-100/80",
  },
  {
    metodo: "Pago_Movil",
    label: "Pago Móvil",
    icon: Smartphone,
    colorText: "text-blue-500",
    colorBg: "bg-blue-100",
    colorBar: "bg-blue-500",
    colorLight: "bg-blue-50/70",
    colorBorder: "border-blue-100/80",
  },
  {
    metodo: "Efectivo",
    label: "Efectivo",
    icon: Banknote,
    colorText: "text-emerald-500",
    colorBg: "bg-emerald-100",
    colorBar: "bg-emerald-500",
    colorLight: "bg-emerald-50/70",
    colorBorder: "border-emerald-100/80",
  },
];

const FALLBACK_METHOD = {
  label: "Otro",
  icon: Banknote,
  colorText: "text-slate-500",
  colorBg: "bg-slate-100",
  colorBar: "bg-slate-400",
  colorLight: "bg-slate-50/70",
  colorBorder: "border-slate-100/80",
};

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getHeaderDate = () => {
  const date = new Date();
  const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
  const dateString = date.toLocaleDateString("es-ES", options);
  return dateString
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function ClientesPrincipalesScreen() {
  const [customers, setCustomers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(false);
  const [search, setSearch] = useState("");

  // ─── Carga de datos reales (solo lectura) ───
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const cRes = await axios.get(`${API_BASE}/obtener-clientes`);
        if (cRes.data.success) setCustomers(cRes.data.data);
      } catch (error) {
        console.error("Error al cargar clientes principales:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Clientes ordenados por gasto total (desc) → ranking VIP
  const sorted = useMemo(
    () =>
      [...customers].sort(
        (a, b) => Number(b.total || 0) - Number(a.total || 0),
      ),
    [customers],
  );

  const topClients = useMemo(() => sorted.slice(0, VIP_LIMIT), [sorted]);
  const vipIds = useMemo(() => topClients.map((c) => c.id), [topClients]);

  // ─── Métodos de pago SOLO de los clientes del Top 10 ───
  useEffect(() => {
    if (!vipIds.length) {
      setPaymentMethods([]);
      return;
    }
    const load = async () => {
      setIsPaymentsLoading(true);
      try {
        const pRes = await axios.get(`${API_BASE}/metodos-pagos`, {
          params: { clientes: vipIds.join(",") },
        });
        if (pRes.data.success) setPaymentMethods(pRes.data.data);
      } catch (error) {
        console.error("Error al cargar métodos de pago:", error);
      } finally {
        setIsPaymentsLoading(false);
      }
    };
    load();
  }, [vipIds]);

  // ─── Cards ───
  const totalClientes = customers.length;
  const clientesVip = Math.min(VIP_LIMIT, topClients.length);

  const ltvPromedio = useMemo(() => {
    if (!customers.length) return 0;
    const total = customers.reduce((s, c) => s + Number(c.total || 0), 0);
    return total / customers.length;
  }, [customers]);

  const compraMedia = useMemo(() => {
    const total = customers.reduce((s, c) => s + Number(c.total || 0), 0);
    const orders = customers.reduce((s, c) => s + Number(c.orders || 0), 0);
    return orders > 0 ? total / orders : 0;
  }, [customers]);

  const topSpendersData = useMemo(
    () =>
      topClients.slice(0, 6).map((c) => ({
        name: c.name.split(" ")[0],
        Gasto: Number(c.total || 0),
      })),
    [topClients],
  );

  const isVip = (client) => vipIds.includes(client.id);

  // ─── Métodos de pago ───
  const paymentStats = useMemo(() => {
    const realMethods = paymentMethods.filter((m) => m.metodo);
    const totalPayments = realMethods.reduce(
      (s, m) => s + Number(m.cantidad || 0),
      0,
    );
    const items = realMethods
      .map((m) => {
        const cfg =
          PAYMENT_METHODS.find((p) => p.metodo === m.metodo) || FALLBACK_METHOD;
        return {
          ...m,
          cfg,
          percent:
            totalPayments > 0
              ? Math.round((Number(m.cantidad || 0) / totalPayments) * 100)
              : 0,
        };
      })
      .sort((a, b) => b.cantidad - a.cantidad);
    return { totalPayments, items };
  }, [paymentMethods]);

  // ─── Búsqueda dentro del Top 10 ───
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return topClients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.cedula.toLowerCase().includes(q) ||
        String(c.phone).includes(q),
    );
  }, [topClients, search]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 hide-scrollbar flex flex-col gap-4 sm:gap-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-pizza-red/10 rounded-2xl flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-pizza-red" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
              Clientes VIP
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-1.5">
              {getHeaderDate()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-500 bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl flex items-center gap-1 shrink-0">
            Total: {customers.length} registrados
          </span>
        </div>
      </header>

      {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 shrink-0">
        {/* Clientes VIP */}
        <div className="bg-purple-50/70 border border-purple-100/80 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(139,92,246,0.2)]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-purple-500">
                Clientes VIP
              </p>
              <p className="text-slate-800 text-2xl font-black leading-none mt-1">
                {isLoading ? "—" : clientesVip}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
            Top gasto
          </span>
        </div>

        {/* LTV Promedio */}
        <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-500">
                LTV Promedio
              </p>
              <p className="text-slate-800 text-2xl font-black leading-none mt-1">
                {isLoading ? "—" : formatMoney(ltvPromedio)}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
            Por cliente
          </span>
        </div>

        {/* Compra Media */}
        <div className="bg-blue-50/70 border border-blue-100/80 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(59,130,246,0.2)]">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-500">
                Compra Media
              </p>
              <p className="text-slate-800 text-2xl font-black leading-none mt-1">
                {isLoading ? "—" : formatMoney(compraMedia)}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
            Por ticket
          </span>
        </div>

        {/* Total Clientes */}
        <div className="bg-red-50/70 border border-red-100/80 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-pizza-red flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(234,42,51,0.2)]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-pizza-red">
                Total Clientes
              </p>
              <p className="text-slate-800 text-2xl font-black leading-none mt-1">
                {isLoading ? "—" : totalClientes}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-red-600 bg-red-100 px-3 py-1 rounded-full">
            Registrados
          </span>
        </div>
      </div>

      {/* Cuadrícula central */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Métodos de Pago más Usados */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-slate-800 font-extrabold text-base">
                Métodos de Pago más Usados
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Preferencia de cobro de los {VIP_LIMIT} clientes principales
              </p>
            </div>
            {paymentStats.totalPayments > 0 && (
              <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                {paymentStats.totalPayments} pagos
              </span>
            )}
          </div>

          <div className="flex flex-col gap-4 flex-1">
            {isLoading || isPaymentsLoading ? (
              <p className="text-slate-400 text-sm text-center py-6">
                Cargando métodos de pago...
              </p>
            ) : paymentStats.items.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">
                Sin pagos registrados
              </p>
            ) : (
              paymentStats.items.map((m) => {
                const Icon = m.cfg.icon;
                return (
                  <div
                    key={m.metodo}
                    className={`flex flex-col gap-2 p-4 rounded-xl border ${m.cfg.colorLight} ${m.cfg.colorBorder}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.cfg.colorBg}`}
                      >
                        <Icon className={`w-5 h-5 ${m.cfg.colorText}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800">
                          {m.cfg.label}
                        </p>
                        <p className="text-xs text-slate-500">
                          {m.cantidad} pago(s) · {m.ventas} venta(s)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-slate-800">
                          {formatMoney(m.total_usd)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {m.percent}%
                        </p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-white overflow-hidden">
                      <div
                        className={`h-full ${m.cfg.colorBar} rounded-full transition-all duration-700`}
                        style={{ width: `${Math.max(2, m.percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top 6 Mejores Clientes */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-slate-800 font-extrabold text-base">
                Top 6 Mejores Clientes
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Personas con mayor volumen de compras acumulado
              </p>
            </div>
          </div>

          <div className="flex-1 h-[200px] sm:h-[240px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topSpendersData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #f1f5f9",
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#1e293b",
                  }}
                  itemStyle={{ color: "#EA2A33" }}
                  formatter={(value) => [formatMoney(value), "Gasto"]}
                />
                <Bar
                  dataKey="Gasto"
                  fill="#EA2A33"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabla: Top 10 Clientes */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden shrink-0">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">
              Clientes Top
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Los {clientesVip} que más han gastado
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o cédula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all w-full shadow-sm"
              />
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl flex items-center gap-1 shrink-0 shadow-sm">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
              Top {VIP_LIMIT} VIP
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold text-xs uppercase tracking-wider text-left">
                <th className="px-5 py-3.5">N°</th>
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">Cédula</th>
                <th className="px-5 py-3.5">Teléfono</th>
                <th className="px-5 py-3.5 text-center">Compras</th>
                <th className="px-5 py-3.5 text-right">Total Gastado</th>
                <th className="px-5 py-3.5 text-right">Última Visita</th>
                <th className="px-5 py-3.5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-12 text-slate-400"
                  >
                    <p className="font-medium">Cargando clientes...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-12 text-slate-400"
                  >
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">No se encontraron clientes</p>
                  </td>
                </tr>
              ) : (
                filtered.map((customer, index) => {
                  const vip = isVip(customer);
                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-3 text-slate-400 text-xs font-bold">
                        {index + 1}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${vip
                                ? "bg-amber-50 border-amber-200 text-amber-600"
                                : "bg-slate-100 border-slate-200 text-slate-600"
                              }`}
                          >
                            {customer.name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-800">
                            {customer.name}
                          </span>
                          {vip && (
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600 font-mono text-xs">
                        {customer.cedula}
                      </td>
                      <td className="px-5 py-3 text-slate-500 font-mono text-xs">
                        {customer.phone || "—"}
                      </td>
                      <td className="px-5 py-3 text-center font-bold text-slate-800">
                        {customer.orders}
                      </td>
                      <td className="px-5 py-3 text-right font-extrabold text-emerald-600">
                        {formatMoney(customer.total)}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-500 text-xs">
                        {formatDate(customer.lastVisit)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${vip
                              ? "bg-amber-50 border border-amber-100 text-amber-600"
                              : "bg-blue-50 border border-blue-100 text-blue-600"
                            }`}
                        >
                          {vip ? "VIP" : "Regular"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
