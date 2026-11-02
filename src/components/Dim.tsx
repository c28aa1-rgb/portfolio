import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { DUR, EASE } from "../motion";

type Props = {
  children?: ReactNode;
  delay?: number;
  /** "load" animates on mount, "view" when scrolled into view. */
  trigger?: "load" | "view";
  href?: string;
  className?: string;
  /** Hide the left tick when this segment continues a chain. */
  chained?: boolean;
};

// A CAD-style dimension line: oblique end ticks, a line drawn out from the centre, a label in a gap.
export function Dim({ children, delay = 0, trigger = "view", href, className = "", chained = false }: Props) {
  const reduce = useReducedMotion();
  const play = trigger === "load" ? { initial: "hidden", animate: "show" } : { initial: "hidden", whileInView: "show", viewport: { once: true, margin: "0px 0px -10% 0px" } };
  const line = {
    hidden: { scaleX: reduce ? 1 : 0 },
    show: { scaleX: 1, transition: { duration: DUR.slow, ease: EASE, delay } },
  };
  const tick = {
    hidden: { opacity: 0, scaleY: reduce ? 1 : 0.2 },
    show: { opacity: 1, scaleY: 1, transition: { duration: DUR.quick, ease: EASE, delay: delay + DUR.slow * 0.55 } },
  };
  const label = {
    hidden: { opacity: 0, y: reduce ? 0 : 6 },
    show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE, delay: delay + DUR.slow * 0.35 } },
  };
  const Label = href ? motion.a : motion.span;
  return (
    <motion.div className={`dim ${chained ? "dim--chained" : ""} ${className}`} {...play}>
      <motion.span className="dim__line" variants={line} aria-hidden />
      {!chained && <motion.span className="dim__tick dim__tick--start" variants={tick} aria-hidden />}
      <motion.span className="dim__tick dim__tick--end" variants={tick} aria-hidden />
      {children != null && (
        <Label className="dim__label" variants={label} {...(href ? { href } : {})}>
          {children}
        </Label>
      )}
    </motion.div>
  );
}
