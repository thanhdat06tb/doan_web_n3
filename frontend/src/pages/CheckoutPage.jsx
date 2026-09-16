import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { calculateRentalDays, formatCurrency } from '../utils/formatters';

const CheckoutPage = () => {
  const { cartItems, totals, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorModal, setErrorModal] = useState(null);
  const { register, handleSubmit, formState: { errors } } = useForm();

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <h2 className="mb-4 text-2xl font-black text-white">Giỏ hàng trống</h2>
        <p className="mb-8 text-slate-300">Bạn chưa có sản phẩm nào trong giỏ hàng. Vui lòng chọn sản phẩm trước khi thanh toán.</p>
        <button onClick={() => navigate('/')} className="rounded-2xl bg-gradient-to-r from-blue-700 to-cyan-600 px-6 py-3 font-bold text-white">
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <h2 className="mb-4 text-2xl font-black text-white">Vui lòng đăng nhập</h2>
        <p className="mb-8 text-slate-300">Bạn cần đăng nhập để xác nhận đơn hàng và theo dõi lịch sử thuê/mua.</p>
        <button onClick={() => navigate('/login', { state: { from: '/checkout' } })} className="rounded-2xl bg-gradient-to-r from-blue-700 to-cyan-600 px-6 py-3 font-bold text-white">
          Đăng nhập để tiếp tục
        </button>
      </div>
    );
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setErrorModal(null);

    try {
      const payload = {
        shippingName: data.shippingName || user?.fullName || '',
        shippingPhone: data.shippingPhone || user?.phone || '',
        shippingAddress: data.shippingAddress || user?.address || '',
        paymentMethod: data.paymentMethod,
        cartItems: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          type: item.type,
          startDate: item.startDate ? format(item.startDate, 'yyyy-MM-dd') : undefined,
          endDate: item.endDate ? format(item.endDate, 'yyyy-MM-dd') : undefined,
        })),
      };

      const response = await api.post('/orders', payload);
      if (response.data.success) {
        clearCart();
        navigate(`/order-success/${response.data.data.orderId || 'new'}`);
      } else {
        setErrorModal({
          title: 'Không thể đặt hàng',
          message: response.data.error?.message || 'Có lỗi xảy ra',
          details: response.data.error?.details,
        });
      }
    } catch {
      setErrorModal({
        title: 'Lỗi kết nối',
        message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-10 text-4xl font-black text-white">Thanh toán</h1>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_480px]">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="min-h-[560px] rounded-[2rem] border border-slate-200 bg-white p-10 text-slate-950 shadow-2xl shadow-black/20"
        >
          <h2 className="mb-8 text-2xl font-black text-slate-950">Thông tin giao hàng</h2>

          <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">Họ và tên *</label>
              <input
                {...register('shippingName', {
                  required: 'Vui lòng nhập họ tên',
                  minLength: { value: 2, message: 'Họ tên phải có ít nhất 2 ký tự' },
                })}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-base text-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Ví dụ: Nguyễn Văn A"
              />
              {errors.shippingName && <p className="mt-1 text-xs text-red-600">{errors.shippingName.message}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">Số điện thoại *</label>
              <input
                {...register('shippingPhone', {
                  required: 'Vui lòng nhập SĐT',
                  pattern: { value: /^0\d{9}$/, message: 'SĐT phải có 10 chữ số và bắt đầu bằng 0' },
                })}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-base text-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Ví dụ: 0987654321"
              />
              {errors.shippingPhone && <p className="mt-1 text-xs text-red-600">{errors.shippingPhone.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-slate-800">Địa chỉ giao hàng *</label>
              <input
                {...register('shippingAddress', {
                  required: 'Vui lòng nhập địa chỉ',
                  minLength: { value: 5, message: 'Địa chỉ phải có ít nhất 5 ký tự' },
                })}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-base text-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
              />
              {errors.shippingAddress && <p className="mt-1 text-xs text-red-600">{errors.shippingAddress.message}</p>}
            </div>
          </div>

          <h2 className="mb-5 mt-10 text-2xl font-black text-slate-950">Phương thức thanh toán</h2>
          <div className="flex flex-col gap-4">
            <label className="flex cursor-pointer items-center gap-4 rounded-[1.25rem] border border-slate-200 p-5 text-base text-slate-800 hover:bg-slate-50">
              <input type="radio" value="CASH" defaultChecked {...register('paymentMethod')} className="h-4 w-4 text-cyan-600" />
              <span>Thanh toán tiền mặt khi nhận hàng (COD)</span>
            </label>
            <label className="flex cursor-pointer items-center gap-4 rounded-[1.25rem] border border-slate-200 p-5 text-base text-slate-800 hover:bg-slate-50">
              <input type="radio" value="TRANSFER" {...register('paymentMethod')} className="h-4 w-4 text-cyan-600" />
              <span>Chuyển khoản ngân hàng</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-10 w-full rounded-[1.25rem] bg-gradient-to-r from-blue-700 to-cyan-600 py-5 text-lg font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:from-blue-800 hover:to-cyan-700 disabled:bg-gray-400"
          >
            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
          </button>
        </form>

        <aside className="sticky top-28 h-fit min-h-[360px] rounded-[2rem] border border-slate-200 bg-white p-8 text-slate-950 shadow-2xl shadow-black/20">
          <h2 className="mb-7 text-2xl font-black text-slate-950">Tóm tắt đơn hàng</h2>

          <div className="mb-6 flex flex-col gap-5">
            {cartItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-[minmax(0,1fr)_140px] items-start gap-4 text-sm">
                <div className="min-w-0">
                  <p className="font-bold leading-6 text-slate-950">{item.name}</p>
                  <p className="mt-1 text-slate-600">
                    {item.type === 'RENT' ? `Thuê: ${format(item.startDate, 'dd/MM')} - ${format(item.endDate, 'dd/MM')}` : 'Mua đứt'}
                    <span className="ml-2 font-bold text-slate-800">x{item.quantity}</span>
                  </p>
                </div>
                <p className="whitespace-nowrap text-right font-bold text-slate-950">
                  {formatCurrency(item.type === 'RENT' ? item.price * calculateRentalDays(item.startDate, item.endDate) * item.quantity : item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <hr className="my-5 border-slate-200" />

          <div className="mb-5 flex flex-col gap-3 text-sm text-slate-700">
            <div className="flex justify-between gap-4">
              <span>Tổng tiền hàng:</span>
              <span className="whitespace-nowrap font-bold text-slate-950">{formatCurrency(totals.totalGoods)}</span>
            </div>
            <div className="flex justify-between gap-4 text-orange-600">
              <span>Tổng tiền cọc:</span>
              <span className="whitespace-nowrap font-bold">{formatCurrency(totals.totalDeposit)}</span>
            </div>
          </div>

          <hr className="my-5 border-slate-200" />

          <div className="flex justify-between gap-4 text-xl font-black text-slate-950">
            <span>Tổng thanh toán:</span>
            <span className="whitespace-nowrap text-blue-700">{formatCurrency(totals.grandTotal)}</span>
          </div>
        </aside>
      </div>

      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[1.5rem] bg-white p-6 text-center text-slate-950">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <span className="text-3xl text-red-600">!</span>
            </div>
            <h3 className="mb-2 text-xl font-black">{errorModal.title}</h3>
            <p className="mb-4 text-slate-600">{errorModal.message}</p>
            {errorModal.details && (
              <div className="mb-6 rounded-xl bg-red-50 p-3 text-left text-sm text-red-700">
                {JSON.stringify(errorModal.details)}
              </div>
            )}
            <button onClick={() => setErrorModal(null)} className="rounded-2xl bg-slate-200 px-6 py-2 font-semibold text-slate-800 hover:bg-slate-300">
              Quay lại giỏ hàng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
