const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Basic helmet middleware configurations
const securityHeaders = helmet({
  contentSecurityPolicy: false, // Turn off CSP if static pages require inline scripts
});

// Rate limiting specifically for compile execution runs (100 requests per 15 minutes per IP)
const compilerRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many code compilation requests, please try again later"
  }
});

module.exports = {
  securityHeaders,
  compilerRateLimiter
};
