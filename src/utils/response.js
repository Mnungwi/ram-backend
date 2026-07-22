const successResponse = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const errorResponse = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

const paginatedResponse = (res, data, total, page, limit, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  });
};

const getPagination = (query) => {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(100, parseInt(query.limit) || 20);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

module.exports = { successResponse, errorResponse, paginatedResponse, getPagination };
