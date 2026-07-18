import { useState, useMemo } from 'react';
import { 
  Clock, Activity, CheckCircle2, UserX, AlertTriangle, 
  Search, ShieldAlert, Terminal, ArrowDownRight, RefreshCw, 
  Filter, Check, ChevronDown, User, Info
} from 'lucide-react';

const MOCK_EXTENDED_LOGS = [
  { id: 1, type: 'success', category: 'order', text: 'Pedido #ORD-008 completado y pagado en Efectivo', time: 'Hace 2 min', user: 'Carlos R.', details: 'Monto: $24.90. Cliente: María González. Método: Efectivo.' },
  { id: 2, type: 'info', category: 'order', text: 'Nueva orden #ORD-009 recibida', time: 'Hace 5 min', user: 'Ana G.', details: 'Mesa: Delivery. Ítems: 2x BBQ Chicken, 1x Agua.' },
  { id: 3, type: 'warning', category: 'system', text: 'Stock bajo detectado en Queso Mozzarella', time: 'Hace 15 min', user: 'Sistema', details: 'Cantidad disponible: 4.5kg. Umbral mínimo: 10kg.' },
  { id: 4, type: 'danger', category: 'security', text: 'Cajero eliminó producto (Pizza Hawaiana) de la Orden #ORD-007', time: 'Hace 1 hora', user: 'Laura J.', details: 'Acción requiere supervisión. Supervisor de turno notificado.' },
  { id: 5, type: 'success', category: 'delivery', text: 'Pedido #ORD-006 entregado a motorizado Ramón Torres', time: 'Hace 1.5 horas', user: 'Carlos R.', details: 'Entregado en Zona Este. ETA estimada: 15 min.' },
  { id: 6, type: 'info', category: 'auth', text: 'Sesión iniciada (Cajero)', time: 'Hace 3 horas', user: 'Carlos R.', details: 'Inicio de turno exitoso en caja sucursal Centro.' },
  { id: 7, type: 'warning', category: 'system', text: 'Tiempo de respuesta del API de Tasas excedió 2s', time: 'Hace 4 horas', user: 'Sistema', details: 'Frenado temporal por timeout. Reintento exitoso.' },
  { id: 8, type: 'danger', category: 'security', text: 'Intento de inicio de sesión fallido (admin)', time: 'Hace 6 horas', user: 'IP: 190.202.12.9', details: 'Contraseña errónea ingresada para el usuario admin@pizzeria.com.' },
  { id: 9, type: 'info', category: 'system', text: 'Copia de seguridad automática completada', time: 'Hace 12 horas', user: 'Sistema', details: 'Base de datos en memoria respaldada exitosamente en AWS S3.' },
];

export default function ActivityLog({ isWidget = false }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedLog, setExpandedLog] = useState(null);

  const filteredLogs = useMemo(() => {
    return MOCK_EXTENDED_LOGS.filter(log => {
      const matchesSearch = log.text.toLowerCase().includes(search.toLowerCase()) || 
                            log.user.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'all' ? true : log.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [search, filterType]);

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'danger': return <ShieldAlert className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getBgClass = (type) => {
    switch (type) {
      case 'success': return 'bg-emerald-50 border-emerald-100';
      case 'info': return 'bg-blue-50 border-blue-100';
      case 'warning': return 'bg-amber-50 border-amber-100';
      case 'danger': return 'bg-red-50 border-red-100';
      default: return 'bg-slate-50 border-slate-100';
    }
  };

  const toggleExpand = (id) => {
    setExpandedLog(expandedLog === id ? null : id);
  };

  // If used as a small dashboard widget, render simplified view
  if (isWidget) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-pizza-red" />
            <h3 className="font-extrabold text-slate-800 text-sm">Bitácora del Sistema</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400">Reciente</span>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto hide-scrollbar">
          <div className="space-y-4">
            {MOCK_EXTENDED_LOGS.slice(0, 6).map(log => (
              <div key={log.id} className="flex gap-3 text-xs">
                <div className="mt-0.5 shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${getBgClass(log.type)}`}>
                    {getIcon(log.type)}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-slate-800 font-semibold line-clamp-2 leading-relaxed">{log.text}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                    <span className="font-bold text-slate-500">{log.user}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>{log.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Auditing Panel Full screen view
  return (
    <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 p-6 rounded-2xl shadow-sm shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Terminal className="w-6 h-6 text-pizza-red" />
            Bitácora de Auditoría
          </h1>
          <p className="text-slate-500 text-sm">Registro detallado de transacciones, seguridad y operaciones del sistema</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all">
          <RefreshCw className="w-4 h-4" />
          Actualizar Logs
        </button>
      </div>

      {/* KPI summaries */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Eventos Totales</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{MOCK_EXTENDED_LOGS.length}</p>
          </div>
          <Activity className="w-8 h-8 text-blue-500 bg-blue-50 p-1.5 rounded-lg" />
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Alertas Criticas</p>
            <p className="text-2xl font-extrabold text-red-600 mt-1">2</p>
          </div>
          <ShieldAlert className="w-8 h-8 text-red-500 bg-red-50 p-1.5 rounded-lg" />
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Advertencias</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">2</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-500 bg-amber-50 p-1.5 rounded-lg" />
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Operadores Activos</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">3</p>
          </div>
          <User className="w-8 h-8 text-emerald-500 bg-emerald-50 p-1.5 rounded-lg" />
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between shrink-0">
        <div className="flex bg-slate-50 border border-slate-100 rounded-xl p-1 gap-1 w-full md:w-auto">
          {['all', 'info', 'success', 'warning', 'danger'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                filterType === t 
                  ? 'bg-slate-800 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t === 'all' ? 'Todos' : t === 'danger' ? 'Críticos' : t}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuario o mensaje..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all w-full"
          />
        </div>
      </div>

      {/* Timeline logs list */}
      <div className="flex-1 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[300px]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-bold text-slate-800 text-sm">Visor de Eventos</h2>
          <span className="text-xs text-slate-400 font-semibold">{filteredLogs.length} registro(s)</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <Terminal className="w-12 h-12 opacity-20" />
              <p className="font-semibold">No se encontraron logs coincidentes</p>
            </div>
          ) : (
            <div className="relative border-l border-slate-150 pl-6 ml-3 space-y-6">
              {filteredLogs.map(log => {
                const isExpanded = expandedLog === log.id;
                return (
                  <div key={log.id} className="relative group">
                    {/* Time indicator line connector */}
                    <div className={`absolute -left-[35px] top-1.5 w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center shadow-sm z-10 transition-transform group-hover:scale-110 ${getBgClass(log.type)}`}>
                      {getIcon(log.type)}
                    </div>
                    
                    <div 
                      onClick={() => toggleExpand(log.id)}
                      className={`border rounded-2xl p-4 transition-all duration-200 cursor-pointer ${
                        isExpanded 
                          ? 'bg-slate-50 border-slate-200 shadow-sm' 
                          : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            log.category === 'security' ? 'bg-red-100 text-red-800' :
                            log.category === 'system' ? 'bg-amber-100 text-amber-800' :
                            log.category === 'order' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {log.category}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">{log.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <User className="w-3.5 h-3.5" />
                          Usuario: <span className="font-bold text-slate-700">{log.user}</span>
                        </div>
                      </div>

                      <p className="text-sm font-semibold text-slate-800 mt-2.5 leading-relaxed">{log.text}</p>

                      {isExpanded && (
                        <div className="mt-4 pt-3 border-t border-slate-200/60 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 font-mono flex flex-col gap-1.5 animate-slide-in">
                          <p className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">Detalles del Evento</p>
                          <p className="leading-relaxed">{log.details}</p>
                          <div className="mt-2 flex gap-4 text-[10px] text-slate-400 font-semibold">
                            <span>ID de Auditoría: {log.id}</span>
                            <span>Timestamp: {new Date().toISOString()}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-2 flex justify-end">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider group-hover:text-pizza-red transition-colors flex items-center gap-0.5">
                          {isExpanded ? 'Ocultar detalles ▲' : 'Ver más detalles ▼'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
