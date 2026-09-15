// ═══════════════════════════════════════════════════════════════
// 📦 Product Routes — API sản phẩm (Phần C)
// GET /api/products/:id          — Chi tiết sản phẩm
// GET /api/products/:id/calendar — Ngày bị block (3 tháng tới)
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const { z } = require('zod');
const router = express.Router();

const { getDatabase } = require('../database/connection');
const { checkProductAvailability, getBlockedDates } = require('../services/availabilityService');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { ERROR_CODES } = require('../constants/errorCodes');
const { getTodayString, getDateAfterMonths } = require('../utils/dateUtils');
const validateRequest = require('../middleware/validateRequest');

// ━━━ Zod Schemas ━━━

const productIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID sản phẩm phải là số.').transform(Number),
});

const availabilityQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có định dạng YYYY-MM-DD.'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có định dạng YYYY-MM-DD.'),
  quantity: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/products/:id — Chi tiết sản phẩm
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Trả về thông tin sản phẩm + số lượng khả dụng hôm nay + danh sách ảnh

router.get('/:id', validateRequest({ params: productIdSchema }), (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Lấy thông tin sản phẩm
    const product = db
      .prepare(`
        SELECT 
          p.id, p.category_id, p.name, p.description,
          p.price_sell, p.price_rent_per_day, p.deposit_amount,
          p.stock_quantity, p.image_url, p.is_active,
          p.created_at, p.updated_at,
          c.name as category_name
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `)
      .get(id);

    if (!product) {
      return res.status(404).json(
        errorResponse(ERROR_CODES.PRODUCT_NOT_FOUND.code, ERROR_CODES.PRODUCT_NOT_FOUND.message)
      );
    }

    // Lấy danh sách ảnh
    const images = db
      .prepare(`
        SELECT id, image_url, is_primary, sort_order
        FROM product_images
        WHERE product_id = ?
        ORDER BY sort_order ASC
      `)
      .all(id);

    // Tính availableQty cho ngày hôm nay
    // (Bao nhiêu đơn vị đang rảnh = stock - đang thuê)
    let availableQtyToday = product.stock_quantity;

    if (product.price_rent_per_day > 0) {
      const today = getTodayString();

      const bookedToday = db
        .prepare(`
          SELECT COALESCE(SUM(od.quantity), 0) as total_booked
          FROM order_details od
          JOIN orders o ON od.order_id = o.id
          WHERE od.product_id = ?
            AND od.type = 'RENT'
            AND o.status IN ('APPROVED', 'RENTING')
            AND od.start_date <= ?
            AND od.end_date >= ?
        `)
        .get(id, today, today);

      availableQtyToday = product.stock_quantity - (bookedToday.total_booked || 0);
    }

    res.json(
      successResponse({
        ...product,
        images,
        availableQtyToday: Math.max(0, availableQtyToday),
        // Flags tiện cho FE
        canBuy: product.price_sell > 0,
        canRent: product.price_rent_per_day > 0,
      })
    );

  } catch (error) {
    res.status(500).json(
      errorResponse(ERROR_CODES.INTERNAL_ERROR.code, ERROR_CODES.INTERNAL_ERROR.message)
    );
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/products/:id/calendar — Ngày bị block
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Trả về mảng các ngày mà sản phẩm đã hết stock trong 3 tháng tới
// FE dùng để disable trên DatePicker

router.get('/:id/calendar', validateRequest({ params: productIdSchema }), (req, res) => {
  try {
    const { id } = req.params;
    const result = getBlockedDates(id, 3);

    res.json(successResponse(result));

  } catch (error) {
    if (error.code && error.status) {
      return res.status(error.status).json(errorResponse(error.code, error.message));
    }
    res.status(500).json(
      errorResponse(ERROR_CODES.INTERNAL_ERROR.code, ERROR_CODES.INTERNAL_ERROR.message)
    );
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/products/:id/availability — Kiểm tra khả dụng
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Query params: startDate, endDate, quantity

router.get(
  '/:id/availability',
  validateRequest({ params: productIdSchema, query: availabilityQuerySchema }),
  (req, res) => {
    try {
      const { id } = req.params;
      const { startDate, endDate, quantity } = req.query;

      const result = checkProductAvailability(id, startDate, endDate, quantity || 1);
      res.json(successResponse(result));

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/products — Danh sách sản phẩm (phân trang)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const productsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('12'),
  category: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().max(100).optional(),
  type: z.enum(['all', 'buy', 'rent']).optional().default('all'),
});

router.get('/', validateRequest({ query: productsQuerySchema }), (req, res) => {
  try {
    const { page, limit, category, search, type } = req.query;
    const db = getDatabase();

    // Xây dựng query động
    let whereConditions = ['p.is_active = 1'];
    const params = [];

    if (category) {
      whereConditions.push('p.category_id = ?');
      params.push(category);
    }

    if (search) {
      whereConditions.push('(p.name LIKE ? OR p.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (type === 'buy') {
      whereConditions.push('p.price_sell > 0');
    } else if (type === 'rent') {
      whereConditions.push('p.price_rent_per_day > 0');
    }

    const whereClause = whereConditions.join(' AND ');

    // Đếm tổng
    const { count: totalItems } = db
      .prepare(`SELECT COUNT(*) as count FROM products p WHERE ${whereClause}`)
      .get(...params);

    // Lấy danh sách
    const offset = (page - 1) * limit;
    const products = db
      .prepare(`
        SELECT 
          p.id, p.name, p.price_sell, p.price_rent_per_day,
          p.deposit_amount, p.stock_quantity, p.image_url,
          c.name as category_name
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `)
      .all(...params, limit, offset);

    res.json(
      successResponse({
        items: products,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
          hasNextPage: page * limit < totalItems,
          hasPrevPage: page > 1,
        },
      })
    );

  } catch (error) {
    res.status(500).json(
      errorResponse(ERROR_CODES.INTERNAL_ERROR.code, ERROR_CODES.INTERNAL_ERROR.message)
    );
  }
});

module.exports = router;
