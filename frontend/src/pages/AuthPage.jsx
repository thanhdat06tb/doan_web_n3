import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const inputClass = 'w-full rounded-2xl border border-[#f3c17a] bg-white/85 px-4 py-3 text-sm font-semibold text-[#07111f] outline-none transition placeholder:text-[#806555] focus:border-[#0f766e] focus:ring-4 focus:ring-teal-100';

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
    <div className="min-h-[calc(100vh-6rem)] bg-[#fff6e7] px-4 py-12 text-[#07111f]">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl border border-[#f3c17a] bg-white shadow-[0_28px_70px_rgba(126,50,13,0.14)] md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative hidden overflow-hidden bg-[#fff1d6] p-8 md:flex md:flex-col md:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(255,255,255,0.9),transparent_25%),radial-gradient(circle_at_78%_24%,rgba(249,115,22,0.28),transparent_30%),radial-gradient(circle_at_80%_82%,rgba(15,118,110,0.16),transparent_28%)]" />
          <div className="relative">
            <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#053b45] via-[#0f766e] to-[#be123c] text-lg font-black text-white shadow-lg">
              GR
            </div>
            <h1 className="max-w-sm text-4xl font-black leading-tight tracking-tight">
              Cho thuê thiết bị chuyên dụng
            </h1>
            <p className="mt-4 text-sm font-semibold leading-7 text-[#4b3f39]">
              Đăng nhập để đặt mua, thuê thiết bị và theo dõi trạng thái đơn hàng trong hệ thống.
            </p>
          </div>
          <div className="relative rounded-xl border border-[#f3c17a] bg-white/80 p-4 text-sm font-bold text-[#083344] shadow-sm">
            Tài khoản admin: thanhdat06@08.vn / dat123
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="mb-7 flex items-center justify-between">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-[#0f766e]">
                {isRegister ? 'Tạo hồ sơ mới' : 'Quay lại hệ thống'}
              </p>
              <h2 className="text-3xl font-black text-[#07111f]">
                {isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}
              </h2>
              <p className="mt-2 text-sm font-semibold text-[#4b3f39]">
                {isRegister ? 'Nhập thông tin để bắt đầu mua hoặc thuê thiết bị.' : 'Dùng email và mật khẩu đã đăng ký.'}
              </p>
            </div>
            <div className="rounded-2xl bg-[#fff1d6] p-3 text-[#0f766e]">
              {isRegister ? <UserPlus className="h-6 w-6" /> : <LogIn className="h-6 w-6" />}
            </div>
          </div>

          {submitError && (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700" role="alert">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-black text-[#07111f]">Họ và tên</label>
                  <input
                    {...register('fullName', { required: 'Vui lòng nhập họ tên.', minLength: { value: 2, message: 'Họ tên phải có ít nhất 2 ký tự.' } })}
                    autoComplete="name"
                    placeholder="Nhập họ và tên"
                    className={inputClass}
                  />
                  {errors.fullName && <p className="mt-1 text-xs font-bold text-rose-600" role="alert">{errors.fullName.message}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-black text-[#07111f]">Số điện thoại</label>
                  <input
                    {...register('phone', { required: 'Vui lòng nhập số điện thoại.', pattern: { value: /^0\d{9}$/, message: 'Số điện thoại phải có 10 chữ số và bắt đầu bằng 0.' } })}
                    autoComplete="tel"
                    placeholder="Nhập số điện thoại"
                    className={inputClass}
                  />
                  {errors.phone && <p className="mt-1 text-xs font-bold text-rose-600" role="alert">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-black text-[#07111f]">Địa chỉ</label>
                  <input
                    {...register('address')}
                    autoComplete="street-address"
                    placeholder="Nhập địa chỉ"
                    className={inputClass}
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-black text-[#07111f]">E-mail</label>
              <input
                type="email"
                {...register('email', { required: 'Vui lòng nhập email.' })}
                autoComplete="email"
                placeholder="Nhập e-mail"
                className={inputClass}
              />
              {errors.email && <p className="mt-1 text-xs font-bold text-rose-600" role="alert">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-black text-[#07111f]">Mật khẩu</label>
              <input
                type="password"
                {...register('password', { required: 'Vui lòng nhập mật khẩu.', minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự.' } })}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                placeholder="Nhập mật khẩu"
                className={inputClass}
              />
              {errors.password && <p className="mt-1 text-xs font-bold text-rose-600" role="alert">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[#083344] px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-[#083344]/20 transition hover:bg-[#7f1d1d] disabled:bg-slate-400"
            >
              {submitting ? 'Đang xử lý...' : isRegister ? 'Đăng ký' : 'Đăng nhập'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-semibold text-[#4b3f39]">
            {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
            <Link to={isRegister ? '/login' : '/register'} className="font-black text-[#0f766e] hover:text-[#7f1d1d]">
              {isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
