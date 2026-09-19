import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Camera,
  ChevronLeft,
  ChevronRight,
  HardHat,
  PackageCheck,
  Shirt,
  Truck,
} from 'lucide-react';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatters';
import fallbackImage from '../assets/hero.png';

const heroSlides = [
  {
    eyebrow: 'GearRental',
    title: 'Thiết bị sẵn sàng cho mọi dự án',
    subtitle: 'Thuê nhanh, dùng gọn, không cần ôm kho.',
    text: 'Máy xây dựng, đồ bảo hộ và thiết bị quay phim được trình bày như một bộ sưu tập: dễ xem, dễ chọn, đặt lịch linh hoạt theo ngày.',
    primaryLabel: 'Xem sản phẩm',
    primaryHref: '/catalog',
    image: '/images/sony-a7iii.png',
    accent: 'bg-[#ffcc32] text-[#07111f]',
  },
  {
    eyebrow: 'Dự án thi công',
    title: 'Mỗi công trình có một bộ đồ nghề riêng',
    subtitle: 'Chọn đúng thiết bị, đúng thời điểm.',
    text: 'Máy khoan, máy trộn bê tông, máy cắt và phụ kiện hỗ trợ được gom nhóm rõ ràng để đội thi công chọn nhanh hơn.',
    primaryLabel: 'Thiết bị xây dựng',
    primaryHref: '/category/thiet-bi-xay-dung',
    image: '/images/bosch-gbh226.png',
    accent: 'bg-[#ff7a1a] text-white',
  },
  {
    eyebrow: 'An toàn & sản xuất',
    title: 'Từ công trường đến studio đều gọn gàng',
    subtitle: 'Bảo hộ, camera, drone, gimbal trong một nơi.',
    text: 'Chuẩn bị trang phục an toàn hoặc set quay phim cho sự kiện mà không cần mua mới toàn bộ thiết bị đắt tiền.',
    primaryLabel: 'Thuê cho sự kiện',
    primaryHref: '/category/may-quay-phim',
    image: '/images/ao-phan-quang-bao-ho.png',
    accent: 'bg-[#0f766e] text-white',
  },
];

const categories = [
  {
    title: 'Thiết bị xây dựng',
    subtitle: 'Máy khoan, máy cắt, máy trộn bê tông',
    href: '/category/thiet-bi-xay-dung',
    image: '/images/concrete-mixer-350.png',
    icon: HardHat,
  },
  {
    title: 'Đồ bảo hộ',
    subtitle: 'Áo phản quang, quần áo bảo hộ',
    href: '/category/quan-ao-bao-ho',
    image: '/images/ao-phan-quang-bao-ho.png',
    icon: Shirt,
  },
  {
    title: 'Giày chuyên dụng',
    subtitle: 'Giày bảo hộ mũi thép, chống trượt',
    href: '/category/giay-dep',
    image: '/images/giay-bao-ho.png',
    icon: PackageCheck,
  },
  {
    title: 'Thiết bị quay phim',
    subtitle: 'Camera, drone, gimbal và đèn studio',
    href: '/category/may-quay-phim',
    image: '/images/dji-mavic3-pro.png',
    icon: Camera,
  },
];

const serviceNotes = [
  [CalendarCheck, 'Đặt lịch linh hoạt', 'Chọn ngày thuê, số lượng và hình thức mua hoặc thuê theo nhu cầu.'],
  [Truck, 'Giao nhận rõ ràng', 'Thông tin đơn, cọc và trạng thái được kiểm tra trong hệ thống.'],
  [BadgeCheck, 'Thiết bị có chọn lọc', 'Hình ảnh, mô tả và giá được trình bày rõ để người dùng so sánh nhanh.'],
];

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await api.get('/products', { params: { limit: 8, type: 'all' } });
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
    }, 3600);

    return () => window.clearInterval(timer);
  }, []);

  const slide = heroSlides[activeSlide];
  const stats = useMemo(() => ([
    ['4+', 'Nhóm thiết bị'],
    ['24 giờ', 'Tư vấn đơn hàng'],
    ['1 ngày', 'Thuê ngắn hạn'],
    ['2 hình thức', 'Mua hoặc thuê'],
  ]), []);

  const goToSlide = (direction) => {
    setActiveSlide((current) => (
      direction === 'next'
        ? (current + 1) % heroSlides.length
        : (current - 1 + heroSlides.length) % heroSlides.length
    ));
  };

  return (
    <div className="min-h-screen bg-[#fff6e7] text-[#101018]">
      <section className="relative overflow-hidden border-b border-[#d8c7ad] bg-[#fff7ed]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,255,255,0.96),transparent_24%),radial-gradient(circle_at_74%_12%,rgba(255,122,26,0.22),transparent_30%),radial-gradient(circle_at_92%_68%,rgba(15,118,110,0.18),transparent_26%),linear-gradient(118deg,#fffaf0_0%,#ffe1bf_48%,#f8efe1_100%)]" />
        <div className="absolute left-1/2 top-12 h-32 w-[78rem] -translate-x-1/2 rounded-full bg-[#ff8a3d]/20 blur-2xl" />
        <div className="absolute left-6 top-14 hidden text-[10rem] font-black italic leading-none tracking-tight text-[#9a3412]/10 md:block">
          GearRental
        </div>
        <div className="absolute right-8 top-20 hidden text-[8rem] font-serif italic leading-none text-[#083344]/10 md:block">
          GR
        </div>

        <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-12 lg:pb-0">
          <div className="grid min-h-[760px] items-center gap-10 lg:grid-cols-[0.78fr_1.22fr]">
            <div key={activeSlide} className="hero-slide-copy relative z-10 max-w-xl pb-8">
              <p className={`mb-5 inline-flex rounded-full px-5 py-2 text-sm font-black uppercase tracking-[0.18em] shadow-sm ${slide.accent}`}>
                {slide.eyebrow}
              </p>
              <h1 className="max-w-2xl text-5xl font-black leading-[1.02] tracking-tight text-[#07111f] md:text-7xl">
                {slide.title}
              </h1>
              <p className="mt-5 text-2xl font-black text-[#0f766e] md:text-3xl">
                {slide.subtitle}
              </p>
              <p className="mt-5 max-w-lg rounded-2xl bg-white/38 p-5 text-lg font-semibold leading-8 text-[#2f2925] shadow-sm ring-1 ring-white/45 backdrop-blur">
                {slide.text}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={slide.primaryHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#083344] px-7 py-3 text-base font-black text-white shadow-[0_16px_28px_rgba(8,51,68,0.24)] transition hover:-translate-y-0.5 hover:bg-[#7f1d1d]"
                >
                  {slide.primaryLabel}
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/catalog"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#083344] bg-white/75 px-7 py-3 text-base font-black text-[#083344] transition hover:bg-white"
                >
                  Xem catalog
                </Link>
              </div>
            </div>

            <div className="relative min-h-[520px] lg:min-h-[760px]">
              <div className="absolute left-[18%] top-[12%] h-40 w-72 -rotate-6 rounded-2xl bg-[#ffcc32]/40 blur-md" />
              <div className="absolute right-[7%] top-[24%] h-56 w-56 rounded-full bg-[#0f766e]/18 blur-2xl" />
              <div className="absolute bottom-[18%] left-[18%] h-40 w-[28rem] rotate-[-5deg] rounded-full bg-[#ff7a1a]/24 blur-2xl" />

              <div className="absolute left-[50%] top-[42%] h-[29rem] w-[39rem] -translate-x-1/2 -translate-y-1/2 rounded-[4rem] bg-white/42 shadow-[0_36px_90px_rgba(126,50,13,0.16)] backdrop-blur-sm" />
              <div className="absolute left-[50%] top-[42%] h-[24rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-[3.25rem] bg-[linear-gradient(145deg,rgba(255,255,255,0.80),rgba(255,246,231,0.42))]" />

              <div className="absolute right-[5%] top-[17%] hidden rounded-[1.6rem] bg-white/55 px-5 py-4 text-sm font-black text-[#083344] shadow-[0_18px_34px_rgba(126,50,13,0.10)] backdrop-blur-md lg:block">
                Thiết bị rõ nhóm
              </div>
              <div className="absolute bottom-[20%] left-[14%] hidden rounded-[1.6rem] bg-[#083344]/92 px-5 py-4 text-sm font-black text-white shadow-[0_18px_34px_rgba(8,51,68,0.22)] lg:block">
                Thuê theo ngày
              </div>

              {heroSlides.map((item, index) => (
                <img
                  key={item.image}
                  src={item.image}
                  alt=""
                  className={`hero-product-image absolute left-[50%] top-[42%] w-[33rem] -translate-x-1/2 -translate-y-1/2 object-contain brightness-[1.04] contrast-[1.02] saturate-[1.03] drop-shadow-[0_34px_34px_rgba(28,20,17,0.20)] transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    index === activeSlide ? 'z-20 scale-100 opacity-100 blur-0' : 'z-10 scale-90 opacity-0 blur-[4px]'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3">
            <button
              type="button"
              onClick={() => goToSlide('prev')}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#083344] shadow-lg transition hover:bg-[#083344] hover:text-white"
              aria-label="Slide trước"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 rounded-full bg-white/85 px-4 py-3 shadow-lg backdrop-blur">
              {heroSlides.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  className={`h-3 rounded-full transition-all ${
                    index === activeSlide ? 'w-9 bg-[#083344]' : 'w-3 bg-[#083344]/30 hover:bg-[#083344]/60'
                  }`}
                  aria-label={`Chuyển tới slide ${index + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => goToSlide('next')}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#083344] shadow-lg transition hover:bg-[#083344] hover:text-white"
              aria-label="Slide sau"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#083344]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-5 py-8 md:grid-cols-4">
          {stats.map(([value, label]) => (
            <div key={label} className="rounded-2xl bg-white/8 px-5 py-4 text-center shadow-sm ring-1 ring-white/12">
              <p className="text-4xl font-black text-[#ffcc32]">{value}</p>
              <p className="mt-1 text-sm font-black uppercase tracking-[0.12em] text-white/80">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#fffdf8] px-5 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link key={category.title} to={category.href} className="group text-center">
                <div className="relative overflow-hidden rounded-2xl border border-[#e8ded0] bg-white shadow-[0_14px_34px_rgba(8,51,68,0.08)] transition duration-300 group-hover:-translate-y-1 group-hover:border-[#0f766e]/50 group-hover:shadow-[0_22px_48px_rgba(8,51,68,0.13)]">
                  <div className="absolute left-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[#083344] text-white shadow-md">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex aspect-square items-center justify-center p-8">
                    <img src={category.image} alt={category.title} className="max-h-full max-w-full object-contain transition duration-500 group-hover:scale-105" />
                  </div>
                </div>
                <h2 className="mt-5 text-xl font-black leading-6 text-[#07111f]">{category.title}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#4b3f39]">{category.subtitle}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-[#f8f3ea] px-5 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex items-center gap-6">
            <div className="h-0.5 flex-1 bg-[#083344]" />
            <h2 className="whitespace-nowrap text-3xl font-black tracking-tight text-[#07111f] md:text-4xl">
              Sản phẩm mới về
            </h2>
            <div className="h-0.5 flex-1 bg-[#083344]" />
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <Link key={product.id} to={`/products/${product.id}`} className="group">
                <div className="overflow-hidden rounded-2xl border border-[#e8ded0] bg-white shadow-[0_14px_34px_rgba(8,51,68,0.08)] transition duration-300 group-hover:-translate-y-1 group-hover:border-[#0f766e]/50 group-hover:shadow-[0_22px_48px_rgba(8,51,68,0.13)]">
                  <div className="flex aspect-[4/3] items-center justify-center rounded-b-2xl bg-[#f8fafc] p-5">
                    <img
                      src={product.image_url || fallbackImage}
                      alt={product.name}
                      onError={(event) => { event.currentTarget.src = fallbackImage; }}
                      className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f766e]">
                      {product.category_name || 'Thiết bị'}
                    </p>
                    <h3 className="mt-2 min-h-[3rem] text-xl font-black leading-6 text-[#07111f]">{product.name}</h3>
                    <div className="mt-4 space-y-1 text-sm font-semibold text-[#493b36]">
                      {product.price_sell > 0 && (
                        <p>Mua: <span className="font-black text-black">{formatCurrency(product.price_sell)}</span></p>
                      )}
                      {product.price_rent_per_day > 0 && (
                        <p>Thuê: <span className="font-black text-[#c2410c]">{formatCurrency(product.price_rent_per_day)}/ngày</span></p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link to="/catalog" className="inline-flex items-center gap-2 rounded-full bg-[#083344] px-8 py-3 font-black text-white transition hover:bg-[#7f1d1d]">
              Xem tất cả sản phẩm
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-[#d8c7ad] bg-[#fff7ed] px-5 py-14">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          {serviceNotes.map(([Icon, title, text]) => (
            <div key={title} className="flex gap-4 rounded-2xl border border-[#e8ded0] bg-white p-6 text-black shadow-[0_14px_34px_rgba(8,51,68,0.08)]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#083344] text-white">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black">{title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#3f3128]">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
