const { SocketEvent } = require("../utils/constants");
const roomService = require("../services/room.service");

module.exports = (io, socket) => {
  // Handle general file structure sync
  socket.on(
    SocketEvent.SYNC_FILE_STRUCTURE,
    ({ fileStructure, openFiles, activeFile }) => {
      const roomId = roomService.getRoomId(socket.id);
      if (!roomId) return;
      
      roomService.updateRoomState(roomId, { fileStructure, openFiles, activeFile });
      socket.broadcast.to(roomId).emit(SocketEvent.SYNC_FILE_STRUCTURE, {
        fileStructure,
        openFiles,
        activeFile,
      });
    }
  );

  // Handle directory creation
  socket.on(SocketEvent.DIRECTORY_CREATED, ({ parentDirId, newDirectory }) => {
    const roomId = roomService.getRoomId(socket.id);
    if (!roomId) return;

    const prev = roomService.getRoomState(roomId);
    const fileStructure = prev ? prev.fileStructure : { name: "root", id: "root", type: "directory", children: [] };
    
    const addDir = (dir) => {
      if (dir.id === parentDirId) {
        return { ...dir, children: [...(dir.children || []), newDirectory] };
      } else if (dir.children) {
        return { ...dir, children: dir.children.map(addDir) };
      }
      return dir;
    };

    const updatedStructure = roomService.applyFileChangeToStructure(fileStructure, addDir);
    roomService.updateRoomState(roomId, { fileStructure: updatedStructure });
    socket.broadcast.to(roomId).emit(SocketEvent.DIRECTORY_CREATED, { parentDirId, newDirectory });
  });

  // Handle directory updating (children order/composition)
  socket.on(SocketEvent.DIRECTORY_UPDATED, ({ dirId, children }) => {
    const roomId = roomService.getRoomId(socket.id);
    if (!roomId) return;

    const prev = roomService.getRoomState(roomId);
    const fileStructure = prev ? prev.fileStructure : { name: "root", id: "root", type: "directory", children: [] };
    
    const updateDir = (dir) => {
      if (dir.id === dirId) return { ...dir, children };
      if (dir.children) return { ...dir, children: dir.children.map(updateDir) };
      return dir;
    };

    const updatedStructure = updateDir(fileStructure);
    roomService.updateRoomState(roomId, { fileStructure: updatedStructure });
    socket.broadcast.to(roomId).emit(SocketEvent.DIRECTORY_UPDATED, { dirId, children });
  });

  // Handle directory renaming
  socket.on(SocketEvent.DIRECTORY_RENAMED, ({ dirId, newName }) => {
    const roomId = roomService.getRoomId(socket.id);
    if (!roomId) return;

    const prev = roomService.getRoomState(roomId);
    const fileStructure = prev ? prev.fileStructure : { name: "root", id: "root", type: "directory", children: [] };
    
    const renameDir = (dir) => {
      if (dir.id === dirId) return { ...dir, name: newName };
      if (dir.children) return { ...dir, children: dir.children.map(renameDir) };
      return dir;
    };

    const updatedStructure = renameDir(fileStructure);
    roomService.updateRoomState(roomId, { fileStructure: updatedStructure });
    socket.broadcast.to(roomId).emit(SocketEvent.DIRECTORY_RENAMED, { dirId, newName });
  });

  // Handle directory deletion
  socket.on(SocketEvent.DIRECTORY_DELETED, ({ dirId }) => {
    const roomId = roomService.getRoomId(socket.id);
    if (!roomId) return;

    const prev = roomService.getRoomState(roomId);
    const fileStructure = prev ? prev.fileStructure : { name: "root", id: "root", type: "directory", children: [] };
    
    const removeDir = (dir) => {
      if (dir.id === dirId) return null;
      if (dir.children) {
        const children = dir.children.map(removeDir).filter(Boolean);
        return { ...dir, children };
      }
      return dir;
    };

    const updatedStructure = removeDir(fileStructure);
    roomService.updateRoomState(roomId, { fileStructure: updatedStructure });
    socket.broadcast.to(roomId).emit(SocketEvent.DIRECTORY_DELETED, { dirId });
  });

  // Handle file creation
  socket.on(SocketEvent.FILE_CREATED, ({ parentDirId, newFile }) => {
    const roomId = roomService.getRoomId(socket.id);
    if (!roomId) return;

    const prev = roomService.getRoomState(roomId);
    const fileStructure = prev ? prev.fileStructure : { name: "root", id: "root", type: "directory", children: [] };
    
    const addFile = (dir) => {
      if (dir.id === parentDirId) {
        return { ...dir, children: [...(dir.children || []), newFile] };
      } else if (dir.children) {
        return { ...dir, children: dir.children.map(addFile) };
      }
      return dir;
    };

    const updatedStructure = roomService.applyFileChangeToStructure(fileStructure, addFile);
    roomService.updateRoomState(roomId, { fileStructure: updatedStructure });
    socket.broadcast.to(roomId).emit(SocketEvent.FILE_CREATED, { parentDirId, newFile });
  });

  // Handle file update (content change)
  socket.on(SocketEvent.FILE_UPDATED, ({ fileId, newContent }) => {
    const roomId = roomService.getRoomId(socket.id);
    if (!roomId) return;

    const prev = roomService.getRoomState(roomId);
    const fileStructure = prev ? prev.fileStructure : { name: "root", id: "root", type: "directory", children: [] };
    
    const updateFile = (dir) => {
      if (dir.type === "file" && dir.id === fileId) return { ...dir, content: newContent };
      if (dir.children) return { ...dir, children: dir.children.map(updateFile) };
      return dir;
    };

    const updatedStructure = updateFile(fileStructure);
    roomService.updateRoomState(roomId, { fileStructure: updatedStructure });
    socket.broadcast.to(roomId).emit(SocketEvent.FILE_UPDATED, { fileId, newContent });
  });

  // Handle file renaming
  socket.on(SocketEvent.FILE_RENAMED, ({ fileId, newName }) => {
    const roomId = roomService.getRoomId(socket.id);
    if (!roomId) return;

    const prev = roomService.getRoomState(roomId);
    const fileStructure = prev ? prev.fileStructure : { name: "root", id: "root", type: "directory", children: [] };
    
    const renameFile = (dir) => {
      if (dir.type === "file" && dir.id === fileId) return { ...dir, name: newName };
      if (dir.children) return { ...dir, children: dir.children.map(renameFile) };
      return dir;
    };

    const updatedStructure = renameFile(fileStructure);
    roomService.updateRoomState(roomId, { fileStructure: updatedStructure });
    socket.broadcast.to(roomId).emit(SocketEvent.FILE_RENAMED, { fileId, newName });
  });

  // Handle file deletion
  socket.on(SocketEvent.FILE_DELETED, ({ fileId }) => {
    const roomId = roomService.getRoomId(socket.id);
    if (!roomId) return;

    const prev = roomService.getRoomState(roomId);
    const fileStructure = prev ? prev.fileStructure : { name: "root", id: "root", type: "directory", children: [] };
    
    const removeFile = (dir) => {
      if (dir.type === "file" && dir.id === fileId) return null;
      if (dir.children) {
        const children = dir.children.map(removeFile).filter(Boolean);
        return { ...dir, children };
      }
      return dir;
    };

    const updatedStructure = removeFile(fileStructure);
    roomService.updateRoomState(roomId, { fileStructure: updatedStructure });
    socket.broadcast.to(roomId).emit(SocketEvent.FILE_DELETED, { fileId });
  });

  // Handle tab routing (active tab selection)
  socket.on(SocketEvent.ACTIVE_FILE_CHANGED, ({ fileId }) => {
    const roomId = roomService.getRoomId(socket.id);
    if (!roomId) return;

    const prev = roomService.getRoomState(roomId);
    const fileStructure = prev ? prev.fileStructure : { name: "root", id: "root", type: "directory", children: [] };
    
    const findFile = (dir, id) => {
      if (dir.type === "file" && dir.id === id) return dir;
      if (dir.children) {
        for (const child of dir.children) {
          const found = findFile(child, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    const fileObj = findFile(fileStructure, fileId);
    let openFiles = prev ? prev.openFiles || [] : [];
    if (fileObj && !openFiles.some(f => f.id === fileId)) {
      openFiles = [...openFiles, fileObj];
    }
    
    roomService.updateRoomState(roomId, { activeFile: fileObj, openFiles });
    socket.broadcast.to(roomId).emit(SocketEvent.ACTIVE_FILE_CHANGED, { fileId });
  });

  // Handle closing file tabs
  socket.on(SocketEvent.CLOSE_FILE_TAB, ({ fileId }) => {
    const roomId = roomService.getRoomId(socket.id);
    if (!roomId) return;

    const prev = roomService.getRoomState(roomId);
    let openFiles = prev ? prev.openFiles || [] : [];
    openFiles = openFiles.filter(f => f.id !== fileId);
    
    const activeFile = prev && prev.activeFile && prev.activeFile.id === fileId ? null : prev.activeFile;
    
    roomService.updateRoomState(roomId, { openFiles, activeFile });
    socket.broadcast.to(roomId).emit(SocketEvent.CLOSE_FILE_TAB, { fileId });
  });
};
