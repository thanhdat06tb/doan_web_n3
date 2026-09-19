require('dotenv').config();

const { getDatabase, closeDatabase } = require('../src/database/connection');

const replacements = [
  {
    oldName: 'Máy đục bê tông Bosch GSH 500',
    category: 'Thiết bị xây dựng',
    name: 'Bosch GSH 500 Professional - Máy đục bê tông 1100W',
    description: 'Máy đục bê tông Bosch GSH 500 Professional dùng cho phá bê tông, đục gạch, tạo rãnh kỹ thuật và sửa chữa công trình. Máy có lực đập mạnh, thân máy chắc, tay cầm phụ dễ kiểm soát khi thi công liên tục.',
    priceSell: 5200000,
    priceRent: 180000,
    deposit: 1200000,
    stock: 4,
    images: [
      'https://www.bansoonhardware.com.sg/5760-superlarge_default/bosch-gsh-500-professional-demolition-hammer-breaker-with-hex.jpg',
      'https://images.tcdn.com.br/img/img_prod/1090846/martelete_rompedor_bosch_gsh_500_1100w_127v_com_cinzel_e_maleta_27916_2_37fd147676c4d30ef8cbeedd7dcb2c1d.jpg',
      '/images/bosch-gbh226-angle.png',
    ],
  },
  {
    oldName: 'Máy mài góc Makita GA9020 2200W',
    category: 'Thiết bị xây dựng',
    name: 'Makita GA9020 - Máy mài góc 230mm 2200W',
    description: 'Makita GA9020 là máy mài góc công suất lớn, dùng cho cắt sắt, mài bavia, xử lý mối hàn và cắt vật liệu công trình. Đĩa 230mm phù hợp nhu cầu thi công nặng, cơ khí và xây dựng.',
    priceSell: 2800000,
    priceRent: 90000,
    deposit: 600000,
    stock: 6,
    images: [
      'https://images.tcdn.com.br/img/img_prod/1205188/esmerilhadeira_angular_makita_ga9020_230mm_220v_2200w_5143_2_e2c1c2f33e7a47cd588925b8b816fded.jpg',
      '/images/makita-4100nh-angle.png',
      '/images/makita-4100nh-color.png',
    ],
  },
  {
    oldName: 'Máy đầm dùi bê tông Honda GX160',
    category: 'Thiết bị xây dựng',
    name: 'Total TCVLI202301 - Máy đầm dùi bê tông pin 20V',
    description: 'Máy đầm dùi bê tông Total TCVLI202301 dùng pin 20V, sonda dài khoảng 1200mm, phù hợp xử lý bọt khí trong bê tông khi đổ cột, móng và sàn nhỏ. Thiết kế không dây giúp đội thi công linh hoạt hơn tại hiện trường.',
    priceSell: 3600000,
    priceRent: 140000,
    deposit: 900000,
    stock: 4,
    images: [
      'https://herramientastotal.cl/cdn/shop/files/TCVLI202301_2079x2079.jpg?v=1713968047',
      '/images/concrete-mixer-350-angle.png',
      '/images/concrete-mixer-350-color.png',
    ],
  },
  {
    oldName: 'Máy khoan rút lõi bê tông DCA AZZ130',
    category: 'Thiết bị xây dựng',
    name: 'DCA AZZ03-130 - Máy khoan rút lõi bê tông 130mm',
    description: 'DCA AZZ03-130 là máy khoan rút lõi có cấp nước, dùng cho khoan xuyên sàn, khoan tường bê tông và lắp đặt hệ thống kỹ thuật. Máy phù hợp đội điện nước, điều hòa, PCCC và thi công cải tạo.',
    priceSell: 6800000,
    priceRent: 260000,
    deposit: 2000000,
    stock: 2,
    images: [
      'https://cdn.vseinstrumenti.ru/images/goods/stroitelnoe-oborudovanie-i-tehnika/oborudovanie-dlya-betonnyh-rabot/15186916/1000x1000/191370396.jpg',
      'https://toolssavvy.ph/cdn/shop/files/azz02-130-dca.jpg?v=1769843379',
      '/images/bosch-gbh226-color.png',
    ],
  },
  {
    oldName: 'Máy cắt gạch bàn 1200mm',
    category: 'Thiết bị xây dựng',
    name: 'Bosch GBH 2-28 F Professional - Máy khoan búa SDS plus',
    description: 'Bosch GBH 2-28 F Professional là máy khoan búa SDS plus dùng cho khoan bê tông, đục nhẹ, khoan gỗ và kim loại. Bộ sản phẩm có vali, tay cầm phụ và đầu chuyển, phù hợp đội thi công chuyên nghiệp.',
    priceSell: 6400000,
    priceRent: 220000,
    deposit: 1600000,
    stock: 3,
    images: [
      'https://www.prosco.eu/cdn/shop/products/0611267601.jpg?v=1660908666',
      'https://www.bosch-professional.com/middle-east/en/ocsmedia/5955-54/application-image/1434x828/rotary-hammer-with-sds-plus-pro-gbh-2-26-dre-0611253703.png',
      '/images/bosch-gbh226.png',
    ],
  },
  {
    oldName: 'Máy hàn que Hồng Ký HK200A',
    category: 'Thiết bị xây dựng',
    name: 'Stanley STHR1232K - Máy khoan búa SDS 1250W',
    description: 'Stanley STHR1232K là máy khoan búa SDS công suất 1250W, dùng cho khoan bê tông, đục phá nhẹ và sửa chữa công trình. Bộ máy có vali và phụ kiện, phù hợp công trình dân dụng.',
    priceSell: 3300000,
    priceRent: 130000,
    deposit: 900000,
    stock: 4,
    images: [
      'https://tauber.com.mx/storage/2022/February/week4/973729_s9_hr1232k_b3-5.jpg',
      'https://arcencohogareasy.vtexassets.com/arquivos/ids/326901/1132150.jpg?v=637944586102130000',
      '/images/makita-4100nh.png',
    ],
  },
  {
    oldName: 'Áo phản quang lưới 2 sọc cao cấp',
    category: 'Quần áo bảo hộ',
    name: 'Áo phản quang 3M vàng chanh',
    description: 'Áo phản quang dùng vật liệu phản sáng 3M, màu vàng chanh dễ nhận diện trong môi trường thiếu sáng. Phù hợp công trình, kho bãi, giao thông, bảo trì và đội sự kiện ngoài trời.',
    priceSell: 150000,
    priceRent: 15000,
    deposit: 60000,
    stock: 60,
    images: [
      'https://www.safe-t-cut-cm.com/uploads/1116/shop/201607/201607-29-181610_po-0.jpg',
      '/images/ao-phan-quang-bao-ho-angle.png',
      '/images/ao-phan-quang-bao-ho-color.png',
    ],
  },
  {
    oldName: 'Bộ bảo hộ kaki túi hộp màu ghi',
    category: 'Quần áo bảo hộ',
    name: 'Delta Plus M2VE3 Mach2 - Áo khoác bảo hộ kỹ thuật',
    description: 'Delta Plus M2VE3 Mach2 là áo khoác bảo hộ vải twill 65% polyester, 35% cotton, nhiều túi chức năng. Phù hợp kỹ thuật viên, cơ điện, bảo trì tòa nhà và đội thi công cần đồng phục trưởng thành.',
    priceSell: 520000,
    priceRent: 65000,
    deposit: 220000,
    stock: 18,
    images: [
      'https://media.deltaplus.eu/m/25d8f70ecb37065c/Liferay_Product_Zoom-M2VE3-GO-eps.png',
      'https://i.ebayimg.com/images/g/PWYAAOSw~atcGTbG/s-l1600.jpg',
      '/images/quan-ao-bao-ho-angle.png',
    ],
  },
  {
    oldName: 'Bộ bảo hộ chống bụi công trình',
    category: 'Quần áo bảo hộ',
    name: 'Delta Plus M2GI3 Mach2 - Áo ghi lê nhiều túi',
    description: 'Delta Plus M2GI3 Mach2 là áo ghi lê bảo hộ nhiều túi, phù hợp kỹ sư hiện trường, giám sát công trình, thợ điện và thợ cơ khí cần mang theo dụng cụ nhỏ, thẻ và bộ đàm.',
    priceSell: 430000,
    priceRent: 50000,
    deposit: 180000,
    stock: 22,
    images: [
      'https://tigersafety.co.uk/images/pictures/temp/delta-plus/delta-plus-m2gi3-mach-2-mens-multi-pocket-work-%28gallery%29.jpg?v=3d133632',
      '/images/ao-phan-quang-bao-ho.png',
      '/images/quan-ao-bao-ho-color.png',
    ],
  },
  {
    oldName: 'Áo khoác bảo hộ phản quang mùa mưa',
    category: 'Quần áo bảo hộ',
    name: 'Honeywell Miller H500 - Dây đai an toàn toàn thân',
    description: 'Honeywell Miller H500 là dây đai an toàn toàn thân cho làm việc trên cao, có đệm vai/lưng, điểm móc an toàn và chỉ báo va đập. Phù hợp thi công mái, giàn giáo, nhà xưởng và bảo trì công nghiệp.',
    priceSell: 4200000,
    priceRent: 180000,
    deposit: 1500000,
    stock: 8,
    images: [
      'https://www.tenaquip.com/images/xlarge/s/sgv764b.jpg',
      '/images/ao-phan-quang-bao-ho-color.png',
      '/images/quan-ao-bao-ho.png',
    ],
  },
  {
    oldName: 'Bộ bảo hộ kỹ sư có phản quang',
    category: 'Quần áo bảo hộ',
    name: 'Delta Plus Panoply Mach2 - Áo khoác công nhân xanh navy',
    description: 'Áo khoác Delta Plus Panoply Mach2 thiết kế đồng phục công nghiệp, có túi ngực, túi hông và khóa kéo chắc chắn. Phù hợp đội bảo trì, lắp đặt, thợ cơ khí và công trường cần hình ảnh chuyên nghiệp.',
    priceSell: 560000,
    priceRent: 65000,
    deposit: 240000,
    stock: 16,
    images: [
      'https://i.ebayimg.com/images/g/PWYAAOSw~atcGTbG/s-l1600.jpg',
      'https://media.deltaplus.eu/m/25d8f70ecb37065c/Liferay_Product_Zoom-M2VE3-GO-eps.png',
      '/images/quan-ao-bao-ho-angle.png',
    ],
  },
  {
    oldName: 'Áo ghi lê công trình nhiều túi',
    category: 'Quần áo bảo hộ',
    name: 'Áo phản quang công trình cam xám',
    description: 'Áo phản quang cam xám nổi bật, hỗ trợ nhận diện nhân sự trong kho bãi, công trình và sự kiện ngoài trời. Dễ mặc ngoài đồng phục, thích hợp cho thuê theo nhóm số lượng lớn.',
    priceSell: 180000,
    priceRent: 20000,
    deposit: 80000,
    stock: 45,
    images: [
      '/images/ao-phan-quang-bao-ho.png',
      'https://www.safe-t-cut-cm.com/uploads/1116/shop/201607/201607-29-181610_po-0.jpg',
      '/images/ao-phan-quang-bao-ho-angle.png',
    ],
  },
  {
    oldName: 'Giày bảo hộ Jogger Bestboy S3',
    category: 'Giày dép chuyên dụng',
    name: 'Safety Jogger Bestboy S3 - Giày bảo hộ cổ thấp',
    description: 'Safety Jogger Bestboy S3 có mũi thép, đế chống đâm xuyên, chống trượt và da chống thấm nhẹ. Phù hợp công trình, kho bãi, cơ khí và môi trường lao động cần bảo vệ chân chắc chắn.',
    priceSell: 720000,
    priceRent: 80000,
    deposit: 320000,
    stock: 20,
    images: [
      'https://www.latiendadelobrero.com/3243-large_default/bota-safety-jogger-bestboy-s3.jpg',
      '/images/giay-bao-ho-angle.png',
      '/images/giay-bao-ho-color.png',
    ],
  },
  {
    oldName: 'Giày bảo hộ cổ cao chống trượt',
    category: 'Giày dép chuyên dụng',
    name: 'Safety Jogger Dakar S3 - Giày bảo hộ cổ cao',
    description: 'Safety Jogger Dakar S3 là giày bảo hộ cổ cao, da chống nước, mũi thép và đế chống trượt. Phù hợp môi trường công trình, kho vận, xưởng cơ khí và làm việc ngoài trời.',
    priceSell: 980000,
    priceRent: 110000,
    deposit: 420000,
    stock: 14,
    images: [
      'https://media3.vetsecurite.com/42576-thickbox_default/calcado-de-seguranca-s3-dakar-castanho-safety-jogger-industrial.jpg',
      'https://static.wixstatic.com/media/1bca82_ad2dd78e9f344a5997b31cf859f7d34f~mv2.jpg/v1/fill/w_480%2Ch_534%2Cal_c%2Cq_80%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/1bca82_ad2dd78e9f344a5997b31cf859f7d34f~mv2.jpg',
      '/images/giay-bao-ho.png',
    ],
  },
  {
    oldName: 'Ủng bảo hộ PVC chống nước',
    category: 'Giày dép chuyên dụng',
    name: 'Dunlop Purofort - Ủng bảo hộ chống nước',
    description: 'Dunlop Purofort là ủng bảo hộ cao cổ, nhẹ, cách nhiệt và chống nước tốt. Phù hợp khu vực ẩm ướt, công trình ngoài trời, vệ sinh công nghiệp và kho lạnh.',
    priceSell: 820000,
    priceRent: 90000,
    deposit: 350000,
    stock: 18,
    images: [
      'https://www.countrylife.ie/medias/9012237-frontface-1200Wx1200H?context=bWFzdGVyfGltYWdlc3wzNjk1MTR8aW1hZ2UvanBlZ3xhVzFoWjJWekx6ZzROak00T0RVd09Ua3dNemd1YW5Cbnw2ZjQ0YWYzNmJkYjIzMjU0YzEzYjk3MWQ0MzExMWYyYmQ5OGE4YjdjYjY1NTViMTdmOWUxYmY1OTI1YWRkZTQ4',
      '/images/giay-bao-ho-color.png',
      '/images/giay-bao-ho-angle.png',
    ],
  },
  {
    oldName: 'Giày bảo hộ siêu nhẹ mũi composite',
    category: 'Giày dép chuyên dụng',
    name: 'Safety Jogger Ligero2 S1P - Giày bảo hộ siêu nhẹ',
    description: 'Safety Jogger Ligero2 S1P là giày bảo hộ nhẹ, mũi nano carbon, thiết kế thoáng và linh hoạt. Phù hợp kỹ thuật viên, kho vận, lắp đặt và công việc phải di chuyển nhiều.',
    priceSell: 980000,
    priceRent: 110000,
    deposit: 420000,
    stock: 14,
    images: [
      'https://varovalko.si/image/cache/catalog/safetyjoger/klasika/ligero2_s1p_n/delovni-cevlji-ligero-s1p-modri-3-550x550.webp',
      '/images/giay-bao-ho.png',
      '/images/giay-bao-ho-angle.png',
    ],
  },
  {
    oldName: 'Giày chống tĩnh điện cho xưởng điện tử',
    category: 'Giày dép chuyên dụng',
    name: 'Safety Jogger X2000 S3 - Giày bảo hộ công nghiệp',
    description: 'Safety Jogger X2000 S3 là giày bảo hộ cổ lửng, đế bám tốt, mũi bảo vệ và lớp chống đâm xuyên. Phù hợp công trình, xưởng sản xuất, kho hàng và đội bảo trì.',
    priceSell: 790000,
    priceRent: 85000,
    deposit: 320000,
    stock: 18,
    images: [
      'https://down-id.img.susercontent.com/file/sg-11134201-22100-cmfu9dwmdriv69',
      '/images/giay-bao-ho-color.png',
      '/images/giay-bao-ho.png',
    ],
  },
  {
    oldName: 'Dép bảo hộ chống trượt khu vực ẩm',
    category: 'Giày dép chuyên dụng',
    name: 'Safety Jogger Desert S1P - Giày bảo hộ cổ lửng',
    description: 'Safety Jogger Desert S1P có kiểu dáng cổ lửng, chống trượt, chống đâm xuyên và đệm gót hấp thụ lực. Phù hợp công trình nhẹ, logistics, xưởng cơ khí và môi trường khô.',
    priceSell: 860000,
    priceRent: 95000,
    deposit: 360000,
    stock: 16,
    images: [
      'https://static.wixstatic.com/media/1bca82_ad2dd78e9f344a5997b31cf859f7d34f~mv2.jpg/v1/fill/w_480%2Ch_534%2Cal_c%2Cq_80%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/1bca82_ad2dd78e9f344a5997b31cf859f7d34f~mv2.jpg',
      'https://media3.vetsecurite.com/42576-thickbox_default/calcado-de-seguranca-s3-dakar-castanho-safety-jogger-industrial.jpg',
      '/images/giay-bao-ho-angle.png',
    ],
  },
  {
    oldName: 'Canon EOS R6 Mark II + Lens 24-105mm',
    category: 'Thiết bị quay phim',
    name: 'Canon EOS R6 Mark II - Máy ảnh mirrorless full-frame',
    description: 'Canon EOS R6 Mark II dùng cảm biến full-frame 24.2MP, lấy nét Dual Pixel CMOS AF II, quay 4K và phù hợp quay sự kiện, phỏng vấn, livestream chất lượng cao. Bộ thuê kèm pin, sạc và thẻ nhớ.',
    priceSell: 62000000,
    priceRent: 1500000,
    deposit: 12000000,
    stock: 2,
    images: [
      'https://images-us-prod.cms.commerce.dynamics.com/cms/api/hbzzfqllpg/imageFileData/search?fileName=%2FProducts%2FV567CAN212+%5E++%5E+Canon+RF+%5E+black+%5E+New_000_001.png',
      'https://shopatsc.com/cdn/shop/products/ILCE-7M3-01.jpg?v=1606811549',
      '/images/sony-a7iii-angle.png',
    ],
  },
  {
    oldName: 'Ống kính Sony FE 70-200mm F4 G',
    category: 'Thiết bị quay phim',
    name: 'Sony Alpha A7 III - Máy ảnh full-frame 24.2MP',
    description: 'Sony Alpha A7 III là máy ảnh full-frame phổ biến cho quay/chụp dịch vụ, có cảm biến 24.2MP, chống rung 5 trục và quay 4K. Phù hợp chụp sản phẩm, sự kiện, studio và video thương mại.',
    priceSell: 45000000,
    priceRent: 1200000,
    deposit: 10000000,
    stock: 3,
    images: [
      'https://shopatsc.com/cdn/shop/products/ILCE-7M3-01.jpg?v=1606811549',
      '/images/sony-a7iii-angle.png',
      '/images/sony-a7iii-color.png',
    ],
  },
  {
    oldName: 'Bộ đèn livestream Godox SL60W + softbox',
    category: 'Thiết bị quay phim',
    name: 'Godox SL150W II - Đèn LED quay phim 150W',
    description: 'Godox SL150W II là đèn LED ánh sáng liên tục 150W, nhiệt màu 5600K, CRI cao và dimmer mượt. Phù hợp studio, livestream, quay phỏng vấn và chụp sản phẩm.',
    priceSell: 8500000,
    priceRent: 350000,
    deposit: 2000000,
    stock: 4,
    images: [
      'https://jpckemang.id/assets/img/products/Godox_SL150W_II_LED_Video_Light_11.jpg',
      'https://www.jpckemang.com/assets/img/products/Godox_SL150W_II_LED_Video_Light_61.jpg',
      '/images/godox-sl150w-angle.png',
    ],
  },
  {
    oldName: 'Gimbal DJI RS4 Mini cho máy ảnh',
    category: 'Thiết bị quay phim',
    name: 'DJI RS 3 Pro - Gimbal chống rung 3 trục',
    description: 'DJI RS 3 Pro là gimbal 3 trục cho máy ảnh mirrorless/cinema nhỏ, tải trọng cao và cân bằng chính xác. Phù hợp quay sự kiện, MV, TVC, hậu trường và nội dung thương mại.',
    priceSell: 15000000,
    priceRent: 500000,
    deposit: 3000000,
    stock: 4,
    images: [
      'https://f00.osfr.pl/foto/5/106941997489/f0d2ef4d87f7a7491e698532bebb3c5c/dji-gimbal-rs3-pro-dji%2C106941997489_5.webp',
      'https://i5.walmartimages.com/seo/DJI-RS-3-Pro-Handheld-3-Axis-Gimbal-Stabilizer-for-DSLR-Cameras-CP-RN-00000219-01_6f0912ac-e85b-498a-9c8f-11e3f8cdd690.42675ddc04179b99c0cc10bb83c1af70.jpeg',
      '/images/dji-ronin-rs3-angle.png',
    ],
  },
  {
    oldName: 'DJI Mini 4 Pro Fly More Combo',
    category: 'Thiết bị quay phim',
    name: 'DJI Mini 4 Pro Fly More Combo - Drone quay 4K',
    description: 'DJI Mini 4 Pro có cảm biến 1/1.3 inch, quay 4K, tránh vật cản đa hướng và truyền hình ảnh O4. Phù hợp khảo sát địa điểm, quay sự kiện ngoài trời, bất động sản và video marketing.',
    priceSell: 24500000,
    priceRent: 900000,
    deposit: 7000000,
    stock: 3,
    images: [
      '/images/dji-mavic3-pro.png',
      '/images/dji-mavic3-pro-angle.png',
      '/images/dji-mavic3-pro-color.png',
    ],
  },
  {
    oldName: 'Máy phun khói sân khấu 1500W',
    category: 'Thiết bị quay phim',
    name: 'Aputure Light Storm LS 120d II - Đèn COB studio',
    description: 'Aputure Light Storm LS 120d II là đèn COB chuyên nghiệp cho quay phim, chụp sản phẩm và set phỏng vấn. Ánh sáng mạnh, dễ điều hướng với reflector và phù hợp nhiều modifier Bowens.',
    priceSell: 14800000,
    priceRent: 520000,
    deposit: 3000000,
    stock: 3,
    images: [
      'https://proaim.ru/upload/iblock/467/467d898326a972c8d7f12d5fcfc52d91.jpg',
      'https://www.jpckemang.com/assets/img/products/Godox_SL150W_II_LED_Video_Light_61.jpg',
      '/images/godox-sl150w-color.png',
    ],
  },
];

function replaceWithMarketProducts() {
  const db = getDatabase();

  const findCategory = db.prepare('SELECT id FROM categories WHERE name = ?');
  const findProduct = db.prepare('SELECT id FROM products WHERE name = ?');
  const updateProduct = db.prepare(`
    UPDATE products
    SET category_id = ?,
        name = ?,
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
    let updated = 0;
    let skipped = 0;

    replacements.forEach((product) => {
      const category = findCategory.get(product.category);
      const existing = findProduct.get(product.oldName) || findProduct.get(product.name);

      if (!category || !existing) {
        skipped += 1;
        return;
      }

      updateProduct.run(
        category.id,
        product.name,
        product.description,
        product.priceSell,
        product.priceRent,
        product.deposit,
        product.stock,
        product.images[0],
        existing.id,
      );

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
      SELECT c.name, COUNT(p.id) AS total
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
      GROUP BY c.id
      ORDER BY c.id
    `).all();

    console.log(`Market product replacement completed: ${result.updated} updated, ${result.skipped} skipped.`);
    console.table(stats);
  } finally {
    closeDatabase();
  }
}

replaceWithMarketProducts();
require('./normalize-product-images');
require('./rebalance-deposits');
