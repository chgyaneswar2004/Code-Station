const logger = require("../utils/logger");
const { SocketEvent } = require("../utils/constants");
const roomService = require("../services/room.service");

module.exports = (io, socket) => {
  // Return the room's authoritative snapshot to the requesting client.
  socket.on(SocketEvent.REQUEST_DRAWING, () => {
    const roomId = roomService.getRoomId(socket.id);
    if (!roomId) return;

    const drawingData = roomService.getRoomDrawingData(roomId);
    if (drawingData) {
      io.to(socket.id).emit(SocketEvent.SYNC_DRAWING, { drawingData });
    } else {
      io.to(socket.id).emit(SocketEvent.NO_DRAWING_DATA);
    }
  });

  // Seed an empty room once when its first drawing editor is opened.
  socket.on(SocketEvent.DRAWING_SNAPSHOT, ({ drawingData }) => {
    const roomId = roomService.getRoomId(socket.id);
    if (!roomId) return;
    roomService.saveRoomDrawingDataIfAbsent(roomId, drawingData);
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

    // Merge this change into the authoritative full snapshot on the server.
    if (snapshot) {
      roomService.saveRoomDrawingData(roomId, snapshot);
    }

    // Broadcast the drawing update to all other room members
    socket.broadcast.to(roomId).emit(SocketEvent.DRAWING_UPDATE, { snapshot });
    logger.info(`Drawing update broadcasted to room ${roomId}`);
  });
};
