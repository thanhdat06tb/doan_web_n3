import React from 'react';
import { Link, Navigate, NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, PackagePlus, ShoppingBag, ArrowLeft, Shield, Bell, Store, Boxes } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const AdminLayout = () => {
  const { user, isAuthenticated } = useAuth();
  const adminUser = user || {};

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: '/admin' }} replace />;
  }

  if (adminUser.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center text-white">
        <div>
          <h1 className="text-2xl font-bold">Bạn không có quyền truy cập Admin</h1>
          <Link to="/" className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold hover:bg-blue-500">
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-4">
        <div>
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white tracking-wide">ADMIN PANEL</h2>
              <p className="text-xs text-slate-400">Cho Thuê & Bán Đồ</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col gap-1">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`
              }
            >
              <LayoutDashboard className="w-5 h-5" />
              Tổng quan Dashboard
            </NavLink>

            <NavLink
              to="/admin/orders"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`
              }
            >
              <ShoppingBag className="w-5 h-5" />
              Quản lý Đơn hàng
            </NavLink>

            <NavLink
              to="/admin/products"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`
              }
            >
              <Boxes className="w-5 h-5" />
              Quản lý sản phẩm
            </NavLink>

            <NavLink
              to="/admin/products/new"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`
              }
            >
              <PackagePlus className="w-5 h-5" />
              Thêm sản phẩm
            </NavLink>
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="pt-4 border-t border-slate-800">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại trang Khách hàng
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">System Live</span>
          </div>

          <div className="flex items-center gap-4">
            <nav className="hidden items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1 lg:flex">
              <NavLink
                to="/admin"
                end
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </NavLink>
              <NavLink
                to="/admin/orders"
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <ShoppingBag className="h-4 w-4" />
                Đơn hàng
              </NavLink>
              <NavLink
                to="/admin/products"
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Boxes className="h-4 w-4" />
                Sản phẩm
              </NavLink>
              <NavLink
                to="/admin/products/new"
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <PackagePlus className="h-4 w-4" />
                Thêm sản phẩm
              </NavLink>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <Store className="h-4 w-4" />
                Trang khách
              </Link>
            </nav>

            <button className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors relative">
              <Bell className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm">
                A
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-200">{adminUser.fullName || adminUser.full_name || 'Quản trị viên'}</p>
                <p className="text-slate-500">{adminUser.email || 'admin@rental.vn'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
