import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Save, X, Image as ImageIcon } from 'lucide-react';
import api from '../../utils/api';

const AddProductPage = () => {
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm({
    defaultValues: {
      price_sell: 0,
      price_rent_per_day: 0,
      deposit_amount: 0,
      stock_quantity: 0,
    }
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const previewImage = watch('image_url');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        if (response.data.success) {
          setCategories(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };
    fetchCategories();
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    setSubmitError(null);
    try {
      // Transform string to numbers where needed
      const payload = {
        ...data,
        category_id: parseInt(data.category_id, 10),
        price_sell: parseFloat(data.price_sell),
        price_rent_per_day: parseFloat(data.price_rent_per_day),
        deposit_amount: parseFloat(data.deposit_amount),
        stock_quantity: parseInt(data.stock_quantity, 10),
      };

      const response = await api.post('/admin/products', payload);
      if (response.data.success) {
        alert('Thêm sản phẩm thành công!');
        reset();
        // Option to navigate back to a product list: navigate('/admin/products');
      }
    } catch (err) {
      setSubmitError(err.response?.data?.error?.message || err.message || 'Lỗi thêm sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2">
            <Plus className="w-6 h-6 text-blue-500" />
            Thêm Sản Phẩm Mới
          </h1>
          <p className="text-xs text-slate-400 mt-1">Điền thông tin để đăng bán hoặc cho thuê sản phẩm</p>
        </div>
      </div>

      {submitError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3">
          <X className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-300 font-medium">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg space-y-6">
        
        {/* Row 1: Name and Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Tên Sản Phẩm <span className="text-rose-500">*</span></label>
            <input
              type="text"
              {...register('name', { required: 'Tên sản phẩm là bắt buộc' })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="VD: Lều Cắm Trại 4 Người"
            />
            {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Danh Mục <span className="text-rose-500">*</span></label>
            <select
              {...register('category_id', { required: 'Vui lòng chọn danh mục' })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.category_id && <p className="text-xs text-rose-400 mt-1">{errors.category_id.message}</p>}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Mô Tả Sản Phẩm</label>
          <textarea
            {...register('description')}
            rows="4"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
            placeholder="Mô tả chi tiết, tính năng nổi bật..."
          ></textarea>
        </div>

        <div className="border-t border-slate-800/50 my-6"></div>

        {/* Row 2: Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Giá Bán (VND)</label>
            <div className="relative">
              <input
                type="number"
                {...register('price_sell', { min: 0 })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-12 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="0"
              />
              <span className="absolute right-4 top-2.5 text-xs text-slate-500 font-medium">VND</span>
            </div>
            <p className="text-[11px] text-slate-500">Để 0 nếu chỉ cho thuê.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Giá Thuê / Ngày (VND)</label>
            <div className="relative">
              <input
                type="number"
                {...register('price_rent_per_day', { min: 0 })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-12 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="0"
              />
              <span className="absolute right-4 top-2.5 text-xs text-slate-500 font-medium">VND</span>
            </div>
            <p className="text-[11px] text-slate-500">Để 0 nếu chỉ bán.</p>
          </div>
        </div>

        {/* Row 3: Deposit & Stock */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Tiền Cọc Thuê (VND)</label>
            <div className="relative">
              <input
                type="number"
                {...register('deposit_amount', { min: 0 })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-12 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="0"
              />
              <span className="absolute right-4 top-2.5 text-xs text-slate-500 font-medium">VND</span>
            </div>
            <p className="text-[11px] text-slate-500">Bắt buộc khi có giá thuê.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Số Lượng Tồn Kho <span className="text-rose-500">*</span></label>
            <input
              type="number"
              {...register('stock_quantity', { required: 'Bắt buộc', min: 0 })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="0"
            />
          </div>
        </div>

        <div className="border-t border-slate-800/50 my-6"></div>

        {/* Image URL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">URL Ảnh Đại Diện</label>
            <input
              type="text"
              {...register('image_url')}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-[11px] text-slate-500">Dán link ảnh trực tiếp (JPG, PNG).</p>
          </div>
          
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50 h-32 overflow-hidden relative">
            {previewImage ? (
              <img src={previewImage} alt="Preview" className="w-full h-full object-contain p-2" onError={(e) => { e.target.style.display='none' }} />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-600">
                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs font-medium">Preview Ảnh</span>
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            Lưu Sản Phẩm
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddProductPage;
