import axios from "axios";

const compilerAPI = axios.create({
  baseURL: import.meta.env.VITE_API_URL || import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:3000",
  timeout: 35000, // slightly over the 30s execution limit
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Languages ──────────────────────────────────────────────
export const getLanguages = () =>
  compilerAPI.get("/api/compiler/languages");

// ── Run Code ───────────────────────────────────────────────
export const runCode = (compiler, code, input = "") =>
  compilerAPI.post("/api/compiler/run", { compiler, code, input });

export default compilerAPI;