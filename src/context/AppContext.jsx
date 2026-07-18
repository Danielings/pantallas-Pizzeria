import { createContext, useContext, useReducer, useCallback, useState, useEffect } from 'react';
import { PRODUCTS, BRANCHES, STAFF, MOCK_SALES, INITIAL_ORDERS, EXTRAS } from '../data/mockData';

const AppContext = createContext(null);

const initialState = {
  // Authentication
  currentUser: null,

  // Products (editable via CRUD)
  products: PRODUCTS,
  extras: EXTRAS,

  // Current cashier order (cart)
  currentOrder: {
    items: [],
    payments: [],
  },

  // Kitchen orders
  orders: INITIAL_ORDERS,

  // Historical sales
  sales: MOCK_SALES,

  // Staff & Branches
  branches: BRANCHES,
  staff: STAFF,
};

const TAX_RATE = 0.16;

const calculateItemPrice = (basePrice, size, extras = []) => {
  let multiplier = 1;
  if (size === 'Mediana') multiplier = 1.3;
  if (size === 'Familiar') multiplier = 1.6;
  const extrasCost = extras.reduce((sum, e) => sum + e.price, 0);
  return (basePrice * multiplier) + extrasCost;
};

function reducer(state, action) {
  switch (action.type) {
    // ── CART ──────────────────────────────────────────────────
    case 'ADD_TO_CART': {
      const { product, size } = action.payload;
      const existingIdx = state.currentOrder.items.findIndex(
        i => i.productId === product.id && i.size === (size || null) && (!i.extras || i.extras.length === 0)
      );
      if (existingIdx >= 0) {
        const items = [...state.currentOrder.items];
        items[existingIdx] = { ...items[existingIdx], qty: items[existingIdx].qty + 1 };
        return { ...state, currentOrder: { ...state.currentOrder, items } };
      }
      const newItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,
        productId: product.id,
        name: product.name,
        basePrice: product.price,
        price: calculateItemPrice(product.price, size || null, []),
        size: size || null,
        qty: 1,
        extras: [],
        category: product.category,
        emoji: product.emoji,
      };
      return { ...state, currentOrder: { ...state.currentOrder, items: [...state.currentOrder.items, newItem] } };
    }

    case 'UPDATE_ITEM_QTY': {
      const items = state.currentOrder.items.map(item =>
        item.id === action.payload.id ? { ...item, qty: Math.max(1, action.payload.qty) } : item
      );
      return { ...state, currentOrder: { ...state.currentOrder, items } };
    }

    case 'UPDATE_ITEM_SIZE': {
      const items = state.currentOrder.items.map(item => {
        if (item.id !== action.payload.id) return item;
        return { 
          ...item, 
          size: action.payload.size, 
          price: calculateItemPrice(item.basePrice, action.payload.size, item.extras) 
        };
      });
      return { ...state, currentOrder: { ...state.currentOrder, items } };
    }

    case 'UPDATE_ITEM_EXTRAS': {
      const { id, extras } = action.payload;
      const itemIndex = state.currentOrder.items.findIndex(i => i.id === id);
      if (itemIndex === -1) return state;
      const item = state.currentOrder.items[itemIndex];
      
      if (item.qty > 1 && extras.length > 0) {
        const originalItem = { ...item, qty: item.qty - 1 };
        const newItem = { 
          ...item, 
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2,7)}`, 
          qty: 1, 
          extras, 
          price: calculateItemPrice(item.basePrice, item.size, extras) 
        };
        const newItems = [...state.currentOrder.items];
        newItems.splice(itemIndex, 1, originalItem, newItem);
        return { ...state, currentOrder: { ...state.currentOrder, items: newItems } };
      } else {
        const items = state.currentOrder.items.map(i => {
          if (i.id !== id) return i;
          return { ...i, extras, price: calculateItemPrice(i.basePrice, i.size, extras) };
        });
        return { ...state, currentOrder: { ...state.currentOrder, items } };
      }
    }

    case 'REMOVE_ITEM': {
      const items = state.currentOrder.items.filter(i => i.id !== action.payload.id);
      return { ...state, currentOrder: { ...state.currentOrder, items } };
    }

    case 'CLEAR_CART':
      return { ...state, currentOrder: { items: [], payments: [] } };

    // ── PAYMENT ───────────────────────────────────────────────
    case 'ADD_PAYMENT': {
      const payments = [...state.currentOrder.payments, action.payload];
      return { ...state, currentOrder: { ...state.currentOrder, payments } };
    }

    case 'CONFIRM_SALE': {
      const { total, items, payments } = action.payload;
      const newSale = {
        id: `SALE-${Date.now()}-${Math.random().toString(36).substr(2,6).toUpperCase()}`,
        date: new Date().toISOString(),
        cashier: 'Carlos Rodríguez',
        branch: 'Centro',
        items: items.length,
        total,
        paymentMethod: payments.map(p => p.method).join(' + '),
        status: 'completed',
      };
      const newOrder = {
        id: `ORD-${String(state.orders.length + 1).padStart(3, '0')}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
        items: items.map(i => ({ name: i.name, size: i.size, qty: i.qty, extras: i.extras || [] })),
        total,
        table: 'POS',
      };
      return {
        ...state,
        sales: [newSale, ...state.sales],
        orders: [newOrder, ...state.orders],
        currentOrder: { items: [], payments: [] },
      };
    }

    // ── KITCHEN ───────────────────────────────────────────────
    case 'UPDATE_ORDER_STATUS': {
      const orders = state.orders.map(o =>
        o.id === action.payload.id ? { ...o, status: action.payload.status } : o
      );
      return { ...state, orders };
    }

    case 'ARCHIVE_ORDER': {
      const orders = state.orders.filter(o => o.id !== action.payload.id);
      return { ...state, orders };
    }

    // ── PRODUCTS CRUD ─────────────────────────────────────────
    case 'ADD_PRODUCT': {
      const { category, product } = action.payload;
      return {
        ...state,
        products: {
          ...state.products,
          [category]: [...state.products[category], { ...product, id: `new-${Date.now()}`, available: true }],
        },
      };
    }

    case 'UPDATE_PRODUCT': {
      const { category, product } = action.payload;
      return {
        ...state,
        products: {
          ...state.products,
          [category]: state.products[category].map(p => p.id === product.id ? { ...p, ...product } : p),
        },
      };
    }

    case 'DELETE_PRODUCT': {
      const { category, id } = action.payload;
      return {
        ...state,
        products: {
          ...state.products,
          [category]: state.products[category].filter(p => p.id !== id),
        },
      };
    }

    // ── STAFF & BRANCHES ──────────────────────────────────────
    case 'ADD_BRANCH': {
      return { ...state, branches: [...state.branches, { ...action.payload, id: `b-${Date.now()}` }] };
    }
    case 'DELETE_BRANCH': {
      return {
        ...state,
        branches: state.branches.filter(b => b.id !== action.payload.id),
        staff: state.staff.filter(s => s.branchId !== action.payload.id),
      };
    }
    case 'ADD_STAFF': {
      return { ...state, staff: [...state.staff, { ...action.payload, id: `s-${Date.now()}` }] };
    }
    case 'DELETE_STAFF': {
      return { ...state, staff: state.staff.filter(s => s.id !== action.payload.id) };
    }

    // ── AUTHENTICATION ─────────────────────────────────────────
    case 'LOGIN':
      return { ...state, currentUser: action.payload };
    case 'LOGOUT':
      return { ...state, currentUser: null };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Cart totals
  const subtotal = state.currentOrder.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const amountPaid = state.currentOrder.payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, total - amountPaid);

  const addToCart = useCallback((product, size) => dispatch({ type: 'ADD_TO_CART', payload: { product, size } }), []);
  const updateItemQty = useCallback((id, qty) => dispatch({ type: 'UPDATE_ITEM_QTY', payload: { id, qty } }), []);
  const updateItemSize = useCallback((id, size) => dispatch({ type: 'UPDATE_ITEM_SIZE', payload: { id, size } }), []);
  const updateItemExtras = useCallback((id, extras) => dispatch({ type: 'UPDATE_ITEM_EXTRAS', payload: { id, extras } }), []);
  const removeItem = useCallback((id) => dispatch({ type: 'REMOVE_ITEM', payload: { id } }), []);
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);
  const addPayment = useCallback((payment) => dispatch({ type: 'ADD_PAYMENT', payload: payment }), []);
  const confirmSale = useCallback((payload) => dispatch({ type: 'CONFIRM_SALE', payload }), []);

  const updateOrderStatus = useCallback((id, status) => dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id, status } }), []);
  const archiveOrder = useCallback((id) => dispatch({ type: 'ARCHIVE_ORDER', payload: { id } }), []);

  const addProduct = useCallback((category, product) => dispatch({ type: 'ADD_PRODUCT', payload: { category, product } }), []);
  const updateProduct = useCallback((category, product) => dispatch({ type: 'UPDATE_PRODUCT', payload: { category, product } }), []);
  const deleteProduct = useCallback((category, id) => dispatch({ type: 'DELETE_PRODUCT', payload: { category, id } }), []);

  const addBranch = useCallback((branch) => dispatch({ type: 'ADD_BRANCH', payload: branch }), []);
  const deleteBranch = useCallback((id) => dispatch({ type: 'DELETE_BRANCH', payload: { id } }), []);
  const addStaff = useCallback((member) => dispatch({ type: 'ADD_STAFF', payload: member }), []);
  const deleteStaff = useCallback((id) => dispatch({ type: 'DELETE_STAFF', payload: { id } }), []);

  const [exchangeRate, setExchangeRate] = useState(0);

  // Fetch exchange rate on mount
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch('https://api.now.com.ve/price-rate-bcv');
        const data = await res.json();
        if (data && data.PriceRateBCV) {
          setExchangeRate(data.PriceRateBCV);
        }
      } catch (error) {
        console.error('Error fetching exchange rate', error);
      }
    };
    fetchRate();
  }, []);

  const updateExchangeRate = useCallback((rate) => {
    setExchangeRate(parseFloat(rate));
  }, []);

  const login = useCallback((email) => {
    const user = state.staff.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (user) {
      dispatch({ type: 'LOGIN', payload: user });
      return { success: true, user };
    }
    return { success: false, message: 'Usuario no encontrado' };
  }, [state.staff]);

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, []);

  return (
    <AppContext.Provider value={{
      ...state,
      subtotal, tax, total, amountPaid, remaining, TAX_RATE,
      addToCart, updateItemQty, updateItemSize, updateItemExtras, removeItem, clearCart,
      addPayment, confirmSale,
      updateOrderStatus, archiveOrder,
      addProduct, updateProduct, deleteProduct,
      addBranch, deleteBranch, addStaff, deleteStaff,
      login, logout,
      exchangeRate, updateExchangeRate,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
