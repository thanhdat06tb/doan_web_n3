// ═══════════════════════════════════════════════════════════════
// 🚀 App Entry Point — Express Server
// Cho thuê & Bán đồ chuyên dụng — Backend API
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const { getDatabase, closeDatabase } = require('./database/connection');
const { errorResponse } = require('./utils/responseHelper');
const logger = require('./utils/logger');

// ━━━ Import Routes ━━━
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const categoryRoutes = require('./routes/categories');

const app = express();
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE STACK
// ═══════════════════════════════════════════════════════════════

// Bảo mật HTTP headers
app.use(helmet());

// CORS — cho phép FE gọi API từ domain khác
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-domain.com']  // Thay bằng domain thực tế
    : '*',                          // Development: cho phép tất cả
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON body (giới hạn 10MB)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded body
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else if (process.env.NODE_ENV !== 'test') {
  // Production: log vào file
  const accessLogStream = fs.createWriteStream(
    path.join(__dirname, '../logs/access.log'),
    { flags: 'a' }
  );
  app.use(morgan('combined', { stream: accessLogStream }));
}

// ═══════════════════════════════════════════════════════════════
// KHỞI TẠO DATABASE
// ═══════════════════════════════════════════════════════════════

// Đảm bảo database đã được khởi tạo trước khi chạy server
try {
  const db = getDatabase();

  // Kiểm tra xem tables đã tồn tại chưa
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    .get();

  if (!tables) {
    console.log('⚠️  Database chưa được khởi tạo. Chạy: npm run db:init');
    console.log('   Hoặc chạy: node src/database/init.js');
  } else {
    console.log('✅ Database đã sẵn sàng');
  }
} catch (error) {
  console.error('❌ Không thể kết nối database:', error.message);
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════════

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);

// ═══════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════

// 404 — Route không tồn tại
app.use((req, res) => {
  res.status(404).json(
    errorResponse('NOT_FOUND', `Không tìm thấy API: ${req.method} ${req.originalUrl}`)
  );
});

// Global error handler — bắt mọi lỗi chưa được xử lý
app.use((err, req, res, next) => {
  logger.error('UNHANDLED_ERROR', {
    method: req.method,
    url: req.originalUrl,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // KHÔNG trả raw error stack cho client (bảo mật)
  res.status(err.status || 500).json(
    errorResponse(
      'INTERNAL_ERROR',
      'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.',
      process.env.NODE_ENV === 'development' ? { message: err.message } : undefined
    )
  );
});

// ═══════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════

if (require.main === module) {
app.listen(PORT, () => {
  console.log('\n═══════════════════════════════════════════');
  console.log(`  🚀 Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`  📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  📊 Health check: http://localhost:${PORT}/api/health`);
  console.log('═══════════════════════════════════════════\n');
  console.log('📋 API Endpoints:');
  console.log('  POST   /api/auth/register');
  console.log('  POST   /api/auth/login');
  console.log('  GET    /api/products');
  console.log('  GET    /api/products/:id');
  console.log('  GET    /api/products/:id/calendar');
  console.log('  GET    /api/products/:id/availability');
  console.log('  GET    /api/categories');
  console.log('  POST   /api/orders');
  console.log('  GET    /api/orders/my');
  console.log('  GET    /api/orders/user/:userId');
  console.log('  GET    /api/orders/:orderId');
  console.log('');
});
}

// ═══════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════════

process.on('SIGINT', () => {
  console.log('\n🛑 Đang tắt server...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Đang tắt server...');
  closeDatabase();
  process.exit(0);
});

module.exports = app;
