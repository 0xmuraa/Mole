#!/usr/bin/env node
/**
 * Apply cinematic zoom events (from zooms.json) to a recorded video.
 *
 *   npm run zoom                                   # output/hypermole-scroll-1440p60.mp4 + zooms.json
 *   npm run zoom -- --out output/hypermole-edited-zoom-v2.mp4
 *   npm run zoom -- --in other.mp4 --zooms my-zooms.json --mode center
 *
 * zooms.json is an array of events:
 *   { "start": 1, "zoomIn": 1.1, "hold": 3.0, "zoomOut": 1.1, "zoom": 1.45, "x": 0.68, "y": 0.53 }
 *   start   seconds at which the zoom-in begins
 *   zoomIn  seconds to ease from 1.0 to `zoom`
 *   hold    seconds held at `zoom`
 *   zoomOut seconds to ease back to 1.0 (full frame)
 *   zoom    magnification (1.45 = 145 %)
 *   x, y    focus point as a fraction of the frame (0..1)
 *
 * Between events the video is the untouched full frame. Zoom in/out use a
 * smoothstep ease (zero velocity at both ends), evaluated per frame, so the
 * motion is continuous at 60 fps. Resolution, frame rate, frame count and
 * timing are identical to the source; only the picture inside each frame
 * changes. The input file is never modified and an existing output file is
 * never overwritten (a -v2, -v3 … suffix is added instead).
 *
 * --mode anchor (default): the focus point stays where it is on screen and the
 *        picture grows around it (no pan, always in bounds).
 * --mode center: the focus point is moved to the centre of the frame while
 *        zooming (pans; clamped to the frame edges).
 */
import { spawnSync, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { pickFfmpeg, encoderArgs } from "./lib/ffmpeg.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : def;
};
const log = (...m) => console.log("[zoom]", ...m);
const fail = (m) => {
  console.error("[zoom] ERROR:", m);
  process.exit(1);
};

const IN = resolve(opt("in", join(ROOT, "output", "hypermole-scroll-1440p60.mp4")));
const ZOOMS = resolve(opt("zooms", join(ROOT, "zooms.json")));
const MODE = opt("mode", "anchor");
const ENCODER = opt("encoder", "auto");
const CQ = opt("cq", "16");
let OUT = resolve(opt("out", join(ROOT, "output", "hypermole-edited-zoom.mp4")));

if (!existsSync(IN)) fail(`input video not found: ${IN}`);
if (!existsSync(ZOOMS)) fail(`zoom list not found: ${ZOOMS}`);
if (!["anchor", "center"].includes(MODE)) fail(`--mode must be anchor or center`);

// never overwrite: pick the next free -vN name
if (existsSync(OUT) && !args.includes("--force")) {
  const ext = extname(OUT);
  const stem = join(dirname(OUT), basename(OUT, ext)).replace(/-v\d+$/, "");
  let n = 2;
  while (existsSync(`${stem}-v${n}${ext}`)) n++;
  log(`${basename(OUT)} already exists, writing ${basename(`${stem}-v${n}${ext}`)} instead`);
  OUT = `${stem}-v${n}${ext}`;
}
if (resolve(OUT) === IN) fail("output would overwrite the input");

// ---- read + validate events
const events = JSON.parse(readFileSync(ZOOMS, "utf8"));
if (!Array.isArray(events) || !events.length) fail("zooms.json must be a non-empty array");
const evs = events
  .map((e, i) => {
    const ev = { start: +e.start, zoomIn: +e.zoomIn, hold: +e.hold, zoomOut: +e.zoomOut, zoom: +e.zoom, x: +e.x, y: +e.y };
    for (const [k, v] of Object.entries(ev)) if (!Number.isFinite(v)) fail(`event ${i}: "${k}" is not a number`);
    if (ev.zoom < 1) fail(`event ${i}: zoom must be >= 1`);
    if (ev.x < 0 || ev.x > 1 || ev.y < 0 || ev.y > 1) fail(`event ${i}: x and y must be within 0..1`);
    ev.end = ev.start + ev.zoomIn + ev.hold + ev.zoomOut;
    return ev;
  })
  .sort((a, b) => a.start - b.start);
for (let i = 1; i < evs.length; i++) if (evs[i].start < evs[i - 1].end) fail(`events ${i - 1} and ${i} overlap`);

// ---- source metadata
const { ffmpeg, ffprobe, enc } = pickFfmpeg({ explicit: opt("ffmpeg", null), root: ROOT, encoder: ENCODER, log, fail });
const meta = Object.fromEntries(
  execFileSync(ffprobe, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate,nb_frames:format=duration", "-of", "default=nw=1", IN])
    .toString()
    .trim()
    .split(/\r?\n/)
    .map((l) => l.split("="))
);
const W = +meta.width;
const H = +meta.height;
const [fn, fd] = meta.r_frame_rate.split("/").map(Number);
const FPS = fn / fd;
const DUR = +meta.duration;
log(`source ${basename(IN)}: ${W}x${H} @ ${FPS} fps, ${DUR.toFixed(2)}s, ${meta.nb_frames} frames · encoder ${enc === "nvenc" ? "h264_nvenc (GPU)" : "libx264 (CPU)"}`);
for (const e of evs) if (e.end > DUR + 1e-6) fail(`event at ${e.start}s ends at ${e.end.toFixed(2)}s, after the video (${DUR.toFixed(2)}s)`);

// ---- per-frame zoom expression (FFmpeg expr language)
// f(t) in 0..1: smoothstep up during zoomIn, 1 during hold, smoothstep down during zoomOut, else 0
const S = (u) => `(${u})*(${u})*(3-2*(${u}))`;
const seg = (e) => {
  const a = e.start;
  const b = a + e.zoomIn;
  const c = b + e.hold;
  const d = c + e.zoomOut;
  const up = S(`(t-${a})/${e.zoomIn}`);
  const down = S(`1-(t-${c})/${e.zoomOut}`);
  return `if(between(t,${a},${b}),${up},if(between(t,${b},${c}),1,if(between(t,${c},${d}),${down},0)))`;
};
const zExpr = `1+(${evs.map((e) => `(${e.zoom - 1})*${seg(e)}`).join("+")})`; // magnification z(t)
const active = (e, v) => `if(between(t,${e.start},${e.end}),${v},0)`;
const fxExpr = evs.map((e) => active(e, e.x)).join("+"); // focus x fraction (only one event active at a time)
const fyExpr = evs.map((e) => active(e, e.y)).join("+");
// crop offset in the scaled picture. anchor: focus point stays put → off = p*W*(z-1)
// center: focus point goes to the middle → off = p*W*z - W/2, clamped to [0, W*(z-1)]
const off = (p, size) =>
  MODE === "anchor"
    ? `(${p})*${size}*(Z-1)`
    : `clip((${p})*${size}*Z-${size}/2,0,${size}*(Z-1))`;
const withZ = (expr) => expr.replaceAll("Z", `(${zExpr})`);
const graph =
  `[0:v]scale=w='round(${W}*(${zExpr}))':h='round(${H}*(${zExpr}))':eval=frame:flags=lanczos+accurate_rnd+full_chroma_int,` +
  `crop=${W}:${H}:x='${withZ(off(fxExpr, W))}':y='${withZ(off(fyExpr, H))}':exact=1,` +
  `setsar=1[v]`;
mkdirSync(dirname(OUT), { recursive: true });
const graphFile = join(tmpdir(), `hypermole-zoom-${process.pid}.txt`);
writeFileSync(graphFile, graph);

log(`events: ${evs.map((e) => `${e.start}s→${e.end.toFixed(1)}s ×${e.zoom} @(${e.x},${e.y})`).join(" · ")} · mode ${MODE}`);
log(`rendering ${basename(OUT)} …`);
const r = spawnSync(
  ffmpeg,
  ["-y", "-hide_banner", "-loglevel", "error", "-stats", "-i", IN, "-/filter_complex", graphFile, "-map", "[v]", ...encoderArgs(enc, { fps: FPS, cq: CQ }), OUT],
  { stdio: "inherit" }
);
rmSync(graphFile, { force: true });
if (r.status !== 0) fail(`ffmpeg exited ${r.status}`);

// ---- verify
const probe = execFileSync(ffprobe, ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries",
  "stream=codec_name,profile,width,height,r_frame_rate,avg_frame_rate,pix_fmt,nb_read_frames:format=duration,bit_rate", "-of", "default=nw=1", OUT]).toString().trim();
const decode = spawnSync(ffmpeg, ["-v", "error", "-i", OUT, "-f", "null", "-"], { encoding: "utf8" });
console.log(`\n${OUT}  (${(statSync(OUT).size / 1048576).toFixed(1)} MB)\n${probe}\nplayable (full decode, no errors): ${decode.status === 0 && !decode.stderr.trim() ? "yes" : "NO\n" + decode.stderr}`);
const stem = join(dirname(OUT), basename(OUT, extname(OUT)));
for (const [i, e] of evs.entries()) {
  const t = e.start + e.zoomIn + e.hold / 2; // middle of the hold, full magnification
  execFileSync(ffmpeg, ["-v", "error", "-y", "-ss", String(t), "-i", OUT, "-frames:v", "1", `${stem}-zoom${i + 1}.png`]);
}
log(`stills at full magnification written next to the video (${basename(stem)}-zoomN.png)`);
