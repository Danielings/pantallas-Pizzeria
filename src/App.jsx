import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import CashierScreen from './screens/CashierScreen';
import KitchenScreen from './screens/KitchenScreen';
import AdminScreen from './screens/AdminScreen';
import { ShoppingCart, UtensilsCrossed, BarChart3, Pizza } from 'lucide-react';

function NavBar() {
  return (
    <nav className="flex flex-col items-center py-6 px-3 bg-pizza-gray border-r border-pizza-gray-3 gap-2 min-w-[72px]">
      {/* Logo */}
      <div className="mb-6 flex flex-col items-center gap-1">
        <div className="w-10 h-10 rounded-xl bg-gradient-pizza flex items-center justify-center shadow-pizza">
          <Pizza className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Nav Links */}
      <NavLink
        to="/"
        title="Cajero - POS"
        className={({ isActive }) =>
          `w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
            isActive
              ? 'bg-pizza-red text-white shadow-pizza'
              : 'text-pizza-muted hover:text-pizza-dark hover:bg-pizza-gray-2'
          }`
        }
      >
        <ShoppingCart className="w-5 h-5" />
      </NavLink>

      <NavLink
        to="/kitchen"
        title="Cocina - KDS"
        className={({ isActive }) =>
          `w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
            isActive
              ? 'bg-pizza-red text-white shadow-pizza'
              : 'text-pizza-muted hover:text-pizza-dark hover:bg-pizza-gray-2'
          }`
        }
      >
        <UtensilsCrossed className="w-5 h-5" />
      </NavLink>

      <NavLink
        to="/admin"
        title="Administración"
        className={({ isActive }) =>
          `w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
            isActive
              ? 'bg-pizza-red text-white shadow-pizza'
              : 'text-pizza-muted hover:text-pizza-dark hover:bg-pizza-gray-2'
          }`
        }
      >
        <BarChart3 className="w-5 h-5" />
      </NavLink>
    </nav>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="flex h-screen w-screen overflow-hidden bg-pizza-gray-2">
          <NavBar />
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<CashierScreen />} />
              <Route path="/kitchen" element={<KitchenScreen />} />
              <Route path="/admin" element={<AdminScreen />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
