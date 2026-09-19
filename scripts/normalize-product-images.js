require('dotenv').config();

const { getDatabase, closeDatabase } = require('../src/database/connection');

const normalizedImages = [
  {
    name: 'Bosch GSH 500 Professional - Máy đục bê tông 1100W',
    images: [
      'https://www.bansoonhardware.com.sg/5760-superlarge_default/bosch-gsh-500-professional-demolition-hammer-breaker-with-hex.jpg',
      'https://images.tcdn.com.br/img/img_prod/1090846/martelete_rompedor_bosch_gsh_500_1100w_127v_com_cinzel_e_maleta_27916_2_37fd147676c4d30ef8cbeedd7dcb2c1d.jpg',
    ],
  },
  {
    name: 'Makita GA9020 - Máy mài góc 230mm 2200W',
    images: [
      'https://images.tcdn.com.br/img/img_prod/1205188/esmerilhadeira_angular_makita_ga9020_230mm_220v_2200w_5143_2_e2c1c2f33e7a47cd588925b8b816fded.jpg',
    ],
  },
  {
    name: 'Total TCVLI202301 - Máy đầm dùi bê tông pin 20V',
    images: [
      'https://herramientastotal.cl/cdn/shop/files/TCVLI202301_2079x2079.jpg?v=1713968047',
    ],
  },
  {
    name: 'DCA AZZ03-130 - Máy khoan rút lõi bê tông 130mm',
    images: [
      'https://cdn.vseinstrumenti.ru/images/goods/stroitelnoe-oborudovanie-i-tehnika/oborudovanie-dlya-betonnyh-rabot/15186916/1000x1000/191370396.jpg',
      'https://toolssavvy.ph/cdn/shop/files/azz02-130-dca.jpg?v=1769843379',
    ],
  },
  {
    name: 'Bosch GBH 2-28 F Professional - Máy khoan búa SDS plus',
    images: [
      'https://www.prosco.eu/cdn/shop/products/0611267601.jpg?v=1660908666',
    ],
  },
  {
    name: 'Stanley STHR1232K - Máy khoan búa SDS 1250W',
    images: [
      'https://tauber.com.mx/storage/2022/February/week4/973729_s9_hr1232k_b3-5.jpg',
      'https://arcencohogareasy.vtexassets.com/arquivos/ids/326901/1132150.jpg?v=637944586102130000',
    ],
  },
  {
    name: 'Áo phản quang 3M vàng chanh',
    images: [
      'https://www.safe-t-cut-cm.com/uploads/1116/shop/201607/201607-29-181610_po-0.jpg',
    ],
  },
  {
    name: 'Delta Plus M2VE3 Mach2 - Áo khoác bảo hộ kỹ thuật',
    images: [
      'https://media.deltaplus.eu/m/25d8f70ecb37065c/Liferay_Product_Zoom-M2VE3-GO-eps.png',
    ],
  },
  {
    name: 'Delta Plus M2GI3 Mach2 - Áo ghi lê nhiều túi',
    images: [
      'https://tigersafety.co.uk/images/pictures/temp/delta-plus/delta-plus-m2gi3-mach-2-mens-multi-pocket-work-%28gallery%29.jpg?v=3d133632',
    ],
  },
  {
    name: 'Honeywell Miller H500 - Dây đai an toàn toàn thân',
    images: [
      'https://www.tenaquip.com/images/xlarge/s/sgv764b.jpg',
    ],
  },
  {
    name: 'Delta Plus Panoply Mach2 - Áo khoác công nhân xanh navy',
    images: [
      'https://i.ebayimg.com/images/g/PWYAAOSw~atcGTbG/s-l1600.jpg',
    ],
  },
  {
    name: 'Áo phản quang công trình cam xám',
    images: [
      '/images/ao-phan-quang-bao-ho.png',
      '/images/ao-phan-quang-bao-ho-angle.png',
      '/images/ao-phan-quang-bao-ho-color.png',
    ],
  },
  {
    name: 'Safety Jogger Bestboy S3 - Giày bảo hộ cổ thấp',
    images: [
      'https://www.latiendadelobrero.com/3243-large_default/bota-safety-jogger-bestboy-s3.jpg',
    ],
  },
  {
    name: 'Safety Jogger Dakar S3 - Giày bảo hộ cổ cao',
    images: [
      'https://media3.vetsecurite.com/42576-thickbox_default/calcado-de-seguranca-s3-dakar-castanho-safety-jogger-industrial.jpg',
    ],
  },
  {
    name: 'Dunlop Purofort - Ủng bảo hộ chống nước',
    images: [
      'https://www.countrylife.ie/medias/9012237-frontface-1200Wx1200H?context=bWFzdGVyfGltYWdlc3wzNjk1MTR8aW1hZ2UvanBlZ3xhVzFoWjJWekx6ZzROak00T0RVd09Ua3dNemd1YW5Cbnw2ZjQ0YWYzNmJkYjIzMjU0YzEzYjk3MWQ0MzExMWYyYmQ5OGE4YjdjYjY1NTViMTdmOWUxYmY1OTI1YWRkZTQ4',
    ],
  },
  {
    name: 'Safety Jogger Ligero2 S1P - Giày bảo hộ siêu nhẹ',
    images: [
      'https://varovalko.si/image/cache/catalog/safetyjoger/klasika/ligero2_s1p_n/delovni-cevlji-ligero-s1p-modri-3-550x550.webp',
    ],
  },
  {
    name: 'Safety Jogger X2000 S3 - Giày bảo hộ công nghiệp',
    images: [
      'https://down-id.img.susercontent.com/file/sg-11134201-22100-cmfu9dwmdriv69',
    ],
  },
  {
    name: 'Safety Jogger Desert S1P - Giày bảo hộ cổ lửng',
    images: [
      'https://static.wixstatic.com/media/1bca82_ad2dd78e9f344a5997b31cf859f7d34f~mv2.jpg/v1/fill/w_480%2Ch_534%2Cal_c%2Cq_80%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/1bca82_ad2dd78e9f344a5997b31cf859f7d34f~mv2.jpg',
    ],
  },
  {
    name: 'Canon EOS R6 Mark II - Máy ảnh mirrorless full-frame',
    images: [
      'https://images-us-prod.cms.commerce.dynamics.com/cms/api/hbzzfqllpg/imageFileData/search?fileName=%2FProducts%2FV567CAN212+%5E++%5E+Canon+RF+%5E+black+%5E+New_000_001.png',
    ],
  },
  {
    name: 'Sony Alpha A7 III - Máy ảnh full-frame 24.2MP',
    images: [
      'https://shopatsc.com/cdn/shop/products/ILCE-7M3-01.jpg?v=1606811549',
      '/images/sony-a7iii-angle.png',
      '/images/sony-a7iii-color.png',
    ],
  },
  {
    name: 'Godox SL150W II - Đèn LED quay phim 150W',
    images: [
      'https://jpckemang.id/assets/img/products/Godox_SL150W_II_LED_Video_Light_11.jpg',
      'https://www.jpckemang.com/assets/img/products/Godox_SL150W_II_LED_Video_Light_61.jpg',
      '/images/godox-sl150w-angle.png',
    ],
  },
  {
    name: 'DJI RS 3 Pro - Gimbal chống rung 3 trục',
    images: [
      'https://f00.osfr.pl/foto/5/106941997489/f0d2ef4d87f7a7491e698532bebb3c5c/dji-gimbal-rs3-pro-dji%2C106941997489_5.webp',
      'https://i5.walmartimages.com/seo/DJI-RS-3-Pro-Handheld-3-Axis-Gimbal-Stabilizer-for-DSLR-Cameras-CP-RN-00000219-01_6f0912ac-e85b-498a-9c8f-11e3f8cdd690.42675ddc04179b99c0cc10bb83c1af70.jpeg',
      '/images/dji-ronin-rs3-angle.png',
    ],
  },
  {
    name: 'DJI Mini 4 Pro Fly More Combo - Drone quay 4K',
    images: [
      'https://i5.walmartimages.com/seo/DJI-Mini-4-Pro-4K-HDR-Drone-Fly-More-Combo-with-RC-2-Remote-Kit-CP-MA-00000735-01_ac95eff8-4706-4515-bddb-0eac6e52fe12.758bbc96284580c3930dc531ec17f388.jpeg',
      'https://static.fnac-static.com/multimedia/Images/FR/MDM/c1/b1/52/22196673/3756-1/tsp20260324183922/Drone-Dji-Mini-4-Pro-Fly-More-Combo-avec-radiocommande-Blanc.jpg',
      'https://www.djiusa.com/cdn/shop/files/2_3aabe490-76e2-4375-859a-0982dc337df4.jpg?v=1776756108',
    ],
  },
  {
    name: 'Aputure Light Storm LS 120d II - Đèn COB studio',
    images: [
      'https://proaim.ru/upload/iblock/467/467d898326a972c8d7f12d5fcfc52d91.jpg',
    ],
  },
];

function normalizeProductImages() {
  const db = getDatabase();
  const findProduct = db.prepare('SELECT id FROM products WHERE name = ?');
  const updateProduct = db.prepare(`
    UPDATE products
    SET image_url = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `);
  const deleteImages = db.prepare('DELETE FROM product_images WHERE product_id = ?');
  const insertImage = db.prepare(`
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (?, ?, ?, ?)
  `);

  const run = db.transaction(() => {
    let updated = 0;
    let skipped = 0;

    normalizedImages.forEach((product) => {
      const existing = findProduct.get(product.name);
      if (!existing) {
        skipped += 1;
        return;
      }

      updateProduct.run(product.images[0], existing.id);
      deleteImages.run(existing.id);
      product.images.forEach((imageUrl, index) => {
        insertImage.run(existing.id, imageUrl, index === 0 ? 1 : 0, index);
      });
      updated += 1;
    });

    return { updated, skipped };
  });

  try {
    const result = run();
    const stats = db.prepare(`
      SELECT p.id, p.name, COUNT(pi.id) AS images
      FROM products p
      LEFT JOIN product_images pi ON pi.product_id = p.id
      WHERE p.id >= 11
      GROUP BY p.id
      ORDER BY p.id
    `).all();

    console.log(`Image normalization completed: ${result.updated} updated, ${result.skipped} skipped.`);
    console.table(stats);
  } finally {
    closeDatabase();
  }
}

normalizeProductImages();
