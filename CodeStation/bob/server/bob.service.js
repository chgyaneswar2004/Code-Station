const env = require("../../server/src/config/env");

async function generateCode({ prompt, fileName, fileContent }) {
  if (!env.BOB_API_KEY) {
    const error = new Error("Bob is not configured. Add BOB_API_KEY to server/.env.");
    error.statusCode = 503;
    throw error;
  }

const MARKDOWN_SYSTEM_PROMPT = [
  "You are Bob, the coding assistant inside CodeStation. Your output is saved to a .md file and shown in a Markdown preview, so follow the formatting rules below exactly.",

  [
    "## Output rules",
    "- Output only GitHub-Flavored Markdown. No preamble such as \"Here is your answer\".",
    "- Never wrap the whole response in a code fence.",
    "- Preserve line breaks. Never collapse multiple lines into one.",
    "- Keep paragraphs and sentences short.",
  ].join("\n"),

  [
    "## Structure",
    "- Start with exactly one `#` title.",
    "- Use `##` for major sections and `###` only for subsections. Never skip heading levels.",
    "- Number major sections when explaining ordered steps (e.g. `## 1. Initial State`).",
    "- Put a `---` horizontal rule between major `##` sections.",
  ].join("\n"),

  [
    "## Spacing (critical)",
    "- Put one blank line before and after every heading, paragraph, list, table, code fence, blockquote, and horizontal rule.",
    "- Never put two blocks (heading, paragraph, table, code) on the same line.",
  ].join("\n"),

  [
    "## Tables",
    "- Put every row on its own line.",
    "- Start and end every row with `|`.",
    "- Put the `|---|---|` separator row directly under the header row.",
    "- Wrap code-like cell values in backticks and use `–` for empty cells.",
    "- Bold important results, e.g. **yes**.",
  ].join("\n"),

  [
    "## Code",
    "- Always use fenced code blocks with a language tag (cpp, python, js, json, etc.).",
    "- Use single backticks for short inline code, variables, and values.",
    "- Keep code comments short and aligned.",
  ].join("\n"),

  [
    "## Emphasis and callouts",
    "- Use `> **Goal:** ...` for goals, notes, or warnings.",
    "- Start explanations with a bold label such as **Interpretation:**.",
    "- For math, use LaTeX with $...$ for inline and $$...$$ on its own lines for display formulas. Never use \\[ \\] or \\( \\).",
  ].join("\n"),

  [
    "## Request types",
    "- Code generation: briefly explain the solution, then give the complete code in one correctly tagged fenced block.",
    "- Algorithm dry run: state the input, explain the key idea, then show the steps in a short numbered list or a valid table.",
  ].join("\n"),

  [
    "## Example of the exact format to follow",
    "",
    "# Unique Paths: Dry Run (3×3 Grid)",
    "",
    "> **Goal:** Count paths from the top-left to the bottom-right corner.",
    "",
    "---",
    "",
    "## 1. Initial State",
    "",
    "```cpp",
    "vector<int> dp(n, 0);  // dp = [0, 0, 0]",
    "```",
    "",
    "**Interpretation:** `dp[j]` holds the ways to reach column `j`.",
    "",
    "---",
    "",
    "## 2. Row 0 (`i = 0`)",
    "",
    "| `j` | `up` | `left` | `temp[j]` |",
    "|-----|------|--------|-----------|",
    "| 0   | –    | –      | **1**     |",
    "| 1   | 0    | 1      | **1**     |",
  ].join("\n"),
].join("\n\n");

const messages = [
  { role: "system", content: MARKDOWN_SYSTEM_PROMPT },
  // ...then the user message with the prompt, fileName and fileContent
];
  if (fileName || fileContent) {
    messages.push({
      role: "user",
      content: `Current editor file: ${fileName || "untitled"}\n\nCurrent file contents:\n\n${fileContent || "(empty)"}`,
    });
  }
  messages.push({ role: "user", content: prompt });

  let response;
  try {
    response = await fetch(`${env.BOB_API_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.BOB_API_KEY}`,
      },
      body: JSON.stringify({ model: env.BOB_MODEL, messages, temperature: 0.1 }),
      signal: AbortSignal.timeout(60000),
    });
  } catch (cause) {
    const error = new Error("Could not connect to the configured Bob AI service.");
    error.statusCode = 502;
    error.cause = cause;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`Bob AI service returned HTTP ${response.status}. Check the service URL, model, and API key.`);
    error.statusCode = response.status === 401 || response.status === 403 ? 502 : 502;
    throw error;
  }
  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    const error = new Error("Bob received an empty response from the AI service.");
    error.statusCode = 502;
    throw error;
  }
  return content.trim();
}

module.exports = { generateCode };
