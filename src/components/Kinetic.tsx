import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Fragment, useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/**
 * A section title as two rows of huge type. The rows slide in opposite directions with the scroll,
 * lean with scroll speed, and the first word's letters assemble as the band arrives. No pinning.
 */
export function KineticBand({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const [top, bottom] = gsap.utils.toArray<HTMLElement>(".kinetic__row");
        const range = { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: 0.5 };
        gsap.fromTo(top, { xPercent: 0 }, { xPercent: -22, ease: "none", scrollTrigger: range });
        gsap.fromTo(bottom, { xPercent: -22 }, { xPercent: 0, ease: "none", scrollTrigger: range });

        const split = SplitText.create(".kinetic__lead", { type: "chars", mask: "chars" });
        gsap.from(split.chars, {
          yPercent: 115,
          rotate: 6,
          ease: "power3.out",
          stagger: 0.035,
          scrollTrigger: { trigger: ref.current, start: "top 92%", end: "top 45%", scrub: 0.6 },
        });

        // Lean with scroll speed, then settle back upright.
        const lean = { skew: 0 };
        const setSkew = gsap.quickSetter([top, bottom], "skewX", "deg");
        ScrollTrigger.create({
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const skew = gsap.utils.clamp(-10, 10, self.getVelocity() / -320);
            if (Math.abs(skew) > Math.abs(lean.skew)) {
              lean.skew = skew;
              gsap.to(lean, { skew: 0, duration: 0.8, ease: "power3", overwrite: true, onUpdate: () => setSkew(lean.skew) });
            }
          },
        });
        return () => split.revert();
      });
    },
    { scope: ref },
  );

  const repeat = (lead: boolean) =>
    Array.from({ length: 6 }, (_, i) => (
      <Fragment key={i}>
        <span className={lead && i === 0 ? "kinetic__word kinetic__lead" : i % 2 ? "kinetic__word is-outline" : "kinetic__word"}>{text}</span>
        <span className="kinetic__dot" aria-hidden />
      </Fragment>
    ));

  return (
    <div className="kinetic" ref={ref} aria-hidden>
      <div className="kinetic__row">{repeat(true)}</div>
      <div className="kinetic__row">{repeat(false)}</div>
    </div>
  );
}
