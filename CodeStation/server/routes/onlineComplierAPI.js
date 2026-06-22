
const express = require("express");
const router = express.Router();
const COMPILER_API_BASE = "https://api.onlinecompiler.io";

const API_KEY = process.env.COMPILER_API_KEY; // store in .env

// ─── GET /api/compiler/languages ───────────────────────────────────────────
// Fetches all supported compilers from OnlineCompiler.io
router.get("/languages", async (req, res) => {
  try {
    const response = await fetch(`${COMPILER_API_BASE}/api/compilers/`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Failed to fetch compilers:", err);
    res.status(500).json({ error: "Failed to fetch language list" });
  }
});

// ─── POST /api/compiler/run ─────────────────────────────────────────────────
// Executes code and returns output
// Body: { compiler: string, code: string, input?: string }
router.post("/run", async (req, res) => {
  const { compiler, code, input = "" } = req.body;

  if (!compiler || !code) {
    return res.status(400).json({ error: "compiler and code are required" });
  }

  try {
    const response = await fetch(`${COMPILER_API_BASE}/api/run-code-sync/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: API_KEY,
      },
      body: JSON.stringify({ compiler, code, input }),
    });

    // 429 = too many concurrent requests (max 4 at once)
    if (response.status === 429) {
      return res.status(429).json({ error: "Server busy, please try again" });
    }

    const data = await response.json();

    // Normalize response shape (similar to what Piston returned)
    res.json({
      output: data.output || "",
      error: data.error || "",
      status: data.status,
      exitCode: data.exit_code,
      time: data.time,
      memory: data.memory,
    });
  } catch (err) {
    console.error("Code execution failed:", err);
    res.status(500).json({ error: "Code execution failed" });
  }
});

module.exports = router;