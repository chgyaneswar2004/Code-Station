const dotenv = require("dotenv");
const path = require("path");

// Load env from the root of server directory (two directories up from src/config)
dotenv.config({ path: path.join(__dirname, "../../.env") });

module.exports = {
  PORT: process.env.PORT || 3000,
  COMPILER_API_KEY: process.env.COMPILER_API_KEY,
  COMPILER_API_BASE: process.env.COMPILER_API_BASE || "https://api.onlinecompiler.io",
  NODE_ENV: process.env.NODE_ENV || "development"
};
