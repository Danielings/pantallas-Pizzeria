import { useState, useRef, useEffect } from "react";
import axios from "axios"; // <-- Importación de axios agregada
import { useApp } from "../../context/AppContext";
import {
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  Store,
  CheckCircle2,
  CreditCard,
  Clock,
  X,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Search,
  UserPlus,
  Phone,
  User,
  IdCard,
} from "lucide-react";

// ─── Configuración estática ───────────────────────────────────────────────────
const ORDER_TYPES = [
  {
    id: "local",
    label: "Local",
    sublabel: "Mesa / Salón",
    icon: UtensilsCrossed,
    colorLight: "bg-blue-50 border-blue-200",
    colorSelected: "bg-blue-500 border-blue-500",
    colorIcon: "text-blue-500",
  },
  {
    id: "takeaway",
    label: "Para Llevar",
    sublabel: "Retira en el local",
    icon: ShoppingBag,
    colorLight: "bg-amber-50 border-amber-200",
    colorSelected: "bg-amber-500 border-amber-500",
    colorIcon: "text-amber-500",
  },
  {
    id: "delivery",
    label: "Delivery",
    sublabel: "Envío a domicilio",
    icon: Bike,
    colorLight: "bg-red-50 border-red-200",
    colorSelected: "bg-red-500 border-red-500",
    colorIcon: "text-pizza-red",
  },
  {
    id: "pickup",
    label: "Pickup",
    sublabel: "Cliente pasa a buscar",
    icon: Store,
    colorLight: "bg-emerald-50 border-emerald-200",
    colorSelected: "bg-emerald-500 border-emerald-500",
    colorIcon: "text-emerald-500",
  },
];

const PAYMENT_STATUS_OPTIONS = [
  {
    id: "paid",
    label: "Ya pagaron completo",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-300",
    selectedBg: "bg-emerald-500 border-emerald-500",
  },
  {
    id: "partial",
    label: "Hicieron un abono",
    icon: CreditCard,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-300",
    selectedBg: "bg-blue-500 border-blue-500",
  },
  {
    id: "pending",
    label: "Pago totalmente pendiente",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-300",
    selectedBg: "bg-amber-500 border-amber-500",
  },
];

// ─── Componente principal ─────────────────────────────────────────────────────
export default function OrderTypeModal({ onConfirm, onClose }) {
  const { setOrderType, addCustomer, exchangeRate } = useApp();

  // ── Pasos: 1 = Tipo y Estado Pago, 2 = Cliente ──
  const [step, setStep] = useState(1);

  // Paso 1 - Tipo de pedido y Estado de Pago
  const [selectedType, setSelectedType] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [advanceCurrency, setAdvanceCurrency] = useState("USD");
  const [advanceAmount, setAdvanceAmount] = useState("");

  // Estados para el flujo de búsqueda de Delivery
  const [foundDelivery, setFoundDelivery] = useState(null);
  const [deliveryNotFound, setDeliveryNotFound] = useState(false);
  const [newDeliveryName, setNewDeliveryName] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");

  const needsPaymentInfo =
    selectedType === "delivery" || selectedType === "pickup";
  const advanceRaw = parseFloat(advanceAmount) || 0;
  const advanceUSD =
    advanceCurrency === "Bs" && exchangeRate > 0
      ? advanceRaw / exchangeRate
      : advanceRaw;

  // Paso 2 - Cliente
  const [searchQuery, setSearchQuery] = useState("");
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const searchRef = useRef(null);

  // Focus en la búsqueda al ir al paso 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, [step]);

  // Resetear campos dependientes cuando cambia el tipo en Paso 1
  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
    setPaymentStatus(null);
    setAdvanceAmount("");
    setFoundDelivery(null);
    setDeliveryNotFound(false);
    setNewDeliveryName("");
    setDeliveryPhone("");
  };

  // ── Buscar Delivery (Refactorizado a Axios) ──
  const handleDeliverySearch = async () => {
    const q = deliveryPhone.trim();
    if (!q) return;

    try {
      const { data } = await axios.get(
        `http://localhost:3001/api/buscar-delivery?q=${q}`,
      );

      if (data.success && data.delivery) {
        setFoundDelivery(data.delivery);
        setDeliveryNotFound(false);
      } else {
        setFoundDelivery(null);
        setDeliveryNotFound(true);
      }
    } catch (error) {
      console.error("Error buscando delivery:", error);
    }
  };

  // ── Buscar Cliente (Refactorizado a Axios) ──
  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    try {
      const { data } = await axios.get(
        `http://localhost:3001/api/buscar-clientes?q=${q}`,
      );

      if (data.success && data.cliente) {
        setFoundCustomer(data.cliente);
        setNotFound(false);
        setNewName("");
        setNewPhone("");
      } else {
        setFoundCustomer(null);
        setNotFound(true);
        setNewName("");
        setNewPhone("");
      }
    } catch (error) {
      console.error("Error en la búsqueda del cliente:", error);
    }
  };

  // ── Confirmar y Guardar ──
  const handleConfirm = async () => {
    // 1. Determinar y registrar el Delivery si es nuevo
    let finalDelivery = foundDelivery
      ? foundDelivery
      : deliveryNotFound && newDeliveryName
        ? { name: newDeliveryName.trim(), phone: deliveryPhone.trim() }
        : null;

    if (!foundDelivery && deliveryNotFound && finalDelivery?.name) {
      try {
        const { data: dataDelivery } = await axios.post(
          "http://localhost:3001/api/registrar-delivery",
          {
            name: finalDelivery.name,
            phone: finalDelivery.phone,
          },
        );

        if (dataDelivery.success) {
          finalDelivery = dataDelivery.delivery;
        }
      } catch (error) {
        console.error("Error registrando al nuevo delivery:", error);
        return; // Detenemos si falla el registro
      }
    }

    // 2. Lógica para registrar Cliente si es nuevo
    let finalCustomer = selectedCustomer;

    if (selectedCustomer?.isNew) {
      try {
        const { data } = await axios.post(
          "http://localhost:3001/api/registrar-clientes",
          {
            cedula: selectedCustomer.cedula,
            name: selectedCustomer.name,
            phone: selectedCustomer.phone,
          },
        );

        if (data.success) {
          finalCustomer = data.cliente;
          addCustomer({
            ...data.cliente,
            lastVisit: new Date().toISOString().split("T")[0],
          });
        }
      } catch (error) {
        console.error("Error registrando al nuevo cliente:", error);
        return; // Detenemos si falla el registro
      }
    }

    // 3. Setear el tipo de pedido en el estado global
    setOrderType(
      selectedType,
      needsPaymentInfo ? paymentStatus : null,
      paymentStatus === "partial" ? advanceUSD : 0,
      finalCustomer
        ? {
            id: finalCustomer.id, // Verifica que tu JSON de respuesta devuelva "id" y no "id_cliente"
            name: finalCustomer.name,
            cedula: finalCustomer.cedula,
            phone: finalCustomer.phone,
          }
        : null,
      "",
      finalDelivery
        ? {
            id: finalDelivery.id ?? finalDelivery.id_delivery,
          }
        : null,
    );
    onConfirm?.();
  };

  const clearSearch = () => {
    setSearchQuery("");
    setFoundCustomer(null);
    setNotFound(false);
    setNewName("");
    setNewPhone("");
  };

  const selectedCustomer = foundCustomer
    ? foundCustomer
    : notFound && newName
      ? {
          name: newName,
          cedula: searchQuery.trim(),
          phone: newPhone,
          isNew: true,
        }
      : null;

  // ── Validaciones ──
  let step1Valid = false;
  if (selectedType !== null) {
    if (needsPaymentInfo) {
      const isPaymentStatusSelected = paymentStatus !== null;
      const isAbonoValid =
        paymentStatus !== "partial" || parseFloat(advanceAmount) > 0;

      const isDeliveryValid =
        selectedType !== "delivery" ||
        Boolean(foundDelivery) ||
        (deliveryNotFound && String(newDeliveryName || "").trim() !== "");

      step1Valid = isPaymentStatusSelected && isAbonoValid && isDeliveryValid;
    } else {
      step1Valid = true;
    }
  }

  const step2Valid = selectedCustomer !== null;

  const goNext = () => {
    if (step === 1 && step1Valid) {
      setStep(2);
    }
  };

  const goBack = () => {
    setStep(1);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center p-4 py-8">
        <div
          className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-4 sm:px-6 sm:py-5 rounded-t-2xl sm:rounded-t-3xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white font-extrabold text-xl tracking-tight">
                  {step === 1 ? "¿Cómo es este pedido?" : "Datos del cliente"}
                </h2>
                <p className="text-slate-300 text-sm mt-0.5">
                  {step === 1
                    ? "Selecciona tipo de pedido y estado de pago"
                    : "Asocia o registra al cliente"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progreso de Pasos */}
            <div className="flex gap-2">
              {["Tipo de Pedido", "Cliente"].map((label, i) => (
                <div key={i} className="flex items-center gap-1.5 flex-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i + 1 < step
                        ? "bg-emerald-400 text-white"
                        : i + 1 === step
                          ? "bg-white text-slate-800"
                          : "bg-white/20 text-white/60"
                    }`}
                  >
                    {i + 1 < step ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold ${i + 1 === step ? "text-white" : "text-white/50"}`}
                  >
                    {label}
                  </span>
                  {i === 0 && (
                    <div
                      className={`flex-1 h-0.5 rounded-full ${step > 1 ? "bg-emerald-400" : "bg-white/20"}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cuerpo */}
          <div className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">
            {/* ══ PASO 1: Tipo de pedido y Estado de pago ══ */}
            {step === 1 && (
              <div className="flex flex-col gap-5 animate-fade-in">
                {/* Opciones de tipo de pedido */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {ORDER_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => handleTypeSelect(type.id)}
                        className={`relative flex flex-col items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 active:scale-[0.97] cursor-pointer ${
                          isSelected
                            ? `${type.colorSelected} shadow-lg`
                            : `${type.colorLight} hover:shadow-md`
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2.5 right-2.5">
                            <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />
                          </span>
                        )}
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm ${isSelected ? "bg-white/20" : "bg-white"}`}
                        >
                          <Icon
                            className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${isSelected ? "text-white" : type.colorIcon}`}
                          />
                        </div>
                        <div className="text-center">
                          <p
                            className={`font-extrabold text-base ${isSelected ? "text-white" : "text-slate-800"}`}
                          >
                            {type.label}
                          </p>
                          <p
                            className={`text-xs mt-0.5 ${isSelected ? "text-white/80" : "text-slate-500"}`}
                          >
                            {type.sublabel}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Datos del Delivery (Buscador y Nombre) */}
                {selectedType === "delivery" && (
                  <div className="flex flex-col gap-4 animate-fade-in">
                    {/* Buscador */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Teléfono del delivery..."
                          value={deliveryPhone}
                          onChange={(e) => {
                            setDeliveryPhone(e.target.value);
                            setFoundDelivery(null);
                            setDeliveryNotFound(false);
                          }}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleDeliverySearch()
                          }
                          className="w-full pl-9 pr-3 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pizza-red focus:ring-2 focus:ring-pizza-red/20 transition-all"
                        />
                      </div>
                      <button
                        onClick={handleDeliverySearch}
                        className="px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-sm flex items-center gap-1.5 transition-colors"
                      >
                        <Search className="w-4 h-4" />
                        Buscar
                      </button>
                    </div>

                    {/* Tarjeta Verde: Delivery Encontrado */}
                    {foundDelivery && (
                      <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                          <Bike className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 truncate">
                            {foundDelivery.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {foundDelivery.phone}
                          </p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <button
                          onClick={() => {
                            setFoundDelivery(null);
                            setDeliveryPhone("");
                          }}
                          className="text-slate-400 hover:text-slate-600 ml-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Formulario: Delivery No Encontrado */}
                    {deliveryNotFound && !foundDelivery && (
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex flex-col gap-3 animate-fade-in">
                        <div className="flex items-center gap-2 text-blue-700">
                          <UserPlus className="w-4 h-4" />
                          <span className="text-sm font-bold">
                            Delivery no registrado — completa los datos
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder="Nombre del delivery *"
                          value={newDeliveryName}
                          onChange={(e) => setNewDeliveryName(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-blue-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Estado del pago si es Delivery o Pickup */}
                {needsPaymentInfo && (
                  <div className="border-2 border-slate-200 rounded-2xl overflow-hidden animate-fade-in">
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-pizza-red" />
                      <span className="text-sm font-bold text-slate-700">
                        Estado del pago *
                      </span>
                    </div>

                    <div className="p-4 flex flex-col gap-3">
                      {PAYMENT_STATUS_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = paymentStatus === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              setPaymentStatus(opt.id);
                              if (opt.id !== "partial") setAdvanceAmount("");
                            }}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                              isSelected
                                ? `${opt.selectedBg} shadow-md`
                                : `${opt.bg} hover:opacity-90`
                            }`}
                          >
                            <Icon
                              className={`w-5 h-5 shrink-0 ${isSelected ? "text-white" : opt.color}`}
                            />
                            <span
                              className={`font-semibold text-sm flex-1 text-left ${isSelected ? "text-white" : "text-slate-700"}`}
                            >
                              {opt.label}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                            )}
                          </button>
                        );
                      })}

                      {/* Campo de abono con selector de moneda */}
                      {paymentStatus === "partial" && (
                        <div className="mt-1 p-4 bg-blue-50 rounded-xl border border-blue-200 flex flex-col gap-3 animate-fade-in">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                              Monto abonado
                            </label>
                            <div className="flex gap-1 bg-white rounded-lg p-0.5 border border-blue-200">
                              {["USD", "Bs"].map((cur) => (
                                <button
                                  key={cur}
                                  type="button"
                                  onClick={() => {
                                    setAdvanceCurrency(cur);
                                    setAdvanceAmount("");
                                  }}
                                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                                    advanceCurrency === cur
                                      ? "bg-blue-500 text-white shadow-sm"
                                      : "text-blue-600 hover:bg-blue-100"
                                  }`}
                                >
                                  {cur}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 font-bold text-sm">
                              {advanceCurrency === "Bs" ? "Bs." : "$"}
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={advanceAmount}
                              onChange={(e) => setAdvanceAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full pl-10 pr-3 py-3 bg-white border border-blue-300 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                              autoFocus
                            />
                          </div>

                          {advanceRaw > 0 && exchangeRate > 0 && (
                            <p className="text-xs font-semibold text-blue-600">
                              {advanceCurrency === "Bs"
                                ? `≈ $${advanceUSD.toFixed(2)}`
                                : `≈ Bs. ${(advanceRaw * exchangeRate).toFixed(2)}`}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ PASO 2: Cliente ══ */}
            {step === 2 && (
              <div className="flex flex-col gap-4 animate-fade-in">
                {/* Buscador */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <IdCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      ref={searchRef}
                      type="text"
                      placeholder="Cédula o nombre del cliente..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setFoundCustomer(null);
                        setNotFound(false);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="w-full pl-9 pr-3 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pizza-red focus:ring-2 focus:ring-pizza-red/20 transition-all"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-sm flex items-center gap-1.5 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Buscar
                  </button>
                </div>

                {/* Cliente Encontrado */}
                {foundCustomer && (
                  <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        {foundCustomer.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {foundCustomer.cedula} · {foundCustomer.orders} pedidos
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <button
                      onClick={clearSearch}
                      className="text-slate-400 hover:text-slate-600 ml-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Cliente No Encontrado → Formulario de Registro rápido */}
                {notFound && !foundCustomer && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex flex-col gap-3 animate-fade-in">
                    <div className="flex items-center gap-2 text-blue-700">
                      <UserPlus className="w-4 h-4" />
                      <span className="text-sm font-bold">
                        Cliente nuevo — completa los datos
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="relative">
                        <User className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Nombre completo *"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-white border border-blue-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          autoFocus
                        />
                      </div>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          placeholder="Teléfono (opcional)"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-white border border-blue-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Opción rápida: seguir sin cliente */}
                {!foundCustomer && !notFound && (
                  <button
                    onClick={() => {
                      setFoundCustomer({
                        id: null,
                        name: "Consumidor Final",
                        cedula: "V-00000000",
                      });
                      setNotFound(false);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 underline text-center transition-colors mt-2"
                  >
                    Asociar como Consumidor Final
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer de Navegación */}
          <div className="px-4 pb-4 sm:px-6 sm:pb-6 pt-2 flex gap-2 sm:gap-3">
            {step === 2 && (
              <button
                onClick={goBack}
                className="px-5 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Atrás
              </button>
            )}

            <button
              onClick={step === 1 ? goNext : handleConfirm}
              disabled={step === 1 ? !step1Valid : !step2Valid}
              className={`flex-1 py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 ${
                (step === 1 ? step1Valid : step2Valid)
                  ? "bg-slate-800 hover:bg-slate-900 text-white shadow-md hover:shadow-lg active:scale-[0.98]"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {step === 1 ? "Siguiente" : "Confirmar y Continuar"}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
