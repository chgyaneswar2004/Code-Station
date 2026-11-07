import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

function AiResponseDocument({ response }) {
    return (
        <article className="min-h-0 flex-1 overflow-y-auto bg-[#0d1117] px-4 py-6 text-slate-100 md:px-8 md:py-10">
            <div className="mx-auto w-full max-w-4xl break-words leading-7">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                        h1: ({ children }) => (
                            <h1 className="mb-6 border-b border-slate-700 pb-4 text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">
                                {children}
                            </h1>
                        ),
                        h2: ({ children }) => (
                            <h2 className="mb-4 mt-10 border-b border-slate-700 pb-2 text-xl font-semibold leading-snug text-white first:mt-0 md:text-2xl">
                                {children}
                            </h2>
                        ),
                        h3: ({ children }) => (
                            <h3 className="mb-3 mt-7 text-lg font-semibold leading-snug text-slate-100 md:text-xl">
                                {children}
                            </h3>
                        ),
                        p: ({ children }) => (
                            <p className="mb-5 max-w-3xl text-[15px] leading-7 text-slate-300 last:mb-0">
                                {children}
                            </p>
                        ),
                        ul: ({ children }) => (
                            <ul className="mb-6 mt-3 list-disc space-y-2 pl-6 text-[15px] leading-7 text-slate-300 marker:text-blue-400">
                                {children}
                            </ul>
                        ),
                        ol: ({ children }) => (
                            <ol className="mb-6 mt-3 list-decimal space-y-3 pl-6 text-[15px] leading-7 text-slate-300 marker:font-semibold marker:text-blue-300">
                                {children}
                            </ol>
                        ),
                        li: ({ children }) => <li className="pl-1">{children}</li>,
                        blockquote: ({ children }) => (
                            <blockquote className="my-6 border-l-4 border-blue-400 bg-slate-900/60 px-5 py-3 text-slate-300">
                                {children}
                            </blockquote>
                        ),
                        hr: () => <hr className="my-8 border-slate-700" />,
                        a: ({ children, href }) => (
                            <a className="text-blue-300 underline decoration-blue-500/50 underline-offset-4 hover:text-blue-200" href={href} target="_blank" rel="noreferrer">
                                {children}
                            </a>
                        ),
                        code({ className, children, ...props }) {
                            const language = /language-([\w.+#-]+)/.exec(className || "")?.[1]
                            const text = String(children)
                            const isBlock = Boolean(language) || text.includes("\n")

                            if (isBlock) {
                                return (
                                    <SyntaxHighlighter
                                        style={oneDark}
                                        language={language || "text"}
                                        PreTag="div"
                                        customStyle={{
                                            margin: "1.25rem 0 1.75rem",
                                            border: "1px solid #30363d",
                                            borderRadius: "0.65rem",
                                            padding: "1.25rem",
                                            fontSize: "0.875rem",
                                            lineHeight: "1.65",
                                        }}
                                    >
                                        {text.replace(/\n$/, "")}
                                    </SyntaxHighlighter>
                                )
                            }
                            return (
                                <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[0.9em] text-sky-200" {...props}>
                                    {children}
                                </code>
                            )
                        },
                        pre: ({ children }) => (
                            <div className="my-5 overflow-x-auto rounded-lg bg-[#282c34] [&>pre]:!m-0">
                                {children}
                            </div>
                        ),
                        table: ({ children }) => (
                            <div className="my-6 overflow-x-auto rounded-lg border border-slate-700">
                                <table className="w-full min-w-[620px] border-collapse text-left text-sm leading-6">
                                    {children}
                                </table>
                            </div>
                        ),
                        thead: ({ children }) => <thead className="bg-slate-800/90 text-slate-100">{children}</thead>,
                        th: ({ children }) => <th className="border-b border-slate-600 px-4 py-3 font-semibold">{children}</th>,
                        td: ({ children }) => <td className="border-t border-slate-700 px-4 py-3 align-top text-slate-300">{children}</td>,
                    }}
                >
                    {response}
                </ReactMarkdown>
            </div>
        </article>
    )
}

export default AiResponseDocument