import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Pizza } from 'lucide-react';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { login } = useApp();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('Por favor, ingresa tu correo electrónico');
      return;
    }

    const result = login(email.trim());
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-pizza-gray-2 w-full p-4">
      <div className="bg-white rounded-2xl shadow-card p-8 w-full max-w-md border border-pizza-gray-3 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-pizza flex items-center justify-center shadow-pizza mb-6">
          <Pizza className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-pizza-dark mb-2">Bienvenido</h1>
        
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-pizza-dark mb-1.5" htmlFor="email">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="text"
              placeholder="ejemplo@pizzeria.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full"
            />
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}
          
          <button type="submit" className="btn-primary w-full py-3 mt-2 text-base">
            Ingresar
          </button>
        </form>
        
        {/* <div className="mt-8 pt-6 border-t border-pizza-gray-3 w-full text-center">
          <p className="text-xs text-pizza-muted mb-2">Cuentas de demostración:</p>
          <div className="flex flex-col gap-1.5 text-xs text-pizza-dark">
            <div className="flex justify-between px-4"><span className="text-pizza-muted">Admin</span> <b>admin@pizzeria.com</b></div>
            <div className="flex justify-between px-4"><span className="text-pizza-muted">Cajero</span> <b>carlos@pizzeria.com</b></div>
            <div className="flex justify-between px-4"><span className="text-pizza-muted">Cocinero</span> <b>maria@pizzeria.com</b></div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
