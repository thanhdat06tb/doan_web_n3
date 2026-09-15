import React from 'react';
import { useCart } from '../../hooks/useCart';
import { formatCurrency, calculateRentalDays } from '../../utils/formatters';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, ShoppingBag } from 'lucide-react';

const CartDrawer = ({ isOpen, onClose }) => {
  const { cartItems, totals, removeFromCart } = useCart();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Giỏ hàng ({totals.totalItems})
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
              <ShoppingBag className="w-16 h-16 text-gray-300" />
              <p>Giỏ hàng của bạn đang trống</p>
              <button 
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {cartItems.map((item, idx) => {
                const days = item.type === 'RENT' ? calculateRentalDays(item.startDate, item.endDate) : 0;
                const rentCost = item.type === 'RENT' ? item.price * days * item.quantity : 0;
                const buyCost = item.type === 'BUY' ? item.price * item.quantity : 0;
                const deposit = item.type === 'RENT' ? (item.deposit || 0) * item.quantity : 0;

                return (
                  <div key={`${item.productId}-${item.type}-${idx}`} className="flex gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-20 h-20 bg-white rounded-md border border-gray-200 flex-shrink-0 flex items-center justify-center">
                      <img src="/placeholder.png" alt={item.name} className="w-full h-full object-cover p-1" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 line-clamp-1">{item.name}</h4>
                      
                      {item.type === 'RENT' ? (
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-sm mr-2">Thuê</span>
                          {format(item.startDate, 'dd/MM')} - {format(item.endDate, 'dd/MM')} ({days} ngày)
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-sm mr-2">Mua</span>
                        </div>
                      )}

                      <div className="mt-2 flex justify-between items-end">
                        <div>
                          <p className="text-sm">SL: {item.quantity}</p>
                          <p className="font-medium text-blue-700 mt-1">
                            {formatCurrency(item.type === 'RENT' ? rentCost : buyCost)}
                          </p>
                          {item.type === 'RENT' && (
                            <p className="text-xs text-orange-600">Cọc: {formatCurrency(deposit)}</p>
                          )}
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.productId, item.type)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex flex-col gap-2 text-sm text-gray-700 mb-4">
              <div className="flex justify-between">
                <span>Tổng tiền hàng:</span>
                <span className="font-medium">{formatCurrency(totals.totalGoods)}</span>
              </div>
              <div className="flex justify-between text-orange-600">
                <span>Tổng tiền cọc:</span>
                <span className="font-medium">{formatCurrency(totals.totalDeposit)}</span>
              </div>
              <hr className="border-gray-300 my-1" />
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Tổng thanh toán:</span>
                <span>{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>
            
            <button 
              onClick={handleCheckout}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tiến hành đặt hàng →
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
