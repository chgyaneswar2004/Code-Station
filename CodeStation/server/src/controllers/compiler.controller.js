const compilerService = require("../services/compiler.service");
const logger = require("../utils/logger");

/**
 * Handles GET /languages - Fetches all supported compilers
 */
const getLanguages = async (req, res, next) => {
  try {
    const data = await compilerService.fetchCompilers();
    res.json(data);
  } catch (err) {
    logger.error("Failed to fetch compilers:", err);
    res.status(500).json({ error: "Failed to fetch language list" });
  }
};

/**
 * Handles POST /run - Executes code and returns standardized execution output
 */
const runCode = async (req, res, next) => {
  const { compiler, code, input } = req.body;

  try {
    const response = await compilerService.runCodeSync(compiler, code, input);

    // Handle rate-limiting (429) from upstream compiler API
    if (response.status === 429) {
      logger.warn("Upstream compiler API returned 429 (Server busy)");
      return res.status(429).json({ error: "Server busy, please try again" });
    }

    const data = await response.json();

    // Normalize response shape to preserve original client contract
    res.json({
      output: data.output || "",
      error: data.error || "",
      status: data.status,
      exitCode: data.exit_code,
      time: data.time,
      memory: data.memory,
    });
  } catch (err) {
    logger.error("Code execution failed:", err);
    res.status(500).json({ error: "Code execution failed" });
  }
};

module.exports = {
  getLanguages,
  runCode
};
