import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { motion } from "framer-motion";
import { useRef } from "react";
import { AddButton, E, GalleryTools, ItemTools, UploadButton } from "../editor/Editable";
import { useContent } from "../editor/store";
import { inView, rise, stagger } from "../motion";
import { KineticBand } from "./Kinetic";
import { Gallery } from "./Gallery";
import { Photo } from "./Photo";
import { SectionHead } from "./SectionHead";

export function ByHand() {
  const { builds } = useContent().content;
  const ref = useRef<HTMLElement>(null);

  // Horizontal strip (desktop): the panel pins and vertical scroll slides the builds sideways.
  // The pin lasts exactly as long as the sideways travel, so it never drags.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
        const track = ref.current!.querySelector<HTMLElement>(".builds")!;
        const travel = () => Math.max(0, track.scrollWidth - track.clientWidth);
        if (travel() < 40) return;
        gsap.to(track, {
          x: () => -travel(),
          ease: "none",
          scrollTrigger: { trigger: ".hstrip", start: "top top", end: () => `+=${travel()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
        });
      });
    },
    { scope: ref, dependencies: [builds.length], revertOnUpdate: true },
  );

  return (
    <section className="section section--strip" id="by-hand" aria-labelledby="by-hand-title" ref={ref}>
      <KineticBand text="By hand" />
      <div className="hstrip">
        <div className="wrap">
          <SectionHead hideTitle id="by-hand-title" title="By hand" measure={`${builds.length} builds`} intro="Things I've made away from a screen: woodworking, 3D printing and whatever the next project needs." />
          <motion.ul className="builds" variants={stagger(0.1)} {...inView}>
            {builds.map((b, i) => (
              <motion.li key={i} className="build item" variants={rise}>
                {b.images?.length ? (
                  <>
                    <div className="photo photo--gallery">
                      <span className="photo__mark photo__mark--tl" aria-hidden />
                      <span className="photo__mark photo__mark--tr" aria-hidden />
                      <span className="photo__mark photo__mark--bl" aria-hidden />
                      <span className="photo__mark photo__mark--br" aria-hidden />
                      <Gallery images={b.images} alt={b.title} ratio={4 / 3} />
                    </div>
                    <GalleryTools path={`builds.${i}.images`} />
                  </>
                ) : (
                  <>
                    <Photo src={b.photo} hoverSrc={b.photoHover} alt={b.title} caption="Photo" ratio="4 / 3" />
                    <UploadButton path={`builds.${i}.photo`} />
                  </>
                )}
                <E path={`builds.${i}.kind`} as="p" className="build__kind" />
                <E path={`builds.${i}.title`} as="h3" className="build__title" />
                <E path={`builds.${i}.note`} as="p" className="build__note" multiline />
                <ItemTools path="builds" index={i} count={builds.length} />
              </motion.li>
            ))}
          </motion.ul>
          <AddButton path="builds" item={{ title: "TODO: Project name", kind: "TODO: Kind", note: "TODO: What it is and why you made it.", photo: null }}>
            Add build
          </AddButton>
        </div>
      </div>
    </section>
  );
}
