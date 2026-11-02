import type { Transition, Variants } from "framer-motion";

// One curve for entrances, three durations. See design/theme.md.
export const EASE = [0.16, 1, 0.3, 1] as const;
export const DUR = { quick: 0.2, base: 0.6, slow: 1.0 };

export const enter: Transition = { duration: DUR.base, ease: EASE };

export const rise: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: enter },
};

export const stagger = (each = 0.08, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: each, delayChildren: delay } },
});

// Fires once, a little before the element is fully on screen.
export const inView = { initial: "hidden", whileInView: "show", viewport: { once: true, margin: "0px 0px -12% 0px" } } as const;
