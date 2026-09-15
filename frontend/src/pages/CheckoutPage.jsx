import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCart } from '../hooks/useCart';
import { formatCurrency, calculateRentalDays } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';

const CheckoutPage = () => {
  const { cartItems, totals, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorModal, setErrorModal] = useState(null);
  const { register, handleSubmit, formState: { errors } } = useForm();

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Giỏ hàng trống</h2>
        <p className="text-gray-600 mb-8">Bạn chưa có sản phẩm nào trong giỏ hàng. Vui lòng chọn sản phẩm trước khi thanh toán.</p>
        <button 
          onClick={() => navigate('/')} 
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <h2 className="mb-4 text-2xl font-bold">Vui lòng đăng nhập</h2>
        <p className="mb-8 text-gray-600">Bạn cần đăng nhập để xác nhận đơn hàng và theo dõi lịch sử thuê/mua.</p>
        <button
          onClick={() => navigate('/login', { state: { from: '/checkout' } })}
          className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Đăng nhập để tiếp tục
        </button>
      </div>
    );
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setErrorModal(null);

    try {
      // Chuẩn bị payload theo Giai đoạn 1
      const payload = {
        shippingName: data.shippingName || user?.fullName || '',
        shippingPhone: data.shippingPhone || user?.phone || '',
        shippingAddress: data.shippingAddress || user?.address || '',
        paymentMethod: data.paymentMethod,
        cartItems: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          type: item.type,
          startDate: item.startDate ? format(item.startDate, 'yyyy-MM-dd') : undefined,
          endDate: item.endDate ? format(item.endDate, 'yyyy-MM-dd') : undefined,
        }))
      };

      const response = await api.post('/orders', payload);
      
      if (response.data.success) {
        clearCart();
        navigate(`/order-success/${response.data.data.orderId || 'new'}`);
      } else {
        // Handle conflict or other business errors
        setErrorModal({
          title: 'Không thể đặt hàng',
          message: response.data.error?.message || 'Có lỗi xảy ra',
          details: response.data.error?.details
        });
      }
    } catch {
      setErrorModal({
        title: 'Lỗi kết nối',
        message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Thanh toán</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cột trái: Form thông tin */}
        <div className="w-full lg:w-2/3">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-6">Thông tin giao hàng</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
                <input 
                  {...register("shippingName", { required: "Vui lòng nhập họ tên", minLength: { value: 2, message: "Họ tên phải có ít nhất 2 ký tự" } })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
                {errors.shippingName && <p className="text-red-500 text-xs mt-1" role="alert">{errors.shippingName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                <input 
                  {...register("shippingPhone", { 
                    required: "Vui lòng nhập SĐT",
                    pattern: { value: /^0\d{9}$/, message: "SĐT phải có 10 chữ số và bắt đầu bằng 0" }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: 0987654321"
                />
                {errors.shippingPhone && <p className="text-red-500 text-xs mt-1" role="alert">{errors.shippingPhone.message}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ giao hàng *</label>
                <input 
                  {...register("shippingAddress", { required: "Vui lòng nhập địa chỉ", minLength: { value: 5, message: "Địa chỉ phải có ít nhất 5 ký tự" } })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                />
                {errors.shippingAddress && <p className="text-red-500 text-xs mt-1" role="alert">{errors.shippingAddress.message}</p>}
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-4 mt-8">Phương thức thanh toán</h2>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input 
                  type="radio" 
                  value="CASH" 
                  defaultChecked
                  {...register("paymentMethod")}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Thanh toán tiền mặt khi nhận hàng (COD)</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input 
                  type="radio" 
                  value="TRANSFER" 
                  {...register("paymentMethod")}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Chuyển khoản ngân hàng</span>
              </label>
            </div>

            <div className="mt-8">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg shadow-md transition-colors disabled:bg-gray-400"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
              </button>
            </div>
          </form>
        </div>

        {/* Cột phải: Order summary */}
        <div className="w-full lg:w-1/3">
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 sticky top-8">
            <h2 className="text-xl font-semibold mb-6">Tóm tắt đơn hàng</h2>
            
            <div className="flex flex-col gap-4 mb-6">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-sm">
                  <div className="flex-1 pr-4">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-gray-500">
                      {item.type === 'RENT' 
                        ? `Thuê: ${format(item.startDate, 'dd/MM')} - ${format(item.endDate, 'dd/MM')}`
                        : 'Mua đứt'
                      } 
                      <span className="font-medium text-gray-700 ml-2">x{item.quantity}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(item.type === 'RENT' ? item.price * calculateRentalDays(item.startDate, item.endDate) * item.quantity : item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            <hr className="border-gray-300 my-4" />
            
            <div className="flex flex-col gap-2 text-sm text-gray-700 mb-4">
              <div className="flex justify-between">
                <span>Tổng tiền hàng:</span>
                <span className="font-medium">{formatCurrency(totals.totalGoods)}</span>
              </div>
              <div className="flex justify-between text-orange-600">
                <span>Tổng tiền cọc:</span>
                <span className="font-medium">{formatCurrency(totals.totalDeposit)}</span>
              </div>
            </div>
            
            <hr className="border-gray-300 my-4" />
            
            <div className="flex justify-between text-lg font-bold text-gray-900">
              <span>Tổng thanh toán:</span>
              <span className="text-blue-700">{formatCurrency(totals.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {errorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold mb-2">{errorModal.title}</h3>
            <p className="text-gray-600 mb-4">{errorModal.message}</p>
            {errorModal.details && (
              <div className="bg-red-50 p-3 rounded-lg text-sm text-left text-red-700 mb-6">
                {JSON.stringify(errorModal.details)}
              </div>
            )}
            <button 
              onClick={() => setErrorModal(null)}
              className="bg-gray-200 text-gray-800 font-semibold px-6 py-2 rounded-lg hover:bg-gray-300"
            >
              Quay lại giỏ hàng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
