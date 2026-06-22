const { Server } = require("socket.io");
const logger = require("../utils/logger");

const initSocket = (server) => {
  logger.info("Initializing Socket.IO server...");
  
  const io = new Server(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGIN || "*",
      methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 1e8,
    pingTimeout: 60000,
  });

  return io;
};

module.exports = initSocket;
