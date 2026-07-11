import { useState } from 'react';
import ProductCatalog from '../components/cashier/ProductCatalog';
import OrderPanel from '../components/cashier/OrderPanel';
import PaymentModal from '../components/cashier/PaymentModal';
import CrudModal from '../components/cashier/CrudModal';
import { Settings } from 'lucide-react';

export default function CashierScreen() {
  const [showPayment, setShowPayment] = useState(false);
  const [showCrud, setShowCrud] = useState(false);

  return (
    <div className="flex h-full bg-white">
      {/* Left: Catalog */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-pizza-gray-3 bg-white">
          <div>
            <h1 className="text-pizza-dark font-bold text-lg leading-tight">Punto de Venta</h1>
            <p className="text-pizza-muted text-xs">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => setShowCrud(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-pizza-gray-2 border border-pizza-gray-3 hover:bg-pizza-gray-3 text-pizza-muted hover:text-pizza-dark transition-all text-sm font-medium"
          >
            <Settings className="w-4 h-4" />
            Gestión de Productos
          </button>
        </div>

        {/* Catalog */}
        <div className="flex-1 overflow-hidden">
          <ProductCatalog />
        </div>
      </div>

      {/* Right: Order panel */}
      <div className="w-80 xl:w-96 flex-shrink-0">
        <OrderPanel onPay={() => setShowPayment(true)} />
      </div>

      {/* Modals */}
      {showPayment && <PaymentModal onClose={() => setShowPayment(false)} />}
      {showCrud && <CrudModal onClose={() => setShowCrud(false)} />}
    </div>
  );
}
