import { useState } from "react"
import useResponsive from "@/hooks/useResponsive"
import { useFileSystem } from "@/context/FileContext"
import { normalizeMarkdown } from "./utils/normalizeMarkdown"

const extractCode = (text) => {
    const blocks = [...text.matchAll(/```(?:[\w.+#-]+)?\s*\n?([\s\S]*?)```/g)]
    return blocks.length ? blocks.map((block) => block[1].trim()).join("\n\n") : text.trim()
}

function BobView() {
    const { viewHeight } = useResponsive()
    const { activeFile, updateFileContent } = useFileSystem()
    const [prompt, setPrompt] = useState("")
    const [output, setOutput] = useState("")
    const [isRunning, setIsRunning] = useState(false)
    const [statusMessage, setStatusMessage] = useState("")

    const generate = async (event) => {
    event.preventDefault()
    if (!prompt.trim()) {
        setStatusMessage("Write a prompt for Bob first.")
        return
    }
    setStatusMessage("")
    setIsRunning(true)
    try {
        const response = await fetch("/api/bob/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt,
                fileName: activeFile?.name || "",
                fileContent: activeFile?.content || "",
            }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || "Bob could not generate a response")

        const markdown = normalizeMarkdown(data.code)
        setOutput(markdown)
        window.dispatchEvent(new CustomEvent("bob:response", { detail: markdown }))
    } catch (error) {
        setStatusMessage(error.message || "Failed to contact Bob.")
    } finally {
        setIsRunning(false)
    }
}

    const copyOutput = async () => {
        try {
            await navigator.clipboard.writeText(extractCode(output))
            setStatusMessage("Code copied to clipboard.")
        } catch {
            setStatusMessage("Unable to copy code. Check clipboard permissions.")
        }
    }

    const insertOutput = (replace) => {
        if (!activeFile) {
            setStatusMessage("Open a file before inserting code.")
            return
        }
        const code = extractCode(output)
        const content = replace ? code : [activeFile.content?.trimEnd(), code].filter(Boolean).join("\n")
        updateFileContent(activeFile.id, content)
        setStatusMessage(replace ? "Current file replaced." : "Code added to current file.")
    }

    return (
        <section className="flex w-full flex-col items-center gap-2 p-4" style={{ height: viewHeight }}>
            <h1 className="view-title">Bob AI</h1>
            <p className="w-full text-sm text-gray-300">Ask Bob about your code or request a new solution.</p>
            <form onSubmit={generate} className="flex h-full w-full flex-col items-end gap-2">
                <textarea
                    aria-label="Prompt for Bob"
                    className="min-h-[140px] w-full resize-y rounded-md border-2 border-blue-400 bg-gray-900 p-2 text-white outline-none placeholder:text-gray-400"
                    placeholder="Describe what you need help with..."
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    maxLength={12000}
                />
                <button className="flex w-full justify-center rounded-md bg-blue-400 p-2 font-bold text-white outline-none hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50" disabled={isRunning}>
                    {isRunning ? "Thinking..." : "Ask Bob"}
                </button>
            </form>
            {statusMessage && <p role="status" className="w-full rounded-md border border-blue-400/50 bg-gray-900 p-2 text-sm text-gray-200">{statusMessage}</p>}
            {output && <div className="mt-2 flex w-full flex-col gap-2 border-t border-blue-400 pt-3">
                    <p className="text-sm text-gray-300">Response opened as <span className="font-mono text-white">Airesponse.md</span>.</p>
                    <div className="flex w-full gap-2">
                        <button type="button" title="Copy code" onClick={copyOutput} className="flex-1 rounded-md p-2 text-sm text-white transition-colors hover:bg-darkHover">Copy code</button>
                        <button type="button" title="Replace current file" onClick={() => insertOutput(true)} className="flex-1 rounded-md p-2 text-sm text-white transition-colors hover:bg-darkHover">Replace file</button>
                        <button type="button" title="Append to current file" onClick={() => insertOutput(false)} className="flex-1 rounded-md p-2 text-sm text-white transition-colors hover:bg-darkHover">Append</button>
                    </div>
                </div>}
        </section>
    )
}

export default BobView
