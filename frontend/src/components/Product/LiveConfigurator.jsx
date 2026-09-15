import React, { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useDateBlocker } from '../../hooks/useDateBlocker';
import { useProductAvailability } from '../../hooks/useProductAvailability';
import { formatCurrency, calculateRentalDays } from '../../utils/formatters';
import { useCart } from '../../hooks/useCart';

const LiveConfigurator = ({ product }) => {
  const { addToCart } = useCart();
  const [type, setType] = useState(product.price_rent_per_day > 0 ? 'RENT' : 'BUY');
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [quantity, setQuantity] = useState(1);
  const [isToastVisible, setIsToastVisible] = useState(false);

  // Fetch blocked dates
  const { blockedDates, loading: loadingBlocker } = useDateBlocker(type === 'RENT' ? product.id : null);

  // Check availability when date range is selected
  const { data: availData, loading: loadingAvail, error: availError } = useProductAvailability(
    type === 'RENT' && dateRange.from && dateRange.to ? product.id : null,
    dateRange.from,
    dateRange.to,
    quantity
  );

  // Calculate totals
  const rentalDays = calculateRentalDays(dateRange.from, dateRange.to);
  const rentTotal = (product.price_rent_per_day || 0) * rentalDays * quantity;
  const depositTotal = (product.deposit_amount || 0) * quantity;
  const buyTotal = (product.price_sell || 0) * quantity;

  const grandTotal = type === 'BUY' ? buyTotal : rentTotal + depositTotal;

  // Handle constraints
  const isRentable = product.price_rent_per_day > 0;
  const isBuyable = product.price_sell > 0;
  
  let maxQty = 1;
  if (type === 'BUY') maxQty = product.stock_quantity;
  else if (type === 'RENT' && availData?.availableQty !== undefined) maxQty = availData.availableQty;
  else maxQty = product.stock_quantity;

  const isFormValid = () => {
    if (type === 'BUY') return true;
    if (type === 'RENT' && dateRange.from && dateRange.to && availData?.available) return true;
    return false;
  };

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: type === 'BUY' ? product.price_sell : product.price_rent_per_day,
      quantity,
      type,
      startDate: type === 'RENT' ? dateRange.from : undefined,
      endDate: type === 'RENT' ? dateRange.to : undefined,
      deposit: type === 'RENT' ? product.deposit_amount : 0
    });
    
    // Show toast
    setIsToastVisible(true);
    setTimeout(() => setIsToastVisible(false), 3000);
  };

  return (
    <div className="flex flex-col gap-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
      
      {/* Step 1: Chọn loại giao dịch */}
      <div className="flex p-1 bg-gray-100 rounded-lg w-full max-w-sm">
        {isBuyable && (
          <button
            onClick={() => setType('BUY')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'BUY' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            🛒 Mua đứt
          </button>
        )}
        {isRentable && (
          <button
            onClick={() => setType('RENT')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'RENT' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            📅 Thuê theo ngày
          </button>
        )}
      </div>

      {/* Step 2: Chọn ngày (nếu thuê) */}
      {type === 'RENT' && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="font-semibold mb-2">1. Chọn thời gian thuê</h3>
          {loadingBlocker ? (
            <div className="h-64 animate-pulse bg-gray-200 rounded-md"></div>
          ) : (
            <div className="bg-white rounded-md p-2 shadow-sm flex justify-center">
              <DayPicker
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                disabled={[
                  { before: new Date() }, // Past dates
                  ...blockedDates
                ]}
              />
            </div>
          )}
          
          <div className="mt-3 text-sm">
            {loadingAvail && <span className="text-blue-500 flex items-center gap-2">⏳ Đang kiểm tra lịch...</span>}
            {availError && <span className="text-red-500">❌ {availError}</span>}
            {availData?.available && <span className="text-green-600">✅ Có thể thuê trong khoảng thời gian này!</span>}
            {!availData?.available && !loadingAvail && dateRange.from && dateRange.to && !availError && (
               <span className="text-red-500">❌ Đã hết thiết bị cho ngày này.</span>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Chọn số lượng */}
      <div>
        <h3 className="font-semibold mb-2">2. Số lượng</h3>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
            disabled={quantity <= 1 || (type === 'RENT' && (!dateRange.from || !dateRange.to))}
          >-</button>
          <span className="font-medium w-6 text-center">{quantity}</span>
          <button 
            onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
            disabled={quantity >= maxQty || (type === 'RENT' && (!dateRange.from || !dateRange.to))}
          >+</button>
          
          <span className="text-sm text-gray-500 ml-2">
            (Có sẵn: {maxQty})
          </span>
        </div>
      </div>

      {/* Step 4: Bảng tính chi phí */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <h3 className="font-semibold text-blue-900 mb-3">Tóm tắt chi phí</h3>
        <div className="flex flex-col gap-2 text-sm text-blue-800">
          {type === 'RENT' ? (
            <>
              <div className="flex justify-between">
                <span>Số ngày thuê:</span>
                <span className="font-medium">{rentalDays} ngày</span>
              </div>
              <div className="flex justify-between">
                <span>Đơn giá thuê/ngày:</span>
                <span className="font-medium">{formatCurrency(product.price_rent_per_day)}/ngày</span>
              </div>
              <div className="flex justify-between">
                <span>Tiền thuê ({quantity} cái):</span>
                <span className="font-medium">{formatCurrency(rentTotal)}</span>
              </div>
              <div className="flex justify-between text-orange-600">
                <span>Tiền cọc (hoàn lại):</span>
                <span className="font-medium">{formatCurrency(depositTotal)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between">
              <span>Giá mua đứt ({quantity} cái):</span>
              <span className="font-medium">{formatCurrency(buyTotal)}</span>
            </div>
          )}
          <hr className="border-blue-200 my-1" />
          <div className="flex justify-between font-bold text-lg text-blue-950">
            <span>Tổng cần chuẩn bị:</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
          {type === 'RENT' && (
             <p className="text-xs text-blue-600 mt-2 italic">* Tiền cọc sẽ được hoàn trả sau khi trả thiết bị nguyên vẹn</p>
          )}
        </div>
      </div>

      {/* Step 5: CTA */}
      <button
        onClick={handleAddToCart}
        disabled={!isFormValid()}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg shadow-md transition-colors"
      >
        Thêm vào giỏ hàng
      </button>

      {/* Toast Notification */}
      {isToastVisible && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          🛒 Đã thêm vào giỏ hàng thành công!
        </div>
      )}
    </div>
  );
};

export default LiveConfigurator;
