// ═══════════════════════════════════════════════════════════════
// 🏗️ Database Initialization Script
// Chạy: npm run db:init
// Tạo bảng + seed data + indexes
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { getDatabase, closeDatabase } = require('./connection');
const { ensureOrderPaymentFields } = require('./migrations');
const { syncDemoMedia } = require('./syncDemoMedia');

function initDatabase() {
  console.log('🚀 Bắt đầu khởi tạo database...\n');

  const db = getDatabase();

  try {
    // ━━━ Bước 1: Tạo bảng từ schema.sql ━━━
    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schemaSql);
    ensureOrderPaymentFields(db);
    console.log('✅ Đã tạo xong các bảng (schema.sql)');

    // ━━━ Bước 2: Tạo indexes ━━━
    const indexesPath = path.resolve(__dirname, '../../database/indexes.sql');
    const indexesSql = fs.readFileSync(indexesPath, 'utf-8');
    db.exec(indexesSql);
    console.log('✅ Đã tạo xong indexes (indexes.sql)');

    // ━━━ Bước 3: Seed data mẫu ━━━
    // Kiểm tra xem đã có data chưa để tránh duplicate
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userCount.count === 0) {
      const seedPath = path.resolve(__dirname, '../../database/seed.sql');
      const seedSql = fs.readFileSync(seedPath, 'utf-8');
      db.exec(seedSql);
      console.log('✅ Đã seed dữ liệu mẫu (seed.sql)');
    } else {
      console.log('⏭️  Bỏ qua seed — database đã có dữ liệu');
    }

    syncDemoMedia(db);
    console.log('✅ Đã đồng bộ ảnh demo cho sản phẩm');

    // ━━━ Thống kê ━━━
    console.log('\n📊 Thống kê database:');
    const stats = {
      users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      categories: db.prepare('SELECT COUNT(*) as count FROM categories').get().count,
      products: db.prepare('SELECT COUNT(*) as count FROM products').get().count,
      orders: db.prepare('SELECT COUNT(*) as count FROM orders').get().count,
      orderDetails: db.prepare('SELECT COUNT(*) as count FROM order_details').get().count,
    };
    console.table(stats);

    console.log('\n🎉 Database khởi tạo thành công!');
  } catch (error) {
    console.error('❌ Lỗi khởi tạo database:', error.message);
    process.exit(1);
  } finally {
    closeDatabase();
  }
}

initDatabase();
