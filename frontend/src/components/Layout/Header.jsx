import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Search, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';

const Header = ({ onOpenCart }) => {
  const { totals } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [guestMenuOpen, setGuestMenuOpen] = useState(false);

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

  const closeGuestMenu = () => setGuestMenuOpen(false);

  return (
    <header
      className="sticky top-0 z-30 border-b border-[#d8c7ad] shadow-[0_12px_30px_rgba(8,51,68,0.12)]"
      style={{ background: 'linear-gradient(90deg, #ffd35f 0%, #ffe08a 48%, #ff9064 100%)' }}
    >
      <div className="mx-auto flex min-h-20 w-full max-w-[1680px] items-center justify-between gap-3 px-4 py-2 sm:px-5 xl:min-h-24 xl:gap-5 xl:px-6">
        <Link to="/" className="group flex min-w-0 shrink-0 items-center gap-3 xl:w-[360px]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#053b45] via-[#0f766e] to-[#be123c] text-base font-black text-white shadow-[0_12px_24px_rgba(5,59,69,0.24)]">
            GR
          </div>
          <div className="leading-none">
            <div className="max-w-[240px] text-[1rem] font-black leading-[1.05] tracking-tight text-[#07111f] transition group-hover:text-[#7f1d1d] sm:max-w-[320px] sm:text-[1.12rem] xl:max-w-none xl:whitespace-nowrap xl:text-[1.34rem]">
              Cho thuê thiết bị chuyên dụng
            </div>
            <div className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#083344]">
              thuê nhanh, dùng gọn
            </div>
          </div>
        </Link>

        <nav className="site-nav hidden w-[560px] shrink-0 items-center justify-between gap-2 rounded-full bg-white/28 p-2 text-[14px] font-black text-[#07111f] shadow-inner ring-1 ring-white/35 xl:flex 2xl:w-[620px]">
          <Link to="/" className="rounded-full bg-white/70 px-7 py-3 shadow-sm transition hover:bg-white hover:text-[#7f1d1d]">Trang Chủ</Link>
          <div className="group relative">
            <button className="rounded-full px-7 py-3 transition hover:bg-white/70 hover:text-[#7f1d1d]">Danh Mục ▾</button>
            <div className="invisible absolute left-0 top-full mt-4 flex w-64 flex-col overflow-hidden rounded-[1.25rem] border border-[#eaded8] bg-white opacity-0 shadow-2xl transition-all group-hover:visible group-hover:opacity-100">
              <Link to="/category/thiet-bi-xay-dung" className="border-b border-[#f1e4de] px-5 py-3 transition hover:bg-[#fff4d6] hover:text-[#7f1d1d]">Thiết bị xây dựng</Link>
              <Link to="/category/quan-ao-bao-ho" className="border-b border-[#f1e4de] px-5 py-3 transition hover:bg-[#fff4d6] hover:text-[#7f1d1d]">Quần áo bảo hộ</Link>
              <Link to="/category/giay-dep" className="border-b border-[#f1e4de] px-5 py-3 transition hover:bg-[#fff4d6] hover:text-[#7f1d1d]">Giày dép chuyên dụng</Link>
              <Link to="/category/may-quay-phim" className="px-5 py-3 transition hover:bg-[#fff4d6] hover:text-[#7f1d1d]">Thiết bị quay phim</Link>
            </div>
          </div>
          <Link to="/catalog" className="rounded-full px-7 py-3 transition hover:bg-white/70 hover:text-[#7f1d1d]">Sản Phẩm</Link>
          <Link to="/about" className="rounded-full px-7 py-3 transition hover:bg-white/70 hover:text-[#7f1d1d]">Thông tin</Link>
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-2 xl:gap-3">
          <form
            onSubmit={handleSearch}
            className="hidden items-center rounded-full border border-[#07111f]/20 bg-white/85 px-3 py-2 shadow-[0_8px_20px_rgba(71,30,7,0.12)] focus-within:border-[#07111f] md:flex"
          >
            <input
              type="text"
              name="search"
              placeholder="Tìm..."
              className="w-24 border-none bg-transparent px-2 text-sm font-semibold text-[#07111f] placeholder:text-[#6b4f37] outline-none transition-all focus:w-36 2xl:w-28 2xl:focus:w-44"
            />
            <button type="submit" className="p-1 text-[#07111f] hover:text-[#7f1d1d]" aria-label="Tìm kiếm">
              <Search className="h-5 w-5 stroke-[3]" />
            </button>
          </form>

          {isAuthenticated ? (
            <div className="hidden items-center gap-2 xl:flex">
              <Link to="/profile" className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-black text-[#07111f] shadow-sm transition hover:bg-white">
                <User className="h-4 w-4 stroke-[3]" />
                {user?.fullName || 'Tài khoản'}
              </Link>
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="rounded-full bg-[#083344] px-4 py-2 text-sm font-black text-white transition hover:bg-[#7f1d1d]">
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="rounded-full p-2 text-[#07111f] transition hover:bg-white/70 hover:text-[#7f1d1d]"
                title="Đăng xuất"
                aria-label="Đăng xuất"
              >
                <LogOut className="h-6 w-6 stroke-[3]" />
              </button>
            </div>
          ) : null}

          <button
            onClick={onOpenCart}
            className="relative rounded-full p-2 text-[#07111f] transition hover:bg-white/70 hover:text-[#7f1d1d]"
            aria-label="Giỏ hàng"
          >
            <ShoppingBag className="h-7 w-7 stroke-[3]" />
            {totals.totalItems > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#be123c] px-1 text-xs font-black text-white">
                {totals.totalItems}
              </span>
            )}
          </button>

          {!isAuthenticated && (
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setGuestMenuOpen((open) => !open)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#083344] text-white shadow-[0_10px_22px_rgba(8,51,68,0.22)] transition hover:bg-[#7f1d1d]"
                aria-label="Mở menu tài khoản"
                aria-expanded={guestMenuOpen}
              >
                <Menu className="h-7 w-7 stroke-[3]" />
              </button>

              {guestMenuOpen && (
                <div className="absolute right-0 top-full z-40 mt-3 w-52 overflow-hidden rounded-xl border border-[#f3c17a] bg-white p-2 text-sm font-black text-[#07111f] shadow-2xl">
                  <Link to="/register" onClick={closeGuestMenu} className="block rounded-2xl px-4 py-3 transition hover:bg-[#fff1d6] hover:text-[#7f1d1d]">
                    Đăng ký
                  </Link>
                  <Link to="/login" onClick={closeGuestMenu} className="block rounded-2xl px-4 py-3 transition hover:bg-[#fff1d6] hover:text-[#7f1d1d]">
                    Đăng nhập
                  </Link>
                  <Link to="/" onClick={closeGuestMenu} className="block rounded-2xl px-4 py-3 transition hover:bg-[#fff1d6] hover:text-[#7f1d1d]">
                    Trợ giúp
                  </Link>
                </div>
              )}
            </div>
          )}

          <button className="p-2 text-[#07111f] xl:hidden" aria-label="Mở menu">
            <Menu className="h-7 w-7 stroke-[3]" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
