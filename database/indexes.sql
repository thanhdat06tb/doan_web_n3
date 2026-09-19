-- ═══════════════════════════════════════════════════════════════
-- 📊 INDEXES — Tối ưu hiệu năng truy vấn
-- Chạy SAU schema.sql
-- ═══════════════════════════════════════════════════════════════

-- Index quan trọng nhất: dùng trong checkProductAvailability
-- Tối ưu truy vấn overlap ngày thuê theo product
CREATE INDEX IF NOT EXISTS idx_order_details_product_dates
ON order_details(product_id, start_date, end_date);

-- Index cho tìm kiếm đơn hàng theo user (GET /api/orders/user/:userId)
CREATE INDEX IF NOT EXISTS idx_orders_user_id
ON orders(user_id, created_at DESC);

-- Index cho filter đơn hàng theo status (Admin dashboard)
CREATE INDEX IF NOT EXISTS idx_orders_status
ON orders(status);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status
ON orders(payment_status, payment_method);

-- Index cho tìm kiếm sản phẩm theo danh mục
CREATE INDEX IF NOT EXISTS idx_products_category
ON products(category_id, is_active);

-- Index cho audit logs theo admin và thời gian
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin
ON audit_logs(admin_id, created_at DESC);

-- Index cho deposit_transactions theo order
CREATE INDEX IF NOT EXISTS idx_deposit_trans_order
ON deposit_transactions(order_id);

-- Index cho tìm order_details theo order_id (JOIN tối ưu)
CREATE INDEX IF NOT EXISTS idx_order_details_order
ON order_details(order_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user
ON refresh_tokens(user_id, revoked_at, expires_at);

CREATE INDEX IF NOT EXISTS idx_invalidated_tokens_jti
ON invalidated_tokens(token_jti, expires_at);
