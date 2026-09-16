import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ImageGallery from '../components/Product/ImageGallery';
import LiveConfigurator from '../components/Product/LiveConfigurator';
import api from '../utils/api';
import { mockProducts } from '../utils/mockData';

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const productId = parseInt(id, 10) || 1; 
    
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/products/${productId}`);
        if (response.data.success) {
          setProduct(response.data.data);
        } else {
          throw new Error('API Error');
        }
      } catch (error) {
        if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
          console.warn("Backend not available, using mock data", error.message);
          const foundProduct = mockProducts.find(p => p.id === productId) || mockProducts[0];
          setProduct(foundProduct);
        } else {
          setProduct(null);
          setError('Không thể tải sản phẩm từ máy chủ. Vui lòng kiểm tra backend và thử lại.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-4">
          <div className="aspect-[4/3] animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-7 w-56 animate-pulse rounded bg-slate-200" />
          <div className="h-20 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-[520px] animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 text-center" role="alert">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <h1 className="text-xl font-black text-rose-700">Không tải được sản phẩm</h1>
          <p className="mt-2 text-sm leading-6 text-rose-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 text-center">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-black text-slate-900">Không tìm thấy sản phẩm</h1>
          <p className="mt-2 text-sm text-slate-500">Sản phẩm có thể đã ngừng kinh doanh hoặc đường dẫn không đúng.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        {/* Cột trái 60%: Gallery ảnh */}
        <div className="w-full lg:w-3/5">
          <ImageGallery
            images={(product.images && product.images.length > 0) ? product.images : [product.image_url]}
            availableQty={product.availableQtyToday ?? product.stock_quantity}
          />
          
          <div className="mt-10">
            <h2 className="mb-4 text-2xl font-bold">Thông tin sản phẩm</h2>
            <div className="prose max-w-none text-gray-700">
              <p>{product.description || 'Sản phẩm chưa có mô tả chi tiết.'}</p>
            </div>
          </div>
        </div>

        {/* Cột phải 40%: Configurator */}
        <div className="w-full lg:w-2/5">
          <div className="sticky top-8">
            <LiveConfigurator product={product} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
