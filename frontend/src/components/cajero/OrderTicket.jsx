import { useApp } from '../../context/AppContext';
import OrderItem from './OrderItem';
import { ShoppingCart, Trash2, Receipt } from 'lucide-react';

export default function OrderTicket({ onCheckout }) {
  const { currentOrder, subtotal, tax, total, clearCart, exchangeRate } = useApp();
  const { items } = currentOrder;

  return (
    <div className="flex flex-col h-full bg-slate-50 flex-1">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-pizza-red" />
          <h2 className="text-slate-800 font-bold text-sm">Ticket Actual</h2>
          {items.length > 0 && (
            <span className="bg-pizza-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {items.length}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
            title="Limpiar ticket"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 hide-scrollbar">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
            <ShoppingCart className="w-8 h-8 opacity-50" />
            <p className="text-xs text-center font-medium">Ticket vacío</p>
          </div>
        ) : (
          items.map(item => <OrderItem key={item.id} item={item} />)
        )}
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <div className="bg-white border-t border-slate-100 p-4 flex flex-col gap-3 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>IVA (16%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-1">
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
