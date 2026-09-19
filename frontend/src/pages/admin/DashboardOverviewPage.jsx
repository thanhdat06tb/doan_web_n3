import React, { useCallback, useEffect, useState } from 'react';
import {
  DollarSign,
  Package,
  ShieldAlert,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import api from '../../utils/api';

const emptySummary = {
  revenue: {
    totalSell: 0,
    totalRent: 0,
    thisMonth: 0,
    lastMonth: 0,
    growthPercent: 0,
  },
  deposits: {
    totalHolding: 0,
    totalReturned: 0,
    riskAmount: 0,
  },
  orders: {
    PENDING: 0,
    APPROVED: 0,
    RENTING: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  },
  payments: {
    UNPAID: 0,
    PENDING_REVIEW: 0,
    PAID: 0,
    REJECTED: 0,
  },
  topRentedProducts: [],
};

const normalizeSummary = (data) => ({
  revenue: { ...emptySummary.revenue, ...(data?.revenue || {}) },
  deposits: { ...emptySummary.deposits, ...(data?.deposits || {}) },
  orders: { ...emptySummary.orders, ...(data?.orders || {}) },
  payments: { ...emptySummary.payments, ...(data?.payments || {}) },
  topRentedProducts: Array.isArray(data?.topRentedProducts) ? data.topRentedProducts : [],
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getWithRetry = async (url, retries = 2) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await api.get(url);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(350 * (attempt + 1));
      }
    }
  }
  throw lastError;
};

const emptyAnalytics = {
  categories: [],
  revenueByCategory: [],
  dailyRevenue: [],
  transactionMix: [],
  topRentalDays: [],
};

const formatShortCurrency = (value) => {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `${Math.round(amount / 1000000)}tr`;
  if (amount >= 1000) return `${Math.round(amount / 1000)}k`;
  return String(amount);
};

const PIE_COLORS = {
  BUY: '#38bdf8',
  RENT: '#f59e0b',
};

const DashboardOverviewPage = () => {
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const [overdueOrders, setOverdueOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [period, setPeriod] = useState('30d');
  const [analyticsFilters, setAnalyticsFilters] = useState({
    period: '30d',
    categoryId: 'ALL',
    status: 'ALL',
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const analyticsParams = new URLSearchParams({
        period: analyticsFilters.period,
        categoryId: analyticsFilters.categoryId,
        status: analyticsFilters.status,
      });

      const [sumResult, chartResult, overdueResult, lowStockResult, analyticsResult] = await Promise.allSettled([
        getWithRetry('/admin/dashboard/summary'),
        getWithRetry(`/admin/dashboard/revenue-chart?period=${period}`),
        getWithRetry('/admin/dashboard/overdue-orders'),
        getWithRetry('/admin/dashboard/low-stock'),
        getWithRetry(`/admin/dashboard/analytics?${analyticsParams.toString()}`),
      ]);

      const sumRes = sumResult.status === 'fulfilled' ? sumResult.value : null;
      const chartRes = chartResult.status === 'fulfilled' ? chartResult.value : null;
      const overdueRes = overdueResult.status === 'fulfilled' ? overdueResult.value : null;
      const lowStockRes = lowStockResult.status === 'fulfilled' ? lowStockResult.value : null;
      const analyticsRes = analyticsResult.status === 'fulfilled' ? analyticsResult.value : null;

      if (sumRes?.data?.success) {
        setSummary(normalizeSummary(sumRes.data.data));
      }
      if (chartRes?.data?.success) {
        const labels = Array.isArray(chartRes.data.data?.labels) ? chartRes.data.data.labels : [];
        const sellData = Array.isArray(chartRes.data.data?.sellData) ? chartRes.data.data.sellData : [];
        const rentData = Array.isArray(chartRes.data.data?.rentData) ? chartRes.data.data.rentData : [];
        const formatted = labels.map((label, idx) => ({
          date: label,
          'Doanh thu Bán': sellData[idx] || 0,
          'Doanh thu Thuê': rentData[idx] || 0,
        }));
        setChartData(formatted);
      }
      if (overdueRes?.data?.success) {
        setOverdueOrders(overdueRes.data.data || []);
      }
      if (lowStockRes?.data?.success) {
        setLowStockProducts(lowStockRes.data.data || []);
      }
      if (analyticsRes?.data?.success) {
        setAnalytics({
          ...emptyAnalytics,
          ...(analyticsRes.data.data || {}),
        });
      }

      if (sumResult.status === 'rejected' && chartResult.status === 'rejected') {
        throw sumResult.reason || chartResult.reason;
      }

      if (sumResult.status === 'rejected' || chartResult.status === 'rejected' || overdueResult.status === 'rejected' || lowStockResult.status === 'rejected' || analyticsResult.status === 'rejected') {
        console.warn('Some admin dashboard widgets failed to load', {
          summary: sumResult.status,
          chart: chartResult.status,
          overdue: overdueResult.status,
          lowStock: lowStockResult.status,
          analytics: analyticsResult.status,
        });
        setLoadError('Một vài khối dữ liệu chưa tải kịp. Bạn có thể đổi bộ lọc hoặc tải lại sau vài giây.');
      }
    } catch (error) {
      if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') {
        console.error('Failed to fetch admin dashboard data', error);
        setLoadError('Chưa tải được dữ liệu dashboard. Kiểm tra backend hoặc thử tải lại sau vài giây.');
        return;
      }

      console.warn('Backend not responding, using mock admin summary data', error.message);
      setSummary(normalizeSummary({
        revenue: {
          totalSell: 45000000,
          totalRent: 28500000,
          thisMonth: 18400000,
          lastMonth: 14200000,
          growthPercent: 29.5,
        },
        deposits: {
          totalHolding: 12000000,
          totalReturned: 34000000,
          riskAmount: 2500000,
        },
        orders: {
          PENDING: 3,
          APPROVED: 5,
          RENTING: 8,
          COMPLETED: 42,
          CANCELLED: 2,
        },
        topRentedProducts: [
          { productId: 1, name: 'Máy Ảnh Sony Alpha A7 IV', totalRentals: 24, totalRevenue: 12000000 },
          { productId: 2, name: 'Ống Kính Sony FE 24-70mm F2.8 GM II', totalRentals: 18, totalRevenue: 9000000 },
          { productId: 3, name: 'Flycam DJI Mavic 3 Pro', totalRentals: 12, totalRevenue: 7500000 },
          { productId: 4, name: 'Đèn Quay Phim Godox SL60W', totalRentals: 9, totalRevenue: 1800000 },
        ],
      }));

      // Mock Chart Data
      setChartData([
        { date: '01/09', 'Doanh thu Bán': 2000000, 'Doanh thu Thuê': 1500000 },
        { date: '03/09', 'Doanh thu Bán': 1500000, 'Doanh thu Thuê': 2200000 },
        { date: '05/09', 'Doanh thu Bán': 3000000, 'Doanh thu Thuê': 1800000 },
        { date: '07/09', 'Doanh thu Bán': 4000000, 'Doanh thu Thuê': 3500000 },
        { date: '09/09', 'Doanh thu Bán': 2500000, 'Doanh thu Thuê': 2900000 },
        { date: '11/09', 'Doanh thu Bán': 5000000, 'Doanh thu Thuê': 4100000 },
      ]);
    } finally {
      setLoading(false);
    }
  }, [period, analyticsFilters]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading && chartData.length === 0 && !summary) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        Đang tải dữ liệu tổng quan...
      </div>
    );
  }

  const { revenue, deposits, orders, payments, topRentedProducts } = summary || emptySummary;
  const chartRangeLabel = chartData.length > 0
    ? `${chartData[0].date} đến ${chartData[chartData.length - 1].date}`
    : 'chưa có dữ liệu';

  const updateAnalyticsFilter = (key, value) => {
    setAnalyticsFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };
  const revenueByCategoryData = (analytics.revenueByCategory || []).map((item) => ({
    ...item,
    categoryLabel: item.categoryName || 'Chưa phân loại',
    buyRevenue: Number(item.buyRevenue || 0),
    rentRevenue: Number(item.rentRevenue || 0),
    totalRevenue: Number(item.totalRevenue || 0),
  }));
  const dailyAnalyticsData = (analytics.dailyRevenue || []).map((item) => ({
    ...item,
    buyRevenue: Number(item.buyRevenue || 0),
    rentRevenue: Number(item.rentRevenue || 0),
    totalRevenue: Number(item.totalRevenue || 0),
  }));
  const transactionMixData = (analytics.transactionMix || []).map((item) => ({
    ...item,
    typeLabel: item.type === 'BUY' ? 'Mua bán' : 'Cho thuê',
    revenue: Number(item.revenue || 0),
    lineCount: Number(item.lineCount || 0),
  }));
  const topRentalDaysData = (analytics.topRentalDays || []).map((item) => ({
    ...item,
    productLabel: item.productName?.length > 28 ? `${item.productName.slice(0, 28)}...` : item.productName,
    rentalUnitDays: Number(item.rentalUnitDays || 0),
    rentRevenue: Number(item.rentRevenue || 0),
  }));

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Tổng Quan Báo Cáo & Thống Kê</h1>
          <p className="text-xs text-slate-400 mt-1">Cập nhật realtime từ cơ sở dữ liệu SQLite</p>
          {loadError && (
            <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200">
              {loadError}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '12m'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                period === p
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">Chờ đối soát</p>
          <p className="mt-2 text-3xl font-black text-white">{payments?.PENDING_REVIEW || 0}</p>
          <p className="mt-1 text-xs font-semibold text-slate-300">biên lai chuyển khoản cần admin kiểm tra</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Đã nhận tiền</p>
          <p className="mt-2 text-3xl font-black text-white">{payments?.PAID || 0}</p>
          <p className="mt-1 text-xs font-semibold text-slate-300">đơn chuyển khoản đã được xác nhận</p>
        </div>
        <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-5 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-200">Cần gửi lại</p>
          <p className="mt-2 text-3xl font-black text-white">{payments?.REJECTED || 0}</p>
          <p className="mt-1 text-xs font-semibold text-slate-300">biên lai bị từ chối hoặc chưa hợp lệ</p>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Doanh thu tháng */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Doanh Thu Tháng Này</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{formatCurrency(revenue?.thisMonth || 0)}</p>
          <div className="mt-3 flex items-center gap-2 text-xs">
            {revenue?.growthPercent >= 0 ? (
              <span className="flex items-center text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />+{revenue?.growthPercent}%
              </span>
            ) : (
              <span className="flex items-center text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded-md">
                <TrendingDown className="w-3.5 h-3.5 mr-1" />{revenue?.growthPercent}%
              </span>
            )}
            <span className="text-slate-500">so với tháng trước</span>
          </div>
        </div>

        {/* Card 2: Đơn đang thuê */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Đơn Hàng Đang Thuê</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{orders?.RENTING || 0} <span className="text-xs font-normal text-slate-400">đơn</span></p>
          <div className="mt-3 text-xs text-slate-400">
            Chờ duyệt: <span className="text-amber-300 font-bold">{orders?.PENDING || 0}</span> | Đã duyệt: <span className="text-blue-300 font-bold">{orders?.APPROVED || 0}</span>
          </div>
        </div>

        {/* Card 3: Tiền cọc đang giữ */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Tiền Cọc Đang Giữ</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{formatCurrency(deposits?.totalHolding || 0)}</p>
          <div className="mt-3 text-xs text-slate-400 flex items-center justify-between">
            <span>Đã hoàn trả:</span>
            <span className="font-semibold text-emerald-400">{formatCurrency(deposits?.totalReturned || 0)}</span>
          </div>
        </div>

        {/* Card 4: Rủi ro Cọc quá hạn */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Cọc Đơn Quá Hạn</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-400">{formatCurrency(deposits?.riskAmount || 0)}</p>
          <div className="mt-3 text-xs text-rose-400/80 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            Cần liên hệ khách hoàn trả đồ
          </div>
        </div>
      </div>

      {/* Biểu đồ Doanh Thu */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-lg">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Excel analytics</p>
            <h3 className="mt-2 text-xl font-black text-white">Dashboard phân tích hiệu suất</h3>
            <p className="mt-1 text-xs text-slate-400">
              Lọc theo thời gian, danh mục và trạng thái để biểu đồ tự cập nhật như dashboard Excel.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Khoảng thời gian
              <select
                value={analyticsFilters.period}
                onChange={(event) => updateAnalyticsFilter('period', event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-bold normal-case tracking-normal text-white outline-none focus:border-cyan-400"
              >
                <option value="7d">7 ngày gần nhất</option>
                <option value="30d">30 ngày gần nhất</option>
                <option value="12m">12 tháng gần nhất</option>
              </select>
            </label>
            <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Danh mục
              <select
                value={analyticsFilters.categoryId}
                onChange={(event) => updateAnalyticsFilter('categoryId', event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-bold normal-case tracking-normal text-white outline-none focus:border-cyan-400"
              >
                <option value="ALL">Tất cả danh mục</option>
                {(analytics.categories || []).map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Trạng thái đơn
              <select
                value={analyticsFilters.status}
                onChange={(event) => updateAnalyticsFilter('status', event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-bold normal-case tracking-normal text-white outline-none focus:border-cyan-400"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="RENTING">Đang thuê</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Hình 5.1</p>
              <h4 className="mt-1 text-base font-black text-white">Doanh thu theo danh mục thiết bị</h4>
            </div>
            <div className="h-80">
              {revenueByCategoryData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm font-semibold text-slate-500">
                  Chưa có dữ liệu doanh thu cho bộ lọc này.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByCategoryData} margin={{ top: 10, right: 16, left: 0, bottom: 36 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="categoryLabel" stroke="#94a3b8" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={formatShortCurrency} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                      formatter={(value, name) => [formatCurrency(value), name === 'buyRevenue' ? 'Mua bán' : 'Cho thuê']}
                    />
                    <Legend />
                    <Bar dataKey="buyRevenue" name="Mua bán" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="rentRevenue" name="Cho thuê" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Hình 5.2</p>
              <h4 className="mt-1 text-base font-black text-white">Xu hướng doanh thu theo ngày</h4>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyAnalyticsData} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={formatShortCurrency} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    formatter={(value, name) => {
                      const labelMap = { totalRevenue: 'Tổng doanh thu', buyRevenue: 'Mua bán', rentRevenue: 'Cho thuê' };
                      return [formatCurrency(value), labelMap[name] || name];
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="totalRevenue" name="Tổng doanh thu" stroke="#22d3ee" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="buyRevenue" name="Mua bán" stroke="#60a5fa" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="rentRevenue" name="Cho thuê" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Hình 5.3</p>
              <h4 className="mt-1 text-base font-black text-white">Tỷ lệ đóng góp BUY và RENT</h4>
            </div>
            <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div className="h-72">
                {transactionMixData.length === 0 ? (
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm font-semibold text-slate-500">
                    Chưa có giao dịch phù hợp.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={transactionMixData}
                        dataKey="revenue"
                        nameKey="typeLabel"
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={96}
                        paddingAngle={3}
                      >
                        {transactionMixData.map((entry) => (
                          <Cell key={entry.type} fill={PIE_COLORS[entry.type] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                        formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex flex-col justify-center gap-3">
                {transactionMixData.map((entry) => (
                  <div key={entry.type} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[entry.type] || '#94a3b8' }} />
                      <p className="text-sm font-black text-white">{entry.typeLabel}</p>
                    </div>
                    <p className="mt-2 text-xl font-black text-cyan-200">{formatCurrency(entry.revenue)}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{entry.lineCount} dòng giao dịch</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Hình 5.4</p>
              <h4 className="mt-1 text-base font-black text-white">Top 10 thiết bị có tổng số ngày thuê cao nhất</h4>
            </div>
            <div className="h-72">
              {topRentalDaysData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm font-semibold text-slate-500">
                  Chưa có dữ liệu rental_unit_days.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topRentalDaysData} layout="vertical" margin={{ top: 8, right: 20, left: 84, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="productLabel" stroke="#94a3b8" tick={{ fontSize: 11 }} width={120} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                      formatter={(value, name) => [name === 'rentalUnitDays' ? `${value} ngày` : formatCurrency(value), name === 'rentalUnitDays' ? 'Rental unit days' : 'Doanh thu thuê']}
                    />
                    <Bar dataKey="rentalUnitDays" name="Rental unit days" fill="#34d399" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Biểu Đồ Xu Hướng Doanh Thu ({period})
            </h3>
            <p className="text-xs text-slate-400">Phân tách doanh thu bán và thuê, khoảng {chartRangeLabel}</p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} tickFormatter={val => `${val / 1000000}M`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                formatter={(value) => [formatCurrency(value), '']}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line type="monotone" dataKey="Doanh thu Bán" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Doanh thu Thuê" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Đơn thuê quá hạn */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Đơn thuê quá hạn</h3>
            <p className="text-xs text-slate-400">Các đơn đang thuê nhưng đã quá ngày hẹn trả.</p>
          </div>
          <span className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-300">
            {overdueOrders.length} đơn
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm text-slate-300">
            <thead className="bg-slate-900 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Mã đơn</th>
                <th className="p-3">Khách hàng</th>
                <th className="p-3">Sản phẩm</th>
                <th className="p-3 text-center">Hạn trả</th>
                <th className="p-3 text-center">Trễ</th>
                <th className="p-3 text-right">Cọc đang giữ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {overdueOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-slate-500">Không có đơn thuê quá hạn.</td>
                </tr>
              ) : overdueOrders.map((order) => (
                <tr key={order.orderId} className="bg-rose-950/20 hover:bg-rose-950/30 transition-colors">
                  <td className="p-3 font-bold text-white">#{order.orderId}</td>
                  <td className="p-3">
                    <p className="font-semibold text-white">{order.customerName}</p>
                    <p className="text-xs text-slate-400">{order.customerPhone}</p>
                  </td>
                  <td className="p-3 max-w-sm truncate">{order.productNames}</td>
                  <td className="p-3 text-center">{order.earliestEndDate}</td>
                  <td className="p-3 text-center">
                    <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-black text-rose-300">
                      {order.overdueDays} ngày
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-amber-300">{formatCurrency(order.totalDeposit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thiết bị sắp hết hàng */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Thiết bị sắp hết hàng</h3>
            <p className="text-xs text-slate-400">Các sản phẩm còn từ 3 đơn vị trở xuống, nên kiểm tra để nhập thêm hoặc ẩn bớt.</p>
          </div>
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
            {lowStockProducts.length} sản phẩm
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm text-slate-300">
            <thead className="bg-slate-900 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Sản phẩm</th>
                <th className="p-3">Danh mục</th>
                <th className="p-3 text-center">Tồn kho</th>
                <th className="p-3 text-right">Hình thức</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {lowStockProducts.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-slate-500">Chưa có sản phẩm nào sắp hết hàng.</td>
                </tr>
              ) : lowStockProducts.map((product) => (
                <tr key={product.productId} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3 font-semibold text-white">{product.name}</td>
                  <td className="p-3 text-slate-400">{product.categoryName || 'Chưa phân loại'}</td>
                  <td className="p-3 text-center">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${
                      product.stockQuantity <= 0 ? 'bg-rose-500/15 text-rose-300' : 'bg-amber-500/15 text-amber-300'
                    }`}>
                      {product.stockQuantity}
                    </span>
                  </td>
                  <td className="p-3 text-right text-xs font-bold text-slate-400">
                    {product.priceSell > 0 && product.priceRentPerDay > 0 ? 'Mua / Thuê' : product.priceSell > 0 ? 'Mua' : 'Thuê'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Sản phẩm Thuê Chạy Nhất */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Top 5 Thiết Bị Được Thuê Nhiều Nhất</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Sản Phẩm</th>
                <th className="p-3 text-center">Số Lượt Thuê</th>
                <th className="p-3 text-right">Tổng Doanh Thu Thuê</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {topRentedProducts?.map(prod => (
                <tr key={prod.productId} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3 font-semibold text-white">{prod.name}</td>
                  <td className="p-3 text-center font-medium">
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full text-xs">
                      {prod.totalRentals} lượt
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-400">
                    {formatCurrency(prod.totalRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverviewPage;
