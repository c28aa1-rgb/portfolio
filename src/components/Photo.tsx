import { motion } from "framer-motion";

type Props = { src: string | null; alt: string; ratio?: string; caption?: string; hoverSrc?: string | null };

// A photo frame with registration crop marks. Shows an empty slot until a photo is set in content.ts.
export function Photo({ src, alt, ratio = "4 / 5", caption = "Photo", hoverSrc }: Props) {
  return (
    <motion.figure className={`photo ${src ? "" : "is-empty"} ${hoverSrc ? "has-hover" : ""}`} style={{ aspectRatio: ratio }} whileHover={src ? { scale: 1.015 } : undefined} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
      <span className="photo__mark photo__mark--tl" aria-hidden />
      <span className="photo__mark photo__mark--tr" aria-hidden />
      <span className="photo__mark photo__mark--bl" aria-hidden />
      <span className="photo__mark photo__mark--br" aria-hidden />
      {src ? <img src={src} alt={alt} loading="lazy" /> : <figcaption className="photo__empty">{caption}</figcaption>}
      {src && hoverSrc && <img className="photo__hover" src={hoverSrc} alt="" aria-hidden loading="lazy" />}
    </motion.figure>
  );
}
