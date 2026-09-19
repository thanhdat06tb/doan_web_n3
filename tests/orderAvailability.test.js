const fs = require('fs');
const os = require('os');
const path = require('path');

const { getDatabase, closeDatabase } = require('../src/database/connection');
const { createOrder } = require('../src/services/orderService');
const { updateOrderStatus } = require('../src/services/adminService');
const { checkProductAvailability } = require('../src/services/availabilityService');
const { calculateDays } = require('../src/utils/dateUtils');

const schemaSql = fs.readFileSync(path.resolve(__dirname, '../database/schema.sql'), 'utf8');
const indexesSql = fs.readFileSync(path.resolve(__dirname, '../database/indexes.sql'), 'utf8');

function dateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function seedBaseData(db) {
  db.prepare(`
    INSERT INTO users (id, full_name, email, phone, password_hash, role)
    VALUES
      (1, 'Test Customer', 'customer@example.com', '0900000001', 'hash', 'CUSTOMER'),
      (2, 'Test Admin', 'admin@example.com', '0900000002', 'hash', 'ADMIN')
  `).run();

  db.prepare(`
    INSERT INTO categories (id, name, description)
    VALUES (1, 'Camera', 'Camera gear')
  `).run();

  db.prepare(`
    INSERT INTO products (
      id, category_id, name, price_sell, price_rent_per_day,
      deposit_amount, stock_quantity, image_url
    )
    VALUES
      (1, 1, 'Máy khoan', 2000000, 0, 0, 5, ''),
      (2, 1, 'Máy cưa', 0, 200000, 500000, 2, ''),
      (3, 1, 'Combo máy quay', 3000000, 300000, 700000, 1, '')
  `).run();
}

beforeEach(() => {
  closeDatabase();
  const testDbPath = path.join(os.tmpdir(), `rental-shop-test-${Date.now()}-${Math.random()}.db`);
  process.env.DB_PATH = testDbPath;

  const db = getDatabase();
  db.exec(schemaSql);
  db.exec(indexesSql);
  seedBaseData(db);
});

afterEach(() => {
  const dbPath = process.env.DB_PATH;
  closeDatabase();
  for (const suffix of ['', '-wal', '-shm']) {
    try {
      fs.unlinkSync(`${dbPath}${suffix}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
});

test('calculateDays treats same-day rental as one day', () => {
  const today = dateAfter(1);
  expect(calculateDays(today, today)).toBe(1);
  expect(calculateDays(dateAfter(1), dateAfter(4))).toBe(3);
});

test('createOrder calculates buy, rent, deposit and grand total from DB prices', () => {
  const startDate = dateAfter(2);
  const endDate = dateAfter(5);

  const order = createOrder(
    1,
    [
      { productId: 1, type: 'BUY', quantity: 1, price: 1 },
      { productId: 2, type: 'RENT', quantity: 2, startDate, endDate, price: 1 },
    ],
    {
      shippingName: 'Nguyen Van A',
      shippingPhone: '0900000001',
      shippingAddress: '123 Test Street',
      paymentMethod: 'CASH',
    }
  );

  expect(order.totalAmount).toBe(3200000);
  expect(order.totalDeposit).toBe(1000000);
  expect(order.grandTotal).toBe(4200000);
});

test('createOrder merges duplicate buy items and deducts stock once', () => {
  const db = getDatabase();

  createOrder(
    1,
    [
      { productId: 1, type: 'BUY', quantity: 2 },
      { productId: 1, type: 'BUY', quantity: 2 },
    ],
    {
      shippingName: 'Nguyen Van A',
      shippingPhone: '0900000001',
      shippingAddress: '123 Test Street',
      paymentMethod: 'CASH',
    }
  );

  const product = db.prepare('SELECT stock_quantity FROM products WHERE id = 1').get();
  const details = db.prepare('SELECT quantity FROM order_details WHERE product_id = 1 AND type = ?').all('BUY');

  expect(product.stock_quantity).toBe(1);
  expect(details).toHaveLength(1);
  expect(details[0].quantity).toBe(4);
});

test('cancelling a buy order restores deducted stock', () => {
  const db = getDatabase();

  const order = createOrder(
    1,
    [{ productId: 1, type: 'BUY', quantity: 3 }],
    {
      shippingName: 'Nguyen Van A',
      shippingPhone: '0900000001',
      shippingAddress: '123 Test Street',
      paymentMethod: 'CASH',
    }
  );

  expect(db.prepare('SELECT stock_quantity FROM products WHERE id = 1').get().stock_quantity).toBe(2);

  updateOrderStatus(order.orderId, 'CANCELLED', 2);

  expect(db.prepare('SELECT stock_quantity FROM products WHERE id = 1').get().stock_quantity).toBe(5);
});

test('pending rental orders reserve availability before admin approval', () => {
  const startDate = dateAfter(10);
  const endDate = dateAfter(12);

  createOrder(
    1,
    [{ productId: 3, type: 'RENT', quantity: 1, startDate, endDate }],
    {
      shippingName: 'Nguyen Van A',
      shippingPhone: '0900000001',
      shippingAddress: '123 Test Street',
      paymentMethod: 'CASH',
    }
  );

  const result = checkProductAvailability(3, startDate, endDate, 1);

  expect(result.available).toBe(false);
  expect(result.conflictDates).toContain(startDate);
});

test('availability blocks an overlapping rental when stock is exhausted', () => {
  const db = getDatabase();
  const startDate = dateAfter(10);
  const endDate = dateAfter(15);

  db.prepare(`
    INSERT INTO orders (
      id, user_id, total_amount, total_deposit, grand_total,
      status, payment_method, shipping_name, shipping_phone, shipping_address
    )
    VALUES (10, 1, 1000000, 500000, 1500000, 'APPROVED', 'CASH', 'A', '0900000001', 'Addr')
  `).run();
  db.prepare(`
    INSERT INTO order_details (
      order_id, product_id, type, quantity, unit_price,
      start_date, end_date, total_days, subtotal, deposit_amount
    )
    VALUES (10, 3, 'RENT', 1, 300000, ?, ?, 5, 1500000, 700000)
  `).run(startDate, endDate);

  const result = checkProductAvailability(3, endDate, dateAfter(20), 1);

  expect(result.available).toBe(false);
  expect(result.conflictDates).toContain(endDate);
});

test('availability allows the day after an existing rental ends', () => {
  const db = getDatabase();
  const startDate = dateAfter(10);
  const endDate = dateAfter(15);
  const nextStart = dateAfter(16);

  db.prepare(`
    INSERT INTO orders (
      id, user_id, total_amount, total_deposit, grand_total,
      status, payment_method, shipping_name, shipping_phone, shipping_address
    )
    VALUES (11, 1, 1000000, 500000, 1500000, 'APPROVED', 'CASH', 'A', '0900000001', 'Addr')
  `).run();
  db.prepare(`
    INSERT INTO order_details (
      order_id, product_id, type, quantity, unit_price,
      start_date, end_date, total_days, subtotal, deposit_amount
    )
    VALUES (11, 3, 'RENT', 1, 300000, ?, ?, 5, 1500000, 700000)
  `).run(startDate, endDate);

  const result = checkProductAvailability(3, nextStart, dateAfter(20), 1);

  expect(result.available).toBe(true);
  expect(result.conflictDates).toEqual([]);
});
