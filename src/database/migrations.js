const PAYMENT_COLUMNS = [
  ['payment_status', "TEXT NOT NULL DEFAULT 'UNPAID'"],
  ['payment_proof_url', "TEXT DEFAULT ''"],
  ['payment_note', "TEXT DEFAULT ''"],
  ['payment_confirmed_at', "TEXT DEFAULT NULL"],
  ['payment_confirmed_by', "INTEGER DEFAULT NULL"],
];

function hasColumn(db, tableName, columnName) {
  return db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all()
    .some((column) => column.name === columnName);
}

function ensureOrderPaymentFields(db) {
  for (const [columnName, definition] of PAYMENT_COLUMNS) {
    if (!hasColumn(db, 'orders', columnName)) {
      db.prepare(`ALTER TABLE orders ADD COLUMN ${columnName} ${definition}`).run();
    }
  }

  db.prepare(`
    UPDATE orders
    SET payment_status = CASE
      WHEN status = 'COMPLETED' THEN 'PAID'
      ELSE 'UNPAID'
    END
    WHERE payment_status IS NULL OR payment_status = ''
  `).run();
}

module.exports = {
  ensureOrderPaymentFields,
};
