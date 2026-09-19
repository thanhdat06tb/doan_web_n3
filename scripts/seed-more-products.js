require('dotenv').config();

const { getDatabase, closeDatabase } = require('../src/database/connection');

const imageSets = {
  construction: [
    '/images/bosch-gbh226.png',
    '/images/bosch-gbh226-angle.png',
    '/images/bosch-gbh226-color.png',
  ],
  cutter: [
    '/images/makita-4100nh.png',
    '/images/makita-4100nh-angle.png',
    '/images/makita-4100nh-color.png',
  ],
  mixer: [
    '/images/concrete-mixer-350.png',
    '/images/concrete-mixer-350-angle.png',
    '/images/concrete-mixer-350-color.png',
  ],
  vest: [
    '/images/ao-phan-quang-bao-ho.png',
    '/images/ao-phan-quang-bao-ho-angle.png',
    '/images/ao-phan-quang-bao-ho-color.png',
  ],
  suit: [
    '/images/quan-ao-bao-ho.png',
    '/images/quan-ao-bao-ho-angle.png',
    '/images/quan-ao-bao-ho-color.png',
  ],
  shoes: [
    '/images/giay-bao-ho.png',
    '/images/giay-bao-ho-angle.png',
    '/images/giay-bao-ho-color.png',
  ],
  camera: [
    '/images/sony-a7iii.png',
    '/images/sony-a7iii-angle.png',
    '/images/sony-a7iii-color.png',
  ],
  drone: [
    '/images/dji-mavic3-pro.png',
    '/images/dji-mavic3-pro-angle.png',
    '/images/dji-mavic3-pro-color.png',
  ],
  gimbal: [
    '/images/dji-ronin-rs3.png',
    '/images/dji-ronin-rs3-angle.png',
    '/images/dji-ronin-rs3-color.png',
  ],
  light: [
    '/images/godox-sl150w.png',
    '/images/godox-sl150w-angle.png',
    '/images/godox-sl150w-color.png',
  ],
};

const products = [
  {
    category: 'Thiết bị xây dựng',
    imageKey: 'construction',
    name: 'Máy đục bê tông Bosch GSH 500',
    description: 'Máy đục bê tông công suất lớn, phù hợp phá lớp bê tông mỏng, đục tường, tạo rãnh kỹ thuật và sửa chữa công trình dân dụng. Máy đi kèm mũi đục nhọn, mũi đục dẹt và vali bảo quản.',
    priceSell: 5200000,
    priceRent: 180000,
    deposit: 1200000,
    stock: 4,
  },
  {
    category: 'Thiết bị xây dựng',
    imageKey: 'cutter',
    name: 'Máy mài góc Makita GA9020 2200W',
    description: 'Máy mài góc dùng cho cắt sắt, mài bavia, xử lý bề mặt kim loại và đá. Thân máy chắc, tay cầm phụ chống rung, phù hợp đội thi công cơ khí và công trình.',
    priceSell: 2800000,
    priceRent: 90000,
    deposit: 600000,
    stock: 6,
  },
  {
    category: 'Thiết bị xây dựng',
    imageKey: 'mixer',
    name: 'Máy đầm dùi bê tông Honda GX160',
    description: 'Thiết bị đầm bê tông giúp loại bỏ bọt khí, tăng độ chắc cho sàn, cột và móng. Dây dùi dài, động cơ khỏe, phù hợp công trình vừa và nhỏ.',
    priceSell: 0,
    priceRent: 240000,
    deposit: 1800000,
    stock: 3,
  },
  {
    category: 'Thiết bị xây dựng',
    imageKey: 'construction',
    name: 'Máy khoan rút lõi bê tông DCA AZZ130',
    description: 'Máy khoan rút lõi chuyên dùng cho lắp đặt ống nước, điện lạnh, cứu hỏa và hệ thống kỹ thuật. Cho đường khoan gọn, ít rung, hỗ trợ làm việc trên tường và sàn.',
    priceSell: 6800000,
    priceRent: 260000,
    deposit: 2000000,
    stock: 2,
  },
  {
    category: 'Thiết bị xây dựng',
    imageKey: 'mixer',
    name: 'Máy cắt gạch bàn 1200mm',
    description: 'Bàn cắt gạch khổ lớn dùng cho gạch porcelain, gạch lát nền và đá mỏng. Đường cắt thẳng, ít mẻ cạnh, phù hợp thợ ốp lát chuyên nghiệp.',
    priceSell: 3900000,
    priceRent: 140000,
    deposit: 900000,
    stock: 5,
  },
  {
    category: 'Thiết bị xây dựng',
    imageKey: 'cutter',
    name: 'Máy hàn que Hồng Ký HK200A',
    description: 'Máy hàn inverter nhỏ gọn cho sửa chữa khung sắt, lan can, mái che và kết cấu nhẹ. Dễ vận chuyển, hồ quang ổn định, dùng tốt tại công trình.',
    priceSell: 2500000,
    priceRent: 100000,
    deposit: 700000,
    stock: 6,
  },
  {
    category: 'Quần áo bảo hộ',
    imageKey: 'vest',
    name: 'Áo phản quang lưới 2 sọc cao cấp',
    description: 'Áo lưới thoáng khí, phản quang tốt khi làm đêm, phù hợp đội giám sát, kho bãi, giao nhận và công trình đường bộ. Có nhiều size để cấp phát nhanh.',
    priceSell: 95000,
    priceRent: 12000,
    deposit: 50000,
    stock: 60,
  },
  {
    category: 'Quần áo bảo hộ',
    imageKey: 'suit',
    name: 'Bộ bảo hộ kaki túi hộp màu ghi',
    description: 'Bộ quần áo bảo hộ vải kaki dày vừa, form thoải mái, nhiều túi dụng cụ, thích hợp kỹ thuật viên bảo trì, cơ điện và công nhân xưởng.',
    priceSell: 380000,
    priceRent: 45000,
    deposit: 150000,
    stock: 28,
  },
  {
    category: 'Quần áo bảo hộ',
    imageKey: 'suit',
    name: 'Bộ bảo hộ chống bụi công trình',
    description: 'Trang phục dài tay hạn chế bụi xi măng, sơn và mạt cắt bám vào da. Dễ vệ sinh, dùng cho thi công nội thất, sơn sửa và công trình thô.',
    priceSell: 420000,
    priceRent: 55000,
    deposit: 180000,
    stock: 22,
  },
  {
    category: 'Quần áo bảo hộ',
    imageKey: 'vest',
    name: 'Áo khoác bảo hộ phản quang mùa mưa',
    description: 'Áo khoác chống nước nhẹ, có dải phản quang trước sau, phù hợp công trình ngoài trời, đội giao nhận thiết bị và nhân sự trực đêm.',
    priceSell: 520000,
    priceRent: 70000,
    deposit: 220000,
    stock: 18,
  },
  {
    category: 'Quần áo bảo hộ',
    imageKey: 'suit',
    name: 'Bộ bảo hộ kỹ sư có phản quang',
    description: 'Bộ đồng phục kỹ sư thiết kế gọn, màu dễ nhận diện, có phản quang ở tay và chân. Phù hợp giám sát công trình, nghiệm thu và khảo sát hiện trường.',
    priceSell: 560000,
    priceRent: 65000,
    deposit: 240000,
    stock: 16,
  },
  {
    category: 'Quần áo bảo hộ',
    imageKey: 'vest',
    name: 'Áo ghi lê công trình nhiều túi',
    description: 'Ghi lê bảo hộ có nhiều ngăn đựng thước, bút, bộ đàm và thẻ công trường. Chất vải bền, mặc ngoài áo thun hoặc đồng phục đều gọn.',
    priceSell: 210000,
    priceRent: 25000,
    deposit: 90000,
    stock: 36,
  },
  {
    category: 'Giày dép chuyên dụng',
    imageKey: 'shoes',
    name: 'Giày bảo hộ Jogger Bestboy S3',
    description: 'Giày bảo hộ cổ thấp có mũi thép, đế chống đâm xuyên và chống trượt. Phù hợp công nhân kho, cơ khí, lắp đặt và di chuyển nhiều.',
    priceSell: 720000,
    priceRent: 80000,
    deposit: 320000,
    stock: 20,
  },
  {
    category: 'Giày dép chuyên dụng',
    imageKey: 'shoes',
    name: 'Giày bảo hộ cổ cao chống trượt',
    description: 'Thiết kế cổ cao bảo vệ mắt cá, đế bám tốt trên nền ẩm, mũi chống va đập. Dùng tốt cho công trình, hầm, xưởng và khu vực nhiều vật sắc.',
    priceSell: 850000,
    priceRent: 95000,
    deposit: 380000,
    stock: 16,
  },
  {
    category: 'Giày dép chuyên dụng',
    imageKey: 'shoes',
    name: 'Ủng bảo hộ PVC chống nước',
    description: 'Ủng PVC cao cổ chống nước, dễ vệ sinh, phù hợp thi công nền ướt, vệ sinh công nghiệp, nông trại và khu vực có bùn đất.',
    priceSell: 260000,
    priceRent: 35000,
    deposit: 120000,
    stock: 30,
  },
  {
    category: 'Giày dép chuyên dụng',
    imageKey: 'shoes',
    name: 'Giày bảo hộ siêu nhẹ mũi composite',
    description: 'Mũi composite nhẹ hơn thép, giảm mỏi khi đi cả ngày. Đế chống trượt, kiểu dáng gọn, phù hợp kỹ thuật viên và nhân sự vận hành.',
    priceSell: 980000,
    priceRent: 110000,
    deposit: 420000,
    stock: 14,
  },
  {
    category: 'Giày dép chuyên dụng',
    imageKey: 'shoes',
    name: 'Giày chống tĩnh điện cho xưởng điện tử',
    description: 'Giày chuyên dụng cho môi trường cần kiểm soát tĩnh điện, đế mềm, dễ di chuyển, phù hợp phòng kỹ thuật, kho linh kiện và dây chuyền lắp ráp.',
    priceSell: 620000,
    priceRent: 70000,
    deposit: 280000,
    stock: 18,
  },
  {
    category: 'Giày dép chuyên dụng',
    imageKey: 'shoes',
    name: 'Dép bảo hộ chống trượt khu vực ẩm',
    description: 'Dép bảo hộ đế bám tốt, thoát nước nhanh, dùng cho khu vực rửa thiết bị, kho lạnh, khu hậu cần sự kiện và xưởng có nền ướt.',
    priceSell: 190000,
    priceRent: 25000,
    deposit: 80000,
    stock: 35,
  },
  {
    category: 'Thiết bị quay phim',
    imageKey: 'camera',
    name: 'Canon EOS R6 Mark II + Lens 24-105mm',
    description: 'Bộ máy mirrorless full-frame cho quay sự kiện, phỏng vấn và sản xuất nội dung. Lấy nét nhanh, chống rung tốt, giao kèm pin, sạc và thẻ nhớ.',
    priceSell: 62000000,
    priceRent: 1500000,
    deposit: 12000000,
    stock: 2,
  },
  {
    category: 'Thiết bị quay phim',
    imageKey: 'camera',
    name: 'Ống kính Sony FE 70-200mm F4 G',
    description: 'Ống kính tele cho quay sân khấu, hội nghị, thể thao và chân dung. Hình ảnh sắc nét, chống rung quang học, phù hợp máy Sony E-mount.',
    priceSell: 32000000,
    priceRent: 750000,
    deposit: 6000000,
    stock: 3,
  },
  {
    category: 'Thiết bị quay phim',
    imageKey: 'light',
    name: 'Bộ đèn livestream Godox SL60W + softbox',
    description: 'Bộ đèn ánh sáng liên tục cho livestream, phỏng vấn và chụp sản phẩm. Ánh sáng mềm, dễ set up, gồm chân đèn, softbox và dây nguồn.',
    priceSell: 4200000,
    priceRent: 220000,
    deposit: 1200000,
    stock: 5,
  },
  {
    category: 'Thiết bị quay phim',
    imageKey: 'gimbal',
    name: 'Gimbal DJI RS4 Mini cho máy ảnh',
    description: 'Gimbal gọn nhẹ hỗ trợ quay cầm tay mượt hơn, phù hợp travel vlog, TikTok, sự kiện nhỏ và quay hậu trường. Dễ cân bằng và vận hành.',
    priceSell: 9800000,
    priceRent: 380000,
    deposit: 2500000,
    stock: 4,
  },
  {
    category: 'Thiết bị quay phim',
    imageKey: 'drone',
    name: 'DJI Mini 4 Pro Fly More Combo',
    description: 'Drone nhỏ gọn quay 4K, bay linh hoạt trong không gian ngoài trời, phù hợp khảo sát địa điểm, quay sự kiện và video marketing.',
    priceSell: 24500000,
    priceRent: 900000,
    deposit: 7000000,
    stock: 3,
  },
  {
    category: 'Thiết bị quay phim',
    imageKey: 'light',
    name: 'Máy phun khói sân khấu 1500W',
    description: 'Máy tạo khói cho sân khấu, chụp ảnh sản phẩm, quay MV và sự kiện. Làm nổi hiệu ứng ánh sáng, có điều khiển dây và bình dung dịch.',
    priceSell: 3600000,
    priceRent: 180000,
    deposit: 1000000,
    stock: 4,
  },
];

function seedMoreProducts() {
  const db = getDatabase();

  const findCategory = db.prepare('SELECT id FROM categories WHERE name = ?');
  const findProduct = db.prepare('SELECT id FROM products WHERE name = ?');
  const insertProduct = db.prepare(`
    INSERT INTO products (
      category_id, name, description, price_sell, price_rent_per_day,
      deposit_amount, stock_quantity, image_url, is_active
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  const updateProduct = db.prepare(`
    UPDATE products
    SET category_id = ?,
        description = ?,
        price_sell = ?,
        price_rent_per_day = ?,
        deposit_amount = ?,
        stock_quantity = ?,
        image_url = ?,
        is_active = 1,
        updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `);
  const deleteImages = db.prepare('DELETE FROM product_images WHERE product_id = ?');
  const insertImage = db.prepare(`
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (?, ?, ?, ?)
  `);

  const run = db.transaction(() => {
    let inserted = 0;
    let updated = 0;

    products.forEach((product) => {
      const category = findCategory.get(product.category);
      if (!category) throw new Error(`Missing category: ${product.category}`);

      const images = imageSets[product.imageKey];
      const existing = findProduct.get(product.name);
      let productId;

      if (existing) {
        productId = existing.id;
        updateProduct.run(
          category.id,
          product.description,
          product.priceSell,
          product.priceRent,
          product.deposit,
          product.stock,
          images[0],
          productId,
        );
        updated += 1;
      } else {
        const result = insertProduct.run(
          category.id,
          product.name,
          product.description,
          product.priceSell,
          product.priceRent,
          product.deposit,
          product.stock,
          images[0],
        );
        productId = result.lastInsertRowid;
        inserted += 1;
      }

      deleteImages.run(productId);
      images.forEach((imageUrl, index) => {
        insertImage.run(productId, imageUrl, index === 0 ? 1 : 0, index);
      });
    });

    return { inserted, updated };
  });

  try {
    const result = run();
    const stats = db.prepare(`
      SELECT c.name, COUNT(p.id) AS total
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
      GROUP BY c.id
      ORDER BY c.id
    `).all();

    console.log(`Seed completed: ${result.inserted} inserted, ${result.updated} updated.`);
    console.table(stats);
  } finally {
    closeDatabase();
  }
}

seedMoreProducts();
require('./rebalance-deposits');
