#!/usr/bin/env node
/**
 * HYPERMOLE terminal — master recording pipeline.
 *
 *   npm run record:terminal            # 90 s, 2x supersampled, 60 fps
 *   npm run record:terminal -- --seconds 30 --scale 1.5
 *
 * How it works (no OBS, no screen capture):
 *  1. Ensures a production server is running (builds + starts `next start` if needed).
 *  2. Launches Chromium headless with BeginFrameControl and a 1920x1200 CSS
 *     viewport at deviceScaleFactor 2 → the page renders at 3840x2400 with the
 *     exact desktop composition.
 *  3. Pauses Chromium's virtual time, then for every output frame advances
 *     virtual time by exactly 1/60 s and asks the compositor for one frame with
 *     a lossless PNG screenshot. Rendering speed is irrelevant: every frame is
 *     produced, none are dropped, and animation timing is exact.
 *  4. Pipes the PNG frames into ONE FFmpeg process that encodes the master
 *     (full supersampled size) and the share version (Lanczos-downscaled to
 *     1920x1200) from the same lossless source. Nothing is transcoded twice.
 *  5. Validates both files with ffprobe and extracts inspection frames.
 */
import { spawn, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const SECONDS = Number(opt("seconds", 90));
const FPS = 60;
const SCALE = Number(opt("scale", 2)); // deviceScaleFactor (supersampling)
const PORT = Number(opt("port", 3100));
const OUT_DIR = resolve(opt("out", join(ROOT, "recordings")));
const URL = `http://localhost:${PORT}/terminal?recording=1`;
const W = 1920;
const H = 1200;
const MASTER_CRF = opt("master-crf", "13");
const SHARE_CRF = opt("share-crf", "17");
const PRESET = opt("preset", "slow");

const log = (...m) => console.log("[record]", ...m);

async function ensureServer() {
  const ok = async () => {
    try {
      const r = await fetch(URL, { signal: AbortSignal.timeout(4000) });
      return r.ok;
    } catch {
      return false;
    }
  };
  if (await ok()) {
    log(`server already running on :${PORT}`);
    return null;
  }
  if (!existsSync(join(ROOT, ".next", "BUILD_ID"))) {
    log("no production build found — running next build");
    execFileSync("npx", ["next", "build"], { cwd: ROOT, stdio: "inherit", shell: true });
  }
  log(`starting next start -p ${PORT}`);
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], { cwd: ROOT, shell: true, stdio: "ignore" });
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await ok()) return server;
  }
  throw new Error("production server did not come up");
}

async function main() {
  const { chromium } = await import("playwright");
  mkdirSync(OUT_DIR, { recursive: true });
  const master = join(OUT_DIR, "hypermole-terminal-master.mp4");
  const share = join(OUT_DIR, "hypermole-terminal-share.mp4");
  const server = await ensureServer();

  const browser = await chromium.launch({
    args: [
      "--enable-begin-frame-control",
      "--run-all-compositor-stages-before-draw",
      "--disable-new-content-rendering-timeout",
      "--disable-threaded-animation",
      "--disable-threaded-scrolling",
      "--disable-checker-imaging",
      "--disable-image-animation-resync",
      "--hide-scrollbars",
      "--font-render-hinting=none",
      // A NATIVE supersampled compositor surface. Emulating deviceScaleFactor via
      // Playwright's context option is ignored by beginFrame screenshots (they
      // come back at 1x), so the scale is forced at the browser level instead.
      `--force-device-scale-factor=${SCALE}`,
      `--window-size=${W},${H}`,
    ],
  });
  const ctx = await browser.newContext({ viewport: null });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);

  // ---- deterministic startup: nothing is captured while assets are still loading
  log("loading", URL);
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  log("fonts ready");
  // decode every image that is actually on screen (lazy offscreen ones are irrelevant)
  await page.evaluate(() =>
    Promise.all(
      [...document.images]
        .filter((i) => i.getBoundingClientRect().width > 0)
        .map((i) => Promise.race([i.decode().catch(() => null), new Promise((r) => setTimeout(r, 5000))]))
    )
  );
  log("images decoded");
  const vp = await page.evaluate(() => ({ dpr: devicePixelRatio, w: innerWidth, h: innerHeight }));
  if (vp.w !== W || vp.h !== H || vp.dpr !== SCALE) throw new Error(`unexpected viewport ${JSON.stringify(vp)}`);
  log(`logical viewport ${vp.w}x${vp.h} css · deviceScaleFactor ${vp.dpr} · render surface ${W * vp.dpr}x${H * vp.dpr}`);

  // ---- freeze the clock; every frame advances exactly 1/FPS
  const { virtualTimeTicksBase } = await cdp.send("Emulation.setVirtualTimePolicy", { policy: "pause" });
  const interval = 1000 / FPS;
  const advance = () =>
    new Promise((resolve) => {
      cdp.once("Emulation.virtualTimeBudgetExpired", resolve);
      cdp.send("Emulation.setVirtualTimePolicy", { policy: "advance", budget: interval });
    });
  let elapsed = 0;
  const frame = async (screenshot) => {
    await advance();
    elapsed += interval;
    return cdp.send("HeadlessExperimental.beginFrame", {
      frameTimeTicks: virtualTimeTicksBase + elapsed,
      interval,
      noDisplayUpdates: false,
      // lossless PNG; optimizeForSpeed = zlib level 1 (~3x faster, identical pixels)
      screenshot: screenshot ? { format: "png", optimizeForSpeed: true } : undefined,
    });
  };
  // Under BeginFrameControl nothing renders (no requestAnimationFrame) until
  // frames are issued, so readiness is checked while stepping. Warm-up: let
  // the simulation's first second play (initial packets, first log rows).
  let ready = false;
  for (let i = 0; i < FPS * 5 && !ready; i++) {
    await frame(false);
    if (i >= FPS) ready = await page.evaluate(() => !!document.querySelector("svg[data-ready]"));
  }
  if (!ready) throw new Error("network stage never reported data-ready");
  log(`stage ready after ${(elapsed / 1000).toFixed(2)}s of virtual time`);

  // ---- one encoder, two outputs, from the same lossless frames
  const rw = W * SCALE;
  const rh = H * SCALE;
  const ffArgs = [
    "-hide_banner", "-loglevel", "error", "-stats",
    "-f", "image2pipe", "-framerate", String(FPS), "-i", "pipe:0",
    "-filter_complex", `[0:v]split=2[m][s];[s]scale=${W}:${H}:flags=lanczos+accurate_rnd+full_chroma_int[sh]`,
    "-map", "[m]", "-c:v", "libx264", "-preset", PRESET, "-crf", MASTER_CRF, "-profile:v", "high", "-pix_fmt", "yuv420p",
    "-g", String(FPS * 2), "-keyint_min", String(FPS), "-r", String(FPS), "-movflags", "+faststart", "-an", master,
    "-map", "[sh]", "-c:v", "libx264", "-preset", PRESET, "-crf", SHARE_CRF, "-profile:v", "high", "-pix_fmt", "yuv420p",
    "-g", String(FPS * 2), "-keyint_min", String(FPS), "-r", String(FPS), "-movflags", "+faststart", "-an", share,
  ];
  const ff = spawn("ffmpeg", ["-y", ...ffArgs], { stdio: ["pipe", "inherit", "inherit"] });
  const ffDone = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))));
  const write = (buf) => new Promise((r) => (ff.stdin.write(buf) ? r() : ff.stdin.once("drain", r)));

  const total = SECONDS * FPS;
  log(`capturing ${total} frames at ${rw}x${rh} @ ${FPS} fps (${SECONDS}s)`);
  const t0 = Date.now();
  let missing = 0;
  let last = null;
  for (let i = 0; i < total; i++) {
    const r = await frame(true);
    if (r.screenshotData) {
      last = Buffer.from(r.screenshotData, "base64");
      if (i === 0) {
        const pw = last.readUInt32BE(16);
        const ph = last.readUInt32BE(20);
        if (pw !== rw || ph !== rh) throw new Error(`captured frame is ${pw}x${ph}, expected ${rw}x${rh}`);
        log(`captured frame size verified: ${pw}x${ph}`);
      }
    } else {
      // compositor reported no damage: repeat the previous frame (no gap in time)
      missing++;
    }
    await write(last);
    if (i % (FPS * 5) === 0 && i) {
      const done = i / total;
      const eta = ((Date.now() - t0) / done) * (1 - done) / 1000;
      log(`${Math.round(done * 100)}% · ${(i / ((Date.now() - t0) / 1000)).toFixed(1)} fps capture · eta ${Math.round(eta)}s`);
    }
  }
  ff.stdin.end();
  await ffDone;
  await browser.close();
  server?.kill();

  log(`frames: ${total}, frames with no compositor damage (repeated): ${missing}, dropped: 0`);
  const probe = (f) =>
    execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries",
      "stream=codec_name,width,height,r_frame_rate,avg_frame_rate,pix_fmt,profile,nb_frames:format=duration,bit_rate", "-of", "default=nw=1", f]).toString().trim();
  for (const f of [master, share]) {
    console.log(`\n${f}  (${(statSync(f).size / 1048576).toFixed(1)} MB)\n${probe(f)}`);
  }
  for (const t of ["00:00:10", "00:00:45", "00:01:20"]) {
    const png = join(OUT_DIR, `inspect-share-${t.replace(/:/g, "")}.png`);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", t, "-i", share, "-frames:v", "1", png]);
  }
  log("inspection frames written to", OUT_DIR);
}

main().catch((e) => {
  console.error("[record] FAILED:", e);
  process.exit(1);
});
