import { motion } from "framer-motion";
import { DUR, EASE } from "../motion";
import { Dim } from "./Dim";

type Props = { title: string; measure?: string; intro?: string; id?: string; hideTitle?: boolean };

// Section title revealed from a mask, measured by a dimension line underneath.
export function SectionHead({ title, measure, intro, id, hideTitle = false }: Props) {
  return (
    <header className="shead">
      <motion.h2 className={hideTitle ? "sr-only" : "shead__title"} id={id} initial="hidden" whileInView="show" viewport={{ once: true, margin: "0px 0px -10% 0px" }}>
        <span className="mask">
          <motion.span className="mask__in" variants={{ hidden: { y: "105%" }, show: { y: "0%", transition: { duration: DUR.slow, ease: EASE } } }}>
            {title}
          </motion.span>
        </span>
      </motion.h2>
      <Dim delay={0.15}>{measure}</Dim>
      {intro && (
        <motion.p
          className="shead__intro"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: DUR.base, ease: EASE, delay: 0.3 }}
        >
          {intro}
        </motion.p>
      )}
    </header>
  );
}
