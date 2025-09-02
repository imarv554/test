import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function injectBuiltByScoutPlugin() {
  return {
    name: 'inject-built-by-scout',
    transformIndexHtml(html: string) {
      const scriptTag = '<script defer src="/scout-tag.js"></script>';
      return html.replace('</body>', scriptTag + '\n  </body>');
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), injectBuiltByScoutPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:4000"
    }
  }
});
