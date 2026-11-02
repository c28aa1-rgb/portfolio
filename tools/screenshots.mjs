// Captures project screenshots with system Chrome. Usage: node screenshots.mjs [name...]
import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const out = fileURLToPath(new URL("../public/media/", import.meta.url));
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".jpg": "image/jpeg" };

function serve(root, port) {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (path.endsWith("/")) path += "index.html";
      try {
        const body = await readFile(join(root, path));
        res.writeHead(200, { "content-type": types[extname(path)] ?? "application/octet-stream" });
        res.end(body);
      } catch {
        const body = await readFile(join(root, "index.html"));
        res.writeHead(200, { "content-type": "text/html" });
        res.end(body);
      }
    }).listen(port, () => resolve(server));
  });
}

const targets = {
  enight: { url: "https://e-night-qnpb.onrender.com", wait: 8000 },
  cuts: { root: join(homedir(), "exeter-haircuts"), port: 4801, wait: 4000 },
  casino: { root: join(homedir(), "Downloads/Gamling Game/dist"), port: 4802, wait: 5000 },
};

const only = process.argv.slice(2);
const browser = await chromium.launch({ channel: "chrome" });
for (const [name, t] of Object.entries(targets)) {
  if (only.length && !only.includes(name)) continue;
  const server = t.root ? await serve(t.root, t.port) : null;
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  try {
    await page.goto(t.url ?? `http://localhost:${t.port}/`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(t.wait);
    await page.screenshot({ path: join(out, `${name}.png`) });
    console.log("captured", name, await page.title());
  } catch (e) {
    console.log("failed", name, e.message.split("\n")[0]);
  }
  await page.close();
  server?.close();
}
await browser.close();
