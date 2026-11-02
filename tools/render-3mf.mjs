// Renders .3mf models as isometric line drawings (transparent PNG) and records their real dimensions.
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const downloads = join(homedir(), "Downloads");
const out = fileURLToPath(new URL("../public/media/", import.meta.url));
const dimsOut = fileURLToPath(new URL("../src/data/prints.json", import.meta.url));
const threeDir = fileURLToPath(new URL("./node_modules/three/", import.meta.url));

// slug, file, which object to keep ("all" or "largest")
const models = [
  ["drawer-height", "Drawer Test Height (V1).3mf", "all"],
  ["drawer-length", "Drawer Test Length (V1).3mf", "all"],
  ["drawer-guide", "Drawer Guide Full (V1).3mf", "all"],
  ["deck-stand", "Steam+Deck+Stand.3mf", "all"],
  ["ruler", "circular_ruler_8inchdiameter.3mf", "all"],
  ["organizer", "desk_organizer.3mf", "largest"],
];

const unzip = (file, entry) => execFileSync("unzip", ["-p", file, entry], { maxBuffer: 1 << 28 }).toString();
const list = (file) => execFileSync("unzip", ["-Z1", file]).toString().split("\n").filter(Boolean);
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

function parseMeshes(xml) {
  const meshes = new Map();
  for (const m of xml.matchAll(/<object\b([^>]*)>([\s\S]*?)<\/object>/g)) {
    const id = attr(m[1], "id");
    const body = m[2];
    if (body.includes("<mesh")) {
      const v = [...body.matchAll(/<vertex\b([^>]*)\/>/g)].map((x) => [+attr(x[1], "x"), +attr(x[1], "y"), +attr(x[1], "z")]);
      const t = [...body.matchAll(/<triangle\b([^>]*)\/>/g)].map((x) => [+attr(x[1], "v1"), +attr(x[1], "v2"), +attr(x[1], "v3")]);
      meshes.set(id, { v, t });
    } else {
      const comps = [...body.matchAll(/<component\b([^>]*)\/>/g)].map((x) => ({
        objectid: attr(x[1], "objectid"), path: attr(x[1], "p:path"), transform: attr(x[1], "transform"),
      }));
      meshes.set(id, { comps });
    }
  }
  return meshes;
}

const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
const parseT = (s) => (s ? s.trim().split(/\s+/).map(Number) : identity);
const apply = (m, [x, y, z]) => [
  x * m[0] + y * m[3] + z * m[6] + m[9],
  x * m[1] + y * m[4] + z * m[7] + m[10],
  x * m[2] + y * m[5] + z * m[8] + m[11],
];
const compose = (a, b) => { // a then b
  const r = [];
  for (let c = 0; c < 3; c++) for (let row = 0; row < 3; row++)
    r[row * 3 + c] = a[row * 3] * b[c] + a[row * 3 + 1] * b[3 + c] + a[row * 3 + 2] * b[6 + c];
  const t = apply(b, [a[9], a[10], a[11]]);
  return [...r, ...t];
};

function loadModel(file, keep) {
  const path = join(downloads, file);
  const root = unzip(path, "3D/3dmodel.model");
  const unit = attr(root.match(/<model\b[^>]*>/)[0], "unit") ?? "millimeter";
  const scale = { inch: 25.4, millimeter: 1, centimeter: 10 }[unit] ?? 1;
  const files = { "/3D/3dmodel.model": parseMeshes(root) };
  for (const e of list(path)) if (e.startsWith("3D/Objects/")) files["/" + e] = parseMeshes(unzip(path, e));

  const parts = [];
  const resolve = (fileKey, id, m) => {
    const o = files[fileKey].get(id);
    if (o.v) parts.push({ v: o.v.map((p) => apply(m, p)), t: o.t });
    else for (const c of o.comps) resolve(c.path ?? fileKey, c.objectid, compose(parseT(c.transform), m));
  };
  const builds = [...root.matchAll(/<item\b([^>]*)\/>/g)];
  // Bambu files place every plate on one build; keep the first item unless asked for the largest part.
  const items = keep === "all" && builds.length > 1 && !file.includes("Drawer") ? builds.slice(0, 1) : builds;
  for (const b of items) resolve("/3D/3dmodel.model", attr(b[1], "objectid"), parseT(attr(b[1], "transform")));

  let chosen = parts;
  if (keep === "largest") chosen = [parts.sort((a, b) => b.t.length - a.t.length)[0]];
  const positions = [], indices = [];
  for (const p of chosen) {
    const base = positions.length / 3;
    for (const v of p.v) positions.push(v[0] * scale, v[1] * scale, v[2] * scale);
    for (const t of p.t) indices.push(t[0] + base, t[1] + base, t[2] + base);
  }
  const meta = (name) => root.match(new RegExp(`name="${name}"[^>]*>([^<]*)`))?.[1]?.replace(/&amp;quot;|&quot;/g, '"').replace(/&amp;/g, "&");
  return { positions, indices, designer: meta("Designer") ?? null, title: meta("Title") };
}

const page_html = `<!doctype html><html><head><style>html,body{margin:0;background:transparent}</style>
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script></head>
<body><script type="module">
import * as THREE from "three";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
window.draw = ({ positions, indices, size, paper, ink, width }) => {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(size, size); renderer.setClearColor(0, 0);
  document.body.appendChild(renderer.domElement);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices); geo.computeBoundingBox();
  const box = geo.boundingBox, center = box.getCenter(new THREE.Vector3()), dims = box.getSize(new THREE.Vector3());
  geo.translate(-center.x, -center.y, -center.z);
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: paper, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })));
  const edges = new THREE.EdgesGeometry(geo, 24);
  const lg = new LineSegmentsGeometry().setPositions(edges.attributes.position.array);
  const mat = new LineMaterial({ color: ink, linewidth: width, resolution: new THREE.Vector2(size, size) });
  scene.add(new LineSegments2(lg, mat));
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -1e5, 1e5);
  cam.up.set(0, 0, 1); cam.position.set(1, -1.15, 0.9); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
  // fit: project corners into camera space
  let r = 0; const v = new THREE.Vector3();
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    v.set(sx * dims.x / 2, sy * dims.y / 2, sz * dims.z / 2).applyMatrix4(cam.matrixWorldInverse);
    r = Math.max(r, Math.abs(v.x), Math.abs(v.y));
  }
  r *= 1.06; Object.assign(cam, { left: -r, right: r, top: r, bottom: -r }); cam.updateProjectionMatrix();
  renderer.render(scene, cam);
  return [dims.x, dims.y, dims.z];
};
window.ready = true;
</script></body></html>`;

const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=metal", "--enable-gpu"] });
const page = await browser.newPage({ viewport: { width: 1400, height: 1400 } });
await page.route("http://render.local/**", async (route) => {
  const p = new URL(route.request().url()).pathname;
  if (p === "/") return route.fulfill({ contentType: "text/html", body: page_html });
  const body = await readFile(join(threeDir, p.replace(/^\/three\//, "")));
  route.fulfill({ contentType: "text/javascript", body });
});
await page.goto("http://render.local/");
await page.waitForFunction(() => window.ready);

const prints = {};
for (const [slug, file, keep] of models) {
  const m = loadModel(file, keep);
  const dims = await page.evaluate((args) => window.draw(args), {
    positions: m.positions, indices: m.indices, size: 1400, paper: "#ECEFEC", ink: "#18202A", width: 2.2,
  });
  await page.locator("canvas").last().screenshot({ path: join(out, `print-${slug}.png`), omitBackground: true });
  await page.evaluate(() => document.querySelectorAll("canvas").forEach((c) => c.remove()));
  prints[slug] = { mm: dims.map((d) => Math.round(d * 10) / 10), designer: m.designer, title: m.title, triangles: m.indices.length / 3 };
  console.log(slug, prints[slug]);
}
await writeFile(dimsOut, JSON.stringify(prints, null, 2));
await browser.close();
