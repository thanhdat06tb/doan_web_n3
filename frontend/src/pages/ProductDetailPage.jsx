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
    return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600" role="alert">{error}</div>;
  }

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center">Không tìm thấy sản phẩm.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Cột trái 60%: Gallery ảnh */}
        <div className="w-full lg:w-3/5">
          <ImageGallery
            images={(product.images && product.images.length > 0) ? product.images : [product.image_url]}
            availableQty={product.availableQtyToday ?? product.stock_quantity}
          />
          
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-4">Thông số kỹ thuật</h2>
            <div className="prose max-w-none text-gray-700">
              <p>{product.description}</p>
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
