const logger = require("../utils/logger");
const { USER_CONNECTION_STATUS } = require("../utils/constants");

// In-memory state collections
let userSocketMap = [];
const roomDrawingData = new Map(); // roomId -> drawingData
const roomChatMessages = new Map(); // roomId -> array of messages
const roomFileStructures = new Map(); // roomId -> { fileStructure, openFiles, activeFile }

// Getter/setter functions
const getUsersInRoom = (roomId) => {
  return userSocketMap.filter((user) => user.roomId == roomId);
};

const getRoomId = (socketId) => {
  const roomId = userSocketMap.find((user) => user.socketId === socketId)?.roomId;
  if (!roomId) {
    logger.error("Room ID is undefined for socket ID:", socketId);
    return null;
  }
  return roomId;
};

const getUserBySocketId = (socketId) => {
  const user = userSocketMap.find((user) => user.socketId === socketId);
  if (!user) {
    logger.error("User not found for socket ID:", socketId);
    return null;
  }
  return user;
};

const getRoomDrawingData = (roomId) => {
  return roomDrawingData.get(roomId) || null;
};

const saveRoomDrawingData = (roomId, drawingData) => {
  roomDrawingData.set(roomId, drawingData);
  logger.info(`Saved drawing data for room ${roomId}`);
};

const getRoomChatMessages = (roomId) => {
  return roomChatMessages.get(roomId) || [];
};

const saveRoomChatMessage = (roomId, message) => {
  const messages = roomChatMessages.get(roomId) || [];
  messages.push(message);
  roomChatMessages.set(roomId, messages);
  logger.info(`Saved message to room ${roomId}: ${message.content}`);
};

const getRoomState = (roomId) => {
  return roomFileStructures.get(roomId) || null;
};

const updateRoomState = (roomId, partial) => {
  const prev = roomFileStructures.get(roomId) || {
    fileStructure: { name: "root", id: "root", type: "directory", children: [] },
    openFiles: [],
    activeFile: null
  };
  roomFileStructures.set(roomId, { ...prev, ...partial });
};

// User list mutations
const addUser = (username, roomId, socketId) => {
  const user = {
    username,
    roomId,
    status: USER_CONNECTION_STATUS.ONLINE,
    cursorPosition: 0,
    typing: false,
    socketId,
    currentFile: null
  };
  userSocketMap.push(user);
  return user;
};

const removeUser = (socketId) => {
  const user = getUserBySocketId(socketId);
  if (user) {
    userSocketMap = userSocketMap.filter((u) => u.socketId !== socketId);
  }
  return user;
};

const updateUserStatus = (socketId, status) => {
  let updatedUser = null;
  userSocketMap = userSocketMap.map((user) => {
    if (user.socketId === socketId) {
      updatedUser = { ...user, status };
      return updatedUser;
    }
    return user;
  });
  return updatedUser;
};

const setUserTyping = (socketId, typing, cursorPosition = 0) => {
  let updatedUser = null;
  userSocketMap = userSocketMap.map((user) => {
    if (user.socketId === socketId) {
      updatedUser = { ...user, typing, cursorPosition };
      return updatedUser;
    }
    return user;
  });
  return updatedUser;
};

const applyFileChangeToStructure = (structure, changeFn) => {
  return changeFn(structure);
};

module.exports = {
  getUsersInRoom,
  getRoomId,
  getUserBySocketId,
  getRoomDrawingData,
  saveRoomDrawingData,
  getRoomChatMessages,
  saveRoomChatMessage,
  getRoomState,
  updateRoomState,
  addUser,
  removeUser,
  updateUserStatus,
  setUserTyping,
  applyFileChangeToStructure
};
