import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Edit3,
  Eye,
  EyeOff,
  ImagePlus,
  PackageSearch,
  RefreshCw,
  Save,
  Search,
  X,
} from 'lucide-react';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/formatters';

const defaultFormValues = {
  category_id: '',
  name: '',
  description: '',
  price_sell: 0,
  price_rent_per_day: 0,
  deposit_amount: 0,
  stock_quantity: 0,
  image_url: '',
};

const ProductManagementPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', category: '', status: 'ALL', page: 1 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: defaultFormValues });

  const previewImage = watch('image_url');

  const queryParams = useMemo(() => ({
    page: filters.page,
    limit: 10,
    status: filters.status,
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.category ? { category: filters.category } : {}),
  }), [filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/products', { params: queryParams });
      if (response.data.success) {
        setProducts(response.data.data.items || []);
        setPagination(response.data.data.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error?.message || 'Không thể tải danh sách sản phẩm.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        if (response.data.success) setCategories(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch categories', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [queryParams]);

  const openEditModal = async (productId) => {
    setMessage(null);
    try {
      const response = await api.get(`/admin/products/${productId}`);
      if (response.data.success) {
        const product = response.data.data;
        setEditingProduct(product);
        reset({
          category_id: String(product.category_id),
          name: product.name,
          description: product.description || '',
          price_sell: product.price_sell || 0,
          price_rent_per_day: product.price_rent_per_day || 0,
          deposit_amount: product.deposit_amount || 0,
          stock_quantity: product.stock_quantity || 0,
          image_url: product.image_url || '',
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error?.message || 'Không thể mở sản phẩm.' });
    }
  };

  const closeEditModal = () => {
    setEditingProduct(null);
    reset(defaultFormValues);
  };

  const onSubmit = async (data) => {
    if (!editingProduct) return;
    setSaving(true);
    setMessage(null);

    const payload = {
      category_id: Number(data.category_id),
      name: data.name,
      description: data.description || '',
      price_sell: Number(data.price_sell || 0),
      price_rent_per_day: Number(data.price_rent_per_day || 0),
      deposit_amount: Number(data.deposit_amount || 0),
      stock_quantity: Number(data.stock_quantity || 0),
      image_url: data.image_url || '',
    };

    try {
      await api.put(`/admin/products/${editingProduct.id}`, payload);
      setMessage({ type: 'success', text: 'Đã cập nhật sản phẩm.' });
      closeEditModal();
      fetchProducts();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error?.message || 'Cập nhật sản phẩm thất bại.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (product) => {
    const nextActive = !product.is_active;
    const confirmText = nextActive
      ? `Mở lại kinh doanh "${product.name}"?`
      : `Ngừng kinh doanh "${product.name}"? Sản phẩm sẽ ẩn khỏi trang khách hàng.`;
    if (!window.confirm(confirmText)) return;

    try {
      await api.patch(`/admin/products/${product.id}/active`, { is_active: nextActive });
      setMessage({ type: 'success', text: nextActive ? 'Đã mở lại sản phẩm.' : 'Đã ngừng kinh doanh sản phẩm.' });
      fetchProducts();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error?.message || 'Không thể đổi trạng thái sản phẩm.' });
    }
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Vui lòng chọn file ảnh.' });
      return;
    }

    setUploading(true);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const response = await api.post('/admin/products/upload-image', {
          fileName: file.name,
          dataUrl: reader.result,
        });
        if (response.data.success) {
          setValue('image_url', response.data.data.imageUrl, { shouldDirty: true });
          setMessage({ type: 'success', text: 'Upload ảnh thành công, URL đã được điền vào form.' });
        }
      } catch (error) {
        setMessage({ type: 'error', text: error.response?.data?.error?.message || 'Upload ảnh thất bại.' });
      } finally {
        setUploading(false);
        event.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-wide text-white">
            <PackageSearch className="h-6 w-6 text-blue-400" />
            Quản lý sản phẩm
          </h1>
          <p className="mt-1 text-xs text-slate-400">Tìm kiếm, sửa thông tin, upload ảnh và ngừng kinh doanh sản phẩm.</p>
        </div>
        <button
          onClick={fetchProducts}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
          Làm mới
        </button>
      </div>

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
          message.type === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 lg:grid-cols-[1fr_220px_180px]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setFilters((current) => ({ ...current, page: 1 }));
            fetchProducts();
          }}
          className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2"
        >
          <Search className="h-4 w-4 text-slate-500" />
          <input
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Tìm theo tên hoặc mô tả..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </form>

        <select
          value={filters.category}
          onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value, page: 1 }))}
          className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-semibold text-white outline-none"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}
          className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-semibold text-white outline-none"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang kinh doanh</option>
          <option value="INACTIVE">Đã ngừng</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-900 text-xs uppercase text-slate-400">
              <tr>
                <th className="p-3">Sản phẩm</th>
                <th className="p-3">Danh mục</th>
                <th className="p-3 text-right">Giá bán</th>
                <th className="p-3 text-right">Giá thuê/ngày</th>
                <th className="p-3 text-center">Tồn</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">Đang tải sản phẩm...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">Không có sản phẩm phù hợp.</td>
                </tr>
              ) : products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-900/60">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image_url || '/images/bosch-gbh226.png'}
                        alt={product.name}
                        className="h-14 w-16 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-bold text-white">#{product.id} {product.name}</p>
                        <p className="mt-1 max-w-md truncate text-xs text-slate-500">{product.description || 'Chưa có mô tả'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-slate-300">{product.category_name}</td>
                  <td className="p-3 text-right font-semibold text-blue-300">{product.price_sell > 0 ? formatCurrency(product.price_sell) : '-'}</td>
                  <td className="p-3 text-right font-semibold text-orange-300">{product.price_rent_per_day > 0 ? formatCurrency(product.price_rent_per_day) : '-'}</td>
                  <td className="p-3 text-center font-bold text-white">{product.stock_quantity}</td>
                  <td className="p-3 text-center">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      product.is_active ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {product.is_active ? 'Đang bán/thuê' : 'Đã ngừng'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(product.id)}
                        className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-500"
                        title="Sửa sản phẩm"
                        aria-label="Sửa sản phẩm"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(product)}
                        className={`rounded-lg p-2 text-white ${product.is_active ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
                        title={product.is_active ? 'Ngừng kinh doanh' : 'Mở lại kinh doanh'}
                        aria-label={product.is_active ? 'Ngừng kinh doanh' : 'Mở lại kinh doanh'}
                      >
                        {product.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>Trang {pagination.page || filters.page} / {pagination.totalPages || 1}</span>
        <div className="flex gap-2">
          <button
            disabled={(pagination.page || 1) <= 1}
            onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
            className="rounded-lg border border-slate-700 px-3 py-1.5 font-bold disabled:opacity-40"
          >
            Trước
          </button>
          <button
            disabled={(pagination.page || 1) >= (pagination.totalPages || 1)}
            onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
            className="rounded-lg border border-slate-700 px-3 py-1.5 font-bold disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
              <div>
                <h2 className="text-xl font-black text-white">Sửa sản phẩm #{editingProduct.id}</h2>
                <p className="text-xs text-slate-500">Giá trong đơn hàng cũ vẫn được giữ theo snapshot lúc đặt.</p>
              </div>
              <button onClick={closeEditModal} className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-300">Tên sản phẩm</span>
                    <input
                      {...register('name', { required: 'Tên sản phẩm là bắt buộc' })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-white outline-none focus:border-blue-500"
                    />
                    {errors.name && <span className="text-xs text-rose-400">{errors.name.message}</span>}
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-300">Danh mục</span>
                    <select
                      {...register('category_id', { required: 'Vui lòng chọn danh mục' })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-white outline-none focus:border-blue-500"
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-bold text-slate-300">Mô tả</span>
                  <textarea
                    rows="4"
                    {...register('description')}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-300">Giá bán</span>
                    <input type="number" min="0" {...register('price_sell')} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-white outline-none focus:border-blue-500" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-300">Giá thuê/ngày</span>
                    <input type="number" min="0" {...register('price_rent_per_day')} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-white outline-none focus:border-blue-500" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-300">Tiền cọc</span>
                    <input type="number" min="0" {...register('deposit_amount')} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-white outline-none focus:border-blue-500" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-300">Tồn kho</span>
                    <input type="number" min="0" {...register('stock_quantity')} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-white outline-none focus:border-blue-500" />
                  </label>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-bold text-slate-300">URL ảnh</span>
                  <input
                    {...register('image_url')}
                    placeholder="/images/ten-anh.png hoặc https://..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-white outline-none focus:border-blue-500"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" className="h-56 w-full object-cover" />
                  ) : (
                    <div className="flex h-56 flex-col items-center justify-center text-slate-500">
                      <ImagePlus className="mb-2 h-9 w-9" />
                      Chưa có ảnh
                    </div>
                  )}
                </div>

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-blue-500/50 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 hover:bg-blue-500/20">
                  <ImagePlus className="h-4 w-4" />
                  {uploading ? 'Đang upload...' : 'Upload ảnh'}
                  <input type="file" accept="image/*" onChange={uploadImage} disabled={uploading} className="hidden" />
                </label>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagementPage;
