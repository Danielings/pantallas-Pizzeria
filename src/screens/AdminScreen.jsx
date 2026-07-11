import { useState } from 'react';
import Dashboard from '../components/admin/Dashboard';
import SalesReport from '../components/admin/SalesReport';
import StaffManagement from '../components/admin/StaffManagement';
import { LayoutDashboard, Receipt, Users } from 'lucide-react';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'reports',   label: 'Reportes',  icon: Receipt },
  { key: 'staff',     label: 'Personal',  icon: Users },
];

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-pizza-gray-3 bg-white">
        <div>
          <h1 className="text-pizza-dark font-bold text-lg">Administración</h1>
          <p className="text-pizza-muted text-xs">Panel de control y analíticas</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-pizza-gray-2 border border-pizza-gray-3 p-1 rounded-xl">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === key
                  ? 'bg-pizza-red text-white shadow-pizza'
                  : 'text-pizza-muted hover:text-pizza-dark'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'reports'   && <SalesReport />}
        {activeTab === 'staff'     && <StaffManagement />}
      </div>
    </div>
  );
}
