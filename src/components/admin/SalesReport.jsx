import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Download, Filter, FileSpreadsheet, FileText, Search } from 'lucide-react';
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
  'Efectivo': 'bg-green-500/20 text-green-400',
  'Pago Móvil': 'bg-blue-500/20 text-blue-400',
  'Punto de Venta': 'bg-purple-500/20 text-purple-400',
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
    <div className="flex flex-col gap-4 p-5 overflow-y-auto h-full bg-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-pizza-dark font-bold text-xl">Reporte de Ventas</h2>
          <p className="text-pizza-muted text-sm">Historial de transacciones</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 text-green-600 hover:bg-green-500/20 rounded-lg text-sm font-medium transition-all">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-600 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-all">
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex bg-pizza-gray-2 border border-pizza-gray-3 rounded-lg p-1 gap-1">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => { setPeriod(p); setPage(1); setDateValue(p === 'Año' ? new Date().getFullYear().toString() : new Date().toISOString().split('T')[0].slice(0, p === 'Mes' ? 7 : 10)); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${period === p ? 'bg-pizza-red text-white' : 'text-pizza-muted hover:text-pizza-dark'}`}
            >
              {p}
            </button>
          ))}
        </div>
        <input
          type={dateInputType}
          value={dateValue}
          min={dateInputType === 'number' ? 2020 : undefined}
          max={dateInputType === 'number' ? new Date().getFullYear() : undefined}
          onChange={e => { setDateValue(e.target.value); setPage(1); }}
          className="input-field w-auto"
        />
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pizza-muted" />
          <input
            type="text"
            placeholder="Buscar por ID, cajero o método..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-9"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-4">
        <div className="card px-5 py-3 flex items-center gap-3">
          <div className="text-pizza-muted text-sm">Transacciones</div>
          <div className="text-pizza-dark font-extrabold text-xl">{totalCount}</div>
        </div>
        <div className="card px-5 py-3 flex items-center gap-3">
          <div className="text-pizza-muted text-sm">Ingresos</div>
          <div className="text-pizza-red font-extrabold text-xl">${totalRevenue.toFixed(2)}</div>
        </div>
        <div className="card px-5 py-3 flex items-center gap-3">
          <div className="text-pizza-muted text-sm">Ticket Prom.</div>
          <div className="text-pizza-dark font-extrabold text-xl">${totalCount > 0 ? (totalRevenue / totalCount).toFixed(2) : '0.00'}</div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden flex-1 flex flex-col bg-white">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pizza-gray-3 bg-pizza-gray-2">
                <th className="text-left px-4 py-3 text-pizza-muted font-semibold text-xs uppercase tracking-wider">ID</th>
                <th className="text-left px-4 py-3 text-pizza-muted font-semibold text-xs uppercase tracking-wider">Fecha</th>
                <th className="text-left px-4 py-3 text-pizza-muted font-semibold text-xs uppercase tracking-wider">Sucursal</th>
                <th className="text-center px-4 py-3 text-pizza-muted font-semibold text-xs uppercase tracking-wider">Arts.</th>
                <th className="text-right px-4 py-3 text-pizza-muted font-semibold text-xs uppercase tracking-wider">Total</th>
                <th className="text-left px-4 py-3 text-pizza-muted font-semibold text-xs uppercase tracking-wider">Método</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((sale, i) => (
                <tr key={sale.id} className={`border-b border-pizza-gray-3/50 hover:bg-pizza-gray-2/50 transition-colors ${i % 2 === 0 ? '' : 'bg-pizza-gray-2/20'}`}>
                  <td className="px-4 py-3 text-pizza-muted font-mono text-xs">{sale.id.slice(-8)}</td>
                  <td className="px-4 py-3 text-pizza-dark whitespace-nowrap">
                    {new Date(sale.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    <span className="text-pizza-muted ml-1 text-xs">
                      {new Date(sale.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-pizza-muted">{sale.branch}</td>
                  <td className="px-4 py-3 text-pizza-dark text-center">{sale.items}</td>
                  <td className="px-4 py-3 text-pizza-red font-bold text-right">${sale.total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge px-2 py-1 rounded-full text-xs ${METHOD_BADGE[sale.paymentMethod] || 'bg-pizza-gray-2 border border-pizza-gray-3 text-pizza-muted'}`}>
                      {sale.paymentMethod}
                    </span>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-pizza-muted py-12">No hay ventas para este período</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-pizza-gray-3">
            <p className="text-pizza-muted text-xs">
              Mostrando {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, totalCount)} de {totalCount}
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost text-xs px-2 py-1 disabled:opacity-30">← Ant.</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.min(Math.max(page - 2, 1) + i, totalPages);
                return (
                  <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${p === page ? 'bg-pizza-red text-white' : 'text-pizza-muted hover:text-white hover:bg-pizza-gray-2'}`}>{p}</button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost text-xs px-2 py-1 disabled:opacity-30">Sig. →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
