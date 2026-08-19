import { createContext, useContext, useReducer, useCallback } from "react";
import { MOCK_SALES } from "../data/mockData";

const AppContext = createContext(null);

export const KITCHEN_CATEGORIES = ["pizzas", "combos"];

const initialState = {
  // Authentication
  currentUser: null,

  // Current cashier order (cart)
  currentOrder: {
    items: [],
    payments: [],
    orderType: null, // 'local' | 'takeaway' | 'delivery' | 'pickup'
    paymentStatus: null, // 'paid' | 'partial' | 'pending'  (only for delivery/pickup)
    advanceAmount: 0, // monto abonado si paymentStatus === 'partial'
    advancePaymentMethod: null, // método usado para el abono
    advanceCurrency: "USD", // moneda original del abono
    pendingSaleId: null,
    pendingOriginalTotal: null,
    pendingRemaining: null,
    customer: null, // { id?, name, cedula, phone? }
    phoneLastDigits: "", // últimos 4 dígitos del teléfono (delivery)
    deliveryId: null,
  },

  // Customers
  customers: [
    {
      id: 1,
      cedula: "V-12345678",
      name: "Juan Pérez",
      phone: "0414-1234567",
      orders: 12,
      total: 284.5,
      lastVisit: "2026-07-17",
    },
    {
      id: 2,
      cedula: "V-23456789",
      name: "María González",
      phone: "0424-9876543",
      orders: 8,
      total: 198.0,
      lastVisit: "2026-07-16",
    },
    {
      id: 3,
      cedula: "V-123",
      name: "Carlos Ramírez",
      phone: "0416-5553210",
      orders: 22,
      total: 512.75,
      lastVisit: "2026-07-18",
    },
  ],

  // Historical sales (se sobreescribirán con datos reales)
  sales: MOCK_SALES,
};

const TAX_RATE = 0.16;

const normalizeRole = (role) => {
  if (!role) return "cashier";

  const roleMap = {
    administrador: "admin",
    admin: "admin",
    cajero: "cashier",
    cashier: "cashier",
    cocinero: "chef",
    chef: "chef",
    pizzero: "chef",
    mesero: "mesero",
    waiter: "waiter",
    despachador: "despachador",
  };

  const normalized = String(role).trim().toLowerCase();
  return roleMap[normalized] || normalized;
};

const calculateItemPrice = (basePrice, size, extras = []) => {
  let multiplier = 1;
  if (size === "Mediana") multiplier = 1.3;
  if (size === "Familiar") multiplier = 1.6;
  const extrasCost = extras.reduce((sum, e) => sum + e.price, 0);
  return basePrice * multiplier + extrasCost;
};

function reducer(state, action) {
  switch (action.type) {
    // ── CART ──────────────────────────────────────────────────
    case "ADD_TO_CART": {
      const { product, size } = action.payload;
      const existingIdx = state.currentOrder.items.findIndex(
        (i) =>
          i.productId === product.id &&
          i.size === (size || null) &&
          (!i.extras || i.extras.length === 0) &&
          (!state.currentOrder.pendingSaleId || !i.isPendingExisting),
      );
      if (existingIdx >= 0) {
        const items = [...state.currentOrder.items];
        items[existingIdx] = {
          ...items[existingIdx],
          qty: items[existingIdx].qty + 1,
        };
        return { ...state, currentOrder: { ...state.currentOrder, items } };
      }
      const newItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        productId: product.id,
        name: product.name,
        basePrice: product.price,
        price: calculateItemPrice(product.price, size || null, []),
        size: size || null,
        qty: 1,
        extras: [],
        category: product.category,
        emoji: product.emoji,
        isPendingExisting: false,
      };
      return {
        ...state,
        currentOrder: {
          ...state.currentOrder,
          items: [...state.currentOrder.items, newItem],
        },
      };
    }

    case "UPDATE_ITEM_QTY": {
      const items = state.currentOrder.items.map((item) =>
        item.id === action.payload.id
          ? { ...item, qty: Math.max(1, action.payload.qty) }
          : item,
      );
      return { ...state, currentOrder: { ...state.currentOrder, items } };
    }

    case "UPDATE_ITEM_SIZE": {
      const items = state.currentOrder.items.map((item) => {
        if (item.id !== action.payload.id) return item;
        return {
          ...item,
          size: action.payload.size,
          price: calculateItemPrice(
            item.basePrice,
            action.payload.size,
            item.extras,
          ),
        };
      });
      return { ...state, currentOrder: { ...state.currentOrder, items } };
    }

    case "UPDATE_ITEM_EXTRAS": {
      const { id, extras } = action.payload;
      const itemIndex = state.currentOrder.items.findIndex((i) => i.id === id);
      if (itemIndex === -1) return state;
      const item = state.currentOrder.items[itemIndex];

      if (item.qty > 1 && extras.length > 0) {
        const originalItem = { ...item, qty: item.qty - 1 };
        const newItem = {
          ...item,
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          qty: 1,
          extras,
          price: calculateItemPrice(item.basePrice, item.size, extras),
        };
        const newItems = [...state.currentOrder.items];
        newItems.splice(itemIndex, 1, originalItem, newItem);
        return {
          ...state,
          currentOrder: { ...state.currentOrder, items: newItems },
        };
      } else {
        const items = state.currentOrder.items.map((i) => {
          if (i.id !== id) return i;
          return {
            ...i,
            extras,
            price: calculateItemPrice(i.basePrice, i.size, extras),
          };
        });
        return { ...state, currentOrder: { ...state.currentOrder, items } };
      }
    }

    case "REMOVE_ITEM": {
      const items = state.currentOrder.items.filter(
        (i) => i.id !== action.payload.id,
      );
      return { ...state, currentOrder: { ...state.currentOrder, items } };
    }

    case "UPDATE_ITEM_NOTE": {
      const { id, note } = action.payload;
      const items = state.currentOrder.items.map((i) =>
        i.id === id ? { ...i, note } : i,
      );
      return { ...state, currentOrder: { ...state.currentOrder, items } };
    }

    case "CLEAR_CART":
      return {
        ...state,
        currentOrder: {
          items: [],
          payments: [],
          orderType: null,
          paymentStatus: null,
          advanceAmount: 0,
          advancePaymentMethod: null,
          advanceCurrency: "USD",
          pendingSaleId: null,
          pendingOriginalTotal: null,
          pendingRemaining: null,
          customer: null,
          phoneLastDigits: "",
          deliveryId: null,
        },
      };

    case "SET_ORDER_TYPE": {
      const {
        orderType,
        paymentStatus,
        advanceAmount,
        advancePaymentMethod,
        advanceCurrency,
        customer,
        phoneLastDigits,
        deliveryId,
      } = action.payload;
      return {
        ...state,
        currentOrder: {
          ...state.currentOrder,
          orderType,
          paymentStatus: paymentStatus || null,
          advanceAmount: advanceAmount || 0,
          advancePaymentMethod: advancePaymentMethod || null,
          advanceCurrency: advanceCurrency || "USD",
          customer: customer || null,
          phoneLastDigits: phoneLastDigits || "",
          deliveryId: deliveryId || null,
        },
      };
    }

    case "LOAD_PENDING_ORDER": {
      return {
        ...state,
        currentOrder: {
          ...state.currentOrder,
          ...action.payload,
          payments: action.payload.payments || [],
        },
      };
    }

    // ── PAYMENT ───────────────────────────────────────────────
    case "ADD_PAYMENT": {
      const payments = [...state.currentOrder.payments, action.payload];
      return { ...state, currentOrder: { ...state.currentOrder, payments } };
    }

    case "CONFIRM_SALE": {
      const { total, items, payments, orderType } = action.payload;
      const newSale = {
        id: `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        date: new Date().toISOString(),
        cashier: "Carlos Rodríguez",
        branch: "Centro",
        items: items.length,
        total,
        paymentMethod: payments.map((p) => p.method).join(" + "),
        orderType: orderType || "unknown",
        status: "completed",
      };
      return {
        ...state,
        sales: [newSale, ...state.sales],
        currentOrder: { items: [], payments: [] },
      };
    }

    case "ADD_CUSTOMER": {
      const customer = { ...action.payload, id: Date.now() };
      return { ...state, customers: [customer, ...state.customers] };
    }

    // ── AUTHENTICATION ─────────────────────────────────────────────────────
    case "LOGIN":
      return { ...state, currentUser: action.payload };
    case "LOGOUT":
      return { ...state, currentUser: null };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const savedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser")) || null;
    } catch {
      return null;
    }
  })();
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    currentUser: savedUser,
  });

  // Cart totals — sin IVA
  const subtotal = state.currentOrder.items.reduce(
    (sum, i) => sum + i.price * i.qty,
    0,
  );
  const tax = 0; // IVA eliminado
  const total = subtotal; // total = subtotal, sin impuestos
  const amountPaid = state.currentOrder.payments.reduce(
    (sum, p) => sum + p.amount,
    0,
  );
  const remaining = Math.max(0, total - amountPaid);

  const addToCart = useCallback(
    (product, size) =>
      dispatch({ type: "ADD_TO_CART", payload: { product, size } }),
    [],
  );
  const updateItemQty = useCallback(
    (id, qty) => dispatch({ type: "UPDATE_ITEM_QTY", payload: { id, qty } }),
    [],
  );
  const updateItemSize = useCallback(
    (id, size) => dispatch({ type: "UPDATE_ITEM_SIZE", payload: { id, size } }),
    [],
  );
  const updateItemExtras = useCallback(
    (id, extras) =>
      dispatch({ type: "UPDATE_ITEM_EXTRAS", payload: { id, extras } }),
    [],
  );
  const updateItemNote = useCallback(
    (id, note) => dispatch({ type: "UPDATE_ITEM_NOTE", payload: { id, note } }),
    [],
  );
  const removeItem = useCallback(
    (id) => dispatch({ type: "REMOVE_ITEM", payload: { id } }),
    [],
  );
  const clearCart = useCallback(() => dispatch({ type: "CLEAR_CART" }), []);
  const setOrderType = useCallback(
    (
      orderType,
      paymentStatus,
      advanceAmount,
      customer,
      phoneLastDigits,
      deliveryId,
      advancePaymentMethod,
      advanceCurrency,
    ) =>
      dispatch({
        type: "SET_ORDER_TYPE",
        payload: {
          orderType,
          paymentStatus,
          advanceAmount,
          customer,
          phoneLastDigits,
          deliveryId,
          advancePaymentMethod,
          advanceCurrency,
        },
      }),
    [],
  );
  const addPayment = useCallback(
    (payment) => dispatch({ type: "ADD_PAYMENT", payload: payment }),
    [],
  );
  const loadPendingOrder = useCallback(
    (order) => dispatch({ type: "LOAD_PENDING_ORDER", payload: order }),
    [],
  );
  const confirmSale = useCallback(
    (payload) => dispatch({ type: "CONFIRM_SALE", payload }),
    [],
  );
  const addCustomer = useCallback(
    (customer) => dispatch({ type: "ADD_CUSTOMER", payload: customer }),
    [],
  );

  const login = useCallback(async (email, password) => {
    try {
      const res = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: String(email || "").trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.user) {
        return {
          success: false,
          message: data?.message || "Credenciales inválidas",
        };
      }

      const normalizedUser = {
        id: data.user.id ?? data.user.id_login ?? data.user.id_usuario,
        email: data.user.email,
        role: normalizeRole(data.user.role ?? data.user.rol),
        name: data.user.nombre || data.user.name || data.user.email,
        sucursal: data.user.sucursal ?? data.user.id_sucursal ?? null,
        estado: data.user.estado,
      };

      dispatch({ type: "LOGIN", payload: normalizedUser });
      localStorage.setItem("currentUser", JSON.stringify(normalizedUser));
      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }

      return { success: true, user: normalizedUser, token: data.token };
    } catch (error) {
      console.error("Error en login desde API:", error);
      return {
        success: false,
        message: "No se pudo conectar con el servidor",
      };
    }
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem("currentUser");
    localStorage.removeItem("authToken");
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        subtotal,
        tax,
        total,
        amountPaid,
        remaining,
        TAX_RATE,
        KITCHEN_CATEGORIES,
        addToCart,
        updateItemQty,
        updateItemSize,
        updateItemExtras,
        updateItemNote,
        removeItem,
        clearCart,
        setOrderType,
        addPayment,
        loadPendingOrder,
        confirmSale,
        addCustomer,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
