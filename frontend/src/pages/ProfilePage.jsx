import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, User, MapPin, Phone, LogOut } from 'lucide-react';
import api from '../utils/api';

const ProfilePage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  // Dummy user profile for now, in a real app this would come from an API
  const user = {
    name: 'Khách hàng',
    email: 'khachhang@example.com',
    phone: '0987654321',
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
          setOrders(response.data.data.items || response.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi tải lịch sử đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Chờ duyệt</span>;
      case 'APPROVED': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Đã duyệt</span>;
      case 'RENTING': return <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">Đang thuê</span>;
      case 'COMPLETED': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Hoàn thành</span>;
      case 'CANCELLED': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Đã hủy</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Profile */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                <User size={40} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
              <p className="text-slate-500">{user.email}</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-600">
                <Phone size={18} />
                <span>{user.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin size={18} />
                <span>TP. Hồ Chí Minh</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium transition-colors w-full justify-center"
              >
                <LogOut size={18} />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Package className="text-blue-600" />
              Lịch sử đơn hàng
            </h2>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-slate-500">
                <p className="mb-4">{error}</p>
                {!token && (
                  <Link to="/login" className="text-blue-600 font-medium hover:underline">
                    Đăng nhập ngay
                  </Link>
                )}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Bạn chưa có đơn hàng nào.
                <br />
                <Link to="/" className="text-blue-600 font-medium hover:underline mt-2 inline-block">
                  Tiếp tục mua sắm
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-wrap justify-between items-start mb-4 gap-4">
                      <div>
                        <span className="font-bold text-slate-900">Mã đơn: #{order.id}</span>
                        <p className="text-sm text-slate-500 mt-1">
                          Ngày đặt: {new Date(order.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    <div className="border-t border-gray-50 pt-4 mt-4 flex flex-wrap justify-between items-center gap-4">
                      <div>
                        <p className="text-sm text-slate-500">Tổng tiền</p>
                        <p className="font-bold text-blue-600 text-lg">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.grand_total)}
                        </p>
                      </div>
                      <Link 
                        to={`/order-success/${order.id}`} 
                        className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-lg transition-colors text-sm"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
