const dotenv = require("dotenv");
const path = require("path");

// Load env from the root of server directory (two directories up from src/config)
dotenv.config({ path: path.join(__dirname, "../../.env") });

module.exports = {
  PORT: process.env.PORT || 3000,
  COMPILER_API_KEY: process.env.COMPILER_API_KEY,
  COMPILER_API_BASE: process.env.COMPILER_API_BASE || "https://api.onlinecompiler.io",
  BOB_API_KEY: process.env.BOB_API_KEY,
  BOB_API_BASE_URL: process.env.BOB_API_BASE_URL || "https://api.groq.com/openai/v1",
  BOB_MODEL: process.env.BOB_MODEL || "openai/gpt-oss-20b",
  AWS_REGION: process.env.AWS_REGION || "ap-southeast-2",
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  S3_ROOM_PREFIX: process.env.S3_ROOM_PREFIX || "rooms",
  NODE_ENV: process.env.NODE_ENV || "development"
};
