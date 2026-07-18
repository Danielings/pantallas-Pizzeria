import { useState } from 'react';
import { useApp, AppProvider } from './context/AppContext';
import NuevaOrdenScreen from './screens/NuevaOrdenScreen';
import ColaTrabajoScreen from './screens/ColaTrabajoScreen';
import ClientesScreen from './screens/ClientesScreen';
import DeliveryScreen from './screens/DeliveryScreen';
import CocineroScreen from './screens/CocineroScreen';
import AdminScreen from './screens/AdminScreen';
import LoginScreen from './screens/LoginScreen';
import Sidebar from './components/layout/Sidebar';

function MainApp() {
  const { currentUser } = useApp();
  const [cashierView, setCashierView] = useState('nueva-orden');
  const [adminView, setAdminView] = useState('dashboard');

  if (!currentUser) return <LoginScreen />;

  const renderCashierView = () => {
    switch (cashierView) {
      case 'cola-trabajos': return <ColaTrabajoScreen />;
      case 'clientes':      return <ClientesScreen />;
      case 'delivery':      return <DeliveryScreen />;
      default:              return <NuevaOrdenScreen />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {currentUser.role !== 'chef' && (
        <Sidebar
          module={currentUser.role}
          activeView={currentUser.role === 'admin' ? adminView : cashierView}
          onNavigate={currentUser.role === 'admin' ? setAdminView : setCashierView}
        />
      )}
      
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {currentUser.role === 'admin'   && <AdminScreen activeView={adminView} />}
        {currentUser.role === 'cashier' && renderCashierView()}
        {currentUser.role === 'chef'    && <CocineroScreen />}
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
