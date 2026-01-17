/**
 * Cart Context - Global state management for shopping cart
 * Handles: cart items, totals, promo codes, persistence
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext(null);

// Initial state
const initialState = {
  items: [],
  promoCode: null,
  promoDiscount: 0,
  orderType: 'delivery', // delivery, pickup, dine_in
  deliveryAddress: null,
  specialInstructions: '',
  tip: 0
};

// Cart actions
const ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  UPDATE_ITEM: 'UPDATE_ITEM',
  CLEAR_CART: 'CLEAR_CART',
  SET_PROMO: 'SET_PROMO',
  CLEAR_PROMO: 'CLEAR_PROMO',
  SET_ORDER_TYPE: 'SET_ORDER_TYPE',
  SET_DELIVERY_ADDRESS: 'SET_DELIVERY_ADDRESS',
  SET_SPECIAL_INSTRUCTIONS: 'SET_SPECIAL_INSTRUCTIONS',
  SET_TIP: 'SET_TIP',
  LOAD_CART: 'LOAD_CART'
};

// Generate unique cart item ID
function generateCartItemId(item) {
  const toppingsKey = (item.toppings || [])
    .map(t => `${t.id}-${t.modifier_type}`)
    .sort()
    .join('|');
  return `${item.item_id}-${item.variant_id || 'default'}-${toppingsKey}`;
}

// Reducer
function cartReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_ITEM: {
      const cartItemId = generateCartItemId(action.payload);
      const existingIndex = state.items.findIndex(i => i.cartItemId === cartItemId);

      if (existingIndex >= 0) {
        // Increase quantity of existing item
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + (action.payload.quantity || 1)
        };
        return { ...state, items: newItems };
      }

      // Add new item
      return {
        ...state,
        items: [...state.items, {
          ...action.payload,
          cartItemId,
          quantity: action.payload.quantity || 1
        }]
      };
    }

    case ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        items: state.items.filter(i => i.cartItemId !== action.payload)
      };

    case ACTIONS.UPDATE_QUANTITY: {
      const { cartItemId, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(i => i.cartItemId !== cartItemId)
        };
      }
      return {
        ...state,
        items: state.items.map(i =>
          i.cartItemId === cartItemId ? { ...i, quantity } : i
        )
      };
    }

    case ACTIONS.UPDATE_ITEM: {
      const { cartItemId, updates } = action.payload;
      const newCartItemId = generateCartItemId({ ...state.items.find(i => i.cartItemId === cartItemId), ...updates });

      return {
        ...state,
        items: state.items.map(i =>
          i.cartItemId === cartItemId ? { ...i, ...updates, cartItemId: newCartItemId } : i
        )
      };
    }

    case ACTIONS.CLEAR_CART:
      return { ...initialState, orderType: state.orderType };

    case ACTIONS.SET_PROMO:
      return {
        ...state,
        promoCode: action.payload.code,
        promoDiscount: action.payload.discount
      };

    case ACTIONS.CLEAR_PROMO:
      return { ...state, promoCode: null, promoDiscount: 0 };

    case ACTIONS.SET_ORDER_TYPE:
      return { ...state, orderType: action.payload };

    case ACTIONS.SET_DELIVERY_ADDRESS:
      return { ...state, deliveryAddress: action.payload };

    case ACTIONS.SET_SPECIAL_INSTRUCTIONS:
      return { ...state, specialInstructions: action.payload };

    case ACTIONS.SET_TIP:
      return { ...state, tip: action.payload };

    case ACTIONS.LOAD_CART:
      return { ...initialState, ...action.payload };

    default:
      return state;
  }
}

// Provider component
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pizza_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({ type: ACTIONS.LOAD_CART, payload: parsed });
      }
    } catch (e) {
      console.error('Failed to load cart:', e);
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('pizza_cart', JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save cart:', e);
    }
  }, [state]);

  // Calculate totals
  const subtotal = state.items.reduce((sum, item) => {
    const itemTotal = item.unit_price * item.quantity;
    return sum + itemTotal;
  }, 0);

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  // These would come from store settings API
  const taxRate = 0.08;
  const deliveryFee = state.orderType === 'delivery' ? 4.99 : 0;

  const taxableAmount = subtotal - state.promoDiscount;
  const tax = taxableAmount * taxRate;
  const total = taxableAmount + tax + deliveryFee + state.tip;

  // Actions
  const addItem = (item) => dispatch({ type: ACTIONS.ADD_ITEM, payload: item });
  const removeItem = (cartItemId) => dispatch({ type: ACTIONS.REMOVE_ITEM, payload: cartItemId });
  const updateQuantity = (cartItemId, quantity) => dispatch({ type: ACTIONS.UPDATE_QUANTITY, payload: { cartItemId, quantity } });
  const updateItem = (cartItemId, updates) => dispatch({ type: ACTIONS.UPDATE_ITEM, payload: { cartItemId, updates } });
  const clearCart = () => dispatch({ type: ACTIONS.CLEAR_CART });
  const setPromo = (code, discount) => dispatch({ type: ACTIONS.SET_PROMO, payload: { code, discount } });
  const clearPromo = () => dispatch({ type: ACTIONS.CLEAR_PROMO });
  const setOrderType = (type) => dispatch({ type: ACTIONS.SET_ORDER_TYPE, payload: type });
  const setDeliveryAddress = (address) => dispatch({ type: ACTIONS.SET_DELIVERY_ADDRESS, payload: address });
  const setSpecialInstructions = (instructions) => dispatch({ type: ACTIONS.SET_SPECIAL_INSTRUCTIONS, payload: instructions });
  const setTip = (amount) => dispatch({ type: ACTIONS.SET_TIP, payload: amount });

  const value = {
    // State
    items: state.items,
    promoCode: state.promoCode,
    promoDiscount: state.promoDiscount,
    orderType: state.orderType,
    deliveryAddress: state.deliveryAddress,
    specialInstructions: state.specialInstructions,
    tip: state.tip,

    // Computed
    subtotal,
    tax,
    deliveryFee,
    total,
    itemCount,
    isEmpty: state.items.length === 0,

    // Actions
    addItem,
    removeItem,
    updateQuantity,
    updateItem,
    clearCart,
    setPromo,
    clearPromo,
    setOrderType,
    setDeliveryAddress,
    setSpecialInstructions,
    setTip
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// Hook
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

export default CartContext;
