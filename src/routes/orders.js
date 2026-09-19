// ═══════════════════════════════════════════════════════════════
// 🛒 Order Routes — API đơn hàng (Phần B + C)
// POST /api/orders              — Tạo đơn hàng
// GET  /api/orders/:orderId     — Chi tiết đơn (chỉ owner)
// GET  /api/orders/user/:userId — Lịch sử đơn (phân trang)
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const { z } = require('zod');
const router = express.Router();

const { createOrder, getOrderById, getUserOrders, submitPaymentProof } = require('../services/orderService');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');
const { ERROR_CODES } = require('../constants/errorCodes');
const { authenticate } = require('../middleware/authMiddleware');
const { orderRateLimiter } = require('../middleware/rateLimiter');
const validateRequest = require('../middleware/validateRequest');
const logger = require('../utils/logger');

// ━━━ Zod Schemas ━━━

const cartItemSchema = z.object({
  productId: z.number().int().positive('productId phải là số nguyên dương.'),
  quantity: z.number().int().min(1, 'Số lượng tối thiểu là 1.').max(100, 'Số lượng tối đa là 100.'),
  type: z.enum(['BUY', 'RENT'], {
    errorMap: () => ({ message: 'Loại giao dịch phải là BUY hoặc RENT.' }),
  }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
}).refine(
  (data) => {
    // Nếu type là RENT thì bắt buộc phải có startDate và endDate
    if (data.type === 'RENT') {
      return data.startDate && data.endDate;
    }
    return true;
  },
  { message: 'Khi thuê (RENT), phải có ngày bắt đầu và ngày kết thúc.' }
);

const createOrderSchema = z.object({
  cartItems: z.array(cartItemSchema).min(1, 'Giỏ hàng phải có ít nhất 1 sản phẩm.'),
  shippingName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự.').max(100),
  shippingPhone: z.string().regex(/^0\d{9}$/, 'Số điện thoại phải có 10 chữ số, bắt đầu bằng 0.'),
  shippingAddress: z.string().min(5, 'Địa chỉ phải có ít nhất 5 ký tự.').max(500),
  paymentMethod: z.enum(['CASH', 'TRANSFER']).optional().default('CASH'),
  note: z.string().max(500).optional().default(''),
});

const orderIdSchema = z.object({
  orderId: z.string().regex(/^\d+$/, 'ID đơn hàng phải là số.').transform(Number),
});

const paymentProofSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  dataUrl: z.string().min(50, 'Biên lai không hợp lệ.').max(7_000_000, 'Biên lai tối đa khoảng 5MB.'),
  note: z.string().max(500).optional().default(''),
});

const userIdSchema = z.object({
  userId: z.string().regex(/^\d+$/, 'ID người dùng phải là số.').transform(Number),
});

const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/orders — Tạo đơn hàng mới
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Yêu cầu: đăng nhập + rate limiting

router.post(
  '/',
  authenticate,                                    // Phải đăng nhập
  orderRateLimiter,                               // Rate limit: 5 đơn/phút
  validateRequest({ body: createOrderSchema }),     // Validate body
  (req, res) => {
    try {
      const { cartItems, shippingName, shippingPhone, shippingAddress, paymentMethod, note } = req.body;
      const userId = req.user.id;

      const result = createOrder(userId, cartItems, {
        shippingName,
        shippingPhone,
        shippingAddress,
        paymentMethod,
        note,
      });

      res.status(201).json(
        successResponse(result, 'Đặt hàng thành công! Đơn hàng đang chờ xử lý.')
      );

    } catch (error) {
      // Business error (conflict, validation)
      if (error.code && error.status) {
        return res.status(error.status).json(
          errorResponse(error.code, error.message, error.details)
        );
      }

      logger.error('CREATE_ORDER_ROUTE_ERROR', { error: error.message });
      res.status(500).json(
        errorResponse(ERROR_CODES.INTERNAL_ERROR.code, ERROR_CODES.INTERNAL_ERROR.message)
      );
    }
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/orders/my — Đơn hàng của tôi (user hiện tại)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.get(
  '/my',
  authenticate,
  validateRequest({ query: paginationSchema }),
  (req, res) => {
    try {
      const userId = req.user.id;
      const { page, limit } = req.query;

      const result = getUserOrders(userId, page, limit);
      res.json(successResponse(result));

    } catch (error) {
      res.status(500).json(
        errorResponse(ERROR_CODES.INTERNAL_ERROR.code, ERROR_CODES.INTERNAL_ERROR.message)
      );
    }
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/orders/user/:userId — Lịch sử đơn hàng của user
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Chỉ user sở hữu hoặc admin mới xem được

router.get(
  '/user/:userId',
  authenticate,
  validateRequest({ params: userIdSchema, query: paginationSchema }),
  (req, res) => {
    try {
      const requestedUserId = req.params.userId;
      const currentUser = req.user;

      // Chống IDOR: chỉ cho xem đơn của chính mình hoặc admin
      if (currentUser.id !== requestedUserId && currentUser.role !== 'ADMIN') {
        return res.status(403).json(
          errorResponse(ERROR_CODES.FORBIDDEN.code, 'Bạn chỉ có thể xem đơn hàng của chính mình.')
        );
      }

      const { page, limit } = req.query;
      const result = getUserOrders(requestedUserId, page, limit);

      res.json(successResponse(result));

    } catch (error) {
      res.status(500).json(
        errorResponse(ERROR_CODES.INTERNAL_ERROR.code, ERROR_CODES.INTERNAL_ERROR.message)
      );
    }
  }
);

router.post(
  '/:orderId/payment-proof',
  authenticate,
  validateRequest({ params: orderIdSchema, body: paymentProofSchema }),
  (req, res) => {
    try {
      const order = submitPaymentProof(req.params.orderId, req.user.id, req.body);
      res.json(successResponse(order, 'Đã gửi biên lai chuyển khoản. Admin sẽ đối soát và xác nhận.'));
    } catch (error) {
      if (error.code && error.status) {
        return res.status(error.status).json(errorResponse(error.code, error.message, error.details));
      }
      logger.error('SUBMIT_PAYMENT_PROOF_ROUTE_ERROR', { error: error.message });
      res.status(500).json(errorResponse(ERROR_CODES.INTERNAL_ERROR.code, ERROR_CODES.INTERNAL_ERROR.message));
    }
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/orders/:orderId — Chi tiết đơn hàng
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Chỉ user sở hữu đơn mới xem được (chống IDOR)

router.get(
  '/:orderId',
  authenticate,
  validateRequest({ params: orderIdSchema }),
  (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      // getOrderById tự kiểm tra user_id (chống IDOR)
      const order = getOrderById(orderId, userId);
      res.json(successResponse(order));

    } catch (error) {
      if (error.code && error.status) {
        return res.status(error.status).json(errorResponse(error.code, error.message));
      }
      res.status(500).json(
        errorResponse(ERROR_CODES.INTERNAL_ERROR.code, ERROR_CODES.INTERNAL_ERROR.message)
      );
    }
  }
);

module.exports = router;
