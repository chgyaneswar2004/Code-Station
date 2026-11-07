import { useFileSystem } from "@/context/FileContext";
import useResponsive from "@/hooks/useResponsive";
import cn from "classnames";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Editor from "./Editor";
import FileTab from "./FileTab";
import AiResponseDocument from "../../../../bob/client/AiResponseDocument.jsx";

// Main editor component that handles file display and responsive layout
function EditorComponent() {
    const { openFiles, activeFile, fileStructure, createFile, openFile, setActiveFile, updateFileContent } = useFileSystem();
    const { minHeightReached } = useResponsive();
    const [isResponsePreview, setIsResponsePreview] = useState(true);

    useEffect(() => {
        const updateResponseFile = (event) => {
            const response = typeof event.detail === "string" ? event.detail.trim() : "";
            if (!response || !fileStructure?.id) return;

            const responseFile = fileStructure.children?.find(
                (item) => item.type === "file" && item.name === "Airesponse.md",
            );

            if (responseFile) {
                openFile(responseFile.id);
                updateFileContent(responseFile.id, response);
                setActiveFile({ ...responseFile, content: response });
                setIsResponsePreview(true);
                return;
            }

            createFile(fileStructure.id, {
                id: uuidv4(),
                name: "Airesponse.md",
                type: "file",
                content: response,
            });
            setIsResponsePreview(true);
        };
        window.addEventListener("bob:response", updateResponseFile);
        return () => window.removeEventListener("bob:response", updateResponseFile);
    }, [createFile, fileStructure, openFile, setActiveFile, updateFileContent]);

    // Show message when no files are open
    if (openFiles.length <= 0) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <h1 className="text-xl text-white">
                    No file is currently open.
                </h1>
            </div>
        );
    }

    // Render file tabs and editor when files are open
    return (
        <main
            className={cn("flex w-full flex-col overflow-x-auto md:h-screen", {
                "h-[calc(100vh-50px)]": !minHeightReached,
                "h-full": minHeightReached,
            })}
        >
            <FileTab />
            {activeFile?.name === "Airesponse.md" ? (
                <>
                    <div className="flex h-10 shrink-0 items-center justify-end gap-2 border-b border-darkHover bg-dark px-3">
                        <button
                            type="button"
                            className={cn("rounded px-3 py-1 text-xs text-white transition-colors hover:bg-darkHover", {
                                "bg-darkHover": isResponsePreview,
                            })}
                            onClick={() => setIsResponsePreview(true)}
                            aria-pressed={isResponsePreview}
                        >
                            Preview
                        </button>
                        <button
                            type="button"
                            className={cn("rounded px-3 py-1 text-xs text-white transition-colors hover:bg-darkHover", {
                                "bg-darkHover": !isResponsePreview,
                            })}
                            onClick={() => setIsResponsePreview(false)}
                            aria-pressed={!isResponsePreview}
                        >
                            Edit Markdown
                        </button>
                    </div>
                    {isResponsePreview ? (
                        <AiResponseDocument response={activeFile.content || ""} />
                    ) : (
                        <Editor />
                    )}
                </>
            ) : (
                <Editor />
            )}
        </main>
    );
}

export default EditorComponent;
