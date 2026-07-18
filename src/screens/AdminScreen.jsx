import Dashboard from '../components/admin/Dashboard';
import SalesReport from '../components/admin/Reportes';
import StaffManagement from '../components/admin/Gestion_de_personal';
import ActivityLog from '../components/admin/ActivityLog';
import ClientesPrincipalesScreen from '../components/admin/ClientesPrincipalesScreen';

export default function AdminScreen({ activeView }) {
  return (
    <div className="flex flex-col h-full bg-slate-50 w-full overflow-hidden">
      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeView === 'dashboard' && <Dashboard />}
        {activeView === 'reportes' && <SalesReport />}
        {activeView === 'personal' && <StaffManagement />}
        {activeView === 'bitacora' && (
          <div className="p-6 h-full overflow-hidden flex flex-col">
            <ActivityLog />
          </div>
        )}
        {activeView === 'clientes-top' && <ClientesPrincipalesScreen />}
      </div>
    </div>
  );
}
