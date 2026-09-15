import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 mt-auto border-t border-slate-800">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">
                GR
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                Gear<span className="text-blue-500">Rental</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Nền tảng cho thuê và mua bán thiết bị chuyên dụng hàng đầu. Cam kết chất lượng, bảo hiểm 100% cho mọi thiết bị.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-6">Dịch vụ</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="hover:text-blue-400 transition-colors">Cho thuê thiết bị xây dựng</Link></li>
              <li><Link to="/" className="hover:text-blue-400 transition-colors">Cho thuê thiết bị sự kiện</Link></li>
              <li><Link to="/" className="hover:text-blue-400 transition-colors">Mua bán máy quay phim</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-6">Hỗ trợ khách hàng</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="hover:text-blue-400 transition-colors">Chính sách bảo hành</Link></li>
              <li><Link to="/" className="hover:text-blue-400 transition-colors">Chính sách bảo mật</Link></li>
              <li><Link to="/" className="hover:text-blue-400 transition-colors">Câu hỏi thường gặp (FAQ)</Link></li>
              <li><Link to="/" className="hover:text-blue-400 transition-colors">Hướng dẫn thanh toán</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Liên hệ</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="text-blue-500">📍</span>
                <span>Thụy Dũng, Đông Thụy Anh, Hưng Yên</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-blue-500">📞</span>
                <span>0369038160</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-blue-500">✉️</span>
                <span>thanhdat06tb@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-slate-500">
          <p>© 2026 GearRental. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link to="/" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
