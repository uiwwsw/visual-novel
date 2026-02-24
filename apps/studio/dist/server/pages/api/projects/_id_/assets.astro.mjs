import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { e as executeAsync, A as ApiError, E as ErrorCode, r as requireRole, R as Role } from '../../../../chunks/permissions_BskKVdUi.mjs';
import { r as readActorContext } from '../../../../chunks/request-context_hfaLwzy9.mjs';
export { renderers } from '../../../../renderers.mjs';

const prerender = false;

const ASSET_ROOT = path.resolve(process.cwd(), ".runtime-assets");

function sanitizeSegment(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "asset";
}

function normalizeKind(value) {
  const raw = String(value || "").toLowerCase();
  if (raw === "background" || raw === "character" || raw === "music") {
    return raw;
  }
  return "misc";
}

function extensionFromName(name) {
  const ext = path.extname(String(name || "")).toLowerCase().replace(/[^a-z0-9.]/g, "");
  return ext || "";
}

function buildPublicAssetUrl(requestUrl, relativePath) {
  const base = new URL(requestUrl);
  const encodedPath = relativePath.split("/").map((part) => encodeURIComponent(part)).join("/");
  return `${base.origin}/api/assets/${encodedPath}`;
}

async function POST({ request, params }) {
  const result = await executeAsync(async () => {
    if (!params?.id) {
      throw new ApiError(400, ErrorCode.INVALID_REQUEST, "Project ID is required.");
    }

    const actor = await readActorContext(request);
    requireRole(actor.userRole, Role.EDITOR);

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new ApiError(400, ErrorCode.INVALID_REQUEST, "file is required.");
    }
    if (!file.size) {
      throw new ApiError(400, ErrorCode.INVALID_REQUEST, "Empty file is not allowed.");
    }

    const kind = normalizeKind(form.get("kind"));
    const isImageKind = kind === "background" || kind === "character";
    const isMusicKind = kind === "music";

    if (isImageKind && !String(file.type || "").startsWith("image/")) {
      throw new ApiError(400, ErrorCode.INVALID_REQUEST, "Image file is required for this asset type.");
    }
    if (isMusicKind && !String(file.type || "").startsWith("audio/")) {
      throw new ApiError(400, ErrorCode.INVALID_REQUEST, "Audio file is required for music.");
    }

    const maxBytes = isMusicKind ? 20 * 1024 * 1024 : 8 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new ApiError(413, ErrorCode.INVALID_REQUEST, `File is too large. Max ${Math.floor(maxBytes / (1024 * 1024))}MB.`);
    }

    const safeProjectId = sanitizeSegment(params.id);
    const safeKind = sanitizeSegment(kind);
    const ext = extensionFromName(file.name);
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const random = Math.random().toString(36).slice(2, 8);
    const baseName = sanitizeSegment(path.basename(file.name, ext));
    const finalName = `${timestamp}_${random}_${baseName}${ext}`;

    const dir = path.join(ASSET_ROOT, safeProjectId, safeKind);
    await mkdir(dir, { recursive: true });

    const writePath = path.join(dir, finalName);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(writePath, bytes);

    const relativePath = `${safeProjectId}/${safeKind}/${finalName}`;
    return {
      status: 201,
      body: {
        ok: true,
        url: buildPublicAssetUrl(request.url, relativePath),
        path: relativePath
      }
    };
  }, {});

  return Response.json(result.body, { status: result.status });
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
