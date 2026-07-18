import { useApp } from '../../context/AppContext';
import { 
  LogOut, 
  Pizza, 
  LayoutDashboard, 
  ListOrdered, 
  Users, 
  ChefHat, 
  FileText, 
  Package, 
  ShoppingBag,
  Truck
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar({ module, activeView, onNavigate }) {
  const { currentUser, logout } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const cashierLinks = [
    { id: 'nueva-orden', name: 'Nueva Orden', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'cola-trabajos', name: 'Cola de Trabajos', icon: <ChefHat className="w-5 h-5" /> },
    { id: 'delivery', name: 'Delivery', icon: <Truck className="w-5 h-5" /> },
    { id: 'clientes', name: 'Clientes', icon: <Users className="w-5 h-5" /> },
  ];

  const adminLinks = [
    { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'reportes', name: 'Ventas y Reportes', icon: <FileText className="w-5 h-5" /> },
    { id: 'personal', name: 'Personal', icon: <Users className="w-5 h-5" /> },
    { id: 'bitacora', name: 'Bitácora', icon: <ListOrdered className="w-5 h-5" /> },
    { id: 'clientes-top', name: 'Clientes Principales', icon: <Users className="w-5 h-5" /> },
  ];

  const links = module === 'admin' ? adminLinks : cashierLinks;

  return (
    <aside className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col ${collapsed ? 'w-20' : 'w-64'} h-full shadow-sm relative z-20 shrink-0`}>
      <div className="p-4 flex items-center gap-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pizza-red to-pizza-red-dark flex items-center justify-center shadow-md shrink-0">
          <Pizza className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 leading-tight text-lg tracking-tight">Pizzería</span>
            <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">{currentUser?.role}</span>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = activeView === link.id;
          return (
            <button 
              key={link.id}
              onClick={() => onNavigate(link.id)}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all font-medium ${collapsed ? 'justify-center' : 'justify-start'} ${
                isActive 
                  ? 'bg-pizza-red text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-pizza-red'
              }`}
              title={collapsed ? link.name : ''}
            >
              {link.icon}
              {!collapsed && <span className="text-sm">{link.name}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : 'justify-between'} mb-4`}>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
               <span className="text-sm font-semibold text-slate-800 truncate">{currentUser?.name}</span>
               <span className="text-xs text-slate-500 truncate">{currentUser?.email}</span>
            </div>
          )}
        </div>
        
        <button 
          onClick={logout}
          className={`flex items-center justify-center gap-2 text-sm font-semibold w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm ${collapsed ? 'px-0' : ''}`}
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Salir</span>}
        </button>
      </div>

      {/* Botón colapsar */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 bg-white border border-slate-200 rounded-full p-1 shadow-sm hover:shadow-md text-slate-400 hover:text-slate-600 transition-all z-30"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${collapsed ? 'rotate-180' : ''}`}>
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
    </aside>
  );
}
