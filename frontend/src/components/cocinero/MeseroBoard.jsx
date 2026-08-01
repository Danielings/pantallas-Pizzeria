// src/components/mesero/MeseroBoard.jsx
import { useApp } from "../../context/AppContext";
import { OrderCard } from "../cocinero/OrderCard";

/**
 * MeseroBoard — tablero centrado exclusivo para pedidos LOCALES en estado "delivered".
 * Replica la maquetación de KanbanBoard.jsx para consistencia visual.
 */

// Helper: determina si un pedido es de tipo "Local"
const isLocalOrder = (order) => {
    // Caso 1: orderType técnico (pedidos nuevos)
    if (order.orderType === "dine_in" || order.orderType === "local") return true;
    // Caso 2: fallback legacy — table empieza con "Mesa"
    if (!order.orderType && order.table && order.table.startsWith("Mesa")) return true;
    return false;
    };

export default function MeseroBoard() {
    const { orders, archiveOrder } = useApp();

  // Filtrado estricto: Local + waiter_pending, ordenados por antigüedad
const waiterPendingOrders = orders
    .filter((o) => o.status === "waiter_pending" && isLocalOrder(o))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return (
        <div className="flex justify-center h-full p-4 sm:p-6 3xl:p-10">
        <div className="w-full max-w-md sm:max-w-2xl 3xl:max-w-4xl flex flex-col h-full min-h-0">
            {/* Encabezado de columna */}
            <div className="flex items-center gap-2.5 px-4 py-3.5 border border-pizza-gray-3 bg-white rounded-t-xl flex-shrink-0 shadow-sm">
            <span className="text-base">🟢</span>
            <h2 className="text-pizza-dark font-bold flex-1">
                Despacho Local
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                {waiterPendingOrders.length}
            </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-3 p-3 border border-t-0 border-pizza-gray-3 rounded-b-xl flex-1 overflow-y-auto min-h-0 custom-scrollbar">
            {waiterPendingOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-pizza-muted gap-2">
                <span className="text-4xl opacity-30">🍕</span>
                <p className="text-sm opacity-60">
                    Sin pedidos para entregar
                </p>
                </div>
            ) : (
                waiterPendingOrders.map((order) => (
                <OrderCard
                key={order.id}
                order={order}
                isFirst={true}
                variant="green"
                primaryBtnLabel="Entregado"
                onPrimary={() => archiveOrder(order.id)}
            />
        ))
        )}
    </div>
    </div>
</div>
);
}