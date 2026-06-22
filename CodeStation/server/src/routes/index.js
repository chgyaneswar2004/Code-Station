const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const compilerRouter = require("./compiler.routes");
const { compilerRateLimiter } = require("../middleware/security.middleware");
const logger = require("../utils/logger");

// Mount compiler endpoints
// 1. Maintain original API contract endpoint
router.use("/api/compiler", compilerRouter);

// 2. Added API Versioning support (Recommendation)
router.use("/api/v1/compiler", compilerRouter);

// Apply rate limiter specifically to run code endpoints
router.use("/api/compiler/run", compilerRateLimiter);
router.use("/api/v1/compiler/run", compilerRateLimiter);

// Serve static HTML index
router.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "../..", "public", "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({ message: "Server is running" });
  }
});

// Fallback route to serve react production build
router.get("*", (req, res) => {
  const distIndex = path.join(__dirname, "../../../client/dist/index.html");
  if (fs.existsSync(distIndex)) {
    res.sendFile(distIndex);
  } else {
    res.status(404).json({
      message: "Client not built. Run: cd client && npm run build"
    });
  }
});

module.exports = router;
