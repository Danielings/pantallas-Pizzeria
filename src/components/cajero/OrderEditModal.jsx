import React, { useState } from "react";
import { X } from "lucide-react";
import { useApp } from "../../context/AppContext";
import OrderPaymentAdjustmentModal from "./OrderPaymentAdjustmentModal";

export default function OrderEditModal({ order, onClose }) {
  const { extras, updateOrder, products } = useApp();

  const findProductByName = (name) => {
    if (!products) return null;
    return Object.values(products)
      .flat()
      .find((product) => product.name === name);
  };

  const calculateItemPrice = (basePrice, size, extras = []) => {
    let multiplier = 1;
    if (size === "Mediana") multiplier = 1.3;
    if (size === "Familiar") multiplier = 1.6;
    const extrasCost = extras.reduce((sum, e) => sum + (e.price || 0), 0);
    return basePrice * multiplier + extrasCost;
  };

  const [localItems, setLocalItems] = useState(
    order.items.map((it) => {
      const product = findProductByName(it.name);
      const basePrice = it.basePrice || product?.price || 0;
      const size = it.size || (product?.sizes?.[0] ?? null);
      const itemExtras = it.extras ? [...it.extras] : [];
      return {
        ...it,
        basePrice,
        extras: itemExtras,
        note: it.note || "",
        orderType: it.orderType || "comer",
        size,
        price: it.price || calculateItemPrice(basePrice, size, itemExtras),
      };
    }),
  );
  const [showPaymentAdjust, setShowPaymentAdjust] = useState(false);

  const splitOne = (index) => {
    setLocalItems((prev) => {
      const items = [...prev];
      const it = items[index];
      if (!it || it.qty <= 1) return prev;
      // decrement original
      items[index] = { ...it, qty: it.qty - 1 };
      // create new single item copy, mark as new separate
      const newItem = {
        ...it,
        qty: 1,
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        isSeparated: true,
        orderType: it.orderType || "llevar",
      };
      items.splice(index + 1, 0, newItem);
      return items;
    });
  };

  const toggleExtra = (itemIndex, extra) => {
    setLocalItems((prev) =>
      prev.map((it, i) => {
        if (i !== itemIndex) return it;
        const has = it.extras.find((e) => e.id === extra.id);
        const updatedExtras = has
          ? it.extras.filter((e) => e.id !== extra.id)
          : [...(it.extras || []), { ...extra, isNew: true }];
        return {
          ...it,
          extras: updatedExtras,
          price: calculateItemPrice(it.basePrice, it.size, updatedExtras),
        };
      }),
    );
  };

  const isPizzaItem = (item) =>
    products &&
    products.pizzas &&
    products.pizzas.some((p) => p.name === item.name);

  const hasEditablePizza = localItems.some((item) => isPizzaItem(item));

  const handleSave = () => {
    const total = localItems.reduce(
      (sum, item) => sum + (item.price || 0) * item.qty,
      0,
    );
    const newOrder = { ...order, items: localItems, total };
    updateOrder(newOrder);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content w-[640px] max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold">Editar {order.id}</h3>
          <button onClick={onClose} className="p-1 text-pizza-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          {localItems.map((it, idx) => {
            const isPizza =
              products &&
              products.pizzas &&
              products.pizzas.find((p) => p.name === it.name);
            return (
              <div key={idx} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">
                    {it.qty}x {it.name} {it.size ? `(${it.size})` : ""}
                  </div>
                  <div className="flex items-center gap-2">
                    {isPizza && it.qty > 1 && (
                      <button
                        onClick={() => splitOne(idx)}
                        className="text-xs px-2 py-1 bg-slate-100 rounded"
                      >
                        Separar 1
                      </button>
                    )}
                    <select
                      value={it.orderType}
                      onChange={(e) =>
                        setLocalItems((prev) =>
                          prev.map((it2, i2) =>
                            i2 === idx
                              ? { ...it2, orderType: e.target.value }
                              : it2,
                          ),
                        )
                      }
                      className="text-xs border rounded px-2 py-1"
                    >
                      <option value="comer">Local</option>
                      <option value="llevar">Llevar</option>
                      <option value="delivery_call">Delivery</option>
                    </select>
                  </div>
                </div>

                {isPizza && (
                  <>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <div>
                        <label className="text-xs text-slate-500">Tamaño</label>
                        <select
                          value={it.size || "Personal"}
                          onChange={(e) =>
                            setLocalItems((prev) =>
                              prev.map((it2, i2) =>
                                i2 === idx
                                  ? {
                                      ...it2,
                                      size: e.target.value,
                                      price: calculateItemPrice(
                                        it2.basePrice,
                                        e.target.value,
                                        it2.extras,
                                      ),
                                    }
                                  : it2,
                              ),
                            )
                          }
                          className="text-xs border rounded px-2 py-1"
                        >
                          {products.pizzas
                            .find((p) => p.name === it.name)
                            ?.sizes?.map((size) => (
                              <option key={size} value={size}>
                                {size}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                    <div className="text-xs text-pizza-muted mb-2">
                      Extras disponibles:
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {extras.map((ex) => {
                        const active = !!(it.extras || []).find(
                          (e) => e.id === ex.id,
                        );
                        return (
                          <button
                            key={ex.id}
                            onClick={() => toggleExtra(idx, ex)}
                            className={`px-3 py-1 rounded-lg text-sm ${active ? "bg-pizza-red text-white" : "bg-slate-100 text-slate-700"}`}
                          >
                            {ex.name}
                          </button>
                        );
                      })}
                    </div>

                    {it.extras && it.extras.length > 0 && (
                      <div className="mt-3 text-sm">
                        Seleccionados:{" "}
                        {it.extras
                          .map((e) => e.name + (e.isNew ? " (nuevo)" : ""))
                          .join(", ")}
                      </div>
                    )}
                  </>
                )}

                <div className="mt-3">
                  <label className="text-xs font-medium text-slate-600">
                    Nota para cocina
                  </label>
                  <textarea
                    value={it.note || ""}
                    onChange={(e) =>
                      setLocalItems((prev) =>
                        prev.map((it2, i2) =>
                          i2 === idx ? { ...it2, note: e.target.value } : it2,
                        ),
                      )
                    }
                    className="w-full mt-1 p-2 border rounded text-sm"
                    placeholder="p.ej. mitad queso / mitad champiñones"
                  />
                </div>
              </div>
            );
          })}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button onClick={handleSave} className="btn-primary flex-1">
              Guardar y Enviar a Cocina
            </button>
            <button
              onClick={() => setShowPaymentAdjust(true)}
              className="btn-secondary flex-1"
              disabled={!hasEditablePizza}
            >
              Modificar Pago
            </button>
            <button onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
          </div>
          {showPaymentAdjust && (
            <OrderPaymentAdjustmentModal
              originalOrder={order}
              editedItems={localItems}
              onClose={() => setShowPaymentAdjust(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
