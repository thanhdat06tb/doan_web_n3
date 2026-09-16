// ═══════════════════════════════════════════════════════════════
// 📊 Admin Service — Service Layer cho Quản trị viên
// Xử lý thống kê, chuyển trạng thái đơn hàng & hoàn tất thuê đồ / cọc
// ═══════════════════════════════════════════════════════════════

const { getDatabase } = require('../database/connection');
const { ERROR_CODES, VALID_STATUS_TRANSITIONS } = require('../constants/errorCodes');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

/**
 * Đảm bảo các bảng bổ sung cho admin tồn tại
 * Các bảng đã được tạo bởi schema.sql (db:init), hàm này chỉ kiểm tra
 */
function ensureAdminTables(db) {
  // Bảng deposit_transactions và audit_logs đã được tạo bởi schema.sql
  // Không cần tạo lại ở đây
}

/**
 * 1. Thống kê tổng quan Dashboard
 */
function getDashboardSummary() {
  const db = getDatabase();
  ensureAdminTables(db);

  // Revenue stats
  const sellRev = db.prepare(`
    SELECT COALESCE(SUM(od.unit_price * od.quantity), 0) as total
    FROM order_details od
    JOIN orders o ON od.order_id = o.id
    WHERE od.type = 'BUY' AND o.status = 'COMPLETED'
  `).get().total;

  const rentRev = db.prepare(`
    SELECT COALESCE(SUM(od.unit_price * od.quantity * od.total_days), 0) as total
    FROM order_details od
    JOIN orders o ON od.order_id = o.id
    WHERE od.type = 'RENT' AND o.status = 'COMPLETED'
  `).get().total;

  // Monthly revenue stats
  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7); // YYYY-MM
  const lastMonthObj = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = lastMonthObj.toISOString().slice(0, 7);

  const thisMonthRev = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total
    FROM orders
    WHERE status = 'COMPLETED' AND strftime('%Y-%m', created_at) = ?
  `).get(currentMonthStr).total;

  const lastMonthRev = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total
    FROM orders
    WHERE status = 'COMPLETED' AND strftime('%Y-%m', created_at) = ?
  `).get(lastMonthStr).total;

  let growthPercent = 0;
  if (lastMonthRev > 0) {
    growthPercent = Number((((thisMonthRev - lastMonthRev) / lastMonthRev) * 100).toFixed(1));
  } else if (thisMonthRev > 0) {
    growthPercent = 100;
  }

  // Deposits
  const totalHolding = db.prepare(`
    SELECT COALESCE(SUM(total_deposit), 0) as total
    FROM orders
    WHERE status IN ('APPROVED', 'RENTING')
  `).get().total;

  const totalReturned = db.prepare(`
    SELECT COALESCE(SUM(refund_amount), 0) as total
    FROM deposit_transactions
  `).get().total;

  // Risk amount: Deposit of RENTING orders where end_date < today
  const todayStr = now.toISOString().slice(0, 10);
  const riskAmount = db.prepare(`
    SELECT COALESCE(SUM(o.total_deposit), 0) as total
    FROM orders o
    JOIN order_details od ON o.id = od.order_id
    WHERE o.status = 'RENTING' AND od.type = 'RENT' AND od.end_date < ?
  `).get(todayStr).total;

  // Orders counts
  const orderCountsRows = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM orders
    GROUP BY status
  `).all();

  const ordersCountMap = { PENDING: 0, APPROVED: 0, RENTING: 0, COMPLETED: 0, CANCELLED: 0 };
  orderCountsRows.forEach(row => {
    ordersCountMap[row.status] = row.count;
  });

  // Top rented products
  const topRentedProducts = db.prepare(`
    SELECT p.id as productId, p.name, COALESCE(SUM(od.quantity), 0) as totalRentals,
           COALESCE(SUM(od.unit_price * od.quantity * od.total_days), 0) as totalRevenue
    FROM order_details od
    JOIN products p ON od.product_id = p.id
    JOIN orders o ON od.order_id = o.id
    WHERE od.type = 'RENT' AND o.status = 'COMPLETED'
    GROUP BY p.id, p.name
    ORDER BY totalRentals DESC
    LIMIT 5
  `).all();

  return {
    revenue: {
      totalSell: sellRev,
      totalRent: rentRev,
      thisMonth: thisMonthRev,
      lastMonth: lastMonthRev,
      growthPercent,
    },
    deposits: {
      totalHolding,
      totalReturned,
      riskAmount,
    },
    orders: ordersCountMap,
    topRentedProducts,
  };
}

/**
 * 2. Dữ liệu biểu đồ doanh thu theo thời gian
 */
function getRevenueChartData(period = '30d') {
  const db = getDatabase();
  let daysLimit = 30;
  if (period === '7d') daysLimit = 7;
  if (period === '12m') daysLimit = 365;

  const dates = db.prepare(`
    WITH RECURSIVE dates(date) AS (
      VALUES(date('now', 'localtime', '-' || ? || ' days'))
      UNION ALL
      SELECT date(date, '+1 day')
      FROM dates
      WHERE date < date('now', 'localtime')
    )
    SELECT date FROM dates;
  `).all(daysLimit - 1);

  const labels = [];
  const sellData = [];
  const rentData = [];

  const getDailySell = db.prepare(`
    SELECT COALESCE(SUM(od.unit_price * od.quantity), 0) as total
    FROM order_details od
    JOIN orders o ON od.order_id = o.id
    WHERE od.type = 'BUY' AND o.status = 'COMPLETED' AND date(o.created_at) = ?
  `);

  const getDailyRent = db.prepare(`
    SELECT COALESCE(SUM(od.unit_price * od.quantity * od.total_days), 0) as total
    FROM order_details od
    JOIN orders o ON od.order_id = o.id
    WHERE od.type = 'RENT' AND o.status = 'COMPLETED' AND date(o.created_at) = ?
  `);

  dates.forEach(d => {
    labels.push(d.date.slice(5)); // MM-DD
    sellData.push(getDailySell.get(d.date).total);
    rentData.push(getDailyRent.get(d.date).total);
  });

  return { labels, sellData, rentData };
}

/**
 * 3. Tỷ lệ sử dụng sản phẩm (Product utilization)
 */
function getProductUtilization() {
  const db = getDatabase();
  const products = db.prepare(`
    SELECT p.id as productId, p.name,
           COALESCE(SUM(od.total_days), 0) as totalDaysRented
    FROM products p
    LEFT JOIN order_details od ON p.id = od.product_id AND od.type = 'RENT'
    LEFT JOIN orders o ON od.order_id = o.id AND o.status IN ('RENTING', 'COMPLETED')
    WHERE p.price_rent_per_day > 0
    GROUP BY p.id, p.name
  `).all();

  return products.map(p => {
    const rate = Math.min(100, Math.round((p.totalDaysRented / 30) * 100));
    return {
      ...p,
      utilizationRate: `${rate}%`,
    };
  });
}

/**
 * 3b. Danh sách đơn thuê quá hạn cần xử lý
 */
function getOverdueRentalOrders({ limit = 10 } = {}) {
  const db = getDatabase();
  const todayStr = new Date().toISOString().slice(0, 10);

  return db.prepare(`
    SELECT
      o.id AS orderId,
      o.shipping_name AS customerName,
      o.shipping_phone AS customerPhone,
      o.total_deposit AS totalDeposit,
      MIN(od.end_date) AS earliestEndDate,
      CAST(julianday(?) - julianday(MIN(od.end_date)) AS INTEGER) AS overdueDays,
      GROUP_CONCAT(p.name, ', ') AS productNames
    FROM orders o
    JOIN order_details od ON od.order_id = o.id
    JOIN products p ON p.id = od.product_id
    WHERE o.status = 'RENTING'
      AND od.type = 'RENT'
      AND od.end_date < ?
    GROUP BY o.id
    ORDER BY overdueDays DESC, o.id DESC
    LIMIT ?
  `).all(todayStr, todayStr, limit);
}

/**
 * 4. Lấy danh sách đơn hàng cho Admin
 */
function getAdminOrders({ status, search, page = 1, limit = 10 }) {
  const db = getDatabase();
  const offset = (page - 1) * limit;

  let query = `
    SELECT o.*, u.full_name as user_name, u.email as user_email
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'ALL') {
    query += ` AND o.status = ?`;
    params.push(status);
  }

  if (search) {
    query += ` AND (o.id LIKE ? OR o.shipping_name LIKE ? OR o.shipping_phone LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  // Count total matching
  const countQuery = query.replace('SELECT o.*, u.full_name as user_name, u.email as user_email', 'SELECT COUNT(*) as count');
  const total = db.prepare(countQuery).get(...params).count;

  query += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const orders = db.prepare(query).all(...params);

  // FIX N+1: Batch query item_summary cho tất cả orders 1 lần
  if (orders.length > 0) {
    const orderIds = orders.map(o => o.id);
    const placeholders = orderIds.map(() => '?').join(',');
    const allSummaries = db.prepare(`
      SELECT order_id, type, COUNT(*) as count
      FROM order_details
      WHERE order_id IN (${placeholders})
      GROUP BY order_id, type
    `).all(...orderIds);

    orders.forEach(o => {
      o.item_summary = allSummaries.filter(s => s.order_id === o.id);
    });
  }

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * 5. Chi tiết đơn hàng cho Admin
 */
function getAdminOrderDetail(orderId) {
  const db = getDatabase();
  const order = db.prepare(`
    SELECT o.*, u.full_name as user_name, u.email as user_email
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `).get(orderId);

  if (!order) {
    throw { ...ERROR_CODES.ORDER_NOT_FOUND };
  }

  const items = db.prepare(`
    SELECT od.*, p.name as product_name, p.image_url, p.deposit_amount
    FROM order_details od
    JOIN products p ON od.product_id = p.id
    WHERE od.order_id = ?
  `).all(orderId);

  const depositTx = db.prepare(`
    SELECT * FROM deposit_transactions WHERE order_id = ?
  `).get(orderId);

  return {
    ...order,
    items,
    depositTx: depositTx || null,
  };
}

/**
 * 6. Đổi trạng thái đơn hàng với State Machine Validation
 */
function updateOrderStatus(orderId, newStatus, adminId) {
  const db = getDatabase();
  ensureAdminTables(db);

  // FIX Race Condition: Bọc trong transaction để đảm bảo atomic read-then-write
  const doUpdate = db.transaction(() => {
    const order = db.prepare('SELECT status FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      throw { ...ERROR_CODES.ORDER_NOT_FOUND };
    }

    const allowedTransitions = VALID_STATUS_TRANSITIONS[order.status] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw {
        ...ERROR_CODES.INVALID_STATUS_TRANSITION,
        message: `Không thể chuyển từ trạng thái ${order.status} sang ${newStatus}. Trạng thái hợp lệ: ${allowedTransitions.join(', ') || 'Không thể thay đổi'}`,
      };
    }

    db.prepare(`
      UPDATE orders
      SET status = ?
      WHERE id = ?
    `).run(newStatus, orderId);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (admin_id, action, target_table, target_id, old_value, new_value)
      VALUES (?, 'UPDATE_ORDER_STATUS', 'orders', ?, ?, ?)
    `).run(adminId, orderId, order.status, newStatus);

    logger.info('ADMIN_UPDATE_ORDER_STATUS', { adminId, orderId, oldStatus: order.status, newStatus });

    return { success: true, status: newStatus };
  });

  return doUpdate();
}

/**
 * 7. Hoàn tất đơn hàng thuê đồ & Xử lý tiền cọc / thiết bị hỏng / muộn
 */
function completeOrderAndProcessDeposit(orderId, { itemConditions = [], returnDate, returnNote = '' }, adminId) {
  const db = getDatabase();
  ensureAdminTables(db);

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    throw { ...ERROR_CODES.ORDER_NOT_FOUND };
  }

  if (order.status !== 'RENTING') {
    throw {
      ...ERROR_CODES.INVALID_STATUS_TRANSITION,
      message: 'Chỉ có thể hoàn tất đơn hàng đang ở trạng thái DANG THUÊ (RENTING).',
    };
  }

  const items = db.prepare(`
    SELECT od.*, p.price_rent_per_day
    FROM order_details od
    JOIN products p ON od.product_id = p.id
    WHERE od.order_id = ? AND od.type = 'RENT'
  `).all(orderId);

  if (items.length === 0) {
    throw {
      ...ERROR_CODES.VALIDATION_ERROR,
      message: 'Đơn hàng này không có sản phẩm thuê để hoàn tất.',
    };
  }

  const conditionByDetailId = new Map(itemConditions.map((item) => [Number(item.orderDetailId), item]));
  const missingItems = items.filter((item) => !conditionByDetailId.has(item.id));
  if (missingItems.length > 0) {
    throw {
      ...ERROR_CODES.VALIDATION_ERROR,
      message: 'Phải chọn tình trạng cho tất cả sản phẩm thuê trong đơn hàng.',
      details: { missingOrderDetailIds: missingItems.map((item) => item.id) },
    };
  }

  let totalLateFee = 0;
  let totalDeduction = 0;

  const actualReturnDateStr = returnDate || new Date().toISOString().slice(0, 10);

  // Calculate late fee & condition deductions
  items.forEach(item => {
    if (item.end_date && actualReturnDateStr > item.end_date) {
      const endD = new Date(item.end_date);
      const retD = new Date(actualReturnDateStr);
      const diffDays = Math.max(0, Math.ceil((retD - endD) / (1000 * 60 * 60 * 24)));
      totalLateFee += diffDays * item.price_rent_per_day * item.quantity;
    }

    const cond = conditionByDetailId.get(item.id);
    if (cond) {
      if (cond.condition === 'DAMAGED') {
        totalDeduction += Number(cond.deductAmount || 0);
      } else if (cond.condition === 'LOST') {
        totalDeduction += Number(item.deposit_amount || 0);
      }
    }
  });

  const totalDepositCollected = order.total_deposit;
  const totalRefund = Math.max(0, totalDepositCollected - totalDeduction - totalLateFee);
  const extraCharge = (totalDeduction + totalLateFee > totalDepositCollected)
    ? (totalDeduction + totalLateFee - totalDepositCollected)
    : 0;

  const transaction = db.transaction(() => {
    // 1. Insert deposit transaction cho từng item thuê
    items.forEach(item => {
      const cond = conditionByDetailId.get(item.id);
      const condition = cond.condition;
      const damageNote = cond.damageNote || '';
      let deductAmt = 0;
      let lateAmt = 0;

      if (condition === 'DAMAGED') deductAmt = Number(cond.deductAmount || 0);
      if (condition === 'LOST') deductAmt = Number(item.deposit_amount || 0);

      if (item.end_date && actualReturnDateStr > item.end_date) {
        const endD = new Date(item.end_date);
        const retD = new Date(actualReturnDateStr);
        const diffDays = Math.max(0, Math.ceil((retD - endD) / (1000 * 60 * 60 * 24)));
        lateAmt = diffDays * item.price_rent_per_day * item.quantity;
      }

      const collected = item.deposit_amount || 0;
      const refundAmt = Math.max(0, collected - deductAmt - lateAmt);

      db.prepare(`
        INSERT INTO deposit_transactions (order_id, order_detail_id, deposit_collected, condition, damage_note, deduct_amount, refund_amount, late_fee, processed_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(orderId, item.id, collected, condition, damageNote, deductAmt, refundAmt, lateAmt, adminId);
    });

    // 2. Update order status to COMPLETED
    db.prepare(`
      UPDATE orders
      SET status = 'COMPLETED', return_date = ?, return_note = ?
      WHERE id = ?
    `).run(actualReturnDateStr, returnNote, orderId);

    // 3. Audit log
    db.prepare(`
      INSERT INTO audit_logs (admin_id, action, target_table, target_id, old_value, new_value)
      VALUES (?, 'COMPLETE_RENTAL_ORDER', 'orders', ?, 'RENTING', 'COMPLETED')
    `).run(adminId, orderId);
  });

  transaction();

  logger.info('ADMIN_COMPLETE_ORDER', { orderId, adminId, totalRefund, totalDeduction, totalLateFee });

  return {
    success: true,
    summary: {
      totalDepositCollected,
      totalRefund,
      totalDeduction,
      totalLateFee,
      extraCharge,
      returnDate: actualReturnDateStr,
    },
  };
}

/**
 * 8. Thêm sản phẩm mới (Admin)
 */
function createProduct(productData, adminId) {
  const db = getDatabase();
  ensureAdminTables(db);
  
  const {
    category_id, name, description = '',
    price_sell = 0, price_rent_per_day = 0,
    deposit_amount = 0, stock_quantity = 0,
    image_url = ''
  } = productData;

  const result = db.prepare(`
    INSERT INTO products (
      category_id, name, description, price_sell, price_rent_per_day,
      deposit_amount, stock_quantity, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    category_id, name, description, price_sell, price_rent_per_day,
    deposit_amount, stock_quantity, image_url
  );

  const newProductId = result.lastInsertRowid;

  if (image_url) {
    db.prepare(`
      INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
      VALUES (?, ?, 1, 0)
    `).run(newProductId, image_url);
  }

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (admin_id, action, target_table, target_id, new_value)
    VALUES (?, 'CREATE_PRODUCT', 'products', ?, ?)
  `).run(adminId, newProductId, JSON.stringify(productData));

  logger.info('ADMIN_CREATE_PRODUCT', { adminId, productId: newProductId });

  return { success: true, id: newProductId };
}

/**
 * 9. Danh sách sản phẩm cho Admin
 */
function getAdminProducts({ search = '', category, status = 'ALL', page = 1, limit = 10 }) {
  const db = getDatabase();
  const offset = (page - 1) * limit;
  const conditions = ['1=1'];
  const params = [];

  if (search) {
    conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (category) {
    conditions.push('p.category_id = ?');
    params.push(category);
  }

  if (status === 'ACTIVE') {
    conditions.push('p.is_active = 1');
  } else if (status === 'INACTIVE') {
    conditions.push('p.is_active = 0');
  }

  const whereClause = conditions.join(' AND ');
  const total = db.prepare(`
    SELECT COUNT(*) AS count
    FROM products p
    WHERE ${whereClause}
  `).get(...params).count;

  const products = db.prepare(`
    SELECT
      p.id, p.category_id, p.name, p.description,
      p.price_sell, p.price_rent_per_day, p.deposit_amount,
      p.stock_quantity, p.image_url, p.is_active,
      p.created_at, p.updated_at,
      c.name AS category_name
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE ${whereClause}
    ORDER BY p.updated_at DESC, p.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

function getAdminProductDetail(productId) {
  const db = getDatabase();
  const product = db.prepare(`
    SELECT
      p.id, p.category_id, p.name, p.description,
      p.price_sell, p.price_rent_per_day, p.deposit_amount,
      p.stock_quantity, p.image_url, p.is_active,
      p.created_at, p.updated_at,
      c.name AS category_name
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.id = ?
  `).get(productId);

  if (!product) {
    throw { ...ERROR_CODES.PRODUCT_NOT_FOUND };
  }

  const images = db.prepare(`
    SELECT id, image_url, is_primary, sort_order
    FROM product_images
    WHERE product_id = ?
    ORDER BY sort_order ASC
  `).all(productId);

  return { ...product, images };
}

/**
 * 10. Cập nhật sản phẩm, giữ snapshot giá trong order_details không đổi
 */
function updateProduct(productId, productData, adminId) {
  const db = getDatabase();
  ensureAdminTables(db);

  const current = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!current) {
    throw { ...ERROR_CODES.PRODUCT_NOT_FOUND };
  }

  const next = {
    category_id: productData.category_id,
    name: productData.name,
    description: productData.description || '',
    price_sell: productData.price_sell || 0,
    price_rent_per_day: productData.price_rent_per_day || 0,
    deposit_amount: productData.deposit_amount || 0,
    stock_quantity: productData.stock_quantity || 0,
    image_url: productData.image_url || '',
  };

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE products
      SET
        category_id = @category_id,
        name = @name,
        description = @description,
        price_sell = @price_sell,
        price_rent_per_day = @price_rent_per_day,
        deposit_amount = @deposit_amount,
        stock_quantity = @stock_quantity,
        image_url = @image_url,
        updated_at = datetime('now', 'localtime')
      WHERE id = @id
    `).run({ id: productId, ...next });

    db.prepare(`
      DELETE FROM product_images
      WHERE product_id = ? AND is_primary = 1
    `).run(productId);

    if (next.image_url) {
      db.prepare(`
        INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
        VALUES (?, ?, 1, 0)
      `).run(productId, next.image_url);
    }

    db.prepare(`
      INSERT INTO audit_logs (admin_id, action, target_table, target_id, old_value, new_value)
      VALUES (?, 'UPDATE_PRODUCT', 'products', ?, ?, ?)
    `).run(adminId, productId, JSON.stringify(current), JSON.stringify(next));
  });

  transaction();
  logger.info('ADMIN_UPDATE_PRODUCT', { adminId, productId });

  return { success: true, id: productId };
}

function setProductActive(productId, isActive, adminId) {
  const db = getDatabase();
  ensureAdminTables(db);

  const current = db.prepare('SELECT id, name, is_active FROM products WHERE id = ?').get(productId);
  if (!current) {
    throw { ...ERROR_CODES.PRODUCT_NOT_FOUND };
  }

  db.transaction(() => {
    db.prepare(`
      UPDATE products
      SET is_active = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(isActive ? 1 : 0, productId);

    db.prepare(`
      INSERT INTO audit_logs (admin_id, action, target_table, target_id, old_value, new_value)
      VALUES (?, ?, 'products', ?, ?, ?)
    `).run(
      adminId,
      isActive ? 'ACTIVATE_PRODUCT' : 'DEACTIVATE_PRODUCT',
      productId,
      JSON.stringify(current),
      JSON.stringify({ ...current, is_active: isActive ? 1 : 0 })
    );
  })();

  logger.info('ADMIN_SET_PRODUCT_ACTIVE', { adminId, productId, isActive });
  return { success: true, id: productId, isActive: isActive ? 1 : 0 };
}

/**
 * 11. Upload ảnh sản phẩm dạng data URL, lưu vào frontend/public/images
 */
function uploadProductImage({ fileName, dataUrl }, adminId) {
  const match = /^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i.exec(dataUrl || '');
  if (!match) {
    throw {
      ...ERROR_CODES.VALIDATION_ERROR,
      message: 'File ảnh không hợp lệ. Chỉ hỗ trợ PNG, JPG, JPEG hoặc WEBP.',
    };
  }

  const extension = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
  const safeBaseName = path
    .basename(fileName || `product-${Date.now()}`)
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || `product-${Date.now()}`;

  const finalName = `${safeBaseName}-${Date.now()}.${extension}`;
  const targetDir = path.resolve(__dirname, '../../frontend/public/images');
  const targetPath = path.join(targetDir, finalName);
  const buffer = Buffer.from(match[2], 'base64');

  if (buffer.length > 5 * 1024 * 1024) {
    throw {
      ...ERROR_CODES.VALIDATION_ERROR,
      message: 'Ảnh tối đa 5MB.',
    };
  }

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(targetPath, buffer);

  logger.info('ADMIN_UPLOAD_PRODUCT_IMAGE', { adminId, fileName: finalName });
  return { imageUrl: `/images/${finalName}` };
}

module.exports = {
  getDashboardSummary,
  getRevenueChartData,
  getProductUtilization,
  getOverdueRentalOrders,
  getAdminOrders,
  getAdminOrderDetail,
  updateOrderStatus,
  completeOrderAndProcessDeposit,
  createProduct,
  getAdminProducts,
  getAdminProductDetail,
  updateProduct,
  setProductActive,
  uploadProductImage,
};
