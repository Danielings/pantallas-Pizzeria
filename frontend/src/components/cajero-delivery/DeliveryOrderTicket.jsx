import { useApp } from "../../context/AppContext";
import OrderItem from "../cajero/OrderItem";
import { ShoppingCart, Package, Trash2, UserCheck, User, Bike } from "lucide-react";
import { useExchangeRate } from "../../hooks/useExchangeRate";

export default function DeliveryOrderTicket({ onCheckout, onOpenCustomer }) {
  const { currentOrder, total, boxPrice, setIncludesBox } = useApp();
  const { exchangeRate } = useExchangeRate();
  const { items, pendingRemaining, customer } = currentOrder;

  const addedTotal = items
    .filter((item) => !item.isPendingExisting)
    .reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
      0
    );

  const includesBox = Boolean(currentOrder.includesBox);
  const boxCharge = includesBox ? Number(boxPrice) || 0 : 0;
  const displayTotal =
    pendingRemaining != null
      ? pendingRemaining + addedTotal + boxCharge
      : total + boxCharge;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-slate-50">
      {/* Banner de Cliente Delivery */}
      <div className="bg-white border-b border-slate-100 px-3 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-red-100 text-pizza-red flex items-center justify-center shrink-0">
            <Bike className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Cliente Delivery
            </span>
            <span className="text-xs font-bold text-slate-800 truncate">
              {customer?.name || "Sin cliente (se pedirá al cobrar)"}
            </span>
          </div>
        </div>
        {customer?.name && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
            <UserCheck className="w-3 h-3" />
            Listo
          </span>
        )}
      </div>

      {/* Lista de Items */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 flex flex-col gap-1.5 sm:gap-2 hide-scrollbar overscroll-contain">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 p-6">
            <ShoppingCart className="w-8 h-8 opacity-40 text-slate-400" />
            <p className="text-xs text-center font-bold text-slate-600">Ticket Vacío</p>
            <p className="text-[11px] text-center text-slate-400">
              Selecciona pizzas, bebidas o combos para agregarlos al pedido delivery.
            </p>
          </div>
        ) : (
          items.map((item) => <OrderItem key={item.id} item={item} />)
        )}
      </div>

      {/* Totales y Acción */}
      {items.length > 0 && (
        <div className="bg-white border-t border-slate-100 p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <div className="space-y-1.5 text-sm">
            {/* Control para agregar caja para delivery */}
            {!includesBox ? (
              <button
                type="button"
                onClick={() => setIncludesBox(true)}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-left cursor-pointer select-none hover:border-slate-400 transition-colors"
              >
                <span className="flex items-center gap-2 text-slate-700 font-semibold text-xs">
                  <Package className="w-4 h-4 text-pizza-red" />
                  Agregar caja para delivery
                  <span className="text-xs font-normal text-slate-500">
                    ${boxPrice.toFixed(2)}
                  </span>
                </span>
                <span className="text-slate-400 text-xs font-bold">+ Añadir</span>
              </button>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
                  <Package className="w-4 h-4 text-pizza-red" />
                  Caja para delivery
                  <span className="text-xs font-normal text-slate-500">
                    1 × ${boxPrice.toFixed(2)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setIncludesBox(false)}
                  title="Quitar caja"
                  className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Total USD y Bs */}
            <div className="flex justify-between items-center pt-1">
              <div>
                <span className="text-slate-800 font-black text-sm">Total Delivery</span>
                <span className="block text-[10px] text-slate-400">Impuestos y tasa incluidos</span>
              </div>
              <div className="text-right">
                <div className="text-slate-900 font-black text-lg sm:text-xl leading-tight">
                  ${displayTotal.toFixed(2)}
                </div>
                {exchangeRate > 0 && (
                  <div className="text-slate-500 text-xs font-bold mt-0.5">
                    Bs. {(displayTotal * exchangeRate).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onCheckout}
            className="w-full bg-pizza-red hover:bg-pizza-red-dark text-white py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-black shadow-md shadow-pizza-red/25 hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>Cobrar ${displayTotal.toFixed(2)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
