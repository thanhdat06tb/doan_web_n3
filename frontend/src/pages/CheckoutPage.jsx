import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { calculateRentalDays, formatCurrency } from '../utils/formatters';
import { bankTransferConfig, buildTransferContent, buildVietQrUrl, isBankTransferConfigured } from '../utils/vietqr';

const inputClass = 'w-full rounded-2xl border border-[#f3c17a] bg-white/90 px-4 py-3.5 text-base font-semibold text-[#07111f] placeholder:text-[#806555] outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-teal-100';

const CheckoutPage = () => {
  const { cartItems, totals, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorModal, setErrorModal] = useState(null);
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      shippingName: user?.fullName || '',
      shippingPhone: user?.phone || '',
      shippingAddress: user?.address || '',
      paymentMethod: 'CASH',
    },
  });
  const paymentMethod = watch('paymentMethod');
  const shippingPhone = watch('shippingPhone');
  const hasDeposit = totals.totalDeposit > 0;
  const transferContent = buildTransferContent(null, shippingPhone || user?.phone);
  const checkoutQrUrl = buildVietQrUrl({
    amount: totals.grandTotal,
    phone: shippingPhone || user?.phone,
  });

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] bg-[#fff6e7] px-4 py-16 text-center text-[#07111f]">
        <div className="mx-auto max-w-lg rounded-2xl border border-[#f3c17a] bg-white/88 p-8 shadow-[0_18px_40px_rgba(126,50,13,0.10)]">
          <h2 className="mb-4 text-2xl font-black">Giỏ hàng trống</h2>
          <p className="mb-8 font-semibold leading-7 text-[#4b3f39]">
            Bạn chưa có sản phẩm nào trong giỏ hàng. Vui lòng chọn sản phẩm trước khi thanh toán.
          </p>
          <button onClick={() => navigate('/catalog')} className="rounded-2xl bg-[#083344] px-6 py-3 font-black text-white transition hover:bg-[#7f1d1d]">
            Xem sản phẩm
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] bg-[#fff6e7] px-4 py-16 text-center text-[#07111f]">
        <div className="mx-auto max-w-lg rounded-2xl border border-[#f3c17a] bg-white/88 p-8 shadow-[0_18px_40px_rgba(126,50,13,0.10)]">
          <h2 className="mb-4 text-2xl font-black">Vui lòng đăng nhập</h2>
          <p className="mb-8 font-semibold leading-7 text-[#4b3f39]">
            Bạn cần đăng nhập để xác nhận đơn hàng và theo dõi lịch sử thuê/mua.
          </p>
          <button onClick={() => navigate('/login', { state: { from: '/checkout' } })} className="rounded-2xl bg-[#083344] px-6 py-3 font-black text-white transition hover:bg-[#7f1d1d]">
            Đăng nhập để tiếp tục
          </button>
        </div>
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
          message: response.data.error?.message || 'Có lỗi xảy ra.',
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
    <div className="min-h-screen bg-[#fff6e7] px-5 py-10 text-[#07111f]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="mb-3 inline-flex rounded-full bg-[#ffcc32] px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#07111f]">
            Xác nhận đơn
          </p>
          <h1 className="text-4xl font-black tracking-tight">Thanh toán</h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_440px]">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-2xl border border-[#f3c17a] bg-white/88 p-7 shadow-[0_18px_40px_rgba(126,50,13,0.10)] md:p-9"
          >
            <h2 className="mb-7 text-2xl font-black">Thông tin giao hàng</h2>

            <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-black">Họ và tên *</label>
                <input
                  {...register('shippingName', {
                    required: 'Vui lòng nhập họ tên.',
                    minLength: { value: 2, message: 'Họ tên phải có ít nhất 2 ký tự.' },
                  })}
                  className={inputClass}
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
                {errors.shippingName && <p className="mt-1 text-xs font-bold text-rose-600">{errors.shippingName.message}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-black">Số điện thoại *</label>
                <input
                  {...register('shippingPhone', {
                    required: 'Vui lòng nhập số điện thoại.',
                    pattern: { value: /^0\d{9}$/, message: 'Số điện thoại phải có 10 chữ số và bắt đầu bằng 0.' },
                  })}
                  className={inputClass}
                  placeholder="Ví dụ: 0987654321"
                />
                {errors.shippingPhone && <p className="mt-1 text-xs font-bold text-rose-600">{errors.shippingPhone.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-black">Địa chỉ giao hàng *</label>
                <input
                  {...register('shippingAddress', {
                    required: 'Vui lòng nhập địa chỉ.',
                    minLength: { value: 5, message: 'Địa chỉ phải có ít nhất 5 ký tự.' },
                  })}
                  className={inputClass}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                />
                {errors.shippingAddress && <p className="mt-1 text-xs font-bold text-rose-600">{errors.shippingAddress.message}</p>}
              </div>
            </div>

            <h2 className="mb-5 text-2xl font-black">Phương thức thanh toán</h2>
            <div className="grid gap-4">
              <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-[#f3c17a] bg-[#fffdf8] p-5 text-base font-semibold transition hover:bg-[#fff1d6]">
                <input type="radio" value="CASH" defaultChecked {...register('paymentMethod')} className="h-4 w-4 text-[#0f766e]" />
                <span>Thanh toán tiền mặt khi nhận hàng (COD)</span>
              </label>
              <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-[#f3c17a] bg-[#fffdf8] p-5 text-base font-semibold transition hover:bg-[#fff1d6]">
                <input type="radio" value="TRANSFER" {...register('paymentMethod')} className="h-4 w-4 text-[#0f766e]" />
                <span>Chuyển khoản ngân hàng</span>
              </label>
              {paymentMethod === 'TRANSFER' && (
                <div className="rounded-2xl border border-[#f3c17a] bg-[#fff8e7] p-5 text-sm font-semibold text-[#4b3f39]">
                  <p className="mb-3 text-base font-black text-[#07111f]">Thông tin nhận chuyển khoản</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <p><span className="block text-xs uppercase tracking-[0.12em] text-[#9a3412]">Ngân hàng</span><b className="text-[#07111f]">{bankTransferConfig.bankId}</b></p>
                    <p><span className="block text-xs uppercase tracking-[0.12em] text-[#9a3412]">Số tài khoản</span><b className="text-[#07111f]">{bankTransferConfig.accountNo}</b></p>
                    <p><span className="block text-xs uppercase tracking-[0.12em] text-[#9a3412]">Chủ tài khoản</span><b className="text-[#07111f]">{bankTransferConfig.accountName}</b></p>
                  </div>
                  <p className="mt-3 leading-6">
                    Mã QR sẽ được tạo tự động sau khi xác nhận đơn, kèm đúng số tiền và nội dung chuyển khoản.
                  </p>
                  {!isBankTransferConfigured && (
                    <p className="mt-3 rounded-xl bg-amber-100 px-4 py-3 font-black text-amber-800">
                      Chưa cấu hình số tài khoản thật. Hãy cập nhật file .env trước khi nhận chuyển khoản.
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-9 w-full rounded-xl bg-[#083344] py-4 text-base font-black text-white shadow-lg shadow-[#083344]/20 transition hover:bg-[#7f1d1d] disabled:bg-slate-400"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
            </button>
          </form>

          <aside className="sticky top-28 h-fit rounded-2xl border border-[#f3c17a] bg-white/88 p-7 shadow-[0_18px_40px_rgba(126,50,13,0.10)]">
            <h2 className="mb-7 text-2xl font-black">Tóm tắt đơn hàng</h2>

            <div className="mb-6 flex flex-col gap-5">
              {cartItems.map((item, idx) => (
                <div key={`${item.productId}-${idx}`} className="grid grid-cols-[minmax(0,1fr)_130px] items-start gap-4 text-sm">
                  <div className="min-w-0">
                    <p className="font-black leading-6 text-[#07111f]">{item.name}</p>
                    <p className="mt-1 font-semibold text-[#4b3f39]">
                      {item.type === 'RENT' ? `Thuê: ${format(item.startDate, 'dd/MM')} - ${format(item.endDate, 'dd/MM')}` : 'Mua đứt'}
                      <span className="ml-2 font-black">x{item.quantity}</span>
                    </p>
                  </div>
                  <p className="whitespace-nowrap text-right font-black text-[#07111f]">
                    {formatCurrency(item.type === 'RENT' ? item.price * calculateRentalDays(item.startDate, item.endDate) * item.quantity : item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="my-5 border-t border-[#f3c17a]" />

            <div className="mb-5 grid gap-3 text-sm font-semibold text-[#4b3f39]">
              <div className="flex justify-between gap-4">
                <span>Tổng tiền hàng:</span>
                <span className="whitespace-nowrap font-black text-[#07111f]">{formatCurrency(totals.totalGoods)}</span>
              </div>
              <div className="flex justify-between gap-4 text-[#c2410c]">
                <span>Tiền cọc hoàn lại:</span>
                <span className="whitespace-nowrap font-black">{formatCurrency(totals.totalDeposit)}</span>
              </div>
            </div>

            <div className="my-5 border-t border-[#f3c17a]" />

            <div className="flex justify-between gap-4 text-xl font-black">
              <span>{hasDeposit ? 'Tạm thu khi đặt:' : 'Tổng thanh toán:'}</span>
              <span className="whitespace-nowrap text-[#0f766e]">{formatCurrency(totals.grandTotal)}</span>
            </div>
            {hasDeposit && (
              <p className="mt-3 text-sm font-semibold leading-6 text-[#4b3f39]">
                Số tiền này gồm tiền thuê/mua và tiền cọc. Tiền cọc sẽ hoàn lại khi thiết bị được trả đúng hạn, nguyên vẹn.
              </p>
            )}

            {paymentMethod === 'TRANSFER' && (
              <div className="mt-6 rounded-2xl border border-[#f3c17a] bg-[#fff8e7] p-4">
                <p className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-[#9a3412]">Quét QR thanh toán</p>
                <div className="rounded-2xl bg-white p-4 shadow-[0_12px_28px_rgba(126,50,13,0.08)]">
                  <img src={checkoutQrUrl} alt="QR chuyển khoản đơn hàng" className="mx-auto h-56 w-56 object-contain" />
                </div>
                <div className="mt-4 space-y-2 text-sm font-semibold text-[#4b3f39]">
                  <div className="flex justify-between gap-4">
                    <span>{hasDeposit ? 'Số tiền tạm thu' : 'Số tiền'}</span>
                    <b className="text-right text-[#0f766e]">{formatCurrency(totals.grandTotal)}</b>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Nội dung</span>
                    <b className="text-right text-[#07111f]">{transferContent}</b>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Tài khoản</span>
                    <b className="text-right text-[#07111f]">{bankTransferConfig.accountNo}</b>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center text-[#07111f] shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
              <span className="text-3xl font-black text-rose-600">!</span>
            </div>
            <h3 className="mb-2 text-xl font-black">{errorModal.title}</h3>
            <p className="mb-4 font-semibold text-[#4b3f39]">{errorModal.message}</p>
            {errorModal.details && (
              <div className="mb-6 rounded-2xl bg-rose-50 p-3 text-left text-sm font-semibold text-rose-700">
                {JSON.stringify(errorModal.details)}
              </div>
            )}
            <button onClick={() => setErrorModal(null)} className="rounded-2xl bg-[#083344] px-6 py-3 font-black text-white transition hover:bg-[#7f1d1d]">
              Quay lại giỏ hàng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
