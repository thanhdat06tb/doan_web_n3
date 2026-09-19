-- ═══════════════════════════════════════════════════════════════
-- 🌱 DỮ LIỆU MẪU — Seed Data
-- Chạy SAU schema.sql
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────
-- USERS: 1 Admin + 2 Khách hàng
-- Password mặc định: "password123" (bcrypt hash)
-- ───────────────────────────────────────
INSERT INTO users (full_name, email, phone, address, password_hash, role) VALUES
('Admin Hệ Thống', 'admin@rental.vn', '0901234567', '123 Nguyễn Huệ, Q.1, TP.HCM',
 '$2a$10$4vri5j1SWGLudV72j8HoieZ20Zd2NkeeKpUBhMicfIGVQpSzG2HNS', 'ADMIN'),
('Nguyễn Văn An', 'an.nguyen@gmail.com', '0912345678', '456 Lê Lợi, Q.3, TP.HCM',
 '$2a$10$4vri5j1SWGLudV72j8HoieZ20Zd2NkeeKpUBhMicfIGVQpSzG2HNS', 'CUSTOMER'),
('Trần Thị Bình', 'binh.tran@gmail.com', '0923456789', '789 Trần Hưng Đạo, Q.5, TP.HCM',
 '$2a$10$4vri5j1SWGLudV72j8HoieZ20Zd2NkeeKpUBhMicfIGVQpSzG2HNS', 'CUSTOMER');

-- ───────────────────────────────────────
-- CATEGORIES: 4 danh mục
-- ───────────────────────────────────────
UPDATE users
SET full_name = 'Admin He Thong',
    email = 'thanhdat06@08.vn',
    phone = '0369038160',
    address = 'Hung Yen',
    password_hash = '$2a$10$MGlLk4hlJTXGh.NMDWpIg.6zVmcZbcWXYKz9//r6mqpHFDpoREo2a',
    role = 'ADMIN',
    is_active = 1
WHERE role = 'ADMIN';

DELETE FROM users WHERE role = 'CUSTOMER';

INSERT INTO categories (name, description) VALUES
('Thiết bị xây dựng', 'Máy khoan, máy cưa, máy mài, máy trộn bê tông và các thiết bị xây dựng chuyên nghiệp'),
('Quần áo bảo hộ', 'Áo phản quang, bộ quần áo bảo hộ và trang phục an toàn cho công trình'),
('Giày dép chuyên dụng', 'Giày bảo hộ, ủng và giày chống trượt dùng cho lao động, công trình'),
('Thiết bị quay phim', 'Camera, ống kính, gimbal, drone, đèn studio chuyên nghiệp');

-- ───────────────────────────────────────
-- PRODUCTS: 10 sản phẩm
-- Quy tắc: price_sell=0 → chỉ thuê | price_rent=0 → chỉ bán | cả hai > 0 → vừa bán vừa thuê
-- ───────────────────────────────────────
INSERT INTO products (category_id, name, description, price_sell, price_rent_per_day, deposit_amount, stock_quantity, image_url) VALUES
-- === Thiết bị xây dựng ===
(1, 'Máy Khoan Bosch GBH 2-26 DRE',
 'Máy khoan búa chuyên nghiệp 800W, khoan bê tông tối đa 26mm. Phù hợp cho công trình xây dựng.',
 4500000, 150000, 1000000, 5, '/images/bosch-gbh226.png'),

(1, 'Máy Cắt Bê Tông Makita 4100NH',
 'Máy cắt rãnh bê tông 1400W, lưỡi cắt 110mm. Cắt gạch, bê tông chính xác.',
 3200000, 120000, 800000, 3, '/images/makita-4100nh.png'),

(1, 'Máy Trộn Bê Tông 350L',
 'Máy trộn bê tông dung tích 350 lít, động cơ 2.2KW. Cho công trình vừa và lớn.',
 0, 500000, 3000000, 2, '/images/concrete-mixer-350.png'),

-- === Quần áo bảo hộ ===
(2, 'Áo phản quang bảo hộ công trình',
 'Áo phản quang màu nổi, vải thoáng nhẹ, có dải phản sáng rõ trong môi trường thiếu sáng.',
 180000, 20000, 100000, 30, '/images/ao-phan-quang-bao-ho.png'),

(2, 'Bộ quần áo bảo hộ lao động',
 'Bộ áo quần bảo hộ dài tay kèm nón và găng, phù hợp công trình xây dựng và xưởng sản xuất.',
 450000, 50000, 200000, 20, '/images/quan-ao-bao-ho.png'),

-- === Giày dép chuyên dụng ===
(3, 'Giày bảo hộ mũi thép chống trượt',
 'Giày bảo hộ cổ thấp, mũi thép, đế chống trượt và chống đinh cho môi trường công trình.',
 650000, 70000, 300000, 18, '/images/giay-bao-ho.png'),

-- === Thiết bị quay phim ===
(4, 'Camera Sony A7 III + Lens Kit 28-70mm',
 'Máy ảnh mirrorless Full Frame 24.2MP, quay 4K HDR, chống rung 5 trục. Kèm lens kit.',
 45000000, 1200000, 10000000, 3, '/images/sony-a7iii.png'),

(4, 'DJI Ronin RS3 Pro Gimbal',
 'Gimbal chống rung 3 trục, tải trọng tối đa 4.5kg. Hỗ trợ quay phim chuyên nghiệp.',
 15000000, 500000, 3000000, 4, '/images/dji-ronin-rs3.png'),

(4, 'DJI Mavic 3 Pro Drone',
 'Drone quay phim 5.1K, camera Hasselblad, bay 46 phút. Cần giấy phép bay.',
 0, 2000000, 15000000, 2, '/images/dji-mavic3-pro.png'),

(4, 'Bộ Đèn Studio Godox SL-150W (3 đèn)',
 'Bộ 3 đèn LED studio 150W ánh sáng trắng 5600K, kèm softbox và chân đèn.',
 8500000, 350000, 2000000, 4, '/images/godox-sl150w.png');

-- ───────────────────────────────────────
-- PRODUCT_IMAGES: Ảnh bổ sung cho một số sản phẩm
-- ───────────────────────────────────────
INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES
(1, '/images/bosch-gbh226.png', 1, 0),
(1, '/images/bosch-gbh226-2.png', 0, 1),
(1, '/images/bosch-gbh226-3.png', 0, 2),
(4, '/images/ao-phan-quang-bao-ho.png', 1, 0),
(5, '/images/quan-ao-bao-ho.png', 1, 0),
(6, '/images/giay-bao-ho.png', 1, 0),
(7, '/images/sony-a7iii.png', 1, 0),
(7, '/images/sony-a7iii-2.png', 0, 1),
(7, '/images/sony-a7iii-3.png', 0, 2),
(7, '/images/sony-a7iii-4.png', 0, 3);

-- ───────────────────────────────────────
-- ORDERS: 4 đơn hàng mẫu với các trạng thái khác nhau
-- ───────────────────────────────────────

-- Đơn 1: Khách An mua máy khoan (COMPLETED)
INSERT INTO orders (user_id, total_amount, total_deposit, grand_total, status, payment_method,
                    shipping_name, shipping_phone, shipping_address, note)
VALUES (2, 4500000, 0, 4500000, 'COMPLETED', 'TRANSFER',
        'Nguyễn Văn An', '0912345678', '456 Lê Lợi, Q.3, TP.HCM', 'Giao giờ hành chính');

INSERT INTO order_details (order_id, product_id, type, quantity, unit_price, subtotal)
VALUES (1, 1, 'BUY', 1, 4500000, 4500000);

-- Đơn 2: Khách Bình thuê áo phản quang bảo hộ (RENTING)
INSERT INTO orders (user_id, total_amount, total_deposit, grand_total, status, payment_method,
                    shipping_name, shipping_phone, shipping_address, note)
VALUES (3, 60000, 100000, 160000, 'RENTING', 'CASH',
        'Trần Thị Bình', '0923456789', '789 Trần Hưng Đạo, Q.5, TP.HCM', 'Thuê áo phản quang cho công trình');

INSERT INTO order_details (order_id, product_id, type, quantity, unit_price, start_date, end_date, total_days, subtotal, deposit_amount)
VALUES (2, 4, 'RENT', 1, 20000, '2025-08-10', '2025-08-13', 3, 60000, 100000);

-- Đơn 3: Khách An thuê camera + gimbal (APPROVED)
INSERT INTO orders (user_id, total_amount, total_deposit, grand_total, status, payment_method,
                    shipping_name, shipping_phone, shipping_address, note)
VALUES (2, 8500000, 13000000, 21500000, 'APPROVED', 'TRANSFER',
        'Nguyễn Văn An', '0912345678', '456 Lê Lợi, Q.3, TP.HCM', 'Quay phim sự kiện cưới');

INSERT INTO order_details (order_id, product_id, type, quantity, unit_price, start_date, end_date, total_days, subtotal, deposit_amount)
VALUES
(3, 7, 'RENT', 1, 1200000, '2025-08-20', '2025-08-25', 5, 6000000, 10000000),
(3, 8, 'RENT', 1, 500000, '2025-08-20', '2025-08-25', 5, 2500000, 3000000);

-- Đơn 4: Khách Bình đặt mua giày bảo hộ + thuê quần áo bảo hộ (PENDING)
INSERT INTO orders (user_id, total_amount, total_deposit, grand_total, status, payment_method,
                    shipping_name, shipping_phone, shipping_address, note)
VALUES (3, 900000, 200000, 1100000, 'PENDING', 'CASH',
        'Trần Thị Bình', '0923456789', '789 Trần Hưng Đạo, Q.5, TP.HCM', 'Trang bị bảo hộ cho đội thi công');

INSERT INTO order_details (order_id, product_id, type, quantity, unit_price, subtotal)
VALUES (4, 6, 'BUY', 1, 650000, 650000);

INSERT INTO order_details (order_id, product_id, type, quantity, unit_price, start_date, end_date, total_days, subtotal, deposit_amount)
VALUES (4, 5, 'RENT', 1, 50000, '2025-09-01', '2025-09-06', 5, 250000, 200000);
