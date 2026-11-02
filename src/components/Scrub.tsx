import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, type ReactNode } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/** Moves its child vertically while the trigger crosses the screen. Scrubbed, never pinned. */
export function Parallax({ children, from = "-7%", to = "7%", className = "", trigger = "self" }: { children: ReactNode; from?: string; to?: string; className?: string; trigger?: "self" | "parent" }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const el = ref.current!;
        gsap.fromTo(el, { y: from }, {
          y: to,
          ease: "none",
          scrollTrigger: { trigger: trigger === "parent" ? el.parentElement : el, start: "top bottom", end: "bottom top", scrub: 0.6 },
        });
      });
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={`parallax ${className}`}>
      {children}
    </div>
  );
}

/** Hero zoom-through: the hero pins for one screen while the name and map push toward the viewer. */
export function useHeroExit(root: React.RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root.current, start: "top top", end: "+=100%", pin: true, pinSpacing: false, scrub: 0.6 },
        });
        // fromTo with immediateRender off: Framer Motion owns the load-in fade, GSAP only takes over on scroll.
        tl.fromTo(".hero .eyebrow, .chain, .hero__cue", { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -24, duration: 0.18, stagger: 0.03, immediateRender: false }, 0)
          .fromTo(".hero__name", { scale: 1 }, { scale: 5.5, transformOrigin: "30% 55%", ease: "power2.in", duration: 1 }, 0)
          .to(".hero__name", { autoAlpha: 0, duration: 0.35 }, 0.65)
          .fromTo(".hero__art", { scale: 1 }, { scale: 2.1, transformOrigin: "70% 60%", ease: "power1.in", duration: 1 }, 0)
          .to(".hero__art", { autoAlpha: 0, duration: 0.3 }, 0.7);
      });
    },
    { scope: root },
  );
}

/** Words brighten from faint to full ink as the paragraph passes through the reading zone. */
export function ReadingHighlight({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(".word", { opacity: 0.18 }, {
          opacity: 1,
          ease: "none",
          stagger: 0.1,
          scrollTrigger: { trigger: ref.current, start: "top 82%", end: "bottom 52%", scrub: 0.4 },
        });
      });
    },
    { scope: ref },
  );
  return (
    <p ref={ref} className={className} aria-label={text}>
      {text.split(/(\s+)/).map((w, i) => (/\s+/.test(w) ? w : <span key={i} className="word" aria-hidden>{w}</span>))}
    </p>
  );
}
