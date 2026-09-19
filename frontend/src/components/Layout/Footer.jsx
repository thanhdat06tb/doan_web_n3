import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="mt-auto border-t-4 border-[#f97316] bg-[#083344] px-5 py-14 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.9fr_1fr_1fr]">
          <div>
            <Link to="/" className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#ffbd45] to-[#be123c] text-white font-black shadow-lg">
                GR
              </div>
              <div>
                <div className="text-xl font-black leading-tight">Cho thuê thiết bị</div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ffbd45]">chuyên dụng</div>
              </div>
            </Link>
            <p className="max-w-sm text-sm font-semibold leading-7 text-white/72">
              Nền tảng cho thuê và mua bán thiết bị chuyên dụng. Tập trung vào quy trình rõ ràng, giá minh bạch và trải nghiệm đặt hàng gọn nhẹ.
            </p>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-black uppercase tracking-[0.16em] text-[#ffbd45]">Dịch vụ</h4>
            <ul className="space-y-3 text-sm font-semibold text-white/78">
              <li><Link to="/category/thiet-bi-xay-dung" className="transition hover:text-[#ffbd45]">Thiết bị xây dựng</Link></li>
              <li><Link to="/category/quan-ao-bao-ho" className="transition hover:text-[#ffbd45]">Đồ bảo hộ</Link></li>
              <li><Link to="/category/may-quay-phim" className="transition hover:text-[#ffbd45]">Thiết bị quay phim</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-black uppercase tracking-[0.16em] text-[#ffbd45]">Hỗ trợ khách hàng</h4>
            <ul className="space-y-3 text-sm font-semibold text-white/78">
              <li><Link to="/" className="transition hover:text-[#ffbd45]">Chính sách bảo hành</Link></li>
              <li><Link to="/" className="transition hover:text-[#ffbd45]">Chính sách bảo mật</Link></li>
              <li><Link to="/" className="transition hover:text-[#ffbd45]">Câu hỏi thường gặp</Link></li>
              <li><Link to="/checkout" className="transition hover:text-[#ffbd45]">Thanh toán</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-black uppercase tracking-[0.16em] text-[#ffbd45]">Liên hệ</h4>
            <ul className="space-y-4 text-sm font-semibold text-white/78">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#ffbd45]" />
                <span>Thụy Dũng, Đông Thụy Anh, Hưng Yên</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-[#ffbd45]" />
                <span>0369038160</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-[#ffbd45]" />
                <span>thanhdat06tb@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/12 pt-6 text-sm font-semibold text-white/58 md:flex-row md:items-center md:justify-between">
          <p>© 2026 GearRental. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/" className="transition hover:text-white">Terms</Link>
            <Link to="/" className="transition hover:text-white">Privacy</Link>
            <Link to="/" className="transition hover:text-white">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
