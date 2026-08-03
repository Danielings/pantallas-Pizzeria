import { AlertTriangle, X, Trash2, ShieldCheck } from "lucide-react";

export default function DeleteClienteModal({
  cliente,
  isDeleting,
  error,
  onConfirm,
  onCancel,
}) {
  if (!cliente) return null;

  const hasSales = Number(cliente.orders) > 0;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-fade-in">
        <div className="bg-gradient-to-br from-red-600 to-red-700 p-6 text-white relative">
          <button
            onClick={onCancel}
            className="absolute right-4 top-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-300 hover:rotate-90"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold">Eliminar Cliente</h2>
          <p className="text-red-100 text-sm mt-1">
            Esta acción no se puede deshacer
          </p>
        </div>

        <div className="p-6">
          {hasSales ? (
            <div className="bg-amber-50 border border-amber-100 text-amber-700 text-sm font-semibold rounded-xl px-4 py-3.5 flex items-start gap-2">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
              <span>
                Este cliente tiene{" "}
                <span className="font-black">{cliente.orders}</span> venta(s)
                asociadas. Por seguridad no puede eliminarse para conservar su
                historial.
              </span>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                ¿Estás seguro de que deseas eliminar al cliente{" "}
                <span className="font-bold text-slate-800">{cliente.name}</span>?
              </p>

              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
                <span>Cédula: {cliente.cedula}</span>
              </div>
            </>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-100 text-red-600 text-sm font-semibold rounded-xl px-4 py-3 flex items-center gap-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] w-1/3 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting || hasSales}
              className={`flex-1 py-3 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 ${
                hasSales
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 hover:shadow-lg text-white active:scale-[0.98]"
              }`}
            >
              {isDeleting ? (
                <span className="animate-pulse">Eliminando...</span>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" /> Eliminar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
