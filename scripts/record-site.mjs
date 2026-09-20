#!/usr/bin/env node
/**
 * HYPERMOLE website scroll recording (for Recordly zoom/pan post-production).
 *
 *   npm run record                       # https://hypermole.dev/, 2560x1440, 60 fps, ~60 s
 *   npm run record -- --scroll 56        # lock the scroll phase to 56 s instead of a pixel-locked speed
 *   npm run record -- --step 1           # half speed (1 device px per frame)
 *   record-hypermole.bat                 # same thing, double-clickable
 *
 * Output: output/hypermole-scroll-1440p60.mp4 (H.264, yuv420p, faststart, no audio)
 *
 * How it works
 *  - Chromium runs headless with BeginFrameControl: the page is rendered on a
 *    NATIVE 2560x1440 surface (a 1920x1080 CSS desktop layout at deviceScaleFactor
 *    4/3 by default, so text is rendered sharper than on a 1080p monitor). There
 *    is no browser UI, no taskbar, no cursor: the frame IS the page.
 *  - Chromium's virtual time is paused and advanced by exactly 1/60 s per frame.
 *    Every animation (terminal, graphs, ticker) and the scroll driver run on that
 *    clock, so the result is a perfect 60 fps with no dropped or duplicated frames,
 *    regardless of how fast the machine renders.
 *  - The scroll is done INSIDE the page with requestAnimationFrame, interpolating
 *    scrollTop continuously from 0 to (scrollHeight - innerHeight) with an
 *    extremely subtle ease. No wheel events, no scrollBy steps, no jumps.
 *  - Frames are streamed as lossless PNG into FFmpeg, which encodes with
 *    h264_nvenc (GPU) when available, otherwise libx264.
 *
 * Why not screen capture: this machine's display is 1920x1080, so a 2560x1440
 * window can never be fully on screen. Rendering frame by frame is the only way
 * to get a genuine 2560x1440 @ 60 fps capture here, and it is also sharper.
 */
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : def;
};
const URL = opt("url", "https://hypermole.dev/");
const OUT_W = Number(opt("width", 2560));
const OUT_H = Number(opt("height", 1440));
const LAYOUT_W = Number(opt("layout", 1920)); // CSS viewport width (desktop layout)
const FPS = Number(opt("fps", 60));
const HOLD_TOP = Number(opt("hold-top", opt("hold", 2)));
const HOLD_BOTTOM = Number(opt("hold-bottom", opt("hold", 2)));
const SCROLL_S = Number(opt("scroll", 0)); // 0 = derive from --step (pixel-locked speed)
const STEP = Number(opt("step", 2)); // device pixels per frame when pixel-locked
const RAMP_S = Number(opt("ramp", 1.5)); // ease-in / ease-out length in seconds
const WARMUP_S = Number(opt("warmup", 4)); // animations run this long before the first recorded frame
const OUT = resolve(opt("out", join(ROOT, "output", "hypermole-scroll-1440p60.mp4")));
const ENCODER = opt("encoder", "auto"); // auto | nvenc | x264
const CQ = opt("cq", "16"); // nvenc constant quality (lower = better)
const CRF = opt("crf", "16"); // x264 fallback
const DEBUG = args.includes("--debug");

const log = (...m) => console.log("[record]", ...m);
const fail = (m) => {
  console.error("[record] ERROR:", m);
  process.exit(1);
};

// ---------------------------------------------------------------- ffmpeg
// Several FFmpeg builds may be installed; the newest gyan.dev builds need an
// NVENC driver API newer than some installed drivers, so every candidate is
// tried and the first one whose NVENC actually encodes wins.
function ffmpegCandidates() {
  const list = [opt("ffmpeg", null), process.env.FFMPEG_PATH, "ffmpeg"];
  const dirs = [
    join(process.env.LOCALAPPDATA || "", "Programs"),
    resolve(ROOT, ".."),
    "C:\\",
    "C:\\Program Files",
    "C:\\ProgramData\\chocolatey\\bin",
  ];
  for (const d of dirs) {
    try {
      for (const name of readdirSync(d)) {
        const base = join(d, name);
        if (!/ffmpeg/i.test(name) || !isDir(base)) continue;
        list.push(join(base, "ffmpeg.exe"), join(base, "bin", "ffmpeg.exe"));
        for (const sub of readdirSync(base)) if (isDir(join(base, sub))) list.push(join(base, sub, "bin", "ffmpeg.exe"));
      }
    } catch {}
  }
  return [...new Set(list.filter(Boolean))];
}
const isDir = (p) => {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
};
const works = (bin) => spawnSync(bin, ["-version"], { encoding: "utf8" }).status === 0;
const nvencWorks = (bin) =>
  spawnSync(bin, ["-v", "error", "-f", "lavfi", "-i", "color=black:s=256x256:r=60", "-frames:v", "2", "-c:v", "h264_nvenc", "-f", "null", "-"], { encoding: "utf8" });

function pickFfmpeg() {
  const found = ffmpegCandidates().filter(works);
  if (!found.length) {
    fail(
      "FFmpeg was not found. Install it with one of:\n" +
        "    winget install --id Gyan.FFmpeg -e\n" +
        "    choco install ffmpeg\n" +
        "  then reopen the terminal, or pass --ffmpeg C:\\path\\to\\ffmpeg.exe (or set FFMPEG_PATH)."
    );
  }
  if (ENCODER !== "x264") {
    let lastErr = "";
    for (const bin of found) {
      const r = nvencWorks(bin);
      if (r.status === 0) return { ffmpeg: bin, enc: "nvenc" };
      lastErr = (r.stderr || "").split("\n").find((l) => /driver|nvenc/i.test(l)) || lastErr;
    }
    if (ENCODER === "nvenc") fail(`h264_nvenc does not work with any FFmpeg found (${found.join(", ")}):\n  ${lastErr}`);
    log(`h264_nvenc unavailable (${lastErr || "no NVIDIA encoder"}), falling back to libx264`);
  }
  return { ffmpeg: found[0], enc: "x264" };
}

function encoderArgs(kind) {
  const common = ["-pix_fmt", "yuv420p", "-profile:v", "high", "-g", String(FPS * 2), "-r", String(FPS), "-movflags", "+faststart", "-an"];
  if (kind === "nvenc") {
    // p7 = highest quality preset, constant quality with a generous bitrate ceiling → visually lossless
    return ["-c:v", "h264_nvenc", "-preset", "p7", "-tune", "hq", "-rc", "vbr", "-cq", CQ, "-b:v", "40M", "-maxrate", "80M", "-bufsize", "160M",
      "-spatial-aq", "1", "-temporal-aq", "1", "-rc-lookahead", "32", "-bf", "3", "-b_ref_mode", "middle", ...common];
  }
  return ["-c:v", "libx264", "-preset", "medium", "-crf", CRF, ...common];
}

// ---------------------------------------------------------------- main
async function main() {
  const { ffmpeg, enc } = pickFfmpeg();
  const ffprobe = ffmpeg.replace(/ffmpeg(\.exe)?$/i, (m) => m.replace(/ffmpeg/i, "ffprobe"));
  log(`ffmpeg: ${ffmpeg} · encoder: ${enc === "nvenc" ? "h264_nvenc (GPU)" : "libx264 (CPU)"}`);

  const { chromium } = await import("playwright");
  mkdirSync(dirname(OUT), { recursive: true });

  const dsf = OUT_W / LAYOUT_W;
  const cssH = Math.round(OUT_H / dsf);
  const browser = await chromium.launch({
    logger: {
      isEnabled: (name) => name === "browser",
      log: (name, sev, msg) => {
        const s = String(msg).replace(/^\[pid=\d+\]\[(out|err)\] /, "").trim();
        if (s && (DEBUG || /crash|fatal|out of memory|check failed/i.test(s))) console.log("[chromium]", s.slice(0, 300));
      },
    },
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
      `--force-device-scale-factor=${dsf}`,
      `--window-size=${LAYOUT_W},${cssH}`,
    ],
  });
  const ctx = await browser.newContext({ viewport: null, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  page.on("pageerror", (e) => log("page error:", e.message));
  page.on("crash", () => {
    console.error("[record] ERROR: the renderer crashed");
    browser.close().catch(() => {}).finally(() => process.exit(1));
  });

  // frames are only produced on request: this is the single render primitive
  let frameTime = 0;
  const interval = 1000 / FPS;
  let virtual = null; // virtualTimeTicksBase once the clock is frozen
  const beginFrame = (screenshot) =>
    cdp.send("HeadlessExperimental.beginFrame", {
      frameTimeTicks: virtual === null ? undefined : virtual + frameTime,
      interval,
      noDisplayUpdates: false,
      screenshot: screenshot ? { format: "png", optimizeForSpeed: true } : undefined,
    });
  const realFrames = async (n) => {
    for (let i = 0; i < n; i++) await beginFrame(false);
  };

  // ---- 1. load
  log("opening", URL);
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.bringToFront();
  await cdp.send("Emulation.setFocusEmulationEnabled", { enabled: true });
  await page.evaluate(() => document.fonts.ready);
  log("fonts ready");
  // The site declares `scroll-behavior: smooth` on <html>. Under BeginFrameControl a
  // smooth scrollTo blocks the main thread waiting for a compositor frame, which
  // deadlocks automation, and it would also fight the rAF driver. Override it for
  // this recording session only (the site itself is untouched).
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
  });
  const vp = await page.evaluate(() => ({ dpr: devicePixelRatio, w: innerWidth, h: innerHeight }));
  log(`layout ${vp.w}x${vp.h} css · deviceScaleFactor ${vp.dpr.toFixed(4)} · surface ${Math.round(vp.w * vp.dpr)}x${Math.round(vp.h * vp.dpr)}`);

  // ---- 2. preload everything below the fold (lazy images, sections' observers)
  await page.evaluate(() => {
    for (const img of document.images) img.loading = "eager";
  });
  const maxScroll0 = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (let y = 0; y <= maxScroll0 + vp.h; y += Math.round(vp.h * 0.8)) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await realFrames(3);
    await page.waitForTimeout(150);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await realFrames(3);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete), null, { polling: 100, timeout: 30000 });
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => null))));
  await page.waitForLoadState("networkidle");
  log("all images loaded and decoded");

  // ---- 3. freeze the clock, let the animations run for a few seconds at the top
  await page.evaluate(() => window.scrollTo(0, 0));
  await realFrames(2);
  // NOTE: no page.evaluate between the pause and the first frame: with virtual time
  // paused, script evaluation only completes once a frame has been produced.
  const { virtualTimeTicksBase } = await cdp.send("Emulation.setVirtualTimePolicy", { policy: "pause" });
  virtual = virtualTimeTicksBase;
  const advance = () =>
    new Promise((resolve) => {
      cdp.once("Emulation.virtualTimeBudgetExpired", resolve);
      cdp.send("Emulation.setVirtualTimePolicy", { policy: "advance", budget: interval });
    });
  const frame = async (screenshot) => {
    await advance();
    frameTime += interval;
    return beginFrame(screenshot);
  };
  for (let i = 0; i < WARMUP_S * FPS; i++) await frame(false);
  const ready = await page.evaluate(() => ({ svgReady: !!document.querySelector("svg[data-ready]"), y: scrollY }));
  log(`warm-up done (${WARMUP_S}s of animation) · terminal ready: ${ready.svgReady} · scrollY: ${ready.y}`);

  // ---- 4. install the in-page scroll driver (requestAnimationFrame, continuous interpolation)
  // Chromium paints scroll offsets snapped to whole DEVICE pixels, so a speed like
  // 1.6 px/frame becomes a 2-2-1-2-2-1 pixel pattern (a faint 20 Hz judder). The
  // driver therefore moves at an exact integer number of device pixels per frame
  // (--step, default 2) with short smoothstep velocity ramps at both ends, and the
  // scroll duration follows from the page height. Pass --scroll <seconds> to lock the
  // duration instead (the speed then becomes fractional).
  const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  const distDev = Math.round(maxScroll * dsf);
  const rampFrames = Math.round(RAMP_S * FPS);
  let stepDev = STEP;
  let scrollFrames;
  if (SCROLL_S) {
    scrollFrames = Math.round(SCROLL_S * FPS);
    stepDev = distDev / (scrollFrames - rampFrames);
  } else {
    scrollFrames = Math.round(distDev / stepDev) + rampFrames;
  }
  // velocity profile in device px per frame; positions integrated then normalised so the last frame lands exactly on the bottom
  const smooth = (x) => x * x * (3 - 2 * x);
  const vel = (f) => (f < rampFrames ? stepDev * smooth(f / rampFrames) : f >= scrollFrames - rampFrames ? stepDev * smooth((scrollFrames - f) / rampFrames) : stepDev);
  const pos = new Array(scrollFrames + 1).fill(0);
  for (let f = 0; f < scrollFrames; f++) pos[f + 1] = pos[f] + vel(f);
  const k = distDev / pos[scrollFrames];
  const positionsCss = pos.map((v) => Math.round(v * k) / dsf);
  await page.evaluate(
    ({ holdFrames, positions, interval }) => {
      const t0 = performance.now();
      const last = positions.length - 1;
      const tick = (t) => {
        const f = Math.round((t - t0) / interval) - holdFrames; // frame index inside the scroll phase
        const i = Math.min(Math.max(f, 0), last);
        window.scrollTo(0, positions[i]);
        window.__rec = { i, y: positions[i], target: positions[last] };
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    { holdFrames: Math.round(HOLD_TOP * FPS), positions: positionsCss, interval }
  );
  const scrollS = scrollFrames / FPS;
  log(`scroll range 0 → ${maxScroll}px css (${distDev} device px) · ${stepDev.toFixed(3)} device px/frame${SCROLL_S ? " (time-locked)" : " (pixel-locked)"} · ${RAMP_S}s ramps · scroll ${scrollS.toFixed(1)}s · holds ${HOLD_TOP}s / ${HOLD_BOTTOM}s`);

  // ---- 5. record
  const total = Math.round(HOLD_TOP * FPS) + scrollFrames + Math.round(HOLD_BOTTOM * FPS);
  log(`total ${total} frames = ${(total / FPS).toFixed(1)}s`);
  const ffArgs = ["-y", "-hide_banner", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "pipe:0"];
  let ff = null;
  let ffDone = null;
  const write = (buf) => new Promise((r) => (ff.stdin.write(buf) ? r() : ff.stdin.once("drain", r)));
  const t0 = Date.now();
  let dup = 0;
  let dupFirst = -1;
  let dupLast = -1;
  let prev = null;
  for (let i = 0; i < total; i++) {
    const r = await frame(true);
    if (!r.screenshotData) fail(`no frame data at frame ${i}`);
    const buf = Buffer.from(r.screenshotData, "base64");
    if (i === 0) {
      const w = buf.readUInt32BE(16);
      const h = buf.readUInt32BE(20);
      log(`captured frame size: ${w}x${h}`);
      const vf = w === OUT_W && h === OUT_H ? [] : ["-vf", `scale=${OUT_W}:${OUT_H}:flags=lanczos`];
      if (vf.length) log(`note: surface is ${w}x${h}, scaling to ${OUT_W}x${OUT_H}`);
      ff = spawn(ffmpeg, [...ffArgs, ...vf, ...encoderArgs(enc), OUT], { stdio: ["pipe", "inherit", "inherit"] });
      ffDone = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))));
    }
    if (prev && prev.equals(buf)) {
      dup++;
      if (dupFirst < 0) dupFirst = i;
      dupLast = i;
    }
    prev = buf;
    await write(buf);
    if (i && i % (FPS * 5) === 0) {
      const done = i / total;
      const rate = i / ((Date.now() - t0) / 1000);
      log(`${Math.round(done * 100)}% · ${rate.toFixed(1)} frames/s · eta ${Math.round((total - i) / rate)}s`);
    }
  }
  const end = await page.evaluate(() => ({ ...window.__rec, scrollY, max: document.documentElement.scrollHeight - innerHeight }));
  ff.stdin.end();
  await ffDone;
  await browser.close();

  log(`frames: ${total} · dropped: 0 · identical consecutive frames: ${dup}${dup ? ` (frames ${dupFirst}-${dupLast}, ${(dupFirst / FPS).toFixed(1)}s-${(dupLast / FPS).toFixed(1)}s; expected only while the page is static during a hold)` : ""}`);
  log(`final scroll ${Math.round(end.scrollY)}px of ${end.max}px (frame ${end.i} of ${scrollFrames})`);
  if (Math.abs(end.scrollY - end.max) > 1) log("WARNING: did not reach the exact bottom");

  // ---- 6. verify
  const probe = execFileSync(ffprobe, ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries",
    "stream=codec_name,profile,width,height,r_frame_rate,avg_frame_rate,pix_fmt,nb_read_frames:format=duration,bit_rate", "-of", "default=nw=1", OUT]).toString().trim();
  const decode = spawnSync(ffmpeg, ["-v", "error", "-i", OUT, "-f", "null", "-"], { encoding: "utf8" });
  console.log(`\n${OUT}  (${(statSync(OUT).size / 1048576).toFixed(1)} MB)\n${probe}\nplayable (full decode, no errors): ${decode.status === 0 && !decode.stderr.trim() ? "yes" : "NO\n" + decode.stderr}`);
  const stills = dirname(OUT);
  for (const [name, t] of [["start", HOLD_TOP / 2], ["middle", HOLD_TOP + scrollS / 2], ["end", HOLD_TOP + scrollS + HOLD_BOTTOM / 2]]) {
    execFileSync(ffmpeg, ["-v", "error", "-y", "-ss", String(t), "-i", OUT, "-frames:v", "1", join(stills, `preview-${name}.png`)]);
  }
  log(`preview stills written to ${stills}`);
}

main().catch((e) => fail(e.stack || e.message));
