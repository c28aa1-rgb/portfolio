import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "framer-motion";

gsap.registerPlugin(ScrollTrigger);

// Lenis smooth scroll, driven by GSAP's ticker so ScrollTrigger scrubs stay in sync.
export function useSmoothScroll() {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({ duration: 1.05, easing: (t) => 1 - Math.pow(1 - t, 4) });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Anchor links glide instead of jumping.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      const id = a?.getAttribute("href");
      const target = id && id.length > 1 ? document.querySelector<HTMLElement>(id) : id === "#top" ? document.body : null;
      if (!a || !target) return;
      e.preventDefault();
      lenis.scrollTo(id === "#top" ? 0 : target, { offset: -56 });
      history.replaceState(null, "", id);
    };
    document.addEventListener("click", onClick);
    // Fonts change line heights, which moves every trigger.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => {
      gsap.ticker.remove(tick);
      document.removeEventListener("click", onClick);
      lenis.destroy();
    };
  }, [reduce]);
}
