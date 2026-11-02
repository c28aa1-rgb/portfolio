import { motion, useInView, useReducedMotion } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import type { Project } from "../content";
import { AddButton, E, GalleryTools, HrefButton, ItemTools, UploadButton } from "../editor/Editable";
import { useContent } from "../editor/store";
import { DUR, EASE, inView, rise, stagger } from "../motion";
import { KineticBand } from "./Kinetic";
import { Parallax } from "./Scrub";
import { SectionHead } from "./SectionHead";
import { Gallery } from "./Gallery";
import { Trailer } from "./Trailer";

function Media({ media, title }: { media: Project["media"]; title: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const visible = useInView(frame, { margin: "10% 0px" });

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (visible && !reduce) v.play().catch(() => {});
    else v.pause();
  }, [visible, reduce]);

  if (media.type === "trailer")
    return (
      <Trailer src={media.src} poster={media.poster} label={media.alt} />
    );

  if (media.type === "gallery" && media.images?.length)
    return (
      <motion.div className="media media--image" ref={frame} whileHover={{ scale: 0.985 }} transition={{ type: "spring", stiffness: 260, damping: 28 }}>
        <Gallery images={media.images} alt={media.alt} />
      </motion.div>
    );

  if (!media.src)
    return (
      <div className="media is-empty" ref={frame}>
        <span className="todo">Screenshot of {title} needed</span>
      </div>
    );

  return (
    <motion.div className={`media ${media.type === "image" ? "media--image" : ""}`} ref={frame} whileHover={{ scale: 0.985 }} transition={{ type: "spring", stiffness: 260, damping: 28 }}>
      {media.type === "video" ? (
        <Parallax className="media__inner" trigger="parent">
          <video ref={video} src={media.src} poster={media.poster} muted loop playsInline preload="metadata" aria-label={media.alt} />
        </Parallax>
      ) : (
        // Screenshots show whole, at their own aspect ratio: no crop, no parallax zoom.
        <img src={media.src} alt={media.alt} loading="lazy" />
      )}
    </motion.div>
  );
}

function Row({ p, i, count }: { p: Project; i: number; count: number }) {
  const { editing } = useContent();
  const base = `projects.${i}`;
  return (
    <article className={`project ${i % 2 ? "project--flip" : ""}`} id={`project-${p.id}`} style={{ "--i": i } as React.CSSProperties}>
      <motion.div className="project__media" initial={{ opacity: 0, y: 48 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -15% 0px" }} transition={{ duration: DUR.slow, ease: EASE }}>
        <Media media={p.media} title={p.title} />
        {p.media.type === "image" && <UploadButton path={`${base}.media.src`} label="Upload screenshot" />}
        {p.media.type === "gallery" && <GalleryTools path={`${base}.media.images`} />}
      </motion.div>
      <motion.div className="project__text" variants={stagger(0.07, 0.1)} {...inView}>
        <motion.p className="project__meta" variants={rise}>
          <E path={`${base}.kind`} /> <span aria-hidden>·</span> <E path={`${base}.year`} />
          <ItemTools path="projects" index={i} count={count} />
        </motion.p>
        <motion.h3 className="project__title" variants={rise}>
          <E path={`${base}.title`} />
        </motion.h3>
        <motion.div variants={rise}>
          <E path={`${base}.summary`} as="p" className="project__summary" multiline />
        </motion.div>
        <motion.ul className="project__details" variants={rise}>
          {p.details.map((_, j) => (
            <li key={j} className="item">
              <E path={`${base}.details.${j}`} multiline />
              <ItemTools path={`${base}.details`} index={j} count={p.details.length} />
            </li>
          ))}
        </motion.ul>
        <AddButton path={`${base}.details`} item="TODO: Another detail.">
          Add detail
        </AddButton>
        <motion.p className="project__stack" variants={rise}>
          {p.stack.map((_, j) => (
            <span key={j} className="item">
              <E path={`${base}.stack.${j}`} />
              <ItemTools path={`${base}.stack`} index={j} count={p.stack.length} />
            </span>
          ))}
          <AddButton path={`${base}.stack`} item="Tool">
            Tool
          </AddButton>
        </motion.p>
        {(p.links.length > 0 || editing) && (
          <motion.p className="project__links" variants={rise}>
            {p.links.map((l, j) => (
              <span key={j} className="item">
                <a href={l.href} target="_blank" rel="noreferrer" className="arrow-link">
                  <E path={`${base}.links.${j}.label`} />
                  <span aria-hidden>↗</span>
                </a>
                <HrefButton path={`${base}.links.${j}.href`} />
                <ItemTools path={`${base}.links`} index={j} count={p.links.length} />
              </span>
            ))}
            <AddButton path={`${base}.links`} item={{ label: "Link", href: "https://" }}>
              Link
            </AddButton>
          </motion.p>
        )}
      </motion.div>
    </article>
  );
}

const blankProject: Project = {
  id: "new",
  title: "TODO: Project name",
  kind: "TODO: Kind",
  year: "TODO: Year",
  summary: "TODO: One sentence on what it does.",
  details: ["TODO: A specific detail."],
  stack: ["TODO: Stack"],
  media: { type: "image", src: "", alt: "Screenshot" },
  links: [],
};

export function Projects() {
  const { projects } = useContent().content;
  const ref = useRef<HTMLElement>(null);

  // Stacking deck (desktop): each card is position: sticky in CSS; as the next card slides over it,
  // the covered card shrinks back and dims.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils.toArray<HTMLElement>(".project");
        cards.forEach((card, i) => {
          const next = cards[i + 1];
          if (!next) return;
          gsap.to(card, {
            scale: 0.92,
            "--dim": 0.55,
            ease: "none",
            scrollTrigger: { trigger: next, start: "top bottom", end: "top 30%", scrub: true },
          });
        });
      });
    },
    { scope: ref, dependencies: [projects.length], revertOnUpdate: true },
  );

  return (
    <section className="section section--screen" id="on-screen" aria-labelledby="on-screen-title" ref={ref}>
      <KineticBand text="On screen" />
      <div className="wrap">
        <SectionHead hideTitle id="on-screen-title" title="On screen" measure={`${projects.length} projects`} intro="These are some games and websites that I created. Most of them are live... try them out!" />
        <div className="projects">
          {projects.map((p, i) => (
            <Row key={`${p.id}-${i}`} p={p} i={i} count={projects.length} />
          ))}
        </div>
        <AddButton path="projects" item={{ ...blankProject, id: `p${Date.now().toString(36)}` }}>
          Add project
        </AddButton>
      </div>
    </section>
  );
}
