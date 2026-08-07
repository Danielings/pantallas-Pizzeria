import { useState } from "react";
import MenuGrid from "../components/cajero/MenuGrid";
import OrderTicket from "../components/cajero/OrderTicket";
import CategoryFilter from "../components/cajero/CategoryFilter";
import CheckoutModal from "../components/cajero/CheckoutModal";
import ExchangeRateWidget from "../components/cajero/ExchangeRateWidget";

export default function NuevaOrdenScreen() {
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Normal");

  return (
    <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden w-full h-full relative">
      {/* Cabecera y Filtros */}
      <header className="flex flex-wrap lg:flex-nowrap gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 shrink-0">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              Punto de Venta
            </h1>
            <p className="text-sm text-slate-500 capitalize">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <ExchangeRateWidget />
        </div>
        <CategoryFilter
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </header>

      {/* Cuerpo: Grilla de Productos (ahora ocupa todo el ancho) */}
      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden pb-14">
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden min-w-0">
          <MenuGrid category={selectedCategory} />
        </div>
      </div>

      {/* Overlay al abrir el bottom sheet */}
      <div
        className={`absolute inset-0 bg-black/20 z-20 transition-opacity duration-300 ${
          isTicketOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsTicketOpen(false)}
      />

      {/* Bottom Sheet del Ticket */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 flex flex-col w-[520px] max-w-[calc(100%-2rem)]">
        {/* Encabezado siempre visible */}
        <div
          onClick={() => setIsTicketOpen(!isTicketOpen)}
          className="flex items-center justify-between px-5 py-3 bg-[#EA2A33] shadow-[0_-4px_16px_rgba(234,42,51,0.3)] cursor-pointer select-none shrink-0 rounded-t-xl"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Receipt className="w-5 h-5 text-white shrink-0" />
            <h2 className="text-white font-bold text-sm shrink-0">
              Ticket
            </h2>
            {items.length > 0 && (
              <span className="bg-white text-[#EA2A33] text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                {items.length}
              </span>
            )}
            {/* Badge del tipo de pedido */}
            {typeConfig && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/30 bg-white/20 text-white shrink-0 ml-1"
              >
                <TypeIcon className="w-3 h-3" />
                {typeConfig.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {items.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearCart();
                }}
                className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                title="Limpiar ticket"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <ChevronUp
              className={`w-5 h-5 text-white transition-transform duration-300 ${
                isTicketOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {/* Panel desplegable */}
        <div
          className={`bg-white rounded-b-xl border-x border-b border-slate-100 overflow-hidden transition-all duration-300 ease-in-out flex flex-col ${
            isTicketOpen ? "max-h-[60vh]" : "max-h-0 border-b-0"
          }`}
        >
          <div className="flex flex-col flex-1 min-h-0 max-h-[60vh] overflow-hidden bg-slate-50">
            <OrderTicket onCheckout={() => setShowCheckout(true)} />
          </div>
        </div>
      </div>

      {showCheckout && <CheckoutModal onClose={() => setShowCheckout(false)} />}
    </div>
  );
}
