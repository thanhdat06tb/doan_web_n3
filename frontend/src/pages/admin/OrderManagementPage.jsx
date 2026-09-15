import React, { useCallback, useEffect, useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import ReturnProcessingModal from '../../components/Admin/ReturnProcessingModal';
import api from '../../utils/api';

const OrderManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await api.get('/admin/orders', {
        params: {
          status: activeTab,
          search: searchQuery,
          page: 1,
          limit: 20,
        },
      });

      if (response.data.success) {
        setOrders(response.data.data.items || []);
      }
    } catch (error) {
      if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') {
        setErrorMsg('Không thể tải danh sách đơn hàng từ máy chủ.');
        setOrders([]);
        return;
      }

      console.warn('Backend not available, using mock admin orders list', error.message);
      setOrders([
        {
          id: 101,
          shipping_name: 'Nguyễn Văn A',
          shipping_phone: '0901234567',
          shipping_address: '123 Nguyễn Huệ, Q.1, TP.HCM',
          grand_total: 4500000,
          total_deposit: 1500000,
          status: 'PENDING',
          created_at: '2026-09-11 10:30:00',
        },
        {
          id: 102,
          shipping_name: 'Trần Thị B',
          shipping_phone: '0987654321',
          shipping_address: '456 Lê Lợi, Q.1, TP.HCM',
          grand_total: 8200000,
          total_deposit: 3000000,
          status: 'APPROVED',
          created_at: '2026-09-10 14:15:00',
        },
        {
          id: 103,
          shipping_name: 'Lê Hoàng C',
          shipping_phone: '0912345678',
          shipping_address: '789 CMT8, Q.3, TP.HCM',
          grand_total: 12000000,
          total_deposit: 4000000,
          status: 'RENTING',
          created_at: '2026-09-08 09:00:00',
          items: [
            { id: 1, type: 'RENT', product_name: 'Máy Ảnh Sony Alpha A7 IV', quantity: 1, deposit_amount: 4000000, price_rent_per_day: 500000, end_date: '2026-09-12' },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const response = await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      if (response.data.success) {
        fetchOrders();
      } else {
        alert(response.data.error?.message || 'Không thể đổi trạng thái.');
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Lỗi cập nhật đơn hàng.');
    }
  };

  const requestStatusChange = (order, newStatus) => {
    setConfirmAction({ order, newStatus });
  };

  const confirmStatusChange = async () => {
    if (!confirmAction) return;
    await handleUpdateStatus(confirmAction.order.id, confirmAction.newStatus);
    setConfirmAction(null);
  };

  const handleOpenReturn = async (order) => {
    try {
      const response = await api.get(`/admin/orders/${order.id}`);
      if (response.data.success) {
        setSelectedOrderForReturn(response.data.data);
        return;
      }
      throw new Error(response.data.error?.message || 'Không thể tải chi tiết đơn hàng.');
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
        setSelectedOrderForReturn(order);
      } else {
        setErrorMsg(err.response?.data?.error?.message || err.message || 'Không thể tải chi tiết đơn hàng.');
      }
    }
  };

  const statusBadge = (status) => {
    const map = {
      PENDING: { label: 'Chờ Duyệt', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
      APPROVED: { label: 'Đã Duyệt', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
      RENTING: { label: 'Đang Thuê', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
      COMPLETED: { label: 'Hoàn Thành', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
      CANCELLED: { label: 'Đã Hủy', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
    };
    const s = map[status] || { label: status, cls: 'bg-slate-800 text-slate-400 border-slate-700' };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${s.cls}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Quản Lý Đơn Hàng</h1>
          <p className="text-xs text-slate-400 mt-1">Xác nhận đơn, theo dõi quá trình cho thuê & hoàn cọc</p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
        {/* Status Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 md:pb-0">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'PENDING', label: 'Chờ duyệt' },
            { id: 'APPROVED', label: 'Đã duyệt' },
            { id: 'RENTING', label: 'Đang thuê' },
            { id: 'COMPLETED', label: 'Hoàn thành' },
            { id: 'CANCELLED', label: 'Đã hủy' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, Tên, SĐT..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </form>
      </div>

      {/* Orders Table */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm" role="alert">
          {errorMsg}
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Đang tải danh sách đơn hàng...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Không tìm thấy đơn hàng nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Mã Đơn</th>
                  <th className="p-4">Khách Hàng</th>
                  <th className="p-4">Tổng Tiền</th>
                  <th className="p-4">Tiền Cọc</th>
                  <th className="p-4">Trạng Thái</th>
                  <th className="p-4">Ngày Tạo</th>
                  <th className="p-4 text-right">Thao Tác State Machine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 font-bold text-white">#{order.id}</td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-100">{order.shipping_name}</p>
                      <p className="text-xs text-slate-400">{order.shipping_phone}</p>
                    </td>
                    <td className="p-4 font-bold text-emerald-400">
                      {formatCurrency(order.grand_total)}
                    </td>
                    <td className="p-4 text-amber-400 font-medium">
                      {formatCurrency(order.total_deposit)}
                    </td>
                    <td className="p-4">
                      {statusBadge(order.status)}
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      {order.created_at}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* State Machine Transition Buttons */}
                        {order.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => requestStatusChange(order, 'APPROVED')}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20"
                            >
                              Duyệt Đơn
                            </button>
                            <button
                              onClick={() => requestStatusChange(order, 'CANCELLED')}
                              className="px-3 py-1.5 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white text-xs font-semibold"
                            >
                              Hủy
                            </button>
                          </>
                        )}

                        {order.status === 'APPROVED' && (
                          <>
                            <button
                              onClick={() => requestStatusChange(order, 'RENTING')}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-500/20"
                            >
                              Giao Đồ (Bắt Đầu Thuê)
                            </button>
                            <button
                              onClick={() => requestStatusChange(order, 'CANCELLED')}
                              className="px-3 py-1.5 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white text-xs font-semibold"
                            >
                              Hủy
                            </button>
                          </>
                        )}

                        {order.status === 'RENTING' && (
                          <button
                            onClick={() => handleOpenReturn(order)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20"
                          >
                            Hoàn Tất & Trả Cọc
                          </button>
                        )}

                        {order.status === 'COMPLETED' && (
                          <span className="text-xs text-emerald-400/80 font-medium">Đã hoàn thành</span>
                        )}

                        {order.status === 'CANCELLED' && (
                          <span className="text-xs text-rose-400/80 font-medium">Đã hủy</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Return Processing Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Xác nhận đổi trạng thái</h2>
            <p className="mt-2 text-sm text-slate-300">
              Đơn #{confirmAction.order.id} sẽ chuyển từ {confirmAction.order.status} sang {confirmAction.newStatus}.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                onClick={confirmStatusChange}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Processing Modal */}
      {selectedOrderForReturn && (
        <ReturnProcessingModal
          order={selectedOrderForReturn}
          onClose={() => setSelectedOrderForReturn(null)}
          onSuccess={() => {
            setSelectedOrderForReturn(null);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
};

export default OrderManagementPage;
