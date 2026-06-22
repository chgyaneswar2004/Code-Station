const logger = require("../utils/logger");

/**
 * Express error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error(err.stack || err.message || err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message: message
  });
};

module.exports = errorHandler;
