// ═══════════════════════════════════════════════════════════════
// 🔗 Database Connection — better-sqlite3
// Quản lý kết nối SQLite singleton + cấu hình PRAGMA
// ═══════════════════════════════════════════════════════════════

const Database = require('better-sqlite3');
const path = require('path');

let db = null;

/**
 * Lấy instance database (Singleton Pattern)
 * Đảm bảo chỉ có 1 connection trong toàn bộ app
 */
function getDatabase() {
  if (db) return db;

  const dbPath = process.env.DB_PATH || './database/rental_shop.db';
  const absolutePath = path.resolve(dbPath);

  db = new Database(absolutePath, {
    // verbose: process.env.NODE_ENV === 'development' ? console.log : null
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PRAGMA QUAN TRỌNG — Phải bật TRƯỚC mọi thao tác DB
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Bật ràng buộc khóa ngoại (SQLite tắt mặc định!)
  db.pragma('foreign_keys = ON');

  // Bật WAL mode — cho phép đọc đồng thời khi đang ghi
  // Tăng hiệu năng đáng kể cho ứng dụng web
  db.pragma('journal_mode = WAL');

  // Tối ưu thêm cho hiệu năng
  db.pragma('busy_timeout = 5000'); // Chờ 5 giây nếu DB bị lock

  console.log(`✅ Database connected: ${absolutePath}`);
  console.log(`   PRAGMA foreign_keys = ${db.pragma('foreign_keys', { simple: true })}`);
  console.log(`   PRAGMA journal_mode = ${db.pragma('journal_mode', { simple: true })}`);

  return db;
}

/**
 * Đóng kết nối database (dùng khi shutdown app)
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('🔒 Database connection closed');
  }
}

module.exports = { getDatabase, closeDatabase };
