import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Trash2, Users, Building2, ChevronDown, ChevronRight, UserPlus } from 'lucide-react';

const ROLE_CONFIG = {
  cashier:  { label: 'Cajero',   color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  chef:     { label: 'Cocinero', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  waiter:   { label: 'Mesero',   color: 'bg-green-500/20 text-green-400 border-green-500/30' },
};

const ROLES = ['cashier', 'chef', 'waiter'];

function AddStaffModal({ branchId, onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', role: 'cashier', email: '' });
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!form.name.trim()) { setError('El nombre es requerido'); return; }
    onAdd({ ...form, branchId });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content p-6 w-96" onClick={e => e.stopPropagation()}>
        <h3 className="text-pizza-dark font-bold text-lg mb-4">Agregar Empleado</h3>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-pizza-muted text-xs font-semibold uppercase tracking-wider mb-1.5 block">Nombre Completo</label>
            <input
              type="text"
              value={form.name}
              onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setError(''); }}
              className={`input-field ${error ? 'border-pizza-red' : ''}`}
              placeholder="Ej. Juan Pérez"
              autoFocus
            />
            {error && <p className="text-pizza-red text-xs mt-1">{error}</p>}
          </div>
          <div>
            <label className="text-pizza-muted text-xs font-semibold uppercase tracking-wider mb-1.5 block">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="input-field"
              placeholder="correo@pizzeria.com"
            />
          </div>
          <div>
            <label className="text-pizza-muted text-xs font-semibold uppercase tracking-wider mb-1.5 block">Rol</label>
            <div className="flex gap-2">
              {ROLES.map(r => (
                <button
                  key={r}
                  onClick={() => setForm(p => ({ ...p, role: r }))}
                  className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    form.role === r
                      ? `${ROLE_CONFIG[r].color} border-current`
                      : 'border-pizza-gray-3 text-pizza-muted hover:border-pizza-gray-4'
                  }`}
                >
                  {ROLE_CONFIG[r].label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={handleSubmit} className="btn-primary flex-1">Agregar</button>
        </div>
      </div>
    </div>
  );
}

function BranchCard({ branch }) {
  const { staff, deleteStaff, deleteBranch, addStaff } = useApp();
  const [expanded, setExpanded] = useState(true);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const branchStaff = staff.filter(s => s.branchId === branch.id);

  return (
    <>
      <div className="card overflow-hidden bg-white">
        {/* Branch header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-pizza-gray-3 bg-pizza-gray-2">
          <Building2 className="w-5 h-5 text-pizza-red flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-pizza-dark font-bold">{branch.name}</h3>
            <p className="text-pizza-muted text-xs">{branch.address} · {branchStaff.length} empleado{branchStaff.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddStaff(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-pizza-red/10 hover:bg-pizza-red/20 border border-pizza-red/30 text-pizza-red rounded-lg text-xs font-semibold transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" /> Agregar
            </button>
            {confirmDelete ? (
              <div className="flex gap-1">
                <button onClick={() => deleteBranch(branch.id)} className="px-2 py-1.5 bg-pizza-red text-white rounded-lg text-xs font-bold">Sí</button>
                <button onClick={() => setConfirmDelete(false)} className="px-2 py-1.5 bg-pizza-gray-3 text-pizza-dark rounded-lg text-xs">No</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg hover:bg-pizza-red/10 text-pizza-muted hover:text-pizza-red transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => setExpanded(e => !e)} className="p-1.5 text-pizza-muted hover:text-pizza-dark transition-colors">
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Staff by role */}
        {expanded && (
          <div className="p-4 flex flex-col gap-3">
            {ROLES.map(role => {
              const roleStaff = branchStaff.filter(s => s.role === role);
              const cfg = ROLE_CONFIG[role];
              return (
                <div key={role}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge border ${cfg.color} px-2 py-0.5 text-xs`}>{cfg.label}</span>
                    <span className="text-pizza-muted text-xs">{roleStaff.length}</span>
                  </div>
                  {roleStaff.length === 0 ? (
                    <p className="text-pizza-muted text-xs pl-2 italic">Sin asignaciones</p>
                  ) : (
                    <div className="flex flex-col gap-1.5 pl-2">
                      {roleStaff.map(member => (
                        <div key={member.id} className="flex items-center gap-3 bg-white border border-pizza-gray-3 rounded-lg px-3 py-2">
                          <div className="w-7 h-7 rounded-full bg-pizza-gray-2 border border-pizza-gray-3 flex items-center justify-center text-xs font-bold text-pizza-dark flex-shrink-0">
                            {member.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-pizza-dark text-sm font-medium truncate">{member.name}</p>
                            {member.email && <p className="text-pizza-muted text-xs truncate">{member.email}</p>}
                          </div>
                          <button
                            onClick={() => deleteStaff(member.id)}
                            className="p-1.5 rounded-lg hover:bg-pizza-red/10 text-pizza-muted hover:text-pizza-red transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddStaff && (
        <AddStaffModal
          branchId={branch.id}
          onAdd={addStaff}
          onClose={() => setShowAddStaff(false)}
        />
      )}
    </>
  );
}

export default function StaffManagement() {
  const { branches, addBranch, staff } = useApp();
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', address: '' });
  const [branchError, setBranchError] = useState('');

  const handleAddBranch = () => {
    if (!newBranch.name.trim()) { setBranchError('El nombre es requerido'); return; }
    addBranch(newBranch);
    setNewBranch({ name: '', address: '' });
    setShowAddBranch(false);
    setBranchError('');
  };

  return (
    <div className="flex flex-col gap-4 p-5 overflow-y-auto h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-pizza-dark font-bold text-xl">Personal y Sucursales</h2>
          <p className="text-pizza-muted text-sm">{branches.length} sucursales · {staff.length} empleados</p>
        </div>
        <button
          onClick={() => setShowAddBranch(s => !s)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nueva Sucursal
        </button>
      </div>

      {/* Add branch form */}
      {showAddBranch && (
        <div className="card p-5 border border-pizza-red/30 bg-pizza-gray-2 animate-fade-in">
          <h3 className="text-pizza-dark font-semibold mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-pizza-red" /> Nueva Sucursal
          </h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Nombre de la sucursal"
                value={newBranch.name}
                onChange={e => { setNewBranch(p => ({ ...p, name: e.target.value })); setBranchError(''); }}
                className={`input-field ${branchError ? 'border-pizza-red' : ''}`}
                autoFocus
              />
              {branchError && <p className="text-pizza-red text-xs mt-1">{branchError}</p>}
            </div>
            <input
              type="text"
              placeholder="Dirección (opcional)"
              value={newBranch.address}
              onChange={e => setNewBranch(p => ({ ...p, address: e.target.value }))}
              className="input-field flex-1"
            />
            <button onClick={handleAddBranch} className="btn-primary px-5">Crear</button>
            <button onClick={() => setShowAddBranch(false)} className="btn-secondary px-4">✕</button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {ROLES.map(r => (
          <div key={r} className={`badge border ${ROLE_CONFIG[r].color} px-3 py-1`}>
            {ROLE_CONFIG[r].label}
          </div>
        ))}
      </div>

      {/* Branches */}
      <div className="flex flex-col gap-4">
        {branches.map(branch => (
          <BranchCard key={branch.id} branch={branch} />
        ))}
        {branches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-pizza-muted gap-2">
            <Building2 className="w-12 h-12 opacity-20" />
            <p>No hay sucursales registradas</p>
          </div>
        )}
      </div>
    </div>
  );
}
