import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const EVERY = 3800;

/** Screenshots that cross-fade on a timer while on screen. Hover pauses; dots jump to a slide. */
export function Gallery({ images, alt, ratio: fixed }: { images: string[]; alt: string; ratio?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const visible = useInView(box, { amount: 0.4 });
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ratio, setRatio] = useState<number | null>(null);
  const count = images.length;

  useEffect(() => {
    if (!visible || paused || reduce || count < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), EVERY);
    return () => window.clearInterval(id);
  }, [visible, paused, reduce, count]);

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  const src = images[Math.min(index, count - 1)];
  return (
    <div
      className="gallery"
      ref={box}
      style={fixed || ratio ? { aspectRatio: String(fixed ?? ratio) } : undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* The first screenshot sets the frame's shape; later ones fit inside it. */}
      <img className="gallery__sizer" src={images[0]} alt="" aria-hidden onLoad={(e) => setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)} />
      <AnimatePresence initial={false}>
        <motion.img
          key={src}
          className="gallery__img"
          src={src}
          alt={`${alt} (${index + 1} of ${count})`}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      </AnimatePresence>
      {count > 1 && (
        <div className="gallery__dots" role="tablist" aria-label="Screenshots">
          {images.map((_, i) => (
            <button key={i} type="button" role="tab" aria-selected={i === index} aria-label={`Screenshot ${i + 1}`} className={i === index ? "is-on" : ""} onClick={() => setIndex(i)}>
              {i === index && !paused && visible && !reduce && <motion.span className="gallery__progress" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: EVERY / 1000, ease: "linear" }} key={index} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
