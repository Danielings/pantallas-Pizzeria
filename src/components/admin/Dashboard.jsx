import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, Users, Clock } from 'lucide-react';

function KpiCard({ icon: Icon, label, value, sub, color = 'text-pizza-red' }) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-pizza-muted text-sm font-medium">{label}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-current/10`} style={{ color: 'inherit' }}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      <div>
        <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
        {sub && <p className="text-pizza-muted text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-xl px-4 py-3 border border-pizza-gray-3 shadow-modal">
        <p className="text-pizza-muted text-xs mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-pizza-dark font-bold text-sm">{p.name}: <span style={{ color: p.color }}>${p.value.toFixed(2)}</span></p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { sales } = useApp();

  const today = new Date().toDateString();

  const todaySales = useMemo(() => sales.filter(s => new Date(s.date).toDateString() === today), [sales]);
  const todayRevenue = useMemo(() => todaySales.reduce((s, sale) => s + sale.total, 0), [todaySales]);
  const avgTicket = todaySales.length > 0 ? todayRevenue / todaySales.length : 0;

  // Sales by hour for today
  const byHour = useMemo(() => {
    const hours = {};
    for (let h = 10; h <= 22; h++) hours[h] = 0;
    todaySales.forEach(s => {
      const h = new Date(s.date).getHours();
      if (hours[h] !== undefined) hours[h] += s.total;
    });
    return Object.entries(hours).map(([h, total]) => ({
      hour: `${h}:00`,
      Ventas: parseFloat(total.toFixed(2)),
    }));
  }, [todaySales]);

  // Sales last 7 days
  const last7 = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const daySales = sales.filter(s => new Date(s.date).toDateString() === dateStr);
      days.push({
        day: d.toLocaleDateString('es-ES', { weekday: 'short' }),
        Ingresos: parseFloat(daySales.reduce((s, sale) => s + sale.total, 0).toFixed(2)),
        Órdenes: daySales.length,
      });
    }
    return days;
  }, [sales]);

  return (
    <div className="flex flex-col gap-5 p-5 overflow-y-auto h-full bg-white">
      <div>
        <h2 className="text-pizza-dark font-bold text-xl">Dashboard</h2>
        <p className="text-pizza-muted text-sm">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={DollarSign}
          label="Ingresos Hoy"
          value={`$${todayRevenue.toFixed(2)}`}
          sub={`${todaySales.length} transacciones`}
          color="text-pizza-red"
        />
        <KpiCard
          icon={ShoppingBag}
          label="Órdenes Hoy"
          value={todaySales.length}
          sub="Ventas del día"
          color="text-blue-500"
        />
        {/* <KpiCard
          icon={TrendingUp}
          label="Ticket Promedio"
          value={`$${avgTicket.toFixed(2)}`}
          sub="Por orden"
          color="text-green-600"
        /> */}
        <KpiCard
          icon={Clock}
          label="Total del Mes"
          value={`$${sales.filter(s => {
            const d = new Date(s.date);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).reduce((sum, s) => sum + s.total, 0).toFixed(2)}`}
          sub="Ingresos del mes"
          color="text-purple-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Hourly */}
        <div className="card p-5">
          <h3 className="text-pizza-dark font-semibold mb-4">Ventas por Hora (Hoy)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byHour} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Ventas" fill="#EA2A33" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly */}
        <div className="card p-5">
          <h3 className="text-pizza-dark font-semibold mb-4">Tendencia Semanal</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={last7} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#6b7280' }} />
              <Line type="monotone" dataKey="Ingresos" stroke="#EA2A33" strokeWidth={2.5} dot={{ fill: '#EA2A33', r: 4 }} />
              <Line type="monotone" dataKey="Órdenes" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
