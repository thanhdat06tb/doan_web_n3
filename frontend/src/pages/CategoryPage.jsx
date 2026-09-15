import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatters';
import { Filter, X } from 'lucide-react';
import api from '../utils/api';
import fallbackImage from '../assets/hero.png';

const categoryMap = {
  'thiet-bi-xay-dung': 1,
  'quan-ao-bao-ho': 2,
  'giay-dep': 3,
  'may-quay-phim': 4,
};

const categoryNameMap = {
  'thiet-bi-xay-dung': 'Thiết Bị Xây Dựng',
  'quan-ao-bao-ho': 'Quần Áo Bảo Hộ',
  'giay-dep': 'Giày Dép Chuyên Dụng',
  'may-quay-phim': 'Thiết Bị Quay Phim',
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

  const categoryName = slug ? categoryNameMap[slug] : (searchQuery ? `Kết quả tìm kiếm cho: "${searchQuery}"` : 'Tất cả sản phẩm');
  const categoryId = slug ? categoryMap[slug] : null;

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          limit: 20,
          type: currentType
        };
        if (categoryId) params.category = categoryId;
        if (searchQuery) params.search = searchQuery;

        const response = await api.get('/products', { params });
        if (response.data.success) {
          setProducts(response.data.data.items);
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

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{categoryName}</h1>
        {searchQuery && (
          <button onClick={clearSearch} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-full mb-4">
            Xóa tìm kiếm <X size={14} />
          </button>
        )}
        <p className="text-slate-500 max-w-2xl mx-auto">
          Khám phá các thiết bị, dụng cụ và đồ chuyên dụng chất lượng cao. Chúng tôi cung cấp cả dịch vụ bán và cho thuê để đáp ứng mọi nhu cầu của bạn.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filter */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-24">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Filter size={18} className="text-blue-600" /> Bộ lọc
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Loại hình</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="type" 
                      checked={currentType === 'all'} 
                      onChange={() => handleTypeChange('all')}
                      className="text-blue-600"
                    />
                    <span className="text-slate-600 text-sm">Tất cả</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="type" 
                      checked={currentType === 'buy'} 
                      onChange={() => handleTypeChange('buy')}
                      className="text-blue-600"
                    />
                    <span className="text-slate-600 text-sm">Chỉ bán</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="type" 
                      checked={currentType === 'rent'} 
                      onChange={() => handleTypeChange('rent')}
                      className="text-blue-600"
                    />
                    <span className="text-slate-600 text-sm">Chỉ cho thuê</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500 bg-red-50 rounded-xl">
              {error}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => {
                // Determine images, backend returns image_url as string or might be array if populated
                const imageUrl = product.image_url || fallbackImage;
                
                return (
                  <Link key={product.id} to={`/products/${product.id}`} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all group flex flex-col">
                    <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                      <img 
                        src={imageUrl} 
                        alt={product.name} 
                        onError={(event) => { event.currentTarget.src = fallbackImage; }}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 min-h-[3rem] group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="space-y-1">
                        {product.price_sell > 0 && (
                          <p className="text-sm text-slate-600">Mua: <span className="font-semibold text-blue-700">{formatCurrency(product.price_sell)}</span></p>
                        )}
                        {product.price_rent_per_day > 0 && (
                          <p className="text-sm text-slate-600">Thuê: <span className="font-semibold text-orange-600">{formatCurrency(product.price_rent_per_day)}/ngày</span></p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Package size={48} className="mx-auto mb-4 text-slate-300" />
              Không tìm thấy sản phẩm nào phù hợp với bộ lọc hiện tại.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Add missing icon
const Package = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

export default CategoryPage;
