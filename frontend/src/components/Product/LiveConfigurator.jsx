import React, { useEffect, useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { CalendarDays, CheckCircle2, Loader2, Minus, Plus, ShoppingCart, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useDateBlocker } from '../../hooks/useDateBlocker';
import { useProductAvailability } from '../../hooks/useProductAvailability';
import { formatCurrency, calculateRentalDays } from '../../utils/formatters';
import { useCart } from '../../hooks/useCart';

const formatDate = (date) => (date ? format(date, 'dd/MM/yyyy') : '--');

const LiveConfigurator = ({ product }) => {
  const { addToCart } = useCart();
  const [type, setType] = useState(product.price_rent_per_day > 0 ? 'RENT' : 'BUY');
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState(null);

  const isRentable = product.price_rent_per_day > 0;
  const isBuyable = product.price_sell > 0;

  const { blockedDates, loading: loadingBlocker, error: blockerError } = useDateBlocker(type === 'RENT' ? product.id : null);
  const { data: availData, loading: loadingAvail, error: availError } = useProductAvailability(
    type === 'RENT' && dateRange.from && dateRange.to ? product.id : null,
    dateRange.from,
    dateRange.to,
    quantity
  );

  const rentalDays = calculateRentalDays(dateRange.from, dateRange.to);
  const rentTotal = (product.price_rent_per_day || 0) * rentalDays * quantity;
  const depositTotal = (product.deposit_amount || 0) * quantity;
  const buyTotal = (product.price_sell || 0) * quantity;
  const grandTotal = type === 'BUY' ? buyTotal : rentTotal + depositTotal;

  const maxQty = useMemo(() => {
    if (type === 'BUY') return product.stock_quantity || 1;
    if (availData?.availableQty !== undefined) return Math.max(0, availData.availableQty);
    return product.stock_quantity || 1;
  }, [availData?.availableQty, product.stock_quantity, type]);

  const hasFullRentRange = type === 'RENT' && dateRange.from && dateRange.to;
  const isAvailableForRent = type === 'RENT' && hasFullRentRange && availData?.available;
  const isFormValid = type === 'BUY' ? quantity > 0 : isAvailableForRent && quantity > 0;

  useEffect(() => {
    if (quantity > maxQty) setQuantity(Math.max(1, maxQty));
  }, [maxQty, quantity]);

  const handleTypeChange = (nextType) => {
    setType(nextType);
    setQuantity(1);
    setDateRange({ from: undefined, to: undefined });
  };

  const handleAddToCart = () => {
    if (!isFormValid) return;

    addToCart({
      productId: product.id,
      name: product.name,
      price: type === 'BUY' ? product.price_sell : product.price_rent_per_day,
      quantity,
      type,
      startDate: type === 'RENT' ? dateRange.from : undefined,
      endDate: type === 'RENT' ? dateRange.to : undefined,
      deposit: type === 'RENT' ? product.deposit_amount : 0,
      image: product.image_url,
    });

    setToast('Đã thêm sản phẩm vào giỏ hàng.');
    window.setTimeout(() => setToast(null), 2600);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5">
        <p className="mb-2 text-sm font-bold text-blue-700">{product.category_name || 'Sản phẩm'}</p>
        <h1 className="text-2xl font-black leading-tight text-slate-950 md:text-3xl">{product.name}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Chọn mua đứt hoặc thuê theo ngày. Hệ thống sẽ kiểm tra lịch thuê trước khi cho thêm vào giỏ.
        </p>
      </div>

      <div className="space-y-5">
        <section>
          <h2 className="mb-2 text-sm font-black text-slate-800">1. Hình thức</h2>
          <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => handleTypeChange('BUY')}
              disabled={!isBuyable}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                type === 'BUY' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              Mua đứt
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('RENT')}
              disabled={!isRentable}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                type === 'RENT' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              Thuê theo ngày
            </button>
          </div>
        </section>

        {type === 'RENT' && (
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-black text-slate-800">
                <CalendarDays className="h-4 w-4 text-blue-600" />
                2. Lịch thuê
              </h2>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">
                {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
              </span>
            </div>

            {loadingBlocker ? (
              <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                <DayPicker
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                  numberOfMonths={1}
                  disabled={[{ before: new Date() }, ...blockedDates]}
                  modifiersClassNames={{
                    selected: 'bg-blue-600 text-white',
                    range_start: 'bg-blue-700 text-white',
                    range_end: 'bg-blue-700 text-white',
                    range_middle: 'bg-blue-100 text-blue-900',
                    disabled: 'line-through opacity-30',
                  }}
                  className="mx-auto"
                />
              </div>
            )}

            <div className="mt-3 min-h-6 text-sm font-semibold" role={availError || blockerError ? 'alert' : undefined}>
              {loadingAvail && (
                <span className="inline-flex items-center gap-2 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang kiểm tra lịch thuê...
                </span>
              )}
              {(availError || blockerError) && !loadingAvail && (
                <span className="inline-flex items-center gap-2 text-rose-600">
                  <XCircle className="h-4 w-4" />
                  {availError || 'Không tải được lịch bị chặn.'}
                </span>
              )}
              {isAvailableForRent && !loadingAvail && (
                <span className="inline-flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Có thể thuê, còn {availData.availableQty} sản phẩm trong khoảng này.
                </span>
              )}
              {hasFullRentRange && !loadingAvail && !availError && !availData?.available && (
                <span className="inline-flex items-center gap-2 text-rose-600">
                  <XCircle className="h-4 w-4" />
                  Khoảng ngày này đã hết hàng, vui lòng chọn ngày khác.
                </span>
              )}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-2 text-sm font-black text-slate-800">{type === 'RENT' ? '3' : '2'}. Số lượng</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 items-center overflow-hidden rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                disabled={quantity <= 1 || (type === 'RENT' && !hasFullRentRange)}
                className="flex h-full w-11 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Giảm số lượng"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center text-sm font-black text-slate-950">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.min(maxQty, current + 1))}
                disabled={quantity >= maxQty || maxQty <= 0 || (type === 'RENT' && !hasFullRentRange)}
                className="flex h-full w-11 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Tăng số lượng"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-sm font-semibold text-slate-500">
              Có sẵn: {maxQty}
            </span>
          </div>
        </section>

        <section className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <h2 className="mb-3 text-sm font-black text-blue-950">Tóm tắt chi phí</h2>
          <div className="space-y-2 text-sm text-blue-900">
            {type === 'RENT' ? (
              <>
                <div className="flex justify-between gap-4"><span>Số ngày thuê</span><strong>{rentalDays} ngày</strong></div>
                <div className="flex justify-between gap-4"><span>Đơn giá thuê/ngày</span><strong>{formatCurrency(product.price_rent_per_day)}</strong></div>
                <div className="flex justify-between gap-4"><span>Tiền thuê</span><strong>{formatCurrency(rentTotal)}</strong></div>
                <div className="flex justify-between gap-4 text-orange-700"><span>Tiền cọc hoàn lại</span><strong>{formatCurrency(depositTotal)}</strong></div>
              </>
            ) : (
              <div className="flex justify-between gap-4"><span>Giá mua</span><strong>{formatCurrency(buyTotal)}</strong></div>
            )}
            <div className="my-3 border-t border-blue-200" />
            <div className="flex justify-between gap-4 text-lg font-black text-blue-950">
              <span>Tổng cần chuẩn bị</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
            {type === 'RENT' && (
              <p className="pt-1 text-xs font-semibold text-blue-700">
                Tiền cọc sẽ được hoàn trả sau khi thiết bị được trả đúng hạn và nguyên vẹn.
              </p>
            )}
          </div>
        </section>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!isFormValid || loadingAvail}
          className="sticky bottom-3 z-10 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none md:static"
        >
          <ShoppingCart className="h-5 w-5" />
          Thêm vào giỏ hàng
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-xl" role="status">
          {toast}
        </div>
      )}
    </div>
  );
};

export default LiveConfigurator;
