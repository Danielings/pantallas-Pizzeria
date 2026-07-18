import { useApp } from '../../context/AppContext';
import { ChefHat, Flame, CheckCircle, Truck, Clock } from 'lucide-react';

export default function JobQueue() {
  const { orders, updateOrderStatus } = useApp();

  // Filtrar solo las órdenes activas (no archivadas ni completadas)
  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'archived');

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'preparing': return <ChefHat className="w-4 h-4 text-blue-500" />;
      case 'baking': return <Flame className="w-4 h-4 text-red-500" />;
      case 'ready': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Recibido';
      case 'preparing': return 'En Preparación';
      case 'baking': return 'En Horno';
      case 'ready': return 'Listo p/ Despacho';
      default: return status;
    }
  };

  return (
    <div className="flex gap-4 h-full">
      {activeOrders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <CheckCircle className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">No hay trabajos en cola</p>
        </div>
      ) : (
        activeOrders.map(order => (
          <div key={order.id} className="min-w-[220px] w-[220px] bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col relative shrink-0">
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-slate-800">{order.id}</span>
              <div className="bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100 flex items-center gap-1.5">
                {getStatusIcon(order.status)}
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  {getStatusText(order.status)}
                </span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto hide-scrollbar mb-3">
              <ul className="text-xs text-slate-600 space-y-1">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex gap-1.5">
                    <span className="font-bold text-slate-800">{item.qty}x</span>
                    <span className="line-clamp-1">{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            {order.status === 'ready' && (
              <button 
                onClick={() => updateOrderStatus(order.id, 'completed')}
                className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Truck className="w-3.5 h-3.5" />
                Informar Delivery
              </button>
            )}
            {order.status !== 'ready' && (
               <div className="text-[10px] text-slate-400 text-center font-medium">
                 Elaboración en curso...
               </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
