// Placeholder for future database connection setup (e.g., MongoDB, PostgreSQL, etc.)
// Currently, all room state and chat history are stored in-memory using room.service.js

const logger = require("../utils/logger");

const connectDB = async () => {
  logger.info("No database configured. Using in-memory state storage.");
  return true;
};

module.exports = {
  connectDB
};
