import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, ShoppingBag, Search, Menu, User } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';

const Header = ({ onOpenCart }) => {
  const { totals } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const search = formData.get('search');
    if (search) navigate(`/catalog?search=${encodeURIComponent(search)}`);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30 border-b border-gray-100">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
            GR
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Gear<span className="text-blue-600">Rental</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 font-medium text-slate-600">
          <Link to="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
          <div className="relative group">
            <button className="hover:text-blue-600 transition-colors py-2">Danh mục ▾</button>
            <div className="absolute top-full left-0 mt-2 w-48 bg-white shadow-xl rounded-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col overflow-hidden">
              <Link to="/category/thiet-bi-xay-dung" className="px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-gray-50">Thiết bị xây dựng</Link>
              <Link to="/category/quan-ao-bao-ho" className="px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-gray-50">Quần áo bảo hộ</Link>
              <Link to="/category/giay-dep" className="px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-gray-50">Giày dép chuyên dụng</Link>
              <Link to="/category/may-quay-phim" className="px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition-colors">Thiết bị quay phim</Link>
            </div>
          </div>
          <Link to="/" className="hover:text-blue-600 transition-colors">Khuyến mãi</Link>
          <Link to="/" className="hover:text-blue-600 transition-colors">Về chúng tôi</Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <form 
            onSubmit={handleSearch}
            className="hidden sm:flex items-center bg-slate-100 rounded-full px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-100"
          >
            <input 
              type="text" 
              name="search"
              placeholder="Tìm kiếm..." 
              className="bg-transparent border-none outline-none text-sm w-32 focus:w-48 transition-all px-2 text-slate-700"
            />
            <button type="submit" className="text-slate-400 hover:text-blue-600 p-1">
              <Search className="w-4 h-4" />
            </button>
          </form>

          {isAuthenticated ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/profile" className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700">
                <User className="h-4 w-4" />
                {user?.fullName || 'Tài khoản'}
              </Link>
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="rounded-full bg-slate-900 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800">
                  Admin
                </Link>
              )}
              <button
                onClick={logout}
                className="rounded-full p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                title="Đăng xuất"
                aria-label="Đăng xuất"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Đăng nhập
              </Link>
              <Link to="/register" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                Đăng ký
              </Link>
            </div>
          )}
          
          <button 
            onClick={onOpenCart} 
            className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
          >
            <ShoppingBag className="w-6 h-6" />
            {totals.totalItems > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full">
                {totals.totalItems}
              </span>
            )}
          </button>

          <button className="md:hidden p-2 text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
