import { useApp } from "../../context/AppContext";
import OrderItem from "./OrderItem";
import { ShoppingCart, Package, Trash2 } from "lucide-react";
import { useExchangeRate } from "../../hooks/useExchangeRate";

const BOX_ORDER_TYPES = new Set(["takeaway", "pickup", "PickUp", "delivery"]);

export default function OrderTicket({ onCheckout }) {
  const { currentOrder, total, boxPrice, setIncludesBox } = useApp();
  const { exchangeRate } = useExchangeRate();
  const { items, pendingRemaining } = currentOrder;
  const addedTotal = items
    .filter((item) => !item.isPendingExisting)
    .reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
      0,
    );
  const canAddBox = BOX_ORDER_TYPES.has(currentOrder.orderType);
  const includesBox = Boolean(currentOrder.includesBox);
  const boxCharge = canAddBox && includesBox ? Number(boxPrice) || 0 : 0;
  const displayTotal =
    pendingRemaining != null
      ? pendingRemaining + addedTotal + boxCharge
      : total;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-slate-50">
      {/* Items */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 flex flex-col gap-1.5 sm:gap-2 hide-scrollbar overscroll-contain">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
            <ShoppingCart className="w-8 h-8 opacity-50" />
            <p className="text-xs text-center font-medium">Ticket vacío</p>
            <p className="text-[10px] text-center text-slate-300">
              Agrega un producto para
              <br />
              seleccionar el tipo de pedido
            </p>
          </div>
        ) : (
          items.map((item) => <OrderItem key={item.id} item={item} />)
        )}
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <div className="bg-white border-t border-slate-100 p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <div className="space-y-1.5 text-sm">
            {canAddBox && !includesBox && (
              <button
                onClick={() => setIncludesBox(true)}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-left cursor-pointer select-none hover:border-slate-400 transition-colors"
              >
                <span className="flex items-center gap-2 text-slate-700 font-semibold">
                  <Package className="w-4 h-4 text-pizza-red" />
                  Agregar caja
                  <span className="text-xs font-normal text-slate-500">
                    ${boxPrice.toFixed(2)}
                  </span>
                </span>
                <span className="text-slate-400 text-xs font-semibold">
                  Añadir
                </span>
              </button>
            )}

            {canAddBox && includesBox && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <span className="flex items-center gap-2 text-slate-800 font-semibold">
                  <Package className="w-4 h-4 text-pizza-red" />
                  Caja
                  <span className="text-xs font-normal text-slate-500">
                    1 × ${boxPrice.toFixed(2)}
                  </span>
                </span>
                <button
                  onClick={() => setIncludesBox(false)}
                  title="Quitar caja"
                  className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-800 font-bold">Total</span>
              <div className="text-right">
                <div className="text-slate-800 font-extrabold text-lg sm:text-xl">
                  ${displayTotal.toFixed(2)}
                </div>
                {exchangeRate > 0 && (
                  <div className="text-slate-500 text-sm font-semibold mt-0.5">
                    Bs. {(displayTotal * exchangeRate).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onCheckout}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
          >
            Cobrar ${displayTotal.toFixed(2)}
          </button>
        </div>
      )}
    </div>
  );
}