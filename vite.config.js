import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"), // Alias for easier imports
    },
  },
  server: {
    port: 5173, // Specify the port for the development server
    host: true, // Allow access from other devices on the network
    open: true, // Automatically open the app in the browser
  },
  build: {
    outDir: "dist", // Output directory for production builds
    sourcemap: true, // Generate source maps for easier debugging
  },
  optimizeDeps: {
    include: ["react", "react-dom"], // Pre-bundled dependencies for faster startup
  },
});