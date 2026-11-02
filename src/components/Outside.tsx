import { motion } from "framer-motion";
import type { Hobby } from "../content";
import { AddButton, E, ItemTools, UploadButton } from "../editor/Editable";
import { useContent } from "../editor/store";
import { DUR, EASE, inView, rise, stagger } from "../motion";
import { Contours, field } from "./Contours";
import { KineticBand } from "./Kinetic";
import { Photo } from "./Photo";
import { SectionHead } from "./SectionHead";


// Airspace rings, drawn the way a sectional chart draws controlled airspace around an airport.
function Airspace() {
  const rings = [
    { r: 60, label: "100/SFC" },
    { r: 120, label: "100/30" },
    { r: 185, label: "100/70" },
  ];
  const draw = (i: number) => ({
    hidden: { pathLength: 0, opacity: 0 },
    show: { pathLength: 1, opacity: 1, transition: { duration: 1.4, ease: EASE, delay: 0.1 + i * 0.15 } },
  });
  return (
    <motion.svg className="airspace" viewBox="-260 -160 520 320" preserveAspectRatio="xMidYMid slice" aria-hidden initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
      {rings.map((ring, i) => (
        <g key={ring.r}>
          <motion.circle r={ring.r} variants={draw(i)} className={i === 0 ? "airspace__ring is-inner" : "airspace__ring"} />
          <motion.text x={ring.r * 0.7 + 6} y={-ring.r * 0.7 - 4} variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 0.8 + i * 0.15 } } }}>
            {ring.label}
          </motion.text>
        </g>
      ))}
      <motion.g className="airspace__runway" variants={{ hidden: { opacity: 0, scale: 0.6 }, show: { opacity: 1, scale: 1, transition: { delay: 0.5, type: "spring", stiffness: 240, damping: 20 } } }}>
        {/* A long main runway and a shorter crosswind runway that meets it off-centre. */}
        <rect x="-40" y="-2.5" width="80" height="5" transform="rotate(-18)" />
        <rect x="-4" y="-2" width="34" height="4" transform="rotate(48) translate(-14 0)" />
      </motion.g>
    </motion.svg>
  );
}

function Art({ id }: { id: Hobby["id"] }) {
  if (id === "flying") return <Airspace />;
  // The lake from the hero, cropped close so the soundings read.
  const { x, y } = field.waypoint;
  return <Contours crop={[x - 300, y - 190, 600, 380]} trigger="view" />;
}

export function Outside() {
  const { content, editing } = useContent();
  const { hobbies, alsoInto } = content;
  return (
    <section className="section" id="outside" aria-labelledby="outside-title">
      <KineticBand text="Outside" />
      <div className="wrap">
        <SectionHead hideTitle id="outside-title" title="Outside" measure={`${hobbies.length} hobbies`} intro="What I do when I'm not building something." />
        <motion.div className="hobbies" variants={stagger(0.12)} {...inView}>
          {hobbies.map((h, i) => (
            <motion.article key={i} className={`hobby hobby--${h.id} item`} variants={rise}>
              <div className="hobby__art">{h.photo ? <Photo src={h.photo} alt={h.title} ratio="16 / 10" /> : <Art id={h.id} />}</div>
              <UploadButton path={`hobbies.${i}.photo`} label="Use a photo instead" />
              <div className="hobby__body">
                <E path={`hobbies.${i}.title`} as="h3" className="hobby__title" />
                <E path={`hobbies.${i}.story`} as="p" className="hobby__story" multiline />
                <p className="hobby__stat">
                  <E path={`hobbies.${i}.stat.value`} className="hobby__value" />
                  <E path={`hobbies.${i}.stat.label`} className="hobby__label" />
                </p>
              </div>
              <ItemTools path="hobbies" index={i} count={hobbies.length} />
            </motion.article>
          ))}
        </motion.div>
        <AddButton path="hobbies" item={{ id: "other", title: "TODO: Hobby", story: "TODO: A few sentences.", stat: { value: "TODO", label: "TODO: A number worth sharing" }, photo: null }}>
          Add hobby
        </AddButton>

        <motion.div className="also" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: DUR.base }}>
          <p className="also__label">Other interests</p>
          {editing ? (
            <ul className="also__edit">
              {alsoInto.map((_, i) => (
                <li key={i} className="item">
                  <E path={`alsoInto.${i}`} />
                  <ItemTools path="alsoInto" index={i} count={alsoInto.length} />
                </li>
              ))}
              <li>
                <AddButton path="alsoInto" item="TODO: Interest">
                  Interest
                </AddButton>
              </li>
            </ul>
          ) : (
          <div className="marquee" aria-label={alsoInto.join(", ")}>
            <div className="marquee__track" aria-hidden>
              {[...alsoInto, ...alsoInto, ...alsoInto, ...alsoInto].map((_, i) => (
                <span key={i} className="marquee__item">
                  <E path={`alsoInto.${i % alsoInto.length}`} />
                </span>
              ))}
            </div>
          </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
