import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgePercent,
  Building2,
  CalendarCheck,
  Camera,
  CheckCircle2,
  HardHat,
  PackageCheck,
  Shirt,
  Sparkles,
  Truck,
} from 'lucide-react';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatters';
import fallbackImage from '../assets/hero.png';

const categories = [
  {
    title: 'Xây dựng',
    subtitle: 'Máy khoan, máy cắt, máy trộn bê tông',
    href: '/category/thiet-bi-xay-dung',
    image: '/images/concrete-mixer-350.png',
    icon: HardHat,
  },
  {
    title: 'Quần áo bảo hộ',
    subtitle: 'Trang phục an toàn cho đội thi công',
    href: '/category/quan-ao-bao-ho',
    image: '/images/ao-phan-quang-bao-ho.png',
    icon: Shirt,
  },
  {
    title: 'Giày dép chuyên dụng',
    subtitle: 'Giày bảo hộ mũi thép, chống trượt',
    href: '/category/giay-dep',
    image: '/images/giay-bao-ho.png',
    icon: PackageCheck,
  },
  {
    title: 'Quay phim',
    subtitle: 'Camera, gimbal, drone và đèn studio',
    href: '/category/may-quay-phim',
    image: '/images/sony-a7iii.png',
    icon: Camera,
  },
];

const eventPackages = [
  {
    title: 'Gói công trình ngắn ngày',
    text: 'Thuê máy xây dựng và đồ bảo hộ theo ngày, tối ưu chi phí cho đội thi công nhỏ.',
    tag: 'Tiết kiệm vốn',
  },
  {
    title: 'Gói quay phim sự kiện',
    text: 'Camera, gimbal, drone và đèn studio sẵn sàng cho lễ cưới, TVC, livestream.',
    tag: 'Đủ bộ thiết bị',
  },
  {
    title: 'Gói bảo hộ đội nhóm',
    text: 'Áo phản quang, quần áo bảo hộ và giày chuyên dụng cho nhân sự đi công trình.',
    tag: 'Theo số lượng',
  },
];

const highlights = [
  'Không cần mua đứt thiết bị đắt tiền',
  'Đặt thuê theo ngày, theo dự án hoặc theo sự kiện',
  'Có cọc rõ ràng, giao nhận và hậu kiểm đơn hàng',
  'Phù hợp cá nhân, đội thi công, studio và doanh nghiệp nhỏ',
];

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await api.get('/products', { params: { limit: 6, type: 'all' } });
        if (response.data.success) {
          setFeaturedProducts(response.data.data.items || []);
        }
      } catch (error) {
        console.error('Error loading featured products:', error);
      }
    };

    fetchFeatured();
  }, []);

  return (
    <div className="bg-white text-slate-950">
      <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-slate-950 text-white">
        <img
          src="/images/sony-a7iii.png"
          alt="Thiết bị cho thuê chuyên nghiệp"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-center px-4 py-20">
          <p className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-100 backdrop-blur">
            <Sparkles className="h-4 w-4" />
            Cho thuê thiết bị, đồ bảo hộ và dụng cụ chuyên dụng
          </p>
          <h1 className="max-w-4xl text-4xl font-black leading-tight md:text-6xl">
            Cần dùng thì thuê, không cần mua đứt.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            GearRental giúp cá nhân, đội thi công và doanh nghiệp chủ động thiết bị theo từng dự án:
            thuê nhanh, chi phí gọn, vẫn có đủ đồ tốt để làm việc chuyên nghiệp.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/catalog"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-700"
            >
              Xem sản phẩm <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/category/may-quay-phim"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-bold text-white backdrop-blur hover:bg-white/20"
            >
              Thuê cho sự kiện
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-0 px-4 py-8 md:grid-cols-4">
          {[
            ['4+', 'Nhóm sản phẩm rõ ràng'],
            ['24h', 'Tư vấn và xác nhận đơn'],
            ['1 ngày', 'Có thể thuê ngắn hạn'],
            ['2 hình thức', 'Mua hoặc thuê linh hoạt'],
          ].map(([value, label]) => (
            <div key={label} className="border-slate-200 py-4 md:border-r md:px-8 last:border-r-0">
              <p className="text-3xl font-black text-blue-700">{value}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-bold uppercase text-blue-700">Về doanh nghiệp</p>
            <h2 className="text-3xl font-black text-slate-950 md:text-4xl">
              Một nền tảng cho thuê giúp dự án nhẹ vốn hơn.
            </h2>
            <p className="mt-5 leading-7 text-slate-600">
              Chúng tôi xây dựng website để người dùng dễ tìm, so sánh, đặt mua hoặc đặt thuê thiết bị
              theo nhu cầu thực tế. Thay vì bỏ một khoản lớn để mua đứt, bạn có thể thuê đúng món,
              đúng thời gian và trả thiết bị sau khi hoàn thành công việc.
            </p>
            <div className="mt-6 grid gap-3">
              {highlights.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm font-semibold text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.title}
                  to={category.href}
                  className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={category.image}
                      alt={category.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-black text-slate-950">{category.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{category.subtitle}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-sm font-bold uppercase text-blue-300">Sale marketing</p>
              <h2 className="text-3xl font-black md:text-4xl">Thuê theo sự kiện, giảm áp lực mua sắm.</h2>
            </div>
            <Link to="/catalog" className="inline-flex items-center gap-2 font-bold text-blue-300 hover:text-white">
              Xem toàn bộ sản phẩm <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {eventPackages.map((item) => (
              <div key={item.title} className="rounded-lg border border-white/10 bg-white/[0.06] p-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3 py-1 text-xs font-black uppercase text-rose-200">
                  <BadgePercent className="h-4 w-4" />
                  {item.tag}
                </span>
                <h3 className="mt-5 text-xl font-black">{item.title}</h3>
                <p className="mt-3 leading-7 text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-sm font-bold uppercase text-blue-700">Sản phẩm nổi bật</p>
            <h2 className="text-3xl font-black md:text-4xl">Box sản phẩm cho thuê và mua nhanh</h2>
          </div>
          <Link to="/catalog" className="inline-flex items-center gap-2 font-bold text-blue-700 hover:text-blue-900">
            Đi tới catalog <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src={product.image_url || fallbackImage}
                  alt={product.name}
                  onError={(event) => { event.currentTarget.src = fallbackImage; }}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <p className="mb-2 text-xs font-black uppercase text-blue-700">
                  {product.category_name || 'Thiết bị'}
                </p>
                <h3 className="min-h-[3rem] text-lg font-black text-slate-950">{product.name}</h3>
                <div className="mt-4 space-y-1 text-sm text-slate-600">
                  {product.price_sell > 0 && <p>Mua: <span className="font-bold text-blue-700">{formatCurrency(product.price_sell)}</span></p>}
                  {product.price_rent_per_day > 0 && <p>Thuê: <span className="font-bold text-orange-600">{formatCurrency(product.price_rent_per_day)}/ngày</span></p>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-blue-700 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-3">
          {[
            [CalendarCheck, 'Đặt lịch thuê', 'Chọn ngày cần dùng và số lượng thiết bị phù hợp.'],
            [Truck, 'Giao nhận rõ ràng', 'Thông tin đơn, tiền cọc và trạng thái được quản lý trong hệ thống.'],
            [Building2, 'Phục vụ dự án', 'Phù hợp công trình, quay phim, đội nhóm và doanh nghiệp nhỏ.'],
          ].map(([Icon, title, text]) => (
            <div key={title} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-blue-100">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
