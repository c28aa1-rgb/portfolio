import type { Plugin } from "vite";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";

// Dev-only endpoints for the in-page editor:
//   POST /__content  -> writes src/content.json
//   POST /__upload   -> saves an image to public/media/uploads and returns its path
export function contentEditor(): Plugin {
  let root = process.cwd();
  let lastWrite = 0;
  const contentFile = () => resolve(root, "src/content.json");

  return {
    name: "content-editor",
    apply: "serve",
    configResolved(config) {
      root = config.root;
    },
    // The page already has the new content in memory; skip the reload our own save would trigger.
    handleHotUpdate(ctx) {
      if (ctx.file === contentFile() && Date.now() - lastWrite < 2000) return [];
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "POST" || !req.url) return next();
        const url = new URL(req.url, "http://localhost");
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const body = Buffer.concat(chunks);
        try {
          if (url.pathname === "/__content") {
            const parsed = JSON.parse(body.toString("utf8"));
            lastWrite = Date.now();
            await writeFile(contentFile(), JSON.stringify(parsed, null, 2) + "\n");
            res.statusCode = 204;
            return res.end();
          }
          if (url.pathname === "/__upload") {
            const raw = basename(url.searchParams.get("name") ?? "photo.jpg");
            const ext = extname(raw).toLowerCase();
            if (![".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"].includes(ext)) throw new Error("Not an image");
            const name = `${raw.slice(0, -ext.length).replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${Date.now().toString(36)}${ext}`;
            const dir = resolve(root, "public/media/uploads");
            await mkdir(dir, { recursive: true });
            await writeFile(join(dir, name), body);
            res.setHeader("content-type", "application/json");
            return res.end(JSON.stringify({ src: `media/uploads/${name}` }));
          }
        } catch (e) {
          res.statusCode = 400;
          return res.end(String(e));
        }
        next();
      });
    },
  };
}
