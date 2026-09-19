const demoProductImages = [
  {
    productId: 1,
    images: [
      '/images/bosch-gbh226.png',
      '/images/bosch-gbh226-angle.png',
      '/images/bosch-gbh226-color.png',
    ],
  },
  {
    productId: 2,
    images: [
      '/images/makita-4100nh.png',
      '/images/makita-4100nh-angle.png',
      '/images/makita-4100nh-color.png',
    ],
  },
  {
    productId: 3,
    images: [
      '/images/concrete-mixer-350.png',
      '/images/concrete-mixer-350-angle.png',
      '/images/concrete-mixer-350-color.png',
    ],
  },
  {
    productId: 4,
    images: [
      '/images/ao-phan-quang-bao-ho.png',
      '/images/ao-phan-quang-bao-ho-angle.png',
      '/images/ao-phan-quang-bao-ho-color.png',
    ],
  },
  {
    productId: 5,
    images: [
      '/images/quan-ao-bao-ho.png',
      '/images/quan-ao-bao-ho-angle.png',
      '/images/quan-ao-bao-ho-color.png',
    ],
  },
  {
    productId: 6,
    images: [
      '/images/giay-bao-ho.png',
      '/images/giay-bao-ho-angle.png',
      '/images/giay-bao-ho-color.png',
    ],
  },
  {
    productId: 7,
    images: [
      '/images/sony-a7iii.png',
      '/images/sony-a7iii-angle.png',
      '/images/sony-a7iii-color.png',
    ],
  },
  {
    productId: 8,
    images: [
      '/images/dji-ronin-rs3.png',
      '/images/dji-ronin-rs3-angle.png',
      '/images/dji-ronin-rs3-color.png',
    ],
  },
  {
    productId: 9,
    images: [
      '/images/dji-mavic3-pro.png',
      '/images/dji-mavic3-pro-angle.png',
      '/images/dji-mavic3-pro-color.png',
    ],
  },
  {
    productId: 10,
    images: [
      '/images/godox-sl150w.png',
      '/images/godox-sl150w-angle.png',
      '/images/godox-sl150w-color.png',
    ],
  },
];

function syncDemoMedia(db) {
  const productExists = db.prepare('SELECT id FROM products WHERE id = ?');
  const deleteImages = db.prepare('DELETE FROM product_images WHERE product_id = ?');
  const insertImage = db.prepare(`
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (?, ?, ?, ?)
  `);
  const updatePrimary = db.prepare(`
    UPDATE products
    SET image_url = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `);

  const run = db.transaction(() => {
    demoProductImages.forEach((product) => {
      if (!productExists.get(product.productId)) return;

      deleteImages.run(product.productId);
      product.images.forEach((imageUrl, index) => {
        insertImage.run(product.productId, imageUrl, index === 0 ? 1 : 0, index);
      });
      updatePrimary.run(product.images[0], product.productId);
    });
  });

  run();
  return demoProductImages.length;
}

module.exports = { demoProductImages, syncDemoMedia };
