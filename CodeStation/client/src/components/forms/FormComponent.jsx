import { useAppContext } from "@/context/AppContext"
import { useSocket } from "@/context/SocketContext"
import { SocketEvent } from "@/types/socket"
import { USER_STATUS } from "@/types/user"
import { useEffect, useRef, useState } from "react"
import { toast } from "react-hot-toast"
import { useLocation, useNavigate } from "react-router-dom"
import logo from "@/assets/logo.svg"

const FormComponent = () => {
    const location = useLocation()
    const { currentUser, setCurrentUser, status, setStatus } = useAppContext()
    const { socket } = useSocket()

    const usernameRef = useRef(null)
    const roomIdRef = useRef(null)
    const [isCreatingRoom, setIsCreatingRoom] = useState(false)
    const navigate = useNavigate()

    const createNewRoomId = async () => {
        if (!socket.connected || isCreatingRoom) {
            toast.error("Connect to the server before creating a room.")
            return
        }

        setIsCreatingRoom(true)
        try {
            const result = await socket.timeout(15000).emitWithAck(SocketEvent.CREATE_ROOM)
            if (!result?.ok) throw new Error(result?.message || "Could not create a room.")
            setCurrentUser({ ...currentUser, roomId: result.roomId })
            toast.success("Created a five-character room code")
            usernameRef.current?.focus()
            setTimeout(() => roomIdRef.current?.dispatchEvent(new Event("focus")), 0)
        } catch (error) {
            toast.error(error.message || "Could not create a room. Try again.")
        } finally {
            setIsCreatingRoom(false)
        }
    }

    const handleInputChanges = (e) => {
        const name = e.target.name
        const value = e.target.value
        setCurrentUser({ ...currentUser, [name]: name === "roomId" ? value.toUpperCase().slice(0, 5) : value })
    }

    const validateForm = () => {
        if (currentUser.username.trim().length === 0) {
            toast.error("Enter your username")
            return false
        } else if (currentUser.roomId.trim().length === 0) {
            toast.error("Enter a room id")
            return false
        } else if (currentUser.roomId.trim().length !== 5) {
            toast.error("Room ID must be exactly 5 characters")
            return false
        } else if (currentUser.username.trim().length < 3) {
            toast.error("Username must be at least 3 characters long")
            return false
        }
        return true
    }

    const joinRoom = (e) => {
        e.preventDefault()
        if (status === USER_STATUS.ATTEMPTING_JOIN) return
        if (!validateForm()) return
        toast.loading("Joining room...")
        setStatus(USER_STATUS.ATTEMPTING_JOIN)
        socket.emit(SocketEvent.JOIN_REQUEST, currentUser)
    }

    useEffect(() => {
        if (currentUser.roomId.length > 0) return
        if (location.state?.roomId) {
            setCurrentUser({ ...currentUser, roomId: location.state.roomId })
            if (currentUser.username.length === 0) {
                toast.success("Enter your username")
            }
        }
    }, [currentUser, location.state?.roomId, setCurrentUser])

    useEffect(() => {
        if (status === USER_STATUS.DISCONNECTED && !socket.connected) {
            socket.connect()
            return
        }

        const isRedirect = sessionStorage.getItem("redirect") || false

        if (status === USER_STATUS.JOINED && !isRedirect) {
            const username = currentUser.username
            sessionStorage.setItem("redirect", "true")
            navigate(`/editor/${currentUser.roomId}`, {
                state: { username },
            })
        } else if (status === USER_STATUS.JOINED && isRedirect) {
            sessionStorage.removeItem("redirect")
            setStatus(USER_STATUS.DISCONNECTED)
            socket.disconnect()
            socket.connect()
        }
    }, [currentUser, location.state?.redirect, navigate, setStatus, socket, status])

    return (
        <div className="flex w-full max-w-[500px] flex-col items-center justify-center gap-6 p-4 sm:w-[500px] sm:p-8">
            <img src={logo} alt="Logo" className="w-full mb-[15px]" />
            <form onSubmit={joinRoom} className="flex w-full flex-col gap-10">
                <div className="relative group">
                    <input
                        type="text"
                        name="roomId"
                        ref={roomIdRef}
                        maxLength={5}
                        autoCapitalize="characters"
                        className="peer w-full border-b-2 border-blue-400 bg-transparent px-3 py-3 focus:outline-none"
                        onChange={handleInputChanges}
                        value={currentUser.roomId}
                    />
                    <label 
                        className={`absolute left-3 text-[20px] pointer-events-none transition-all duration-200 ${
                            currentUser.roomId.length > 0 
                                ? '-top-4 text-blue-400' 
                                : 'top-3 text-white peer-focus:-top-4 peer-focus:text-blue-400 group-hover:-top-4 group-hover:text-blue-400'
                        }`}
                    >Room Id</label>
                </div>
                <div className="relative group">
                    <input
                        type="text"
                        name="username"
                        className="peer w-full border-b-2 border-blue-400 bg-transparent px-3 py-3 focus:outline-none"
                        onChange={handleInputChanges}
                        value={currentUser.username}
                        ref={usernameRef}
                    />
                    <label
                        className={`absolute left-3 text-[20px] pointer-events-none transition-all duration-200 ${
                            currentUser.username.length > 0 
                                ? '-top-4 text-blue-400' 
                                : 'top-3 text-white peer-focus:-top-4 peer-focus:text-blue-400 group-hover:-top-4 group-hover:text-blue-400'
                        }`}
                    >Username</label>
                </div>
                <button
                    type="submit"
                    className="mt-2 w-full mx-auto rounded-full bg-blue-400 px-8 py-3 text-xl font-semibold text-black"
                >
                    Join
                </button>
            </form>
            <button
                className="cursor-pointer select-none text-white hover:text-blue-400"
                onClick={createNewRoomId}
                disabled={isCreatingRoom}
            >
                {isCreatingRoom ? "Creating room..." : "Generate 5-character room code"}
            </button>
        </div>
    )
}

export default FormComponent
