import { useState } from 'react';
import MenuGrid from '../components/cajero/MenuGrid';
import OrderTicket from '../components/cajero/OrderTicket';
import JobQueue from '../components/cajero/JobQueue';
import FastCustomerForm from '../components/cajero/FastCustomerForm';
import CategoryFilter from '../components/cajero/CategoryFilter';
import CheckoutModal from '../components/cajero/CheckoutModal';
import ExchangeRateWidget from '../components/cajero/ExchangeRateWidget';

export default function CajeroScreen() {
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  return (
    <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto w-full h-full">
      {/* Cabecera y Filtros */}
      <header className="flex flex-wrap lg:flex-nowrap gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 shrink-0">
         <div className="flex items-center gap-6">
           <div>
             <h1 className="text-2xl font-bold tracking-tight text-slate-800">Punto de Venta</h1>
             <p className="text-sm text-slate-500 capitalize">
               {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </p>
           </div>
           <ExchangeRateWidget />
         </div>
         <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
      </header>

      <div className="flex flex-1 gap-6 min-h-0 flex-col xl:flex-row">
        {/* Grilla de Productos y Cola de Trabajos */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            <MenuGrid category={selectedCategory} />
          </div>
          
          <div className="h-64 bg-white rounded-xl shadow-sm border border-slate-100 p-4 shrink-0 flex flex-col overflow-hidden">
            <h2 className="text-lg font-bold text-slate-800 mb-3 shrink-0">Cola de Trabajos Activos</h2>
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
              <JobQueue />
            </div>
          </div>
        </div>

        {/* Ticket de Orden y Registro de Cliente */}
        <aside className="w-full xl:w-[400px] bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col shrink-0 overflow-hidden h-[600px] xl:h-auto">
          <FastCustomerForm />
          <div className="flex-1 overflow-hidden bg-slate-50 border-t border-slate-100">
            <OrderTicket onCheckout={() => setShowCheckout(true)} />
          </div>
        </aside>
      </div>

      {showCheckout && <CheckoutModal onClose={() => setShowCheckout(false)} />}
    </div>
  );
}
