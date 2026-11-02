import { MotionConfig } from "framer-motion";
import { About } from "./components/About";
import { ByHand } from "./components/ByHand";
import { Contact } from "./components/Contact";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Outside } from "./components/Outside";
import { Projects } from "./components/Projects";
import { Sports } from "./components/Sports";
import { useSmoothScroll } from "./components/useSmoothScroll";
import { ContentProvider } from "./editor/store";
import { Toolbar } from "./editor/Toolbar";

export default function App() {
  return (
    <ContentProvider>
      <Page />
    </ContentProvider>
  );
}

function Page() {
  useSmoothScroll();
  return (
    <MotionConfig reducedMotion="user">
      <a className="skip" href="#about">
        Skip to content
      </a>
      <Header />
      <main>
        <Hero />
        <About />
        <Projects />
        <ByHand />
        <Outside />
        <Sports />
        <Contact />
      </main>
      <Toolbar />
    </MotionConfig>
  );
}
