// ═══════════════════════════════════════════════════════════════
// ✅ Validate Request Middleware — Zod Validation Factory
// Tạo middleware validate request body/params/query bằng Zod schema
// ═══════════════════════════════════════════════════════════════

const { errorResponse } = require('../utils/responseHelper');
const { ERROR_CODES } = require('../constants/errorCodes');

/**
 * Factory function tạo middleware validate request
 * Nhận Zod schema, trả về Express middleware
 *
 * @param {object} schemas - Object chứa schema cho từng phần request
 * @param {import('zod').ZodSchema} [schemas.body] - Schema validate req.body
 * @param {import('zod').ZodSchema} [schemas.params] - Schema validate req.params
 * @param {import('zod').ZodSchema} [schemas.query] - Schema validate req.query
 * @returns {Function} Express middleware
 *
 * @example
 * const { z } = require('zod');
 * router.post('/orders',
 *   validateRequest({
 *     body: z.object({
 *       userId: z.number().int().positive(),
 *       cartItems: z.array(cartItemSchema).min(1),
 *     })
 *   }),
 *   orderController
 * );
 */
function validateRequest(schemas) {
  return (req, res, next) => {
    const errors = [];

    // Validate từng phần request nếu có schema tương ứng
    for (const [source, schema] of Object.entries(schemas)) {
      if (!schema) continue;

      const result = schema.safeParse(req[source]);

      if (!result.success) {
        // Chuyển đổi lỗi Zod thành format thân thiện tiếng Việt
        const fieldErrors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: translateZodError(err),
        }));
        errors.push(...fieldErrors);
      } else {
        // Gán dữ liệu đã parse (đã được transform/default) ngược lại vào req
        req[source] = result.data;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json(
        errorResponse(
          ERROR_CODES.VALIDATION_ERROR.code,
          ERROR_CODES.VALIDATION_ERROR.message,
          errors
        )
      );
    }

    next();
  };
}

/**
 * Dịch lỗi Zod sang tiếng Việt thân thiện
 * @param {import('zod').ZodIssue} error
 * @returns {string}
 */
function translateZodError(error) {
  const field = error.path.join('.');

  switch (error.code) {
    case 'invalid_type':
      if (error.expected === 'string') return `"${field}" phải là chuỗi ký tự.`;
      if (error.expected === 'number') return `"${field}" phải là số.`;
      if (error.expected === 'integer') return `"${field}" phải là số nguyên.`;
      if (error.expected === 'array') return `"${field}" phải là danh sách.`;
      return `"${field}" kiểu dữ liệu không đúng. Cần: ${error.expected}.`;

    case 'too_small':
      if (error.type === 'string') return `"${field}" không được để trống.`;
      if (error.type === 'number') return `"${field}" phải lớn hơn hoặc bằng ${error.minimum}.`;
      if (error.type === 'array') return `"${field}" phải có ít nhất ${error.minimum} phần tử.`;
      return `"${field}" giá trị quá nhỏ.`;

    case 'too_big':
      return `"${field}" giá trị quá lớn (tối đa: ${error.maximum}).`;

    case 'invalid_enum_value':
      return `"${field}" phải là một trong: ${error.options.join(', ')}.`;

    case 'invalid_string':
      if (error.validation === 'email') return `"${field}" không phải email hợp lệ.`;
      return `"${field}" không đúng định dạng.`;

    default:
      return error.message || `"${field}" không hợp lệ.`;
  }
}

module.exports = validateRequest;
