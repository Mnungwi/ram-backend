const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');

// Sequelize and generic error handler
const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  // Sequelize Validation Error
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({ field: e.path, message: e.message }));
    return errorResponse(res, 'Validation error', 422, errors);
  }

  // Sequelize Unique Constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'field';
    return errorResponse(res, `${field} already exists`, 409);
  }

  // Sequelize Foreign Key
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return errorResponse(res, 'Referenced resource not found', 400);
  }

  // Multer file size
  if (err.code === 'LIMIT_FILE_SIZE') {
    return errorResponse(res, 'File too large. Maximum size is 10MB.', 413);
  }

  // JWT errors (shouldn't reach here but just in case)
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid token', 401);
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  return errorResponse(res, message, status);
};

// Express-validator result checker
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 'Validation failed', 422, errors.array());
  }
  next();
};

// 404 handler
const notFound = (req, res) => {
  return errorResponse(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
};

module.exports = { errorHandler, validate, notFound };
