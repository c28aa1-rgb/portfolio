import { AnimatePresence, motion, useInView } from "framer-motion";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { EASE } from "../motion";

const fmt = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

const Icon = {
  play: <path d="M8 5.5v13l11-6.5z" />,
  pause: <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />,
  back: <path d="M11 7V4L5 9l6 5v-3a5 5 0 1 1-5 5H4a7 7 0 1 0 7-7z" />,
  fwd: <path d="M13 7V4l6 5-6 5v-3a5 5 0 1 0 5 5h2a7 7 0 1 1-7-7z" />,
  muted: <path d="M4 9v6h4l5 4V5L8 9zm12.6 3 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4z" />,
  sound: <path d="M4 9v6h4l5 4V5L8 9zm11.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM13 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />,
  full: <path d="M5 5h5v2H7v3H5zm9 0h5v5h-2V7h-3zM5 14h2v3h3v2H5zm12 3v-3h2v5h-5v-2z" />,
};
const Svg = ({ d }: { d: keyof typeof Icon }) => (
  <svg viewBox="0 0 24 24" aria-hidden width="20" height="20" fill="currentColor">
    {Icon[d]}
  </svg>
);

/**
 * True when the next stacked project card has slid over at least half of this video.
 * (A sticky card stays "on screen" geometrically even while another card covers it.)
 */
function useCovered(box: React.RefObject<HTMLDivElement | null>) {
  const [covered, setCovered] = useState(false);
  useEffect(() => {
    const check = () => {
      const el = box.current;
      const next = el?.closest(".project")?.nextElementSibling as HTMLElement | null;
      if (!el || !next) return setCovered(false);
      const v = el.getBoundingClientRect();
      setCovered(next.getBoundingClientRect().top < v.top + v.height / 2);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [box]);
  return covered;
}

/** The APEX trailer: plays (with sound when the browser allows) while on screen, has its own controls. */
export function Trailer({ src, poster, label }: { src: string; poster?: string; label: string }) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const onScreen = useInView(box, { amount: 0.45 });
  const covered = useCovered(box);
  const inView = onScreen && !covered;
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [forcedMute, setForcedMute] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [banner, setBanner] = useState(false);
  const userPaused = useRef(false);
  const userMuted = useRef(false);
  const bannerShown = useRef(false);

  // Try to start with sound. Browsers block that until the visitor has clicked or typed on the page,
  // so fall back to muted playback and switch the sound on at their first interaction.
  const start = () => {
    const el = video.current;
    if (!el) return;
    el.muted = userMuted.current;
    el.play().catch(() => {
      el.muted = true;
      setMuted(true);
      setForcedMute(true);
      el.play().catch(() => {});
    });
  };

  useEffect(() => {
    if (!forcedMute) return;
    const unlock = () => {
      const el = video.current;
      if (!el || userMuted.current) return;
      el.muted = false;
      setMuted(false);
      setForcedMute(false);
    };
    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, [forcedMute]);

  // Play while visible unless the viewer paused it themselves.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (inView && !userPaused.current) start();
    if (!inView) v.pause();
  }, [inView]);

  // Browsers pause muted video in background tabs; pick it back up when the tab returns.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && inView && !userPaused.current) start();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [inView]);

  // Offer sound once, shortly after the first play, then tuck the banner away.
  useEffect(() => {
    if (!playing || bannerShown.current) return;
    bannerShown.current = true;
    const show = window.setTimeout(() => setBanner(true), 700);
    const hide = window.setTimeout(() => setBanner(false), 8000);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [playing]);

  const v = () => video.current!;
  const toggle = () => {
    // While the browser has it muted, the first click on the video turns the sound on instead of pausing.
    if (forcedMute && !v().paused) return setSound(true, Math.max(volume, 0.6));
    if (v().paused) {
      userPaused.current = false;
      start();
    } else {
      userPaused.current = true;
      v().pause();
    }
  };
  const skip = (by: number) => (v().currentTime = Math.min(Math.max(0, v().currentTime + by), duration || 0));
  const setSound = (on: boolean, level = volume) => {
    userMuted.current = !on;
    setForcedMute(false);
    v().muted = !on;
    v().volume = level;
    setMuted(!on);
    setBanner(false);
  };
  const onVolume = (e: ChangeEvent<HTMLInputElement>) => {
    const level = Number(e.target.value);
    setVolume(level);
    setSound(level > 0, level);
  };
  const onSeek = (e: ChangeEvent<HTMLInputElement>) => (v().currentTime = Number(e.target.value));
  const fullscreen = () => (document.fullscreenElement ? document.exitFullscreen() : box.current?.requestFullscreen());

  return (
    <>
    <div className="media media--trailer">
    <div className={`trailer ${playing ? "is-playing" : "is-paused"}`} ref={box}>
      <video
        ref={video}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        aria-label={label}
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => {
          userPaused.current = true;
        }}
      />

      <AnimatePresence>
        {!playing && (
          <motion.button
            type="button"
            className="trailer__big"
            onClick={toggle}
            aria-label="Play trailer"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.15 }}
            transition={{ duration: 0.25, ease: EASE }}
          >
            <Svg d="play" />
          </motion.button>
        )}
      </AnimatePresence>



      <div className="trailer__bar">
        <input className="trailer__seek" type="range" min={0} max={duration || 0} step={0.1} value={time} onChange={onSeek} aria-label="Seek" style={{ "--p": `${duration ? (time / duration) * 100 : 0}%` } as React.CSSProperties} />
        <div className="trailer__row">
          <button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            <Svg d={playing ? "pause" : "play"} />
          </button>
          <button type="button" onClick={() => skip(-10)} aria-label="Back 10 seconds">
            <Svg d="back" />
          </button>
          <button type="button" onClick={() => skip(10)} aria-label="Forward 10 seconds">
            <Svg d="fwd" />
          </button>
          <span className="trailer__time">
            {fmt(time)} / {fmt(duration)}
          </span>
          <span className="trailer__spacer" />
          <button type="button" onClick={() => setSound(muted)} aria-label={muted ? "Unmute" : "Mute"}>
            <Svg d={muted ? "muted" : "sound"} />
          </button>
          <input className="trailer__volume" type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={onVolume} aria-label="Volume" style={{ "--p": `${(muted ? 0 : volume) * 100}%` } as React.CSSProperties} />
          <button type="button" onClick={fullscreen} aria-label="Full screen">
            <Svg d="full" />
          </button>
        </div>
      </div>
    </div>
    </div>

    {/* Sits under the video and drops down from behind it. */}
    <div className="trailer__note-slot">
      <AnimatePresence>
        {banner && (
          <motion.button
            type="button"
            className="trailer__note"
            onClick={() => {
              if (muted) setSound(true, Math.max(volume, 0.6));
              setBanner(false);
            }}
            initial={{ y: "-110%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-110%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            <Svg d="sound" />
            <span>
              <strong>{muted ? "Click for sound" : "Turn your volume up"}</strong>
              <em>{muted ? "Your browser started the trailer muted" : "The trailer has music"}</em>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}
