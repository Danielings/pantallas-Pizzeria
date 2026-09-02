import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  CreditCard,
  Building2,
  Calendar,
  BarChart2,
  AlertCircle,
  Banknote,
  Smartphone,
  Wallet,
  Pizza,
  IceCream,
  Layers,
  Award,
  Clock,
  PieChart as PieIcon,
  Coffee,
  Package2,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtUSD = (n) =>
  `$${Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtBs = (n) =>
  `Bs. ${Number(n || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function getCurrentMes() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getCurrentSemana() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - startOfYear) / 86400000);
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function navegarPeriodo(periodo, fecha, direction) {
  if (periodo === "mes") {
    const [y, m] = fecha.split("-").map(Number);
    const date = new Date(y, m - 1 + direction, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  } else {
    const [yearStr, weekStr] = fecha.split("-W");
    let year = Number(yearStr);
    let week = Number(weekStr) + direction;
    if (week < 1) {
      year -= 1;
      week = 52;
    } else if (week > 52) {
      year += 1;
      week = 1;
    }
    return `${year}-W${String(week).padStart(2, "0")}`;
  }
}

function formatFechaLabel(periodo, fecha) {
  if (periodo === "mes") {
    const [y, m] = fecha.split("-");
    const date = new Date(Number(y), Number(m) - 1, 1);
    const mes = date.toLocaleDateString("es-ES", { month: "long" });
    return `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${y}`;
  } else {
    const [yearStr, weekStr] = fecha.split("-W");
    const year = parseInt(yearStr);
    const week = parseInt(weekStr);
    const jan4 = new Date(year, 0, 4);
    const jan4Day = jan4.getDay() || 7;
    const monday = new Date(jan4);
    monday.setDate(jan4.getDate() - (jan4Day - 1) + (week - 1) * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d) =>
      d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit" });
    return `${fmt(monday)} al ${fmt(sunday)}`;
  }
}

const getHeaderDate = () => {
  const date = new Date();
  const dateString = date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return dateString
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// ─── Tooltips ────────────────────────────────────────────────────────────────

const CustomAreaTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 shadow-2xl backdrop-blur-md">
        <p className="text-slate-400 text-[11px] mb-1 font-semibold">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="font-extrabold text-xs flex items-center justify-between gap-3">
            <span style={{ color: p.color }}>{p.name}:</span>
            <span className="text-white font-mono">{fmtUSD(p.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 shadow-2xl">
        <p className="text-slate-200 font-bold text-xs">{item.name || item.payload.categoria}</p>
        <p className="text-emerald-400 font-mono font-bold text-sm">{fmtUSD(item.value)}</p>
      </div>
    );
  }
  return null;
};

const PAGO_ICONS = {
  "Efectivo USD": { icon: DollarSign, cls: "text-emerald-600 bg-emerald-50 border-emerald-100" },
  "Efectivo Bs": { icon: Banknote, cls: "text-teal-600 bg-teal-50 border-teal-100" },
  "Punto de Venta": { icon: CreditCard, cls: "text-blue-600 bg-blue-50 border-blue-100" },
  "Pago Móvil": { icon: Smartphone, cls: "text-violet-600 bg-violet-50 border-violet-100" },
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Reportes() {
  const [sucursales, setSucursales] = useState([]);
  const [sucursalId, setSucursalId] = useState(null);
  const [periodo, setPeriodo] = useState("mes");
  const [fecha, setFecha] = useState(getCurrentMes());
  const [modulo, setModulo] = useState("todos"); // 'todos' | 'pizzeria' | 'heladeria'

  const [resumen, setResumen] = useState(null);
  const [comparativa, setComparativa] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [tendencia, setTendencia] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [cierres, setCierres] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load sucursales
  useEffect(() => {
    axios
      .get(`${API_BASE}/reportes/sucursales`, { withCredentials: true })
      .then((r) => {
        const list = r.data.sucursales || [];
        setSucursales(list);
        if (list.length > 0) setSucursalId(list[0].id);
        else setLoading(false);
      })
      .catch((e) => {
        console.error("Error sucursales:", e);
        setLoading(false);
        setError("Error al cargar sucursales.");
      });
  }, []);

  // Fetch report data
  const fetchData = useCallback(async () => {
    if (!sucursalId && sucursales.length > 0) return;
    setLoading(true);
    setError(null);
    try {
      const axiosCfg = {
        withCredentials: true,
        params: { id_sucursal: sucursalId, periodo, fecha, modulo },
      };

      const [resumenRes, pagosRes, tendenciaRes, topRes, cierresRes] =
        await Promise.allSettled([
          axios.get(`${API_BASE}/reportes/resumen`, axiosCfg),
          axios.get(`${API_BASE}/reportes/pagos`, axiosCfg),
          axios.get(`${API_BASE}/reportes/tendencia`, axiosCfg),
          axios.get(`${API_BASE}/reportes/top-productos`, axiosCfg),
          axios.get(`${API_BASE}/reportes/cierres-detalle`, axiosCfg),
        ]);

      if (resumenRes.status === "fulfilled") {
        setResumen(resumenRes.value.data.resumen);
        setComparativa(resumenRes.value.data.comparativa || []);
      }

      if (pagosRes.status === "fulfilled") {
        const rawPagos = pagosRes.value.data.pagos || [];
        const totalUsd = rawPagos.reduce((a, p) => a + p.valor_usd, 0);
        setPagos(
          rawPagos.map((p) => ({
            ...p,
            porcentaje: totalUsd > 0 ? (p.valor_usd / totalUsd) * 100 : 0,
          }))
        );
      }

      if (tendenciaRes.status === "fulfilled") {
        setTendencia(tendenciaRes.value.data.tendencia || []);
      }


      if (topRes.status === "fulfilled") {
        setTopProductos(topRes.value.data.topProductos || []);
      }

      if (cierresRes.status === "fulfilled") {
        setCierres(cierresRes.value.data.cierres || []);
      }
    } catch (e) {
      setError("No se pudieron cargar los datos de reportes.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [sucursalId, sucursales, periodo, fecha, modulo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePeriodo = (p) => {
    setPeriodo(p);
    setFecha(p === "mes" ? getCurrentMes() : getCurrentSemana());
  };

  const handleNavegar = (dir) => {
    setFecha((f) => navegarPeriodo(periodo, f, dir));
  };

  const sucursalActual = sucursales.find((s) => s.id === sucursalId);

  const moduloTheme = {
    todos: { chartStroke: "#0f172a" },
    pizzeria: { chartStroke: "#f59e0b" },
    heladeria: { chartStroke: "#ec4899" },
  }[modulo];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="flex flex-col p-4 sm:p-6 pb-12 gap-5 max-w-[1600px] mx-auto">

        {/* ── HEADER DE NAVEGACIÓN ── */}
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-pizza-red/10 rounded-2xl flex items-center justify-center shrink-0">
              <BarChart2 className="w-5 h-5 text-pizza-red" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none">
                Ventas y Reportes
              </h1>
              <p className="text-[11px] font-semibold text-slate-400 mt-1">
                {getHeaderDate()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* SWITCHER DE NEGOCIO */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-0.5 border border-slate-200/60">
              <button
                onClick={() => setModulo("todos")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${modulo === "todos"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                <Layers className="w-3.5 h-3.5" />
                General
              </button>
              <button
                onClick={() => setModulo("heladeria")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${modulo === "heladeria"
                  ? "bg-pink-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-pink-600"
                  }`}
              >
                <IceCream className="w-3.5 h-3.5" />
                Heladería
              </button>
            </div>

            {/* SELECTOR SUCURSAL */}
            {sucursales.length > 0 && (
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={sucursalId ?? ""}
                  onChange={(e) => setSucursalId(Number(e.target.value))}
                  className="appearance-none pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-pizza-red/20 focus:border-pizza-red cursor-pointer"
                >
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
                <ChevronRight className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
              </div>
            )}

            {/* TOGGLE PERIODO */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/60">
              {["mes", "semana"].map((p) => (
                <button
                  key={p}
                  onClick={() => handlePeriodo(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${periodo === p
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                  {p === "mes" ? "Mes" : "Semana"}
                </button>
              ))}
            </div>

            {/* NAVEGADOR FECHA */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => handleNavegar(-1)}
                className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2.5 text-xs font-bold text-slate-700 border-x border-slate-100 min-w-[100px] text-center">
                {formatFechaLabel(periodo, fecha)}
              </span>
              <button
                onClick={() => handleNavegar(1)}
                className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-100 rounded-2xl shrink-0 text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-xs font-semibold">{error}</p>
          </div>
        )}

        {/* ── METRIC CARDS (ESTILO EXACTO A PRODUCTOS/CIERRES ADMIN) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 shrink-0">

          {/* TOTAL USD */}
          <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-2xl p-3 sm:p-4 w-full min-w-0 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(16,185,129,0.2)]">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] sm:text-[9px] font-extrabold text-emerald-500 uppercase tracking-wider whitespace-nowrap">
                  {modulo === "heladeria" ? "Total Helados" : "Total USD"}
                </p>
                <p className="text-slate-800 text-2xl font-black leading-none mt-1">
                  {loading ? "—" : fmtUSD(resumen?.total_usd ?? 0)}
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
              {resumen ? `${resumen.total_cierres} cierres` : "—"}
            </span>
          </div>

          {/* TOTAL ÓRDENES */}
          <div className="bg-blue-50/70 border border-blue-100/80 rounded-2xl p-3 sm:p-4 w-full min-w-0 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(59,130,246,0.2)]">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] sm:text-[9px] font-extrabold text-blue-500 uppercase tracking-wider whitespace-nowrap">
                  Total Órdenes
                </p>
                <p className="text-slate-800 text-2xl font-black leading-none mt-1">
                  {loading ? "—" : (resumen?.total_ordenes ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
              Completadas
            </span>
          </div>

          {/* TICKET PROMEDIO */}
          <div className="bg-amber-50/70 border border-amber-100/80 rounded-2xl p-3 sm:p-4 w-full min-w-0 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(245,158,11,0.2)]">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] sm:text-[9px] font-extrabold text-amber-500 uppercase tracking-wider whitespace-nowrap">
                  Ticket Prom.
                </p>
                <p className="text-slate-800 text-2xl font-black leading-none mt-1">
                  {loading ? "—" : fmtUSD(resumen?.ticket_promedio_usd ?? 0)}
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
              Por orden
            </span>
          </div>

          {/* PROMEDIO CIERRE / ITEMS HELADERIA */}
          <div className="bg-purple-50/70 border border-purple-100/80 rounded-2xl p-3 sm:p-4 w-full min-w-0 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(139,92,246,0.2)]">
                {modulo === "heladeria" ? (
                  <IceCream className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] sm:text-[9px] font-extrabold text-purple-500 uppercase tracking-wider whitespace-nowrap">
                  {modulo === "heladeria" ? "Helados Vendidos" : "Prom. / Cierre"}
                </p>
                <p className="text-slate-800 text-2xl font-black leading-none mt-1">
                  {loading
                    ? "—"
                    : modulo === "heladeria"
                      ? (resumen?.total_items ?? 0).toLocaleString()
                      : fmtUSD(resumen?.promedio_cierre_usd ?? 0)}
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
              {modulo === "heladeria" ? "Unidades" : "USD/Cierre"}
            </span>
          </div>

        </div>



        {/* ── FILA 1 DE GRÁFICOS (2 PRINCIPALES) ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* GRÁFICO 1: TENDENCIA DE INGRESOS (2 COLS) */}
          <div className="xl:col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                  Tendencia de Ingresos
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  {sucursalActual?.nombre || "Todas las sucursales"} · {formatFechaLabel(periodo, fecha)}
                </p>
              </div>
              <BarChart2 className="w-5 h-5 text-slate-300" />
            </div>

            {loading ? (
              <div className="h-56 bg-slate-50 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={tendencia} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="gradTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={moduloTheme.chartStroke} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={moduloTheme.chartStroke} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `$${v.toFixed(0)}`} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={45} />
                  <Tooltip content={<CustomAreaTooltip />} />
                  <Area type="monotone" dataKey="total_usd" name="Ingreso USD" stroke={moduloTheme.chartStroke} strokeWidth={2.5} fill="url(#gradTrend)" dot={false} activeDot={{ r: 5, fill: moduloTheme.chartStroke }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* GRÁFICO 2: MÉTODOS DE PAGO (1 COL) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Métodos de Pago</h3>
                <p className="text-slate-400 text-xs">Distribución en USD</p>
              </div>
              <CreditCard className="w-5 h-5 text-slate-300" />
            </div>

            {loading ? (
              <div className="h-48 bg-slate-50 rounded-xl animate-pulse" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={pagos} dataKey="valor_usd" nameKey="nombre" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} strokeWidth={0}>
                      {pagos.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-1.5 mt-2 border-t border-slate-100 pt-2">
                  {pagos.map((p) => {
                    const meta = PAGO_ICONS[p.nombre] || { icon: Wallet, cls: "text-slate-600 bg-slate-50" };
                    const Ico = meta.icon;
                    return (
                      <div key={p.nombre} className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ${meta.cls}`}>
                            <Ico className="w-3 h-3" />
                          </span>
                          <span className="font-semibold text-slate-600 truncate">{p.nombre}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-800">{fmtUSD(p.valor_usd)}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

        </div>

        {/* ── FILA 2 DE GRÁFICOS (PRODUCTOS CON MÁS VENTAS Y DÍAS CON MÁS VENTAS) ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* GRÁFICO 3: PRODUCTOS CON MÁS VENTAS Y CUÁNTOS */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <Award className="w-4.5 h-4.5 text-amber-500" />
                  Productos con Más Ventas
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">Top productos y cuántas unidades se vendieron</p>
              </div>
            </div>

            {loading ? (
              <div className="h-52 bg-slate-50 rounded-xl animate-pulse" />
            ) : topProductos.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Award className="w-8 h-8 opacity-30" />
                <p className="text-xs font-semibold">Sin productos registrados en este periodo</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={topProductos.slice(0, 6)}
                  layout="vertical"
                  margin={{ top: 5, right: 25, bottom: 0, left: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="producto_nombre"
                    tick={{ fontSize: 10, fill: "#334155", fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip content={<CustomPieTooltip />} />
                  <Bar dataKey="cantidad_vendida" name="Unidades Vendidas" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* GRÁFICO 4: DÍAS CON MÁS VENTAS */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <Calendar className="w-4.5 h-4.5 text-blue-500" />
                  Días con Más Ventas
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">Ingresos recaudados por cada día del periodo</p>
              </div>
            </div>

            {loading ? (
              <div className="h-52 bg-slate-50 rounded-xl animate-pulse" />
            ) : tendencia.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Calendar className="w-8 h-8 opacity-30" />
                <p className="text-xs font-semibold">Sin ventas registradas en los días</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={tendencia} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={(v) => `$${v.toFixed(0)}`}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                  />
                  <Tooltip content={<CustomAreaTooltip />} />
                  <Bar dataKey="total_usd" name="Total Recaudado (USD)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

        </div>

        {/* ── SECCIÓN TOP PRODUCTOS VENDIDOS ── */}
        {topProductos.length > 0 && (
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${modulo === 'heladeria' ? 'bg-pink-500' : 'bg-amber-500'
                  }`}>
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
                    {modulo === "heladeria"
                      ? "Top Helados Más Vendidos"
                      : modulo === "pizzeria"
                        ? "Top Pizzas y Productos Más Vendidos"
                        : "Productos Más Vendidos"}
                  </h3>
                  <p className="text-slate-400 text-xs">Ranking por unidades vendidas en este periodo</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {topProductos.slice(0, 5).map((prod, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3 flex flex-col justify-between hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">
                      #{idx + 1}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${prod.tipo_producto === 'Helado'
                      ? 'bg-pink-100 text-pink-700'
                      : 'bg-amber-100 text-amber-700'
                      }`}>
                      {prod.tipo_producto}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-800 line-clamp-1">
                      {prod.producto_nombre}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-xs">
                      <span className="text-slate-500 font-medium">
                        {prod.cantidad_vendida} ud(s)
                      </span>
                      <span className="font-mono font-extrabold text-emerald-700">
                        {fmtUSD(prod.total_recaudado_usd)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TABLA CIERRES DE CAJA ── */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Historial de Cierres de Caja</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                {cierres.length} cierres registrados en el periodo
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-9 bg-slate-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : cierres.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Calendar className="w-8 h-8 opacity-30" />
              <p className="text-xs font-semibold">Sin cierres registrados en este periodo</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                    <th className="text-left px-4 py-3">Fecha / Hora</th>
                    <th className="text-left px-4 py-3">Sucursal</th>
                    <th className="text-left px-4 py-3">Cajero</th>
                    <th className="text-right px-4 py-3">Ef. USD</th>
                    <th className="text-right px-4 py-3">Ef. Bs</th>
                    <th className="text-right px-4 py-3">Punto Bs</th>
                    <th className="text-right px-4 py-3">Pago Móvil Bs</th>
                    <th className="text-right px-4 py-3">Órdenes</th>
                    <th className="text-right px-4 py-3">Total USD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {cierres.map((c) => {
                    const fecha_hora = c.fecha_hora ? new Date(c.fecha_hora) : null;
                    return (
                      <tr key={c.id_cierre} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-slate-800 font-semibold whitespace-nowrap">
                          {fecha_hora
                            ? fecha_hora.toLocaleDateString("es-VE", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                            : "—"}
                          <span className="text-slate-400 font-normal ml-1.5">
                            {fecha_hora
                              ? fecha_hora.toLocaleTimeString("es-VE", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                              : ""}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-semibold">
                          {c.sucursal_nombre || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{c.cajero || "—"}</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-700 font-bold">
                          {fmtUSD(c.monto_efectivo_usd)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-teal-700 font-bold">
                          {fmtBs(c.monto_efectivo_bs)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-blue-700 font-bold">
                          {fmtBs(c.monto_punto_bs)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-violet-700 font-bold">
                          {fmtBs(c.monto_pago_movil_bs)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700 font-bold">
                          {c.num_ordenes || 0}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200/80 text-emerald-700 rounded-lg px-2 py-0.5 font-mono font-extrabold">
                            {fmtUSD(c.total_usdt)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {resumen && (
                  <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold text-xs">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-slate-700 uppercase tracking-wider text-[10px]">
                        Totales del Periodo
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-700">
                        {fmtUSD(resumen.efectivo_usd)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-teal-700">
                        {fmtBs(resumen.efectivo_bs)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-blue-700">
                        {fmtBs(resumen.punto_bs)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-violet-700">
                        {fmtBs(resumen.pago_movil_bs)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-800 font-extrabold">
                        {resumen.total_ordenes}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center bg-emerald-500 text-white rounded-lg px-2.5 py-1 font-mono font-black shadow-sm">
                          {fmtUSD(resumen.total_usd)}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
