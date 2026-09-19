const fs = require('fs');
const os = require('os');
const path = require('path');
const bcrypt = require('bcryptjs');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const app = require('../src/app');
const { getDatabase, closeDatabase } = require('../src/database/connection');

const schemaSql = fs.readFileSync(path.resolve(__dirname, '../database/schema.sql'), 'utf8');
const indexesSql = fs.readFileSync(path.resolve(__dirname, '../database/indexes.sql'), 'utf8');

let server;
let baseUrl;

function dateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const body = await response.json();
  return { status: response.status, body };
}

async function rawRequest(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  return { status: response.status, text, headers: response.headers };
}

async function login(email, password = 'password123') {
  const response = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return response.body.data.token;
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

function seedBaseData(db) {
  const hash = bcrypt.hashSync('password123', 10);

  db.prepare(`
    INSERT INTO users (id, full_name, email, phone, address, password_hash, role)
    VALUES
      (1, 'Customer One', 'customer@example.com', '0900000001', 'Test address', ?, 'CUSTOMER'),
      (2, 'Admin One', 'admin@example.com', '0900000002', 'Admin address', ?, 'ADMIN')
  `).run(hash, hash);

  db.prepare(`
    INSERT INTO categories (id, name, description)
    VALUES (1, 'Thiết bị test', 'Test category')
  `).run();

  db.prepare(`
    INSERT INTO products (
      id, category_id, name, description, price_sell, price_rent_per_day,
      deposit_amount, stock_quantity, image_url
    )
    VALUES
      (1, 1, 'Máy khoan test', 'Buy product', 2000000, 0, 0, 5, '/images/bosch-gbh226.png'),
      (2, 1, 'Máy quay test', 'Rent product', 0, 200000, 500000, 1, '/images/sony-a7iii.png')
  `).run();
}

beforeAll((done) => {
  server = app.listen(0, () => {
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
    done();
  });
});

afterAll((done) => {
  closeDatabase();
  server.close(done);
});

beforeEach(() => {
  closeDatabase();
  const testDbPath = path.join(os.tmpdir(), `rental-shop-api-test-${Date.now()}-${Math.random()}.db`);
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

test('auth API registers, rejects duplicate email and logs in', async () => {
  const register = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'New Customer',
      email: 'new@example.com',
      phone: '0911111111',
      address: 'New test address',
      password: 'password123',
    }),
  });

  expect(register.status).toBe(201);
  expect(register.body.success).toBe(true);
  expect(register.body.data.user.email).toBe('new@example.com');

  const duplicate = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'New Customer',
      email: 'new@example.com',
      phone: '0911111111',
      address: 'New test address',
      password: 'password123',
    }),
  });

  expect(duplicate.status).toBe(409);
  expect(duplicate.body.error.code).toBe('EMAIL_EXISTS');

  const token = await login('new@example.com');
  expect(token).toEqual(expect.any(String));
});

test('auth API refreshes token and logout invalidates current access token', async () => {
  const loginResponse = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'customer@example.com', password: 'password123' }),
  });

  const { token, refreshToken } = loginResponse.body.data;
  expect(token).toEqual(expect.any(String));
  expect(refreshToken).toEqual(expect.any(String));

  const refresh = await request('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
  expect(refresh.status).toBe(200);
  expect(refresh.body.data.token).toEqual(expect.any(String));

  const logout = await request('/api/auth/logout', {
    method: 'POST',
    headers: authHeader(token),
    body: JSON.stringify({ refreshToken }),
  });
  expect(logout.status).toBe(200);

  const afterLogout = await request('/api/orders/my', {
    headers: authHeader(token),
  });
  expect(afterLogout.status).toBe(401);

  const refreshAfterLogout = await request('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
  expect(refreshAfterLogout.status).toBe(401);
});

test('order API rejects checkout conflict for approved overlapping rental', async () => {
  const db = getDatabase();
  const startDate = dateAfter(3);
  const endDate = dateAfter(5);

  db.prepare(`
    INSERT INTO orders (
      id, user_id, total_amount, total_deposit, grand_total,
      status, payment_method, shipping_name, shipping_phone, shipping_address
    )
    VALUES (10, 1, 400000, 500000, 900000, 'APPROVED', 'CASH', 'A', '0900000001', 'Addr')
  `).run();

  db.prepare(`
    INSERT INTO order_details (
      order_id, product_id, type, quantity, unit_price,
      start_date, end_date, total_days, subtotal, deposit_amount
    )
    VALUES (10, 2, 'RENT', 1, 200000, ?, ?, 2, 400000, 500000)
  `).run(startDate, endDate);

  const token = await login('customer@example.com');
  const response = await request('/api/orders', {
    method: 'POST',
    headers: authHeader(token),
    body: JSON.stringify({
      cartItems: [{ productId: 2, quantity: 1, type: 'RENT', startDate, endDate }],
      shippingName: 'Customer One',
      shippingPhone: '0900000001',
      shippingAddress: 'Test address',
      paymentMethod: 'CASH',
    }),
  });

  expect(response.status).toBe(409);
  expect(response.body.error.code).toBe('ORDER_CONFLICT');
});

test('admin product API lists, updates and deactivates products', async () => {
  const token = await login('admin@example.com');

  const list = await request('/api/admin/products?limit=5', {
    headers: authHeader(token),
  });
  expect(list.status).toBe(200);
  expect(list.body.data.items.length).toBeGreaterThan(0);

  const update = await request('/api/admin/products/1', {
    method: 'PUT',
    headers: authHeader(token),
    body: JSON.stringify({
      category_id: 1,
      name: 'Máy khoan test đã sửa',
      description: 'Updated',
      price_sell: 2100000,
      price_rent_per_day: 0,
      deposit_amount: 0,
      stock_quantity: 4,
      image_url: '/images/bosch-gbh226.png',
    }),
  });
  expect(update.status).toBe(200);

  const deactivate = await request('/api/admin/products/1/active', {
    method: 'PATCH',
    headers: authHeader(token),
    body: JSON.stringify({ is_active: false }),
  });
  expect(deactivate.status).toBe(200);

  const detail = await request('/api/admin/products/1', {
    headers: authHeader(token),
  });
  expect(detail.body.data.name).toBe('Máy khoan test đã sửa');
  expect(detail.body.data.is_active).toBe(0);
});

test('admin product API stores editable product gallery images', async () => {
  const token = await login('admin@example.com');

  const update = await request('/api/admin/products/1', {
    method: 'PUT',
    headers: authHeader(token),
    body: JSON.stringify({
      category_id: 1,
      name: 'Gallery product',
      description: 'Updated gallery',
      price_sell: 2100000,
      price_rent_per_day: 0,
      deposit_amount: 0,
      stock_quantity: 4,
      image_url: '/images/primary.png',
      images: ['/images/primary.png', '/images/angle.png', '/images/color.png', '/images/angle.png'],
    }),
  });
  expect(update.status).toBe(200);

  const detail = await request('/api/admin/products/1', {
    headers: authHeader(token),
  });

  expect(detail.body.data.image_url).toBe('/images/primary.png');
  expect(detail.body.data.images.map((image) => image.image_url)).toEqual([
    '/images/primary.png',
    '/images/angle.png',
    '/images/color.png',
  ]);
  expect(detail.body.data.images[0].is_primary).toBe(1);
});

test('admin orders API filters by created date and returns daily summary', async () => {
  const db = getDatabase();
  const token = await login('admin@example.com');

  db.prepare(`
    INSERT INTO orders (
      id, user_id, total_amount, total_deposit, grand_total,
      status, payment_method, shipping_name, shipping_phone, shipping_address, created_at
    )
    VALUES
      (30, 1, 200000, 50000, 250000, 'PENDING', 'TRANSFER', 'Customer One', '0900000001', 'Addr', '2026-09-16 08:10:00'),
      (31, 1, 300000, 0, 300000, 'COMPLETED', 'CASH', 'Customer Two', '0900000002', 'Addr', '2026-09-16 14:30:00'),
      (32, 1, 400000, 100000, 500000, 'APPROVED', 'TRANSFER', 'Customer Three', '0900000003', 'Addr', '2026-09-17 09:00:00')
  `).run();

  db.prepare(`
    INSERT INTO order_details (
      order_id, product_id, type, quantity, unit_price,
      start_date, end_date, total_days, subtotal, deposit_amount
    )
    VALUES
      (30, 1, 'BUY', 1, 200000, NULL, NULL, 0, 200000, 0),
      (31, 2, 'RENT', 1, 300000, '2026-09-18', '2026-09-18', 1, 300000, 0),
      (32, 2, 'RENT', 1, 400000, '2026-09-19', '2026-09-19', 1, 400000, 100000)
  `).run();

  const response = await request('/api/admin/orders?date=2026-09-16&limit=20', {
    headers: authHeader(token),
  });

  expect(response.status).toBe(200);
  expect(response.body.data.items.map((order) => order.id)).toEqual([31, 30]);
  expect(response.body.data.summary.selectedDate).toBe('2026-09-16');
  expect(response.body.data.summary.orderCount).toBe(2);
  expect(response.body.data.summary.grandTotal).toBe(550000);
  expect(response.body.data.summary.statusCounts.PENDING).toBe(1);
  expect(response.body.data.summary.statusCounts.COMPLETED).toBe(1);
});

test('admin orders API treats empty date query as no date filter', async () => {
  const db = getDatabase();
  const token = await login('admin@example.com');

  db.prepare(`
    INSERT INTO orders (
      id, user_id, total_amount, total_deposit, grand_total,
      status, payment_method, shipping_name, shipping_phone, shipping_address, created_at
    )
    VALUES
      (35, 1, 200000, 0, 200000, 'PENDING', 'CASH', 'Customer One', '0900000001', 'Addr', '2026-09-16 08:10:00'),
      (36, 1, 300000, 0, 300000, 'COMPLETED', 'CASH', 'Customer Two', '0900000002', 'Addr', '2026-09-17 14:30:00')
  `).run();

  const response = await request('/api/admin/orders?date=&limit=100', {
    headers: authHeader(token),
  });

  expect(response.status).toBe(200);
  expect(response.body.data.items.map((order) => order.id)).toEqual(expect.arrayContaining([35, 36]));
  expect(response.body.data.summary.selectedDate).toBeNull();
});

test('admin export API returns analysis-ready order item CSV', async () => {
  const db = getDatabase();
  const token = await login('admin@example.com');

  db.prepare(`
    INSERT INTO orders (
      id, user_id, total_amount, total_deposit, grand_total,
      status, payment_method, payment_status, shipping_name, shipping_phone, shipping_address, created_at
    )
    VALUES (40, 1, 400000, 100000, 500000, 'COMPLETED', 'TRANSFER', 'PAID', 'Customer One', '0900000001', 'Addr', '2026-09-16 08:10:00')
  `).run();

  db.prepare(`
    INSERT INTO order_details (
      order_id, product_id, type, quantity, unit_price,
      start_date, end_date, total_days, subtotal, deposit_amount
    )
    VALUES (40, 2, 'RENT', 2, 200000, '2026-09-18', '2026-09-19', 2, 800000, 100000)
  `).run();

  const response = await rawRequest('/api/admin/export/order-items.csv?from=2026-09-16&to=2026-09-16', {
    headers: authHeader(token),
  });

  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toContain('text/csv');
  expect(response.text).toContain('sep=;');
  expect(response.text).toContain('order_id;order_date');
  expect(response.text).toContain('rental_unit_days');
  expect(response.text).toContain('Customer One');
  expect(response.text).toContain('Máy quay test');

  const reportPath = response.headers.get('x-report-path');
  expect(reportPath).toMatch(/^reports[\\/].+\.csv$/);
  expect(fs.existsSync(path.resolve(__dirname, '..', reportPath))).toBe(true);
});

test('customer submits transfer proof and admin reviews payment', async () => {
  const customerToken = await login('customer@example.com');
  const adminToken = await login('admin@example.com');
  const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';

  const orderResponse = await request('/api/orders', {
    method: 'POST',
    headers: authHeader(customerToken),
    body: JSON.stringify({
      cartItems: [{ productId: 1, quantity: 1, type: 'BUY' }],
      shippingName: 'Customer One',
      shippingPhone: '0900000001',
      shippingAddress: 'Test address',
      paymentMethod: 'TRANSFER',
    }),
  });

  expect(orderResponse.status).toBe(201);
  const orderId = orderResponse.body.data.orderId;

  const proofResponse = await request(`/api/orders/${orderId}/payment-proof`, {
    method: 'POST',
    headers: authHeader(customerToken),
    body: JSON.stringify({
      fileName: 'proof.png',
      dataUrl: tinyPng,
      note: 'Da chuyen khoan',
    }),
  });

  expect(proofResponse.status).toBe(200);
  expect(proofResponse.body.data.payment_status).toBe('PENDING_REVIEW');
  expect(proofResponse.body.data.payment_proof_url).toContain('/payment-proofs/');

  const reviewResponse = await request(`/api/admin/orders/${orderId}/payment`, {
    method: 'PUT',
    headers: authHeader(adminToken),
    body: JSON.stringify({
      paymentStatus: 'PAID',
      note: 'Da doi soat',
    }),
  });

  expect(reviewResponse.status).toBe(200);
  expect(reviewResponse.body.data.payment_status).toBe('PAID');
  expect(reviewResponse.body.data.payment_note).toBe('Da doi soat');
  expect(reviewResponse.body.data.payment_confirmed_at).toEqual(expect.any(String));
});

test('admin dashboard overdue API returns renting orders past end date', async () => {
  const db = getDatabase();
  const token = await login('admin@example.com');
  const startDate = dateAfter(-5);
  const endDate = dateAfter(-2);

  db.prepare(`
    INSERT INTO orders (
      id, user_id, total_amount, total_deposit, grand_total,
      status, payment_method, shipping_name, shipping_phone, shipping_address
    )
    VALUES (12, 1, 400000, 500000, 900000, 'RENTING', 'CASH', 'Customer One', '0900000001', 'Addr')
  `).run();

  db.prepare(`
    INSERT INTO order_details (
      order_id, product_id, type, quantity, unit_price,
      start_date, end_date, total_days, subtotal, deposit_amount
    )
    VALUES (12, 2, 'RENT', 1, 200000, ?, ?, 2, 400000, 500000)
  `).run(startDate, endDate);

  const response = await request('/api/admin/dashboard/overdue-orders', {
    headers: authHeader(token),
  });

  expect(response.status).toBe(200);
  expect(response.body.data[0].orderId).toBe(12);
  expect(response.body.data[0].overdueDays).toBeGreaterThan(0);
});

test('admin dashboard analytics API returns chart-ready metrics', async () => {
  const db = getDatabase();
  const token = await login('admin@example.com');
  const today = new Date().toISOString().slice(0, 10);

  db.prepare(`
    INSERT INTO orders (
      id, user_id, total_amount, total_deposit, grand_total,
      status, payment_method, shipping_name, shipping_phone, shipping_address, created_at
    )
    VALUES (30, 1, 2600000, 500000, 3100000, 'COMPLETED', 'CASH', 'Customer One', '0900000001', 'Addr', ?)
  `).run(`${today} 09:30:00`);

  db.prepare(`
    INSERT INTO order_details (
      order_id, product_id, type, quantity, unit_price,
      start_date, end_date, total_days, subtotal, deposit_amount
    )
    VALUES
      (30, 1, 'BUY', 1, 2000000, NULL, NULL, 0, 2000000, 0),
      (30, 2, 'RENT', 1, 200000, ?, ?, 3, 600000, 500000)
  `).run(today, dateAfter(2));

  const response = await request('/api/admin/dashboard/analytics?period=30d&status=COMPLETED&categoryId=ALL', {
    headers: authHeader(token),
  });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.data.categories.length).toBeGreaterThan(0);
  expect(response.body.data.revenueByCategory[0].totalRevenue).toBe(2600000);
  expect(response.body.data.dailyRevenue.some((row) => row.date === today && row.totalRevenue === 2600000)).toBe(true);
  expect(response.body.data.transactionMix.map((row) => row.type).sort()).toEqual(['BUY', 'RENT']);
  expect(response.body.data.topRentalDays[0].rentalUnitDays).toBe(3);
});

test('admin status API completes buy-only orders without sending them to renting', async () => {
  const db = getDatabase();
  const token = await login('admin@example.com');

  db.prepare(`
    INSERT INTO orders (
      id, user_id, total_amount, total_deposit, grand_total,
      status, payment_method, shipping_name, shipping_phone, shipping_address
    )
    VALUES (20, 1, 2000000, 0, 2000000, 'APPROVED', 'CASH', 'Customer One', '0900000001', 'Addr')
  `).run();

  db.prepare(`
    INSERT INTO order_details (
      order_id, product_id, type, quantity, unit_price,
      start_date, end_date, total_days, subtotal, deposit_amount
    )
    VALUES (20, 1, 'BUY', 1, 2000000, NULL, NULL, 0, 2000000, 0)
  `).run();

  const invalidRenting = await request('/api/admin/orders/20/status', {
    method: 'PUT',
    headers: authHeader(token),
    body: JSON.stringify({ status: 'RENTING' }),
  });
  expect(invalidRenting.status).toBe(400);
  expect(invalidRenting.body.error.code).toBe('INVALID_STATUS_TRANSITION');

  const complete = await request('/api/admin/orders/20/status', {
    method: 'PUT',
    headers: authHeader(token),
    body: JSON.stringify({ status: 'COMPLETED' }),
  });
  expect(complete.status).toBe(200);
  expect(complete.body.data.status).toBe('COMPLETED');
});

test('availability API blocks fully booked overlapping range and allows next day', async () => {
  const db = getDatabase();
  const startDate = dateAfter(8);
  const endDate = dateAfter(10);
  const nextDate = dateAfter(11);

  db.prepare(`
    INSERT INTO orders (
      id, user_id, total_amount, total_deposit, grand_total,
      status, payment_method, shipping_name, shipping_phone, shipping_address
    )
    VALUES (11, 1, 400000, 500000, 900000, 'RENTING', 'CASH', 'A', '0900000001', 'Addr')
  `).run();

  db.prepare(`
    INSERT INTO order_details (
      order_id, product_id, type, quantity, unit_price,
      start_date, end_date, total_days, subtotal, deposit_amount
    )
    VALUES (11, 2, 'RENT', 1, 200000, ?, ?, 2, 400000, 500000)
  `).run(startDate, endDate);

  const blocked = await request(`/api/products/2/availability?startDate=${startDate}&endDate=${endDate}&quantity=1`);
  expect(blocked.status).toBe(200);
  expect(blocked.body.data.available).toBe(false);

  const allowed = await request(`/api/products/2/availability?startDate=${nextDate}&endDate=${dateAfter(12)}&quantity=1`);
  expect(allowed.status).toBe(200);
  expect(allowed.body.data.available).toBe(true);
});
