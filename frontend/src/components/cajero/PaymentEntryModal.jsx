import { X, AlertCircle } from "lucide-react";
import React from "react";

export default function PaymentEntryModal({
  method,
  currency = "Bs",
  exchangeRate = 1,
  remainingUSD,
  onAdd,
  onClose,
}) {
  const [amountInput, setAmountInput] = React.useState("");
  const [error, setError] = React.useState("");

  const displayRemaining =
    currency === "Bs"
      ? (remainingUSD * (exchangeRate || 0)).toFixed(2)
      : remainingUSD.toFixed(2);

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

  const handlePayAll = () => {
    const amt = remainingUSD;
    onAdd(amt);
  };

  const handleAdd = () => {
    const amtUSD = parseToUSD(amountInput);
    if (isNaN(amtUSD) || amtUSD <= 0) {
      setError("Ingresa un monto válido");
      return;
    }
    if (amtUSD > remainingUSD + 0.001) {
      setError("El monto no puede exceder el restante");
      return;
    }
    onAdd(amtUSD);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content w-[420px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold">{method.label}</h3>
          <button onClick={onClose} className="p-1 text-pizza-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-pizza-muted mb-3">
            Saldo restante:{" "}
            <span className="font-bold">
              {currency === "Bs"
                ? `Bs. ${displayRemaining}`
                : `$${displayRemaining}`}
            </span>
          </p>
          <div className="flex gap-2 items-center mb-3">
            <input
              value={amountInput}
              onChange={(e) => {
                setAmountInput(e.target.value);
                setError("");
              }}
              className="input-field flex-1"
              placeholder={currency === "Bs" ? "Monto en Bs." : "Monto en $"}
            />
            <button onClick={handleAdd} className="btn-primary">
              Agregar
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePayAll} className="btn-secondary flex-1">
              Pagar todo
            </button>
            <button onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 mt-3 text-pizza-red text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
