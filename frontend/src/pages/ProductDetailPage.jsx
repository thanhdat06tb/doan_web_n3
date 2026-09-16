import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ImageGallery from '../components/Product/ImageGallery';
import LiveConfigurator from '../components/Product/LiveConfigurator';
import api from '../utils/api';
import { mockProducts } from '../utils/mockData';

const exactExtraImagesByProductId = {
  1: ['/images/bosch-gbh226-angle.png', '/images/bosch-gbh226-color.png'],
  2: ['/images/makita-4100nh-angle.png', '/images/makita-4100nh-color.png'],
  3: ['/images/concrete-mixer-350-angle.png', '/images/concrete-mixer-350-color.png'],
  4: ['/images/ao-phan-quang-bao-ho-angle.png', '/images/ao-phan-quang-bao-ho-color.png'],
  5: ['/images/quan-ao-bao-ho-angle.png', '/images/quan-ao-bao-ho-color.png'],
  6: ['/images/giay-bao-ho-angle.png', '/images/giay-bao-ho-color.png'],
  7: ['/images/sony-a7iii-angle.png', '/images/sony-a7iii-color.png'],
  8: ['/images/dji-ronin-rs3-angle.png', '/images/dji-ronin-rs3-color.png'],
  9: ['/images/dji-mavic3-pro-angle.png', '/images/dji-mavic3-pro-color.png'],
  10: ['/images/godox-sl150w-angle.png', '/images/godox-sl150w-color.png'],
};

const makeImageVariant = (src, label, imageClassName = '') => ({
  image_url: src,
  label,
  imageClassName,
});

const getProductGalleryImages = (product) => {
  const apiImages = Array.isArray(product.images)
    ? product.images.map((image) => (typeof image === 'string' ? image : image.image_url)).filter(Boolean)
    : [];

  const exactImages = [
    product.image_url,
    ...apiImages,
    ...(exactExtraImagesByProductId[product.id] || []),
  ].filter(Boolean);

  const uniqueExactImages = [...new Set(exactImages)];
  const labels = ['Nguyên bản', 'Góc chụp khác', 'Màu sắc khác'];
  return uniqueExactImages.map((src, index) => makeImageVariant(src, labels[index] || `Góc ${index + 1}`));
};

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
            images={getProductGalleryImages(product)}
            availableQty={product.availableQtyToday ?? product.stock_quantity}
          />
          
          <div className="mt-10">
            <h2 className="mb-4 text-2xl font-bold">Thông tin sản phẩm</h2>
            <div className="prose max-w-none text-slate-300">
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
