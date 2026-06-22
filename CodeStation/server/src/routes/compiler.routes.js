const express = require("express");
const router = express.Router();
const compilerController = require("../controllers/compiler.controller");
const validateBody = require("../middleware/validator.middleware");
const { runCodeSchema } = require("../validators/compiler.validator");

// GET /api/compiler/languages - Fetches all supported compilers
router.get("/languages", compilerController.getLanguages);

// POST /api/compiler/run - Executes code and returns outputs
// Validation middleware is run before invoking controller logic
router.post("/run", validateBody(runCodeSchema), compilerController.runCode);

module.exports = router;
