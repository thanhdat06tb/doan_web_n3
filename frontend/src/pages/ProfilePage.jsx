import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, MapPin, Package, Phone, User } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';

const statusClasses = {
  PENDING: 'bg-[#fff1d6] text-[#9a3412]',
  APPROVED: 'bg-blue-50 text-blue-700',
  RENTING: 'bg-teal-50 text-[#0f766e]',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-rose-50 text-rose-700',
};

const statusLabels = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  RENTING: 'Đang thuê',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const ProfilePage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const auth = useAuth();
  const { token } = auth;

  const profileUser = auth.user || {
    fullName: 'Khách hàng',
    email: 'khachhang@example.com',
    phone: '',
    address: '',
  };

  useEffect(() => {
    if (!token) {
      setError('Vui lòng đăng nhập để xem lịch sử đơn hàng.');
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders/my');
        if (response.data.success) {
          setOrders(response.data.data.items || response.data.data || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi tải lịch sử đơn hàng.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  const handleLogout = async () => {
    navigate('/login', { replace: true });
    await auth.logout();
  };

  const getStatusBadge = (status) => (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClasses[status] || 'bg-slate-100 text-slate-700'}`}>
      {statusLabels[status] || status}
    </span>
  );

  return (
    <div className="min-h-screen bg-[#fff6e7] px-5 py-10 text-[#07111f]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="mb-3 inline-flex rounded-full bg-[#ffcc32] px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#07111f]">
            Tài khoản
          </p>
          <h1 className="text-4xl font-black tracking-tight">Thông tin cá nhân</h1>
        </div>

        <div className="grid gap-8 md:grid-cols-[340px_1fr]">
          <aside className="rounded-2xl border border-[#f3c17a] bg-white/88 p-7 shadow-[0_18px_40px_rgba(126,50,13,0.10)]">
            <div className="mb-7 flex flex-col items-center text-center">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[#fff1d6] text-[#0f766e]">
                <User size={42} />
              </div>
              <h2 className="text-2xl font-black text-[#07111f]">{profileUser.fullName || profileUser.name}</h2>
              <p className="mt-1 font-semibold text-[#4b3f39]">{profileUser.email}</p>
            </div>

            <div className="space-y-4 text-sm font-semibold text-[#4b3f39]">
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-[#0f766e]" />
                <span>{profileUser.phone || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-[#0f766e]" />
                <span>{profileUser.address || 'Chưa cập nhật địa chỉ'}</span>
              </div>
            </div>

            <div className="mt-8 border-t border-[#f3c17a] pt-6">
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 font-black text-rose-700 transition hover:bg-rose-100"
              >
                <LogOut size={18} />
                Đăng xuất
              </button>
            </div>
          </aside>

          <section className="rounded-2xl border border-[#f3c17a] bg-white/88 p-7 shadow-[0_18px_40px_rgba(126,50,13,0.10)]">
            <h2 className="mb-6 flex items-center gap-3 text-2xl font-black text-[#07111f]">
              <Package className="text-[#0f766e]" />
              Lịch sử đơn hàng
            </h2>

            {loading ? (
              <div className="flex justify-center py-14">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#0f766e] border-t-transparent" />
              </div>
            ) : error ? (
              <div className="py-14 text-center font-semibold text-[#4b3f39]">
                <p className="mb-4">{error}</p>
                {!token && (
                  <Link to="/login" className="font-black text-[#0f766e] hover:text-[#7f1d1d]">
                    Đăng nhập ngay
                  </Link>
                )}
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-[#f3c17a] bg-[#fff8e7] p-10 text-center font-semibold text-[#4b3f39]">
                Bạn chưa có đơn hàng nào.
                <br />
                <Link to="/catalog" className="mt-3 inline-block font-black text-[#0f766e] hover:text-[#7f1d1d]">
                  Tiếp tục mua sắm
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-[#f3c17a] bg-[#fffdf8] p-5 transition hover:shadow-md">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <span className="font-black text-[#07111f]">Mã đơn: #{order.id}</span>
                        <p className="mt-1 text-sm font-semibold text-[#4b3f39]">
                          Ngày đặt: {new Date(order.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#f3c17a] pt-4">
                      <div>
                        <p className="text-sm font-semibold text-[#4b3f39]">Tổng tiền</p>
                        <p className="text-lg font-black text-[#0f766e]">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.grand_total)}
                        </p>
                      </div>
                      <Link
                        to={`/order-success/${order.id}`}
                        className="rounded-2xl bg-[#083344] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#7f1d1d]"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
