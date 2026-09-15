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
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import api from '../../utils/api';

const DashboardOverviewPage = () => {
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, chartRes] = await Promise.all([
        api.get('/admin/dashboard/summary'),
        api.get(`/admin/dashboard/revenue-chart?period=${period}`),
      ]);

      if (sumRes.data.success) {
        setSummary(sumRes.data.data);
      }
      if (chartRes.data.success) {
        const { labels, sellData, rentData } = chartRes.data.data;
        const formatted = labels.map((label, idx) => ({
          date: label,
          'Doanh thu Bán': sellData[idx] || 0,
          'Doanh thu Thuê': rentData[idx] || 0,
        }));
        setChartData(formatted);
      }
    } catch (error) {
      if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') {
        console.error('Failed to fetch admin dashboard data', error);
        setSummary(null);
        setChartData([]);
        return;
      }

      console.warn('Backend not responding, using mock admin summary data', error.message);
      setSummary({
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
      });

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
  }, [period]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading && !summary) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        Đang tải dữ liệu tổng quan...
      </div>
    );
  }

  const { revenue, deposits, orders, topRentedProducts } = summary || {};

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Tổng Quan Báo Cáo & Thống Kê</h1>
          <p className="text-xs text-slate-400 mt-1">Cập nhật realtime từ cơ sở dữ liệu SQLite</p>
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
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Biểu Đồ Xu Hướng Doanh Thu ({period})
            </h3>
            <p className="text-xs text-slate-400">Phân tách doanh thu giữa Mua đứt và Cho thuê</p>
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
              <Line type="monotone" dataKey="Doanh thu Bán" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Doanh thu Thuê" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
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
