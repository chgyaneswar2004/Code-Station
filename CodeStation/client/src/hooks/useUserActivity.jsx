import { useAppContext } from "@/context/AppContext"
import { useSocket } from "@/context/SocketContext"
import { useCallback, useEffect } from "react"
import { SocketEvent } from "@/types/socket"
import { USER_CONNECTION_STATUS } from "@/types/user"

function useUserActivity() {
    const { setUsers } = useAppContext()
    const { socket } = useSocket()

    // Handle user visibility change events
    const handleUserVisibilityChange = useCallback(() => {
        if (document.visibilityState === "visible") {
            socket.emit(SocketEvent.USER_ONLINE, { socketId: socket.id })
        } else if (document.visibilityState === "hidden") {
            socket.emit(SocketEvent.USER_OFFLINE, { socketId: socket.id })
        }
    }, [socket])

    // Handle user coming online
    const handleUserOnline = useCallback(({ socketId }) => {
        setUsers((users) => {
            return users.map((user) => {
                if (user.socketId === socketId) {
                    return {
                        ...user,
                        status: USER_CONNECTION_STATUS.ONLINE,
                    }
                }
                return user
            })
        })
    }, [setUsers])

    // Handle user going offline
    const handleUserOffline = useCallback(({ socketId }) => {
        setUsers((users) => {
            return users.map((user) => {
                if (user.socketId === socketId) {
                    return {
                        ...user,
                        status: USER_CONNECTION_STATUS.OFFLINE,
                    }
                }
                return user
            })
        })
    }, [setUsers])

    // Handle user typing events
    const handleUserTyping = useCallback(({ user }) => {
        if (!user) return
        
        setUsers((users) => {
            return users.map((u) => {
                if (u.socketId === user.socketId) {
                    return user
                }
                return u
            })
        })
    }, [setUsers])

    // Effect to set up event listeners and socket handlers
    useEffect(() => {
        document.addEventListener("visibilitychange", handleUserVisibilityChange)

        socket.on(SocketEvent.USER_ONLINE, handleUserOnline)
        socket.on(SocketEvent.USER_OFFLINE, handleUserOffline)
        socket.on(SocketEvent.TYPING_START, handleUserTyping)
        socket.on(SocketEvent.TYPING_PAUSE, handleUserTyping)

        return () => {
            document.removeEventListener("visibilitychange", handleUserVisibilityChange)
            socket.off(SocketEvent.USER_ONLINE)
            socket.off(SocketEvent.USER_OFFLINE)
            socket.off(SocketEvent.TYPING_START)
            socket.off(SocketEvent.TYPING_PAUSE)
        }
    }, [
        socket,
        setUsers,
        handleUserVisibilityChange,
        handleUserOnline,
        handleUserOffline,
        handleUserTyping,
    ])
}

export default useUserActivity