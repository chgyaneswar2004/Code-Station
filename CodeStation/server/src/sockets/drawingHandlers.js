const logger = require("../utils/logger");
const { SocketEvent } = require("../utils/constants");
const roomService = require("../services/room.service");

module.exports = (io, socket) => {
  // Handle request for drawing data from a new user
  socket.on(SocketEvent.REQUEST_DRAWING, () => {
    const roomId = roomService.getRoomId(socket.id);
    if (!roomId) return;
    
    socket.broadcast
      .to(roomId)
      .emit(SocketEvent.REQUEST_DRAWING, { socketId: socket.id });
  });

  // Handle syncing drawing data back to the requesting user
  socket.on(SocketEvent.SYNC_DRAWING, ({ drawingData, socketId }) => {
    const roomId = roomService.getRoomId(socket.id);
    if (!roomId) return;

    // Save the drawing data to persistent storage
    if (drawingData && Object.keys(drawingData).length > 0) {
      roomService.saveRoomDrawingData(roomId, drawingData);
    }

    // Direct message back to the user who requested the drawing state
    io.to(socketId).emit(SocketEvent.SYNC_DRAWING, { drawingData });
  });

  // Handle active drawing canvas updates (real-time stroke stream)
  socket.on(SocketEvent.DRAWING_UPDATE, ({ snapshot }) => {
    const roomId = roomService.getRoomId(socket.id);
    logger.info(`Drawing update from socket ${socket.id} in room ${roomId}`);
    
    if (!roomId) {
      logger.error(`No room found for drawing update from socket: ${socket.id}`);
      return;
    }

    // Save the updated drawing data snapshot to room service
    if (snapshot) {
      roomService.saveRoomDrawingData(roomId, snapshot);
    }

    // Broadcast the drawing update to all other room members
    socket.broadcast.to(roomId).emit(SocketEvent.DRAWING_UPDATE, { snapshot });
    logger.info(`Drawing update broadcasted to room ${roomId}`);
  });
};
