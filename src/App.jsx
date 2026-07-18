import { useApp, AppProvider } from './context/AppContext';
import CajeroScreen from './screens/CajeroScreen';
import CocineroScreen from './screens/CocineroScreen';
import AdminScreen from './screens/AdminScreen';
import LoginScreen from './screens/LoginScreen';
import { LogOut, Pizza } from 'lucide-react';

function Header() {
  const { currentUser, logout } = useApp();
  
  if (!currentUser) return null;
  
  return (
    <header className="bg-white border-b border-pizza-gray-3 py-3 px-6 flex items-center justify-between z-10 sticky top-0 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-pizza flex items-center justify-center shadow-pizza">
            <Pizza className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-pizza-dark">Pizzería</span>
        </div>
        <span className="bg-pizza-gray-2 text-pizza-muted px-2.5 py-1 rounded-md text-xs font-semibold uppercase">
          {currentUser.role}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-pizza-dark hidden sm:block">{currentUser.name}</span>
        <button 
          onClick={logout}
          className="flex items-center gap-2 text-sm text-pizza-muted hover:text-pizza-red transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-pizza-red/10"
        >
          <LogOut className="w-4 h-4" />
          Salir
        </button>
      </div>
    </header>
  );
}

function MainApp() {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-pizza-gray-2">
      <Header />
      <main className="flex-1 overflow-hidden relative">
        {currentUser.role === 'admin' && <AdminScreen />}
        {currentUser.role === 'cashier' && <CajeroScreen />}
        {currentUser.role === 'chef' && <CocineroScreen />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
