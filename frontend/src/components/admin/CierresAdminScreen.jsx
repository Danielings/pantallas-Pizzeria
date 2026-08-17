import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  DollarSign,
  TrendingUp,
  Clock,
  Search,
  ArrowUpDown,
  Eye,
  Calendar,
  X,
  FileText,
  User,
  ShoppingBag,
  Key,
  Lock,
  Unlock,
  Download
} from "lucide-react";
import { exportCierrePDF } from "../../utils/pdfCierre";

const API_BASE = "http://localhost:3001/api";

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

const formatTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};

export default function CierresAdminScreen() {
  const [cierres, setCierres] = useState([]);
  const [metrics, setMetrics] = useState({
    mes: "",
    cantidad_cierres: 0,
    total_usd: 0,
    promedio_usd: 0,
    ultima_hora_ayer: "Ninguno"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchDate, setSearchDate] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' o 'desc'
  const [selectedCierre, setSelectedCierre] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Pin Modal states
  const [openPinModal, setOpenPinModal] = useState(false);
  const [cajeros, setCajeros] = useState([]);
  const [loadingCajeros, setLoadingCajeros] = useState(false);
  const [editingCajero, setEditingCajero] = useState(null);
  const [newPin, setNewPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedCajeroId, setSelectedCajeroId] = useState("");

  useEffect(() => {
    const fetchCierres = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_BASE}/cierre/historial`);
        if (response.data.success) {
          setCierres(response.data.cierres);
          setMetrics(response.data.metrics);
        }
      } catch (error) {
        console.error("Error al cargar historial de cierres:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCierres();
  }, []);

  // Cargar cajeros para gestionar PINs
  useEffect(() => {
    if (openPinModal) {
      const fetchCajeros = async () => {
        setLoadingCajeros(true);
        setErrorMsg("");
        setSuccessMsg("");
        try {
          const response = await axios.get(`${API_BASE}/cierre/cajeros`);
          if (response.data.success) {
            setCajeros(response.data.cajeros);
            if (response.data.cajeros.length > 0) {
              setSelectedCajeroId(String(response.data.cajeros[0].id_usuario));
            }
          }
        } catch (error) {
          console.error("Error al obtener cajeros:", error);
          setErrorMsg("Error al cargar la lista de cajeros");
        } finally {
          setLoadingCajeros(false);
        }
      };
      fetchCajeros();
    }
  }, [openPinModal]);

  // Resetear página al cambiar búsquedas o filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchDate, sortOrder]);

  // Filtrar y ordenar cierres
  const filteredAndSortedCierres = useMemo(() => {
    let result = [...cierres];

    // Filtrar por día (YYYY-MM-DD o formato similar)
    if (searchDate) {
      result = result.filter((c) => {
        const cDate = new Date(c.fecha_hora).toISOString().split("T")[0];
        return cDate === searchDate;
      });
    }

    // Ordenar por fecha
    result.sort((a, b) => {
      const dateA = new Date(a.fecha_hora).getTime();
      const dateB = new Date(b.fecha_hora).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [cierres, searchDate, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedCierres.length / 10);

  const paginatedCierres = useMemo(() => {
    const startIndex = (currentPage - 1) * 10;
    return filteredAndSortedCierres.slice(startIndex, startIndex + 10);
  }, [filteredAndSortedCierres, currentPage]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleSavePin = async (id_usuario) => {
    if (!/^\d{4}$/.test(newPin)) {
      setErrorMsg("El PIN debe tener exactamente 4 números.");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const response = await axios.put(`${API_BASE}/cierre/cajero-pin`, {
        id_usuario,
        pin: newPin
      });
      if (response.data.success) {
        setSuccessMsg("PIN actualizado correctamente.");
        setCajeros((prev) =>
          prev.map((c) => (c.id_usuario === id_usuario ? { ...c, pin: newPin } : c))
        );
        setEditingCajero(null);
        setNewPin("");
      }
    } catch (error) {
      console.error("Error al guardar PIN:", error);
      setErrorMsg(error.response?.data?.mensaje || "Error al actualizar el PIN.");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 hide-scrollbar flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800">
            Control de Cierres de Caja
          </h2>
          <p className="text-slate-500 text-sm">
            Visualiza y audita los cierres diarios realizados por los cajeros
          </p>
        </div>

        {/* Botones de acción en el header */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setOpenPinModal(true)}
            className="flex items-center gap-1.5 bg-pizza-red hover:bg-red-600 text-white px-4 py-2.5 text-sm font-bold rounded-xl shadow-sm transition-all shrink-0 active:scale-[0.98]"
            title="Administrar PINs de cierres para cajeros"
          >
            <Key className="w-4 h-4" />
            <span>Claves Cajeros</span>
          </button>
          <span className="text-sm font-bold text-slate-500 bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl flex items-center gap-1 shrink-0">
            Total: {filteredAndSortedCierres.length} registros
          </span>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 shrink-0">
        {/* Cantidad Cierres del Mes */}
        <div className="bg-purple-50/70 border border-purple-100/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(139,92,246,0.2)]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-purple-500 uppercase tracking-wider">
                Cierres en el Mes
              </p>
              <p className="text-slate-800 text-lg font-black leading-none mt-1">
                {isLoading ? "—" : metrics.cantidad_cierres}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2.5 py-0.5 rounded-full">
            {metrics.mes || "Mes"}
          </span>
        </div>

        {/* Monto Total en $ del Mes */}
        <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(16,185,129,0.2)]">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider">
                Total en $ del Mes
              </p>
              <p className="text-slate-800 text-lg font-black leading-none mt-1">
                {isLoading ? "—" : formatMoney(metrics.total_usd)}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full">
            {metrics.mes || "Mes"}
          </span>
        </div>

        {/* Última Hora de Cierre del Día Anterior */}
        <div className="bg-blue-50/70 border border-blue-100/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(59,130,246,0.2)]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-blue-500 uppercase tracking-wider">
                Cierre de ayer
              </p>
              <p className="text-slate-800 text-sm font-black leading-none mt-1.5 truncate max-w-[140px]">
                {isLoading ? "—" : metrics.ultima_hora_ayer}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2.5 py-0.5 rounded-full">
            Hora
          </span>
        </div>

        {/* Promedio de $ por Cierre */}
        <div className="bg-amber-50/70 border border-amber-100/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(245,158,11,0.2)]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider">
                Monto Promedio Cierre
              </p>
              <p className="text-slate-800 text-lg font-black leading-none mt-1">
                {isLoading ? "—" : formatMoney(metrics.promedio_usd)}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2.5 py-0.5 rounded-full">
            Ticket Prom.
          </span>
        </div>
      </div>

      {/* Tabla de Cierres */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden shrink-0 flex-1 flex flex-col min-h-0">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">
              Historial de Cierres
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Lista completa de cajas cerradas en la pizzería
            </p>
          </div>
          {/* Filtros de fecha y orden */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold uppercase">
                Día:
              </span>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="bg-white border border-slate-200 text-slate-800 rounded-xl pl-12 pr-8 py-2 text-sm focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all shadow-sm"
              />
              {searchDate && (
                <button
                  onClick={() => setSearchDate("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={toggleSortOrder}
              className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-3 py-2 text-sm font-semibold rounded-xl hover:bg-slate-50 shadow-sm transition-all shrink-0"
              title="Cambiar orden por fecha"
            >
              <ArrowUpDown className="w-4 h-4 text-slate-500" />
              <span>Fecha: {sortOrder === "asc" ? "ASC" : "DESC"}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto flex-1 min-h-0">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold text-xs uppercase tracking-wider text-left sticky top-0 animate-fade-in">
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Fecha</th>
                <th className="px-5 py-3.5">Hora</th>
                <th className="px-5 py-3.5">Cajero / Usuario</th>
                <th className="px-5 py-3.5 text-center">Órdenes</th>
                <th className="px-5 py-3.5 text-right">Efectivo USD</th>
                <th className="px-5 py-3.5 text-right">Total Cierre (USD)</th>
                <th className="px-5 py-3.5 text-center">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <p className="font-medium">Cargando historial de cierres...</p>
                  </td>
                </tr>
              ) : paginatedCierres.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">No se encontraron cierres para el filtro seleccionado</p>
                  </td>
                </tr>
              ) : (
                paginatedCierres.map((cierre) => (
                  <tr key={cierre.id_cierre} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-3.5 text-slate-400 text-xs font-bold">
                      #{cierre.id_cierre}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">
                      {formatDate(cierre.fecha_hora)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">
                      {formatTime(cierre.fecha_hora)}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                          {cierre.usuario_nombre?.charAt(0) || "U"}
                        </div>
                        <span>{cierre.usuario_nombre || "Cajero Desconocido"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-800">
                      {cierre.num_ordenes}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-600">
                      {formatMoney(cierre.monto_efectivo_usd)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-extrabold text-emerald-600">
                      {formatMoney(cierre.total_usdt)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedCierre(cierre)}
                          className="p-1 text-slate-400 hover:text-pizza-red hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 duration-150"
                          title="Ver desglose detallado"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => exportCierrePDF(cierre)}
                          className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 duration-150"
                          title="Descargar PDF"
                        >
                          <Download className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Controles de paginación */}
        {!isLoading && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0 select-none">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1"
            >
              Anterior
            </button>
            <span className="text-xs font-extrabold text-slate-500">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Modal de Detalle */}
      {selectedCierre && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-fade-in max-h-[90vh]">
            {/* Header Modal */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white relative">
              <button
                onClick={() => setSelectedCierre(null)}
                className="absolute right-4 top-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-slate-300 hover:text-white transition-all duration-300 hover:rotate-90"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-pizza-red/20 border border-pizza-red/30 flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-red-300" />
              </div>
              <h2 className="text-xl font-bold">Detalle del Cierre #{selectedCierre.id_cierre}</h2>
              <p className="text-slate-400 text-sm mt-1">
                Realizado el {formatDate(selectedCierre.fecha_hora)} a las {formatTime(selectedCierre.fecha_hora)}
              </p>
            </div>

            {/* Contenido Modal */}
            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              {/* Info General */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-lg bg-pizza-red/10 flex items-center justify-center text-pizza-red">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Cajero Responsable</p>
                  <p className="text-sm font-bold text-slate-800">{selectedCierre.usuario_nombre}</p>
                </div>
              </div>

              {/* Órdenes */}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50/50 rounded-lg text-sm border border-slate-100/50">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-slate-400" />
                  Órdenes Procesadas
                </span>
                <span className="font-extrabold text-slate-800">{selectedCierre.num_ordenes}</span>
              </div>

              {/* Desglose de Montos */}
              <div className="flex flex-col gap-2 mt-2">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">Desglose de Caja</h4>
                
                <div className="flex flex-col gap-1 border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {/* Efectivo USD */}
                  <div className="flex items-center justify-between p-3 text-sm bg-emerald-50/10">
                    <span className="text-slate-600 font-medium">Efectivo (USD)</span>
                    <span className="font-bold text-slate-800">{formatMoney(selectedCierre.monto_efectivo_usd)}</span>
                  </div>

                  {/* Efectivo Bs */}
                  <div className="flex items-center justify-between p-3 text-sm">
                    <span className="text-slate-600 font-medium">Efectivo (Bs)</span>
                    <span className="font-bold text-slate-800">Bs. {Number(selectedCierre.monto_efectivo_bs || 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span>
                  </div>

                  {/* Punto Bs */}
                  <div className="flex items-center justify-between p-3 text-sm">
                    <span className="text-slate-600 font-medium">Punto de Venta (Bs)</span>
                    <span className="font-bold text-slate-800">Bs. {Number(selectedCierre.monto_punto_bs || 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span>
                  </div>

                  {/* Pago Móvil Bs */}
                  <div className="flex items-center justify-between p-3 text-sm">
                    <span className="text-slate-600 font-medium">Pago Móvil (Bs)</span>
                    <span className="font-bold text-slate-800">Bs. {Number(selectedCierre.monto_pago_movil_bs || 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Total Final */}
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Total Registrado</p>
                  <p className="text-xs text-slate-400 mt-0.5">En divisas equivalentes (USDT)</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-emerald-600">{formatMoney(selectedCierre.total_usdt)}</span>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center gap-3">
              <button
                onClick={() => exportCierrePDF(selectedCierre)}
                className="flex-1 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-slate-950 hover:shadow-lg text-white py-2.5 px-4 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                Descargar PDF
              </button>
              <button
                onClick={() => setSelectedCierre(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Claves Cajeros */}
      {openPinModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-fade-in max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white relative">
              <button
                onClick={() => {
                  setOpenPinModal(false);
                  setEditingCajero(null);
                  setNewPin("");
                }}
                className="absolute right-4 top-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-slate-300 hover:text-white transition-all duration-300 hover:rotate-90"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-pizza-red/20 border border-pizza-red/30 flex items-center justify-center mb-3">
                <Key className="w-6 h-6 text-red-300" />
              </div>
              <h2 className="text-xl font-bold">PINs de Cierre</h2>
              <p className="text-slate-400 text-sm mt-1">Asigna claves de 4 números para cajeros</p>
            </div>

            {/* Contenido */}
            <div className="p-6 flex flex-col gap-4 overflow-y-auto bg-slate-50/30">
              {errorMsg && (
                <div className="bg-red-50 text-red-600 border border-red-100 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-sm animate-shake">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-sm">
                  {successMsg}
                </div>
              )}

              {loadingCajeros ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-pizza-red/20 border-t-pizza-red animate-spin"></div>
                  <p className="text-slate-400 text-sm font-semibold">Cargando cajeros...</p>
                </div>
              ) : cajeros.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <User className="w-10 h-10 mb-2 opacity-35" />
                  <p className="text-sm font-bold">No hay cajeros registrados activos</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Selector de Cajero */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                      Seleccionar Cajero
                    </label>
                    <select
                      value={selectedCajeroId}
                      onChange={(e) => {
                        setSelectedCajeroId(e.target.value);
                        setEditingCajero(null);
                        setNewPin("");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all w-full shadow-sm font-semibold"
                    >
                      {cajeros.map((c) => (
                        <option key={c.id_usuario} value={c.id_usuario}>
                          {c.nombre_completo} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Detalle y Gestión del Cajero Seleccionado */}
                  {(() => {
                    const activeCajero = cajeros.find(c => String(c.id_usuario) === String(selectedCajeroId));
                    if (!activeCajero) return null;
                    const isEditing = editingCajero?.id_usuario === activeCajero.id_usuario;

                    return (
                      <div className="border border-slate-100 rounded-2xl p-5 bg-white shadow-sm flex flex-col gap-4 transition-all duration-300">
                        {/* Info del Cajero */}
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-base shrink-0 shadow-sm">
                            {activeCajero.nombre_completo?.charAt(0) || "U"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-black text-slate-800 truncate">{activeCajero.nombre_completo}</p>
                            <p className="text-xs text-slate-400 font-medium truncate">{activeCajero.email}</p>
                          </div>
                          <div className="shrink-0">
                            {activeCajero.pin ? (
                              <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>PIN Activo</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold text-red-500 bg-red-50 border border-red-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                                <Unlock className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                <span>Sin Clave</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Configuración de PIN */}
                        <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                          {isEditing ? (
                            <div className="flex flex-col gap-3">
                              <p className="text-xs font-semibold text-slate-500">
                                Introduce el nuevo PIN de seguridad de 4 dígitos:
                              </p>
                              <div className="flex items-center gap-3">
                                <input
                                  type="text"
                                  maxLength={4}
                                  placeholder="0000"
                                  value={newPin}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, ""); // solo números
                                    setNewPin(val);
                                  }}
                                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all w-28 text-center font-mono font-black tracking-[0.3em] shadow-inner"
                                  autoFocus
                                />
                                <div className="flex items-center gap-2 flex-1 justify-end">
                                  <button
                                    onClick={() => handleSavePin(activeCajero.id_usuario)}
                                    className="bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-slate-950 hover:shadow-lg text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md transition-all flex-1 max-w-[100px] text-center active:scale-[0.98]"
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingCajero(null);
                                      setNewPin("");
                                      setErrorMsg("");
                                    }}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all flex-1 max-w-[100px] text-center"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                              <span className="text-xs text-slate-500 font-medium">
                                {activeCajero.pin ? "El usuario ya posee una clave activa para cierres." : "Este usuario no tiene clave asignada."}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingCajero(activeCajero);
                                  setNewPin(activeCajero.pin || "");
                                  setErrorMsg("");
                                  setSuccessMsg("");
                                }}
                                className="text-xs font-bold text-pizza-red bg-red-50 hover:bg-pizza-red hover:text-white border border-pizza-red/10 px-4 py-2 rounded-xl transition-all shadow-sm shrink-0"
                              >
                                {activeCajero.pin ? "Cambiar PIN" : "Asignar PIN"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => {
                  setOpenPinModal(false);
                  setEditingCajero(null);
                  setNewPin("");
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
