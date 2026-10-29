import { defineConfig } from "vite";
export default defineConfig({
  build: {
    rollupOptions: {
      input: { home: "index.html", nightmarket: "nightmarket/index.html" },
    },
  },
});
