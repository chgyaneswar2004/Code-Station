const http = require("http");
const env = require("./config/env");
const { connectDB } = require("./config/db");
const app = require("./app");
const initSocket = require("./config/socket");
const initSocketsManager = require("./sockets");
const logger = require("./utils/logger");

const startServer = async () => {
  try {
    // 1. Connect to Database (placeholder connection)
    await connectDB();

    // 2. Create HTTP server from Express App
    const server = http.createServer(app);

    // 3. Initialize Socket.IO server configurations
    const io = initSocket(server);

    // 4. Attach socket logic event handlers
    initSocketsManager(io);

    // 5. Start listening on configured port
    const PORT = env.PORT;
    server.listen(PORT, () => {
      logger.info(`Server is listening on port ${PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
};

// Start the application
startServer();
