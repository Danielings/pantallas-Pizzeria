import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Download, Filter, FileSpreadsheet, FileText, Search, CalendarDays, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PERIODS = ['Día', 'Mes', 'Año'];

function filterSales(sales, period, dateValue) {
  if (!dateValue) return sales;
  return sales.filter(s => {
    const d = new Date(s.date);
    if (period === 'Día') {
      return d.toDateString() === new Date(dateValue).toDateString();
    } else if (period === 'Mes') {
      const [year, month] = dateValue.split('-');
      return d.getFullYear() === parseInt(year) && d.getMonth() === parseInt(month) - 1;
    } else {
      return d.getFullYear() === parseInt(dateValue);
    }
  });
}

const METHOD_BADGE = {
  'Efectivo': 'bg-emerald-50 border border-emerald-100 text-emerald-700',
  'Pago Móvil': 'bg-blue-50 border border-blue-100 text-blue-700',
  'Punto de Venta': 'bg-purple-50 border border-purple-100 text-purple-700',
};

export default function SalesReport() {
  const { sales } = useApp();
  const [period, setPeriod] = useState('Día');
  const [dateValue, setDateValue] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  const filtered = useMemo(() => {
    let result = filterSales(sales, period, dateValue);
    if (search) {
      result = result.filter(s =>
        s.id.toLowerCase().includes(search.toLowerCase()) ||
        s.cashier.toLowerCase().includes(search.toLowerCase()) ||
        s.paymentMethod.toLowerCase().includes(search.toLowerCase())
      );
    }
    return result;
  }, [sales, period, dateValue, search]);

  const totalRevenue = filtered.reduce((s, sale) => s + sale.total, 0);
  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Generate simple chart data from filtered sales
  const chartData = useMemo(() => {
    if (filtered.length === 0) return [];
    
    // Si hay muchas ventas en un mismo día/mes, agrupamos para simplificar el gráfico
    // Aquí hacemos una versión simple: mostramos los últimos 10 o agrupamos por hora si es el día actual.
    // Para mantenerlo sencillo, simplemente mapearemos las ventas en orden cronológico.
    const sorted = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Si son muchas, tomamos una muestra o agrupamos (aquí lo simplificamos a mostrar la tendencia de las transacciones)
    return sorted.map((s, i) => ({
      name: new Date(s.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      total: s.total
    }));
  }, [filtered]);

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered.map(s => ({
      ID: s.id,
      Fecha: new Date(s.date).toLocaleString('es-ES'),
      Cajero: s.cashier,
      Sucursal: s.branch,
      Artículos: s.items,
      Total: s.total.toFixed(2),
      'Método de Pago': s.paymentMethod,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
    XLSX.writeFile(wb, `ventas_${period.toLowerCase()}_${dateValue}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(234, 42, 51);
    doc.text('Reporte de Ventas — Pizzería', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${period} | Filtro: ${dateValue} | Total: $${totalRevenue.toFixed(2)} | Transacciones: ${totalCount}`, 14, 28);
    autoTable(doc, {
      startY: 34,
      head: [['ID', 'Fecha', 'Cajero', 'Sucursal', 'Artículos', 'Total', 'Método']],
      body: filtered.map(s => [
        s.id, new Date(s.date).toLocaleDateString('es-ES'), s.cashier,
        s.branch, s.items, `$${s.total.toFixed(2)}`, s.paymentMethod,
      ]),
      headStyles: { fillColor: [234, 42, 51], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 8 },
    });
    doc.save(`ventas_${period.toLowerCase()}_${dateValue}.pdf`);
  };

  const dateInputType = period === 'Día' ? 'date' : period === 'Mes' ? 'month' : 'number';

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto h-full bg-slate-50 hide-scrollbar">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Reporte de Ventas</h2>
          <p className="text-slate-500 text-sm">Historial de transacciones y conciliación</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-100/50 rounded-xl text-sm font-semibold transition-all">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 text-red-600 hover:bg-red-100/50 rounded-xl text-sm font-semibold transition-all">
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex bg-slate-50 border border-slate-100 rounded-xl p-1 gap-1">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => { 
                  setPeriod(p); 
                  setPage(1); 
                  setDateValue(p === 'Año' ? new Date().getFullYear().toString() : new Date().toISOString().split('T')[0].slice(0, p === 'Mes' ? 7 : 10)); 
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  period === p ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type={dateInputType}
              value={dateValue}
              min={dateInputType === 'number' ? 2020 : undefined}
              max={dateInputType === 'number' ? new Date().getFullYear() : undefined}
              onChange={e => { setDateValue(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all w-44 font-semibold"
            />
          </div>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por ID, cajero o método..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all w-full"
          />
        </div>
      </div>

      {/* Dashboard Gráfico & KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-2">
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm px-5 py-6 flex flex-col justify-center flex-1">
            <span className="text-slate-500 text-sm font-semibold mb-1">Total Transacciones</span>
            <div className="flex items-end justify-between">
              <span className="text-slate-800 font-extrabold text-3xl">{totalCount}</span>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm px-5 py-6 flex flex-col justify-center flex-1">
            <span className="text-slate-500 text-sm font-semibold mb-1">Ingresos Totales</span>
            <div className="flex items-end justify-between">
              <span className="text-pizza-red font-extrabold text-3xl">${totalRevenue.toFixed(2)}</span>
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-pizza-red" />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm p-5 h-[220px] flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-700 text-sm font-bold">Tendencia de Ventas</span>
          </div>
          <div className="flex-1 w-full h-full relative">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EA2A33" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#EA2A33" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#EA2A33', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#EA2A33" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                No hay datos suficientes para graficar.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-[300px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold text-xs uppercase tracking-wider text-left">
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Fecha / Hora</th>
                <th className="px-5 py-3.5">Sucursal</th>
                <th className="px-5 py-3.5 text-center">Arts.</th>
                <th className="px-5 py-3.5 text-right">Total</th>
                <th className="px-5 py-3.5">Método de Pago</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginated.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">{sale.id.slice(-8)}</td>
                  <td className="px-5 py-4 font-medium text-slate-800">
                    {new Date(sale.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    <span className="text-slate-400 ml-2 font-normal text-xs">
                      {new Date(sale.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 font-medium">{sale.branch}</td>
                  <td className="px-5 py-4 text-center font-bold text-slate-800">{sale.items}</td>
                  <td className="px-5 py-4 text-right font-extrabold text-slate-800">${sale.total.toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      METHOD_BADGE[sale.paymentMethod] || 'bg-slate-100 border border-slate-200 text-slate-500'
                    }`}>
                      {sale.paymentMethod}
                    </span>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-slate-400 py-16">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No hay ventas para este período
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/30">
            <p className="text-slate-400 text-xs font-semibold">
              Mostrando {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, totalCount)} de {totalCount}
            </p>
            <div className="flex gap-1">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1} 
                className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold rounded-lg disabled:opacity-40 transition-colors"
              >
                ← Ant.
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.min(Math.max(page - 2, 1) + i, totalPages);
                return (
                  <button 
                    key={p} 
                    onClick={() => setPage(p)} 
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      p === page 
                        ? 'bg-slate-800 text-white shadow-sm' 
                        : 'text-slate-500 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages} 
                className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold rounded-lg disabled:opacity-40 transition-colors"
              >
                Sig. →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
