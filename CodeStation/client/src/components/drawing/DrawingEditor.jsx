import { useAppContext } from "@/context/AppContext";
import { useSocket } from "@/context/SocketContext";
import { SocketEvent } from "@/types/socket";
import useWindowDimensions from "@/hooks/useWindowDimensions";
import { useCallback, useEffect, useRef } from "react";
import { Tldraw, useEditor } from "tldraw";

/**
 * Wrapper component for the collaborative drawing editor using Tldraw.
 */
function DrawingEditor() {
    const { isMobile } = useWindowDimensions();

    return (
        <Tldraw
            inferDarkMode
            forceMobile={isMobile}
            defaultName="Editor"
            className="z-0"
        >
            <ReachEditor />
        </Tldraw>
    );
}

/**
 * Handles synchronization of the editor with remote clients.
 */
function ReachEditor() {
    const editor = useEditor();
    const { drawingData } = useAppContext();
    const { socket } = useSocket();
    const loadedSnapshotRef = useRef(null);
    const emptySnapshotRef = useRef(editor.store.getSnapshot());

    // Handle local drawing changes and emit to other clients
    const handleChangeEvent = useCallback((change) => {
        const snapshot = change.changes;
        socket.emit(SocketEvent.DRAWING_UPDATE, { snapshot });
    }, [socket]);

    // Handle incoming drawing updates from remote clients
    const handleRemoteDrawing = useCallback(({ snapshot }) => {
        editor.store.mergeRemoteChanges(() => {
            const { added, updated, removed } = snapshot;

            Object.values(added).forEach((record) => {
                editor.store.put([record]);
            });
            Object.values(updated).forEach(([, to]) => {
                editor.store.put([to]);
            });
            Object.values(removed).forEach((record) => {
                editor.store.remove([record.id]);
            });
        });

    }, [editor.store]);

    // Apply server snapshots whether they arrive before or after the editor mounts.
    useEffect(() => {
        if (!drawingData?.store || loadedSnapshotRef.current === drawingData) return;
        editor.store.mergeRemoteChanges(() => editor.store.loadSnapshot(drawingData));
        loadedSnapshotRef.current = drawingData;
    }, [drawingData, editor.store]);

    useEffect(() => {
        const clearDrawing = () => {
            editor.store.mergeRemoteChanges(() => editor.store.loadSnapshot(emptySnapshotRef.current));
            loadedSnapshotRef.current = null;
        };
        window.addEventListener("drawing:no-data", clearDrawing);
        return () => window.removeEventListener("drawing:no-data", clearDrawing);
    }, [editor.store]);

    // Seed the room only if it has no snapshot yet; the server never overwrites
    // a drawing that another participant already created.
    useEffect(() => {
        socket.emit(SocketEvent.DRAWING_SNAPSHOT, { drawingData: editor.store.getSnapshot() });
    }, [editor.store, socket]);

    // Set up event listeners for drawing changes and socket events
    useEffect(() => {
        const cleanupFunction = editor.store.listen(handleChangeEvent, {
            source: "user",
            scope: "document",
        });

        socket.on(SocketEvent.DRAWING_UPDATE, handleRemoteDrawing);

        return () => {
            cleanupFunction();
            socket.off(SocketEvent.DRAWING_UPDATE);
        };
    }, [editor.store, handleChangeEvent, handleRemoteDrawing, socket]);

    return null;
}

export default DrawingEditor;
