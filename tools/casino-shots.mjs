// Captures Dalton Casino game screens from the local build in ~/Downloads/Gamling Game/dist.
import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const root = join(homedir(), "Downloads/Gamling Game/dist");
const out = fileURLToPath(new URL("../public/media/", import.meta.url));
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  try { const b = await readFile(join(root, p)); res.writeHead(200, { "content-type": types[extname(p)] ?? "application/octet-stream" }); res.end(b); }
  catch { res.writeHead(200, { "content-type": "text/html" }); res.end(await readFile(join(root, "index.html"))); }
}).listen(4802);

const games = process.argv.slice(2).length ? process.argv.slice(2) : ["Blackjack", "Roulette", "Plinko", "Mines", "Slots", "Poker"];
const browser = await chromium.launch({ channel: "chrome" });
for (const game of games) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:4802/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  try {
    await page.getByText(game, { exact: true }).first().click({ timeout: 4000 });
    await page.waitForTimeout(2500);
    const file = `casino-${game.toLowerCase()}.jpg`;
    await page.screenshot({ path: join(out, file), type: "jpeg", quality: 82 });
    console.log("captured", file);
  } catch (e) { console.log("failed", game, e.message.split("\n")[0]); }
  await page.close();
}
await browser.close();
server.close();
