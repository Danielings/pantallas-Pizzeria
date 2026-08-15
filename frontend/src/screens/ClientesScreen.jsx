import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Users,
  Search,
  Plus,
  Pencil,
  X,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import ClienteForm from "../components/admin/clientes/ClienteForm";

const API_BASE = "http://localhost:3001/api";

const PAGE_SIZE = 15;

// Caché a nivel de módulo: muestra los datos al instante al volver a abrir la pantalla
let cachedCustomers = null;

const formatTotal = (value) => `$${Number(value || 0).toFixed(2)}`;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function ClientesScreen() {
  const [customers, setCustomers] = useState(cachedCustomers || []);
  const [isLoading, setIsLoading] = useState(!cachedCustomers);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name"); // 'name' | 'gasto-desc' | 'gasto-asc'

  // Paginación
  const [page, setPage] = useState(1);

  // Modal crear / editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // ─── Carga de Datos desde la BD ───
  const fetchCustomers = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/obtener-clientes`);
      if (res.data.success) {
        cachedCustomers = res.data.data;
        setCustomers(res.data.data);
      }
    } catch (error) {
      console.error("Error al cargar los clientes:", error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (cachedCustomers) {
      fetchCustomers(true);
    } else {
      fetchCustomers();
    }
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    let list = customers.filter(
      (c) =>
        String(c.name || "").toLowerCase().includes(q) ||
        String(c.cedula || "").toLowerCase().includes(q) ||
        String(c.phone ?? "").includes(q),
    );

    if (sortBy === "gasto-desc") {
      list = [...list].sort(
        (a, b) => Number(b.total || 0) - Number(a.total || 0),
      );
    } else if (sortBy === "gasto-asc") {
      list = [...list].sort(
        (a, b) => Number(a.total || 0) - Number(b.total || 0),
      );
    }

    return list;
  }, [customers, search, sortBy]);

  // Volver a la primera página al cambiar búsqueda o filtros
  useEffect(() => {
    setPage(1);
  }, [search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const pageNumbers = useMemo(() => {
    const pages = [];
    const delta = 2;
    const rangeStart = Math.max(1, safePage - delta);
    const rangeEnd = Math.min(totalPages, safePage + delta);
    if (rangeStart > 1) {
      pages.push(1);
      if (rangeStart > 2) pages.push("...");
    }
    for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
    if (rangeEnd < totalPages) {
      if (rangeEnd < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [safePage, totalPages]);

  const pageFrom = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const pageTo = Math.min(safePage * PAGE_SIZE, filtered.length);

  // ─── Cards de estadísticas ───
  const stats = useMemo(() => {
    const total = customers.length;
    const conCompras = customers.filter((c) => Number(c.orders) > 0).length;
    const ventasTotales = customers.reduce(
      (s, c) => s + (Number(c.total) || 0),
      0,
    );
    const ticketPromedio = conCompras > 0 ? ventasTotales / conCompras : 0;
    return { total, conCompras, ventasTotales, ticketPromedio };
  }, [customers]);

  // ─── Apertura / Cierre de modales ───
  const openCreate = () => {
    setEditingClient(null);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEdit = (client) => {
    setEditingClient(client);
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError("");
    setTimeout(() => setEditingClient(null), 300);
  };

  // ─── Guardar (Crear o Actualizar) ───
  const handleSave = async (data) => {
    setFormError("");
    setIsSaving(true);
    try {
      if (editingClient) {
        const res = await axios.put(
          `${API_BASE}/editar-cliente/${editingClient.id}`,
          {
            cedula: data.cedula,
            name: data.name,
            phone: data.phone,
            descripcion: data.descripcion || "",
          },
        );
        if (res.data.success) {
          setCustomers((prev) => {
            const updated = prev.map((c) =>
              c.id === editingClient.id ? { ...c, ...res.data.cliente } : c,
            );
            cachedCustomers = updated;
            return updated;
          });
          window.Toast.fire({
            icon: "success",
            title: "¡Cliente editado exitosamente!",
          });
        }
      } else {
        const res = await axios.post(`${API_BASE}/registrar-clientes`, {
          cedula: data.cedula,
          name: data.name,
          phone: data.phone,
          descripcion: data.descripcion || "",
        });
        if (res.data.success) {
          setCustomers((prev) => {
            const updated = [
              { ...res.data.cliente, total: 0, lastVisit: null },
              ...prev,
            ];
            cachedCustomers = updated;
            return updated;
          });
          window.Toast.fire({
            icon: "success",
            title: "¡Cliente registrado exitosamente!",
          });
        }
      }
      closeModal();
    } catch (error) {
      console.error("Error al guardar el cliente:", error);
      setFormError(
        error.response?.data?.message || "Error de conexión con el servidor",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden w-full h-full bg-slate-50">
      {/* Header */}
      <header className="flex flex-wrap gap-4 justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-slate-100 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-pizza-red to-pizza-red-dark flex items-center justify-center shadow-[0_4px_12px_rgba(234,42,51,0.25)]">
              <Users className="w-5 h-5 text-white" />
            </span>
            Clientes
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {isLoading
              ? "Cargando..."
              : `${customers.length} clientes registrados`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-72 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all cursor-pointer"
          >
            <option value="name">Orden: Nombre</option>
            <option value="gasto-desc">Más gasto (desc)</option>
            <option value="gasto-asc">Menos gasto (asc)</option>
          </select>
          <button
            onClick={openCreate}
            className="bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-slate-950 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Nuevo Cliente
          </button>
        </div>
      </header>

      {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
        {/* Total Clientes */}
        <div className="bg-red-50/70 border border-red-100/80 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-pizza-red flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(234,42,51,0.25)]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-pizza-red uppercase tracking-wider">
                Total Clientes
              </p>
              <p className="text-slate-800 text-2xl font-black leading-none mt-1.5">
                {stats.total}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
            En total
          </span>
        </div>

        {/* Clientes con Compras */}
        <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(16,185,129,0.25)]">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-emerald-500 uppercase tracking-wider">
                Con Compras
              </p>
              <p className="text-slate-800 text-2xl font-black leading-none mt-1.5">
                {stats.conCompras}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
            Con ventas
          </span>
        </div>

        {/* Ventas Totales */}
        <div className="bg-blue-50/70 border border-blue-100/80 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(59,130,246,0.25)]">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-blue-500 uppercase tracking-wider">
                Ventas Totales
              </p>
              <p className="text-slate-800 text-2xl font-black leading-none mt-1.5">
                {formatTotal(stats.ventasTotales)}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
            USD acumulado
          </span>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-purple-50/70 border border-purple-100/80 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(139,92,246,0.25)]">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-purple-500 uppercase tracking-wider">
                Ticket Promedio
              </p>
              <p className="text-slate-800 text-2xl font-black leading-none mt-1.5">
                {formatTotal(stats.ticketPromedio)}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
            Por cliente
          </span>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="font-bold text-slate-800 text-base">
              Directorio de Clientes
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {filtered.length} resultado(s)
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  #
                </th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Cédula
                </th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Órdenes
                </th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Gastado
                </th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Última Visita
                </th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <p className="font-medium">Cargando clientes...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">No se encontraron clientes</p>
                  </td>
                </tr>
              ) : (
                paginated.map((customer, index) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-5 py-3 text-slate-400 text-xs font-bold">
                      {(safePage - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {String(customer.name || "?")[0]?.toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">
                          {customer.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 font-mono text-xs">
                      {customer.cedula || "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-600 font-mono text-xs">
                      {customer.phone || "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-bold text-slate-700">
                        {customer.orders}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-bold text-emerald-600">
                        {formatTotal(customer.total)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-500 text-xs">
                      {formatDate(customer.lastVisit)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(customer)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-800 transition-all p-1.5 rounded-lg hover:bg-slate-100"
                          title="Editar cliente"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pie de tabla: paginación */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="text-xs font-semibold text-slate-500">
              Mostrando{" "}
              <span className="text-slate-800">{pageFrom}</span> -{" "}
              <span className="text-slate-800">{pageTo}</span> de{" "}
              <span className="text-slate-800">{filtered.length}</span>{" "}
              cliente(s)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(Math.max(1, safePage - 1))}
                disabled={safePage === 1}
                className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ←
              </button>

              {pageNumbers.map((p, i) =>
                p === "..." ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-1 text-slate-400 text-xs self-center"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      p === safePage
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-100 border border-transparent"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}

              <button
                onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                disabled={safePage === totalPages}
                className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-fade-in">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white relative">
              <button
                onClick={closeModal}
                className="absolute right-4 top-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-slate-300 hover:text-white transition-all duration-300 hover:rotate-90"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-pizza-red/20 border border-pizza-red/30 flex items-center justify-center mb-3">
                {editingClient ? (
                  <Pencil className="w-6 h-6 text-red-300" />
                ) : (
                  <UserPlus className="w-6 h-6 text-red-300" />
                )}
              </div>
              <h2 className="text-xl font-bold">
                {editingClient ? "Editar Cliente" : "Registrar Cliente"}
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {editingClient
                  ? "Modifica la información del cliente"
                  : "Completa la información del nuevo cliente"}
              </p>
            </div>

            <div className="p-6">
              <ClienteForm
                initial={editingClient}
                customers={customers}
                isSaving={isSaving}
                serverError={formError}
                onSave={handleSave}
                onCancel={closeModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
