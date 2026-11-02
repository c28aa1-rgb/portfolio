import { motion, useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { useContent } from "../editor/store";
import { isTodo } from "./Text";

export const sections = [
  { id: "about", label: "About" },
  { id: "on-screen", label: "On screen" },
  { id: "by-hand", label: "By hand" },
  { id: "outside", label: "Outside" },
  { id: "contact", label: "Contact" },
];

export function Header() {
  const { person } = useContent().content;
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 40));
  const name = [person.firstName, person.lastName].filter((s) => !isTodo(s)).join(" ") || "Your Name";
  useEffect(() => {
    document.title = name;
  }, [name]);

  return (
    <header className={`header ${scrolled ? "is-scrolled" : ""}`}>
      <a className="header__name" href="#top">
        {name}
      </a>
      <nav aria-label="Sections">
        <ul className="header__nav">
          {sections.map((s) => (
            <li key={s.id} className={s.id === "contact" ? "is-keep" : undefined}>
              <a href={`#${s.id}`}>{s.label}</a>
            </li>
          ))}
        </ul>
      </nav>
      <motion.span className="header__progress" style={{ scaleX: progress }} aria-hidden />
    </header>
  );
}
