import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Smartphone, Banknote, CreditCard, CheckCircle2, ChevronRight, AlertCircle, Receipt, Printer } from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'mobile', label: 'Pago Móvil', icon: Smartphone, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200 hover:border-blue-400' },
  { id: 'cash', label: 'Efectivo', icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400' },
  { id: 'pos', label: 'Punto de Venta', icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200 hover:border-purple-400' },
];

export default function CheckoutModal({ onClose }) {
  const { total, currentOrder, confirmSale, remaining, exchangeRate } = useApp();

  // 1: Select Method, 2: Ticket Preview
  const [step, setStep] = useState(1); 
  const [selectedMethod, setSelectedMethod] = useState(null);

  const handleApplyPayment = (method) => {
    setSelectedMethod(method);
    setStep(2); // Go directly to ticket preview (simulate quick full payment)
  };

  const handleConfirmAndPrint = () => {
    // Generate order and complete
    confirmSale({
      total,
      items: currentOrder.items,
      payments: [{ method: selectedMethod.id, label: selectedMethod.label, amount: total }],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-slate-800 font-bold text-lg">
              {step === 2 ? 'Ticket de Factura' : 'Procesar Pago'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-4">
                <span className="text-slate-600 font-medium">Total a Pagar</span>
                <div className="text-right">
                  <span className="text-slate-800 font-extrabold text-3xl">${total.toFixed(2)}</span>
                  {exchangeRate > 0 && (
                    <div className="text-slate-500 text-sm font-semibold mt-0.5">
                      Bs. {(total * exchangeRate).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-slate-600 font-medium text-sm mt-2">Selecciona el método de pago:</p>
              <div className="flex flex-col gap-3">
                {PAYMENT_METHODS.map(method => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => handleApplyPayment(method)}
                      className={`flex items-center gap-4 px-4 py-4 rounded-xl border transition-all duration-200 ${method.bg}`}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm">
                        <Icon className={`w-5 h-5 ${method.color}`} />
                      </div>
                      <span className="text-slate-800 font-bold flex-1 text-left">{method.label}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  );
                })}
              </div>
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
                  <p className="text-xs text-slate-500">Ticket de Venta #{Math.floor(Math.random() * 10000)}</p>
                  <p className="text-xs text-slate-500">{new Date().toLocaleString()}</p>
                </div>
                <div className="space-y-2 border-t border-b border-dashed border-slate-300 py-3 mb-3">
                  {currentOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.qty}x {item.name}</span>
                      <span>${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-base border-t border-slate-300 pt-2">
                  <span>TOTAL PAGADO</span>
                  <div className="text-right">
                    <div>${total.toFixed(2)}</div>
                    {exchangeRate > 0 && (
                      <div className="text-slate-500 text-xs font-semibold mt-0.5">
                        Bs. {(total * exchangeRate).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-center text-xs text-slate-500 mt-4 uppercase">
                  Pago via {selectedMethod.label}
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
