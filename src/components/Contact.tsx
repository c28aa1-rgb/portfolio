import { motion } from "framer-motion";
import { AddButton, E, HrefButton, ItemTools } from "../editor/Editable";
import { useContent } from "../editor/store";
import { DUR, EASE } from "../motion";
import { Dim } from "./Dim";
import { isTodo } from "./Text";

export function Contact() {
  const { content, editing } = useContent();
  const { person } = content;
  const email = isTodo(person.email) ? null : person.email;
  return (
    <section className="section contact" id="contact" aria-labelledby="contact-title">
      <div className="wrap">
        <motion.p className="eyebrow" id="contact-title" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          Contact
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: DUR.slow, ease: EASE }}>
          {email && !editing ? (
            <a className="contact__email" href={`mailto:${email}`}>
              {email}
            </a>
          ) : (
            <E path="person.email" as="p" className="contact__email" />
          )}
        </motion.div>
        <Dim delay={0.2} />
        <ul className="contact__links">
          {person.links.map((l, i) => (
            <li key={i} className="item">
              <a className="arrow-link" href={l.href} target="_blank" rel="noreferrer">
                <E path={`person.links.${i}.label`} />
                <span aria-hidden>↗</span>
              </a>
              <HrefButton path={`person.links.${i}.href`} />
              <ItemTools path="person.links" index={i} count={person.links.length} />
            </li>
          ))}
          <li>
            <AddButton path="person.links" item={{ label: "Link", href: "https://" }}>
              Link
            </AddButton>
          </li>
        </ul>
      </div>
      <footer className="footer wrap">
        <p>Built with React, Framer Motion and GSAP. Contour field generated from seed 1729.</p>
      </footer>
    </section>
  );
}
