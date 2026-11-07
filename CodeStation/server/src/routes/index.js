const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const compilerRouter = require("./compiler.routes");
const { compilerRateLimiter } = require("../middleware/security.middleware");
const logger = require("../utils/logger");
const bobRouter = require("../../../bob/server/bob.routes")(express);

// Mount compiler endpoints
router.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// 1. Maintain original API contract endpoint
router.use("/api/compiler", compilerRouter);

// 2. Added API Versioning support (Recommendation)
router.use("/api/v1/compiler", compilerRouter);
router.use("/api/bob", bobRouter);

// Apply rate limiter specifically to run code endpoints
router.use("/api/compiler/run", compilerRateLimiter);
router.use("/api/v1/compiler/run", compilerRateLimiter);

// Serve the production client when available; retain the simple server page for API-only dev.
router.get("/", (_req, res) => {
  const distIndex = path.join(__dirname, "../../../client/dist/index.html");
  if (fs.existsSync(distIndex)) {
    return res.sendFile(distIndex);
  }

  const indexPath = path.join(__dirname, "../..", "public", "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.json({ message: "Server is running" });
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
