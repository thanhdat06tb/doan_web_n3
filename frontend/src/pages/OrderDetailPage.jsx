import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, CreditCard, MapPin, Package, Phone, UploadCloud, User } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatters';
import { bankTransferConfig, buildTransferContent, buildVietQrUrl, isBankTransferConfigured } from '../utils/vietqr';

const statusLabels = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  RENTING: 'Đang thuê',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const statusClasses = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  RENTING: 'bg-teal-100 text-teal-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-rose-100 text-rose-800',
};

const paymentLabels = {
  CASH: 'Thanh toán khi nhận hàng',
  TRANSFER: 'Chuyển khoản',
};

const paymentStatusLabels = {
  UNPAID: 'Chưa gửi biên lai',
  PENDING_REVIEW: 'Đang chờ đối soát',
  PAID: 'Đã xác nhận thanh toán',
  REJECTED: 'Biên lai cần gửi lại',
};

const formatDateTime = (value) => {
  if (!value) return 'Chưa có';
  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatDate = (value) => {
  if (!value) return 'Không áp dụng';
  return new Date(value).toLocaleDateString('vi-VN');
};

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [proofNote, setProofNote] = useState('');
  const [proofUploading, setProofUploading] = useState(false);
  const [proofMessage, setProofMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchOrder = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/orders/${orderId}`);
        if (mounted && response.data.success) {
          setOrder(response.data.data);
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.error?.message || 'Không thể tải chi tiết đơn hàng.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOrder();
    return () => {
      mounted = false;
    };
  }, [orderId]);

  const paymentStatus = useMemo(() => {
    if (!order) return { label: 'Chưa xác định', className: 'bg-slate-100 text-slate-700' };
    if (order.payment_method === 'TRANSFER' && order.payment_status) {
      const className = {
        UNPAID: 'bg-slate-100 text-slate-700',
        PENDING_REVIEW: 'bg-amber-100 text-amber-800',
        PAID: 'bg-emerald-100 text-emerald-800',
        REJECTED: 'bg-rose-100 text-rose-800',
      }[order.payment_status] || 'bg-slate-100 text-slate-700';
      return { label: paymentStatusLabels[order.payment_status] || order.payment_status, className };
    }
    if (order.status === 'CANCELLED') return { label: 'Đã hủy thanh toán', className: 'bg-rose-100 text-rose-800' };
    if (order.status === 'COMPLETED') return { label: 'Đã thanh toán', className: 'bg-emerald-100 text-emerald-800' };
    return { label: 'Chờ xác nhận thanh toán', className: 'bg-amber-100 text-amber-800' };
  }, [order]);

  const orderTimeline = useMemo(() => {
    if (!order) return [];
    const steps = [
      { key: 'created', label: 'Đặt đơn', desc: formatDateTime(order.created_at), done: true },
      {
        key: 'payment',
        label: order.payment_method === 'TRANSFER' ? 'Đối soát chuyển khoản' : 'Thanh toán khi nhận',
        desc: order.payment_method === 'TRANSFER' ? paymentStatus.label : 'Thanh toán trực tiếp khi giao/nhận thiết bị',
        done: order.payment_method !== 'TRANSFER' || order.payment_status === 'PAID',
        current: order.payment_method === 'TRANSFER' && ['UNPAID', 'PENDING_REVIEW', 'REJECTED'].includes(order.payment_status),
      },
      { key: 'approved', label: 'Duyệt đơn', desc: 'Admin xác nhận đơn', done: ['APPROVED', 'RENTING', 'COMPLETED'].includes(order.status), current: order.status === 'PENDING' },
      { key: 'handover', label: 'Giao thiết bị', desc: 'Đơn thuê chuyển sang đang thuê', done: ['RENTING', 'COMPLETED'].includes(order.status), current: order.status === 'APPROVED' },
      { key: 'done', label: 'Hoàn tất', desc: order.return_date ? `Trả thực tế: ${formatDate(order.return_date)}` : 'Kiểm tra thiết bị và kết thúc đơn', done: order.status === 'COMPLETED', current: order.status === 'RENTING' },
    ];
    if (order.status === 'CANCELLED') {
      return [
        steps[0],
        { key: 'cancelled', label: 'Đã hủy', desc: 'Đơn hàng đã bị hủy', done: true, cancelled: true },
      ];
    }
    return steps;
  }, [order, paymentStatus.label]);

  const handleProofFileChange = (event) => {
    const file = event.target.files?.[0];
    setProofMessage('');
    setProofFile(null);
    setProofPreview('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setProofMessage('Vui lòng chọn ảnh biên lai dạng JPG, PNG hoặc WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProofMessage('Ảnh biên lai tối đa 5MB.');
      return;
    }
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = () => setProofPreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleSubmitPaymentProof = async () => {
    if (!proofFile || !proofPreview) {
      setProofMessage('Bạn cần chọn ảnh biên lai trước.');
      return;
    }
    setProofUploading(true);
    setProofMessage('');
    try {
      const response = await api.post(`/orders/${order.id}/payment-proof`, {
        fileName: proofFile.name,
        dataUrl: proofPreview,
        note: proofNote,
      });
      if (response.data.success) {
        setOrder(response.data.data);
        setProofFile(null);
        setProofPreview('');
        setProofNote('');
        setProofMessage('Đã gửi biên lai. Admin sẽ đối soát và xác nhận.');
      }
    } catch (err) {
      setProofMessage(err.response?.data?.error?.message || 'Không thể gửi biên lai.');
    } finally {
      setProofUploading(false);
    }
  };

  const transferInfo = useMemo(() => {
    if (!order || order.payment_method !== 'TRANSFER') return null;
    return {
      content: buildTransferContent(order.id, order.shipping_phone),
      qrUrl: buildVietQrUrl({
        amount: order.grand_total,
        orderId: order.id,
        phone: order.shipping_phone,
      }),
    };
  }, [order]);
  const hasDeposit = Number(order?.total_deposit || 0) > 0;

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#fff6e7]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#083344] border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[70vh] bg-[#fff6e7] px-4 py-24 text-center">
        <div className="mx-auto max-w-lg rounded-2xl border border-[#f3c17a] bg-white p-8 shadow-[0_18px_42px_rgba(126,50,13,0.12)]">
          <h1 className="text-2xl font-black text-[#07111f]">Không tải được đơn hàng</h1>
          <p className="mt-3 text-sm font-semibold text-[#4b3f39]">{error}</p>
          <Link to="/profile" className="mt-6 inline-flex rounded-full bg-[#083344] px-6 py-3 font-black text-white">
            Về lịch sử đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-[#fff6e7] px-4 py-10 text-[#07111f]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#ffcc32] px-5 py-2 text-xs font-black uppercase tracking-[0.16em]">
              <CheckCircle2 size={16} />
              Đơn hàng #{order.id}
            </p>
            <h1 className="text-3xl font-black tracking-tight">Chi tiết đơn hàng</h1>
            <p className="mt-2 text-sm font-semibold text-[#4b3f39]">Ngày đặt: {formatDateTime(order.created_at)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-4 py-2 text-sm font-black ${statusClasses[order.status] || 'bg-slate-100 text-slate-700'}`}>
              {statusLabels[order.status] || order.status}
            </span>
            <span className={`rounded-full px-4 py-2 text-sm font-black ${paymentStatus.className}`}>
              {paymentStatus.label}
            </span>
          </div>
        </div>

        <div className="mb-7 rounded-2xl border border-[#f3c17a] bg-white/92 p-5 shadow-[0_18px_40px_rgba(126,50,13,0.08)]">
          <h2 className="mb-4 text-lg font-black">Tiến trình đơn hàng</h2>
          <div className="grid gap-3 md:grid-cols-5">
            {orderTimeline.map((step) => (
              <div
                key={step.key}
                className={`rounded-2xl border p-4 ${
                  step.cancelled
                    ? 'border-rose-300 bg-rose-50'
                    : step.done
                      ? 'border-emerald-300 bg-emerald-50'
                      : step.current
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-[#f3c17a] bg-[#fff8e7]'
                }`}
              >
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${
                  step.cancelled
                    ? 'bg-rose-600 text-white'
                    : step.done
                      ? 'bg-emerald-600 text-white'
                      : step.current
                        ? 'bg-amber-400 text-[#07111f]'
                        : 'bg-white text-[#4b3f39]'
                }`}>
                  {step.done ? '✓' : '•'}
                </div>
                <p className="font-black text-[#07111f]">{step.label}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#4b3f39]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-[#f3c17a] bg-white/92 p-6 shadow-[0_18px_40px_rgba(126,50,13,0.10)]">
              <h2 className="mb-5 flex items-center gap-2 text-xl font-black">
                <Package className="text-[#0f766e]" />
                Sản phẩm trong đơn
              </h2>
              <div className="space-y-4">
                {(order.items || []).map((item) => (
                  <article key={item.id} className="grid gap-4 rounded-xl border border-[#f3c17a] bg-[#fffdf8] p-4 md:grid-cols-[96px_1fr]">
                    <img
                      src={item.product_image || '/images/bosch-gbh226.png'}
                      alt={item.product_name}
                      className="h-24 w-24 rounded-2xl object-cover"
                    />
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-black">{item.product_name}</p>
                          <p className="mt-1 text-sm font-semibold text-[#4b3f39]">
                            {item.type === 'RENT' ? 'Thuê theo ngày' : 'Mua'} x {item.quantity}
                          </p>
                        </div>
                        <p className="text-lg font-black text-[#0f766e]">{formatCurrency(item.subtotal)}</p>
                      </div>
                      <div className="mt-4 grid gap-3 text-sm font-semibold text-[#4b3f39] sm:grid-cols-2 lg:grid-cols-4">
                        <span>Đơn giá: <b className="text-[#07111f]">{formatCurrency(item.unit_price)}</b></span>
                        <span>Số lượng: <b className="text-[#07111f]">{item.quantity}</b></span>
                        {item.type === 'RENT' ? (
                          <>
                            <span>Từ: <b className="text-[#07111f]">{formatDate(item.start_date)}</b></span>
                            <span>Đến: <b className="text-[#07111f]">{formatDate(item.end_date)}</b></span>
                            <span>Số ngày: <b className="text-[#07111f]">{item.total_days}</b></span>
                            <span>Tiền cọc: <b className="text-[#07111f]">{formatCurrency(item.deposit_amount)}</b></span>
                          </>
                        ) : (
                          <span>Hình thức: <b className="text-[#07111f]">Mua đứt</b></span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#f3c17a] bg-white/92 p-6 shadow-[0_18px_40px_rgba(126,50,13,0.10)]">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
                <User className="text-[#0f766e]" />
                Thông tin khách hàng
              </h2>
              <div className="grid gap-4 text-sm font-semibold text-[#4b3f39] md:grid-cols-3">
                <div className="rounded-2xl bg-[#fff8e7] p-4">
                  <p className="mb-1 text-xs font-black uppercase tracking-[0.12em] text-[#9a3412]">Người nhận</p>
                  <p className="text-base font-black text-[#07111f]">{order.shipping_name}</p>
                </div>
                <div className="rounded-2xl bg-[#fff8e7] p-4">
                  <p className="mb-1 flex items-center gap-1 text-xs font-black uppercase tracking-[0.12em] text-[#9a3412]"><Phone size={14} /> Số điện thoại</p>
                  <p className="text-base font-black text-[#07111f]">{order.shipping_phone}</p>
                </div>
                <div className="rounded-2xl bg-[#fff8e7] p-4">
                  <p className="mb-1 flex items-center gap-1 text-xs font-black uppercase tracking-[0.12em] text-[#9a3412]"><MapPin size={14} /> Địa chỉ</p>
                  <p className="text-base font-black text-[#07111f]">{order.shipping_address}</p>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-[#f3c17a] bg-white/92 p-6 shadow-[0_18px_40px_rgba(126,50,13,0.10)]">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
                <CreditCard className="text-[#0f766e]" />
                Thanh toán
              </h2>
              <div className="space-y-3 text-sm font-semibold">
                <div className="flex justify-between gap-4">
                  <span className="text-[#4b3f39]">Phương thức</span>
                  <span className="text-right font-black">{paymentLabels[order.payment_method] || order.payment_method}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#4b3f39]">Tình trạng</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${paymentStatus.className}`}>{paymentStatus.label}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#4b3f39]">Tiền hàng</span>
                  <span className="font-black">{formatCurrency(order.total_amount)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#4b3f39]">Tiền cọc hoàn lại</span>
                  <span className="font-black">{formatCurrency(order.total_deposit)}</span>
                </div>
                <div className="border-t border-[#f3c17a] pt-4">
                  <div className="flex justify-between gap-4 text-lg">
                    <span className="font-black">{hasDeposit ? 'Tạm thu khi đặt' : 'Tổng thanh toán'}</span>
                    <span className="font-black text-[#0f766e]">{formatCurrency(order.grand_total)}</span>
                  </div>
                  {hasDeposit && (
                    <p className="mt-2 text-xs font-semibold leading-5 text-[#4b3f39]">
                      Tạm thu gồm tiền thuê/mua và tiền cọc. Cọc được hoàn lại sau khi hoàn tất kiểm tra thiết bị.
                    </p>
                  )}
                </div>
              </div>
              {transferInfo && (
                <div className="mt-5 rounded-2xl border border-[#f3c17a] bg-[#fff8e7] p-4">
                  <p className="mb-3 text-sm font-black uppercase tracking-[0.12em] text-[#9a3412]">QR chuyển khoản</p>
                  <div className="grid gap-4 sm:grid-cols-[150px_1fr] lg:grid-cols-1">
                    <div className="rounded-2xl bg-white p-3">
                      <img src={transferInfo.qrUrl} alt={`QR chuyển khoản đơn hàng ${order.id}`} className="mx-auto h-36 w-36 object-contain" />
                    </div>
                    <div className="space-y-2 text-sm font-semibold text-[#4b3f39]">
                      <p>Ngân hàng: <b className="text-[#07111f]">{bankTransferConfig.bankId}</b></p>
                      <p>Số tài khoản: <b className="text-[#07111f]">{bankTransferConfig.accountNo}</b></p>
                      <p>Chủ tài khoản: <b className="text-[#07111f]">{bankTransferConfig.accountName}</b></p>
                      <p>{hasDeposit ? 'Số tiền tạm thu' : 'Số tiền'}: <b className="text-[#0f766e]">{formatCurrency(order.grand_total)}</b></p>
                      <p>Nội dung: <b className="text-[#07111f]">{transferInfo.content}</b></p>
                    </div>
                  </div>
                  {!isBankTransferConfigured && (
                    <p className="mt-3 rounded-xl bg-amber-100 px-4 py-3 text-sm font-black text-amber-800">
                      QR đang dùng tài khoản mẫu. Cập nhật VITE_BANK_ACCOUNT_NO trong file .env để nhận tiền thật.
                    </p>
                  )}

                  <div className="mt-4 rounded-2xl border border-[#f3c17a] bg-white p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-sm font-black text-[#07111f]">
                        <UploadCloud size={18} className="text-[#0f766e]" />
                        Biên lai chuyển khoản
                      </p>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${paymentStatus.className}`}>
                        {paymentStatus.label}
                      </span>
                    </div>

                    {order.payment_proof_url && (
                      <div className="mb-4 rounded-2xl bg-[#fff8e7] p-3">
                        <img
                          src={order.payment_proof_url}
                          alt={`Biên lai đơn hàng ${order.id}`}
                          className="max-h-56 w-full rounded-xl object-contain"
                        />
                        {order.payment_confirmed_at && (
                          <p className="mt-2 text-xs font-semibold text-[#4b3f39]">
                            Đối soát lúc: <b>{formatDateTime(order.payment_confirmed_at)}</b>
                          </p>
                        )}
                      </div>
                    )}

                    {order.payment_status !== 'PAID' && order.status !== 'CANCELLED' && (
                      <div className="space-y-3">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleProofFileChange}
                          className="block w-full cursor-pointer rounded-2xl border border-[#f3c17a] bg-[#fff8e7] px-4 py-3 text-sm font-semibold text-[#07111f]"
                        />
                        {proofPreview && (
                          <img src={proofPreview} alt="Xem trước biên lai" className="max-h-48 w-full rounded-2xl border border-[#f3c17a] object-contain" />
                        )}
                        <textarea
                          value={proofNote}
                          onChange={(e) => setProofNote(e.target.value)}
                          placeholder="Ghi chú chuyển khoản, mã giao dịch nếu có..."
                          className="min-h-[86px] w-full rounded-2xl border border-[#f3c17a] bg-[#fff8e7] px-4 py-3 text-sm font-semibold outline-none focus:border-[#0f766e]"
                        />
                        <button
                          type="button"
                          disabled={proofUploading}
                          onClick={handleSubmitPaymentProof}
                          className="w-full rounded-2xl bg-[#083344] px-5 py-3 font-black text-white disabled:opacity-60"
                        >
                          {proofUploading ? 'Đang gửi...' : order.payment_status === 'REJECTED' ? 'Gửi lại biên lai' : 'Gửi biên lai'}
                        </button>
                      </div>
                    )}

                    {proofMessage && (
                      <p className={`mt-3 rounded-xl px-4 py-3 text-sm font-black ${
                        proofMessage.includes('Đã gửi') ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {proofMessage}
                      </p>
                    )}
                    {order.payment_note && (
                      <p className="mt-3 rounded-xl bg-[#fff8e7] px-4 py-3 text-sm font-semibold text-[#4b3f39]">
                        Ghi chú đối soát: <b className="text-[#07111f]">{order.payment_note}</b>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#f3c17a] bg-white/92 p-6 shadow-[0_18px_40px_rgba(126,50,13,0.10)]">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
                <CalendarDays className="text-[#0f766e]" />
                Mốc thời gian
              </h2>
              <div className="space-y-3 text-sm font-semibold text-[#4b3f39]">
                <p>Đặt lúc: <b className="text-[#07111f]">{formatDateTime(order.created_at)}</b></p>
                <p>Cập nhật: <b className="text-[#07111f]">{formatDateTime(order.updated_at)}</b></p>
                {order.return_date && <p>Ngày trả thực tế: <b className="text-[#07111f]">{formatDate(order.return_date)}</b></p>}
                {order.note && <p>Ghi chú đặt hàng: <b className="text-[#07111f]">{order.note}</b></p>}
                {order.return_note && <p>Ghi chú trả hàng: <b className="text-[#07111f]">{order.return_note}</b></p>}
              </div>
            </div>

            <div className="flex gap-3">
              <Link to="/profile" className="flex-1 rounded-2xl border border-[#083344] px-5 py-3 text-center font-black text-[#083344]">
                Lịch sử
              </Link>
              <Link to="/catalog" className="flex-1 rounded-2xl bg-[#083344] px-5 py-3 text-center font-black text-white">
                Mua tiếp
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
