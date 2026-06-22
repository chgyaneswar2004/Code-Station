import { useState, useRef, useEffect } from "react"
import { Icon } from "@iconify/react"
import { PiPencilSimpleFill } from "react-icons/pi"
import { MdDelete } from "react-icons/md"
import cn from "classnames"
import { useFileSystem } from "@/context/FileContext"
import { useViews } from "@/context/ViewContext"
import useWindowDimensions from "@/hooks/useWindowDimensions"
import { useAppContext } from "@/context/AppContext"
import { useContextMenu } from "@/hooks/useContextMenu"
import { getIconClassName } from "@/utils/getIconClassName"
import RenameView from "./RenameView"

// File component for individual files in the file tree
const File = ({ item, setSelectedDirId, selectedFiles = [] }) => {
    const { deleteFile, openFile } = useFileSystem()
    const [isEditing, setEditing] = useState(false)
    const { setIsSidebarOpen } = useViews()
    const { isMobile } = useWindowDimensions()
    const { activityState, setActivityState } = useAppContext()
    const fileRef = useRef(null)
    const { coords, setMenuOpen } = useContextMenu({ ref: fileRef })

    // Handle file click to open in editor
    const handleFileClick = (fileId) => {
        if (isEditing) return
        setSelectedDirId(fileId)
        openFile(fileId, true)
        if (isMobile) setIsSidebarOpen(false)
        if (activityState === "DRAWING") {
            setActivityState("CODING")
        }
    }

    // Handle file deletion with confirmation
    const handleDeleteFile = (e, id) => {
        e.stopPropagation()
        setMenuOpen(false)
        const isConfirmed = confirm("Are you sure you want to delete file?")
        if (isConfirmed) deleteFile(id)
    }

    // Set up keyboard shortcuts (F2 for rename)
    useEffect(() => {
        const fileNode = fileRef.current
        if (!fileNode) return
        fileNode.tabIndex = 0

        const handleF2 = (e) => {
            e.stopPropagation()
            if (e.key === "F2") setEditing(true)
        }

        fileNode.addEventListener("keydown", handleF2)
        return () => fileNode.removeEventListener("keydown", handleF2)
    }, [])

    return (
        <div
            className={cn(
                "flex w-full items-center rounded-md px-2 py-1 hover:bg-darkHover",
                selectedFiles.includes(item.id) && "bg-blue-200 dark:bg-blue-800"
            )}
            data-file-id={item.id}
            onClick={() => handleFileClick(item.id)}
            ref={fileRef}
            onContextMenu={(e) => {
                e.preventDefault()
                setMenuOpen(true)
                coords.x = e.clientX
                coords.y = e.clientY
            }}
        >
            <Icon
                icon={getIconClassName(item.name)}
                fontSize={22}
                className="mr-2 min-w-fit"
            />
            {isEditing ? (
                <RenameView
                    id={item.id}
                    preName={item.name}
                    type="file"
                    setEditing={setEditing}
                />
            ) : (
                <p
                    className="flex-grow cursor-pointer overflow-hidden truncate"
                    title={item.name}
                >
                    {item.name}
                </p>
            )}
            <PiPencilSimpleFill
                className="ml-2 inline rounded-md hover:bg-blue-400"
                size={18}
                title="Rename file"
                onClick={(e) => {
                    e.stopPropagation()
                    setEditing(true)
                }}
                color="white"
            />
            <MdDelete
                className="ml-2 inline rounded-md hover:bg-red-700"
                size={18}
                title="Delete file"
                onClick={(e) => handleDeleteFile(e, item.id)}
                color="#ef4444"
            />
        </div>
    )
}

export default File
