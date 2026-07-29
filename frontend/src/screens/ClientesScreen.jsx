import { useState } from 'react';
import { UserPlus, Search, Users, CheckCircle2, Trash2, Phone, CreditCard, User } from 'lucide-react';

const MOCK_CUSTOMERS = [
  { id: 1, cedula: 'V-12345678', name: 'Juan Pérez', phone: '0414-1234567', orders: 12, total: 284.50, lastVisit: '2026-07-17' },
  { id: 2, cedula: 'V-23456789', name: 'María González', phone: '0424-9876543', orders: 8, total: 198.00, lastVisit: '2026-07-16' },
  { id: 3, cedula: 'E-34567890', name: 'Carlos Ramírez', phone: '0416-5553210', orders: 22, total: 512.75, lastVisit: '2026-07-18' },
  { id: 4, cedula: 'V-45678901', name: 'Ana Soto', phone: '0412-7776543', orders: 5, total: 120.00, lastVisit: '2026-07-10' },
  { id: 5, cedula: 'V-56789012', name: 'Luis Herrera', phone: '0426-4441122', orders: 17, total: 390.30, lastVisit: '2026-07-14' },
];

export default function ClientesScreen() {
  const [search, setSearch] = useState('');
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    if (!cedula || !nombre || !telefono) return;
    const newCustomer = {
      id: Date.now(),
      cedula,
      name: nombre,
      phone: telefono,
      orders: 0,
      total: 0,
      lastVisit: new Date().toISOString().split('T')[0],
    };
    setCustomers(prev => [newCustomer, ...prev]);
    setSaved(true);
    setCedula(''); setNombre(''); setTelefono('');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = (id) => setCustomers(prev => prev.filter(c => c.id !== id));

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.cedula.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto w-full h-full bg-slate-50">
      {/* Header */}
      <header className="flex flex-wrap gap-4 justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-slate-100 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-pizza-red" />
            Clientes
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{customers.length} clientes registrados</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o teléfono..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-72 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Formulario de Registro */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <h2 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-pizza-red" />
              Registrar Cliente
            </h2>
            <form onSubmit={handleSave} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Cédula / RIF</label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ej: V-12345678"
                    value={cedula}
                    onChange={e => setCedula(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Nombre Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Nombre y apellido"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Teléfono</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="Ej: 0414-1234567"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-2 w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {saved ? (
                  <><CheckCircle2 className="w-4 h-4 text-green-400" /> ¡Registrado!</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Registrar Cliente</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Tabla de Clientes */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-base">Directorio de Clientes</h2>
              <p className="text-xs text-slate-500 mt-0.5">{filtered.length} resultado(s)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Cédula</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Órdenes</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Gastado</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Última Visita</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="font-medium">No se encontraron clientes</p>
                      </td>
                    </tr>
                  ) : filtered.map(customer => (
                    <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {customer.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-800">{customer.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-mono text-xs">{customer.cedula}</td>
                      <td className="px-5 py-4 text-slate-600">{customer.phone}</td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-bold text-slate-700">{customer.orders}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-bold text-emerald-600">${customer.total.toFixed(2)}</span>
                      </td>
                      <td className="px-5 py-4 text-right text-slate-500 text-xs">{customer.lastVisit}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1.5 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
