# 🚀 Prompt Chiến Lược Nâng Cấp — Đồ Án Web Cho Thuê & Bán Đồ Chuyên Dụng

> **Cách dùng:** Chạy tuần tự Giai đoạn 1 → 2 → 3 → 4. Mỗi prompt dán kèm code CSDL SQLite
> và output của giai đoạn trước. Không dùng một prompt duy nhất cho cả dự án.

---

## ⚙️ GIAI ĐOẠN 1 — Kiến Trúc & Service Layer (Backend Core)

```
Bạn là một Senior Full Stack Engineer với 8+ năm kinh nghiệm, chuyên xây dựng
hệ thống thương mại điện tử có tính năng cho thuê tài sản phức tạp.

Tôi đang làm đồ án web "Cho thuê & Bán đồ chuyên dụng" với CSDL SQLite (schema đính kèm).
Nhiệm vụ: Xây dựng Service Layer hoàn chỉnh theo kiến trúc sạch (Clean Architecture).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK (chọn 1 và nhất quán toàn bộ):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Node.js (Express) + better-sqlite3 (sync driver, phù hợp SQLite) + Zod (validation)
• Hoặc: Python (FastAPI) + SQLAlchemy + Pydantic

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHẦN A — MODULE KIỂM TRA LỊCH (Availability Engine)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Viết hàm `checkProductAvailability(productId, startDate, endDate, quantityNeeded)`
với đầy đủ yêu cầu sau:

INPUT VALIDATION (phải validate trước khi chạm DB):
- startDate và endDate phải là ISO 8601 string hợp lệ (YYYY-MM-DD)
- startDate >= ngày hôm nay (không cho phép đặt trong quá khứ)
- endDate > startDate (khoảng thuê tối thiểu 1 ngày)
- quantityNeeded là số nguyên dương, không vượt quá stock tối đa của sản phẩm
- productId tồn tại trong DB và `price_rent_per_day > 0` (nếu = 0 thì là đồ chỉ bán)

LOGIC TÍNH TOÁN LỊCH (giải thích rõ từng bước trong comment):
- Lấy tổng số lượng đang được thuê trong khoảng [startDate, endDate] từ bảng
  order_details JOIN orders, với điều kiện orders.status IN ('APPROVED', 'RENTING')
- Điều kiện overlap ngày: (existing_start <= endDate) AND (existing_end >= startDate)
- Số lượng còn trống = product.stock_quantity - SUM(booked_quantity trong khoảng đó)
- Trả về: { available: boolean, availableQty: number, conflictDates: Date[] }
  (conflictDates: mảng các ngày cụ thể bị block, để vẽ trên Calendar ở FE)

OUTPUT RESPONSE FORMAT (nhất quán toàn bộ dự án):
- Thành công: { success: true, data: { available, availableQty, conflictDates } }
- Thất bại:   { success: false, error: { code: string, message: string, details?: any } }

Mã lỗi cần định nghĩa (tạo file constants/errorCodes.js):
  INVALID_DATE_RANGE | PAST_DATE | PRODUCT_NOT_FOUND | RENT_ONLY_PRODUCT
  INSUFFICIENT_STOCK | INVALID_QUANTITY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHẦN B — MODULE TẠO ĐƠN HÀNG (Order Engine với Transaction)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Viết API `POST /api/orders` nhận body: { userId, cartItems: [...] }
Mỗi cartItem có dạng:
  { productId, quantity, type: 'BUY'|'RENT', startDate?, endDate? }

YÊU CẦU XỬ LÝ TRANSACTION (ACID):
- Bọc toàn bộ trong một Transaction SQLite (BEGIN IMMEDIATE — không phải DEFERRED,
  để tránh race condition trên SQLite)
- Bước 1: Validate toàn bộ cartItems TRƯỚC khi insert bất kỳ dòng nào
  (gọi checkProductAvailability cho từng item type='RENT')
- Bước 2: Nếu BẤT KỲ item nào fail → ROLLBACK ngay, trả về lỗi kèm danh sách
  sản phẩm bị conflict: [{ productName, conflictReason }]
- Bước 3: Chỉ khi toàn bộ pass → INSERT orders, INSERT order_details
- Bước 4: COMMIT

TÍNH TOÁN TÀI CHÍNH (phải chính xác, có unit test):
  Với item type='BUY':
    unit_price    = product.price_sell
    subtotal      = unit_price × quantity
    deposit       = 0

  Với item type='RENT':
    total_days    = DATEDIFF(endDate, startDate) — tính theo ngày dương lịch
    unit_price    = product.price_rent_per_day
    subtotal      = unit_price × quantity × total_days
    deposit       = product.deposit_amount × quantity
    (Chú ý: deposit KHÔNG được cộng vào total_amount, lưu riêng)

  order.total_amount      = SUM(subtotal của tất cả items)
  order.total_deposit     = SUM(deposit của các items type='RENT')
  order.grand_total       = total_amount + total_deposit (số tiền khách cần chuẩn bị)

DEFENSIVE PROGRAMMING:
- Không được tin tưởng price từ FE — luôn lấy price từ DB
- Rate limiting: mỗi userId tối đa 5 đơn/phút (dùng in-memory hoặc Redis nếu có)
- Log đầy đủ: userId, timestamp, cartItems, kết quả (success/fail) vào file log

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHẦN C — CÁC API BỔ SUNG (cần thiết cho FE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Viết thêm các routes sau (logic đơn giản hơn nhưng cần đúng):
- GET  /api/products/:id          → chi tiết sản phẩm + tính availableQty cho ngày hôm nay
- GET  /api/products/:id/calendar → trả về mảng các ngày đã bị block trong 3 tháng tới
  (dùng để disable trên DatePicker ở FE, format: { blockedDates: ['2025-08-10', ...] })
- GET  /api/orders/:orderId        → chi tiết đơn hàng (chỉ cho user sở hữu đơn đó)
- GET  /api/orders/user/:userId    → lịch sử đơn hàng của user (phân trang, 10/trang)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YÊU CẦU VỀ CẤU TRÚC FILE OUTPUT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tổ chức code theo cấu trúc:
  /src
    /constants   → errorCodes.js
    /services    → availabilityService.js, orderService.js
    /routes      → products.js, orders.js
    /middleware  → validateRequest.js, authMiddleware.js
    /utils       → dateUtils.js (hàm tính ngày), responseHelper.js

Cung cấp: code đầy đủ + comment giải thích + ví dụ curl để test từng API.

CSDL SQLite của tôi:
[Dán SQL Schema tại đây]
```

---

## 🎨 GIAI ĐOẠN 2 — Giao Diện Khách Hàng (Frontend UX)

```
Bạn là Senior Frontend Engineer kiêm UX Designer, chuyên xây dựng giao diện
thương mại điện tử B2C với Conversion Rate Optimization.

Dự án: Trang web Cho thuê & Bán đồ chuyên dụng (thiết bị đắt tiền, chuyên nghiệp).
Stack bắt buộc: React 18 + Tailwind CSS v3 + React Hook Form + date-fns.
Backend API đã có (output của Giai đoạn 1, đính kèm bên dưới).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT 1: ProductDetailPage (trang chính)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Layout Desktop (2 cột): | Cột trái 60%: Gallery ảnh | Cột phải 40%: Configurator |
Layout Mobile: Stack dọc (Gallery → Specs → Configurator → CTA button sticky bottom)

Cột trái — Image Gallery:
- Ảnh chính lớn (aspect ratio 4:3)
- Thumbnail carousel bên dưới (click để đổi ảnh chính)
- Badge trạng thái: "Còn hàng" (xanh) / "Sắp hết" (vàng, khi availableQty ≤ 3) / "Hết hàng" (đỏ)

Cột phải — Live Configurator (đây là phần phức tạp nhất):

BƯỚC 1 — Chọn loại giao dịch:
  Toggle switch: [🛒 Mua đứt] [📅 Thuê theo ngày]
  Nếu sản phẩm chỉ có price_sell → ẩn option "Thuê"
  Nếu sản phẩm chỉ có price_rent → ẩn option "Mua"

BƯỚC 2 — Nếu chọn "Thuê", hiện DateRangePicker:
  - Dùng thư viện react-day-picker (nhẹ, customizable)
  - Disable: ngày trong quá khứ + ngày trong mảng blockedDates (gọi API /calendar)
  - Hiển thị loading skeleton khi đang fetch blockedDates
  - Sau khi chọn xong [startDate, endDate]:
    * Gọi API checkProductAvailability
    * Loading state: disable nút, hiện spinner nhỏ
    * Nếu conflict → highlight đỏ range đã chọn + hiện toast error cụ thể
    * Nếu available → hiện checkmark xanh + unlock BƯỚC 3

BƯỚC 3 — Chọn số lượng:
  - Input số với nút +/- (min=1, max=availableQty)
  - Nếu chưa chọn ngày (mode thuê) → disable, tooltip "Chọn ngày trước"

BƯỚC 4 — Bảng tính chi phí realtime (không cần API, tính ở FE):
  Hiển thị bảng nhỏ cập nhật ngay khi thay đổi bất kỳ input:
  ┌─────────────────────────────────────┐
  │ Số ngày thuê:          X ngày       │
  │ Đơn giá thuê/ngày:     X.000đ/ngày  │
  │ Tiền thuê:             X.000đ       │
  │ Tiền cọc (hoàn lại):   X.000đ       │
  │ ─────────────────────────────────── │
  │ Tổng cần chuẩn bị:     X.000đ       │
  └─────────────────────────────────────┘
  (Chú thích nhỏ: "Tiền cọc sẽ được hoàn trả sau khi trả thiết bị nguyên vẹn")

BƯỚC 5 — CTA Button:
  "Thêm vào giỏ hàng" — Primary button
  States: default | loading | disabled (khi conflict/chưa chọn đủ) | success (animation brief)
  Khi click thành công → hiện mini cart toast ở góc phải + giữ nguyên trang (không navigate)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT 2: CartDrawer (Giỏ hàng trượt ra từ phải)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hiển thị danh sách items trong giỏ, mỗi item gồm:
- Thumbnail + tên sản phẩm
- Label "Mua" hoặc "Thuê: 10/08 - 15/08 (5 ngày)"
- Tiền thuê + tiền cọc hiển thị riêng
- Nút xóa khỏi giỏ

Phần footer của drawer:
  Tổng tiền hàng:  X.000đ
  Tổng tiền cọc:   X.000đ
  ─────────────────────────
  Tổng cần thanh toán: X.000đ
  [Tiến hành đặt hàng →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT 3: CheckoutPage
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Form đặt hàng với React Hook Form + validation:
- Thông tin giao hàng (họ tên, SĐT, địa chỉ)
- Phương thức thanh toán: [Tiền mặt khi nhận] [Chuyển khoản]
- Order summary (readonly, hiển thị lại giỏ hàng)
- Nút "Xác nhận đặt hàng" → gọi API POST /api/orders
- Xử lý response:
  * Success → navigate /order-success/:orderId
  * Conflict error → hiện modal "Sản phẩm [X] đã bị đặt trước, vui lòng chọn ngày khác"
    với nút "Quay lại giỏ hàng" (không mất data giỏ hàng)
  * Network error → toast "Lỗi kết nối, vui lòng thử lại"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATE MANAGEMENT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dùng React Context + useReducer cho CartContext. KHÔNG dùng Redux (quá nặng cho đồ án).
Persist giỏ hàng vào localStorage (nhưng khi re-open phải re-validate với backend).
Custom hooks cần tạo:
  useProductAvailability(productId, startDate, endDate) — tự động debounce 500ms
  useCart() — CRUD cart, tính toán totals
  useDateBlocker(productId) — fetch và cache blockedDates

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YÊU CẦU CHẤT LƯỢNG CODE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Mỗi component tách file riêng, export named
- PropTypes hoặc TypeScript interface cho mọi props
- Accessibility: aria-label cho buttons, role="alert" cho error messages
- Không hardcode giá tiền — luôn dùng hàm formatCurrency(amount) → "1.500.000đ"
- Loading skeleton cho mọi data fetch (không dùng spinner toàn trang)
- Responsive: test breakpoints sm/md/lg

Backend API đã có:
[Dán output của Giai đoạn 1 tại đây]
```

---

## 📊 GIAI ĐOẠN 3 — Dashboard Quản Trị (Admin Panel)

```
Bạn là Full Stack Engineer chuyên xây dựng Admin Dashboard cho hệ thống
cho thuê tài sản. Nhiệm vụ: Xây dựng toàn bộ Admin Panel.

Stack: React 18 + Tailwind + Recharts (biểu đồ) / Backend đã có từ Giai đoạn 1.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHẦN A — ANALYTICS API (Backend)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Viết các API sau (phải dùng SQLite aggregation, không load toàn bộ data rồi tính ở JS):

1. GET /api/admin/dashboard/summary
   Trả về (tính từ DB):
   {
     revenue: {
       totalSell:     số,   // SUM(unit_price * qty) WHERE type='BUY' AND status='COMPLETED'
       totalRent:     số,   // SUM(unit_price * qty * days) WHERE type='RENT' AND status='COMPLETED'
       thisMonth:     số,   // tổng tháng hiện tại
       lastMonth:     số,   // tổng tháng trước
       growthPercent: số    // % tăng trưởng
     },
     deposits: {
       totalHolding:  số,   // SUM(deposit) WHERE status IN ('APPROVED','RENTING') — TIỀN ĐANG CẦM
       totalReturned: số,   // đã hoàn trả
       riskAmount:    số    // deposit của đơn RENTING quá hạn (endDate < hôm nay)
     },
     orders: {
       pending:   số,
       approved:  số,
       renting:   số,
       completed: số,
       cancelled: số
     },
     topRentedProducts: [  // top 5
       { productId, name, totalRentals, totalRevenue }
     ]
   }

2. GET /api/admin/dashboard/revenue-chart?period=7d|30d|12m
   Trả về dữ liệu theo ngày/tuần/tháng để vẽ biểu đồ đường:
   { labels: ['01/08', '02/08',...], sellData: [...], rentData: [...] }

3. GET /api/admin/dashboard/product-utilization
   Tỷ lệ sử dụng của từng sản phẩm (bao nhiêu ngày/tháng được thuê):
   [{ productId, name, totalDaysRented, utilizationRate: '72%' }]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHẦN B — QUẢN LÝ ĐƠN HÀNG (Order Management)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

API Backend:
- GET  /api/admin/orders?status=&search=&page=&limit=10  → danh sách, phân trang
- GET  /api/admin/orders/:id                              → chi tiết đơn + items
- PUT  /api/admin/orders/:id/status                       → đổi trạng thái (có validation)
- POST /api/admin/orders/:id/complete                     → hoàn tất + xử lý tiền cọc

WORKFLOW TRẠNG THÁI (State Machine — phải validate chặt, không cho skip):
  PENDING → APPROVED   (Admin xác nhận đơn, khách sắp đến lấy)
  APPROVED → RENTING   (Khách đã lấy đồ)
  RENTING → COMPLETED  (Khách trả đồ — xem PHẦN C)
  PENDING → CANCELLED  (Admin từ chối)
  APPROVED → CANCELLED (Admin hủy trước khi giao)

Nếu cố tình gọi API với transition không hợp lệ (ví dụ PENDING → COMPLETED)
→ trả về lỗi: { code: 'INVALID_STATUS_TRANSITION', message: '...' }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHẦN C — QUY TRÌNH HOÀN TẤT THUÊ (Return & Deposit Logic)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

API: POST /api/admin/orders/:id/complete
Body: {
  itemConditions: [
    { orderDetailId, condition: 'GOOD'|'DAMAGED'|'LOST', damageNote?, deductAmount? }
  ],
  returnDate: 'YYYY-MM-DD'  // có thể trả trễ hơn endDate
}

Logic xử lý:
1. Tính phí trả trễ nếu returnDate > endDate:
   lateFee = (returnDate - endDate) × price_rent_per_day × quantity

2. Với mỗi item:
   - GOOD:    hoàn đủ deposit
   - DAMAGED: hoàn (deposit - deductAmount), deductAmount do Admin nhập
   - LOST:    không hoàn deposit (deductAmount = toàn bộ deposit)

3. Tổng kết:
   totalDepositCollected = SUM(deposit của order)
   totalRefund           = SUM(deposit hoàn lại theo condition)
   totalDeduction        = totalDepositCollected - totalRefund
   extraCharge           = lateFee + SUM(deductAmount vượt quá deposit)

4. Lưu vào bảng deposit_transactions (tạo bảng này nếu chưa có trong schema)
5. Cập nhật order.status = 'COMPLETED', lưu returnDate, ghi note

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHẦN D — GIAO DIỆN ADMIN (React Frontend)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dashboard Overview Page:
- 4 KPI cards hàng ngang: Doanh thu tháng | Đơn đang thuê | Tiền cọc đang cầm | Đơn tồn đọng
- Biểu đồ đường doanh thu 30 ngày (Recharts LineChart, 2 đường: Bán + Thuê)
- Bảng Top 5 sản phẩm được thuê nhiều nhất
- Bảng "Đơn quá hạn" (RENTING mà endDate < hôm nay) — highlight đỏ, cần xử lý ngay

Order Management Page:
- Thanh tìm kiếm theo: mã đơn, tên khách, SĐT
- Filter tabs: Tất cả | Chờ duyệt | Đã duyệt | Đang thuê | Hoàn thành | Đã hủy
- Bảng với cột: Mã đơn | Khách hàng | Sản phẩm | Ngày thuê | Tổng tiền | Trạng thái | Hành động
- Nút hành động chỉ hiện transition hợp lệ (ví dụ PENDING chỉ hiện "Duyệt" và "Hủy")
- Modal xác nhận trước khi đổi trạng thái

Return Processing Modal (khi bấm "Hoàn tất thuê"):
- Danh sách từng sản phẩm trong đơn với dropdown: Tốt / Hư hỏng / Mất
- Nếu chọn "Hư hỏng": hiện input nhập số tiền khấu trừ + textarea ghi chú
- Input ngày trả thực tế (default = endDate, có thể sửa)
- Preview tự động: Tiền cọc hoàn | Khấu trừ | Phí trễ hạn | Tổng cần bổ sung
- Nút "Xác nhận hoàn tất" chỉ active khi đã chọn condition cho tất cả items

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YÊU CẦU BẢO MẬT ADMIN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Tất cả /api/admin/* routes phải qua middleware verifyAdminRole
- Middleware đọc JWT token, kiểm tra role === 'ADMIN'
- Admin chỉ thao tác được đơn hàng, không được xóa user hoặc sản phẩm (chỉ deactivate)
- Log mọi hành động admin: { adminId, action, targetId, oldValue, newValue, timestamp }
  vào bảng audit_logs

CSDL SQLite + Backend code từ Giai đoạn 1:
[Dán tại đây]
```

---

## 🔧 GIAI ĐOẠN 4 — QA Audit, Stress Test & Tối Ưu

```
Bạn là Chuyên gia Quality Assurance, Security Auditor và Database Performance Engineer
với kinh nghiệm audit hệ thống thương mại điện tử.

Tôi cung cấp toàn bộ code của dự án (đính kèm bên dưới).
Nhiệm vụ: Thực hiện audit toàn diện theo 5 chiều: Logic, Bảo mật, Hiệu năng,
Edge Cases, và UX Errors.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHIỀU 1 — LOGIC BUGS (Tìm lỗi nghiệp vụ)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1.1] Race Condition — Scenario cụ thể cần test:
  Giả sử chỉ còn 1 thiết bị, 2 user A và B cùng click "Đặt thuê" lúc 10:00:00.123
  - Code hiện tại có dùng "BEGIN IMMEDIATE" hay "BEGIN DEFERRED"?
  - SQLite chỉ có file-level lock. Phân tích: Liệu giải pháp này đủ không?
  - Đề xuất: cơ chế retry với exponential backoff nếu gặp SQLITE_BUSY
  - Viết code minh họa cách handle SQLITE_BUSY error đúng cách

[1.2] Deposit Calculation Bug — Test case cụ thể:
  Giỏ hàng: [Máy khoan (BUY, 2.000.000đ, qty=1), Máy cưa (RENT, 200.000đ/ngày, cọc 500.000đ, qty=2, 3 ngày)]
  Tính tay kết quả đúng:
    total_amount  = 2.000.000 + (200.000 × 2 × 3) = 3.200.000đ
    total_deposit = 500.000 × 2 = 1.000.000đ
    grand_total   = 4.200.000đ
  Chạy code hiện tại và so sánh. Nếu sai → tìm chính xác dòng code gây lỗi + fix.

[1.3] Date Boundary Bug:
  - Khách thuê từ 10/08 đến 10/08 (cùng ngày) → tính mấy ngày? Phải là 1 ngày.
  - Khách thuê từ 31/08 đến 01/09 → kiểm tra tính tháng có gây lỗi không?
  - Timezone: Server ở UTC+7, nhưng client gửi ISO string. Có bị lệch ngày không?

[1.4] Availability Overlap Logic:
  Viết test case tường minh cho hàm checkProductAvailability:
  - Đơn A: thuê ngày 10-15/08. Đơn B muốn thuê 15-20/08 (có overlap ngày 15?)
  - Đơn A: thuê 10-15/08. Đơn B muốn thuê 16-20/08 (không overlap, phải pass)
  - Đơn A: thuê 10-20/08. Đơn B muốn thuê 12-18/08 (nằm trong, phải block)
  Chạy với SQL query hiện tại và xác nhận điều kiện overlap đã đúng chưa.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHIỀU 2 — SECURITY VULNERABILITIES (Lỗ hổng bảo mật)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[2.1] SQL Injection:
  - Kiểm tra tất cả câu query trong project có dùng parameterized query chưa
  - Đặc biệt: API search /api/admin/orders?search=... nếu dùng string concatenation là lỗ hổng
  - Ví dụ attack: search=" OR 1=1 --
  - Liệt kê mọi chỗ cần fix + cung cấp code đã fix

[2.2] Unauthorized Access:
  - User A có thể xem/hủy đơn của User B không? (IDOR — Insecure Direct Object Reference)
  - Test: GET /api/orders/999 với JWT của user không sở hữu đơn 999
  - Admin middleware có thực sự kiểm tra role từ DB không, hay chỉ tin JWT?
  - Giải pháp: luôn WHERE user_id = :currentUserId trong mọi query liên quan đến đơn hàng

[2.3] Input Validation & Injection:
  - FE gửi quantity=-1 hoặc quantity=99999 → BE xử lý thế nào?
  - FE gửi startDate="'; DROP TABLE orders;--" → có bị qua không?
  - FE gửi price tự định nghĩa trong body → BE có bị dùng không?
  - Kiểm tra xem Zod/Pydantic validation có được gọi TRƯỚC khi chạm DB không?

[2.4] JWT & Authentication:
  - JWT secret có được đặt trong .env không hay hardcode trong code?
  - Token expiry có được set không? (Khuyến nghị: access 15p, refresh 7 ngày)
  - Có blacklist token khi logout không (với SQLite: lưu invalidated tokens)?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHIỀU 3 — PERFORMANCE (Hiệu năng SQLite)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[3.1] Index Audit:
  Chạy lệnh EXPLAIN QUERY PLAN cho các query sau và phân tích output:
  - Query checkProductAvailability (quan trọng nhất, chạy nhiều nhất)
  - Query lấy danh sách đơn hàng của user
  - Query tính doanh thu dashboard
  
  Liệt kê các Index nên tạo thêm:
  - CREATE INDEX idx_order_details_product_date ON order_details(product_id, start_date, end_date)
  - Những index khác mà bạn thấy cần thiết sau khi phân tích

[3.2] N+1 Query Problem:
  - API GET /api/admin/orders nếu lấy 50 đơn, rồi loop để lấy items của mỗi đơn → 51 queries!
  - Kiểm tra xem code hiện tại có mắc N+1 không?
  - Fix bằng JOIN hoặc sub-query để về 1 query duy nhất

[3.3] Dashboard Query Optimization:
  - Câu query tính tổng doanh thu nếu không có index sẽ scan toàn bảng
  - Đề xuất: Cân nhắc Materialized View hoặc cached aggregation (lưu vào bảng daily_stats)
  - Với SQLite, mô tả cách implement "incremental aggregation" đơn giản

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHIỀU 4 — EDGE CASES (Trường hợp biên)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[4.1] Business Edge Cases:
  - Khách đặt đơn PENDING, Admin chưa duyệt, nhưng thời gian thuê đã qua → xử lý thế nào?
  - Sản phẩm bị admin deactivate trong khi có đơn RENTING đang dùng → có ảnh hưởng không?
  - Khách đặt 5 thiết bị, trong khoảng thuê trùng với 5 thiết bị khác (đúng bằng stock) → pass hay block?
  - Admin thay đổi giá sản phẩm trong khi đơn hàng đang RENTING → unit_price trong order_details có bị thay đổi không? (Không được thay đổi — phải snapshot giá lúc đặt)

[4.2] Concurrency Edge Cases (SQLite specific):
  - SQLite chỉ cho phép 1 writer tại một thời điểm. Nếu traffic cao (nhiều user cùng đặt), sẽ có nhiều SQLITE_BUSY. Code có retry không?
  - Cấu hình WAL mode (Write-Ahead Logging) cho SQLite — giải thích lợi ích và cách bật:
    PRAGMA journal_mode=WAL; (cho phép đọc đồng thời trong khi ghi)

[4.3] Data Integrity:
  - Nếu server crash ngay sau INSERT orders nhưng trước INSERT order_details → có partial data không?
  - Confirm: Transaction đảm bảo atomic ở cả 2 INSERT chứ?
  - Foreign key constraints có được bật chưa? (SQLite mặc định tắt)
    PRAGMA foreign_keys = ON; — kiểm tra xem code có bật chưa?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHIỀU 5 — UX ERRORS (Lỗi trải nghiệm người dùng)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[5.1] Error Messages:
  - Kiểm tra: Khi API trả lỗi 500, FE có hiển thị raw error stack không? (Không được)
  - Mọi lỗi BE phải có message thân thiện bằng tiếng Việt
  - Lỗi validation phải chỉ rõ field nào sai: "Vui lòng chọn ngày kết thúc" thay vì "Invalid input"

[5.2] Loading & Timeout:
  - API checkProductAvailability nếu chạy 5 giây → FE có timeout sau 10 giây không?
  - Có abort previous request khi user thay đổi ngày liên tục không (dùng AbortController)?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT OUTPUT YÊU CẦU:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Với MỖI vấn đề tìm thấy, cung cấp theo format:
┌─────────────────────────────────────────────
│ 🔴 LỖI: [Tên lỗi]
│ 📍 Vị trí: [File, dòng số]
│ 💀 Hậu quả: [Điều gì xảy ra nếu không fix]
│ ✅ Fix: [Code đã sửa]
│ 🧪 Test: [Cách verify fix đã hoạt động]
└─────────────────────────────────────────────

Cuối cùng, tạo bảng tổng kết:
| Vấn đề | Mức độ nghiêm trọng | Đã fix? |
với mức độ: 🔴 Critical / 🟡 Medium / 🟢 Low

Code toàn bộ dự án:
[Dán tại đây]
```

---

## 📋 Checklist Sử Dụng

> 🗄️ **Database:** SQLite — dùng `better-sqlite3` (Node.js) hoặc `sqlite3` (Python).
> Nhớ bật 2 PRAGMA sau ngay khi khởi động app, trước mọi thao tác DB:
> ```sql
> PRAGMA foreign_keys = ON;   -- bật ràng buộc khóa ngoại (SQLite tắt mặc định)
> PRAGMA journal_mode = WAL;  -- cho phép đọc đồng thời, tăng hiệu năng
> ```

| Bước | Giai đoạn | Input cần chuẩn bị | Output nhận được |
|------|-----------|-------------------|-----------------|
| 1 | Architecture | SQLite Schema (file .sql hoặc .db) | Service Layer code + API routes |
| 2 | Frontend UI | Output GĐ1 + SQLite Schema | React components hoàn chỉnh |
| 3 | Admin Panel | Output GĐ1 + GĐ2 + SQLite Schema | Dashboard + analytics |
| 4 | QA Audit | Toàn bộ code GĐ1→3 + SQLite Schema | Bug report + fixes |

> **Lưu ý quan trọng:** Mỗi giai đoạn nhớ kèm theo **SQLite Schema**. Giai đoạn 2, 3, 4
> cần dán thêm output của giai đoạn trước để AI có đủ context.
>
> **Với SQLite cần lưu ý thêm:**
> - Không dùng `BEGIN DEFERRED` — dùng `BEGIN IMMEDIATE` để tránh race condition
> - Khi gặp lỗi `SQLITE_BUSY`, retry tối đa 3 lần với delay 100ms
> - File `.db` không commit lên Git — thêm vào `.gitignore`
