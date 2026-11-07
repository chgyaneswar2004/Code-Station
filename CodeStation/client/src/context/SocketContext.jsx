import {
    createContext,
    useContext,
    useMemo,
    useEffect,
    useCallback,
    useRef
} from "react"
import { toast } from "react-hot-toast"
import { io } from "socket.io-client"
import { useAppContext } from "./AppContext"
import { USER_STATUS } from "@/types/user"

// Custom event constants (make sure these are defined properly in your project)
import { SocketEvent } from "@/types/socket"

const SocketContext = createContext(null)

export const useSocket = () => {
    const context = useContext(SocketContext)
    if (!context) {
        throw new Error("useSocket must be used within a SocketProvider")
    }
    return context
}

const BACKEND_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_SERVER_URL || (import.meta.env.DEV ? "http://localhost:3000" : window.location.origin)

const SocketProvider = ({ children }) => {
    const {
        users,
        setUsers,
        currentUser,
        setStatus,
        setCurrentUser,
        setDrawingData,
    } = useAppContext()

    const socket = useMemo(() => io(BACKEND_URL, { reconnectionAttempts: Infinity, reconnectionDelayMax: 5000, transports: ["websocket", "polling"] }), [])
    const syncTimeoutRef = useRef(null)
    const hasJoinedRoomRef = useRef(false)

    const handleError = useCallback((err) => {
        console.error("Socket error:", err)
        setStatus(USER_STATUS.CONNECTION_FAILED)
        toast.dismiss()
        toast.error("Failed to connect to the server")
    }, [setStatus])

    const handleUsernameExist = useCallback(() => {
        hasJoinedRoomRef.current = false
        toast.dismiss()
        setStatus(USER_STATUS.INITIAL)
        toast.error(
            "The username you chose already exists in the room. Please choose a different username."
        )
    }, [setStatus])

    const handleJoiningAccept = useCallback(({ user, users }) => {
        hasJoinedRoomRef.current = true
        setCurrentUser(user)
        setUsers(users)
        toast.dismiss()
        setStatus(USER_STATUS.JOINED)

        // Only show loading toast if there are other users (potential data to sync)
        if (users.length > 1) {
            toast.loading("Syncing data, please wait...")
            
            // Set a timeout to dismiss the loading toast if sync takes too long
            syncTimeoutRef.current = setTimeout(() => {
                toast.dismiss()
                console.log("Sync timeout - dismissing loading toast")
            }, 5000) // 5 second timeout
        }
    }, [setCurrentUser, setStatus, setUsers])

    const handleUserLeft = useCallback(({ user }) => {
        toast.success(`${user.username} left the room`)
        setUsers((prevUsers) => prevUsers.filter(u => u.username !== user.username))
    }, [setUsers])

    const handleUserJoined = useCallback(({ user }) => {
        setUsers((prevUsers) => {
            // Avoid duplicates
            if (prevUsers.some(u => u.username === user.username)) return prevUsers;
            return [...prevUsers, user];
        });
        toast.success(`${user.username} joined the room`);
    }, [setUsers]);

    const handleDrawingSync = useCallback(({ drawingData }) => {
        setDrawingData(drawingData);
        
        // Clear the sync timeout and dismiss loading toast
        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current)
            syncTimeoutRef.current = null
        }
        toast.dismiss();
    }, [setDrawingData])

    // Handle when there's no drawing data to sync (new event from backend)
    const handleNoDrawingData = useCallback(() => {
        setDrawingData(null)
        window.dispatchEvent(new Event("drawing:no-data"))
        // Clear the sync timeout and dismiss loading toast
        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current)
            syncTimeoutRef.current = null
        }
        toast.dismiss();
    }, [setDrawingData])

    const handleRoomError = useCallback(({ message }) => {
        hasJoinedRoomRef.current = false
        toast.dismiss()
        setStatus(USER_STATUS.INITIAL)
        toast.error(message || "Could not load this room.")
    }, [setStatus])

    const handleRoomNotFound = useCallback(() => {
        hasJoinedRoomRef.current = false
        toast.dismiss()
        setStatus(USER_STATUS.INITIAL)
        toast.error("Room not found. Create a new room or check the five-character code.")
    }, [setStatus])

    useEffect(() => {
        const handleReconnect = () => {
            if (hasJoinedRoomRef.current && currentUser.username && currentUser.roomId) {
                socket.emit(SocketEvent.JOIN_REQUEST, currentUser)
            }
        }
        socket.on("connect", handleReconnect)
        return () => socket.off("connect", handleReconnect)
    }, [currentUser, socket])



    useEffect(() => {
        socket.on("connect_error", handleError)
        socket.on("connect_failed", handleError)
        socket.on(SocketEvent.USERNAME_EXISTS, handleUsernameExist)
        socket.on(SocketEvent.JOIN_ACCEPTED, handleJoiningAccept)
        socket.on(SocketEvent.USER_JOINED, handleUserJoined)
        socket.on(SocketEvent.USER_DISCONNECTED, handleUserLeft)
        socket.on(SocketEvent.SYNC_DRAWING, handleDrawingSync)
        // Add handler for no drawing data event
        socket.on(SocketEvent.NO_DRAWING_DATA, handleNoDrawingData)
        socket.on(SocketEvent.ROOM_ERROR, handleRoomError)
        socket.on(SocketEvent.ROOM_NOT_FOUND, handleRoomNotFound)


        return () => {
            // Clear timeout on cleanup
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current)
            }
            
            socket.off("connect_error", handleError)
            socket.off("connect_failed", handleError)
            socket.off(SocketEvent.USERNAME_EXISTS, handleUsernameExist)
            socket.off(SocketEvent.JOIN_ACCEPTED, handleJoiningAccept)
            socket.off(SocketEvent.USER_JOINED, handleUserJoined)
            socket.off(SocketEvent.USER_DISCONNECTED, handleUserLeft)
            socket.off(SocketEvent.SYNC_DRAWING, handleDrawingSync)
            socket.off(SocketEvent.NO_DRAWING_DATA, handleNoDrawingData)
            socket.off(SocketEvent.ROOM_ERROR, handleRoomError)
            socket.off(SocketEvent.ROOM_NOT_FOUND, handleRoomNotFound)

        }
    }, [
        handleError,
        handleUsernameExist,
        handleJoiningAccept,
        handleUserJoined,
        handleUserLeft,
        handleDrawingSync,
        handleNoDrawingData,
        handleRoomError,
        handleRoomNotFound,
        socket,
    ])

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    )
}

export { SocketProvider }
export default SocketContext
