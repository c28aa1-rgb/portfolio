# Theme: Survey Plate

Custom theme for this site (theme-factory "create your own"). It borrows from the drawings and charts behind the things the site covers: CAD dimension lines, lake depth charts and aeronautical charts.

## Colors

| Name | Hex | Use |
|---|---|---|
| Chart paper | `#ECEFEC` | Page background (cool grey-green, not cream) |
| Ink | `#18202A` | Text, contour lines, rules |
| Graphite | `#5B646E` | Secondary text, labels |
| Hairline | `#C5CCC8` | Dividers, frames |
| Survey blue | `#2B5A86` | Links, water and air details |
| Windsock orange | `#F0531C` | One accent mark per view: the waypoint, the progress bar, focus rings |
| Screen | `#11161C` | Background of the "On screen" section |
| Screen ink | `#E3E8E5` | Text on Screen |

Orange is graphic only. It is never used for body text, because it fails contrast on Chart paper.

## Type

- Display: **Archivo**, width 112 to 125, weight 700 to 800, tight tracking. Names and section titles only.
- Body: **Newsreader**, text optical size, 400 with italic for asides.
- Labels: **Martian Mono**, width 87.5, weight 400, uppercase with wide tracking. Dimension labels, captions and metadata.

## Signature

Chain dimension lines, as on a CAD drawing. Under the name, one line splits into three linked segments (On screen, By hand, Outside) that act as the main navigation. Each section title carries its own dimension line labeled with a true count.

## Motion

- One easing curve for entrances: `cubic-bezier(0.16, 1, 0.3, 1)`.
- Durations: 0.2 s (hover), 0.6 s (entrances), 1.0 s (dimension lines and hero).
- Staggers stay under 0.5 s in total.
- Scroll-linked effects finish within one viewport of scrolling. Nothing is pinned.
- `prefers-reduced-motion` turns off smooth scrolling, parallax and line drawing.
