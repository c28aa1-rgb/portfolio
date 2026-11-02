import { motion, useReducedMotion } from "framer-motion";
import data from "../art/contours.json";
import { EASE } from "../motion";

type Props = {
  /** Crop of the field to show, in field units: [x, y, w, h]. Defaults to the whole field. */
  crop?: [number, number, number, number];
  trigger?: "load" | "view";
  soundings?: boolean;
  waypoint?: boolean;
  className?: string;
};

const [W, H] = data.viewBox;

// The "Sounding Lines" field (tools/make-contours.mjs). Index contours (every fifth) are heavier.
export function Contours({ crop = [0, 0, W, H], trigger = "load", soundings = true, waypoint = true, className = "" }: Props) {
  const reduce = useReducedMotion();
  const play = trigger === "load" ? { initial: "hidden", animate: "show" } : { initial: "hidden", whileInView: "show", viewport: { once: true, amount: 0.2 } };
  return (
    <motion.svg className={`contours ${className}`} viewBox={crop.join(" ")} preserveAspectRatio="xMidYMid slice" aria-hidden {...play}>
      <g className="contours__lines">
        {data.paths.map((p, i) => {
          const index = p.level % 5 === 0;
          return (
            <motion.path
              key={i}
              d={p.d}
              className={index ? "is-index" : undefined}
              variants={{
                hidden: { pathLength: reduce ? 1 : 0, opacity: 0 },
                show: {
                  pathLength: 1,
                  opacity: 1,
                  transition: { pathLength: { duration: 1.8, ease: EASE, delay: 0.15 + (p.level / data.levels) * 0.5 }, opacity: { duration: 0.3, delay: 0.15 + (p.level / data.levels) * 0.5 } },
                },
              }}
            />
          );
        })}
      </g>
      {soundings && (
        <motion.g className="contours__soundings" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 1.4, duration: 0.6 } } }}>
          {data.soundings.map((s, i) => (
            <text key={i} x={s.x} y={s.y}>
              {s.v}
            </text>
          ))}
        </motion.g>
      )}
      {waypoint && (
        <motion.g
          className="contours__waypoint"
          variants={{ hidden: { opacity: 0, scale: 0.4 }, show: { opacity: 1, scale: 1, transition: { delay: 1.7, type: "spring", stiffness: 260, damping: 18 } } }}
          style={{ transformOrigin: `${data.waypoint.x}px ${data.waypoint.y}px`, transformBox: "view-box" }}
        >
          <circle className="contours__pulse" cx={data.waypoint.x} cy={data.waypoint.y} r={9} />
          <circle cx={data.waypoint.x} cy={data.waypoint.y} r={9} className="contours__ring" />
          <circle cx={data.waypoint.x} cy={data.waypoint.y} r={2.4} className="contours__dot" />
        </motion.g>
      )}
    </motion.svg>
  );
}

export const field = { W, H, waypoint: data.waypoint };
