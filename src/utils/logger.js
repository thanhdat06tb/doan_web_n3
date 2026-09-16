// ═══════════════════════════════════════════════════════════════
// 📝 Logger — Ghi log hành động vào file
// Log format: [TIMESTAMP] [LEVEL] [ACTION] message
// ═══════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

// Tạo thư mục logs nếu chưa có
const logsDir = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, 'app.log');

/**
 * Ghi log vào file + console
 * @param {'INFO'|'WARN'|'ERROR'|'ORDER'|'AUTH'} level
 * @param {string} action - Hành động (VD: 'CREATE_ORDER', 'LOGIN')
 * @param {object} data - Dữ liệu kèm theo
 */
function log(level, action, data = {}) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    action,
    ...data,
  };

  const logLine = JSON.stringify(logEntry) + '\n';

  // Ghi vào file (async, không block)
  fs.appendFile(logFile, logLine, (err) => {
    if (err) console.error('Logger write error:', err.message);
  });

  // Ghi ra console trong development
  if (process.env.NODE_ENV === 'development') {
    const icon = {
      INFO: 'ℹ️',
      WARN: '⚠️',
      ERROR: '❌',
      ORDER: '🛒',
      AUTH: '🔐',
    }[level] || '📋';

    console.log(`${icon} [${level}] ${action}`, JSON.stringify(data, null, 0));
  }
}

// Shorthand methods
const logger = {
  info: (action, data) => log('INFO', action, data),
  warn: (action, data) => log('WARN', action, data),
  error: (action, data) => log('ERROR', action, data),
  order: (action, data) => log('ORDER', action, data),
  auth: (action, data) => log('AUTH', action, data),
};

module.exports = logger;
