const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { ERROR_CODES } = require('../constants/errorCodes');

// GET /api/categories
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const categories = db.prepare('SELECT id, name, description FROM categories ORDER BY name ASC').all();
    res.json(successResponse(categories));
  } catch (error) {
    res.status(500).json(
      errorResponse(ERROR_CODES.INTERNAL_ERROR.code, ERROR_CODES.INTERNAL_ERROR.message)
    );
  }
});

module.exports = router;
