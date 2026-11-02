# Resume site

Personal site for college admissions. Built with Vite, React, Framer Motion, GSAP ScrollTrigger and Lenis.

## Edit the content

Run `npm run dev`, open the site, and press **Edit page** (bottom right).

- Click any text to change it. Click away to save; press Escape to cancel. Single-line fields also save on Enter.
- Use the ↑ ↓ × buttons to reorder or remove items, and the dashed "+ Add" buttons to add projects, builds, sports, links and so on.
- "Upload photo" saves the image into `public/media/uploads/`.
- "URL" changes where a link points.

Every change is written to `src/content.json` straight away. The editor only exists while `npm run dev` is running. The built site has no editor, so visitors can't change anything.

Any string starting with `TODO:` shows with a dashed orange underline, so you can see what's still missing.

## Run it

```sh
npm install
npm run dev
```

Build for hosting with `npm run build`. The `dist/` folder is a static site that works on Netlify, Vercel or GitHub Pages.

## Asset tools

`tools/` has its own `package.json` (run `npm install` inside it first). Scripts use your installed Google Chrome.

- `make-contours.mjs` regenerates the contour artwork (`src/art/contours.json`, `public/og.png`, `design/sounding-lines.png`).
- `make-video.mjs` cuts the silent APEX loop and poster from the trailer shots in `~/Desktop/Race Game`.
- `screenshots.mjs` captures project screenshots.
- `render-3mf.mjs` turns `.3mf` files into line drawings, in case you add your own CAD work later.
- `fusion/ExportForSite` is a Fusion script. In Fusion: Utilities > Scripts and Add-Ins > the + next to "My Scripts" > pick this folder. Open a design and run it. It saves a 3MF, two renders and a facts file (components, bodies, size) into `public/media/fusion/`.

## Design

`design/theme.md` lists the colors, fonts and motion rules. `design/sounding-lines.md` describes the contour artwork.
