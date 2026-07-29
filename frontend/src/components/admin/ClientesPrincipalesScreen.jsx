import { useState, useMemo } from 'react';
import { 
  Users, Trophy, Star, ArrowUpRight, Search, 
  DollarSign, ShoppingBag, CalendarDays, Award,
  Sparkles, ShieldCheck, Mail, Phone, ChevronRight,
  TrendingUp, Download, Eye
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

const MOCK_TOP_CUSTOMERS = [
  { id: 1, name: 'Juan Pérez', email: 'juan.perez@example.com', phone: '0414-123-4567', age: 29, purchases: 42, totalSpent: 1250.50, favorite: 'Pepperoni Suprema', status: 'VIP' },
  { id: 2, name: 'María González', email: 'maria.g@example.com', phone: '0424-987-6543', age: 34, purchases: 31, totalSpent: 890.00, favorite: 'Margarita Clásica', status: 'VIP' },
  { id: 3, name: 'Carlos Ramírez', email: 'carlos.r@example.com', phone: '0416-555-3210', age: 41, purchases: 28, totalSpent: 755.20, favorite: 'BBQ Chicken', status: 'Regular' },
  { id: 4, name: 'Ana Soto', email: 'ana.soto@example.com', phone: '0412-777-6543', age: 25, purchases: 25, totalSpent: 620.00, favorite: 'Cuatro Quesos', status: 'Regular' },
  { id: 5, name: 'Luis Herrera', email: 'l.herrera@example.com', phone: '0426-444-1122', age: 38, purchases: 22, totalSpent: 590.30, favorite: 'Vegetariana', status: 'Inactivo' },
  { id: 6, name: 'Sofia Torres', email: 'sofia.torres@example.com', phone: '0414-999-8877', age: 27, purchases: 21, totalSpent: 510.00, favorite: 'Hawaiana', status: 'Regular' },
  { id: 7, name: 'Pedro Sánchez', email: 'pedro.s@example.com', phone: '0424-111-2222', age: 45, purchases: 19, totalSpent: 480.50, favorite: 'Carne Asada', status: 'Regular' },
  { id: 8, name: 'Laura Jiménez', email: 'laura.j@example.com', phone: '0416-333-4444', age: 31, purchases: 18, totalSpent: 450.00, favorite: 'Mariscos', status: 'Regular' },
  { id: 9, name: 'Jose Martínez', email: 'jose.m@example.com', phone: '0412-555-6666', age: 50, purchases: 15, totalSpent: 380.00, favorite: 'Margarita Clásica', status: 'Inactivo' },
  { id: 10, name: 'Gabriela Díaz', email: 'gaby.diaz@example.com', phone: '0426-777-8888', age: 23, purchases: 14, totalSpent: 320.00, favorite: 'Pepperoni Suprema', status: 'Regular' },
];

// Data is computed dynamically in the component based on MOCK_TOP_CUSTOMERS
function CircularProgress({ percentage, label, sublabel, color, trackColor }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Outer track SVG */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            className={`${trackColor} stroke-[8] fill-none`}
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            className={`${color} stroke-[8] fill-none transition-all duration-1000 ease-out`}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-base font-extrabold text-slate-800 text-center px-1" translate="no">
          {percentage}%
        </span>
      </div>
      <p className="text-xs font-bold text-slate-700 mt-2 text-center">{label}</p>
      <p className="text-[10px] text-slate-400 font-semibold mt-0.5 text-center">{sublabel}</p>
    </div>
  );
}

export default function ClientesPrincipalesScreen() {
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    return MOCK_TOP_CUSTOMERS.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const topSpendersData = useMemo(() => {
    return [...MOCK_TOP_CUSTOMERS]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 6)
      .map(c => ({
        name: c.name.split(' ')[0], // solo el primer nombre
        Gasto: c.totalSpent
      }));
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 hide-scrollbar flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800">Clientes Principales</h2>
          <p className="text-slate-500 text-sm">Dashboard de consumo y métricas de clientes VIP</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar por cliente o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white border border-slate-200 text-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all w-full shadow-sm"
          />
        </div>
      </div>

      {/* Top row of colored status capsules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Capsule 1: Purple */}
        <div className="bg-purple-50/70 border border-purple-100/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(139,92,246,0.2)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-purple-500 uppercase tracking-wider">Clientes VIP</p>
              <p className="text-slate-800 text-lg font-black leading-none mt-1">2 Activos</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">+1 este mes</span>
        </div>

        {/* Capsule 2: Green */}
        <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider">LTV Promedio</p>
              <p className="text-slate-800 text-lg font-black leading-none mt-1">$817.24</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">+4.5%</span>
        </div>

        {/* Capsule 3: Blue */}
        <div className="bg-blue-50/70 border border-blue-100/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(59,130,246,0.2)]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-blue-500 uppercase tracking-wider">Compra Media</p>
              <p className="text-slate-800 text-lg font-black leading-none mt-1">$24.50</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Por ticket</span>
        </div>

        {/* Capsule 4: Orange/Red */}
        <div className="bg-red-50/70 border border-red-100/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pizza-red flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(234,42,51,0.2)]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-pizza-red uppercase tracking-wider">Total Clientes</p>
              <p className="text-slate-800 text-lg font-black leading-none mt-1">150 Reg.</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-pizza-red bg-red-100 px-2 py-0.5 rounded-full">En total</span>
        </div>
      </div>

      {/* Middle Grid (Final Report + Age statistics inspired) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column: Final Report */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-slate-800 font-extrabold text-base">Reporte de Retención y Frecuencia</h3>
              <p className="text-slate-400 text-xs mt-0.5">Indicadores generales de comportamiento de consumo</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all">
              <Download className="w-3.5 h-3.5" />
              .xlsx
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 items-center">
            <CircularProgress 
              percentage={50} 
              label="Re-compra" 
              sublabel="Frecuencia"
              color="stroke-pizza-red" 
              trackColor="stroke-red-50" 
            />
            <CircularProgress 
              percentage={25} 
              label="Fidelización" 
              sublabel="Programas VIP"
              color="stroke-purple-500" 
              trackColor="stroke-purple-500/10" 
            />
            <CircularProgress 
              percentage={85} 
              label="Ticket Alto" 
              sublabel="Consumo > $30"
              color="stroke-emerald-500" 
              trackColor="stroke-emerald-500/10" 
            />
            <CircularProgress 
              percentage={60} 
              label="Retención" 
              sublabel="Retorno < 15 días"
              color="stroke-blue-500" 
              trackColor="stroke-blue-500/10" 
            />
          </div>
        </div>

        {/* Right Column: Top Spenders Bar Chart */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-slate-800 font-extrabold text-base">Top 6 Mejores Clientes</h3>
              <p className="text-slate-400 text-xs mt-0.5">Personas con mayor volumen de compras acumulado</p>
            </div>
          </div>

          <div className="flex-1 h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSpendersData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}
                  itemStyle={{ color: '#EA2A33' }}
                />
                <Bar dataKey="Gasto" fill="#EA2A33" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Client List Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden shrink-0">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">Clientes Top</h3>
            <p className="text-xs text-slate-400 mt-0.5">Listado ordenado por volumen total de facturación</p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
            {filtered.length} Clientes Principales
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold text-xs uppercase tracking-wider text-left">
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5 text-center">Edad</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Teléfono</th>
                <th className="px-5 py-3.5 text-center">Compras</th>
                <th className="px-5 py-3.5 text-right">Total Gastado</th>
                <th className="px-5 py-3.5">Favorito</th>
                <th className="px-5 py-3.5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.slice(0, pageSize).map(customer => (
                <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                        {customer.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-800">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center font-semibold text-slate-500">{customer.age}</td>
                  <td className="px-5 py-4 font-medium text-slate-500">{customer.email}</td>
                  <td className="px-5 py-4 text-slate-500 font-mono text-xs">{customer.phone}</td>
                  <td className="px-5 py-4 text-center font-bold text-slate-800">{customer.purchases}</td>
                  <td className="px-5 py-4 text-right font-extrabold text-emerald-600">${customer.totalSpent.toFixed(2)}</td>
                  <td className="px-5 py-4 font-medium text-slate-600">{customer.favorite}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      customer.status === 'VIP' ? 'bg-amber-50 border border-amber-100 text-amber-600' :
                      customer.status === 'Regular' ? 'bg-blue-50 border border-blue-100 text-blue-600' :
                      'bg-slate-100 border border-slate-200 text-slate-400'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer matching screenshot controls */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Mostrar en página</span>
            <select 
              value={pageSize} 
              onChange={e => setPageSize(parseInt(e.target.value))}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none focus:border-pizza-red"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="flex gap-1">
            <button className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold rounded-lg disabled:opacity-40 transition-colors">
              ←
            </button>
            <button className="w-8 h-8 rounded-lg text-xs font-bold bg-slate-800 text-white shadow-sm">1</button>
            <button className="w-8 h-8 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 border border-transparent">2</button>
            <button className="w-8 h-8 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 border border-transparent">3</button>
            <span className="px-2 text-slate-400 self-center text-xs">...</span>
            <button className="w-8 h-8 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 border border-transparent">8</button>
            <button className="w-8 h-8 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 border border-transparent">9</button>
            <button className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold rounded-lg disabled:opacity-40 transition-colors">
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
