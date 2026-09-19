import React, { useEffect } from 'react';
import {
  CalendarCheck,
  ClipboardCheck,
  FileCheck2,
  Megaphone,
  PackageCheck,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react';

const heroBackdropImages = [
  {
    src: '/images/concrete-mixer-350-angle.png',
    className: 'left-[56%] top-8 h-48 w-72 rotate-[-7deg] opacity-50',
  },
  {
    src: '/images/quan-ao-bao-ho-angle.png',
    className: 'right-10 top-24 h-72 w-56 rotate-[5deg] opacity-45',
  },
  {
    src: '/images/sony-a7iii-angle.png',
    className: 'left-[47%] top-[44%] h-60 w-80 rotate-[3deg] opacity-42',
  },
  {
    src: '/images/makita-4100nh-angle.png',
    className: 'right-[17%] bottom-12 h-48 w-72 rotate-[-5deg] opacity-40',
  },
  {
    src: '/images/godox-sl150w-angle.png',
    className: 'left-[67%] bottom-28 h-48 w-60 rotate-[8deg] opacity-35',
  },
];

const events = [
  {
    date: 'Tháng 9/2026',
    title: 'Tuần lễ thiết bị công trình',
    text: 'Giới thiệu nhóm máy khoan, máy cắt, máy trộn và đồ bảo hộ cho đội thi công cần thuê nhanh theo ngày.',
  },
  {
    date: 'Tháng 10/2026',
    title: 'Gói hỗ trợ studio & lớp thực hành',
    text: 'Tập trung thiết bị quay phim, ánh sáng và phụ kiện phục vụ workshop, quay sự kiện nhỏ và bài thực hành.',
  },
  {
    date: 'Đang triển khai',
    title: 'Chuẩn hóa chứng từ đơn hàng',
    text: 'Mỗi đơn có thông tin khách, sản phẩm, giá, ngày thuê/mua, tiền cọc và trạng thái để dễ đối soát.',
  },
];

const highlights = [
  {
    icon: CalendarCheck,
    title: 'Sự kiện & dự án',
    text: 'GearRental hỗ trợ đội thi công, studio, lớp học thực hành và sự kiện ngắn ngày với quy trình đặt lịch rõ ràng.',
  },
  {
    icon: FileCheck2,
    title: 'Chứng từ minh bạch',
    text: 'Mỗi đơn hàng có thông tin sản phẩm, chi phí, ngày thuê, tiền cọc và trạng thái xử lý để hai bên dễ đối soát.',
  },
  {
    icon: ShieldCheck,
    title: 'Kiểm định thiết bị',
    text: 'Thiết bị được phân nhóm, theo dõi tồn kho và kiểm tra tình trạng trước khi bàn giao hoặc hoàn tất thuê.',
  },
];

const milestones = [
  'Tư vấn chọn thiết bị theo nhu cầu thực tế',
  'Xác nhận lịch thuê, đặt cọc và phương thức nhận hàng',
  'Bàn giao thiết bị kèm thông tin kiểm tra',
  'Hoàn tất đơn, xử lý cọc và lưu lịch sử giao dịch',
];

const proofCards = [
  {
    label: 'Quy trình',
    title: 'Theo dõi đơn hàng đầy đủ',
    text: 'Người dùng có thể xem trạng thái đơn, chi tiết sản phẩm, giá, ngày thuê/mua và thông tin giao nhận.',
  },
  {
    label: 'Vận hành',
    title: 'Quản trị viên kiểm soát kho',
    text: 'Trang quản trị hỗ trợ duyệt đơn, theo dõi đơn đang thuê, cảnh báo tồn kho thấp và xử lý hoàn trả.',
  },
  {
    label: 'Cam kết',
    title: 'Chi phí rõ trước khi đặt',
    text: 'Giá mua, giá thuê theo ngày, số ngày, tiền cọc và tổng thanh toán được tách riêng để dễ hiểu.',
  },
];

const serviceCards = [
  {
    icon: PackageCheck,
    title: 'Thiết bị theo nhóm nhu cầu',
    text: 'Máy xây dựng, đồ bảo hộ và thiết bị quay phim được sắp xếp thành nhóm rõ ràng để người thuê chọn nhanh.',
  },
  {
    icon: Wrench,
    title: 'Bàn giao có kiểm tra',
    text: 'Mỗi thiết bị cần có tình trạng trước khi giao, giúp hạn chế nhầm lẫn khi hoàn trả hoặc tính cọc.',
  },
  {
    icon: Truck,
    title: 'Luồng thuê linh hoạt',
    text: 'Người dùng chọn ngày thuê, số lượng, hình thức mua hoặc thuê và theo dõi đơn sau khi đặt.',
  },
  {
    icon: ClipboardCheck,
    title: 'Thông tin đơn dễ đọc',
    text: 'Đơn hàng ưu tiên hiển thị ai đặt, đặt sản phẩm gì, tổng tiền, thanh toán và tình trạng xử lý.',
  },
];

const ParallaxBackdrop = ({ title, eyebrow, text, image, reverse = false }) => (
  <section className="about-parallax relative isolate min-h-[520px] overflow-hidden bg-[#083344] px-5 py-24 text-white">
    <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(8,51,68,0.98)_0%,rgba(8,51,68,0.82)_46%,rgba(255,135,83,0.74)_100%)]" />
    <div
      className={`absolute top-[-10%] hidden h-[118%] w-[54%] transition-transform duration-200 ease-out lg:block ${
        reverse ? 'left-0' : 'right-0'
      }`}
      style={{ transform: 'translate3d(0, var(--move, 0px), 0)' }}
    >
      <img src={image} alt="" className="h-full w-full object-contain opacity-55 saturate-125" />
    </div>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,204,50,0.16),transparent_30%),radial-gradient(circle_at_78%_70%,rgba(255,255,255,0.14),transparent_28%)]" />
    <div className="relative mx-auto max-w-7xl">
      <div className={`max-w-2xl ${reverse ? 'ml-auto' : ''}`}>
        <p className="mb-4 inline-flex rounded-full bg-[#ffcc32] px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#07111f]">
          {eyebrow}
        </p>
        <h2 className="text-4xl font-black leading-tight lg:text-6xl">{title}</h2>
        <p className="mt-6 rounded-2xl border border-white/18 bg-white/10 p-6 text-base font-semibold leading-8 text-white/82 backdrop-blur-sm">
          {text}
        </p>
      </div>
    </div>
  </section>
);

const AboutPage = () => {
  useEffect(() => {
    let frame = 0;

    const updateParallax = () => {
      const sections = document.querySelectorAll('.about-parallax');

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const viewport = window.innerHeight || 1;
        const progress = (viewport - rect.top) / (viewport + rect.height);
        const clamped = Math.max(0, Math.min(1, progress));
        section.style.setProperty('--move', `${(clamped - 0.5) * -70}px`);
      });
    };

    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#fff6e7] text-[#07111f]">
      <section className="about-parallax relative min-h-[760px] overflow-hidden bg-[linear-gradient(120deg,#fff7e8_0%,#ffd89b_48%,#ff8553_100%)] px-5 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_15%,rgba(8,51,68,0.22),transparent_30%),radial-gradient(circle_at_70%_86%,rgba(15,118,110,0.18),transparent_26%)]" />
        <div
          className="absolute inset-y-0 right-0 hidden w-[58%] transition-transform duration-200 ease-out lg:block"
          style={{ transform: 'translate3d(0, var(--move, 0px), 0)' }}
        >
          {heroBackdropImages.map((image) => (
            <div
              key={image.src}
              className={`absolute overflow-hidden rounded-2xl border border-white/45 bg-white/55 p-2 shadow-[0_24px_70px_rgba(7,17,31,0.18)] backdrop-blur-[2px] ${image.className}`}
            >
              <img src={image.src} alt="" className="h-full w-full rounded-xl object-contain" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,246,231,0.98)_0%,rgba(255,236,204,0.9)_39%,rgba(255,188,118,0.42)_100%)]" />
        <div className="absolute inset-x-0 top-20 select-none text-center text-[12vw] font-black italic leading-none text-[#7c2d12]/10">
          THÔNG TIN
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <p className="mb-5 inline-flex rounded-full bg-[#083344] px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
              Thông tin GearRental
            </p>
            <h1 className="max-w-3xl text-5xl font-black leading-[1.02] tracking-tight lg:text-7xl">
              Nền tảng thuê và mua thiết bị chuyên dụng cho dự án gọn hơn.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-[#4b3f39]">
              GearRental gom thiết bị, lịch thuê, chứng từ và trạng thái đơn hàng vào một luồng dễ hiểu.
              Người dùng không cần ôm kho, đội vận hành vẫn theo dõi được thiết bị, cọc và lịch bàn giao.
            </p>
            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                ['24h', 'Tư vấn & xác nhận'],
                ['4+', 'Nhóm thiết bị'],
                ['2', 'Mua hoặc thuê'],
              ].map(([number, label]) => (
                <div key={label} className="rounded-3xl bg-white/78 p-5 shadow-[0_12px_30px_rgba(126,50,13,0.10)]">
                  <p className="text-3xl font-black text-[#083344]">{number}</p>
                  <p className="text-sm font-bold text-[#4b3f39]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/55 bg-white/76 p-6 shadow-[0_22px_56px_rgba(126,50,13,0.16)] backdrop-blur-sm">
            <div className="mb-5 flex items-center gap-3">
              <Megaphone className="h-7 w-7 text-[#be123c]" />
              <h2 className="text-2xl font-black">Bảng tin & sự kiện</h2>
            </div>
            <div className="space-y-4">
              {events.map((event) => (
                <article key={event.title} className="rounded-[1.35rem] border border-[#f3c17a] bg-[#fffdf8] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9a3412]">{event.date}</p>
                  <h3 className="mt-2 text-lg font-black">{event.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#4b3f39]">{event.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0f766e]">Thông tin nền tảng</p>
            <h2 className="mt-2 text-4xl font-black leading-tight lg:text-5xl">
              Không phải trang bán hàng, đây là cách GearRental vận hành.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-2xl border border-[#f3c17a] bg-white/92 p-7 shadow-[0_16px_36px_rgba(126,50,13,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(126,50,13,0.12)]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1d6] text-[#0f766e]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-black">{item.title}</h3>
                  <p className="mt-3 text-sm font-semibold leading-7 text-[#4b3f39]">{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <ParallaxBackdrop
        eyebrow="Năng lực phục vụ"
        title="Một hệ thống cho nhiều kiểu dự án."
        text="Từ công trình nhỏ, lớp thực hành, workshop quay dựng đến sự kiện ngắn ngày, GearRental tập trung vào việc gom thiết bị đúng nhóm, đúng lịch và đúng trạng thái để người dùng không phải tự quản quá nhiều đầu việc."
        image="/images/sony-a7iii-angle.png"
      />

      <section className="px-5 py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#be123c]">Dịch vụ chính</p>
            <h2 className="mt-3 text-4xl font-black leading-tight lg:text-5xl">Các mảnh vận hành được tách rõ để dễ mở rộng.</h2>
            <p className="mt-5 text-base font-semibold leading-8 text-[#4b3f39]">
              Phần này giúp trang Thông tin dài hơn, có nhịp đọc rõ hơn và giải thích được giá trị thật của website.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {serviceCards.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-2xl border border-[#f3c17a] bg-white p-7 shadow-[0_16px_36px_rgba(126,50,13,0.08)]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#083344] text-[#ffcc32]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-black">{item.title}</h3>
                  <p className="mt-3 text-sm font-semibold leading-7 text-[#4b3f39]">{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <ParallaxBackdrop
        reverse
        eyebrow="Quy trình dịch vụ"
        title="Từ nhu cầu đến chứng từ đều có điểm kiểm soát."
        text="GearRental tập trung vào trải nghiệm thuê/mua rõ ràng: chọn thiết bị đúng việc, biết chi phí trước, lưu đơn hàng sau khi hoàn tất và giảm sai lệch khi bàn giao."
        image="/images/concrete-mixer-350-angle.png"
      />

      <section className="px-5 py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0f766e]">Luồng xử lý</p>
            <h2 className="mt-3 text-4xl font-black leading-tight lg:text-5xl">Các bước thuê được trình bày như một timeline.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {milestones.map((item, index) => (
              <div key={item} className="rounded-2xl border border-[#f3c17a] bg-white/92 p-6 shadow-[0_16px_36px_rgba(126,50,13,0.08)]">
                <span className="text-sm font-black text-[#0f766e]">0{index + 1}</span>
                <p className="mt-3 text-lg font-black">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ParallaxBackdrop
        eyebrow="Chứng từ & niềm tin"
        title="Minh bạch để dùng lâu dài."
        text="Trang không chỉ đẹp ở giao diện, mà còn cần giúp người thuê hiểu đơn hàng của mình: ai đặt, sản phẩm gì, thời gian nào, thanh toán ra sao và trạng thái hiện tại là gì."
        image="/images/quan-ao-bao-ho-angle.png"
      />

      <section className="px-5 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#be123c]">Cam kết vận hành</p>
            <h2 className="mt-2 text-4xl font-black">Thông tin rõ để người dùng yên tâm.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {proofCards.map((card) => (
              <article key={card.title} className="rounded-2xl border border-[#f3c17a] bg-white p-7 shadow-[0_16px_36px_rgba(126,50,13,0.08)]">
                <p className="mb-4 inline-flex rounded-full bg-[#fff1d6] px-4 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#9a3412]">
                  {card.label}
                </p>
                <h3 className="text-xl font-black">{card.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-[#4b3f39]">{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
