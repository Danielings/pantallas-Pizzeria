import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Plus, Calendar, Sparkles, TrendingUp, Info } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-slate-500 text-xs mb-1 font-semibold">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="font-bold text-sm" style={{ color: p.color || '#EA2A33' }}>
            {p.name}: {typeof p.value === 'number' ? `$${p.value.toFixed(2)}` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { sales } = useApp();
  
  // Fake data for charts
  const areaData = [
    { year: '2018', value: 30000 },
    { year: '2019', value: 60000 },
    { year: '2020', value: 45000 },
    { year: '2021', value: 80000 },
    { year: '2022', value: 65000 },
    { year: '2023', value: 110000 },
    { year: '2024', value: 90000 },
    { year: '2025', value: 130000 },
    { year: '2026', value: 140000 },
  ];

  const barData = [
    { year: '2018', Pizzas: 3279.43, Bebidas: 1000, Extras: 500 },
    { year: '2019', Pizzas: 4455.21, Bebidas: 1200, Extras: 600 },
    { year: '2020', Pizzas: 3544.09, Bebidas: 900, Extras: 400 },
    { year: '2021', Pizzas: 4830.51, Bebidas: 1500, Extras: 700 },
    { year: '2022', Pizzas: 5252.81, Bebidas: 1800, Extras: 800 },
    { year: '2023', Pizzas: 4769.17, Bebidas: 1600, Extras: 750 },
    { year: '2024', Pizzas: 7122.60, Bebidas: 2200, Extras: 1100 },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-slate-800 p-8 hide-scrollbar">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 mb-1">Dashboard</h2>
          <p className="text-slate-500 text-sm">Resumen general y métricas de rendimiento de la Pizzería.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
            <Calendar className="w-4 h-4" /> Histórico
          </button>
          <button className="flex items-center gap-2 px-5 py-2 rounded-xl bg-pizza-red text-white text-sm font-semibold hover:bg-pizza-red-dark transition-colors shadow-[0_0_15px_rgba(234,42,51,0.2)]">
            Generar Reporte
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Total Assets Card */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <span className="font-semibold text-sm">Ingresos Totales</span>
            <Info className="w-4 h-4" />
          </div>
          <div className="text-4xl font-extrabold text-slate-800 mb-3">
            $325,980.65
          </div>
          <div className="flex items-center gap-2 mb-8">
            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-1 rounded-md border border-emerald-100">
              <TrendingUp className="w-3 h-3" /> 12%
            </span>
            <span className="text-slate-500 text-xs font-medium">+$39,117.67 este año</span>
          </div>

          <div className="mt-auto">
            <p className="text-slate-600 font-medium text-sm mb-3">Distribución por Categoría</p>
            {/* Progress Bar */}
            <div className="flex h-3 rounded-full overflow-hidden gap-1 mb-6">
              <div className="bg-pizza-red w-[65%] rounded-full"></div>
              <div className="bg-amber-500 w-[25%] rounded-full"></div>
              <div className="bg-slate-300 w-[10%] rounded-full"></div>
            </div>
            
            {/* Legend */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-pizza-red"></div>
                  <div>
                    <p className="text-slate-700 text-sm font-semibold">Pizzas</p>
                    <p className="text-slate-500 text-xs font-medium">65%</p>
                  </div>
                </div>
                <span className="text-slate-800 font-bold text-sm">$211,887.42</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                  <div>
                    <p className="text-slate-700 text-sm font-semibold">Bebidas</p>
                    <p className="text-slate-500 text-xs font-medium">25%</p>
                  </div>
                </div>
                <span className="text-slate-800 font-bold text-sm">$81,495.16</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                  <div>
                    <p className="text-slate-700 text-sm font-semibold">Extras</p>
                    <p className="text-slate-500 text-xs font-medium">10%</p>
                  </div>
                </div>
                <span className="text-slate-800 font-bold text-sm">$32,598.06</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Investments Card */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-slate-500">
              <span className="font-semibold text-sm">Ventas Totales</span>
              <Info className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl font-extrabold text-slate-800 mb-3">
            $270,560.20
          </div>
          <div className="flex items-center gap-2 mb-6">
            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-1 rounded-md border border-emerald-100">
              <TrendingUp className="w-3 h-3" /> 20%
            </span>
            <span className="text-slate-500 text-xs font-medium">+$54,112.04 este año</span>
          </div>

          <div className="h-[250px] w-full mt-auto relative">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EA2A33" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#EA2A33" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}K`} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="value" stroke="#EA2A33" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Total Profits Card */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <span className="font-semibold text-sm">Ganancias Netas</span>
            <Info className="w-4 h-4" />
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="text-3xl font-extrabold text-slate-800 mb-3">
                $55,420.45
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-1 rounded-md border border-emerald-100">
                  <TrendingUp className="w-3 h-3" /> 7%
                </span>
                <span className="text-slate-500 text-xs font-medium">+$9,879.43 este año</span>
              </div>
            </div>
            
            {/* Custom Legend */}
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2"><div className="w-2 h-4 bg-pizza-red rounded-sm"></div>Pizzas</div>
              <div className="flex items-center gap-2"><div className="w-2 h-4 bg-amber-500 rounded-sm"></div>Bebidas</div>
              <div className="flex items-center gap-2"><div className="w-2 h-4 bg-slate-300 rounded-sm"></div>Extras</div>
            </div>
          </div>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="Pizzas" stackId="a" fill="#EA2A33" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Bebidas" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Extras" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ticket Promedio Card */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-pizza-red/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <span className="font-semibold text-sm">Ticket Promedio</span>
            <Info className="w-4 h-4" />
          </div>
          <div className="text-4xl font-extrabold text-slate-800 mb-3">
            $18.50
          </div>
          <div className="flex items-center gap-2 mb-6">
            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-1 rounded-md border border-emerald-100">
              <TrendingUp className="w-3 h-3" /> 4%
            </span>
            <span className="text-slate-500 text-xs font-medium">vs mes anterior</span>
          </div>
          <div className="mt-auto pt-4 border-t border-slate-100">
             <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
               <span>Pico más alto:</span>
               <span className="text-pizza-red bg-red-50 px-2 py-1 rounded-md">$25.30 (Vie)</span>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
