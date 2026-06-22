const logger = require("../utils/logger");
const { SocketEvent } = require("../utils/constants");
const roomService = require("../services/room.service");

module.exports = (io, socket) => {
  // Handle chat message sending
  socket.on(SocketEvent.SEND_MESSAGE, ({ message }) => {
    logger.info("Server received chat message:", message.content ? message.content.substring(0, 50) + "..." : "");
    const roomId = roomService.getRoomId(socket.id);
    
    if (!roomId) {
      logger.error(`No room found for socket: ${socket.id} to send message`);
      return;
    }

    // Save the message to the room's message history
    roomService.saveRoomChatMessage(roomId, message);

    // Broadcast message to all users in the room (including the sender)
    io.to(roomId).emit(SocketEvent.RECEIVE_MESSAGE, { message });
    logger.info(`Message broadcasted to room ${roomId}`);
  });
};
