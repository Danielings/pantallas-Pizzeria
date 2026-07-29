import { useApp } from '../../context/AppContext';
import { OrderCard } from './OrderCard';

/**
 * Column — columna genérica del board de despacho.
 */
function Column({ title, icon, countClass, orders, renderCard }) {
  return (
    <div className="flex flex-col flex-1 min-w-0 h-full">
      {/* Encabezado */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-pizza-gray-3 bg-white sticky top-0 z-10">
        <span className="text-base">{icon}</span>
        <h2 className="text-pizza-dark font-bold flex-1">{title}</h2>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${countClass}`}>
          {orders.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-pizza-muted gap-2">
            <span className="text-3xl opacity-30">{icon}</span>
            <p className="text-sm opacity-60">Sin pedidos</p>
          </div>
        ) : (
          orders.map((order, idx) => renderCard(order, idx))
        )}
      </div>
    </div>
  );
}

export default function DespachoBoard() {
  const { orders, updateOrderStatus, archiveOrder } = useApp();

  // Columna A: Horno — pedidos en preparación
  const hornoOrders = orders
    .filter((o) => o.status === 'preparing')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // Columna B: Pendiente — pedidos listos para entregar
  const pendienteOrders = orders
    .filter((o) => o.status === 'ready')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // Columna C: Despacho — pedidos en espera de ser recogidos
  const despachoOrders = orders
    .filter((o) => o.status === 'delivered')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="flex h-full divide-x divide-pizza-gray-3">

      {/* ── Columna A: Horno (amarillo) — isFirst lógica ── */}
      <Column
        title="Horno"
        icon="🟡"
        countClass="bg-amber-100 text-amber-700"
        orders={hornoOrders}
        renderCard={(order, idx) => (
          <OrderCard
            key={order.id}
            order={order}
            isFirst={idx === 0}
            variant="yellow"
            primaryBtnLabel="Listo"
            onPrimary={() => updateOrderStatus(order.id, 'delivered')}
          />
        )}
      />

      {/* ── Columna B: Pendiente (naranja) — todos activos ── */}
      <Column
        title="Pendiente"
        icon="🟠"
        countClass="bg-orange-100 text-orange-700"
        orders={pendienteOrders}
        renderCard={(order) => (
          <OrderCard
            key={order.id}
            order={order}
            isFirst={true}
            variant="orange"
            primaryBtnLabel="Entregar"
            onPrimary={() => archiveOrder(order.id)}
          />
        )}
      />

      {/* ── Columna C: Despacho (verde) — dos botones ── */}
      <Column
        title="Despacho"
        icon="🟢"
        countClass="bg-emerald-100 text-emerald-700"
        orders={despachoOrders}
        renderCard={(order) => (
          <OrderCard
            key={order.id}
            order={order}
            isFirst={true}
            variant="green"
            primaryBtnLabel="Entregado"
            onPrimary={() => archiveOrder(order.id)}
            secondaryBtnLabel="Pendiente"
            onSecondary={() => updateOrderStatus(order.id, 'ready')}
          />
        )}
      />

    </div>
  );
}
