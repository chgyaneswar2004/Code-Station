const SocketEvent = {
	JOIN_REQUEST: "join-request",
	USERNAME_EXISTS: "username-exists",
	USER_JOINED: "user-joined",
	JOIN_ACCEPTED: "join-accepted",
	ROOM_ERROR: "room-error",
	ROOM_NOT_FOUND: "room-not-found",
	CREATE_ROOM: "create-room",
	SAVE_ROOM: "save-room",
	ROOM_SAVED: "room-saved",
	USER_DISCONNECTED: "user-disconnected",
	SYNC_FILE_STRUCTURE: "sync-file-structure",
	DIRECTORY_CREATED: "directory-created",
	DIRECTORY_UPDATED: "directory-updated",
	DIRECTORY_RENAMED: "directory-renamed",
	DIRECTORY_DELETED: "directory-deleted",
	FILE_CREATED: "file-created",
	FILE_UPDATED: "file-updated",
	FILE_RENAMED: "file-renamed",
	FILE_DELETED: "file-deleted",
	USER_OFFLINE: "offline",
	USER_ONLINE: "online",
	SEND_MESSAGE: "send-message",
	RECEIVE_MESSAGE: "receive-message",
	SYNC_MESSAGES: "sync-messages",
	TYPING_START: "typing-start",
	TYPING_PAUSE: "typing-pause",
	REQUEST_DRAWING: "request-drawing",
	SYNC_DRAWING: "sync-drawing",
	DRAWING_SNAPSHOT: "drawing-snapshot",
	DRAWING_UPDATE: "DRAWING_UPDATE",
	NO_DRAWING_DATA: "no-drawing-data",
	ACTIVE_FILE_CHANGED: "active-file-changed",
	CLOSE_FILE_TAB: "close-file-tab"
};

const USER_CONNECTION_STATUS = {
	ONLINE: "ONLINE",
	OFFLINE: "OFFLINE"
};

module.exports = {
	SocketEvent,
	USER_CONNECTION_STATUS
};
