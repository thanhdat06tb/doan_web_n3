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
