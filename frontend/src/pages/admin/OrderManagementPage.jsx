import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Eye,
  Package,
  Phone,
  RefreshCw,
  Search,
  User,
  X,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import ReturnProcessingModal from '../../components/Admin/ReturnProcessingModal';
import api from '../../utils/api';

const STATUS_LABELS = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  RENTING: 'Đang thuê',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const STATUS_TABS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'PENDING', label: 'Chờ duyệt' },
  { id: 'APPROVED', label: 'Đã duyệt' },
  { id: 'RENTING', label: 'Đang thuê' },
  { id: 'COMPLETED', label: 'Hoàn thành' },
  { id: 'CANCELLED', label: 'Đã hủy' },
];

const PAYMENT_STATUS_LABELS = {
  UNPAID: 'Chưa gửi biên lai',
  PENDING_REVIEW: 'Chờ đối soát',
  PAID: 'Đã nhận tiền',
  REJECTED: 'Từ chối biên lai',
};

const formatDateTime = (value) => {
  if (!value) return 'Chưa có';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getOrderDate = (value) => {
  if (!value) return '';
  const raw = String(value).trim();
  const directMatch = raw.match(/^\d{4}-\d{2}-\d{2}/);
  if (directMatch) return directMatch[0];

  const date = new Date(raw.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const buildOrderSummary = (items, selectedDate) => {
  const statusCounts = { PENDING: 0, APPROVED: 0, RENTING: 0, COMPLETED: 0, CANCELLED: 0 };
  const summary = items.reduce(
    (acc, order) => {
      const status = order.status;
      if (statusCounts[status] !== undefined) statusCounts[status] += 1;
      acc.orderCount += 1;
      acc.totalAmount += Number(order.total_amount || 0);
      acc.totalDeposit += Number(order.total_deposit || 0);
      acc.grandTotal += Number(order.grand_total || 0);
      return acc;
    },
    { orderCount: 0, totalAmount: 0, totalDeposit: 0, grandTotal: 0 }
  );

  return { ...summary, statusCounts, selectedDate: selectedDate || null };
};

const OrderManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [dateSummary, setDateSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {
        status: activeTab,
        page: 1,
        limit: selectedDate || searchQuery ? 200 : 1000,
      };
      const trimmedSearch = searchQuery.trim();
      if (trimmedSearch) params.search = trimmedSearch;
      if (selectedDate) params.date = selectedDate;

      const response = await api.get('/admin/orders', {
        params,
      });

      if (response.data.success) {
        const apiOrders = response.data.data.items || [];
        const visibleOrders = selectedDate
          ? apiOrders.filter((order) => getOrderDate(order.created_at) === selectedDate)
          : apiOrders;
        const apiSummary = response.data.data.summary || null;

        setOrders(visibleOrders);
        setDateSummary(
          selectedDate && apiSummary?.selectedDate !== selectedDate
            ? buildOrderSummary(visibleOrders, selectedDate)
            : apiSummary
        );
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.error?.message || error.message || 'Không thể tải danh sách đơn hàng.');
      setOrders([]);
      setDateSummary(null);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, selectedDate]);

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

  const handleOpenOrderDetail = async (order) => {
    setDetailLoading(true);
    setErrorMsg('');
    try {
      const response = await api.get(`/admin/orders/${order.id}`);
      if (response.data.success) {
        setSelectedOrderDetail(response.data.data);
      } else {
        throw new Error(response.data.error?.message || 'Không thể tải chi tiết đơn hàng.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || err.message || 'Không thể tải chi tiết đơn hàng.');
    } finally {
      setDetailLoading(false);
    }
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
      setErrorMsg(err.response?.data?.error?.message || err.message || 'Không thể tải chi tiết đơn hàng.');
    }
  };

  const handleReviewPayment = async (paymentStatus) => {
    if (!selectedOrderDetail) return;
    const note = paymentStatus === 'REJECTED'
      ? window.prompt('Lý do từ chối biên lai:', selectedOrderDetail.payment_note || '')
      : window.prompt('Ghi chú đối soát:', selectedOrderDetail.payment_note || 'Đã đối soát chuyển khoản.');

    if (note === null) return;

    try {
      const response = await api.put(`/admin/orders/${selectedOrderDetail.id}/payment`, {
        paymentStatus,
        note,
      });
      if (response.data.success) {
        setSelectedOrderDetail(response.data.data);
        fetchOrders();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || err.message || 'Không thể cập nhật thanh toán.');
    }
  };

  const statusBadge = (status) => {
    const map = {
      PENDING: { label: 'Chờ duyệt', cls: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
      APPROVED: { label: 'Đã duyệt', cls: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
      RENTING: { label: 'Đang thuê', cls: 'bg-purple-500/10 text-purple-300 border-purple-500/30' },
      COMPLETED: { label: 'Hoàn thành', cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
      CANCELLED: { label: 'Đã hủy', cls: 'bg-rose-500/10 text-rose-300 border-rose-500/30' },
    };
    const s = map[status] || { label: status, cls: 'bg-slate-800 text-slate-300 border-slate-700' };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${s.cls}`}>{s.label}</span>;
  };

  const orderHasRentItems = (order) => {
    if (Array.isArray(order.item_summary)) {
      return order.item_summary.some((item) => item.type === 'RENT' && Number(item.count) > 0);
    }
    if (Array.isArray(order.items)) {
      return order.items.some((item) => item.type === 'RENT');
    }
    return false;
  };

  const statusCounts = useMemo(() => dateSummary?.statusCounts || {}, [dateSummary]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Quản lý đơn hàng</h1>
          <p className="text-xs text-slate-400 mt-1">Lọc theo ngày, xem số đơn và tổng quan từng giao dịch.</p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Tải lại"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 xl:grid-cols-[1fr_auto]">
        <div className="flex gap-1 overflow-x-auto pb-2 xl:pb-0">
          {STATUS_TABS.map((tab) => (
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

        <div className="flex flex-col gap-3 md:flex-row">
          <label className="relative min-w-[180px]">
            <CalendarDays className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </label>

          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm mã đơn, tên, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </form>

          {(selectedDate || searchQuery) && (
            <button
              onClick={() => {
                setSelectedDate('');
                setSearchQuery('');
              }}
              className="rounded-xl border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-900"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {selectedDate && dateSummary && (
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Ngày {selectedDate}</p>
            <p className="mt-2 text-3xl font-black text-white">{dateSummary.orderCount || 0}</p>
            <p className="text-xs text-slate-300">đơn đặt</p>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Tổng thanh toán</p>
            <p className="mt-2 text-2xl font-black text-white">{formatCurrency(dateSummary.grandTotal || 0)}</p>
            <p className="text-xs text-slate-300">gồm tiền hàng và tạm thu/cọc</p>
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Tạm thu/cọc</p>
            <p className="mt-2 text-2xl font-black text-white">{formatCurrency(dateSummary.totalDeposit || 0)}</p>
            <p className="text-xs text-slate-300">phần cần đối soát</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Trạng thái</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <span key={key} className="flex justify-between rounded-lg bg-slate-950 px-2 py-1">
                  <span>{label}</span>
                  <b className="text-white">{statusCounts[key] || 0}</b>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm" role="alert">
          {errorMsg}
        </div>
      )}

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
                  <th className="p-4">Mã đơn</th>
                  <th className="p-4">Khách hàng</th>
                  <th className="p-4">Tổng tiền</th>
                  <th className="p-4">Tạm thu/cọc</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Ngày tạo</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 font-bold text-white">#{order.id}</td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-100">{order.shipping_name}</p>
                      <p className="text-xs text-slate-400">{order.shipping_phone}</p>
                    </td>
                    <td className="p-4 font-bold text-emerald-400">{formatCurrency(order.grand_total)}</td>
                    <td className="p-4 text-amber-400 font-medium">{formatCurrency(order.total_deposit)}</td>
                    <td className="p-4">{statusBadge(order.status)}</td>
                    <td className="p-4 text-xs text-slate-400">{formatDateTime(order.created_at)}</td>
                    <td className="p-4 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenOrderDetail(order)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-200"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Xem
                        </button>

                        {order.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => requestStatusChange(order, 'APPROVED')}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20"
                            >
                              Duyệt đơn
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
                            {orderHasRentItems(order) ? (
                              <button
                                onClick={() => requestStatusChange(order, 'RENTING')}
                                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-500/20"
                              >
                                Giao đồ
                              </button>
                            ) : (
                              <button
                                onClick={() => requestStatusChange(order, 'COMPLETED')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20"
                              >
                                Hoàn tất
                              </button>
                            )}
                            <button
                              onClick={() => requestStatusChange(order, 'CANCELLED')}
                              className="px-3 py-1.5 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white text-xs font-semibold"
                            >
                              Hủy
                            </button>
                          </>
                        )}

                        {order.status === 'RENTING' && (
                          orderHasRentItems(order) ? (
                            <button
                              onClick={() => handleOpenReturn(order)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20"
                            >
                              Trả cọc
                            </button>
                          ) : (
                            <button
                              onClick={() => requestStatusChange(order, 'COMPLETED')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20"
                            >
                              Hoàn tất
                            </button>
                          )
                        )}

                        {order.status === 'COMPLETED' && <span className="text-xs text-emerald-400/80 font-medium">Đã xong</span>}
                        {order.status === 'CANCELLED' && <span className="text-xs text-rose-400/80 font-medium">Đã hủy</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 px-6 py-5 text-sm text-slate-300">
            Đang tải tổng quan đơn...
          </div>
        </div>
      )}

      {selectedOrderDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Tổng quan đơn</p>
                <h2 className="mt-1 text-2xl font-black text-white">Đơn #{selectedOrderDetail.id}</h2>
                <p className="text-sm text-slate-400">Ngày tạo: {formatDateTime(selectedOrderDetail.created_at)}</p>
              </div>
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 p-5 lg:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <h3 className="mb-3 flex items-center gap-2 font-bold text-white">
                    <User className="h-4 w-4 text-cyan-300" />
                    Khách thuê / mua
                  </h3>
                  <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                    <p><span className="text-slate-500">Tên:</span> <b className="text-white">{selectedOrderDetail.shipping_name || selectedOrderDetail.user_name}</b></p>
                    <p><span className="text-slate-500">Email:</span> <b className="text-white">{selectedOrderDetail.user_email || 'Chưa có'}</b></p>
                    <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-cyan-300" /> {selectedOrderDetail.shipping_phone || 'Chưa có'}</p>
                    <p><span className="text-slate-500">Địa chỉ:</span> <b className="text-white">{selectedOrderDetail.shipping_address || 'Chưa có'}</b></p>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <h3 className="mb-3 flex items-center gap-2 font-bold text-white">
                    <Package className="h-4 w-4 text-cyan-300" />
                    Sản phẩm trong đơn
                  </h3>
                  <div className="space-y-3">
                    {(selectedOrderDetail.items || []).map((item) => (
                      <div key={item.id} className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 md:grid-cols-[64px_1fr_auto]">
                        <img
                          src={item.image_url || '/images/placeholder-product.jpg'}
                          alt={item.product_name}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-bold text-white">{item.product_name}</p>
                          <p className="text-xs text-slate-400">
                            {item.type === 'RENT' ? 'Thuê' : 'Mua'} x{item.quantity}
                            {item.type === 'RENT' && ` | ${item.start_date || '?'} - ${item.end_date || '?'} | ${item.total_days || 0} ngày`}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">Đơn giá: {formatCurrency(item.unit_price)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-emerald-300">{formatCurrency(item.subtotal)}</p>
                          {item.type === 'RENT' && (
                            <p className="text-xs text-amber-300">Cọc: {formatCurrency(item.deposit_amount)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <aside className="space-y-4">
                <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <h3 className="font-bold text-white">Thanh toán</h3>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-4 text-slate-300">
                      <span>Tiền hàng</span>
                      <b className="text-white">{formatCurrency(selectedOrderDetail.total_amount || 0)}</b>
                    </div>
                    <div className="flex justify-between gap-4 text-slate-300">
                      <span>Tạm thu/cọc</span>
                      <b className="text-amber-300">{formatCurrency(selectedOrderDetail.total_deposit || 0)}</b>
                    </div>
                    <div className="border-t border-slate-800 pt-3">
                      <div className="flex justify-between gap-4 text-base">
                        <span className="font-bold text-white">Tổng thanh toán</span>
                        <b className="text-emerald-300">{formatCurrency(selectedOrderDetail.grand_total || 0)}</b>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <h3 className="font-bold text-white">Tình trạng</h3>
                  <div className="mt-3 space-y-3 text-sm text-slate-300">
                    <div className="flex items-center justify-between">
                      <span>Đơn hàng</span>
                      {statusBadge(selectedOrderDetail.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Phương thức</span>
                      <b className="text-white">
                        {['BANK', 'TRANSFER'].includes(selectedOrderDetail.payment_method) ? 'Chuyển khoản' : 'COD'}
                      </b>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Thanh toán</span>
                      <b className="text-white">{PAYMENT_STATUS_LABELS[selectedOrderDetail.payment_status] || selectedOrderDetail.payment_status || 'Chờ đối soát'}</b>
                    </div>
                    {selectedOrderDetail.return_date && (
                      <div className="flex items-center justify-between">
                        <span>Ngày trả</span>
                        <b className="text-white">{selectedOrderDetail.return_date}</b>
                      </div>
                    )}
                  </div>
                </section>

                {selectedOrderDetail.payment_method === 'TRANSFER' && (
                  <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <h3 className="font-bold text-white">Biên lai chuyển khoản</h3>
                    {selectedOrderDetail.payment_proof_url ? (
                      <div className="mt-3 space-y-3">
                        <a href={selectedOrderDetail.payment_proof_url} target="_blank" rel="noreferrer">
                          <img
                            src={selectedOrderDetail.payment_proof_url}
                            alt={`Biên lai đơn ${selectedOrderDetail.id}`}
                            className="max-h-72 w-full rounded-xl border border-slate-800 object-contain"
                          />
                        </a>
                        {selectedOrderDetail.payment_note && (
                          <p className="rounded-xl bg-slate-950 p-3 text-xs font-semibold text-slate-300">
                            Ghi chú: {selectedOrderDetail.payment_note}
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleReviewPayment('PAID')}
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-500"
                          >
                            Xác nhận tiền
                          </button>
                          <button
                            onClick={() => handleReviewPayment('REJECTED')}
                            className="rounded-xl bg-rose-600/20 px-3 py-2 text-xs font-black text-rose-300 hover:bg-rose-600 hover:text-white"
                          >
                            Từ chối
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 rounded-xl bg-slate-950 p-3 text-sm text-slate-400">
                        Khách chưa gửi ảnh biên lai.
                      </p>
                    )}
                  </section>
                )}
              </aside>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Xác nhận đổi trạng thái</h2>
            <p className="mt-2 text-sm text-slate-300">
              Đơn #{confirmAction.order.id} sẽ chuyển từ {STATUS_LABELS[confirmAction.order.status] || confirmAction.order.status} sang {STATUS_LABELS[confirmAction.newStatus] || confirmAction.newStatus}.
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
