require('dotenv').config();

const { getDatabase, closeDatabase } = require('../src/database/connection');
const { syncDemoMedia } = require('../src/database/syncDemoMedia');

try {
  const db = getDatabase();
  const productCount = syncDemoMedia(db);
  console.log(`Synced demo media for ${productCount} products.`);
} finally {
  closeDatabase();
}
