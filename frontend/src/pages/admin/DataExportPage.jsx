import React, { useState } from 'react';
import { Database, Download, FileSpreadsheet, Filter, TableProperties } from 'lucide-react';
import api from '../../utils/api';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'RENTING', label: 'Đang thuê' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const DATASETS = [
  {
    type: 'order-items',
    title: 'Chi tiết từng dòng sản phẩm trong đơn',
    description: 'Dataset quan trọng nhất cho bài khoa học dữ liệu: mỗi dòng là một sản phẩm trong đơn, kèm khách hàng, ngày thuê, giá, cọc, thanh toán và tình trạng trả hàng.',
    columns: 'order_id, customer, product, category, item_type, quantity, dates, subtotal, deposit, payment_status...',
    icon: TableProperties,
    primary: true,
  },
  {
    type: 'orders',
    title: 'Tổng quan đơn hàng',
    description: 'Mỗi dòng là một đơn hàng, phù hợp để phân tích số đơn theo ngày, tổng thanh toán, trạng thái đơn và hành vi thanh toán.',
    columns: 'order_id, order_date, status, payment_method, item_count, grand_total, product_names...',
    icon: FileSpreadsheet,
  },
  {
    type: 'product-performance',
    title: 'Hiệu suất sản phẩm',
    description: 'Tổng hợp theo sản phẩm để phân tích thiết bị nào bán/thuê tốt, doanh thu, số ngày thuê và tỷ lệ hủy.',
    columns: 'product_id, category, sold_quantity, rented_quantity, rental_unit_days, revenue...',
    icon: Database,
  },
];

function buildFilename(type) {
  const today = new Date().toISOString().slice(0, 10);
  return `gear-rental-${type}-${today}.csv`;
}

const DataExportPage = () => {
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    status: 'ALL',
  });
  const [downloading, setDownloading] = useState('');
  const [message, setMessage] = useState('');

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
    setMessage('');
  };

  const downloadDataset = async (type) => {
    setDownloading(type);
    setMessage('');
    try {
      const response = await api.get(`/admin/export/${type}.csv`, {
        params: {
          from: filters.from || undefined,
          to: filters.to || undefined,
          status: filters.status,
        },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', buildFilename(type));
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      const savedReportPath = response.headers['x-report-path'];
      setMessage(
        savedReportPath
          ? `Đã tạo file CSV và lưu thêm một bản trong dự án tại ${savedReportPath}.`
          : 'Đã tạo file CSV. Bạn có thể mở bằng Excel hoặc đọc bằng pandas.'
      );
    } catch (error) {
      setMessage(error.response?.data?.error?.message || error.message || 'Không thể xuất dữ liệu.');
    } finally {
      setDownloading('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Data export</p>
          <h1 className="mt-2 text-2xl font-black text-white">Xuất dữ liệu phân tích</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Tải dataset dạng CSV chi tiết để làm bài tập lớn, viết script Python clean data, thống kê hiệu suất thuê/mua và phân tích doanh thu.
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-300">
            <Filter className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-white">Bộ lọc dữ liệu xuất</h2>
            <p className="text-xs text-slate-400">Bỏ trống ngày nếu muốn xuất toàn bộ dữ liệu.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Từ ngày</span>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => updateFilter('from', e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Đến ngày</span>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => updateFilter('to', e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Trạng thái đơn</span>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-3">
        {DATASETS.map((dataset) => {
          const Icon = dataset.icon;
          const isLoading = downloading === dataset.type;
          return (
            <article
              key={dataset.type}
              className={`flex min-h-[300px] flex-col rounded-2xl border p-5 shadow-lg ${
                dataset.primary
                  ? 'border-cyan-400/40 bg-cyan-400/10'
                  : 'border-slate-800 bg-slate-950'
              }`}
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="rounded-xl bg-slate-900 p-3 text-cyan-300 ring-1 ring-slate-800">
                  <Icon className="h-6 w-6" />
                </div>
                {dataset.primary && (
                  <span className="rounded-full bg-cyan-300 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-950">
                    Nên dùng
                  </span>
                )}
              </div>

              <h2 className="text-lg font-black text-white">{dataset.title}</h2>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-300">{dataset.description}</p>
              <p className="mt-4 rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs leading-5 text-slate-400">
                <b className="text-slate-200">Cột chính:</b> {dataset.columns}
              </p>

              <button
                type="button"
                onClick={() => downloadDataset(dataset.type)}
                disabled={Boolean(downloading)}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-black text-slate-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {isLoading ? 'Đang tạo file...' : 'Tải CSV'}
              </button>
            </article>
          );
        })}
      </div>

      {message && (
        <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100">
          {message}
        </div>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm leading-7 text-slate-300">
        <h2 className="text-lg font-black text-white">Gợi ý đọc bằng Python</h2>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-200">
{`import pandas as pd

df = pd.read_csv("gear-rental-order-items.csv", sep=";", skiprows=1)
df["order_date"] = pd.to_datetime(df["order_date"])
df["subtotal"] = pd.to_numeric(df["subtotal"], errors="coerce").fillna(0)

revenue_by_category = df.groupby("category_name")["subtotal"].sum()
rent_efficiency = df[df["item_type"] == "RENT"].groupby("product_name")["rental_unit_days"].sum()
print(revenue_by_category.sort_values(ascending=False))`}
        </pre>
      </section>
    </div>
  );
};

export default DataExportPage;
