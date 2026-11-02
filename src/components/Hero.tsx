import { motion } from "framer-motion";
import { useRef } from "react";
import { DUR, EASE } from "../motion";
import { Contours } from "./Contours";
import { Dim } from "./Dim";
import { useHeroExit } from "./Scrub";
import { E } from "../editor/Editable";
import { useContent } from "../editor/store";

const line = (delay: number) => ({
  hidden: { y: "105%" },
  show: { y: "0%", transition: { duration: DUR.slow, ease: EASE, delay } },
});

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { content } = useContent();
  const { person, projects, builds, hobbies } = content;
  // Scroll-linked, never pinned: everything resolves within the hero's own height.
  useHeroExit(ref);

  // Size the name to its longest line so long names never overflow the screen.
  const longest = Math.max(...[person.firstName, person.lastName].map((n) => n.replace(/^TODO:?\s*/, "").length), 4);

  const chain = [
    { id: "on-screen", label: "On screen", count: projects.length },
    { id: "by-hand", label: "By hand", count: builds.length },
    { id: "outside", label: "Outside", count: hobbies.length },
  ];

  return (
    <section className="hero" id="top" ref={ref}>
      <div className="hero__art">
        <Contours />
      </div>

      <div className="hero__scrub">
      <motion.div className="hero__inner wrap" initial="hidden" animate="show">
        <motion.p className="eyebrow" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: DUR.base, delay: 0.1 } } }}>
          <E path="person.school" /> <span aria-hidden>·</span> Class of <E path="person.classOf" />
        </motion.p>

        <h1 className="hero__name" style={{ "--chars": longest } as React.CSSProperties}>
          <span className="mask">
            <motion.span className="mask__in" variants={line(0.15)}>
              <E path="person.firstName" />
            </motion.span>
          </span>
          <span className="mask">
            <motion.span className="mask__in" variants={line(0.27)}>
              <E path="person.lastName" />
            </motion.span>
          </span>
        </h1>

        <nav className="chain" aria-label="Jump to">
          {chain.map((c, i) => (
            <Dim key={c.id} trigger="load" delay={0.55 + i * 0.14} href={`#${c.id}`} chained={i > 0} className="chain__seg">
              {c.label}
              <span className="chain__count">{c.count}</span>
            </Dim>
          ))}
        </nav>

      </motion.div>
      </div>

      <a href="#about" className="hero__cue">
        <motion.span className="hero__cue-in" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 1.6 } }}>
          <span>Scroll</span>
          <span className="hero__cue-line" aria-hidden />
        </motion.span>
      </a>
    </section>
  );
}
