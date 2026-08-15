import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useApp } from "../context/AppContext";
import {
  DollarSign,
  ClipboardList,
  AlertCircle,
  X,
  Lock,
  CheckCircle2,
  Calendar,
  CreditCard,
  Smartphone,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";

const API = "http://localhost:3001/api";

export default function CierreScreen() {
  const {
    clearCart,
    fetchPedidosActivos,
    fetchPedidosCocina,
    fetchPedidosHorno,
    fetchPendientes,
    fetchMesero,
  } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [claveCierre, setClaveCierre] = useState("");

  useEffect(() => {
    fetchResumenDia();
  }, []);

  const fetchResumenDia = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/cierre/resumen-dia`, {
        withCredentials: true,
      });
      setData(res.data);
    } catch {
      window.Toast?.fire({
        icon: "error",
        title: "No se pudo cargar la información del cierre",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartCierre = async () => {
    if (!data || data.total_divisa <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Caja sin Movimientos",
        text: "No se puede efectuar el cierre de caja porque los montos se encuentran en 0Bs/$.",
        confirmButtonColor: "#EA2A33",
        background: "#ffffff",
        customClass: {
          popup: "rounded-2xl font-sans shadow-xl border border-slate-100",
          title: "text-base font-black text-slate-800",
          confirmButton: "px-5 py-2.5 font-bold rounded-xl text-sm",
        },
      });
      return;
    }

    // 2. Verificar pedidos pendientes primero
    try {
      const check = await axios.get(`${API}/cierre/pedidos-pendientes`, {
        withCredentials: true,
      });
      if (check.data.bloqueado) {
        Swal.fire({
          icon: "error",
          title: "¡Cola activa!",
          html: `
            <div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding-top:4px">
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:10px 20px;font-size:2rem;font-weight:900;color:#dc2626;letter-spacing:-1px">
                ${check.data.pendientes}
              </div>
              <p style="margin:0;font-size:13px;color:#64748b;font-weight:600;text-align:center;line-height:1.5">
                orden(es) pendiente(s) en cola.<br>
                <span style="color:#94a3b8;font-size:12px;font-weight:500">Complétalas antes de cerrar caja.</span>
              </p>
            </div>`,
          confirmButtonColor: "#EA2A33",
          confirmButtonText: "Entendido",
          background: "#ffffff",
          customClass: {
            popup: "rounded-2xl font-sans shadow-xl border border-slate-100",
            title: "text-base font-black text-slate-800",
            confirmButton: "px-5 py-2.5 font-bold rounded-xl text-sm",
          },
        });
        return;
      }
    } catch {
      Swal.fire({
        icon: "warning",
        title: "Sin conexión",
        text: "No se pudo verificar la cola de trabajo.",
        confirmButtonColor: "#EA2A33",
        background: "#fff",
      });
      return;
    }

    // 3. Si no hay pendientes y los montos son > 0, mostrar confirmación
    Swal.fire({
      title: "¿Efectuar Cierre de Caja?",
      text: "¿Está seguro de que desea iniciar el proceso de cierre de caja para el día de hoy?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EA2A33",
      cancelButtonColor: "#94A3B8",
      confirmButtonText: "Sí, continuar",
      cancelButtonText: "Cancelar",
      background: "#ffffff",
      customClass: {
        popup: "rounded-2xl border border-slate-100 font-sans shadow-xl",
        title: "text-lg font-black text-slate-800",
        htmlContainer: "text-sm text-slate-500",
        confirmButton: "px-5 py-2.5 font-bold rounded-xl text-sm mx-2",
        cancelButton: "px-4 py-2.5 font-semibold rounded-xl text-sm mx-2",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        setShowDetailModal(true);
      }
    });
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();

    if (!claveCierre.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Clave requerida",
        text: "Debe ingresar la Clave de Cierre para continuar.",
        confirmButtonColor: "#EA2A33",
        confirmButtonText: "Entendido",
        background: "#ffffff",
        customClass: {
          popup: "rounded-2xl font-sans shadow-xl border border-slate-100",
          title: "text-lg font-black text-slate-800",
          htmlContainer: "text-sm text-slate-500",
          confirmButton: "px-5 py-2.5 font-bold rounded-xl text-sm",
        },
      });
      return;
    }

    const currentUser = JSON.parse(
      localStorage.getItem("currentUser") || "null",
    );

    try {
      await axios.post(
        `${API}/cierre-caja`,
        {
          id_usuario: currentUser?.id ?? 1,
          pin: claveCierre.trim(),
          monto_efectivo_usd: Number(desglose_pagos.efectivo_usd || 0),
          monto_efectivo_bs: Number(desglose_pagos.efectivo_bs || 0),
          monto_punto_bs: Number(desglose_pagos.punto_de_venta_bs || 0),
          monto_pago_movil_bs: Number(desglose_pagos.transferencia_bs || 0),
          total_usdt: Number(total_divisa || 0),
          num_ordenes: Number(total_ordenes || 0),
        },
        { withCredentials: true },
      );

      setClaveCierre("");
      setShowDetailModal(false);
      clearCart();
      fetchPedidosActivos();
      fetchPedidosCocina();
      fetchPedidosHorno();
      fetchPendientes();
      fetchMesero();
      await fetchResumenDia();

      window.Toast.fire({
        icon: "success",
        title: "¡Cierre de caja realizado exitosamente!",
      });
    } catch (error) {
      if (error.response?.status === 401) {
        window.Toast.fire({
          icon: "error",
          title: "Clave de cierre incorrecta",
        });
        return;
      }

      window.Toast.fire({
        icon: "error",
        title:
          error.response?.data?.mensaje ||
          "No se pudo completar el cierre de caja",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f4f7fc]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-pizza-red border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-500">
            Calculando Relación del Día...
          </span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f4f7fc]">
        <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-slate-100">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-slate-800 font-bold">Error de Conexión</p>
          <p className="text-slate-500 text-sm mt-1 mb-4">
            No se pudo cargar la información de cierre.
          </p>
          <button
            onClick={fetchResumenDia}
            className="px-5 py-2.5 bg-pizza-red text-white font-bold rounded-xl text-sm hover:bg-pizza-red-dark transition-all"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const {
    fecha_consulta,
    total_divisa,
    ventas_totales,
    total_ordenes,
    ticket_promedio,
    anulaciones,
    propinas,
    desglose_pagos,
    transacciones,
  } = data;

  // El donut usa los montos en Bs. para Punto/Transf y USD para Efectivo — comparamos en Bs convertido
  const tasa = data.tasa_cambio || 1;
  const pvUSD = tasa > 0 ? desglose_pagos.punto_de_venta_bs / tasa : 0;
  const trUSD = tasa > 0 ? desglose_pagos.transferencia_bs / tasa : 0;
  const totalMetodosUSD = desglose_pagos.efectivo_usd + pvUSD + trUSD;
  const pctEfectivo =
    totalMetodosUSD > 0
      ? Math.round((desglose_pagos.efectivo_usd / totalMetodosUSD) * 100)
      : 0;
  const pctTarjeta =
    totalMetodosUSD > 0 ? Math.round((pvUSD / totalMetodosUSD) * 100) : 0;
  const pctTransferencia =
    totalMetodosUSD > 0 ? Math.round((trUSD / totalMetodosUSD) * 100) : 0;

  // Donut SVG
  const R = 40;
  const C = 2 * Math.PI * R;
  const dashEfectivo = (pctEfectivo / 100) * C;
  const dashTarjeta = (pctTarjeta / 100) * C;
  const dashTransf = (pctTransferencia / 100) * C;
  const offTarjeta = C - dashEfectivo;
  const offTransf = C - dashEfectivo - dashTarjeta;

  // Formato Bs.
  const fmtBs = (n) =>
    n.toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 gap-6 overflow-y-auto w-full h-full bg-[#f4f7fc]">
      {/* ── HEADER ── */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-100 rounded-3xl px-6 py-5 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-pizza-red/10 rounded-2xl flex items-center justify-center text-pizza-red shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none">
              Relación del Día
            </h1>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mt-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Fecha: <span className="text-slate-600">{fecha_consulta}</span>
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchResumenDia}
            className="w-10 h-10 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleStartCierre}
            className="px-6 py-3 bg-pizza-red text-white hover:bg-pizza-red-dark transition-all font-bold rounded-2xl text-sm shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Cierre de Caja
          </button>
        </div>
      </header>

      {/* ── HERO BALANCE + DONUT + LEYENDA ── */}
      <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Balance */}
        <div className="lg:col-span-5 flex flex-col gap-6 border-r border-slate-100 pr-0 lg:pr-8">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total en Divisa (USDT)
            </span>
            <h2 className="text-5xl font-black text-slate-800 tracking-tight mt-1 flex items-baseline gap-1.5">
              ${total_divisa.toFixed(2)}
              <span className="text-sm font-bold text-slate-400">USD</span>
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Suma de todos los canales convertidos a dólares (tasa activa)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Efectivo USD */}
            <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-100 text-orange-500 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-sm">
                $
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider truncate">
                  Efectivo USD
                </p>
                <p className="text-sm font-extrabold text-slate-700">
                  ${desglose_pagos.efectivo_usd.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Efectivo Bs */}
            <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 text-blue-500 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-xs">
                Bs
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider truncate">
                  Efectivo Bs.
                </p>
                <p className="text-sm font-extrabold text-slate-700">
                  {desglose_pagos.efectivo_bs.toLocaleString("es-VE", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>

            {/* Punto */}
            <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 bg-cyan-100 text-cyan-500 rounded-xl flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider truncate">
                  Punto / Tarjeta
                </p>
                <p className="text-sm font-extrabold text-slate-700">
                  Bs. {fmtBs(desglose_pagos.punto_de_venta_bs)}
                </p>
              </div>
            </div>

            {/* Transferencia */}
            <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-100 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider truncate">
                  Transf. / Pago Móvil
                </p>
                <p className="text-sm font-extrabold text-slate-700">
                  Bs. {fmtBs(desglose_pagos.transferencia_bs)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Donut */}
        <div className="lg:col-span-3 flex justify-center items-center">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth="10"
              />
              {dashEfectivo > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={R}
                  fill="transparent"
                  stroke="#fb923c"
                  strokeWidth="10"
                  strokeDasharray={`${dashEfectivo} ${C}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
              )}
              {dashTarjeta > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={R}
                  fill="transparent"
                  stroke="#22d3ee"
                  strokeWidth="10"
                  strokeDasharray={`${dashTarjeta} ${C}`}
                  strokeDashoffset={offTarjeta}
                  strokeLinecap="round"
                />
              )}
              {dashTransf > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={R}
                  fill="transparent"
                  stroke="#34d399"
                  strokeWidth="10"
                  strokeDasharray={`${dashTransf} ${C}`}
                  strokeDashoffset={offTransf}
                  strokeLinecap="round"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col justify-center items-center">
              <span className="text-2xl font-black text-slate-800">
                {total_ordenes}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Órdenes
              </span>
            </div>
          </div>
        </div>

        {/* Leyenda */}
        <div className="lg:col-span-4 space-y-4">
          {[
            { color: "bg-orange-400", label: "Efectivo USD", pct: pctEfectivo },
            { color: "bg-cyan-400", label: "Tarjeta / POS", pct: pctTarjeta },
            {
              color: "bg-emerald-400",
              label: "Móvil / Transf.",
              pct: pctTransferencia,
            },
          ].map(({ color, label, pct }) => (
            <div key={label}>
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <span className="text-xs font-semibold text-slate-500">
                    {label}
                  </span>
                </div>
                <span className="text-xs font-black text-slate-700">
                  {pct}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} rounded-full transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── WALLET CARDS ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            gradient: "from-[#f59e0b] to-[#ea580c]",
            icon: "$",
            label: "Efectivo USD",
            sub: "Billetes en Caja",
            value: `$${desglose_pagos.efectivo_usd.toFixed(2)}`,
            textLight: "text-orange-100",
          },
          {
            gradient: "from-[#60a5fa] to-[#2563eb]",
            icon: "Bs",
            label: "Efectivo Local (Bs.)",
            sub: "Bolívares en Caja",
            value: `Bs. ${fmtBs(desglose_pagos.efectivo_bs)}`,
            textLight: "text-blue-100",
          },
          {
            gradient: "from-[#22d3ee] to-[#0891b2]",
            icon: <CreditCard className="w-5 h-5" />,
            label: "Punto de Venta",
            sub: "Tarjeta / Débito — en Bs.",
            value: `Bs. ${fmtBs(desglose_pagos.punto_de_venta_bs)}`,
            textLight: "text-cyan-100",
          },
          {
            gradient: "from-[#34d399] to-[#059669]",
            icon: <Smartphone className="w-5 h-5" />,
            label: "Transferencia / PM",
            sub: "Pago Móvil & Transf. — en Bs.",
            value: `Bs. ${fmtBs(desglose_pagos.transferencia_bs)}`,
            textLight: "text-emerald-100",
          },
        ].map(({ gradient, icon, label, sub, value, textLight }) => (
          <div
            key={label}
            className={`bg-gradient-to-b ${gradient} rounded-3xl p-5 shadow-sm text-white flex flex-col justify-between h-44 relative overflow-hidden`}
          >
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
              <DollarSign className="w-32 h-32" />
            </div>
            <div
              className={`w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold text-sm`}
            >
              {icon}
            </div>
            <div>
              <p
                className={`text-[10px] font-black uppercase tracking-widest ${textLight} mb-1`}
              >
                {label}
              </p>
              <p className="text-2xl font-black truncate">{value}</p>
              <p className={`text-[10px] ${textLight} mt-0.5`}>{sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── TABLA DE TRANSACCIONES MEJORADA ── */}
      <section className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-black text-slate-800 tracking-tight">
            Últimas Transacciones del Día
          </h3>
          <span className="text-xs px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full font-bold">
            {total_ordenes} órdenes en total
          </span>
        </div>

        {transacciones && transacciones.length > 0 ? (
          <div className="space-y-2">
            {transacciones.map((t, i) => (
              <div
                key={t.id_venta}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-slate-50 ${i < transacciones.length - 1 ? "border-b border-slate-50" : ""}`}
              >
                <div className="w-10 h-10 bg-pizza-red/10 text-pizza-red rounded-xl flex items-center justify-center font-black text-xs shrink-0">
                  #{t.id_venta}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {t.nombre_cliente || "Cliente General"}
                  </p>
                  <p className="text-xs text-slate-400 font-semibold">
                    {t.hora}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 bg-slate-100 text-slate-500 font-bold rounded-lg shrink-0">
                  {t.despacho}
                </span>
                <p className="text-sm font-black text-slate-800 shrink-0">
                  ${t.monto_total_usd.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">
              No se registraron ventas en esta fecha.
            </p>
          </div>
        )}
      </section>

      {/* ── MODAL PASO 2: DETALLE Y CLAVE ── */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pizza-red/10 rounded-xl flex items-center justify-center text-pizza-red">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                  Firma y Cuadre de Cierre
                </h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-all p-1.5 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFinalSubmit} className="space-y-4">
              {/* Resumen cuadre */}
              <div className="bg-[#f8fafc] rounded-2xl p-4 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Cuadre del Día
                </p>
                <div className="space-y-2.5">
                  {[
                    {
                      label: "Efectivo USD",
                      value: `$${desglose_pagos.efectivo_usd.toFixed(2)}`,
                      color: "text-orange-600",
                    },
                    {
                      label: "Efectivo Bs. (Local)",
                      value: `Bs. ${fmtBs(desglose_pagos.efectivo_bs)}`,
                      color: "text-blue-600",
                    },
                    {
                      label: "Punto de Venta / Tarjeta",
                      value: `Bs. ${fmtBs(desglose_pagos.punto_de_venta_bs)}`,
                      color: "text-cyan-600",
                    },
                    {
                      label: "Transferencia / Pago Móvil",
                      value: `Bs. ${fmtBs(desglose_pagos.transferencia_bs)}`,
                      color: "text-emerald-600",
                    },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-slate-500 font-semibold">
                        {label}
                      </span>
                      <span className={`font-extrabold ${color}`}>{value}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-200 pt-2.5 mt-1 flex justify-between items-center">
                    <span className="text-slate-800 font-black">
                      Total en Divisa (USDT):
                    </span>
                    <span className="text-pizza-red font-black text-lg">
                      ${total_divisa.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Clave */}
              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-2">
                  Clave de Cierre
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={claveCierre}
                  onChange={(e) => setClaveCierre(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pizza-red/20 focus:border-pizza-red transition-all text-sm font-semibold"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm transition-all shadow-md flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar Cierre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
