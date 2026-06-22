import { runCode as executeCode, getLanguages } from "@/api/compiler";
import langMap from "lang-map"
import { createContext, useContext, useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useFileSystem } from "./FileContext"

const RunCodeContext = createContext(null)

export const useRunCode = () => {
    const context = useContext(RunCodeContext)
    if (context === null) {
        throw new Error("useRunCode must be used within a RunCodeContextProvider")
    }
    return context
}

const RunCodeContextProvider = ({ children }) => {
    const { activeFile } = useFileSystem()
    const [input, setInput] = useState("")
    const [output, setOutput] = useState("")
    const [isRunning, setIsRunning] = useState(false)
    const [supportedLanguages, setSupportedLanguages] = useState([])
    const [selectedLanguage, setSelectedLanguage] = useState({
        id: "",
        name: ""
    })

    useEffect(() => {
        const fetchSupportedLanguages = async () => {
            try {
                const { data } = await getLanguages()
                setSupportedLanguages(data.compilers)
            } catch (error) {
                toast.error("Failed to fetch supported languages")
                if (error?.response?.data) console.error(error.response.data)
            }
        }
        fetchSupportedLanguages()
    }, [])

    useEffect(() => {
        if (supportedLanguages.length === 0 || !activeFile?.name) return

        const extension = activeFile.name.split(".").pop()
        if (extension) {
            const languageName = langMap.languages(extension)
            // Match by checking if the compiler id or name includes the extension or language name
            const language = supportedLanguages.find((lang) =>
                lang.id.includes(extension) ||
                languageName?.some((l) =>
                    lang.name.toLowerCase().includes(l.toLowerCase())
                )
            )
            if (language) setSelectedLanguage(language)
        } else {
            setSelectedLanguage({ id: "", name: "" })
        }
    }, [activeFile?.name, supportedLanguages])

    const runCode = async () => {
        try {
            if (!selectedLanguage.id) {
                return toast.error("Please select a language to run the code")
            }
            if (!activeFile) {
                return toast.error("Please open a file to run the code")
            }

            toast.loading("Running code...")
            setIsRunning(true)

            const { data } = await executeCode(
                selectedLanguage.id,
                activeFile.content,
                input
            )

            if (data.error) {
                setOutput(data.error)
            } else {
                setOutput(data.output)
            }

            toast.dismiss()
            setIsRunning(false)
        } catch (error) {
            console.error(error?.response?.data || error)
            toast.dismiss()
            toast.error("Failed to run the code")
            setIsRunning(false)
        }
    }

    return (
        <RunCodeContext.Provider
            value={{
                setInput,
                output,
                isRunning,
                supportedLanguages,
                selectedLanguage,
                setSelectedLanguage,
                runCode
            }}
        >
            {children}
        </RunCodeContext.Provider>
    )
}

export { RunCodeContextProvider }
export default RunCodeContext