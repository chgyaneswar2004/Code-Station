import { useEffect, useRef, useState } from "react"
import { useFileSystem } from "@/context/FileContext"
import useResponsive from "@/hooks/useResponsive"
import { sortFileSystemItem } from "@/utils/file"
import cn from "classnames"
import {
    RiFileAddLine,
    RiFolderAddLine,
    RiFolderUploadLine,
} from "react-icons/ri"
import Directory from "./Directory"

// Main file explorer component showing the file tree structure
function FileStructureView() {
    const { fileStructure, createFile, createDirectory, collapseDirectories, deleteFile } =
        useFileSystem()
    const explorerRef = useRef(null)
    const [selectedDirId, setSelectedDirId] = useState(null)
    const [selectedFiles, setSelectedFiles] = useState([])
    const [dragStart, setDragStart] = useState(null)
    const [dragRect, setDragRect] = useState(null)
    const { minHeightReached } = useResponsive()

    // Handle clicking outside the file tree to deselect
    const handleClickOutside = (e) => {
        if (explorerRef.current && !explorerRef.current.contains(e.target)) {
            setSelectedDirId(fileStructure.id)
        }
    }

    // Create a new file in the selected directory
    const handleCreateFile = () => {
        const fileName = prompt("Enter file name")
        if (fileName) {
            const parentDirId = selectedDirId || fileStructure.id
            createFile(parentDirId, fileName)
        }
    }

    // Create a new directory in the selected directory
    const handleCreateDirectory = () => {
        const dirName = prompt("Enter directory name")
        if (dirName) {
            const parentDirId = selectedDirId || fileStructure.id
            createDirectory(parentDirId, dirName)
        }
    }

    // Helper to flatten all files with their DOM rects
    const getAllFileRects = () => {
        const fileNodes = explorerRef.current?.querySelectorAll('[data-file-id]') || []
        return Array.from(fileNodes).map(node => ({
            id: node.getAttribute('data-file-id'),
            rect: node.getBoundingClientRect(),
            node
        }))
    }

    // Mouse event handlers for drag selection
    const handleMouseDown = (e) => {
        if (e.button !== 0) return
        setDragStart({ x: e.clientX, y: e.clientY })
        setDragRect({ x: e.clientX, y: e.clientY, w: 0, h: 0 })
        setSelectedFiles([])
    }
    const handleMouseMove = (e) => {
        if (!dragStart) return
        const x = Math.min(dragStart.x, e.clientX)
        const y = Math.min(dragStart.y, e.clientY)
        const w = Math.abs(dragStart.x - e.clientX)
        const h = Math.abs(dragStart.y - e.clientY)
        setDragRect({ x, y, w, h })
        // Select files in the drag rectangle
        const allFiles = getAllFileRects()
        const selected = allFiles.filter(f => {
            const r = f.rect
            return (
                r.left < x + w && r.right > x &&
                r.top < y + h && r.bottom > y
            )
        }).map(f => f.id)
        setSelectedFiles(selected)
    }
    const handleMouseUp = () => {
        setDragStart(null)
        setDragRect(null)
    }
    useEffect(() => {
        if (!explorerRef.current) return
        const el = explorerRef.current
        el.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        return () => {
            el.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    })

    // Batch delete selected files
    const handleDeleteSelected = () => {
        if (selectedFiles.length === 0) return
        if (!confirm(`Delete ${selectedFiles.length} files?`)) return
        selectedFiles.forEach(id => deleteFile(id))
        setSelectedFiles([])
    }

    const sortedFileStructure = sortFileSystemItem(fileStructure)

    return (
        <div onClick={handleClickOutside} className="flex flex-grow flex-col">
            <div className="view-title flex justify-between">
                <h2>Files</h2>
                <div className="flex gap-2">
                    <button
                        className="rounded-md px-1 hover:bg-darkHover"
                        onClick={handleCreateFile}
                        title="Create File"
                    >
                        <RiFileAddLine size={20} />
                    </button>
                    <button
                        className="rounded-md px-1 hover:bg-darkHover"
                        onClick={handleCreateDirectory}
                        title="Create Directory"
                    >
                        <RiFolderAddLine size={20} />
                    </button>
                    <button
                        className="rounded-md px-1 hover:bg-darkHover"
                        onClick={collapseDirectories}
                        title="Collapse All Directories"
                    >
                        <RiFolderUploadLine size={20} />
                    </button>
                    {selectedFiles.length > 0 && (
                        <button
                            className="rounded-md px-2 py-1 bg-red-600 text-white hover:bg-red-700"
                            onClick={handleDeleteSelected}
                        >
                            Delete Selected ({selectedFiles.length})
                        </button>
                    )}
                </div>
            </div>
            <div
                className={cn(
                    "min-h-[200px] flex-grow overflow-auto pr-2 sm:min-h-0",
                    {
                        "h-[calc(80vh-170px)]": !minHeightReached,
                        "h-[85vh]": minHeightReached,
                    },
                )}
                ref={explorerRef}
                style={{ position: 'relative' }}
            >
                {dragRect && (
                    <div
                        style={{
                            position: 'fixed',
                            left: dragRect.x,
                            top: dragRect.y,
                            width: dragRect.w,
                            height: dragRect.h,
                            background: 'rgba(0,123,255,0.2)',
                            border: '1px solid #007bff',
                            zIndex: 1000,
                            pointerEvents: 'none',
                        }}
                    />
                )}
                {sortedFileStructure.children &&
                    sortedFileStructure.children.map((item) => (
                        <Directory
                            key={item.id}
                            item={item}
                            setSelectedDirId={setSelectedDirId}
                            selectedFiles={selectedFiles}
                        />
                    ))}
            </div>
        </div>
    )
}

export default FileStructureView