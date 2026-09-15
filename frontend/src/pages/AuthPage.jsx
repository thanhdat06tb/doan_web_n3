import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const AuthPage = ({ mode }) => {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, register: registerUser } = useAuth();
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      phone: '',
      address: '',
    },
  });

  if (isAuthenticated) {
    return <Navigate to={location.state?.from || '/'} replace />;
  }

  const onSubmit = async (data) => {
    setSubmitError('');
    setSubmitting(true);
    try {
      if (isRegister) {
        await registerUser(data);
      } else {
        await login(data);
      }
      navigate(location.state?.from || '/', { replace: true });
    } catch (error) {
      setSubmitError(error.response?.data?.error?.message || error.message || 'Không thể xử lý yêu cầu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] bg-slate-50 px-4 py-12">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl md:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden bg-slate-900 p-8 text-white md:flex md:flex-col md:justify-between">
          <div>
            <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-lg font-black">
              GR
            </div>
            <h1 className="text-3xl font-black tracking-tight">GearRental</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Đăng nhập để đặt mua, thuê thiết bị và theo dõi trạng thái đơn hàng trong hệ thống.
            </p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4 text-sm text-slate-300">
            Tài khoản admin demo: admin@rental.vn / password123
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                {isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isRegister ? 'Nhập thông tin để bắt đầu mua hoặc thuê thiết bị.' : 'Dùng email và mật khẩu đã đăng ký.'}
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              {isRegister ? <UserPlus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
            </div>
          </div>

          {submitError && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700" role="alert">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Họ tên</label>
                  <input
                    {...register('fullName', { required: 'Vui lòng nhập họ tên.', minLength: { value: 2, message: 'Họ tên phải có ít nhất 2 ký tự.' } })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  {errors.fullName && <p className="mt-1 text-xs text-rose-600" role="alert">{errors.fullName.message}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Số điện thoại</label>
                  <input
                    {...register('phone', { required: 'Vui lòng nhập số điện thoại.', pattern: { value: /^0\d{9}$/, message: 'Số điện thoại phải có 10 chữ số và bắt đầu bằng 0.' } })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  {errors.phone && <p className="mt-1 text-xs text-rose-600" role="alert">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Địa chỉ</label>
                  <input
                    {...register('address')}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
              <input
                type="email"
                {...register('email', { required: 'Vui lòng nhập email.' })}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {errors.email && <p className="mt-1 text-xs text-rose-600" role="alert">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Mật khẩu</label>
              <input
                type="password"
                {...register('password', { required: 'Vui lòng nhập mật khẩu.', minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự.' } })}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {errors.password && <p className="mt-1 text-xs text-rose-600" role="alert">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:bg-slate-400"
            >
              {submitting ? 'Đang xử lý...' : isRegister ? 'Đăng ký' : 'Đăng nhập'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
            <Link to={isRegister ? '/login' : '/register'} className="font-bold text-blue-600 hover:text-blue-700">
              {isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
