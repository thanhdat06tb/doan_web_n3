const Database = require('better-sqlite3');

const db = new Database('./database/Web_doan.db');

const categories = [
  {
    id: 1,
    name: 'Thiết bị xây dựng',
    description: 'Máy khoan, máy cắt, máy trộn bê tông và thiết bị phục vụ công trình xây dựng.',
  },
  {
    id: 2,
    name: 'Quần áo bảo hộ',
    description: 'Áo phản quang, bộ quần áo bảo hộ và trang phục an toàn cho công trình.',
  },
  {
    id: 3,
    name: 'Giày dép chuyên dụng',
    description: 'Giày bảo hộ, ủng và giày chống trượt dùng cho lao động, công trình.',
  },
  {
    id: 4,
    name: 'Thiết bị quay phim',
    description: 'Camera, gimbal, drone và đèn studio phục vụ quay phim chuyên nghiệp.',
  },
];

const products = [
  {
    id: 4,
    categoryId: 2,
    name: 'Áo phản quang bảo hộ công trình',
    description: 'Áo phản quang màu nổi, vải thoáng nhẹ, có dải phản sáng rõ trong môi trường thiếu sáng.',
    priceSell: 180000,
    priceRent: 20000,
    deposit: 100000,
    stock: 30,
    image: '/images/ao-phan-quang-bao-ho.png',
  },
  {
    id: 5,
    categoryId: 2,
    name: 'Bộ quần áo bảo hộ lao động',
    description: 'Bộ áo quần bảo hộ dài tay kèm nón và găng, phù hợp công trình xây dựng và xưởng sản xuất.',
    priceSell: 450000,
    priceRent: 50000,
    deposit: 200000,
    stock: 20,
    image: '/images/quan-ao-bao-ho.png',
  },
  {
    id: 6,
    categoryId: 3,
    name: 'Giày bảo hộ mũi thép chống trượt',
    description: 'Giày bảo hộ cổ thấp, mũi thép, đế chống trượt và chống đinh cho môi trường công trình.',
    priceSell: 650000,
    priceRent: 70000,
    deposit: 300000,
    stock: 18,
    image: '/images/giay-bao-ho.png',
  },
];

const filmingProductIds = [7, 8, 9, 10];

const upsertCategory = db.prepare(`
  INSERT INTO categories (id, name, description)
  VALUES (@id, @name, @description)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    description = excluded.description
`);

const updateProduct = db.prepare(`
  UPDATE products
  SET
    category_id = @categoryId,
    name = @name,
    description = @description,
    price_sell = @priceSell,
    price_rent_per_day = @priceRent,
    deposit_amount = @deposit,
    stock_quantity = @stock,
    image_url = @image
  WHERE id = @id
`);

const updateFilmingCategory = db.prepare(`
  UPDATE products SET category_id = 4 WHERE id = ?
`);

const deleteImages = db.prepare(`
  DELETE FROM product_images WHERE product_id IN (4, 5, 6)
`);

const insertImage = db.prepare(`
  INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
  VALUES (?, ?, 1, 0)
`);

const updateOrder = db.prepare(`
  UPDATE orders
  SET total_amount = ?, total_deposit = ?, grand_total = ?, note = ?
  WHERE id = ?
`);

const updateOrderDetail = db.prepare(`
  UPDATE order_details
  SET unit_price = ?, subtotal = ?, deposit_amount = ?
  WHERE order_id = ? AND product_id = ?
`);

const getDetailsWithProducts = db.prepare(`
  SELECT
    od.id,
    od.order_id,
    od.type,
    od.quantity,
    od.total_days,
    p.price_sell,
    p.price_rent_per_day,
    p.deposit_amount AS product_deposit
  FROM order_details od
  JOIN products p ON p.id = od.product_id
`);

const updateDetailTotals = db.prepare(`
  UPDATE order_details
  SET unit_price = ?, subtotal = ?, deposit_amount = ?
  WHERE id = ?
`);

const getOrderIds = db.prepare(`
  SELECT DISTINCT order_id FROM order_details
`);

const getOrderTotals = db.prepare(`
  SELECT
    COALESCE(SUM(subtotal), 0) AS total_amount,
    COALESCE(SUM(deposit_amount), 0) AS total_deposit
  FROM order_details
  WHERE order_id = ?
`);

const updateOrderTotals = db.prepare(`
  UPDATE orders
  SET total_amount = ?, total_deposit = ?, grand_total = ?
  WHERE id = ?
`);

const transaction = db.transaction(() => {
  categories.forEach((category) => upsertCategory.run(category));
  products.forEach((product) => updateProduct.run(product));
  filmingProductIds.forEach((id) => updateFilmingCategory.run(id));

  deleteImages.run();
  products.forEach((product) => insertImage.run(product.id, product.image));

  updateOrder.run(60000, 100000, 160000, 'Thuê áo phản quang cho công trình', 2);
  updateOrderDetail.run(20000, 60000, 100000, 2, 4);

  updateOrder.run(900000, 200000, 1100000, 'Trang bị bảo hộ cho đội thi công', 4);
  updateOrderDetail.run(650000, 650000, 0, 4, 6);
  updateOrderDetail.run(50000, 250000, 200000, 4, 5);

  getDetailsWithProducts.all().forEach((detail) => {
    const quantity = Number(detail.quantity || 0);
    const days = Number(detail.total_days || 0);
    const isRent = detail.type === 'RENT';
    const unitPrice = isRent ? detail.price_rent_per_day : detail.price_sell;
    const subtotal = isRent ? unitPrice * quantity * days : unitPrice * quantity;
    const depositAmount = isRent ? detail.product_deposit * quantity : 0;

    updateDetailTotals.run(unitPrice, subtotal, depositAmount, detail.id);
  });

  getOrderIds.all().forEach(({ order_id }) => {
    const totals = getOrderTotals.get(order_id);
    const totalAmount = Number(totals.total_amount || 0);
    const totalDeposit = Number(totals.total_deposit || 0);
    updateOrderTotals.run(totalAmount, totalDeposit, totalAmount + totalDeposit, order_id);
  });
});

transaction();

console.log('Đã đồng bộ danh mục và sản phẩm demo thành 4 nhóm rõ ràng.');
db.close();
