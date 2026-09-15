import React, { createContext, useReducer, useEffect } from 'react';

export const CartContext = createContext();

const initialState = {
  items: [], // { productId, name, price, quantity, type: 'BUY'|'RENT', startDate, endDate, deposit }
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        item => item.productId === action.payload.productId && item.type === action.payload.type
      );

      if (existingItemIndex > -1) {
        // If renting the exact same dates, we can increase qty. 
        // For simplicity, let's just add a new item or replace if it's the exact same config.
        const newItems = [...state.items];
        newItems[existingItemIndex].quantity += action.payload.quantity;
        return { ...state, items: newItems };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => !(item.productId === action.payload.productId && item.type === action.payload.type))
      };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item => 
          (item.productId === action.payload.productId && item.type === action.payload.type)
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };
    case 'CLEAR_CART':
      return initialState;
    case 'LOAD_CART':
      return { ...state, items: action.payload };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load from local storage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        dispatch({ type: 'LOAD_CART', payload: JSON.parse(savedCart) });
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};
