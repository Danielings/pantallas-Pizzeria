import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Smartphone, Banknote, CreditCard, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'mobile', label: 'Pago Móvil', icon: Smartphone, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30 hover:border-blue-400' },
  { id: 'cash', label: 'Efectivo', icon: Banknote, color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30 hover:border-green-400' },
  { id: 'pos', label: 'Punto de Venta', icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/30 hover:border-purple-400' },
];

function PaymentBadge({ method, amount }) {
  const m = PAYMENT_METHODS.find(p => p.id === method);
  if (!m) return null;
  const Icon = m.icon;
  return (
    <div className="flex items-center gap-2 bg-pizza-gray-2 border border-pizza-gray-3 rounded-lg px-3 py-2">
      <Icon className={`w-4 h-4 ${m.color}`} />
      <span className="text-sm text-pizza-muted">{m.label}</span>
      <span className="text-pizza-dark font-bold ml-auto">${amount.toFixed(2)}</span>
    </div>
  );
}

export default function PaymentModal({ onClose }) {
  const { total, currentOrder, addPayment, confirmSale, remaining, amountPaid } = useApp();

  const [step, setStep] = useState(1); // 1 = select method, 2 = enter amount, 3 = done
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amountInput, setAmountInput] = useState('');
  const [error, setError] = useState('');

  const currentRemaining = remaining;

  const handleSelectMethod = (method) => {
    setSelectedMethod(method);
    setStep(2);
    setAmountInput(currentRemaining.toFixed(2));
    setError('');
  };

  const handleApply = () => {
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
      setError('Ingresa un monto válido.');
      return;
    }
    if (amount > currentRemaining + 0.001) {
      setError(`El monto no puede exceder $${currentRemaining.toFixed(2)}`);
      return;
    }

    addPayment({ method: selectedMethod.id, label: selectedMethod.label, amount });

    const newRemaining = currentRemaining - amount;
    if (newRemaining <= 0.01) {
      setStep(3);
    } else {
      // Return to method selection for next payment
      setStep(1);
      setSelectedMethod(null);
      setAmountInput('');
      setError('');
    }
  };

  const handleConfirm = () => {
    confirmSale({
      total,
      items: currentOrder.items,
      payments: [...currentOrder.payments],
    });
    onClose();
  };

  const totalPaidSoFar = currentOrder.payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content w-[480px] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-pizza-gray-3">
          <div>
            <h2 className="text-pizza-dark font-bold text-lg">
              {step === 3 ? '¡Pago Completado!' : 'Procesar Pago'}
            </h2>
            <p className="text-pizza-muted text-sm">
              Total de la orden: <span className="text-pizza-dark font-semibold">${total.toFixed(2)}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-pizza-muted hover:text-pizza-dark p-1.5 rounded-lg hover:bg-pizza-gray-2 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Payments applied so far */}
          {currentOrder.payments.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-pizza-muted text-xs font-semibold uppercase tracking-wider">Pagos Aplicados</p>
              {currentOrder.payments.map((p, i) => (
                <PaymentBadge key={i} method={p.method} amount={p.amount} />
              ))}
            </div>
          )}

          {/* Remaining balance */}
          {step !== 3 && (
            <div className="flex items-center justify-between bg-pizza-gray-2 border border-pizza-gray-3 rounded-xl p-4">
              <span className="text-pizza-muted font-medium">Saldo Pendiente</span>
              <span className="text-pizza-red font-extrabold text-2xl">${currentRemaining.toFixed(2)}</span>
            </div>
          )}

          {/* STEP 1: Method selection */}
          {step === 1 && (
            <div className="flex flex-col gap-2">
              <p className="text-pizza-dark font-semibold text-sm mb-1">Selecciona el método de pago:</p>
              {PAYMENT_METHODS.map(method => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => handleSelectMethod(method)}
                    className={`flex items-center gap-4 px-4 py-4 rounded-xl border transition-all duration-200 ${method.bg}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-current/5`}>
                      <Icon className={`w-5 h-5 ${method.color}`} />
                    </div>
                    <span className="text-pizza-dark font-semibold flex-1 text-left">{method.label}</span>
                    <ChevronRight className="w-4 h-4 text-pizza-muted" />
                  </button>
                );
              })}
            </div>
          )}

          {/* STEP 2: Amount entry */}
          {step === 2 && selectedMethod && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <button onClick={() => { setStep(1); setError(''); }} className="text-pizza-muted hover:text-pizza-dark transition-colors">
                  ← Volver
                </button>
                <div className="flex items-center gap-2">
                  <selectedMethod.icon className={`w-5 h-5 ${selectedMethod.color}`} />
                  <span className="text-pizza-dark font-semibold">{selectedMethod.label}</span>
                </div>
              </div>

              <div>
                <label className="text-pizza-muted text-sm mb-2 block">Monto a pagar:</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pizza-muted font-bold text-lg">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={currentRemaining}
                    value={amountInput}
                    onChange={e => { setAmountInput(e.target.value); setError(''); }}
                    className="input-field pl-8 text-xl font-bold py-4 text-right"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleApply()}
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 mt-2 text-pizza-red text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 flex-wrap">
                {[currentRemaining, 20, 50, 100].filter((v, i, a) => a.indexOf(v) === i && v > 0).map(v => (
                  <button
                    key={v}
                    onClick={() => setAmountInput(Math.min(v, currentRemaining).toFixed(2))}
                    className="px-3 py-1.5 bg-pizza-gray-2 hover:bg-pizza-gray-3 border border-pizza-gray-3 text-pizza-dark text-sm rounded-lg transition-colors"
                  >
                    ${Math.min(v, currentRemaining).toFixed(2)}
                  </button>
                ))}
              </div>

              <button onClick={handleApply} className="btn-primary py-3.5 font-bold text-base">
                Pagar ${parseFloat(amountInput || 0).toFixed(2)}
              </button>
            </div>
          )}

          {/* STEP 3: Confirmation */}
          {step === 3 && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center animate-fade-in">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <div className="text-center">
                <h3 className="text-pizza-dark font-bold text-lg">Venta Confirmada</h3>
                <p className="text-pizza-muted text-sm mt-1">La orden fue enviada a cocina</p>
              </div>
              <div className="w-full bg-pizza-gray-2 border border-pizza-gray-3 rounded-xl p-4 flex justify-between items-center">
                <span className="text-pizza-muted">Total pagado</span>
                <span className="text-green-500 font-extrabold text-xl">${total.toFixed(2)}</span>
              </div>
              <button onClick={handleConfirm} className="btn-primary w-full py-3.5 font-bold text-base">
                ✓ Cerrar y Nueva Orden
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
