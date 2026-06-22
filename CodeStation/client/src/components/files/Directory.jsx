import { useState, useRef, useEffect } from "react"
import { AiOutlineFolder, AiOutlineFolderOpen } from "react-icons/ai"
import { MdDelete } from "react-icons/md"
import { PiPencilSimpleFill } from "react-icons/pi"
import cn from "classnames"
import { useFileSystem } from "@/context/FileContext"
import { useContextMenu } from "@/hooks/useContextMenu"
import RenameView from "./RenameView"
import File from "./File"

// Directory component that can contain files and subdirectories
function Directory({ item, setSelectedDirId, selectedFiles = [] }) {
    const [isEditing, setEditing] = useState(false)
    const dirRef = useRef(null)
    const { setMenuOpen } = useContextMenu({ ref: dirRef })
    const { deleteDirectory, toggleDirectory, fileStructure } = useFileSystem()

    // Handle directory click to expand/collapse and select
    const handleDirClick = (dirId) => {
        // If directory is open, close it and reset selectedDirId to root
        if (item.isOpen) {
            toggleDirectory(dirId)
            setSelectedDirId(fileStructure.id)
        } else {
            setSelectedDirId(dirId)
            toggleDirectory(dirId)
        }
    }

    // Handle directory rename with pencil icon
    const handleRenameDirectoryIcon = (e) => {
        e.stopPropagation()
        setEditing(true)
    }

    // Handle directory deletion with trash icon
    const handleDeleteDirectoryIcon = (e, id) => {
        e.stopPropagation()
        setMenuOpen(false)
        const isConfirmed = confirm("Are you sure you want to delete directory?")
        if (isConfirmed) deleteDirectory(id)
    }

    // Set up keyboard shortcuts (F2 for rename)
    useEffect(() => {
        const dirNode = dirRef.current
        if (!dirNode) return
        dirNode.tabIndex = 0

        const handleF2 = (e) => {
            e.stopPropagation()
            if (e.key === "F2") setEditing(true)
        }

        dirNode.addEventListener("keydown", handleF2)
        return () => dirNode.removeEventListener("keydown", handleF2)
    }, [])

    // Render file component if item is a file
    if (item.type === "file") {
        return (
            <File
                item={item}
                setSelectedDirId={setSelectedDirId}
                selectedFiles={selectedFiles}
            />
        )
    }

    return (
        <div className="overflow-x-auto">
            <div
                className="flex w-full items-center rounded-md px-2 py-1 hover:bg-darkHover"
                onClick={() => handleDirClick(item.id)}
                ref={dirRef}
            >
                {item.isOpen ? (
                    <AiOutlineFolderOpen size={24} className="mr-2 min-w-fit" />
                ) : (
                    <AiOutlineFolder size={24} className="mr-2 min-w-fit" />
                )}
                {isEditing ? (
                    <RenameView
                        id={item.id}
                        preName={item.name}
                        type="directory"
                        setEditing={setEditing}
                    />
                ) : (
                    <p className="flex-grow overflow-hidden truncate" title={item.name}>
                        {item.name}
                    </p>
                )}
                <PiPencilSimpleFill
                    className="ml-2 inline rounded-md hover:bg-blue-400"
                    size={18}
                    title="Rename directory"
                    onClick={handleRenameDirectoryIcon}
                    color="white"
                />
                <MdDelete
                    className="ml-2 inline rounded-md hover:bg-red-700"
                    size={18}
                    title="Delete directory"
                    onClick={(e) => handleDeleteDirectoryIcon(e, item.id)}
                    color="#ef4444"
                />
            </div>
            <div
                className={cn(
                    { hidden: !item.isOpen },
                    { block: item.isOpen },
                    { "pl-4": item.name !== "root" }
                )}
            >
                {item.children &&
                    item.children.map((child) => (
                        <Directory
                            key={child.id}
                            item={child}
                            setSelectedDirId={setSelectedDirId}
                            selectedFiles={selectedFiles}
                        />
                    ))}
            </div>
        </div>
    )
}

export default Directory
