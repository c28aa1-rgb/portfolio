import { motion } from "framer-motion";
import { AddButton, E, ItemTools, UploadButton } from "../editor/Editable";
import { useContent } from "../editor/store";
import { inView, rise, stagger } from "../motion";
import { Photo } from "./Photo";
import { ReadingHighlight } from "./Scrub";
import { SectionHead } from "./SectionHead";
import { isTodo } from "./Text";

export function About() {
  const { content, editing } = useContent();
  const { about } = content;
  return (
    <section className="section" id="about" aria-labelledby="about-title">
      <div className="wrap">
        <SectionHead id="about-title" title="About" />
        <div className="about">
          <motion.div className="about__photo" variants={rise} {...inView}>
            <Photo src={about.photo} alt="Portrait" caption="Portrait" />
            <UploadButton path="about.photo" label="Upload portrait" />
          </motion.div>
          <motion.div className="about__body" variants={stagger(0.1)} {...inView}>
            {about.bio.map((p, i) => (
              <motion.div key={i} variants={rise} className="item">
                {i === 0 && !editing && !isTodo(p) ? (
                  <ReadingHighlight text={p} className="lede" />
                ) : (
                  <E path={`about.bio.${i}`} as="p" className={i === 0 ? "lede" : undefined} multiline />
                )}
                <ItemTools path="about.bio" index={i} count={about.bio.length} />
              </motion.div>
            ))}
            <AddButton path="about.bio" item="TODO: New paragraph.">
              Add paragraph
            </AddButton>
            <motion.dl className="facts" variants={stagger(0.06)}>
              {about.facts.map((_, i) => (
                <motion.div key={i} className="facts__row item" variants={rise}>
                  <E path={`about.facts.${i}.label`} as="dt" />
                  <E path={`about.facts.${i}.value`} as="dd" />
                  <ItemTools path="about.facts" index={i} count={about.facts.length} />
                </motion.div>
              ))}
            </motion.dl>
            <AddButton path="about.facts" item={{ label: "Label", value: "TODO: Value" }}>
              Add fact
            </AddButton>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
