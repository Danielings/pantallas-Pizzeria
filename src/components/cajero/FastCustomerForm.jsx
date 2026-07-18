import { useState } from 'react';
import { UserPlus, Search } from 'lucide-react';

export default function FastCustomerForm() {
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    if (!cedula || !nombre) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 bg-white border-b border-slate-100 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <UserPlus className="w-4 h-4 text-pizza-red" />
          Registro Express
        </h2>
        {saved && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">¡Guardado!</span>}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Cédula" 
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all"
            required
          />
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Nombre Completo" 
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all"
            required
          />
          <button 
            type="submit"
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 rounded-lg text-xs font-bold transition-colors"
          >
            Fijar
          </button>
        </div>
      </form>
    </div>
  );
}
