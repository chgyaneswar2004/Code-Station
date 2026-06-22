const logger = require("../utils/logger");
const registerRoomHandlers = require("./roomHandlers");
const registerFileHandlers = require("./fileHandlers");
const registerMessageHandlers = require("./messageHandlers");
const registerDrawingHandlers = require("./drawingHandlers");

const initSockets = (io) => {
  io.on("connection", (socket) => {
    logger.info(`Socket connection established: ${socket.id}`);

    // Mount sub-handlers passing io and socket instances
    registerRoomHandlers(io, socket);
    registerFileHandlers(io, socket);
    registerMessageHandlers(io, socket);
    registerDrawingHandlers(io, socket);
  });
};

module.exports = initSockets;
