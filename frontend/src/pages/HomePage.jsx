import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgePercent,
  Building2,
  CalendarCheck,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HardHat,
  PackageCheck,
  Shirt,
  Sparkles,
  Truck,
} from 'lucide-react';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatters';
import fallbackImage from '../assets/hero.png';

const heroSlides = [
  {
    eyebrow: 'Thiết bị sẵn sàng cho mọi dự án',
    title: 'Cần dùng, không cần mua bổ sung.',
    text: 'Thuê nhanh thiết bị xây dựng, bảo hộ và quay phim theo đúng ngày cần dùng. Chi phí gọn hơn, vận hành nhẹ hơn.',
    image: '/images/sony-a7iii.png',
    primaryLabel: 'Xem sản phẩm',
    primaryHref: '/catalog',
    secondaryLabel: 'Thuê cho sự kiện',
    secondaryHref: '/category/may-quay-phim',
    accent: 'from-sky-500 to-blue-700',
  },
  {
    eyebrow: 'Gói thi công ngắn ngày',
    title: 'Đủ máy móc cho công trình, không phải ôm tồn kho.',
    text: 'Máy trộn bê tông, máy khoan, máy cắt và đồ bảo hộ được gom theo nhóm để đội thi công chọn nhanh hơn.',
    image: '/images/concrete-mixer-350.png',
    primaryLabel: 'Thiết bị xây dựng',
    primaryHref: '/category/thiet-bi-xay-dung',
    secondaryLabel: 'Xem catalog',
    secondaryHref: '/catalog',
    accent: 'from-amber-400 to-orange-600',
  },
  {
    eyebrow: 'An toàn cho đội nhóm',
    title: 'Bảo hộ đồng bộ, nhận nhanh theo số lượng.',
    text: 'Áo phản quang, quần áo bảo hộ và giày chuyên dụng giúp chuẩn bị nhân sự gọn gàng trước khi vào việc.',
    image: '/images/ao-phan-quang-bao-ho.png',
    primaryLabel: 'Đồ bảo hộ',
    primaryHref: '/category/quan-ao-bao-ho',
    secondaryLabel: 'Giày chuyên dụng',
    secondaryHref: '/category/giay-dep',
    accent: 'from-emerald-400 to-teal-600',
  },
];

const categories = [
  {
    title: 'Xây dựng',
    subtitle: 'Máy khoan, máy cắt, máy trộn bê tông',
    href: '/category/thiet-bi-xay-dung',
    image: '/images/concrete-mixer-350.png',
    icon: HardHat,
    tone: 'bg-amber-50 text-amber-700 ring-amber-100',
  },
  {
    title: 'Quần áo bảo hộ',
    subtitle: 'Trang phục an toàn cho đội thi công',
    href: '/category/quan-ao-bao-ho',
    image: '/images/ao-phan-quang-bao-ho.png',
    icon: Shirt,
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  },
  {
    title: 'Giày dép chuyên dụng',
    subtitle: 'Giày bảo hộ mũi thép, chống trượt',
    href: '/category/giay-dep',
    image: '/images/giay-bao-ho.png',
    icon: PackageCheck,
    tone: 'bg-slate-100 text-slate-700 ring-slate-200',
  },
  {
    title: 'Quay phim',
    subtitle: 'Camera, gimbal, drone và đèn studio',
    href: '/category/may-quay-phim',
    image: '/images/sony-a7iii.png',
    icon: Camera,
    tone: 'bg-sky-50 text-sky-700 ring-sky-100',
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
  'Không cần thiết phải mua thiết bị giá trị lớn',
  'Đặt ngày theo dự án hoặc theo sự kiện',
  'Rõ ràng tiền cọc, giao nhận và kiểm tra đơn hàng',
  'Phù hợp cá nhân, đội thi công, studio và doanh nghiệp nhỏ',
];

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);

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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  const slide = heroSlides[activeSlide];
  const stats = useMemo(() => ([
    ['4+', 'Nhóm sản phẩm'],
    ['24 giờ', 'Tư vấn và xác nhận đơn'],
    ['1 ngày', 'Có thể thuê ngắn hạn'],
    ['2 hình thức', 'Mua hoặc thuê linh hoạt'],
  ]), []);

  const goToSlide = (direction) => {
    setActiveSlide((current) => (
      direction === 'next'
        ? (current + 1) % heroSlides.length
        : (current - 1 + heroSlides.length) % heroSlides.length
    ));
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100">
      <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-slate-950 text-white">
        {heroSlides.map((item, index) => (
          <img
            key={item.title}
            src={item.image}
            alt={item.title}
            className={`absolute inset-0 h-full w-full object-cover transition duration-700 ${
              index === activeSlide ? 'scale-100 opacity-55' : 'scale-105 opacity-0'
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.92),rgba(15,23,42,0.68),rgba(15,23,42,0.2))]" />
        <div className={`absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r ${slide.accent}`} />

        <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-sky-100 shadow-2xl backdrop-blur">
              <Sparkles className="h-4 w-4" />
              {slide.eyebrow}
            </p>
            <h1 className="max-w-4xl text-4xl font-black leading-tight md:text-6xl">
              {slide.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              {slide.text}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to={slide.primaryHref}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${slide.accent} px-6 py-3 font-bold text-white shadow-lg shadow-slate-950/30 transition hover:-translate-y-0.5`}
              >
                {slide.primaryLabel} <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to={slide.secondaryHref}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-3 font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                {slide.secondaryLabel}
              </Link>
            </div>
          </div>

          <div className="hidden rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur lg:block">
            <div className="overflow-hidden rounded-[1.5rem] bg-white/10">
              <img src={slide.image} alt="" className="h-56 w-full object-contain p-5" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              {['Nhanh', 'Rõ cọc', 'Linh hoạt'].map((item) => (
                <div key={item} className="rounded-2xl bg-white/10 px-3 py-3 text-xs font-bold text-slate-100">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-3">
          <button
            type="button"
            onClick={() => goToSlide('prev')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            aria-label="Slide trước"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex gap-2">
            {heroSlides.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setActiveSlide(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === activeSlide ? 'w-9 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Chuyển tới slide ${index + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => goToSlide('next')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            aria-label="Slide sau"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-950">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-0 px-4 py-8 md:grid-cols-4">
          {stats.map(([value, label]) => (
            <div key={label} className="border-white/10 py-4 md:border-r md:px-8 last:border-r-0">
              <p className="bg-gradient-to-r from-cyan-300 to-amber-300 bg-clip-text text-3xl font-black text-transparent">
                {value}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-300">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_12%_10%,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_88%_5%,rgba(245,158,11,0.14),transparent_30%),linear-gradient(180deg,#07111f,#0f172a)] px-4 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-bold uppercase text-cyan-300">Về doanh nghiệp</p>
            <h2 className="text-3xl font-black text-white md:text-4xl">
              Một nền tảng giúp dự án vốn nhẹ hơn.
            </h2>
            <p className="mt-5 leading-7 text-slate-300">
              Người dùng có thể tìm, so sánh, đặt mua hoặc đặt thuê thiết bị theo nhu cầu thực tế. Thay vì bỏ một khoản lớn để mua sắm, bạn chọn đúng món, đúng thời gian và thanh toán sau khi hoàn thành công việc.
            </p>
            <div className="mt-6 grid gap-3">
              {highlights.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm font-semibold text-slate-200">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
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
                  className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900/80 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-cyan-300/40"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950">
                    <img
                      src={category.image}
                      alt={category.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ${category.tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-black text-white">{category.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{category.subtitle}</p>
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
              <p className="mb-3 text-sm font-bold uppercase text-amber-300">Gói thuê nhanh</p>
              <h2 className="text-3xl font-black md:text-4xl">Thuê theo sự kiện, giảm áp lực mua sắm.</h2>
            </div>
            <Link to="/catalog" className="inline-flex items-center gap-2 font-bold text-cyan-300 hover:text-white">
              Xem toàn bộ sản phẩm <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {eventPackages.map((item, index) => (
              <div key={item.title} className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-black/10">
                <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-black uppercase ${
                  index === 0 ? 'bg-amber-400/15 text-amber-200' : index === 1 ? 'bg-cyan-400/15 text-cyan-200' : 'bg-emerald-400/15 text-emerald-200'
                }`}>
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

      <section className="bg-[#0b1424] px-4 py-16">
        <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-sm font-bold uppercase text-cyan-300">Sản phẩm nổi bật</p>
            <h2 className="text-3xl font-black text-white md:text-4xl">Thiết bị cho thuê và mua nhanh</h2>
          </div>
          <Link to="/catalog" className="inline-flex items-center gap-2 font-bold text-cyan-300 hover:text-white">
            Đi tới catalog <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-cyan-300/40"
            >
              <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950">
                <img
                  src={product.image_url || fallbackImage}
                  alt={product.name}
                  onError={(event) => { event.currentTarget.src = fallbackImage; }}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <p className="mb-2 text-xs font-black uppercase text-cyan-300">
                  {product.category_name || 'Thiết bị'}
                </p>
                <h3 className="min-h-[3rem] text-lg font-black text-white">{product.name}</h3>
                <div className="mt-4 space-y-1 text-sm text-slate-300">
                  {product.price_sell > 0 && <p>Mua: <span className="font-bold text-cyan-300">{formatCurrency(product.price_sell)}</span></p>}
                  {product.price_rent_per_day > 0 && <p>Thuê: <span className="font-bold text-amber-300">{formatCurrency(product.price_rent_per_day)}/ngày</span></p>}
                </div>
              </div>
            </Link>
          ))}
        </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-blue-700 via-cyan-700 to-emerald-700 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-3">
          {[
            [CalendarCheck, 'Đặt lịch thuê', 'Chọn ngày cần dùng và số lượng thiết bị phù hợp.'],
            [Truck, 'Giao nhận rõ ràng', 'Thông tin đơn, tiền cọc và trạng thái được quản lý trong hệ thống.'],
            [Building2, 'Phục vụ dự án', 'Phù hợp công trình, quay phim, đội nhóm và doanh nghiệp nhỏ.'],
          ].map(([Icon, title, text]) => (
            <div key={title} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-cyan-50">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
