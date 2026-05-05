import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const githubPagesBase = process.env.VITE_GITHUB_PAGES_BASE || "/";

export default defineConfig({
  // Para GitHub Pages, ajuste VITE_GITHUB_PAGES_BASE para "/nome-do-repositorio/"
  // Exemplo: "/dashboard-stf/" ou "/controle-stf-atos-presidenciais/"
  base: githubPagesBase,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
