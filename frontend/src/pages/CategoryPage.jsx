import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Filter, SearchX, X } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatters';
import fallbackImage from '../assets/hero.png';

const categoryMap = {
  'thiet-bi-xay-dung': 1,
  'quan-ao-bao-ho': 2,
  'giay-dep': 3,
  'may-quay-phim': 4,
};

const categoryNameMap = {
  'thiet-bi-xay-dung': 'Thiết bị xây dựng',
  'quan-ao-bao-ho': 'Quần áo bảo hộ',
  'giay-dep': 'Giày dép chuyên dụng',
  'may-quay-phim': 'Thiết bị quay phim',
};

const CategoryPage = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search') || '';
  const currentType = searchParams.get('type') || 'all';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categoryName = slug
    ? categoryNameMap[slug]
    : (searchQuery ? `Kết quả tìm kiếm cho: "${searchQuery}"` : 'Tất cả sản phẩm');
  const categoryId = slug ? categoryMap[slug] : null;

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { limit: 20, type: currentType };
        if (categoryId) params.category = categoryId;
        if (searchQuery) params.search = searchQuery;

        const response = await api.get('/products', { params });
        if (response.data.success) {
          setProducts(response.data.data.items || []);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, searchQuery, currentType]);

  const handleTypeChange = (type) => {
    searchParams.set('type', type);
    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  const clearSearch = () => {
    searchParams.delete('search');
    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  const filters = [
    ['all', 'Tất cả'],
    ['buy', 'Chỉ bán'],
    ['rent', 'Chỉ cho thuê'],
  ];

  return (
    <div className="min-h-screen bg-[#f8f3ea] text-[#07111f]">
      <section className="relative overflow-hidden border-b border-[#d8c7ad] bg-[#fff7ed] px-5 py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,255,255,0.92),transparent_24%),radial-gradient(circle_at_80%_5%,rgba(249,115,22,0.18),transparent_28%),radial-gradient(circle_at_85%_70%,rgba(15,118,110,0.16),transparent_26%)]" />
        <div className="absolute left-8 top-4 hidden text-[7rem] font-black italic leading-none text-[#9a3412]/10 md:block">
          GearRental
        </div>
        <div className="relative mx-auto max-w-6xl text-center">
          <p className="mx-auto mb-4 inline-flex rounded-full bg-[#ffcc32] px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#07111f] shadow-sm">
            Bộ sưu tập thiết bị
          </p>
          <h1 className="text-4xl font-black tracking-tight text-[#07111f] md:text-5xl">{categoryName}</h1>
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-black text-[#083344] shadow-sm transition hover:bg-white hover:text-[#7f1d1d]"
            >
              Xóa tìm kiếm <X size={15} />
            </button>
          )}
          <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-[#3b332f]">
            Khám phá thiết bị, dụng cụ và đồ chuyên dụng chất lượng cao. Chọn mua hoặc thuê theo ngày với thông tin giá rõ ràng.
          </p>
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 md:flex-row">
        <aside className="w-full shrink-0 md:w-72">
          <div className="sticky top-28 rounded-2xl border border-[#e8ded0] bg-white/92 p-6 shadow-[0_14px_34px_rgba(8,51,68,0.08)] backdrop-blur">
            <h3 className="mb-5 flex items-center gap-2 text-lg font-black text-[#07111f]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#083344] text-white">
                <Filter size={18} />
              </span>
              Bộ lọc
            </h3>

            <div>
              <h4 className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-[#0f766e]">Loại hình</h4>
              <div className="grid gap-2">
                {filters.map(([value, label]) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
                      currentType === value
                        ? 'bg-[#083344] text-white shadow-sm'
                        : 'bg-[#f8fafc] text-[#4b3f39] hover:bg-[#fff7ed]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      checked={currentType === value}
                      onChange={() => handleTypeChange(value)}
                      className="text-[#0f766e] focus:ring-[#0f766e]"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          {loading ? (
            <div className="flex justify-center py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0f766e] border-t-transparent" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center font-bold text-rose-700">
              {error}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const imageUrl = product.image_url || fallbackImage;

                return (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-[#e8ded0] bg-white shadow-[0_14px_34px_rgba(8,51,68,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#0f766e]/50 hover:shadow-[0_22px_48px_rgba(8,51,68,0.13)]"
                  >
                    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-b-2xl bg-[#f8fafc] p-5">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        onError={(event) => { event.currentTarget.src = fallbackImage; }}
                        className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-[#0f766e]">
                        {product.category_name || 'Thiết bị'}
                      </p>
                      <h3 className="min-h-[3.2rem] text-xl font-black leading-6 text-[#07111f] transition group-hover:text-[#9a3412]">
                        {product.name}
                      </h3>
                      <div className="mt-5 space-y-2 text-sm font-semibold text-[#493b36]">
                        {product.price_sell > 0 && (
                          <p>Mua: <span className="font-black text-[#1d4ed8]">{formatCurrency(product.price_sell)}</span></p>
                        )}
                        {product.price_rent_per_day > 0 && (
                          <p>Thuê: <span className="font-black text-[#c2410c]">{formatCurrency(product.price_rent_per_day)}/ngày</span></p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-[#d8c7ad] bg-white/80 p-12 text-center text-[#4b3f39]">
              <SearchX size={52} className="mx-auto mb-4 text-[#c2410c]" />
              <p className="font-black">Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CategoryPage;
