import KanbanBoard from '../components/cocinero/KanbanBoard';
import { useApp } from '../context/AppContext';

export default function CocineroScreen() {
  const { orders } = useApp();
  const pending = orders.filter(o => o.status === 'pending').length;
  const preparing = orders.filter(o => o.status === 'preparing').length;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-pizza-gray-3 bg-white">
        <div className="flex items-center gap-3">
          <h1 className="text-pizza-dark font-bold text-lg">Pantalla de Cocina</h1>
        </div>
        <div className="flex items-center gap-4">
          {pending > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-status-pending/10 border border-status-pending/20 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-status-pending animate-pulse" />
              <span className="text-status-pending text-sm font-semibold">{pending} pendiente{pending !== 1 ? 's' : ''}</span>
            </div>
          )}
          {preparing > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-status-preparing/10 border border-status-preparing/30 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-status-preparing animate-pulse" />
              <span className="text-status-preparing text-sm font-semibold">{preparing} en preparación</span>
            </div>
          )}
          <div className="text-pizza-muted text-sm font-mono">
            {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard />
      </div>
    </div>
  );
}
