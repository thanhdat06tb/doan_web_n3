import { useContext, useMemo } from 'react';
import { CartContext } from '../context/CartContext';
import { calculateRentalDays } from '../utils/formatters';

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  const { state, dispatch } = context;

  const addToCart = (item) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeFromCart = (productId, type) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId, type } });
  };

  const updateQuantity = (productId, type, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, type, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  // Tính toán totals
  const totals = useMemo(() => {
    let totalItems = 0;
    let totalGoods = 0;
    let totalDeposit = 0;

    state.items.forEach(item => {
      totalItems += item.quantity;
      if (item.type === 'BUY') {
        totalGoods += item.price * item.quantity;
      } else if (item.type === 'RENT') {
        const days = calculateRentalDays(item.startDate, item.endDate);
        totalGoods += item.price * item.quantity * days;
        totalDeposit += (item.deposit || 0) * item.quantity;
      }
    });

    return {
      totalItems,
      totalGoods,
      totalDeposit,
      grandTotal: totalGoods + totalDeposit
    };
  }, [state.items]);

  return {
    cartItems: state.items,
    totals,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };
};
