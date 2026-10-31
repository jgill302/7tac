import { defineConfig, loadEnv } from "vite";
import { createHandler } from "./api/applications.mjs";
export default defineConfig({
  plugins: [
    {
      name: "local-application-api",
      configureServer(server) {
        attach(server);
      },
      configurePreviewServer(server) {
        attach(server);
      },
    },
  ],
  build: {
    rollupOptions: {
      input: { home: "index.html", nightmarket: "nightmarket/index.html" },
    },
  },
});

// Vercel handles /api in production; this adapter makes local errors and setup testable.
function attach(server: any) {
  const handler = createHandler({
    env: { ...loadEnv("development", process.cwd(), ""), ...process.env },
  });
  server.middlewares.use("/api/applications", async (req: any, res: any) => {
    const chunks: Buffer[] = [];
    let bytes = 0;
    for await (const chunk of req) {
      bytes += chunk.length;
      if (bytes > 24000) {
        res.statusCode = 413;
        res.end(JSON.stringify({ error: "Application is too large." }));
        return;
      }
      chunks.push(chunk);
    }
    req.body = Buffer.concat(chunks).toString();
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data: unknown) => {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
    };
    await handler(req, res);
  });
}
