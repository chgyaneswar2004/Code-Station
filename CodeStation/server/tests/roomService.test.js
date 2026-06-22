const assert = require("assert");
const roomService = require("../src/services/room.service");
const { USER_CONNECTION_STATUS } = require("../src/utils/constants");

console.log("Running Room Service unit tests...");

try {
  // Test addUser
  const user = roomService.addUser("test-user", "room-123", "socket-xyz");
  assert.strictEqual(user.username, "test-user");
  assert.strictEqual(user.roomId, "room-123");
  assert.strictEqual(user.socketId, "socket-xyz");
  assert.strictEqual(user.status, USER_CONNECTION_STATUS.ONLINE);
  console.log("✓ addUser passed");

  // Test getUsersInRoom
  const users = roomService.getUsersInRoom("room-123");
  assert.strictEqual(users.length, 1);
  assert.strictEqual(users[0].username, "test-user");
  console.log("✓ getUsersInRoom passed");

  // Test getRoomId
  const roomId = roomService.getRoomId("socket-xyz");
  assert.strictEqual(roomId, "room-123");
  console.log("✓ getRoomId passed");

  // Test getUserBySocketId
  const foundUser = roomService.getUserBySocketId("socket-xyz");
  assert.strictEqual(foundUser.username, "test-user");
  console.log("✓ getUserBySocketId passed");

  // Test updateUserStatus
  roomService.updateUserStatus("socket-xyz", USER_CONNECTION_STATUS.OFFLINE);
  const updatedUser = roomService.getUserBySocketId("socket-xyz");
  assert.strictEqual(updatedUser.status, USER_CONNECTION_STATUS.OFFLINE);
  console.log("✓ updateUserStatus passed");

  // Test setUserTyping
  roomService.setUserTyping("socket-xyz", true, 42);
  const typingUser = roomService.getUserBySocketId("socket-xyz");
  assert.strictEqual(typingUser.typing, true);
  assert.strictEqual(typingUser.cursorPosition, 42);
  console.log("✓ setUserTyping passed");

  // Test removeUser
  roomService.removeUser("socket-xyz");
  const usersAfterRemoval = roomService.getUsersInRoom("room-123");
  assert.strictEqual(usersAfterRemoval.length, 0);
  console.log("✓ removeUser passed");

  console.log("\nAll room service tests passed successfully!");
} catch (error) {
  console.error("\nFAIL: A test assertion failed:");
  console.error(error);
  process.exit(1);
}
