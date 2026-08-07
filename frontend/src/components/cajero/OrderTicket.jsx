import { useApp } from '../../context/AppContext';
import OrderItem from './OrderItem';
import { ShoppingCart, Trash2, Receipt, UtensilsCrossed, ShoppingBag, Bike, Store } from 'lucide-react';

const ORDER_TYPE_CONFIG = {
  local: { label: 'Local', icon: UtensilsCrossed, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  takeaway: { label: 'Para Llevar', icon: ShoppingBag, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  delivery: { label: 'Delivery', icon: Bike, color: 'bg-red-100 text-red-700 border-red-200' },
  pickup: { label: 'Pickup', icon: Store, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

const PAYMENT_STATUS_LABELS = {
  paid: { label: 'Pagado', color: 'bg-emerald-100 text-emerald-700' },
  partial: { label: 'Abono', color: 'bg-blue-100 text-blue-700' },
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
};

export default function OrderTicket({ onCheckout }) {
  const { currentOrder, subtotal, total, exchangeRate } = useApp();
  const { items, paymentStatus, advanceAmount } = currentOrder;

  const paymentLabel = paymentStatus ? PAYMENT_STATUS_LABELS[paymentStatus] : null;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-slate-50">
      {/* Badge de estado de pago (solo delivery/pickup) */}
      {paymentLabel && (
        <div className={`shrink-0 px-4 py-1.5 flex items-center gap-2 text-xs font-semibold border-b border-slate-100 ${paymentLabel.color}`}>
          <span>{paymentLabel.label}</span>
          {paymentStatus === 'partial' && advanceAmount > 0 && (
            <>
              <span className="opacity-50">|</span>
              <span>Abono: ${Number(advanceAmount).toFixed(2)}</span>
              <span className="opacity-50">|</span>
              <span>Pendiente: ${Math.max(0, total - advanceAmount).toFixed(2)}</span>
            </>
          )}
        </div>
      )}

      {/* Items */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2 hide-scrollbar overscroll-contain">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
            <ShoppingCart className="w-8 h-8 opacity-50" />
            <p className="text-xs text-center font-medium">Ticket vacío</p>
            <p className="text-[10px] text-center text-slate-300">Agrega un producto para<br />seleccionar el tipo de pedido</p>
          </div>
        ) : (
          items.map(item => <OrderItem key={item.id} item={item} />)
        )}
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <div className="bg-white border-t border-slate-100 p-4 flex flex-col gap-3 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-800 font-bold">Total</span>
              <div className="text-right">
                <div className="text-slate-800 font-extrabold text-xl">${total.toFixed(2)}</div>
                {exchangeRate > 0 && (
                  <div className="text-slate-500 text-xs font-semibold mt-0.5">
                    Bs. {(total * exchangeRate).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onCheckout}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
          >
            Cobrar ${total.toFixed(2)}
          </button>
        </div>
      )}
    </div>
  );
}

