import { A as ApiError, E as ErrorCode } from './permissions_BskKVdUi.mjs';

const __vite_import_meta_env__ = {"ASSETS_PREFIX": undefined, "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SITE": undefined, "SSR": true};
function runtimeEnv() {
  return import.meta && Object.assign(__vite_import_meta_env__, { _: process.env._ }) ? Object.assign(__vite_import_meta_env__, { _: process.env._ }) : process.env;
}
function canUseSupabase() {
  const env = runtimeEnv();
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}
function requireEnv(name) {
  const value = runtimeEnv()[name];
  if (!value) {
    throw new ApiError(500, ErrorCode.CONFIG_MISSING, `Missing environment variable: ${name}`);
  }
  return value;
}
function readBearerToken(request) {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!authHeader) {
    return null;
  }
  const [scheme, token] = authHeader.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }
  return token;
}
async function fetchSupabaseJson(path, { token, select } = {}) {
  const url = new URL(path, requireEnv("SUPABASE_URL"));
  if (select) {
    url.searchParams.set("select", select);
  }
  const headers = {
    apikey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    Authorization: `Bearer ${token ?? requireEnv("SUPABASE_SERVICE_ROLE_KEY")}`
  };
  const response = await fetch(url, { headers });
  if (!response.ok) {
    if (path.startsWith("/auth/v1/user") && response.status === 401) {
      throw new ApiError(401, ErrorCode.AUTH_REQUIRED, "Authentication required.");
    }
    throw new ApiError(500, ErrorCode.INTEGRATION_FAILED, "Actor context lookup failed.", {
      path,
      status: response.status
    });
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
async function readSupabaseActorContext(request, token) {
  const organizationId = request.headers.get("x-org-id") ?? null;
  if (!organizationId) {
    throw new ApiError(400, ErrorCode.INVALID_REQUEST, "x-org-id header is required.");
  }
  const user = await fetchSupabaseJson("/auth/v1/user", { token });
  const userId = user?.id ?? null;
  if (!userId) {
    throw new ApiError(401, ErrorCode.AUTH_REQUIRED, "Authentication required.");
  }
  const membershipRows = await fetchSupabaseJson(
    `/rest/v1/memberships?organization_id=eq.${encodeURIComponent(organizationId)}&user_id=eq.${encodeURIComponent(userId)}&status=eq.active&deleted_at=is.null&limit=1`,
    { select: "role" }
  );
  const membership = membershipRows?.[0] ?? null;
  if (!membership?.role) {
    throw new ApiError(403, ErrorCode.FORBIDDEN_ROLE, "User is not an active organization member.", {
      organizationId,
      userId
    });
  }
  const organizationRows = await fetchSupabaseJson(
    `/rest/v1/organizations?id=eq.${encodeURIComponent(organizationId)}&deleted_at=is.null&limit=1`,
    { select: "plan_tier" }
  );
  const organization = organizationRows?.[0] ?? null;
  return {
    userRole: membership.role,
    planTier: organization?.plan_tier ?? "free",
    userId,
    organizationId
  };
}
async function readActorContext(request) {
  const token = readBearerToken(request);
  const env = runtimeEnv();
  const strictActorAuth = env.STRICT_ACTOR_AUTH === "true";
  if (canUseSupabase() && token) {
    return readSupabaseActorContext(request, token);
  }
  if (canUseSupabase() && strictActorAuth) {
    throw new ApiError(401, ErrorCode.AUTH_REQUIRED, "Bearer token is required.");
  }
  return {
    userRole: request.headers.get("x-user-role") ?? "viewer",
    planTier: request.headers.get("x-plan-tier") ?? "free",
    userId: request.headers.get("x-user-id") ?? null,
    organizationId: request.headers.get("x-org-id") ?? null
  };
}
async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export { readJson as a, readActorContext as r };
