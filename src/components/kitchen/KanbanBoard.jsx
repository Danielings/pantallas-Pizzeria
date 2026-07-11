import { useApp } from '../../context/AppContext';
import { OrderCard } from './OrderCard';

const COLUMNS = [
  { status: 'pending',   label: 'Por Preparar',    icon: '🔴', countClass: 'bg-status-pending/20 text-status-pending' },
  { status: 'preparing', label: 'En Preparación',  icon: '🟡', countClass: 'bg-status-preparing/20 text-status-preparing' },
  { status: 'ready',     label: 'Completado',       icon: '🟢', countClass: 'bg-status-ready/20 text-status-ready' },
];

function Column({ status, label, icon, countClass, orders }) {
  const filtered = orders
    .filter(o => o.status === status)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full">
      {/* Column header */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-pizza-gray-3 bg-white sticky top-0 z-10">
        <span className="text-base">{icon}</span>
        <h2 className="text-pizza-dark font-bold flex-1">{label}</h2>
        <span className={`badge px-2 py-0.5 rounded-full text-xs font-bold ${countClass}`}>
          {filtered.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-pizza-muted gap-2">
            <span className="text-3xl opacity-30">{icon}</span>
            <p className="text-sm opacity-60">Sin pedidos</p>
          </div>
        ) : (
          filtered.map(order => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const { orders } = useApp();

  return (
    <div className="flex h-full divide-x divide-pizza-gray-3">
      {COLUMNS.map(col => (
        <Column key={col.status} orders={orders} {...col} />
      ))}
    </div>
  );
}
