const logger = require("../utils/logger");
const { SocketEvent, USER_CONNECTION_STATUS } = require("../utils/constants");
const roomService = require("../services/room.service");
const roomSnapshotStorage = require("../services/roomSnapshot.storage");
const { randomInt } = require("crypto");

const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generateRoomCode = () => Array.from({ length: 5 }, () =>
  ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)]
).join("");

module.exports = (io, socket) => {
  // Handle user actions: join request
  socket.on(SocketEvent.JOIN_REQUEST, async ({ roomId, username }) => {
    if (typeof roomId !== "string" || !/^[A-Z0-9]{5}$/.test(roomId) || typeof username !== "string") {
      io.to(socket.id).emit(SocketEvent.ROOM_NOT_FOUND);
      return;
    }
    logger.info(`User ${username} attempting to join room ${roomId}`);

    const existingUsers = roomService.getUsersInRoom(roomId);
    const isUsernameExist = existingUsers.filter((u) => u.username === username);
    if (isUsernameExist.length > 0) {
      logger.warn(`Username ${username} already exists in room ${roomId}`);
      io.to(socket.id).emit(SocketEvent.USERNAME_EXISTS);
      return;
    }

    // Load a saved room before admitting the user so the first sync is complete.
    if (!roomService.hasRoomState(roomId) && !roomService.getRoomDrawingData(roomId) && existingUsers.length === 0) {
      try {
        const snapshot = await roomSnapshotStorage.loadRoomSnapshot(roomId);
        if (snapshot) roomService.restoreRoomSnapshot(roomId, snapshot);
        else {
          io.to(socket.id).emit(SocketEvent.ROOM_NOT_FOUND);
          return;
        }
      } catch (error) {
        logger.error(`Failed to load snapshot for room ${roomId}:`, error);
        io.to(socket.id).emit(SocketEvent.ROOM_ERROR, { message: "Could not load this room snapshot. Please try again." });
        return;
      }
    }

    // Add user to room state
    const user = roomService.addUser(username, roomId, socket.id);
    socket.join(roomId);
    logger.info(`User ${username} joined room ${roomId} with socket ${socket.id}`);
    
    const users = roomService.getUsersInRoom(roomId);
    logger.info(`Current users in room ${roomId}: ${users.map(u => u.username).join(", ")}`);
    
    // Send join accepted first
    io.to(socket.id).emit(SocketEvent.JOIN_ACCEPTED, { user, users });
    
    // Notify other users
    socket.broadcast.to(roomId).emit(SocketEvent.USER_JOINED, { user });
    
    // Send existing chat messages to the new user
    const existingMessages = roomService.getRoomChatMessages(roomId);
    if (existingMessages.length > 0) {
      logger.info(`Sending ${existingMessages.length} existing messages to user ${username} in room ${roomId}`);
      io.to(socket.id).emit(SocketEvent.SYNC_MESSAGES, { messages: existingMessages });
    }
    
    // Check if there's existing drawing data for this room
    const existingDrawingData = roomService.getRoomDrawingData(roomId);
    if (existingDrawingData && Object.keys(existingDrawingData).length > 0) {
      logger.info(`Sending existing drawing data to new user ${username} in room ${roomId}`);
      io.to(socket.id).emit(SocketEvent.SYNC_DRAWING, { drawingData: existingDrawingData });
    } else {
      logger.info(`No existing drawing data for room ${roomId}`);
      io.to(socket.id).emit(SocketEvent.NO_DRAWING_DATA);
    }

    // Send current file structure and open files for the room
    const roomState = roomService.getRoomState(roomId);
    if (roomState) {
      io.to(socket.id).emit(SocketEvent.SYNC_FILE_STRUCTURE, {
        fileStructure: roomState.fileStructure,
        openFiles: roomState.openFiles,
        activeFile: roomState.activeFile,
      });
    } else {
      // Send empty initial structure if no state exists
      io.to(socket.id).emit(SocketEvent.SYNC_FILE_STRUCTURE, {
        fileStructure: { name: "root", id: "root", type: "directory", children: [] },
        openFiles: [],
        activeFile: null,
      });
    }
  });

  socket.on(SocketEvent.CREATE_ROOM, async (acknowledge) => {
    try {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const roomId = generateRoomCode();
        if (roomService.hasRoomState(roomId) || roomService.getUsersInRoom(roomId).length > 0) continue;

        const snapshot = {
          schemaVersion: 1,
          roomId,
          savedAt: new Date().toISOString(),
          fileStructure: { name: "root", id: "root", type: "directory", children: [] },
          drawingData: null,
        };
        if (!await roomSnapshotStorage.createRoomSnapshotIfAbsent(snapshot)) continue;
        roomService.reserveRoom(roomId);
        acknowledge?.({ ok: true, roomId });
        return;
      }
      acknowledge?.({ ok: false, message: "Could not find an available room code. Try again." });
    } catch (error) {
      logger.error("Failed to create a room:", error);
      acknowledge?.({ ok: false, message: "Could not create a room. Check S3 access and try again." });
    }
  });

  socket.on(SocketEvent.SAVE_ROOM, async (_payload, acknowledge) => {
    const roomId = roomService.getRoomId(socket.id);
    if (!roomId) {
      acknowledge?.({ ok: false, message: "Join a room before saving." });
      return;
    }

    try {
      const snapshot = roomService.createRoomSnapshot(roomId);
      const result = await roomSnapshotStorage.saveRoomSnapshot(snapshot);
      acknowledge?.({ ok: true, ...result });
      logger.info(`Saved snapshot for room ${roomId} (${result.bytes} bytes)`);
    } catch (error) {
      logger.error(`Failed to save snapshot for room ${roomId}:`, error);
      acknowledge?.({ ok: false, message: error.code === "S3_NOT_CONFIGURED"
        ? "S3 storage is not configured on the server yet."
        : "Could not save this room to S3. Check server storage access and try again." });
    }
  });

  // Handle disconnecting
  socket.on("disconnecting", () => {
    const user = roomService.getUserBySocketId(socket.id);
    if (!user) {
      logger.info(`User not found for disconnecting socket: ${socket.id}`);
      return;
    }
    const roomId = user.roomId;
    logger.info(`User ${user.username} disconnecting from room ${roomId}`);
    
    socket.broadcast.to(roomId).emit(SocketEvent.USER_DISCONNECTED, { user });
    
    roomService.removeUser(socket.id);
    socket.leave(roomId);
    logger.info(`User ${user.username} removed from room ${roomId}`);
  });

  // Handle user online/offline status
  socket.on(SocketEvent.USER_OFFLINE, ({ socketId }) => {
    roomService.updateUserStatus(socketId, USER_CONNECTION_STATUS.OFFLINE);
    const roomId = roomService.getRoomId(socketId);
    if (!roomId) return;
    socket.broadcast.to(roomId).emit(SocketEvent.USER_OFFLINE, { socketId });
  });

  socket.on(SocketEvent.USER_ONLINE, ({ socketId }) => {
    roomService.updateUserStatus(socketId, USER_CONNECTION_STATUS.ONLINE);
    const roomId = roomService.getRoomId(socketId);
    if (!roomId) return;
    socket.broadcast.to(roomId).emit(SocketEvent.USER_ONLINE, { socketId });
  });

  // Handle cursor position and typing activity
  socket.on(SocketEvent.TYPING_START, ({ cursorPosition }) => {
    roomService.setUserTyping(socket.id, true, cursorPosition);
    const user = roomService.getUserBySocketId(socket.id);
    if (!user) return;
    socket.broadcast.to(user.roomId).emit(SocketEvent.TYPING_START, { user });
  });

  socket.on(SocketEvent.TYPING_PAUSE, () => {
    roomService.setUserTyping(socket.id, false);
    const user = roomService.getUserBySocketId(socket.id);
    if (!user) return;
    socket.broadcast.to(user.roomId).emit(SocketEvent.TYPING_PAUSE, { user });
  });
};
