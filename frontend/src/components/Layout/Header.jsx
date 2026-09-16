import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Search, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';

const Header = ({ onOpenCart }) => {
  const { totals } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const search = formData.get('search');
    if (search) navigate(`/catalog?search=${encodeURIComponent(search)}`);
  };

  const handleLogout = async () => {
    navigate('/login', { replace: true });
    await logout();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-500 text-xl font-black text-white shadow-lg shadow-cyan-500/20">
            GR
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Gear<span className="bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">Rental</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 font-semibold text-slate-300 md:flex">
          <Link to="/" className="transition-colors hover:text-cyan-700">Trang chủ</Link>
          <div className="group relative">
            <button className="py-2 transition-colors hover:text-cyan-700">Danh mục ▾</button>
            <div className="invisible absolute left-0 top-full mt-2 flex w-56 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
              <Link to="/category/thiet-bi-xay-dung" className="border-b border-slate-50 px-4 py-3 transition-colors hover:bg-amber-50 hover:text-amber-700">Thiết bị xây dựng</Link>
              <Link to="/category/quan-ao-bao-ho" className="border-b border-slate-50 px-4 py-3 transition-colors hover:bg-emerald-50 hover:text-emerald-700">Quần áo bảo hộ</Link>
              <Link to="/category/giay-dep" className="border-b border-slate-50 px-4 py-3 transition-colors hover:bg-slate-50 hover:text-slate-900">Giày dép chuyên dụng</Link>
              <Link to="/category/may-quay-phim" className="px-4 py-3 transition-colors hover:bg-cyan-50 hover:text-cyan-700">Thiết bị quay phim</Link>
            </div>
          </div>
          <Link to="/catalog" className="transition-colors hover:text-cyan-700">Khuyến mãi</Link>
          <Link to="/" className="transition-colors hover:text-cyan-700">Về chúng tôi</Link>
        </nav>

        <div className="flex items-center gap-4">
          <form
            onSubmit={handleSearch}
            className="hidden items-center rounded-2xl border border-white/10 bg-white/10 px-3 py-1.5 focus-within:border-cyan-300 focus-within:ring-4 focus-within:ring-cyan-400/20 sm:flex"
          >
            <input
              type="text"
              name="search"
              placeholder="Tìm kiếm..."
              className="w-32 border-none bg-transparent px-2 text-sm text-slate-100 placeholder:text-slate-400 outline-none transition-all focus:w-48"
            />
            <button type="submit" className="p-1 text-slate-400 hover:text-cyan-300">
              <Search className="h-4 w-4" />
            </button>
          </form>

          {isAuthenticated ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/profile" className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-cyan-400/10 hover:text-cyan-200">
                <User className="h-4 w-4" />
                {user?.fullName || 'Tài khoản'}
              </Link>
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="rounded-2xl bg-white px-3 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-100">
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="rounded-2xl p-2 text-slate-300 hover:bg-rose-500/10 hover:text-rose-300"
                title="Đăng xuất"
                aria-label="Đăng xuất"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10">
                Đăng nhập
              </Link>
              <Link to="/register" className="rounded-2xl bg-gradient-to-r from-blue-700 to-cyan-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-blue-800 hover:to-cyan-700">
                Đăng ký
              </Link>
            </div>
          )}

          <button
            onClick={onOpenCart}
            className="relative rounded-2xl p-2 text-slate-300 transition-all hover:bg-cyan-400/10 hover:text-cyan-200"
            aria-label="Giỏ hàng"
          >
            <ShoppingBag className="h-6 w-6" />
            {totals.totalItems > 0 && (
              <span className="absolute right-0 top-0 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-950 bg-amber-500 text-xs font-bold text-white">
                {totals.totalItems}
              </span>
            )}
          </button>

          <button className="p-2 text-slate-300 md:hidden" aria-label="Mở menu">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
