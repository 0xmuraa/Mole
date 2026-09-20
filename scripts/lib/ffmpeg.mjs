// Shared FFmpeg discovery + encoder settings for the recording/editing scripts.
import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const isDir = (p) => {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
};

/** Every ffmpeg.exe that might exist on this machine (explicit > env > PATH > known install dirs). */
export function ffmpegCandidates(explicit, root) {
  const list = [explicit, process.env.FFMPEG_PATH, "ffmpeg"];
  const dirs = [
    join(process.env.LOCALAPPDATA || "", "Programs"),
    resolve(root, ".."),
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
    } catch {
      /* directory not readable */
    }
  }
  return [...new Set(list.filter(Boolean))];
}

const works = (bin) => spawnSync(bin, ["-version"], { encoding: "utf8" }).status === 0;
const nvencProbe = (bin) =>
  spawnSync(bin, ["-v", "error", "-f", "lavfi", "-i", "color=black:s=256x256:r=60", "-frames:v", "2", "-c:v", "h264_nvenc", "-f", "null", "-"], { encoding: "utf8" });

/**
 * Pick an FFmpeg binary and encoder. Several builds may be installed and the newest
 * gyan.dev builds need an NVENC driver API newer than some installed drivers, so
 * every candidate is tried and the first one whose NVENC actually encodes wins.
 * @param {{explicit?: string, root: string, encoder?: "auto"|"nvenc"|"x264", log?: Function, fail: Function}} o
 */
export function pickFfmpeg({ explicit, root, encoder = "auto", log = () => {}, fail }) {
  const found = ffmpegCandidates(explicit, root).filter(works);
  if (!found.length) {
    fail(
      "FFmpeg was not found. Install it with one of:\n" +
        "    winget install --id Gyan.FFmpeg -e\n" +
        "    choco install ffmpeg\n" +
        "  then reopen the terminal, or pass --ffmpeg C:\\path\\to\\ffmpeg.exe (or set FFMPEG_PATH)."
    );
  }
  if (encoder !== "x264") {
    let lastErr = "";
    for (const bin of found) {
      const r = nvencProbe(bin);
      if (r.status === 0) return { ffmpeg: bin, ffprobe: probeOf(bin), enc: "nvenc" };
      lastErr = (r.stderr || "").split("\n").find((l) => /driver|nvenc/i.test(l)) || lastErr;
    }
    if (encoder === "nvenc") fail(`h264_nvenc does not work with any FFmpeg found (${found.join(", ")}):\n  ${lastErr}`);
    log(`h264_nvenc unavailable (${lastErr || "no NVIDIA encoder"}), falling back to libx264`);
  }
  return { ffmpeg: found[0], ffprobe: probeOf(found[0]), enc: "x264" };
}

const probeOf = (ffmpeg) => ffmpeg.replace(/ffmpeg(\.exe)?$/i, (m) => m.replace(/ffmpeg/i, "ffprobe"));

/** H.264 output settings: yuv420p, faststart, no audio, GOP = 2 s. */
export function encoderArgs(kind, { fps = 60, cq = "16", crf = "16" } = {}) {
  const common = ["-pix_fmt", "yuv420p", "-profile:v", "high", "-g", String(fps * 2), "-r", String(fps), "-movflags", "+faststart", "-an"];
  if (kind === "nvenc") {
    // p7 = highest quality preset, constant quality with a generous bitrate ceiling → visually lossless
    return ["-c:v", "h264_nvenc", "-preset", "p7", "-tune", "hq", "-rc", "vbr", "-cq", cq, "-b:v", "40M", "-maxrate", "80M", "-bufsize", "160M",
      "-spatial-aq", "1", "-temporal-aq", "1", "-rc-lookahead", "32", "-bf", "3", "-b_ref_mode", "middle", ...common];
  }
  return ["-c:v", "libx264", "-preset", "medium", "-crf", crf, ...common];
}
