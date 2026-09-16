// ═══════════════════════════════════════════════════════════════
// 🛡️ Admin Routes — API Endpoints cho Admin Panel
// Protected by authenticate + requireAdmin middleware
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const { z } = require('zod');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const adminService = require('../services/adminService');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { ERROR_CODES } = require('../constants/errorCodes');
const validateRequest = require('../middleware/validateRequest');

const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID phải là số.').transform(Number),
});

const adminOrdersQuerySchema = z.object({
  status: z.enum(['ALL', 'PENDING', 'APPROVED', 'RENTING', 'COMPLETED', 'CANCELLED']).optional().default('ALL'),
  search: z.string().trim().max(100, 'Từ khóa tìm kiếm tối đa 100 ký tự.').optional().default(''),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
});

const adminProductsQuerySchema = z.object({
  search: z.string().trim().max(100, 'Từ khóa tìm kiếm tối đa 100 ký tự.').optional().default(''),
  category: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.enum(['ALL', 'ACTIVE', 'INACTIVE']).optional().default('ALL'),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
});

const updateStatusSchema = z.object({
  status: z.enum(['APPROVED', 'RENTING', 'CANCELLED', 'COMPLETED'], {
    errorMap: () => ({ message: 'Trạng thái không hợp lệ.' }),
  }),
});

const itemConditionSchema = z.object({
  orderDetailId: z.number().int().positive('orderDetailId phải là số nguyên dương.'),
  condition: z.enum(['GOOD', 'DAMAGED', 'LOST']),
  damageNote: z.string().max(500).optional().default(''),
  deductAmount: z.number().min(0, 'Số tiền khấu trừ không được âm.').optional().default(0),
}).refine(
  (item) => item.condition !== 'DAMAGED' || item.deductAmount > 0,
  { message: 'Sản phẩm hư hỏng phải có số tiền khấu trừ lớn hơn 0.', path: ['deductAmount'] }
);

const completeOrderSchema = z.object({
  itemConditions: z.array(itemConditionSchema).min(1, 'Phải chọn tình trạng cho ít nhất một sản phẩm.'),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày trả phải có định dạng YYYY-MM-DD.'),
  returnNote: z.string().max(500).optional().default(''),
});

const createProductSchema = z.object({
  category_id: z.number().int().positive('Vui lòng chọn danh mục.'),
  name: z.string().trim().min(2, 'Tên sản phẩm phải có ít nhất 2 ký tự.').max(150),
  description: z.string().max(2000).optional().default(''),
  price_sell: z.number().min(0).optional().default(0),
  price_rent_per_day: z.number().min(0).optional().default(0),
  deposit_amount: z.number().min(0).optional().default(0),
  stock_quantity: z.number().int().min(0).optional().default(0),
  image_url: z.string().max(1000).optional().default(''),
}).refine(
  (product) => product.price_sell > 0 || product.price_rent_per_day > 0,
  { message: 'Sản phẩm phải có giá bán hoặc giá thuê.' }
).refine(
  (product) => product.price_rent_per_day <= 0 || product.deposit_amount > 0,
  { message: 'Sản phẩm cho thuê phải có tiền cọc lớn hơn 0.', path: ['deposit_amount'] }
);

const updateProductSchema = createProductSchema;

const setProductActiveSchema = z.object({
  is_active: z.boolean(),
});

const uploadProductImageSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  dataUrl: z.string().min(50, 'Ảnh không hợp lệ.').max(7_000_000, 'Ảnh tối đa khoảng 5MB.'),
});

// Yêu cầu đăng nhập + quyền Admin cho toàn bộ routes bên dưới
router.use(authenticate, requireAdmin);

/**
 * GET /api/admin/dashboard/summary
 * Thống kê tổng quan KPI, doanh thu, cọc và Top 5 sản phẩm thuê
 */
router.get('/dashboard/summary', (req, res) => {
  try {
    const data = adminService.getDashboardSummary();
    res.json(successResponse(data));
  } catch (error) {
    res.status(error.status || 500).json(
      errorResponse(error.code || 'INTERNAL_ERROR', error.message || 'Lỗi hệ thống khi lấy dữ liệu tổng quan.')
    );
  }
});

/**
 * GET /api/admin/dashboard/revenue-chart?period=7d|30d|12m
 * Dữ liệu biểu đồ doanh thu theo thời gian
 */
router.get('/dashboard/revenue-chart', (req, res) => {
  try {
    const { period } = req.query;
    const data = adminService.getRevenueChartData(period);
    res.json(successResponse(data));
  } catch (error) {
    res.status(error.status || 500).json(
      errorResponse(error.code || 'INTERNAL_ERROR', error.message)
    );
  }
});

/**
 * GET /api/admin/dashboard/product-utilization
 * Tỷ lệ sử dụng số ngày thuê của sản phẩm
 */
router.get('/dashboard/product-utilization', (req, res) => {
  try {
    const data = adminService.getProductUtilization();
    res.json(successResponse(data));
  } catch (error) {
    res.status(error.status || 500).json(
      errorResponse(error.code || 'INTERNAL_ERROR', error.message)
    );
  }
});

/**
 * GET /api/admin/dashboard/overdue-orders
 * Danh sách đơn đang thuê nhưng đã quá hạn trả
 */
router.get('/dashboard/overdue-orders', (req, res) => {
  try {
    const data = adminService.getOverdueRentalOrders({ limit: 10 });
    res.json(successResponse(data));
  } catch (error) {
    res.status(error.status || 500).json(
      errorResponse(error.code || 'INTERNAL_ERROR', error.message)
    );
  }
});

/**
 * GET /api/admin/orders?status=&search=&page=1&limit=10
 * Danh sách đơn hàng phía Admin (phân trang + lọc status + search)
 */
router.get('/orders', validateRequest({ query: adminOrdersQuerySchema }), (req, res) => {
  try {
    const { status, search, page, limit } = req.query;
    const result = adminService.getAdminOrders({
      status,
      search,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    });
    res.json(successResponse({ items: result.orders, pagination: result.pagination }));
  } catch (error) {
    res.status(error.status || 500).json(
      errorResponse(error.code || 'INTERNAL_ERROR', error.message)
    );
  }
});

/**
 * GET /api/admin/orders/:id
 * Chi tiết đơn hàng cho Admin
 */
router.get('/orders/:id', validateRequest({ params: idParamSchema }), (req, res) => {
  try {
    const order = adminService.getAdminOrderDetail(req.params.id);
    res.json(successResponse(order));
  } catch (error) {
    res.status(error.status || 500).json(
      errorResponse(error.code || 'INTERNAL_ERROR', error.message)
    );
  }
});

/**
 * PUT /api/admin/orders/:id/status
 * Đổi trạng thái đơn hàng (Chuyển đổi theo State Machine)
 * Body: { status: 'APPROVED' | 'RENTING' | 'CANCELLED' }
 */
router.put(
  '/orders/:id/status',
  validateRequest({ params: idParamSchema, body: updateStatusSchema }),
  (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    const result = adminService.updateOrderStatus(orderId, status, req.user.id);
    res.json(successResponse(result));
  } catch (error) {
    res.status(error.status || 500).json(
      errorResponse(error.code || 'INTERNAL_ERROR', error.message)
    );
  }
});

/**
 * POST /api/admin/orders/:id/complete
 * Quy trình hoàn tất thuê đồ, kiểm tra tình trạng thiết bị & xử lý tiền cọc / phí muộn
 */
router.post(
  '/orders/:id/complete',
  validateRequest({ params: idParamSchema, body: completeOrderSchema }),
  (req, res) => {
  try {
    const orderId = req.params.id;
    const { itemConditions, returnDate, returnNote } = req.body;

    const result = adminService.completeOrderAndProcessDeposit(
      orderId,
      { itemConditions, returnDate, returnNote },
      req.user.id
    );
    res.json(successResponse(result));
  } catch (error) {
    res.status(error.status || 500).json(
      errorResponse(error.code || 'INTERNAL_ERROR', error.message)
    );
  }
});

/**
 * POST /api/admin/products
 * Thêm sản phẩm mới
 */
router.post('/products', validateRequest({ body: createProductSchema }), (req, res) => {
  try {
    const result = adminService.createProduct(req.body, req.user.id);
    res.json(successResponse(result, 'Thêm sản phẩm thành công'));
  } catch (error) {
    res.status(error.status || 500).json(
      errorResponse(error.code || 'INTERNAL_ERROR', error.message)
    );
  }
});

/**
 * GET /api/admin/products
 * Danh sách sản phẩm cho Admin, gồm cả sản phẩm đã ngừng kinh doanh
 */
router.get('/products', validateRequest({ query: adminProductsQuerySchema }), (req, res) => {
  try {
    const { search, category, status, page, limit } = req.query;
    const result = adminService.getAdminProducts({
      search,
      category,
      status,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    });
    res.json(successResponse({ items: result.products, pagination: result.pagination }));
  } catch (error) {
    res.status(error.status || 500).json(
      errorResponse(error.code || 'INTERNAL_ERROR', error.message)
    );
  }
});

/**
 * POST /api/admin/products/upload-image
 * Upload ảnh bằng data URL và trả về image_url để lưu sản phẩm
 */
router.post('/products/upload-image', validateRequest({ body: uploadProductImageSchema }), (req, res) => {
  try {
    const result = adminService.uploadProductImage(req.body, req.user.id);
    res.json(successResponse(result, 'Upload ảnh thành công'));
  } catch (error) {
    res.status(error.status || 500).json(
      errorResponse(error.code || 'INTERNAL_ERROR', error.message)
    );
  }
});

/**
 * GET /api/admin/products/:id
 * Chi tiết sản phẩm cho form chỉnh sửa
 */
router.get('/products/:id', validateRequest({ params: idParamSchema }), (req, res) => {
  try {
    const product = adminService.getAdminProductDetail(req.params.id);
    res.json(successResponse(product));
  } catch (error) {
    res.status(error.status || 500).json(
      errorResponse(error.code || 'INTERNAL_ERROR', error.message)
    );
  }
});

/**
 * PUT /api/admin/products/:id
 * Cập nhật sản phẩm
 */
router.put(
  '/products/:id',
  validateRequest({ params: idParamSchema, body: updateProductSchema }),
  (req, res) => {
    try {
      const result = adminService.updateProduct(req.params.id, req.body, req.user.id);
      res.json(successResponse(result, 'Cập nhật sản phẩm thành công'));
    } catch (error) {
      res.status(error.status || 500).json(
        errorResponse(error.code || 'INTERNAL_ERROR', error.message)
      );
    }
  }
);

/**
 * PATCH /api/admin/products/:id/active
 * Ngừng hoặc mở lại kinh doanh sản phẩm
 */
router.patch(
  '/products/:id/active',
  validateRequest({ params: idParamSchema, body: setProductActiveSchema }),
  (req, res) => {
    try {
      const result = adminService.setProductActive(req.params.id, req.body.is_active, req.user.id);
      res.json(successResponse(result, req.body.is_active ? 'Đã mở lại sản phẩm' : 'Đã ngừng kinh doanh sản phẩm'));
    } catch (error) {
      res.status(error.status || 500).json(
        errorResponse(error.code || 'INTERNAL_ERROR', error.message)
      );
    }
  }
);

module.exports = router;
