import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";
  
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      https: false, // DEV: use HTTP
      proxy: {
        "/api": {
          target: isProd
            ? "https://your-production-domain.com"
            : "http://localhost:5005",
          changeOrigin: true,
          secure: false,
        },
        "/socket.io": {
          target: isProd
            ? "https://your-production-domain.com"
            : "http://localhost:5005",
          ws: true,
          secure: false,
        },
      },
    },
  };
});
