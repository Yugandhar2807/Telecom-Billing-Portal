// backend/middleware/errorHandler.js

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // If a response status is already set (e.g. 400, 401), use it; otherwise default to 500
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode);

  // Send JSON error response
  res.json({
    message: err.message || 'Internal Server Error',
    // In dev, include stack trace for debugging
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;