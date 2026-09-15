// ═══════════════════════════════════════════════════════════════
// 🛒 Order Service — Module Tạo & Quản Lý Đơn Hàng (Phần B)
// Xử lý transaction ACID, tính toán tài chính, truy vấn đơn hàng
// ═══════════════════════════════════════════════════════════════

const { getDatabase } = require('../database/connection');
const { ERROR_CODES, TRANSACTION_TYPE } = require('../constants/errorCodes');
const { checkProductAvailability } = require('./availabilityService');
const { calculateDays } = require('../utils/dateUtils');
const logger = require('../utils/logger');

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * TẠO ĐƠN HÀNG MỚI (Transaction ACID)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Quy trình:
 * 1. Validate toàn bộ cartItems TRƯỚC khi insert
 * 2. Nếu bất kỳ item nào fail → ROLLBACK, trả conflict list
 * 3. Tính toán tài chính (giá luôn lấy từ DB, KHÔNG tin FE)
 * 4. INSERT orders + order_details
 * 5. COMMIT
 *
 * @param {number} userId - ID người đặt hàng
 * @param {Array} cartItems - Danh sách sản phẩm
 * @param {object} shippingInfo - Thông tin giao hàng
 * @returns {{ orderId, totalAmount, totalDeposit, grandTotal, items }}
 */
function createOrder(userId, cartItems, shippingInfo) {
  const db = getDatabase();

  // ━━━ Kiểm tra giỏ hàng không rỗng ━━━
  if (!cartItems || cartItems.length === 0) {
    throw ERROR_CODES.EMPTY_CART;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TRANSACTION — BEGIN IMMEDIATE
  // Dùng IMMEDIATE thay vì DEFERRED để tránh race condition trên SQLite
  // IMMEDIATE lấy RESERVED lock ngay lập tức, đảm bảo chỉ 1 writer tại 1 thời điểm
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const createOrderTransaction = db.transaction(() => {
    const conflicts = [];
    const processedItems = [];

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // BƯỚC 1: VALIDATE TOÀN BỘ TRƯỚC KHI INSERT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    for (const item of cartItems) {
      // Lấy thông tin sản phẩm từ DB (KHÔNG tin price từ FE)
      const product = db
        .prepare(`
          SELECT id, name, price_sell, price_rent_per_day, deposit_amount, stock_quantity, is_active
          FROM products WHERE id = ?
        `)
        .get(item.productId);

      // Kiểm tra sản phẩm tồn tại
      if (!product) {
        conflicts.push({
          productId: item.productId,
          productName: `Sản phẩm #${item.productId}`,
          conflictReason: 'Sản phẩm không tồn tại.',
        });
        continue;
      }

      // Kiểm tra sản phẩm active
      if (!product.is_active) {
        conflicts.push({
          productId: product.id,
          productName: product.name,
          conflictReason: 'Sản phẩm đã ngừng kinh doanh.',
        });
        continue;
      }

      if (item.type === TRANSACTION_TYPE.BUY) {
        // ━━━ XỬ LÝ MUA ━━━

        // Kiểm tra sản phẩm có bán không
        if (product.price_sell <= 0) {
          conflicts.push({
            productId: product.id,
            productName: product.name,
            conflictReason: 'Sản phẩm này chỉ cho thuê, không bán.',
          });
          continue;
        }

        // Kiểm tra số lượng tồn kho
        if (item.quantity > product.stock_quantity) {
          conflicts.push({
            productId: product.id,
            productName: product.name,
            conflictReason: `Chỉ còn ${product.stock_quantity} sản phẩm trong kho.`,
          });
          continue;
        }

        // Tính toán tài chính cho BUY
        const unitPrice = product.price_sell;
        const subtotal = unitPrice * item.quantity;

        processedItems.push({
          productId: product.id,
          productName: product.name,
          type: 'BUY',
          quantity: item.quantity,
          unitPrice,
          startDate: null,
          endDate: null,
          totalDays: 0,
          subtotal,
          depositAmount: 0,
        });

      } else if (item.type === TRANSACTION_TYPE.RENT) {
        // ━━━ XỬ LÝ THUÊ ━━━

        // Kiểm tra có ngày thuê không
        if (!item.startDate || !item.endDate) {
          conflicts.push({
            productId: product.id,
            productName: product.name,
            conflictReason: 'Thiếu ngày bắt đầu hoặc ngày kết thúc thuê.',
          });
          continue;
        }

        // Kiểm tra availability (hàm này tự validate ngày + stock)
        try {
          const availability = checkProductAvailability(
            item.productId,
            item.startDate,
            item.endDate,
            item.quantity
          );

          if (!availability.available) {
            conflicts.push({
              productId: product.id,
              productName: product.name,
              conflictReason: `Không đủ số lượng trong khoảng ${item.startDate} đến ${item.endDate}. Chỉ còn ${availability.availableQty} đơn vị.`,
              conflictDates: availability.conflictDates,
            });
            continue;
          }
        } catch (err) {
          conflicts.push({
            productId: product.id,
            productName: product.name,
            conflictReason: err.message || 'Lỗi kiểm tra khả dụng.',
          });
          continue;
        }

        // Tính toán tài chính cho RENT
        const totalDays = calculateDays(item.startDate, item.endDate);
        const unitPrice = product.price_rent_per_day;
        const subtotal = unitPrice * item.quantity * totalDays;
        const depositAmount = product.deposit_amount * item.quantity;

        processedItems.push({
          productId: product.id,
          productName: product.name,
          type: 'RENT',
          quantity: item.quantity,
          unitPrice,
          startDate: item.startDate,
          endDate: item.endDate,
          totalDays,
          subtotal,
          depositAmount,
        });

      } else {
        conflicts.push({
          productId: item.productId,
          productName: product?.name || `Sản phẩm #${item.productId}`,
          conflictReason: `Loại giao dịch "${item.type}" không hợp lệ. Chỉ chấp nhận BUY hoặc RENT.`,
        });
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // BƯỚC 2: NẾU CÓ CONFLICT → ROLLBACK (throw để transaction tự rollback)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (conflicts.length > 0) {
      throw {
        ...ERROR_CODES.ORDER_CONFLICT,
        details: { conflicts },
      };
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // BƯỚC 3: TÍNH TỔNG TÀI CHÍNH
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // total_amount = SUM(subtotal) — tổng tiền hàng
    const totalAmount = processedItems.reduce((sum, item) => sum + item.subtotal, 0);

    // total_deposit = SUM(deposit) — tổng tiền cọc (chỉ items RENT)
    // CHÚ Ý: deposit KHÔNG cộng vào total_amount, lưu riêng
    const totalDeposit = processedItems.reduce((sum, item) => sum + item.depositAmount, 0);

    // grand_total = total_amount + total_deposit (số tiền khách cần chuẩn bị)
    const grandTotal = totalAmount + totalDeposit;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // BƯỚC 4: INSERT orders
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const insertOrder = db.prepare(`
      INSERT INTO orders (
        user_id, total_amount, total_deposit, grand_total,
        status, payment_method, shipping_name, shipping_phone, shipping_address, note
      ) VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?)
    `);

    const orderResult = insertOrder.run(
      userId,
      totalAmount,
      totalDeposit,
      grandTotal,
      shippingInfo.paymentMethod || 'CASH',
      shippingInfo.shippingName,
      shippingInfo.shippingPhone,
      shippingInfo.shippingAddress,
      shippingInfo.note || ''
    );

    const orderId = orderResult.lastInsertRowid;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // BƯỚC 5: INSERT order_details cho từng item
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const insertDetail = db.prepare(`
      INSERT INTO order_details (
        order_id, product_id, type, quantity, unit_price,
        start_date, end_date, total_days, subtotal, deposit_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of processedItems) {
      insertDetail.run(
        orderId,
        item.productId,
        item.type,
        item.quantity,
        item.unitPrice,
        item.startDate,
        item.endDate,
        item.totalDays,
        item.subtotal,
        item.depositAmount
      );
    }

    // ━━━ Transaction tự COMMIT khi hàm kết thúc bình thường ━━━

    return {
      orderId: Number(orderId),
      totalAmount,
      totalDeposit,
      grandTotal,
      status: 'PENDING',
      items: processedItems,
    };
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // THỰC THI TRANSACTION với retry khi gặp SQLITE_BUSY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 100;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = createOrderTransaction();

      // Log đơn hàng thành công
      logger.order('CREATE_ORDER_SUCCESS', {
        userId,
        orderId: result.orderId,
        totalAmount: result.totalAmount,
        totalDeposit: result.totalDeposit,
        grandTotal: result.grandTotal,
        itemCount: result.items.length,
      });

      return result;

    } catch (error) {
      // Nếu lỗi SQLITE_BUSY → retry
      if (error.code === 'SQLITE_BUSY' && attempt < MAX_RETRIES) {
        logger.warn('SQLITE_BUSY_RETRY', {
          userId,
          attempt,
          maxRetries: MAX_RETRIES,
        });
        // Exponential backoff: 100ms, 200ms, 400ms...
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        const start = Date.now();
        while (Date.now() - start < delay) {
          // Busy wait (sync) — better-sqlite3 là sync driver
        }
        continue;
      }

      // Log lỗi
      logger.error('CREATE_ORDER_FAILED', {
        userId,
        cartItems,
        error: error.message || error.code || 'Unknown error',
      });

      // Re-throw lỗi business logic (conflict, validation)
      if (error.code && error.message) {
        throw error;
      }

      // SQLITE_BUSY sau max retries
      if (error.code === 'SQLITE_BUSY') {
        throw ERROR_CODES.DATABASE_BUSY;
      }

      // Lỗi không xác định
      throw {
        ...ERROR_CODES.INTERNAL_ERROR,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      };
    }
  }
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * LẤY CHI TIẾT ĐƠN HÀNG (chỉ cho user sở hữu)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * @param {number} orderId
 * @param {number} userId - ID user hiện tại (để kiểm tra quyền IDOR)
 * @returns {object} Chi tiết đơn hàng + items
 */
function getOrderById(orderId, userId) {
  const db = getDatabase();

  // Lấy đơn hàng — WHERE user_id = userId để chống IDOR
  const order = db
    .prepare(`
      SELECT 
        o.id, o.user_id, o.total_amount, o.total_deposit, o.grand_total,
        o.status, o.payment_method, o.shipping_name, o.shipping_phone,
        o.shipping_address, o.note, o.return_date, o.return_note,
        o.created_at, o.updated_at
      FROM orders o
      WHERE o.id = ? AND o.user_id = ?
    `)
    .get(orderId, userId);

  if (!order) {
    throw ERROR_CODES.ORDER_NOT_FOUND;
  }

  // Lấy chi tiết items
  const items = db
    .prepare(`
      SELECT 
        od.id, od.product_id, od.type, od.quantity, od.unit_price,
        od.start_date, od.end_date, od.total_days, od.subtotal, od.deposit_amount,
        p.name as product_name, p.image_url as product_image
      FROM order_details od
      JOIN products p ON od.product_id = p.id
      WHERE od.order_id = ?
    `)
    .all(orderId);

  return {
    ...order,
    items,
  };
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * LỊCH SỬ ĐƠN HÀNG CỦA USER (phân trang)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * @param {number} userId
 * @param {number} [page=1]
 * @param {number} [limit=10]
 * @returns {{ items: Array, pagination: object }}
 */
function getUserOrders(userId, page = 1, limit = 10) {
  const db = getDatabase();

  // Đếm tổng số đơn
  const { count: totalItems } = db
    .prepare('SELECT COUNT(*) as count FROM orders WHERE user_id = ?')
    .get(userId);

  // Tính offset
  const offset = (page - 1) * limit;

  // Lấy danh sách đơn hàng (mới nhất trước)
  const orders = db
    .prepare(`
      SELECT 
        o.id, o.total_amount, o.total_deposit, o.grand_total,
        o.status, o.payment_method, o.created_at, o.updated_at
      FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `)
    .all(userId, limit, offset);

  // Lấy items cho mỗi đơn — tránh N+1 bằng cách lấy tất cả items 1 lần
  if (orders.length > 0) {
    const orderIds = orders.map((o) => o.id);
    const placeholders = orderIds.map(() => '?').join(',');

    const allItems = db
      .prepare(`
        SELECT 
          od.order_id, od.product_id, od.type, od.quantity, od.subtotal,
          p.name as product_name, p.image_url as product_image
        FROM order_details od
        JOIN products p ON od.product_id = p.id
        WHERE od.order_id IN (${placeholders})
      `)
      .all(...orderIds);

    // Gắn items vào từng order
    for (const order of orders) {
      order.items = allItems.filter((item) => item.order_id === order.id);
    }
  }

  return {
    items: orders,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      hasNextPage: page * limit < totalItems,
      hasPrevPage: page > 1,
    },
  };
}

module.exports = { createOrder, getOrderById, getUserOrders };
