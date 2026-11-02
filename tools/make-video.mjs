// Cuts a short, silent, web-sized APEX loop and poster frames from the trailer shot renders.
import { execFileSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const shots = join(homedir(), "Desktop/Race Game/work/trailer-renders");
const out = fileURLToPath(new URL("../public/media/", import.meta.url));
const run = (args) => execFileSync(ffmpeg, ["-v", "error", "-y", ...args], { stdio: "inherit" });

const cuts = [
  ["03-launch.mp4", 0.6, 3.2],
  ["06-wheel.mp4", 0.4, 3.0],
  ["07-overtake.mp4", 1.0, 3.4],
];
const inputs = cuts.flatMap(([f, ss, t]) => ["-ss", String(ss), "-t", String(t), "-i", join(shots, f)]);
const chain = cuts.map((_, i) => `[${i}:v]scale=1280:720,fps=30,setsar=1[v${i}]`).join(";");
const concat = cuts.map((_, i) => `[v${i}]`).join("") + `concat=n=${cuts.length}:v=1:a=0[out]`;

run([...inputs, "-filter_complex", `${chain};${concat}`, "-map", "[out]", "-an",
  "-c:v", "libx264", "-preset", "slow", "-crf", "28", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
  join(out, "apex-loop.mp4")]);

run(["-ss", "1.2", "-i", join(shots, "06-wheel.mp4"), "-frames:v", "1", "-vf", "scale=1600:-2", "-q:v", "4", join(out, "apex-poster.jpg")]);
run(["-i", join(homedir(), "Desktop/Race Game/work/nascar-camry-garage.png"), "-vf", "scale=1600:-2", "-q:v", "4", join(out, "apex-garage.jpg")]);
console.log("video + posters written to", out);
