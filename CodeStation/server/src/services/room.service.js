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
  if (!drawingData || typeof drawingData !== "object") return;

  // Full tldraw snapshots are authoritative. Change events are merged into
  // the current snapshot so late joiners never receive only the last delta.
  if (drawingData.store && drawingData.schema) {
    roomDrawingData.set(roomId, drawingData);
    logger.info(`Saved drawing snapshot for room ${roomId}`);
    return;
  }

  const current = roomDrawingData.get(roomId);
  if (!current?.store || (!drawingData.added && !drawingData.updated && !drawingData.removed)) return;

  const store = { ...current.store };
  for (const record of Object.values(drawingData.added || {})) {
    store[record.id] = record;
  }
  for (const update of Object.values(drawingData.updated || {})) {
    const record = Array.isArray(update) ? update[1] : update;
    if (record?.id) store[record.id] = record;
  }
  for (const record of Object.values(drawingData.removed || {})) {
    if (record?.id) delete store[record.id];
  }

  roomDrawingData.set(roomId, { ...current, store });
  logger.info(`Applied drawing changes to room ${roomId}`);
};

const saveRoomDrawingDataIfAbsent = (roomId, drawingData) => {
  if (roomDrawingData.has(roomId) || !drawingData?.store || !drawingData?.schema) return false;
  roomDrawingData.set(roomId, drawingData);
  logger.info(`Initialized drawing snapshot for room ${roomId}`);
  return true;
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

const hasRoomState = (roomId) => roomFileStructures.has(roomId);

const reserveRoom = (roomId) => {
  if (roomFileStructures.has(roomId)) return false;
  updateRoomState(roomId, {});
  return true;
};

const restoreRoomSnapshot = (roomId, snapshot) => {
  if (!snapshot || typeof snapshot !== "object") return;
  if (snapshot.fileStructure) {
    updateRoomState(roomId, { fileStructure: snapshot.fileStructure, openFiles: [], activeFile: null });
  }
  if (snapshot.drawingData) roomDrawingData.set(roomId, snapshot.drawingData);
};

const createRoomSnapshot = (roomId) => {
  const state = getRoomState(roomId);
  return {
    schemaVersion: 1,
    roomId,
    savedAt: new Date().toISOString(),
    fileStructure: state?.fileStructure || { name: "root", id: "root", type: "directory", children: [] },
    drawingData: getRoomDrawingData(roomId),
  };
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
  saveRoomDrawingDataIfAbsent,
  getRoomChatMessages,
  saveRoomChatMessage,
  getRoomState,
  hasRoomState,
  reserveRoom,
  updateRoomState,
  restoreRoomSnapshot,
  createRoomSnapshot,
  addUser,
  removeUser,
  updateUserStatus,
  setUserTyping,
  applyFileChangeToStructure
};
