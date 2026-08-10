import { useEffect, useState } from "react";
import axios from "axios";
import { LockKeyhole, RefreshCw, UnlockKeyhole } from "lucide-react";
import { useApp } from "../../context/AppContext";

const API_BASE = "http://localhost:3001/api";

export default function TasaScreen() {
  const { updateExchangeRate } = useApp();
  const [rate, setRate] = useState(null);
  const [manualRate, setManualRate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const loadRate = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/tasa`);
      if (!data.success) throw new Error(data.message);
      setRate(data.data);
      setManualRate(String(data.data.tasa_sistema));
      updateExchangeRate(data.data.tasa_sistema);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "No se pudo cargar la tasa.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRate();
  }, []);

  const handleAnchor = async (event) => {
    event.preventDefault();
    const value = Number(manualRate);
    if (!Number.isFinite(value) || value <= 0) {
      setMessage({ type: "error", text: "Ingresa una tasa mayor que cero." });
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const { data } = await axios.put(`${API_BASE}/tasa/anclar`, {
        tasa_manual: value,
      });
      setRate(data.data);
      updateExchangeRate(data.data.tasa_sistema);
      setMessage({
        type: "success",
        text: "Tasa fijada y anclada correctamente.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "No se pudo anclar la tasa.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUnanchor = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const { data } = await axios.put(`${API_BASE}/tasa/desanclar`);
      setRate(data.data);
      setManualRate(String(data.data.tasa_sistema));
      updateExchangeRate(data.data.tasa_sistema);
      setMessage({
        type: "success",
        text: "Anclaje retirado. Se usa el precio del día.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "No se pudo quitar el anclaje.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">
              Tasa del dólar
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Controla el valor operativo utilizado por caja.
            </p>
          </div>
          <button
            type="button"
            onClick={loadRate}
            disabled={loading || saving}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>

        {message.text && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm font-semibold ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}
          >
            {message.text}
          </div>
        )}

        {loading && !rate ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Cargando configuración...
          </div>
        ) : rate ? (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">
                  Tasa del sistema
                </p>
                <p className="mt-3 text-3xl font-extrabold text-slate-800">
                  Bs. {Number(rate.tasa_sistema).toFixed(2)}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Valor usado por caja
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">
                  Tasa del BCV
                </p>
                <p className="mt-3 text-3xl font-extrabold text-slate-800">
                  Bs. {Number(rate.tasa_api).toFixed(2)}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Último valor consultado
                </p>
              </div>
              <div
                className={`rounded-2xl border p-6 shadow-sm ${rate.anclado ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}
              >
                <p className="text-sm font-semibold text-slate-500">Estado</p>
                <div className="mt-3 flex items-center gap-2">
                  {rate.anclado ? (
                    <LockKeyhole className="h-6 w-6 text-amber-600" />
                  ) : (
                    <UnlockKeyhole className="h-6 w-6 text-emerald-600" />
                  )}
                  <span
                    className={`text-xl font-extrabold ${rate.anclado ? "text-amber-700" : "text-emerald-700"}`}
                  >
                    {rate.anclado ? "Anclada (Manual)" : "Automática"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800">
                Control operativo
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Fija una tasa manual o vuelve al precio actualizado de la API.
              </p>
              <form
                onSubmit={handleAnchor}
                className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <label className="flex-1 text-sm font-semibold text-slate-600">
                  Nueva tasa manual
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={manualRate}
                    onChange={(event) => setManualRate(event.target.value)}
                    className="input-field mt-2"
                    placeholder="36.50"
                  />
                </label>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-pizza-red px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-pizza-red-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Fijar y Anclar Tasa
                </button>
                <button
                  type="button"
                  onClick={handleUnanchor}
                  disabled={saving || !rate.anclado}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UnlockKeyhole className="h-4 w-4" />
                  Quitar Anclaje
                </button>
              </form>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
