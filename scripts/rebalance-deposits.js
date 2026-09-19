require('dotenv').config();

const { getDatabase, closeDatabase } = require('../src/database/connection');

const highValueKeywords = [
  'camera',
  'canon',
  'sony',
  'dji',
  'drone',
  'gimbal',
  'godox',
  'aputure',
  'light storm',
  'đèn cob',
  'đèn led quay phim',
];

function roundToNearest(amount, step = 10000) {
  return Math.max(step, Math.round(amount / step) * step);
}

function calculateFriendlyDeposit(product) {
  if (!product.price_rent_per_day || product.price_rent_per_day <= 0) return 0;

  const name = String(product.name || '').toLowerCase();
  const category = String(product.category_name || '').toLowerCase();
  const isHighValue =
    Number(product.price_sell || 0) >= 20000000 ||
    Number(product.price_rent_per_day || 0) >= 750000 ||
    highValueKeywords.some((keyword) => name.includes(keyword) || category.includes(keyword));

  const multiplier = isHighValue ? 4 : 3;
  const baseDeposit = product.price_rent_per_day * multiplier;
  const sellPrice = Number(product.price_sell || 0);
  const capBySellPrice = sellPrice > 0 ? sellPrice * 0.3 : baseDeposit;
  const floorByRent = product.price_rent_per_day * 2;
  const minimumDeposit = product.price_rent_per_day <= 30000 ? 50000 : floorByRent;

  const friendlyDeposit = Math.min(baseDeposit, Math.max(capBySellPrice, minimumDeposit));
  return roundToNearest(Math.max(minimumDeposit, friendlyDeposit));
}

function rebalanceDeposits() {
  const db = getDatabase();

  const products = db.prepare(`
    SELECT p.id, p.name, p.price_sell, p.price_rent_per_day, p.deposit_amount, c.name AS category_name
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = 1
    ORDER BY p.id
  `).all();

  const updateDeposit = db.prepare(`
    UPDATE products
    SET deposit_amount = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `);

  const changes = [];
  const run = db.transaction(() => {
    products.forEach((product) => {
      const nextDeposit = calculateFriendlyDeposit(product);
      if (Number(product.deposit_amount || 0) !== nextDeposit) {
        updateDeposit.run(nextDeposit, product.id);
        changes.push({
          id: product.id,
          name: product.name,
          rent_per_day: product.price_rent_per_day,
          old_deposit: product.deposit_amount,
          new_deposit: nextDeposit,
        });
      }
    });
  });

  try {
    run();
    console.log(`Deposit rebalance completed: ${changes.length} products updated.`);
    console.table(changes);
  } finally {
    closeDatabase();
  }
}

rebalanceDeposits();
