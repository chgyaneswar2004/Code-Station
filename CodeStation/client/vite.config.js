import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            "/api": process.env.VITE_BACKEND_URL || "http://localhost:3000",
            "/socket.io": {
                target: process.env.VITE_BACKEND_URL || "http://localhost:3000",
                ws: true,
            },
        },
    },
    resolve: {
        dedupe: ["react", "react-dom", "react-markdown", "react-syntax-highlighter"],
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
    },
})

