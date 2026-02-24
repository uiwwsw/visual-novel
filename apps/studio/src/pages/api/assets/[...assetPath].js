import { readFile } from "node:fs/promises";
import path from "node:path";

export const prerender = false;

const ASSET_ROOT = path.resolve(process.cwd(), ".runtime-assets");

const MIME_BY_EXT = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4"
};

function contentTypeFor(filepath) {
  const ext = path.extname(filepath).toLowerCase();
  return MIME_BY_EXT[ext] || "application/octet-stream";
}

function resolveSafeAssetPath(rawPath) {
  const normalized = String(rawPath || "").replace(/\\/g, "/");
  const resolved = path.resolve(ASSET_ROOT, normalized);
  if (!resolved.startsWith(`${ASSET_ROOT}${path.sep}`)) {
    return null;
  }
  return resolved;
}

export async function GET({ params }) {
  const requested = params?.assetPath || "";
  const safePath = resolveSafeAssetPath(requested);
  if (!safePath) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const bytes = await readFile(safePath);
    return new Response(bytes, {
      status: 200,
      headers: {
        "content-type": contentTypeFor(safePath),
        "cache-control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
