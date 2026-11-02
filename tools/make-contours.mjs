// Generates the "Sounding Lines" contour field: JSON for the hero, plus PNG renders (OG image, art plate).
import { contours } from "d3-contour";
import { createNoise2D } from "simplex-noise";
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const SEED = 1729;
const W = 1600, H = 1000, GX = 160, GY = 100, S = W / GX;

function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rand = mulberry32(SEED);
const noise = createNoise2D(rand);
const fbm = (x, y) => { let v = 0, a = 1, f = 1; for (let o = 0; o < 4; o++) { v += a * noise(x * f, y * f); a *= 0.5; f *= 2.03; } return v; };

// Terrain: rolling noise, a ridge from the top right, and one deep basin (the lake).
const basin = { x: 0.7, y: 0.6, r: 0.17 };
const values = new Float64Array(GX * GY);
for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) {
  const x = i / GX, y = j / GY;
  const d2 = ((x - basin.x) ** 2) / (basin.r ** 2) + ((y - basin.y) ** 2) / ((basin.r * 0.8) ** 2);
  const lake = -2.4 * Math.exp(-d2 * 1.1);
  const ridge = 1.3 * Math.exp(-(((x - 0.95) * 1.2 + (y - 0.05)) ** 2) * 9);
  values[j * GX + i] = fbm(x * 1.25, y * 1.25 * (H / W) * 1.6) * 0.75 + lake + ridge + (x - 0.5) * 0.6;
}
let min = Infinity, max = -Infinity;
for (const v of values) { min = Math.min(min, v); max = Math.max(max, v); }
const LEVELS = 20;
const thresholds = Array.from({ length: LEVELS }, (_, k) => min + ((k + 0.5) / LEVELS) * (max - min));

const chaikin = (pts, n = 2) => {
  for (let k = 0; k < n; k++) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      out.push([0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1], [0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1]);
    }
    out.push(out[0]);
    pts = out;
  }
  return pts;
};
const area = (pts) => Math.abs(pts.reduce((s, [x, y], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; return s + x * y2 - x2 * y; }, 0) / 2);

const paths = [];
contours().size([GX, GY]).thresholds(thresholds)(values).forEach((mp, level) => {
  for (const poly of mp.coordinates) for (const ring of poly) {
    if (area(ring) < 14) continue;
    const pts = chaikin(ring.map(([x, y]) => [x * S, y * S]), 2);
    // Drop closing segments that hug the canvas edge so open contours do not draw a frame.
    let d = "", pen = false;
    for (const [x, y] of pts) {
      const edge = x <= 1 || y <= 1 || x >= W - 1 || y >= H - 1;
      if (edge) { pen = false; continue; }
      d += `${pen ? "L" : "M"}${Math.round(x)} ${Math.round(y)}`;
      pen = true;
    }
    if (d.length > 40) paths.push({ d, level });
  }
});

// Soundings: depth figures inside the basin, as on a lake chart.
const soundings = [];
const waypoint = { x: Math.round(basin.x * W), y: Math.round(basin.y * H) };
for (let tries = 0; soundings.length < 7 && tries < 500; tries++) {
  const a = rand() * Math.PI * 2, r = 0.25 + Math.sqrt(rand()) * 0.6;
  const x = (basin.x + Math.cos(a) * basin.r * r) * W, y = (basin.y + Math.sin(a) * basin.r * 0.8 * r) * H;
  const near = [...soundings, waypoint].some((s) => Math.hypot(s.x - x, s.y - y) < 70);
  if (near) continue;
  const v = values[Math.min(GY - 1, Math.round(y / S)) * GX + Math.min(GX - 1, Math.round(x / S))];
  soundings.push({ x: Math.round(x), y: Math.round(y), v: Math.round(((max - v) / (max - min)) * 40) });
}

await mkdir(root("src/art"), { recursive: true });
const data = { viewBox: [W, H], levels: LEVELS, paths, soundings, waypoint };
await writeFile(root("src/art/contours.json"), JSON.stringify(data));
console.log(`paths ${paths.length}, json ${(JSON.stringify(data).length / 1024).toFixed(0)} KB`);

// ---- Renders ----
const INK = "#18202A", PAPER = "#ECEFEC", MUTED = "#6A737C", ORANGE = "#F0531C";
function svg({ w, h, box: [bx, by, bw, bh], labels, focus = [0.5, 0.5] }) {
  // Field covers the plate box; focus picks which part of the field sits in view.
  const scale = Math.max(bw / W, bh / H) * 1.02;
  const dx = bx - (W * scale - bw) * focus[0], dy = by - (H * scale - bh) * focus[1];
  const lines = paths.map((p) => `<path d="${p.d}" stroke-width="${(p.level % 5 === 0 ? 1.5 : 0.75) / scale}" opacity="${p.level % 5 === 0 ? 0.9 : 0.5}"/>`).join("");
  const snd = soundings.map((s) => `<rect x="${s.x - 13}" y="${s.y - 12}" width="26" height="17" fill="${PAPER}"/><text x="${s.x}" y="${s.y}">${s.v}</text>`).join("");
  const ticks = [];
  for (let k = 1; k < 10; k++) {
    const x = bx + (bw * k) / 10, y = by + (bh * k) / 10;
    ticks.push(`M${x} ${by}v-8M${x} ${by + bh}v8`);
    if (k % 2 === 0) ticks.push(`M${bx} ${y}h-8M${bx + bw} ${y}h8`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><clipPath id="plate"><rect x="${bx}" y="${by}" width="${bw}" height="${bh}"/></clipPath></defs>
  <rect width="100%" height="100%" fill="${PAPER}"/>
  <g clip-path="url(#plate)"><g transform="translate(${dx} ${dy}) scale(${scale})">
    <g fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">${lines}</g>
    <g font-family="Martian Mono" font-size="${11 / scale}" fill="${MUTED}" text-anchor="middle" font-stretch="87.5%">${snd.replace(/x="(\S+)" y="(\S+)" width="26" height="17"/g, (m, x, y) => m)}</g>
    <circle cx="${waypoint.x}" cy="${waypoint.y}" r="${13 / scale}" fill="${PAPER}"/>
    <circle cx="${waypoint.x}" cy="${waypoint.y}" r="${7 / scale}" fill="none" stroke="${ORANGE}" stroke-width="${2.4 / scale}"/>
    <circle cx="${waypoint.x}" cy="${waypoint.y}" r="${1.8 / scale}" fill="${ORANGE}"/>
  </g></g>
  <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="none" stroke="${INK}" stroke-width="1" opacity="0.6"/>
  <path d="${ticks.join("")}" stroke="${INK}" stroke-width="1" opacity="0.6"/>
  ${labels}
</svg>`;
}
const mono = `font-family="Martian Mono" fill="${MUTED}" font-stretch="87.5%" letter-spacing="0.08em"`;
const renders = [
  { file: "public/og.png", w: 1200, h: 630, box: [48, 72, 1104, 486], focus: [0.75, 0.62],
    labels: `<g ${mono} font-size="13"><text x="48" y="48">SOUNDING LINES</text><text x="1152" y="48" text-anchor="end">PLATE I</text><text x="48" y="596">${LEVELS} CONTOURS · ${soundings.length} SOUNDINGS · ONE WAYPOINT</text><text x="1152" y="596" text-anchor="end">SEED ${SEED}</text></g>` },
  { file: "design/sounding-lines.png", w: 2400, h: 1500, box: [120, 150, 2160, 1200],
    labels: `<g ${mono} font-size="18"><text x="120" y="104">SOUNDING LINES</text><text x="2280" y="104" text-anchor="end">PLATE I</text><text x="120" y="1414">${LEVELS} CONTOURS · ${soundings.length} SOUNDINGS · ONE WAYPOINT</text><text x="2280" y="1414" text-anchor="end">SEED ${SEED}</text></g>` },
];
const browser = await chromium.launch({ channel: "chrome" });
for (const r of renders) {
  const page = await browser.newPage({ viewport: { width: r.w, height: r.h } });
  await page.setContent(`<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Martian+Mono:wdth,wght@75..112.5,300..500&display=block" rel="stylesheet"><style>body{margin:0}</style></head><body>${svg(r)}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: root(r.file) });
  await page.close();
  console.log("rendered", r.file);
}
await browser.close();
