import { useApp } from '../../context/AppContext';
import { OrderCard } from './OrderCard';
import { useState } from 'react';

// determina si un pedido es de tipo "Local"
const isLocalOrder = (order) => {
  // Caso 1: orderType técnico (pedidos nuevos)
  if (order.orderType === "dine_in" || order.orderType === "local") return true;
  // Caso 2: fallback legacy — table empieza con "Mesa"
  if (order.table && order.table.startsWith("Mesa")) return true;
  return false;
};


/**
 * Column — columna genérica del board de despacho.
 */
function Column({ title, icon, countClass, orders, renderCard }) {
  return (
    <div className="flex flex-col flex-1 min-w-0 h-[500px] lg:h-full border-b lg:border-b-0 border-pizza-gray-3">
      {/* Encabezado */}
      <div className="flex items-center gap-2.5 px-4 lg:px-6 py-3.5 border-b border-pizza-gray-3 bg-white/95 backdrop-blur-sm sticky top-0 z-10">
        <span className="text-lg 3xl:text-xl">{icon}</span>
        <h2 className="text-pizza-dark font-bold text-base 3xl:text-lg flex-1">{title}</h2>
        <span className={`px-2.5 py-1 rounded-full text-xs 3xl:text-sm font-bold ${countClass}`}>
          {orders.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 lg:p-4 3xl:p-6 flex flex-col gap-3 lg:gap-4 3xl:gap-6 custom-scrollbar">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-pizza-muted gap-2">
            <span className="text-4xl opacity-30">{icon}</span>
            <p className="text-sm 3xl:text-base opacity-60">Sin pedidos</p>
          </div>
        ) : (
          orders.map((order, idx) => renderCard(order, idx))
        )}
      </div>
    </div>
  );
}

export default function DespachoBoard() {
  const { orders, updateOrderStatus, archiveOrder, updateOrder } = useApp();

  const [orderToSwap, setOrderToSwap] = useState(null);

  const handleSwap = (hornoOrder) => {
    if (!orderToSwap) return;

    const despOrder = orderToSwap;
    setOrderToSwap(null);

    // 1. Mueve el pedido original (Despacho) a Pendiente ('ready')
    updateOrder({
    id: despOrder.id,
    status: 'ready',
    reassigned: true,
  });

    // 2. Mueve el pedido del Horno a Despacho ('delivered') y agrega la etiqueta 'reassigned'
    updateOrder({
    id: hornoOrder.id,
    status: 'delivered',
    reassigned: true,
  });

    // 3. Finaliza el modo de intercambio
    setOrderToSwap(null);
  };

    // Handler para completar pedidos en la columna Despacho
  const handleDespachoComplete = (order) => {
    if (isLocalOrder(order)) {
      // Pedido Local: cambiar a estado 'waiter_pending' para que vaya al Mesero
      updateOrderStatus(order.id, 'waiter_pending');
    } else {
      // Pedido NO Local (Llevar, Delivery, Pickup): archivar directamente
      archiveOrder(order.id);
    }
  };

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

    const isSwapping = orderToSwap !== null;

  return (
    <div className="flex flex-col lg:flex-row h-full lg:divide-x divide-pizza-gray-3 overflow-y-auto lg:overflow-hidden bg-pizza-gray-2 lg:bg-transparent">

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
            isFirst={isSwapping ? true : idx === 0}
            variant={isSwapping ?"orange" : "yellow"}
            primaryBtnLabel={isSwapping ? "Seleccionar para Cambio" : "Listo"}
            onPrimary={() => { if(isSwapping){ handleSwap(order); } else { updateOrderStatus(order.id, 'delivered'); } }}
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
            primaryBtnLabel={isLocalOrder(order) ? "Enviar a Mesero" : "Entregado"}
            onPrimary={() => handleDespachoComplete(order)}
            secondaryBtnLabel="Pendiente"
            onSecondary={() => {
              if (orderToSwap?.id === order.id) {
                setOrderToSwap(null); // Cancela el intercambio
              } else {
                setOrderToSwap(order); // Inicia el intercambio
              }}}
          />
        )}
      />

    </div>
  );
}
