// Trims transparent margins from PNGs (keeps a small pad). Usage: node trim-png.mjs out.png in.png [pad]
import { chromium } from "playwright-core";
import { readFile, writeFile } from "node:fs/promises";
const [out, input, pad = "40"] = process.argv.slice(2);
const b64 = (await readFile(input)).toString("base64");
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
const data = await page.evaluate(async ({ b64, pad }) => {
  const img = new Image();
  img.src = `data:image/png;base64,${b64}`;
  await img.decode();
  const c = new OffscreenCanvas(img.width, img.height), x = c.getContext("2d");
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, img.width, img.height).data;
  let [l, t, r, bt] = [img.width, img.height, 0, 0];
  for (let y = 0; y < img.height; y++) for (let i = 0; i < img.width; i++)
    if (d[(y * img.width + i) * 4 + 3] > 8) { l = Math.min(l, i); r = Math.max(r, i); t = Math.min(t, y); bt = Math.max(bt, y); }
  const w = r - l + 1 + pad * 2, h = bt - t + 1 + pad * 2;
  const o = new OffscreenCanvas(w, h);
  o.getContext("2d").drawImage(img, l - pad, t - pad, w, h, 0, 0, w, h);
  const blob = await o.convertToBlob({ type: "image/png" });
  const buf = new Uint8Array(await blob.arrayBuffer());
  let s = ""; for (const ch of buf) s += String.fromCharCode(ch);
  return { png: btoa(s), w, h };
}, { b64, pad: Number(pad) });
await writeFile(out, Buffer.from(data.png, "base64"));
console.log(out, data.w + "x" + data.h);
await browser.close();
