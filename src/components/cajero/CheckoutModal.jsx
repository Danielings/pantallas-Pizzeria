import { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  X,
  Smartphone,
  Banknote,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Receipt,
  Printer,
} from "lucide-react";
import PaymentEntryModal from "./PaymentEntryModal";

const PAYMENT_METHODS = [
  {
    id: "mobile",
    label: "Pago Móvil",
    icon: Smartphone,
    color: "text-blue-500",
    bg: "bg-blue-50 border-blue-200 hover:border-blue-400",
  },
  {
    id: "cash",
    label: "Efectivo",
    icon: Banknote,
    color: "text-emerald-500",
    bg: "bg-emerald-50 border-emerald-200 hover:border-emerald-400",
  },
  {
    id: "pos",
    label: "Punto de Venta",
    icon: CreditCard,
    color: "text-purple-500",
    bg: "bg-purple-50 border-purple-200 hover:border-purple-400",
  },
];

export default function CheckoutModal({ onClose }) {
  const { total, currentOrder, confirmSale, exchangeRate } = useApp();

  const ORDER_TYPE_LABELS = {
    dine_in: "Local",
    takeaway: "Llevar",
    delivery_call: "Delivery (Llamada)",
    delivery_ws: "Delivery (WhatsApp)",
  };

  // internal payments array to allow splits
  const [step, setStep] = useState(1); // 1 = select/orderType & methods, 2 = preview/confirmed
  const [orderType, setOrderType] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentsInternal, setPaymentsInternal] = useState([]);
  const [currency, setCurrency] = useState("Bs");
  const [overrideTotalEnabled, setOverrideTotalEnabled] = useState(false);
  const [overrideTotal, setOverrideTotal] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [error, setError] = useState("");

  // overrideTotal may be entered in current `currency`. Convert to USD internally.
  const parsedOverride = !isNaN(parseFloat(overrideTotal))
    ? parseFloat(overrideTotal)
    : null;
  let overrideUSD = null;
  if (overrideTotalEnabled && parsedOverride) {
    if (currency === "Bs") {
      const r = exchangeRate || 0;
      overrideUSD = r > 0 ? parsedOverride / r : null;
    } else {
      overrideUSD = parsedOverride;
    }
  }
  const totalToUse = overrideUSD && overrideUSD > 0 ? overrideUSD : total;
  const paidSoFar = paymentsInternal.reduce((s, p) => s + p.amount, 0);
  const remainingLocalUSD = Math.max(0, totalToUse - paidSoFar);

  const formatDisplay = (usd) => {
    if (currency === "Bs")
      return `Bs. ${(usd * (exchangeRate || 0)).toFixed(2)}`;
    return `$${usd.toFixed(2)}`;
  };

  const parseToUSD = (val) => {
    const v = parseFloat(val);
    if (isNaN(v) || v <= 0) return NaN;
    if (currency === "Bs") {
      const r = exchangeRate || 0;
      if (r <= 0) return NaN;
      return v / r;
    }
    return v;
  };

  const handleSelectMethod = (method) => {
    setSelectedMethod(method);
    // open modal to enter full/partial amount
    setShowPaymentEntry(true);
  };

  const [showPaymentEntry, setShowPaymentEntry] = useState(false);

  const handleAddFromModal = (amountUSD) => {
    setPaymentsInternal((prev) => [
      ...prev,
      {
        method: selectedMethod.id,
        label: selectedMethod.label,
        amount: amountUSD,
      },
    ]);
    setShowPaymentEntry(false);
    setSelectedMethod(null);
    if (
      totalToUse -
        (paymentsInternal.reduce((s, p) => s + p.amount, 0) + amountUSD) <=
      0.01
    ) {
      setStep(2);
    }
  };

  const handleAddPayment = () => {
    const amountUSD = parseToUSD(amountInput);
    if (isNaN(amountUSD) || amountUSD <= 0) {
      setError("Monto inválido");
      return;
    }
    if (amountUSD > remainingLocalUSD + 0.001) {
      setError("El monto excede el restante");
      return;
    }
    setPaymentsInternal((prev) => [
      ...prev,
      {
        method: selectedMethod.id,
        label: selectedMethod.label,
        amount: amountUSD,
      },
    ]);
    setSelectedMethod(null);
    setAmountInput("");
    if (remainingLocalUSD - amountUSD <= 0.01) {
      setStep(2);
    }
  };

  const handleConfirmAndPrint = () => {
    confirmSale({
      total: totalToUse,
      items: currentOrder.items,
      payments: paymentsInternal,
      orderType,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-slate-800 font-bold text-lg">
              {step === 2 ? "Ticket de Factura" : "Procesar Pago"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-4">
                <div>
                  <span className="text-slate-600 font-medium">
                    Total a Pagar
                  </span>
                  <div className="text-slate-800 font-extrabold text-lg">
                    {formatDisplay(totalToUse)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrency("Bs")}
                      className={`px-3 py-1 rounded-lg ${currency === "Bs" ? "bg-pizza-red/10 text-pizza-red" : "bg-slate-100"}`}
                    >
                      Bs
                    </button>
                    <button
                      onClick={() => setCurrency("USD")}
                      className={`px-3 py-1 rounded-lg ${currency === "USD" ? "bg-pizza-red/10 text-pizza-red" : "bg-slate-100"}`}
                    >
                      $
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-600 text-sm">
                  Modificar total:
                </label>
                <input
                  type="checkbox"
                  checked={overrideTotalEnabled}
                  onChange={(e) => setOverrideTotalEnabled(e.target.checked)}
                />
                {overrideTotalEnabled && (
                  <input
                    value={overrideTotal}
                    onChange={(e) => setOverrideTotal(e.target.value)}
                    className="input-field ml-2"
                    placeholder={`Total en ${currency === "Bs" ? "Bs" : "USD"}`}
                  />
                )}
              </div>

              {!orderType ? (
                <div className="flex flex-col gap-3">
                  <p className="text-slate-600 font-medium text-sm">
                    ¿Tipo de orden?
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setOrderType("dine_in")}
                      className="btn-secondary hover:bg-pizza-red/10 hover:text-pizza-red"
                    >
                      Local
                    </button>
                    <button
                      onClick={() => setOrderType("takeaway")}
                      className="btn-secondary hover:bg-pizza-red/10 hover:text-pizza-red"
                    >
                      Llevar
                    </button>

                    <button
                      onClick={() => setOrderType("delivery_ws")}
                      className="btn-secondary hover:bg-pizza-red/10 hover:text-pizza-red"
                    >
                      Delivery
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-slate-600 font-medium text-sm">
                    Tipo:{" "}
                    <span className="font-semibold text-slate-800">
                      {ORDER_TYPE_LABELS[orderType] || orderType}
                    </span>
                  </p>

                  <p className="text-slate-600 font-medium text-sm mt-2">
                    Selecciona el método de pago:
                  </p>
                  <div className="flex flex-col gap-3">
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.id}
                          onClick={() => handleSelectMethod(method)}
                          className={`flex items-center gap-4 px-4 py-4 rounded-xl border transition-all duration-200 ${method.bg}`}
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm">
                            <Icon className={`w-5 h-5 ${method.color}`} />
                          </div>
                          <span className="text-slate-800 font-bold flex-1 text-left">
                            {method.label}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {showPaymentEntry && selectedMethod && (
                <PaymentEntryModal
                  method={selectedMethod}
                  currency={currency}
                  exchangeRate={exchangeRate}
                  remainingUSD={remainingLocalUSD}
                  onAdd={handleAddFromModal}
                  onClose={() => setShowPaymentEntry(false)}
                />
              )}

              {paymentsInternal.length > 0 && (
                <div className="bg-white border rounded-xl p-3">
                  <p className="text-slate-600 text-sm font-semibold">Pagos</p>
                  <div className="mt-2">
                    {paymentsInternal.map((p, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <div>{p.label}</div>
                        <div>
                          {currency === "Bs"
                            ? `Bs. ${(p.amount * (exchangeRate || 0)).toFixed(2)}`
                            : `$${p.amount.toFixed(2)}`}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-bold mt-3">
                    <div>Restante</div>
                    <div>{formatDisplay(remainingLocalUSD)}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>

              {/* Ticket Preview */}
              <div className="w-full bg-slate-50 border border-slate-200 border-dashed rounded-lg p-5 font-mono text-sm shadow-sm relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2">
                  <Receipt className="w-5 h-5 text-slate-400" />
                </div>
                <div className="text-center mb-4 mt-2">
                  <h3 className="font-bold text-lg">PIZZERÍA</h3>
                  <p className="text-xs text-slate-500">
                    Ticket de Venta #{Math.floor(Math.random() * 10000)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date().toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2 border-t border-b border-dashed border-slate-300 py-3 mb-3">
                  {currentOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        {item.qty}x {item.name}
                      </span>
                      <span>
                        {currency === "Bs"
                          ? `Bs. ${(item.price * item.qty * (exchangeRate || 0)).toFixed(2)}`
                          : `$${(item.price * item.qty).toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-base border-t border-slate-300 pt-2">
                  <span>TOTAL PAGADO</span>
                  <div className="text-right">
                    <div>
                      {currency === "Bs"
                        ? `Bs. ${(paidSoFar * (exchangeRate || 0)).toFixed(2)}`
                        : `$${paidSoFar.toFixed(2)}`}
                    </div>
                    <div className="text-slate-500 text-xs font-semibold mt-0.5">
                      {currency === "Bs"
                        ? formatDisplay(totalToUse)
                        : formatDisplay(totalToUse)}
                    </div>
                  </div>
                </div>
                <div className="text-center text-xs text-slate-500 mt-4 uppercase">
                  {paymentsInternal.map((p, i) => (
                    <div key={i}>
                      {p.label}
                      {i < paymentsInternal.length - 1 ? " + " : ""}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleConfirmAndPrint}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3.5 rounded-xl font-bold text-base shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Imprimir y Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
