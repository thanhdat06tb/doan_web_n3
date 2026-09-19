import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import api from '../../utils/api';

const ReturnProcessingModal = ({ order, onClose, onSuccess }) => {
  const rentedItems = (order.items || []).filter(item => item.type === 'RENT');
  
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 10));
  const [returnNote, setReturnNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Track conditions per item: { [detailId]: { condition: 'GOOD'|'DAMAGED'|'LOST', deductAmount: 0, damageNote: '' } }
  const [itemConditions, setItemConditions] = useState(() => {
    const init = {};
    rentedItems.forEach(item => {
      init[item.id] = {
        condition: 'GOOD',
        deductAmount: 0,
        damageNote: '',
      };
    });
    return init;
  });

  const handleConditionChange = (detailId, field, value) => {
    setItemConditions(prev => ({
      ...prev,
      [detailId]: {
        ...prev[detailId],
        [field]: value,
      },
    }));
  };

  // Live calculations
  let totalLateFee = 0;
  let totalDeduction = 0;

  rentedItems.forEach(item => {
    // Late fee
    if (item.end_date && returnDate > item.end_date) {
      const endD = new Date(item.end_date);
      const retD = new Date(returnDate);
      const diffDays = Math.max(0, Math.ceil((retD - endD) / (1000 * 60 * 60 * 24)));
      totalLateFee += diffDays * item.price_rent_per_day * item.quantity;
    }

    const cond = itemConditions[item.id];
    if (cond) {
      if (cond.condition === 'DAMAGED') {
        totalDeduction += Number(cond.deductAmount || 0);
      } else if (cond.condition === 'LOST') {
        totalDeduction += Number(item.deposit_amount * item.quantity || 0);
      }
    }
  });

  const totalDeposit = order.total_deposit || 0;
  const totalRefund = Math.max(0, totalDeposit - totalDeduction - totalLateFee);
  const extraCharge = (totalDeduction + totalLateFee > totalDeposit)
    ? (totalDeduction + totalLateFee - totalDeposit)
    : 0;

  const handleSubmit = async () => {
    if (rentedItems.length === 0) {
      setErrorMsg('Đơn hàng này không có sản phẩm thuê để xử lý cọc. Hãy hoàn tất đơn mua từ bảng quản lý đơn hàng.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        returnDate,
        returnNote,
        itemConditions: Object.entries(itemConditions).map(([orderDetailId, cond]) => ({
          orderDetailId: parseInt(orderDetailId, 10),
          condition: cond.condition,
          deductAmount: Number(cond.deductAmount || 0),
          damageNote: cond.damageNote,
        })),
      };

      const response = await api.post(`/admin/orders/${order.id}/complete`, payload);
      if (response.data.success) {
        onSuccess();
      } else {
        throw new Error(response.data.error?.message || 'Có lỗi xảy ra.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || err.message || 'Lỗi xử lý hoàn tất đơn hàng.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              Quy Trình Hoàn Tất Thuê & Xử Lý Cọc
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Đơn hàng #{order.id} — {order.shipping_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Ngày trả thực tế */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              Ngày trả thực tế:
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={e => setReturnDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Danh sách thiết bị thuê & Kiểm định */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider text-xs">
              Kiểm định tình trạng thiết bị
            </h4>
            <div className="space-y-3">
              {rentedItems.length === 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm font-semibold text-amber-200">
                  Đơn hàng này là đơn mua, không có sản phẩm thuê để kiểm định/trả cọc.
                </div>
              )}
              {rentedItems.map(item => {
                const cond = itemConditions[item.id] || {};
                return (
                  <div key={item.id} className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white text-sm">{item.product_name}</p>
                        <p className="text-xs text-slate-400">
                          Số lượng: {item.quantity} | Cọc: {formatCurrency(item.deposit_amount * item.quantity)}
                        </p>
                      </div>
                      <select
                        value={cond.condition}
                        onChange={e => handleConditionChange(item.id, 'condition', e.target.value)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border focus:outline-none ${
                          cond.condition === 'GOOD'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : cond.condition === 'DAMAGED'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}
                      >
                        <option value="GOOD" className="bg-slate-900 text-white">✅ Nguyên vẹn (GOOD)</option>
                        <option value="DAMAGED" className="bg-slate-900 text-white">⚠️ Hư hỏng (DAMAGED)</option>
                        <option value="LOST" className="bg-slate-900 text-white">❌ Mất thiết bị (LOST)</option>
                      </select>
                    </div>

                    {cond.condition === 'DAMAGED' && (
                      <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Số tiền khấu trừ (VNĐ):</label>
                          <input
                            type="number"
                            min="0"
                            value={cond.deductAmount}
                            onChange={e => handleConditionChange(item.id, 'deductAmount', e.target.value)}
                            placeholder="Nhập số tiền..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Ghi chú hư hỏng:</label>
                          <input
                            type="text"
                            value={cond.damageNote}
                            onChange={e => handleConditionChange(item.id, 'damageNote', e.target.value)}
                            placeholder="Vết xước, móp lề..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ghi chú chung */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1 uppercase">Ghi chú trả hàng:</label>
            <textarea
              rows="2"
              value={returnNote}
              onChange={e => setReturnNote(e.target.value)}
              placeholder="Ghi chú bổ sung..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
            ></textarea>
          </div>

          {/* Bảng tóm tắt tài chính hoàn cọc realtime */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-sm">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Tổng kết Tiền cọc & Thanh toán
            </h4>
            <div className="flex justify-between text-slate-400 text-xs">
              <span>Tổng tiền cọc đã thu:</span>
              <span className="font-semibold text-slate-200">{formatCurrency(totalDeposit)}</span>
            </div>
            {totalLateFee > 0 && (
              <div className="flex justify-between text-amber-400 text-xs">
                <span>Phí trả trễ hạn:</span>
                <span className="font-semibold">+{formatCurrency(totalLateFee)}</span>
              </div>
            )}
            {totalDeduction > 0 && (
              <div className="flex justify-between text-rose-400 text-xs">
                <span>Khấu trừ hư hỏng / mất đồ:</span>
                <span className="font-semibold">+{formatCurrency(totalDeduction)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-base">
              <span className="text-emerald-400">Tiền cọc HOÀN TRẢ lại khách:</span>
              <span className="text-emerald-400">{formatCurrency(totalRefund)}</span>
            </div>
            {extraCharge > 0 && (
              <div className="flex justify-between text-rose-400 font-bold text-xs pt-1">
                <span>Khách cần THANH TOÁN THÊM:</span>
                <span>{formatCurrency(extraCharge)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rentedItems.length === 0}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {submitting ? 'Đang xử lý...' : 'Xác Nhận Hoàn Tất Thuê'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnProcessingModal;
