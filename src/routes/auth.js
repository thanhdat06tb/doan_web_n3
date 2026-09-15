// ═══════════════════════════════════════════════════════════════
// 🔐 Auth Routes — Đăng ký & Đăng nhập
// POST /api/auth/register | POST /api/auth/login
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const router = express.Router();

const { getDatabase } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { ERROR_CODES } = require('../constants/errorCodes');
const validateRequest = require('../middleware/validateRequest');
const logger = require('../utils/logger');

// ━━━ Zod Schemas ━━━

const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự.').max(100),
  email: z.string().email('Email không hợp lệ.'),
  phone: z.string().regex(/^0\d{9}$/, 'Số điện thoại phải có 10 chữ số, bắt đầu bằng 0.'),
  address: z.string().max(500).optional().default(''),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự.').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/auth/register — Đăng ký tài khoản mới
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.post('/register', validateRequest({ body: registerSchema }), (req, res) => {
  try {
    const { fullName, email, phone, address, password } = req.body;
    const db = getDatabase();

    // Kiểm tra email đã tồn tại
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json(
        errorResponse(ERROR_CODES.EMAIL_EXISTS.code, ERROR_CODES.EMAIL_EXISTS.message)
      );
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Insert user
    const result = db
      .prepare(`
        INSERT INTO users (full_name, email, phone, address, password_hash, role)
        VALUES (?, ?, ?, ?, ?, 'CUSTOMER')
      `)
      .run(fullName, email, phone, address, passwordHash);

    const userId = Number(result.lastInsertRowid);

    // Tạo JWT token
    const token = jwt.sign(
      { userId, email, role: 'CUSTOMER' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    logger.auth('REGISTER_SUCCESS', { userId, email });

    res.status(201).json(
      successResponse({
        user: { id: userId, fullName, email, phone, address, role: 'CUSTOMER' },
        token,
      }, 'Đăng ký thành công!')
    );

  } catch (error) {
    logger.error('REGISTER_FAILED', { error: error.message });
    res.status(500).json(
      errorResponse(ERROR_CODES.INTERNAL_ERROR.code, ERROR_CODES.INTERNAL_ERROR.message)
    );
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/auth/login — Đăng nhập
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.post('/login', validateRequest({ body: loginSchema }), (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDatabase();

    // Tìm user theo email
    const user = db
      .prepare('SELECT id, full_name, email, phone, address, role, password_hash, is_active FROM users WHERE email = ?')
      .get(email);

    if (!user) {
      return res.status(401).json(
        errorResponse(ERROR_CODES.INVALID_CREDENTIALS.code, ERROR_CODES.INVALID_CREDENTIALS.message)
      );
    }

    // Kiểm tra account active
    if (!user.is_active) {
      return res.status(403).json(
        errorResponse(ERROR_CODES.FORBIDDEN.code, 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.')
      );
    }

    // Kiểm tra password
    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json(
        errorResponse(ERROR_CODES.INVALID_CREDENTIALS.code, ERROR_CODES.INVALID_CREDENTIALS.message)
      );
    }

    // Tạo JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    logger.auth('LOGIN_SUCCESS', { userId: user.id, email: user.email, role: user.role });

    res.json(
      successResponse({
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role,
        },
        token,
      }, 'Đăng nhập thành công!')
    );

  } catch (error) {
    logger.error('LOGIN_FAILED', { error: error.message });
    res.status(500).json(
      errorResponse(ERROR_CODES.INTERNAL_ERROR.code, ERROR_CODES.INTERNAL_ERROR.message)
    );
  }
});

module.exports = router;
