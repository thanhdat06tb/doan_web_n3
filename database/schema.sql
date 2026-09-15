-- ═══════════════════════════════════════════════════════════════
-- 📦 SCHEMA CSDL — Hệ Thống Cho Thuê & Bán Đồ Chuyên Dụng
-- Database: SQLite
-- Charset: UTF-8
-- ═══════════════════════════════════════════════════════════════

-- Bật ràng buộc khóa ngoại (SQLite tắt mặc định)
PRAGMA foreign_keys = ON;
-- Bật WAL mode để cho phép đọc đồng thời khi ghi
PRAGMA journal_mode = WAL;

-- ───────────────────────────────────────
-- 1. BẢNG USERS — Người dùng
-- ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name       TEXT    NOT NULL,
    email           TEXT    NOT NULL UNIQUE,
    phone           TEXT    NOT NULL,
    address         TEXT    DEFAULT '',
    password_hash   TEXT    NOT NULL,
    role            TEXT    NOT NULL DEFAULT 'CUSTOMER'
                    CHECK (role IN ('CUSTOMER', 'ADMIN')),
    is_active       INTEGER NOT NULL DEFAULT 1,     -- 1 = active, 0 = deactivated
    created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- ───────────────────────────────────────
-- 2. BẢNG CATEGORIES — Danh mục sản phẩm
-- ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL UNIQUE,
    description     TEXT    DEFAULT '',
    created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- ───────────────────────────────────────
-- 3. BẢNG PRODUCTS — Sản phẩm
-- ───────────────────────────────────────
-- Quy tắc giá:
--   price_sell = 0 AND price_rent_per_day > 0  → Chỉ cho thuê
--   price_sell > 0 AND price_rent_per_day = 0  → Chỉ bán
--   Cả hai > 0                                 → Vừa bán vừa cho thuê
CREATE TABLE IF NOT EXISTS products (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id         INTEGER NOT NULL,
    name                TEXT    NOT NULL,
    description         TEXT    DEFAULT '',
    price_sell          REAL    NOT NULL DEFAULT 0,          -- Giá bán (VND), 0 = không bán
    price_rent_per_day  REAL    NOT NULL DEFAULT 0,          -- Giá thuê/ngày (VND), 0 = không cho thuê
    deposit_amount      REAL    NOT NULL DEFAULT 0,          -- Tiền cọc mỗi đơn vị khi thuê
    stock_quantity      INTEGER NOT NULL DEFAULT 0,          -- Số lượng tồn kho
    image_url           TEXT    DEFAULT '',                   -- Ảnh đại diện chính
    is_active           INTEGER NOT NULL DEFAULT 1,          -- 1 = đang kinh doanh
    created_at          TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at          TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),

    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    CHECK (price_sell >= 0),
    CHECK (price_rent_per_day >= 0),
    CHECK (deposit_amount >= 0),
    CHECK (stock_quantity >= 0),
    -- Ít nhất một trong hai giá phải > 0
    CHECK (price_sell > 0 OR price_rent_per_day > 0)
);

-- ───────────────────────────────────────
-- 4. BẢNG PRODUCT_IMAGES — Ảnh sản phẩm (nhiều ảnh)
-- ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id      INTEGER NOT NULL,
    image_url       TEXT    NOT NULL,
    is_primary      INTEGER NOT NULL DEFAULT 0,      -- 1 = ảnh chính
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),

    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ───────────────────────────────────────
-- 5. BẢNG ORDERS — Đơn hàng
-- ───────────────────────────────────────
-- Status workflow (State Machine):
--   PENDING → APPROVED → RENTING → COMPLETED
--   PENDING → CANCELLED
--   APPROVED → CANCELLED
CREATE TABLE IF NOT EXISTS orders (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL,
    total_amount        REAL    NOT NULL DEFAULT 0,          -- Tổng tiền hàng (không bao gồm cọc)
    total_deposit       REAL    NOT NULL DEFAULT 0,          -- Tổng tiền cọc
    grand_total         REAL    NOT NULL DEFAULT 0,          -- total_amount + total_deposit
    status              TEXT    NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING', 'APPROVED', 'RENTING', 'COMPLETED', 'CANCELLED')),
    payment_method      TEXT    NOT NULL DEFAULT 'CASH'
                        CHECK (payment_method IN ('CASH', 'TRANSFER')),
    shipping_name       TEXT    NOT NULL,
    shipping_phone      TEXT    NOT NULL,
    shipping_address    TEXT    NOT NULL,
    note                TEXT    DEFAULT '',
    return_date         TEXT    DEFAULT NULL,                 -- Ngày trả đồ thực tế (cho đơn thuê)
    return_note         TEXT    DEFAULT '',                   -- Ghi chú khi trả đồ
    created_at          TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at          TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- ───────────────────────────────────────
-- 6. BẢNG ORDER_DETAILS — Chi tiết đơn hàng
-- ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_details (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id            INTEGER NOT NULL,
    product_id          INTEGER NOT NULL,
    type                TEXT    NOT NULL CHECK (type IN ('BUY', 'RENT')),
    quantity            INTEGER NOT NULL CHECK (quantity > 0),
    unit_price          REAL    NOT NULL,                    -- Snapshot giá tại thời điểm đặt
    start_date          TEXT    DEFAULT NULL,                -- Ngày bắt đầu thuê (NULL nếu BUY)
    end_date            TEXT    DEFAULT NULL,                -- Ngày kết thúc thuê (NULL nếu BUY)
    total_days          INTEGER DEFAULT 0,                   -- Số ngày thuê
    subtotal            REAL    NOT NULL DEFAULT 0,          -- unit_price × quantity [× total_days nếu RENT]
    deposit_amount      REAL    NOT NULL DEFAULT 0,          -- Tiền cọc = product.deposit × quantity

    FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- ───────────────────────────────────────
-- 7. BẢNG DEPOSIT_TRANSACTIONS — Lịch sử xử lý tiền cọc
-- ───────────────────────────────────────
-- Dùng khi Admin hoàn tất đơn thuê (GĐ3), ghi lại từng khoản cọc
CREATE TABLE IF NOT EXISTS deposit_transactions (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id            INTEGER NOT NULL,
    order_detail_id     INTEGER NOT NULL,
    deposit_collected   REAL    NOT NULL DEFAULT 0,          -- Tiền cọc đã thu
    condition           TEXT    NOT NULL DEFAULT 'GOOD'
                        CHECK (condition IN ('GOOD', 'DAMAGED', 'LOST')),
    damage_note         TEXT    DEFAULT '',
    deduct_amount       REAL    NOT NULL DEFAULT 0,          -- Số tiền khấu trừ
    refund_amount       REAL    NOT NULL DEFAULT 0,          -- Số tiền hoàn trả
    late_fee            REAL    NOT NULL DEFAULT 0,          -- Phí trả trễ
    processed_by        INTEGER DEFAULT NULL,                -- Admin ID xử lý
    created_at          TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),

    FOREIGN KEY (order_id)        REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (order_detail_id) REFERENCES order_details(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by)    REFERENCES users(id) ON DELETE SET NULL
);

-- ───────────────────────────────────────
-- 8. BẢNG AUDIT_LOGS — Log hành động admin
-- ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id        INTEGER NOT NULL,
    action          TEXT    NOT NULL,                        -- VD: 'APPROVE_ORDER', 'CANCEL_ORDER'
    target_table    TEXT    NOT NULL,                        -- VD: 'orders', 'products'
    target_id       INTEGER NOT NULL,
    old_value       TEXT    DEFAULT '',                      -- JSON string giá trị cũ
    new_value       TEXT    DEFAULT '',                      -- JSON string giá trị mới
    created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),

    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE RESTRICT
);
