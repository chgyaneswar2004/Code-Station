const isHeading = (line) => /^#{1,6}\s/.test(line)
const isTableRow = (line) => /^\s*\|.*\|\s*$/.test(line)
const isFence = (line) => /^\s*```/.test(line)
const isBlank = (line) => line.trim() === ""
const fixMath = (text) =>
    text
        // \[ ... \]  ->  $$ ... $$
        .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => `\n\n$$\n${m.trim()}\n$$\n\n`)
        // \( ... \)  ->  $ ... $
        .replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => `$${m.trim()}$`)
        // bare [ \command ... ] on its own line  ->  $$ ... $$
        .replace(/^\[\s*(\\[a-zA-Z][\s\S]*?)\s*\]$/gm, (_, m) => `\n\n$$\n${m.trim()}\n$$\n\n`)

export function normalizeMarkdown(raw = "") {
    let text = String(raw).replace(/\r\n/g, "\n").trim()

    // Strip an accidental outer ```markdown fence around the whole response
    const outer = text.match(/^```(?:markdown|md)\s*\n([\s\S]*?)\n```$/i)
    if (outer) text = outer[1].trim()
    text = fixMath(text)

    const out = []
    let inFence = false
    let prevClosedFence = false

    for (const line of text.split("\n")) {
        const prev = out[out.length - 1]

        if (isFence(line)) {
            if (!inFence && prev !== undefined && !isBlank(prev)) out.push("")
            out.push(line)
            inFence = !inFence
            prevClosedFence = !inFence
            continue
        }

        if (inFence) {
            out.push(line)
            continue
        }

        if (!isBlank(line) && prev !== undefined && !isBlank(prev)) {
            const needsGap =
                isHeading(line) ||                                   // blank before heading
                isHeading(prev) ||                                   // blank after heading
                prevClosedFence ||                                   // blank after code fence
                (isTableRow(line) && !isTableRow(prev)) ||           // blank before table
                (isTableRow(prev) && !isTableRow(line))              // blank after table
            if (needsGap) out.push("")
        }

        out.push(line)
        prevClosedFence = false
    }

    return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n"
}